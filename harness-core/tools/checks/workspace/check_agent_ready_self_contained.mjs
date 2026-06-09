#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const EVIDENCE_DIR = "evidence/self-contained-agent-ready-check";
const PROJECT_NAME = "HARNESS Core";
const PROJECT_SLUG = "harness-core";
const AGENT_READY_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const REFERENCE_BASELINE_PATH = "evidence/reference-baseline";

const REQUIRED_FILES = [
  "CURRENT_STATE.json",
  "CURRENT_STATE.yaml",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "NAME_MIGRATION.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/name_migration_to_harness_core.ko.md",
  "docs/workspace/reference_baseline_policy.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "tools/checks/workspace/check_clean_export_self_contained.mjs",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "release/scopes/project-rename/project_rename_to_harness_core_scope.yaml",
  "release/claims/project-rename/project_rename_claim_boundary.yaml",
  "release/scopes/agent-ready/self_contained_agent_ready_check_scope.yaml",
  "release/claims/agent-ready/self_contained_agent_ready_claim_boundary.yaml",
  "release/scopes/reference-baseline/reference_baseline_deemphasis_scope.yaml",
  "release/claims/reference-baseline/reference_baseline_claim_boundary.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
  "evidence/current-state/current_state_index.json",
  "evidence/current-state/current_state_gate_report.json",
  "evidence/current-state/current_state_claim_boundary.json",
  "evidence/reference-baseline/file_inventory.json",
  "evidence/reference-baseline/checksums.json",
  "evidence/harness-core-final-surface-git-readiness/harness_core_no_legacy_surface_report.json",
  "evidence/harness-core-final-surface-git-readiness/reference_baseline_integrity_report.json",
  "evidence/harness-core-final-surface-git-readiness/git_readiness_report.json",
  "evidence/harness-core-final-surface-git-readiness/harness_core_final_surface_gate_report.json"
];

const REQUIRED_SCOPED_ALLOWED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-export-active-provider-lanes-verified",
  "post-export-active-adapters-checked",
  "post-export-active-scoped-production-ready",
  "post-export-active-scoped-stable",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const REQUIRED_WEAK_CLAIMS = [
  "self-contained-agent-ready-check-recorded",
  "self-contained-clean-export-checked",
  "current-state-json-recorded",
  "reference-baseline-deemphasized",
  "reference-baseline-integrity-checked",
  "legacy-reference-policy-recorded",
  "active-docs-reference-name-aligned"
];

const REQUIRED_FINAL_SURFACE_WEAK_CLAIMS = [
  "harness-core-final-surface-checked",
  "reference-baseline-integrity-checked",
  "harness-core-git-readiness-recorded",
  "harness-core-agent-ready-export-refreshed"
];

