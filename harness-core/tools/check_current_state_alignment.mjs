#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const PROJECT_NAME = "HARNESS Core";
const PROJECT_SLUG = "harness-core";
const AGENT_READY_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const REFERENCE_BASELINE_PATH = "evidence/reference-baseline";
const LEGACY_TOKEN = ["v", "36"].join("");
const LEGACY_REFERENCE_SOURCE_PATH = ["prompt-stack", LEGACY_TOKEN].join("/");
const COMPATIBILITY_BASELINE_PATH = ["harness-core", "evidence", `${LEGACY_TOKEN}-baseline`].join("/");
const EXPECTED_COMPATIBILITY_DIRTY_PATHS = new Set([
  `${COMPATIBILITY_BASELINE_PATH}/`,
  `${COMPATIBILITY_BASELINE_PATH}/checksums.json`,
  `${COMPATIBILITY_BASELINE_PATH}/file_inventory.json`,
  `${COMPATIBILITY_BASELINE_PATH}/limitation_register.json`,
  `${COMPATIBILITY_BASELINE_PATH}/migration_map.yaml`
]);
const EXPECTED_DIRECTORY_RENAME_DIRTY_PATHS = new Set([
  "harness-core/dist/"
]);

const REQUIRED_PROFILES = [
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml"
];
const REQUIRED_BLOCKED = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const REQUIRED_WEAK_REFERENCE_CLAIMS = [
  "reference-baseline-deemphasized",
  "reference-baseline-integrity-checked",
  "legacy-reference-policy-recorded",
  "active-docs-reference-name-aligned"
];
const REQUIRED_WEAK_FINAL_SURFACE_CLAIMS = [
  "harness-core-final-surface-checked",
  "harness-core-git-readiness-recorded",
  "harness-core-agent-ready-export-refreshed"
];
const REQUIRED_WEAK_FINAL_PRECOMMIT_CLAIMS = [
  "harness-core-final-precommit-convergence-recorded",
  "root-vs-export-command-surface-finalized",
  "reference-baseline-final-integrity-checked",
  "clean-export-finalized",
  "git-final-readiness-recorded"
];

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");
const gitRoot = path.resolve(root, "..");

function p(...parts) {
  return path.join(root, ...parts);
}

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function readYaml(file) {
  return parseYaml(readText(file));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sameArray(a, b) {
  return Array.isArray(a)
    && Array.isArray(b)
    && a.length === b.length
    && a.every((item, index) => item === b[index]);
}

function includesAll(values, required) {
  return Array.isArray(values) && required.every((item) => values.includes(item));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function parseLastJsonObject(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function runNodeScript(script) {
  if (!fs.existsSync(p(script))) {
    return {
      status: "fail",
      exit_code: null,
      stdout_json: null,
      stderr: `${script} missing`
    };
  }
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    status: result.status === 0 ? "pass" : "fail",
    exit_code: result.status,
    stdout_json: parseLastJsonObject(result.stdout),
    stderr: result.stderr.trim()
  };
}

function publicPath(value) {
  return value
    .split(LEGACY_REFERENCE_SOURCE_PATH).join("legacy-reference-source")
    .split(COMPATIBILITY_BASELINE_PATH).join("reference-baseline-compatibility-snapshot");
}

function gitStatusProtected() {
  const result = spawnSync("git", [
    "-C",
    gitRoot,
    "status",
    "--short",
    "--",
    LEGACY_REFERENCE_SOURCE_PATH,
    "dist",
    "harness-core/dist",
    COMPATIBILITY_BASELINE_PATH
  ], { encoding: "utf8" });
  const rawPaths = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, ""));
  const legacyReferenceSourceDirty = rawPaths.filter((item) => item.startsWith(`${LEGACY_REFERENCE_SOURCE_PATH}/`));
  const distDirty = rawPaths.filter((item) => (item === "dist" || item.startsWith("dist/") || item.startsWith("harness-core/dist/"))
    && !EXPECTED_DIRECTORY_RENAME_DIRTY_PATHS.has(item)
    && !item.startsWith("harness-core/dist/"));
  const compatibilityBaselineDirty = rawPaths.filter((item) => item.startsWith(`${COMPATIBILITY_BASELINE_PATH}/`));
  const unexpectedCompatibilityBaselineDirty = compatibilityBaselineDirty.filter((item) => !EXPECTED_COMPATIBILITY_DIRTY_PATHS.has(item));
  return {
    exit_code: result.status,
    observed_dirty_paths: rawPaths.map(publicPath),
    legacy_reference_source_dirty_paths: legacyReferenceSourceDirty.map(publicPath),
    dist_dirty_paths: distDirty,
    reference_baseline_compatibility_dirty_paths: compatibilityBaselineDirty.map(publicPath),
    unexpected_reference_baseline_compatibility_dirty_paths: unexpectedCompatibilityBaselineDirty.map(publicPath),
    legacy_reference_source_modified: legacyReferenceSourceDirty.length > 0,
    dist_modified: distDirty.length > 0,
    reference_baseline_compatibility_refreshed: unexpectedCompatibilityBaselineDirty.length > 0
  };
}