const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const EXECUTION_FLAGS_MUST_BE_FALSE = [
  "openai_model_api_call",
  "openai_provider_rerun",
  "new_local_model_execution",
  "local_model_generation",
  "telemetry_sink_write",
  "redteam_rerun",
  "adapter_conformance_rerun",
  "npm_install_or_ci",
  "release_gate_rerun",
  "raw_request_storage",
  "raw_response_storage",
  "secret_storage"
];

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, "harness-core");
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readText(relPath) {
  return fs.readFileSync(p(relPath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relPath) {
  try {
    return JSON.parse(readText(relPath));
  } catch {
    return null;
  }
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function hasPath(relPath) {
  return fs.existsSync(p(relPath));
}

function arrayIncludesAll(values, required) {
  return Array.isArray(values) && required.every((item) => values.includes(item));
}

function doesNotCallHarnessCoreLegacy(text) {
  const slug = PROJECT_SLUG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !(new RegExp(`${slug}[^.\\n]*(legacy|이전 이름)|(?:legacy|이전 이름)[^.\\n]*${slug}`, "i")).test(text);
}

function findExternalImports(relPath) {
  if (!hasPath(relPath)) return [{ specifier: "missing-file", reason: "file missing" }];
  const text = readText(relPath);
  const matches = [];
  const patterns = [
    /import\s+(?:[^"'()]+?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier.startsWith("node:")) {
        matches.push({ specifier, reason: "not a node: built-in import" });
      }
    }
  }
  return matches;
}

function walkForBasename(dir, basename, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs).split(path.sep).join("/");
    if (["node_modules", "dist", ".git", "exports"].some((item) => rel === item || rel.startsWith(`${item}/`))) continue;
    if (entry.name === basename) found.push(rel);
    if (entry.isDirectory()) walkForBasename(abs, basename, found);
  }
  return found;
}

function extractClaimFlagsFromCurrentState(currentState) {
  const allowed = currentState?.allowed_claims || [];
  return {
    provider_verified_allowed: allowed.includes("provider-verified"),
    adapter_checked_allowed: allowed.includes("adapter-checked"),
    production_ready_allowed: allowed.includes("production-ready"),
    stable_allowed: allowed.includes("stable"),
    release_gated_allowed: allowed.includes("release-gated")
  };
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

function runReferenceBaselineIntegrity() {
  if (!hasPath("tools/checks/workspace/check_reference_baseline_integrity.mjs")) {
    return {
      status: "fail",
      checker_exit_code: null,
      checker_stdout_json: null,
      checker_stderr: "tools/checks/workspace/check_reference_baseline_integrity.mjs missing"
    };
  }
  const result = spawnSync(process.execPath, ["tools/checks/workspace/check_reference_baseline_integrity.mjs"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });
  return {
    status: result.status === 0 ? "pass" : "fail",
    checker_exit_code: result.status,
    checker_stdout_json: parseLastJsonObject(result.stdout),
    checker_stderr: result.stderr.trim()
  };
}

const checks = [];
for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, hasPath(relPath), { path: relPath });
}

const currentState = readJson("CURRENT_STATE.json");
const currentStateYamlExists = hasPath("CURRENT_STATE.yaml");
const currentStateJsonValid = currentState !== null;
const claimFlags = extractClaimFlagsFromCurrentState(currentState);
const startHereText = hasPath("START_HERE_FOR_AGENTS.ko.md") ? readText("START_HERE_FOR_AGENTS.ko.md") : "";
const bootstrapText = hasPath("AGENT_BOOTSTRAP.ko.md") ? readText("AGENT_BOOTSTRAP.ko.md") : "";
const agentsText = hasPath("AGENTS.md") ? readText("AGENTS.md") : "";
const readmeText = hasPath("README.md") ? readText("README.md") : "";
const nameMigrationText = hasPath("NAME_MIGRATION.md") ? readText("NAME_MIGRATION.md") : "";

addCheck(checks, "CURRENT_STATE.json is valid JSON", currentStateJsonValid);
addCheck(checks, "CURRENT_STATE.yaml exists", currentStateYamlExists);
addCheck(checks, "project name recorded", currentState?.project?.name === PROJECT_NAME, {
  project: currentState?.project || null
});
addCheck(checks, "project slug recorded", currentState?.project?.slug === PROJECT_SLUG, {
  project: currentState?.project || null
});
addCheck(checks, "no legacy project names recorded", Array.isArray(currentState?.project?.legacy_names)
  && currentState.project.legacy_names.length === 0, {
  project: currentState?.project || null
});
addCheck(checks, "START_HERE mentions HARNESS Core", startHereText.includes(PROJECT_NAME));
addCheck(checks, "README mentions HARNESS Core", readmeText.includes(PROJECT_NAME));
addCheck(checks, "AGENTS.md mentions HARNESS Core", agentsText.includes(PROJECT_NAME));
addCheck(checks, "NAME_MIGRATION records project identity", nameMigrationText.includes(PROJECT_NAME)
  && nameMigrationText.includes(PROJECT_SLUG));