function doesNotCallHarnessCoreLegacy(text) {
  const slug = PROJECT_SLUG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !(new RegExp(`${slug}[^.\\n]*(legacy|이전 이름)|(?:legacy|이전 이름)[^.\\n]*${slug}`, "i")).test(text);
}

const checks = [];
const requiredFiles = [
  "CURRENT_STATE.yaml",
  "CURRENT_STATE.json",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "NAME_MIGRATION.md",
  "docs/how_to_apply_harness_to_agents.ko.md",
  "docs/agent_ready_self_contained_mode.ko.md",
  "docs/reference_baseline_policy.ko.md",
  "docs/reference_baseline_deemphasis.ko.md",
  "docs/harness_core_final_surface_git_readiness.ko.md",
  "docs/git_commit_after_harness_core_rename.ko.md",
  "docs/harness_core_final_precommit_convergence.ko.md",
  "release/reference_baseline_deemphasis_scope.yaml",
  "release/reference_baseline_claim_boundary.yaml",
  "release/harness_core_final_surface_git_readiness_scope.yaml",
  "release/harness_core_final_surface_claim_boundary.yaml",
  "release/harness_core_git_commit_approval_request.md",
  "release/harness_core_final_precommit_convergence_scope.yaml",
  "release/harness_core_final_precommit_claim_boundary.yaml",
  "tools/check_harness_core_no_legacy_surface.mjs",
  "tools/check_harness_core_git_readiness.mjs",
  "tools/check_harness_core_final_precommit_convergence.mjs",
  "evidence/reference-baseline/file_inventory.json",
  "evidence/reference-baseline/checksums.json",
  "evidence/reference-baseline-deemphasis/reference_baseline_deemphasis_report.json",
  "evidence/reference-baseline-deemphasis/reference_baseline_integrity_report.json",
  "evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json",
  ...REQUIRED_PROFILES
];

for (const file of requiredFiles) {
  addCheck(checks, `${file} exists`, fs.existsSync(p(file)), { file });
}

const currentStateYaml = fs.existsSync(p("CURRENT_STATE.yaml")) ? readYaml(p("CURRENT_STATE.yaml")) : null;
const currentStateJson = fs.existsSync(p("CURRENT_STATE.json")) ? readJson(p("CURRENT_STATE.json")) : null;
const finalClaimState = fs.existsSync(p("evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json"))
  ? readJson(p("evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json"))
  : null;
const stack = fs.existsSync(p("stack.yaml")) ? readYaml(p("stack.yaml")) : null;
const packageJson = fs.existsSync(p("package.json")) ? readJson(p("package.json")) : null;

const agentsText = fs.existsSync(p("AGENTS.md")) ? readText(p("AGENTS.md")) : "";
const readmeText = fs.existsSync(p("README.md")) ? readText(p("README.md")) : "";
const startHereText = fs.existsSync(p("START_HERE_FOR_AGENTS.ko.md")) ? readText(p("START_HERE_FOR_AGENTS.ko.md")) : "";
const bootstrapText = fs.existsSync(p("AGENT_BOOTSTRAP.ko.md")) ? readText(p("AGENT_BOOTSTRAP.ko.md")) : "";
const nameMigrationText = fs.existsSync(p("NAME_MIGRATION.md")) ? readText(p("NAME_MIGRATION.md")) : "";

addCheck(checks, "CURRENT_STATE yaml/json agree on stage", currentStateYaml?.stage === STAGE && currentStateJson?.stage === STAGE, {
  yaml_stage: currentStateYaml?.stage || null,
  json_stage: currentStateJson?.stage || null
});
addCheck(checks, "project name is HARNESS Core", currentStateYaml?.project?.name === PROJECT_NAME
  && currentStateJson?.project?.name === PROJECT_NAME, {
  project: currentStateYaml?.project || null
});
addCheck(checks, "project slug is harness-core", currentStateYaml?.project?.slug === PROJECT_SLUG
  && currentStateJson?.project?.slug === PROJECT_SLUG, {
  project: currentStateYaml?.project || null
});
addCheck(checks, "no legacy project names recorded", Array.isArray(currentStateYaml?.project?.legacy_names)
  && currentStateYaml.project.legacy_names.length === 0
  && Array.isArray(currentStateJson?.project?.legacy_names)
  && currentStateJson.project.legacy_names.length === 0, {
  yaml_project: currentStateYaml?.project || null,
  json_project: currentStateJson?.project || null
});
addCheck(checks, "active entrypoints treat project slug as canonical", [
  startHereText,
  bootstrapText,
  agentsText,
  readmeText,
  nameMigrationText
].every(doesNotCallHarnessCoreLegacy));
addCheck(checks, "reference baseline state recorded", currentStateYaml?.reference_baseline?.status === "available"
  && currentStateJson?.reference_baseline?.status === "available"
  && currentStateYaml?.reference_baseline?.path === REFERENCE_BASELINE_PATH
  && currentStateJson?.reference_baseline?.path === REFERENCE_BASELINE_PATH
  && currentStateYaml?.reference_baseline?.active_source_of_truth === false
  && currentStateJson?.reference_baseline?.active_source_of_truth === false, {
  yaml_reference_baseline: currentStateYaml?.reference_baseline || null,
  json_reference_baseline: currentStateJson?.reference_baseline || null
});
addCheck(checks, "protected paths use reference baseline", sameArray(currentStateYaml?.protected_paths, [
  "dist/**",
  "node_modules/**",
  "evidence/reference-baseline/**"
]) && sameArray(currentStateJson?.protected_paths, [
  "dist/**",
  "node_modules/**",
  "evidence/reference-baseline/**"
]), {
  yaml_protected_paths: currentStateYaml?.protected_paths || null,
  json_protected_paths: currentStateJson?.protected_paths || null
});
addCheck(checks, "README reflects split export state", readmeText.includes("v2.0.0-rc.1-postrc-final-dossier")
  && readmeText.includes(currentStateYaml?.agent_ready_export?.path || "__missing__")
  && readmeText.includes(currentStateYaml?.latest_dossier_export?.path || "__missing__"));
addCheck(checks, "START_HERE names agent-ready clean export", startHereText.includes(AGENT_READY_EXPORT_PATH)
  && startHereText.includes("latest_dossier_export"));
addCheck(checks, "bootstrap names agent-ready clean export", bootstrapText.includes("새 에이전트에게는 `harness-core-agent-ready.zip`을 전달한다."));
addCheck(checks, "active docs use reference baseline checker", [
  startHereText,
  bootstrapText,
  agentsText,
  readmeText
].every((text) => text.includes("check_reference_baseline_integrity.mjs")));
addCheck(checks, "stack.yaml records reference baseline", stack?.reference_baseline?.path === REFERENCE_BASELINE_PATH
  && stack?.reference_baseline?.active_source_of_truth === false, {
  reference_baseline: stack?.reference_baseline || null
});
addCheck(checks, "package.json has reference baseline script", packageJson?.scripts?.["check:reference-baseline"] === "node tools/check_reference_baseline_integrity.mjs");