addCheck(checks, "active entrypoints treat project slug as canonical", [
  startHereText,
  bootstrapText,
  agentsText,
  readmeText,
  nameMigrationText
].every(doesNotCallHarnessCoreLegacy), {
  files: [
    "START_HERE_FOR_AGENTS.ko.md",
    "AGENT_BOOTSTRAP.ko.md",
    "AGENTS.md",
    "README.md",
    "NAME_MIGRATION.md"
  ]
});
addCheck(checks, "agent_ready_export path recorded", currentState?.agent_ready_export?.path === AGENT_READY_EXPORT_PATH, {
  agent_ready_export: currentState?.agent_ready_export || null
});
addCheck(checks, "agent_ready_export checksum remains external", currentState?.agent_ready_export?.checksum_report_path === "evidence/clean-artifact-prune/agent_ready_clean_export_report.json"
  && currentState?.agent_ready_export?.sha256 === undefined, {
  agent_ready_export: currentState?.agent_ready_export || null
});
addCheck(checks, "latest_dossier_export separated", currentState?.latest_export === undefined
  && currentState?.latest_dossier_export?.path === "exports/v2.0.0-rc.1-postrc-final-dossier-export.zip", {
  latest_export: currentState?.latest_export || null,
  latest_dossier_export: currentState?.latest_dossier_export || null
});
addCheck(checks, "reference baseline state recorded", currentState?.reference_baseline?.status === "available"
  && currentState?.reference_baseline?.role === "historical_reference_snapshot"
  && currentState?.reference_baseline?.active_source_of_truth === false
  && currentState?.reference_baseline?.path === REFERENCE_BASELINE_PATH, {
  reference_baseline: currentState?.reference_baseline || null
});
addCheck(checks, "operation mode records root workspace primary", currentState?.operation_mode?.primary === "root_workspace"
  && currentState?.operation_mode?.secondary === "agent_ready_export", {
  operation_mode: currentState?.operation_mode || null
});
addCheck(checks, "root workspace mode records first command", currentState?.root_workspace?.purpose === "primary_operating_mode"
  && currentState?.root_workspace?.entrypoint === "START_HERE_FOR_AGENTS.ko.md"
  && currentState?.root_workspace?.current_state_json === "CURRENT_STATE.json"
  && currentState?.root_workspace?.current_state_yaml === "CURRENT_STATE.yaml"
  && currentState?.root_workspace?.bootstrap === "AGENT_BOOTSTRAP.ko.md"
  && currentState?.root_workspace?.first_command === "node tools/checks/workspace/check_agent_ready_self_contained.mjs", {
  root_workspace: currentState?.root_workspace || null
});
addCheck(checks, "required scoped claims recorded", arrayIncludesAll(currentState?.allowed_claims, REQUIRED_SCOPED_ALLOWED_CLAIMS), {
  required: REQUIRED_SCOPED_ALLOWED_CLAIMS,
  allowed_claims: currentState?.allowed_claims || null
});
addCheck(checks, "weak self-contained/reference claims recordable", arrayIncludesAll(currentState?.self_contained_agent_ready_check?.weak_claims_recordable, REQUIRED_WEAK_CLAIMS), {
  required: REQUIRED_WEAK_CLAIMS,
  weak_claims_recordable: currentState?.self_contained_agent_ready_check?.weak_claims_recordable || null
});
addCheck(checks, "weak final surface claims recordable", arrayIncludesAll(currentState?.harness_core_final_surface_git_readiness?.weak_claims_recordable, REQUIRED_FINAL_SURFACE_WEAK_CLAIMS), {
  required: REQUIRED_FINAL_SURFACE_WEAK_CLAIMS,
  weak_claims_recordable: currentState?.harness_core_final_surface_git_readiness?.weak_claims_recordable || null
});
addCheck(checks, "strong bare claims remain blocked", arrayIncludesAll(currentState?.blocked_claims, [
  ...BLOCKED_STRONG_CLAIMS,
  "bare release-gated"
]), {
  blocked_claims: currentState?.blocked_claims || null
});
addCheck(checks, "strong bare claims not allowed", Object.values(claimFlags).every((value) => value === false), claimFlags);
addCheck(checks, "forbidden execution flags remain false", EXECUTION_FLAGS_MUST_BE_FALSE.every((flag) => currentState?.execution_boundary?.[flag] === false), {
  execution_boundary: currentState?.execution_boundary || null
});
addCheck(checks, "self-contained checker policy recorded", currentState?.self_contained_agent_ready_check?.requires_node_modules === false
  && currentState?.self_contained_agent_ready_check?.requires_npm_install === false
  && currentState?.self_contained_agent_ready_check?.requires_legacy_reference_source === false
  && currentState?.self_contained_agent_ready_check?.reference_baseline_check_policy === "snapshot_files_only", {
  self_contained_agent_ready_check: currentState?.self_contained_agent_ready_check || null
});