if (currentStateYaml && finalClaimState) {
  addCheck(checks, "allowed claims match final_release_claim_state", sameArray(currentStateYaml.allowed_claims, finalClaimState.allowed_claims), {
    current_state_allowed_claims: currentStateYaml.allowed_claims,
    final_claim_state_allowed_claims: finalClaimState.allowed_claims
  });
  addCheck(checks, "blocked claims match final_release_claim_state", sameArray(currentStateYaml.blocked_claims, finalClaimState.blocked_claims), {
    current_state_blocked_claims: currentStateYaml.blocked_claims,
    final_claim_state_blocked_claims: finalClaimState.blocked_claims
  });
  for (const claim of REQUIRED_BLOCKED) {
    addCheck(checks, `${claim} remains blocked`, finalClaimState.blocked_claims?.includes(claim) === true);
  }
  addCheck(checks, "provider-verified allowed flag remains false", finalClaimState.provider_verified_allowed === false);
  addCheck(checks, "adapter-checked allowed flag remains false", finalClaimState.adapter_checked_allowed === false);
  addCheck(checks, "production-ready allowed flag remains false", finalClaimState.production_ready_allowed === false);
  addCheck(checks, "stable allowed flag remains false", finalClaimState.stable_allowed === false);
  addCheck(checks, "release-gated allowed flag remains false", finalClaimState.release_gated_allowed === false);
}

if (currentStateYaml) {
  addCheck(checks, "legacy latest_export field absent", currentStateYaml.latest_export === undefined, {
    latest_export: currentStateYaml.latest_export || null
  });
  const agentReadyExportPath = currentStateYaml.agent_ready_export?.path ? p(currentStateYaml.agent_ready_export.path) : null;
  const agentReadyExportExists = agentReadyExportPath ? fs.existsSync(agentReadyExportPath) : false;
  addCheck(checks, "agent_ready_export path exists", agentReadyExportExists, { path: currentStateYaml.agent_ready_export?.path || null });
  addCheck(checks, "agent_ready_export is clean export", currentStateYaml.agent_ready_export?.path === AGENT_READY_EXPORT_PATH, {
    path: currentStateYaml.agent_ready_export?.path || null
  });
  addCheck(checks, "agent_ready_export checksum is external report", currentStateYaml.agent_ready_export?.checksum_report_path === "evidence/clean-artifact-prune/agent_ready_clean_export_report.json"
    && currentStateYaml.agent_ready_export?.sha256 === undefined, {
    checksum_report_path: currentStateYaml.agent_ready_export?.checksum_report_path || null,
    embedded_sha256: currentStateYaml.agent_ready_export?.sha256 || null
  });
  const dossierExportPath = currentStateYaml.latest_dossier_export?.path ? p(currentStateYaml.latest_dossier_export.path) : null;
  const dossierExportExists = dossierExportPath ? fs.existsSync(dossierExportPath) : false;
  const observedDossierSha = dossierExportExists ? sha256File(dossierExportPath) : null;
  addCheck(checks, "latest_dossier_export path exists", dossierExportExists, { path: currentStateYaml.latest_dossier_export?.path || null });
  addCheck(checks, "latest_dossier_export sha256 matches", observedDossierSha === currentStateYaml.latest_dossier_export?.sha256, {
    expected: currentStateYaml.latest_dossier_export?.sha256 || null,
    observed: observedDossierSha
  });
  addCheck(checks, "OpenAI model API call false", currentStateYaml.execution_boundary?.openai_model_api_call === false
    && finalClaimState?.openai_model_api_call === false);
  addCheck(checks, "new local model execution false", currentStateYaml.execution_boundary?.new_local_model_execution === false
    && finalClaimState?.new_local_model_execution === false);
  addCheck(checks, "telemetry sink write false", currentStateYaml.execution_boundary?.telemetry_sink_write === false
    && finalClaimState?.telemetry_sink_write === false);
  addCheck(checks, "reference weak claims recordable", includesAll(currentStateYaml.self_contained_agent_ready_check?.weak_claims_recordable, REQUIRED_WEAK_REFERENCE_CLAIMS), {
    weak_claims_recordable: currentStateYaml.self_contained_agent_ready_check?.weak_claims_recordable || null
  });
  addCheck(checks, "HARNESS Core final surface weak claims recordable", includesAll(currentStateYaml.harness_core_final_surface_git_readiness?.weak_claims_recordable, REQUIRED_WEAK_FINAL_SURFACE_CLAIMS), {
    weak_claims_recordable: currentStateYaml.harness_core_final_surface_git_readiness?.weak_claims_recordable || null
  });
  addCheck(checks, "HARNESS Core final precommit weak claims recordable", includesAll(currentStateYaml.harness_core_final_precommit_convergence?.weak_claims_recordable, REQUIRED_WEAK_FINAL_PRECOMMIT_CLAIMS), {
    weak_claims_recordable: currentStateYaml.harness_core_final_precommit_convergence?.weak_claims_recordable || null
  });
  addCheck(checks, "HARNESS Core final precommit convergence records commit boundary", currentStateYaml.harness_core_final_precommit_convergence?.commit_ready === true
    && currentStateYaml.harness_core_final_precommit_convergence?.commit_performed === false
    && currentStateYaml.harness_core_final_precommit_convergence?.commit_approval_required === true, {
    final_precommit_convergence: currentStateYaml.harness_core_final_precommit_convergence || null
  });
}

const referenceBaselineIntegrity = runNodeScript("tools/check_reference_baseline_integrity.mjs");
addCheck(checks, "reference baseline integrity checker passes", referenceBaselineIntegrity.status === "pass", referenceBaselineIntegrity);
const referenceBaselineNaming = runNodeScript("tools/check_reference_baseline_naming.mjs");
addCheck(checks, "reference baseline naming checker passes", referenceBaselineNaming.status === "pass", referenceBaselineNaming);
const noLegacySurface = runNodeScript("tools/check_harness_core_no_legacy_surface.mjs");
addCheck(checks, "HARNESS Core no legacy surface checker passes", noLegacySurface.status === "pass", noLegacySurface);
const gitReadiness = runNodeScript("tools/check_harness_core_git_readiness.mjs");
addCheck(checks, "HARNESS Core git readiness checker passes", gitReadiness.status === "pass", gitReadiness);

const protectedStatus = gitStatusProtected();
addCheck(checks, "legacy reference source modified false", protectedStatus.legacy_reference_source_modified === false, protectedStatus);
addCheck(checks, "dist modified false", protectedStatus.dist_modified === false, protectedStatus);
addCheck(checks, "compatibility reference snapshot refreshed false", protectedStatus.reference_baseline_compatibility_refreshed === false, protectedStatus);

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checks,
  failures,
  unresolved_items_count: failures.length,
  protected_path_status: protectedStatus,
  project: currentStateYaml?.project || null,
  agent_ready_export: currentStateYaml?.agent_ready_export || null,
  latest_dossier_export: currentStateYaml?.latest_dossier_export || null,
  reference_baseline: currentStateYaml?.reference_baseline || null,
  weak_claims_recorded: [
    "post-final-dossier-agent-application-layer-recorded",
    "post-final-dossier-current-state-aligned",
    "project-renamed-to-harness-core-recorded",
    "legacy-name-policy-recorded",
    "agent-ready-export-renamed",
    ...REQUIRED_WEAK_REFERENCE_CLAIMS,
    ...REQUIRED_WEAK_FINAL_SURFACE_CLAIMS,
    ...REQUIRED_WEAK_FINAL_PRECOMMIT_CLAIMS
  ],
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  legacy_reference_source_modified: protectedStatus.legacy_reference_source_modified,
  dist_modified: protectedStatus.dist_modified,
  reference_baseline_compatibility_refreshed: protectedStatus.reference_baseline_compatibility_refreshed,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