const importLeaks = [
  ...findExternalImports("tools/checks/workspace/check_agent_ready_self_contained.mjs").map((item) => ({ file: "tools/checks/workspace/check_agent_ready_self_contained.mjs", ...item })),
  ...findExternalImports("tools/checks/workspace/check_reference_baseline_integrity.mjs").map((item) => ({ file: "tools/checks/workspace/check_reference_baseline_integrity.mjs", ...item }))
];
addCheck(checks, "self-contained checkers use only Node built-in imports", importLeaks.length === 0, { external_imports: importLeaks });

const referenceBaselineCheck = runReferenceBaselineIntegrity();
addCheck(checks, "reference baseline integrity check passes", referenceBaselineCheck.status === "pass", referenceBaselineCheck);

const localPackageState = {
  node_modules_present: fs.existsSync(p("node_modules")),
  dist_present: fs.existsSync(p("dist")),
  git_metadata_present_in_package_root: fs.existsSync(p(".git")),
  exports_present: fs.existsSync(p("exports")),
  archive_legacy_handoffs_present: fs.existsSync(p("archive/legacy-handoffs")),
  ds_store_paths: walkForBasename(root, ".DS_Store")
};
const forbiddenPathsAbsent = !localPackageState.node_modules_present
  && !localPackageState.dist_present
  && !localPackageState.git_metadata_present_in_package_root
  && !localPackageState.archive_legacy_handoffs_present
  && localPackageState.ds_store_paths.length === 0;
const cleanExportContextDetected = !localPackageState.exports_present
  && !localPackageState.node_modules_present
  && !localPackageState.dist_present
  && !localPackageState.archive_legacy_handoffs_present;
addCheck(checks, "forbidden paths absent in clean export context", cleanExportContextDetected ? forbiddenPathsAbsent : true, {
  clean_export_context_detected: cleanExportContextDetected,
  forbidden_paths_absent: forbiddenPathsAbsent,
  local_package_state: localPackageState,
  note: cleanExportContextDetected ? "Clean export context detected." : "Source worktree context detected; archive checks are enforced by the workspace clean export checker."
});