const md = `# Current State Alignment Gate

Status: ${report.status}

- Stage: ${STAGE}
- Project: ${currentStateYaml?.project?.name || "missing"}
- Checks: ${checks.length}
- Failures: ${failures.length}
- Agent-ready export: ${currentStateYaml?.agent_ready_export?.path || "missing"}
- Latest dossier export: ${currentStateYaml?.latest_dossier_export?.path || "missing"}
- Reference baseline: ${currentStateYaml?.reference_baseline?.path || "missing"}
- New local model execution: false
- OpenAI model API call: false
- Telemetry sink write: false
- Legacy reference source modified: ${protectedStatus.legacy_reference_source_modified}
- Dist modified: ${protectedStatus.dist_modified}
- Compatibility reference snapshot refreshed: ${protectedStatus.reference_baseline_compatibility_refreshed}
`;

const currentStateIndex = {
  status: report.status === "pass" ? "recorded" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  project: currentStateYaml?.project || null,
  state_label: currentStateYaml?.state_label || null,
  scope: currentStateYaml?.scope || null,
  source_files: {
    current_state_yaml: "CURRENT_STATE.yaml",
    current_state_json: "CURRENT_STATE.json",
    start_here: "START_HERE_FOR_AGENTS.ko.md",
    bootstrap: "AGENT_BOOTSTRAP.ko.md",
    agents: "AGENTS.md",
    readme: "README.md",
    reference_baseline_policy: "docs/reference_baseline_policy.ko.md"
  },
  agent_ready_export: {
    path: currentStateYaml?.agent_ready_export?.path || null,
    checksum_report_path: currentStateYaml?.agent_ready_export?.checksum_report_path || null,
    checksum_embedded_in_archive: false
  },
  latest_dossier_export: currentStateYaml?.latest_dossier_export || null,
  reference_baseline: currentStateYaml?.reference_baseline || null,
  allowed_claims: currentStateYaml?.allowed_claims || [],
  blocked_claims: currentStateYaml?.blocked_claims || [],
  weak_claims_recorded: report.weak_claims_recorded,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

const currentStateClaimBoundary = {
  status: report.status === "pass" ? "recorded" : "blocked",
  stage: STAGE,
  source: "CURRENT_STATE.yaml",
  project: currentStateYaml?.project || null,
  allowed_claims: currentStateYaml?.allowed_claims || [],
  blocked_claims: currentStateYaml?.blocked_claims || [],
  canonicalization_rules: currentStateYaml?.canonicalization_rules || [],
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  weak_claims_recorded: report.weak_claims_recorded,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};

writeJson(p("evidence/current-state/current_state_gate_report.json"), report);
writeJson(p("evidence/current-state/current_state_index.json"), currentStateIndex);
writeJson(p("evidence/current-state/current_state_claim_boundary.json"), currentStateClaimBoundary);
writeJson(p("evidence/current-state/current_state_alignment_report.json"), report);
writeJson(p("evidence/current-state/unresolved_items.json"), {
  status: report.status,
  stage: STAGE,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});
writeJson(p("evidence/project-rename-to-harness-core/project_rename_gate_report.json"), {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  canonical_name: PROJECT_NAME,
  slug: PROJECT_SLUG,
  legacy_names: currentStateYaml?.project?.legacy_names || [],
  agent_ready_export_path: AGENT_READY_EXPORT_PATH,
  reference_baseline: currentStateYaml?.reference_baseline || null,
  checks,
  failures,
  unresolved_items_count: failures.length,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
});
writeJson(p("evidence/project-rename-to-harness-core/unresolved_items.json"), {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});
writeJson(p("evals/reports/current_state_alignment_report.json"), report);
writeText(p("evals/reports/current_state_alignment_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