const currentStateCheck = {
  status: checks.filter((check) => check.name.startsWith("CURRENT_STATE")
    || check.name.includes("project")
    || check.name.includes("HARNESS Core")
    || check.name.includes("legacy project")
    || check.name.includes("agent_ready_export")
    || check.name.includes("latest_dossier_export")
    || check.name.includes("operation mode")
    || check.name.includes("root workspace")
    || check.name.includes("reference baseline")).every((check) => check.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  current_state_json_exists: hasPath("CURRENT_STATE.json"),
  current_state_yaml_exists: currentStateYamlExists,
  current_state_json_valid: currentStateJsonValid,
  project: currentState?.project || null,
  operation_mode: currentState?.operation_mode || null,
  root_workspace: currentState?.root_workspace || null,
  agent_ready_export: currentState?.agent_ready_export || null,
  latest_dossier_export: currentState?.latest_dossier_export || null,
  reference_baseline: currentState?.reference_baseline || null
};

const referenceBaselineSnapshotCheck = {
  status: referenceBaselineCheck.status,
  stage: STAGE,
  policy: "snapshot_files_only",
  requires_legacy_reference_source: false,
  reference_baseline_path: REFERENCE_BASELINE_PATH,
  checker: "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  checker_exit_code: referenceBaselineCheck.checker_exit_code,
  checker_report: referenceBaselineCheck.checker_stdout_json || null
};

const claimBoundaryCheck = {
  status: arrayIncludesAll(currentState?.allowed_claims, REQUIRED_SCOPED_ALLOWED_CLAIMS)
    && arrayIncludesAll(currentState?.self_contained_agent_ready_check?.weak_claims_recordable, REQUIRED_WEAK_CLAIMS)
    && arrayIncludesAll(currentState?.harness_core_final_surface_git_readiness?.weak_claims_recordable, REQUIRED_FINAL_SURFACE_WEAK_CLAIMS)
    && arrayIncludesAll(currentState?.blocked_claims, [...BLOCKED_STRONG_CLAIMS, "bare release-gated"])
    && Object.values(claimFlags).every((value) => value === false)
    ? "pass"
    : "fail",
  stage: STAGE,
  weak_claims_recorded: [
    ...REQUIRED_WEAK_CLAIMS,
    ...REQUIRED_FINAL_SURFACE_WEAK_CLAIMS
  ],
  provider_verified_allowed: claimFlags.provider_verified_allowed,
  adapter_checked_allowed: claimFlags.adapter_checked_allowed,
  production_ready_allowed: claimFlags.production_ready_allowed,
  stable_allowed: claimFlags.stable_allowed,
  release_gated_allowed: claimFlags.release_gated_allowed,
  blocked_claims: currentState?.blocked_claims || null
};

const failures = checks.filter((check) => check.status !== "pass");
const unresolvedItems = failures.map((failure) => ({
  id: failure.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  status: "blocked",
  reason: failure.name,
  detail: failure.detail
}));

const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checker: "check_agent_ready_self_contained.mjs",
  weak_claims_recorded: [
    ...REQUIRED_WEAK_CLAIMS,
    ...REQUIRED_FINAL_SURFACE_WEAK_CLAIMS
  ],
  dependency_free: importLeaks.length === 0,
  requires_node_modules: false,
  requires_npm_install: false,
  requires_legacy_reference_source: false,
  legacy_source_required: false,
  reference_baseline_check_policy: "snapshot_files_only",
  reference_baseline_check_passed: referenceBaselineSnapshotCheck.status === "pass",
  current_state_json_exists: hasPath("CURRENT_STATE.json"),
  current_state_yaml_exists: currentStateYamlExists,
  project_name: currentState?.project?.name || null,
  project_slug: currentState?.project?.slug || null,
  legacy_project_names: currentState?.project?.legacy_names || null,
  operation_mode_primary: currentState?.operation_mode?.primary || null,
  operation_mode_secondary: currentState?.operation_mode?.secondary || null,
  root_workspace_first_command: currentState?.root_workspace?.first_command || null,
  reference_baseline: currentState?.reference_baseline || null,
  claim_boundary_passed: claimBoundaryCheck.status === "pass",
  forbidden_paths_absent: forbiddenPathsAbsent,
  clean_export_context_detected: cleanExportContextDetected,
  forbidden_package_roots_required: false,
  local_package_state: localPackageState,
  provider_verified_allowed: claimFlags.provider_verified_allowed,
  adapter_checked_allowed: claimFlags.adapter_checked_allowed,
  production_ready_allowed: claimFlags.production_ready_allowed,
  stable_allowed: claimFlags.stable_allowed,
  release_gated_allowed: claimFlags.release_gated_allowed,
  checks,
  failures,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
};

const gateReport = {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  self_contained_agent_ready_check_recorded: report.status === "pass",
  self_contained_clean_export_checked: false,
  current_state_json_recorded: report.current_state_json_exists && currentStateJsonValid,
  dependency_free: report.dependency_free,
  reference_baseline_check_passed: report.reference_baseline_check_passed,
  requires_legacy_reference_source: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: unresolvedItems.length
};

writeJson(`${EVIDENCE_DIR}/self_contained_current_state_check.json`, currentStateCheck);
writeJson(`${EVIDENCE_DIR}/self_contained_reference_baseline_snapshot_check.json`, referenceBaselineSnapshotCheck);
writeJson(`${EVIDENCE_DIR}/self_contained_claim_boundary_check.json`, claimBoundaryCheck);
writeJson(`${EVIDENCE_DIR}/self_contained_agent_ready_check_report.json`, report);
writeJson(`${EVIDENCE_DIR}/self_contained_gate_report.json`, gateReport);
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});

const cleanExportCheckPath = `${EVIDENCE_DIR}/self_contained_clean_export_check.json`;
if (!hasPath(cleanExportCheckPath)) {
  writeJson(cleanExportCheckPath, {
    status: "not_run",
    stage: STAGE,
    generated_at: report.generated_at,
    note: "Run node tools/checks/workspace/check_clean_export_self_contained.mjs from the source workspace to inspect the clean export archive."
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
