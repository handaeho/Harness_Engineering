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
const REQUIRED_WEAK_RELEASE_GRADE_CLAIMS = [
  "release-grade-source-ledger-checked",
  "release-grade-reinforcement-completion-audit-recorded",
  "release-grade-claim-state-sync-checked",
  "release-grade-provider-gate-attempt-recorded",
  "release-grade-vllm-operator-env-guard-recorded",
  "release-grade-vllm-operator-env-guard-regression-checked",
  "release-grade-adapter-vllm-preflight-recorded",
  "release-grade-adapter-ollama-preflight-recorded",
  "release-grade-adapter-coverage-completion-recorded",
  "release-grade-adapter-checked-final-gate-recorded",
  "release-grade-ollama-evidence-package-recorded",
  "release-grade-vllm-evidence-package-recorded",
  "release-grade-vllm-evidence-package-regression-checked",
  "release-grade-vllm-operator-packet-checked",
  "local-vllm-adapter-checked-version2-follow-up-recorded",
  "release-grade-general-release-gate-recorded"
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

function claimMembershipMatches(record, claim, expectedOpen, options = {}) {
  const allowed = Array.isArray(record?.allowed_claims) ? record.allowed_claims : [];
  const blocked = Array.isArray(record?.blocked_claims) ? record.blocked_claims : [];
  const requireAllowedClaim = options.requireAllowedClaim !== false;
  if (expectedOpen) {
    return blocked.includes(claim) === false
      && (requireAllowedClaim === false || allowed.includes(claim) === true);
  }
  return allowed.includes(claim) === false && blocked.includes(claim) === true;
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
    .split(COMPATIBILITY_BASELINE_PATH).join("reference-baseline-compatibility-snapshot");
}

function gitStatusProtected() {
  const result = spawnSync("git", [
    "-C",
    gitRoot,
    "status",
    "--short",
    "--",
    "dist",
    "harness-core/dist",
    COMPATIBILITY_BASELINE_PATH
  ], { encoding: "utf8" });
  const rawPaths = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, ""));
  const legacyReferenceSourceDirty = [];
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
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/reference_baseline_policy.ko.md",
  "docs/workspace/reference_baseline_deemphasis.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "docs/workspace/harness_core_final_precommit_convergence.ko.md",
  "release/scopes/reference-baseline/reference_baseline_deemphasis_scope.yaml",
  "release/claims/reference-baseline/reference_baseline_claim_boundary.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "release/scopes/harness-core/harness_core_final_precommit_convergence_scope.yaml",
  "release/claims/harness-core/harness_core_final_precommit_claim_boundary.yaml",
  "core/source_authority/release_grade_source_ledger.json",
  "schemas/source_authority_ledger.schema.json",
  "tools/lib/release_grade_claim_state.mjs",
  "tools/checks/workspace/check_release_grade_source_ledger.mjs",
  "tools/checks/workspace/check_release_grade_reinforcement_completion_audit.mjs",
  "tools/runners/workspace/run_release_grade_claim_state_sync.mjs",
  "tools/checks/workspace/check_release_grade_claim_state_sync.mjs",
  "tools/checks/providers/check_release_grade_provider_verified_gate.mjs",
  "tools/checks/local/check_vllm_operator_env_guard.mjs",
  "tools/checks/local/check_vllm_operator_env_guard_regression.mjs",
  "tools/checks/adapters/check_release_grade_adapter_vllm_preflight.mjs",
  "tools/runners/local/run_vllm_no_tool_canary.mjs",
  "tools/checks/local/check_vllm_no_tool_canary.mjs",
  "tools/runners/adapters/run_vllm_adapter_conformance_local_execution.mjs",
  "tools/checks/adapters/check_vllm_adapter_conformance_local_execution.mjs",
  "tools/runners/adapters/run_release_grade_adapter_coverage_completion.mjs",
  "tools/checks/adapters/check_release_grade_adapter_coverage_completion.mjs",
  "tools/runners/adapters/run_release_grade_adapter_checked_final_gate.mjs",
  "tools/checks/adapters/check_release_grade_adapter_checked_final_gate.mjs",
  "tools/checks/adapters/check_release_grade_vllm_evidence_package.mjs",
  "tools/checks/adapters/check_release_grade_vllm_evidence_package_regression.mjs",
  "tools/checks/adapters/check_release_grade_vllm_operator_packet.mjs",
  "tools/runners/release/run_release_grade_general_release_gate.mjs",
  "tools/checks/release/check_release_grade_general_release_gate.mjs",
  "docs/workspace/release_grade_reinforcement_completion_audit.md",
  "docs/workspace/release_grade_claim_state_sync.md",
  "docs/adapters/release_grade_vllm_operator_env_guard.md",
  "docs/adapters/release_grade_vllm_evidence_package.md",
  "docs/adapters/release_grade_vllm_operator_packet.md",
  "docs/release/release_grade_general_release_gate.md",
  "evals/suites/release_grade_reinforcement_completion_audit.yaml",
  "evals/suites/release_grade_claim_state_sync.yaml",
  "evals/suites/release_grade_vllm_operator_env_guard.yaml",
  "evals/suites/release_grade_vllm_evidence_package.yaml",
  "evals/suites/release_grade_vllm_operator_packet.yaml",
  "evals/suites/release_grade_general_release_gate.yaml",
  "release/gates/general/release_grade_provider_verified_gate.yaml",
  "release/gates/general/release_grade_adapter_vllm_preflight_gate.yaml",
  "release/gates/general/release_grade_general_release_gate.yaml",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs",
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
const providerGate = fs.existsSync(p("evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json"))
  ? readJson(p("evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json"))
  : null;
const adapterFinalGate = fs.existsSync(p("evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json"))
  ? readJson(p("evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json"))
  : null;
const generalReleaseGate = fs.existsSync(p("evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json"))
  ? readJson(p("evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json"))
  : null;
const ollamaPackage = fs.existsSync(p("evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json"))
  ? readJson(p("evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json"))
  : null;
const vllmPackage = fs.existsSync(p("evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json"))
  ? readJson(p("evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json"))
  : null;
const stack = fs.existsSync(p("stack.yaml")) ? readYaml(p("stack.yaml")) : null;
const packageJson = fs.existsSync(p("package.json")) ? readJson(p("package.json")) : null;

const agentsText = fs.existsSync(p("AGENTS.md")) ? readText(p("AGENTS.md")) : "";
const readmeText = fs.existsSync(p("README.md")) ? readText(p("README.md")) : "";
const startHereText = fs.existsSync(p("START_HERE_FOR_AGENTS.ko.md")) ? readText(p("START_HERE_FOR_AGENTS.ko.md")) : "";
const bootstrapText = fs.existsSync(p("AGENT_BOOTSTRAP.ko.md")) ? readText(p("AGENT_BOOTSTRAP.ko.md")) : "";
const nameMigrationText = fs.existsSync(p("NAME_MIGRATION.md")) ? readText(p("NAME_MIGRATION.md")) : "";
const providerVerifiedGatePassed = providerGate?.status === "pass" && providerGate?.provider_verified_allowed === true;
const adapterCheckedGatePassed = providerVerifiedGatePassed
  && adapterFinalGate?.status === "pass"
  && adapterFinalGate?.adapter_checked_allowed === true
  && ollamaPackage?.status === "pass"
  && ollamaPackage?.adapter_checked_allowed === true
  && ollamaPackage?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && ollamaPackage?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false;
const generalReleaseGatePassed = adapterCheckedGatePassed
  && generalReleaseGate?.status === "pass"
  && generalReleaseGate?.approval_event?.approval_present === true
  && generalReleaseGate?.production_ready_allowed === true
  && generalReleaseGate?.stable_allowed === true
  && generalReleaseGate?.release_gated_allowed === true
  && ollamaPackage?.production_ready_allowed === true
  && ollamaPackage?.stable_allowed === true
  && ollamaPackage?.release_gated_allowed === true;
const releaseGradeClaimExpectations = [
  {
    claim: "provider-verified",
    expected_open: providerVerifiedGatePassed,
    final_flag: "provider_verified_allowed",
    require_allowed_claim: true,
    evidence: {
      provider_gate_status: providerGate?.status || null,
      provider_gate_allowed: providerGate?.provider_verified_allowed ?? null
    }
  },
  {
    claim: "adapter-checked",
    expected_open: adapterCheckedGatePassed,
    final_flag: "adapter_checked_allowed",
    require_allowed_claim: true,
    evidence: {
      adapter_final_status: adapterFinalGate?.status || null,
      adapter_final_allowed: adapterFinalGate?.adapter_checked_allowed ?? null,
      ollama_package_status: ollamaPackage?.status || null,
      ollama_package_adapter_allowed: ollamaPackage?.adapter_checked_allowed ?? null,
      local_vllm_version2_follow_up: ollamaPackage?.local_vllm_version2_follow_up || null,
      vllm_package_status: vllmPackage?.status || null,
      vllm_package_adapter_allowed: vllmPackage?.adapter_checked_allowed ?? null
    }
  },
  {
    claim: "production-ready",
    expected_open: generalReleaseGatePassed,
    final_flag: "production_ready_allowed",
    require_allowed_claim: true,
    evidence: {
      general_release_status: generalReleaseGate?.status || null,
      general_release_allowed: generalReleaseGate?.production_ready_allowed ?? null,
      approval_present: generalReleaseGate?.approval_event?.approval_present ?? null,
      ollama_package_allowed: ollamaPackage?.production_ready_allowed ?? null
    }
  },
  {
    claim: "stable",
    expected_open: generalReleaseGatePassed,
    final_flag: "stable_allowed",
    require_allowed_claim: true,
    evidence: {
      general_release_status: generalReleaseGate?.status || null,
      general_release_allowed: generalReleaseGate?.stable_allowed ?? null,
      approval_present: generalReleaseGate?.approval_event?.approval_present ?? null,
      ollama_package_allowed: ollamaPackage?.stable_allowed ?? null
    }
  },
  {
    claim: "release-gated",
    expected_open: generalReleaseGatePassed,
    final_flag: "release_gated_allowed",
    require_allowed_claim: true,
    evidence: {
      general_release_status: generalReleaseGate?.status || null,
      general_release_allowed: generalReleaseGate?.release_gated_allowed ?? null,
      approval_present: generalReleaseGate?.approval_event?.approval_present ?? null,
      ollama_package_allowed: ollamaPackage?.release_gated_allowed ?? null
    }
  },
  {
    claim: "bare release-gated",
    expected_open: false,
    final_flag: null,
    require_allowed_claim: false,
    evidence: {
      general_release_status: generalReleaseGate?.status || null,
      general_release_allowed: generalReleaseGate?.bare_release_gated_allowed ?? null,
      approval_present: generalReleaseGate?.approval_event?.approval_present ?? null
    }
  }
];
const providerVerifiedClaimOpen = providerVerifiedGatePassed
  && currentStateYaml?.allowed_claims?.includes("provider-verified") === true
  && currentStateYaml?.blocked_claims?.includes("provider-verified") !== true
  && currentStateJson?.allowed_claims?.includes("provider-verified") === true
  && currentStateJson?.blocked_claims?.includes("provider-verified") !== true
  && finalClaimState?.allowed_claims?.includes("provider-verified") === true
  && finalClaimState?.blocked_claims?.includes("provider-verified") !== true
  && finalClaimState?.provider_verified_allowed === true;
const adapterCheckedClaimOpen = adapterCheckedGatePassed
  && claimMembershipMatches(currentStateYaml, "adapter-checked", true)
  && claimMembershipMatches(currentStateJson, "adapter-checked", true)
  && claimMembershipMatches(finalClaimState, "adapter-checked", true)
  && finalClaimState?.adapter_checked_allowed === true;
const productionReadyClaimOpen = generalReleaseGatePassed
  && claimMembershipMatches(currentStateYaml, "production-ready", true)
  && claimMembershipMatches(currentStateJson, "production-ready", true)
  && claimMembershipMatches(finalClaimState, "production-ready", true)
  && finalClaimState?.production_ready_allowed === true;
const stableClaimOpen = generalReleaseGatePassed
  && claimMembershipMatches(currentStateYaml, "stable", true)
  && claimMembershipMatches(currentStateJson, "stable", true)
  && claimMembershipMatches(finalClaimState, "stable", true)
  && finalClaimState?.stable_allowed === true;
const releaseGatedClaimOpen = generalReleaseGatePassed
  && claimMembershipMatches(currentStateYaml, "release-gated", true)
  && claimMembershipMatches(currentStateJson, "release-gated", true)
  && claimMembershipMatches(finalClaimState, "release-gated", true)
  && finalClaimState?.release_gated_allowed === true;
const bareReleaseGatedClaimOpen = false
  && claimMembershipMatches(currentStateYaml, "bare release-gated", true, { requireAllowedClaim: false })
  && claimMembershipMatches(currentStateJson, "bare release-gated", true, { requireAllowedClaim: false })
  && claimMembershipMatches(finalClaimState, "bare release-gated", true, { requireAllowedClaim: false });

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
addCheck(checks, "package.json has reference baseline script", packageJson?.scripts?.["check:reference-baseline"] === "node tools/checks/workspace/check_reference_baseline_integrity.mjs");
addCheck(checks, "package.json version is private workspace metadata", packageJson?.version === currentStateYaml?.package_metadata?.package_json_version
  && currentStateJson?.package_metadata?.package_json_version === packageJson?.version
  && currentStateYaml?.package_metadata?.package_version_role === "private_workspace_metadata"
  && currentStateJson?.package_metadata?.package_version_role === "private_workspace_metadata"
  && currentStateYaml?.package_metadata?.source_of_truth_version === "CURRENT_STATE.version"
  && currentStateYaml?.package_metadata?.source_of_truth_state_label === "CURRENT_STATE.state_label", {
  package_json_version: packageJson?.version || null,
  yaml_package_metadata: currentStateYaml?.package_metadata || null,
  json_package_metadata: currentStateJson?.package_metadata || null
});
addCheck(checks, "package.json version does not open bare release claims", [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
].every((claim) => !String(packageJson?.version || "").includes(claim)), {
  package_json_version: packageJson?.version || null
});
addCheck(checks, "package.json has release-grade preflight scripts", packageJson?.scripts?.["check:release-grade-source-ledger"] === "node tools/checks/workspace/check_release_grade_source_ledger.mjs"
  && packageJson?.scripts?.["check:release-grade-completion-audit"] === "node tools/checks/workspace/check_release_grade_reinforcement_completion_audit.mjs"
  && packageJson?.scripts?.["run:release-grade-claim-state-sync"] === "node tools/runners/workspace/run_release_grade_claim_state_sync.mjs"
  && packageJson?.scripts?.["apply:release-grade-claim-state-sync"] === "node tools/runners/workspace/run_release_grade_claim_state_sync.mjs --apply"
  && packageJson?.scripts?.["check:release-grade-claim-state-sync"] === "node tools/checks/workspace/check_release_grade_claim_state_sync.mjs"
  && packageJson?.scripts?.["check:release-grade-provider-verified"] === "node tools/checks/providers/check_release_grade_provider_verified_gate.mjs"
  && packageJson?.scripts?.["check:release-grade-adapter-ollama"] === "node tools/checks/adapters/check_release_grade_adapter_ollama_preflight.mjs"
  && packageJson?.scripts?.["check:release-grade-ollama-evidence-package"] === "node tools/checks/adapters/check_release_grade_ollama_evidence_package.mjs"
  && packageJson?.scripts?.["check:final-precommit-convergence"] === "node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs"
  && packageJson?.scripts?.["check:vllm-operator-env"] === "node tools/checks/local/check_vllm_operator_env_guard.mjs"
  && packageJson?.scripts?.["check:vllm-operator-env-regression"] === "node tools/checks/local/check_vllm_operator_env_guard_regression.mjs"
  && packageJson?.scripts?.["preflight:vllm-operator-env"]?.includes("check_vllm_operator_env_guard.mjs --strict")
  && packageJson?.scripts?.["check:release-grade-adapter-vllm"] === "node tools/checks/adapters/check_release_grade_adapter_vllm_preflight.mjs"
  && packageJson?.scripts?.["preflight:vllm-live-canary"]?.includes("check_post_rc_local_endpoint_readiness_preflight.mjs")
  && packageJson?.scripts?.["canary:vllm-no-tool"] === "node tools/runners/local/run_vllm_no_tool_canary.mjs"
  && packageJson?.scripts?.["check:vllm-no-tool"] === "node tools/checks/local/check_vllm_no_tool_canary.mjs"
  && packageJson?.scripts?.["run:vllm-adapter-conformance"] === "node tools/runners/adapters/run_vllm_adapter_conformance_local_execution.mjs"
  && packageJson?.scripts?.["check:vllm-adapter-conformance"] === "node tools/checks/adapters/check_vllm_adapter_conformance_local_execution.mjs"
  && packageJson?.scripts?.["run:release-grade-adapter-coverage"] === "node tools/runners/adapters/run_release_grade_adapter_coverage_completion.mjs"
  && packageJson?.scripts?.["check:release-grade-adapter-coverage"] === "node tools/checks/adapters/check_release_grade_adapter_coverage_completion.mjs"
  && packageJson?.scripts?.["run:release-grade-adapter-checked-final"] === "node tools/runners/adapters/run_release_grade_adapter_checked_final_gate.mjs"
  && packageJson?.scripts?.["check:release-grade-adapter-checked-final"] === "node tools/checks/adapters/check_release_grade_adapter_checked_final_gate.mjs"
  && packageJson?.scripts?.["check:release-grade-vllm-evidence-package"] === "node tools/checks/adapters/check_release_grade_vllm_evidence_package.mjs"
  && packageJson?.scripts?.["check:release-grade-vllm-evidence-package-regression"] === "node tools/checks/adapters/check_release_grade_vllm_evidence_package_regression.mjs"
  && packageJson?.scripts?.["check:release-grade-vllm-operator-packet"] === "node tools/checks/adapters/check_release_grade_vllm_operator_packet.mjs"
  && packageJson?.scripts?.["adapter-checked-release-grade-gate"]?.startsWith("npm run check:release-grade-adapter-ollama")
  && packageJson?.scripts?.["ollama-release-grade-evidence-gate"]?.includes("check:release-grade-ollama-evidence-package")
  && packageJson?.scripts?.["ollama-release-grade-evidence-gate"]?.includes("check:final-precommit-convergence")
  && packageJson?.scripts?.["local-vllm-adapter-checked-v2-gate"]?.startsWith("npm run preflight:vllm-operator-env")
  && packageJson?.scripts?.["local-vllm-release-grade-v2-gate"]?.startsWith("npm run local-vllm-adapter-checked-v2-gate")
  && packageJson?.scripts?.["local-vllm-release-grade-v2-gate"]?.includes("check:release-grade-vllm-evidence-package")
  && packageJson?.scripts?.["local-vllm-release-grade-v2-gate"]?.includes("check:final-precommit-convergence")
  && packageJson?.scripts?.["vllm-release-grade-evidence-gate"] === "npm run local-vllm-release-grade-v2-gate"
  && packageJson?.scripts?.["run:release-grade-general-release"] === "node tools/runners/release/run_release_grade_general_release_gate.mjs"
  && packageJson?.scripts?.["check:release-grade-general-release"] === "node tools/checks/release/check_release_grade_general_release_gate.mjs"
  && typeof packageJson?.scripts?.["general-release-grade-gate"] === "string"
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("check:release-grade-adapter-ollama")
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("check:release-grade-ollama-evidence-package")
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("check:release-grade-completion-audit")
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("apply:release-grade-claim-state-sync")
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("check:release-grade-claim-state-sync")
  && packageJson?.scripts?.["release-grade-preflight"]?.includes("check:final-precommit-convergence"), {
  scripts: packageJson?.scripts || null
});
addCheck(checks, "release-grade completion audit recorded", currentStateYaml?.release_grade_reinforcement?.completion_audit_checker === "tools/checks/workspace/check_release_grade_reinforcement_completion_audit.mjs"
  && currentStateJson?.release_grade_reinforcement?.completion_audit_checker === currentStateYaml?.release_grade_reinforcement?.completion_audit_checker
  && currentStateYaml?.release_grade_reinforcement?.completion_audit_evidence_dir === "evidence/release-grade-reinforcement-completion-audit"
  && currentStateJson?.release_grade_reinforcement?.completion_audit_evidence_dir === currentStateYaml?.release_grade_reinforcement?.completion_audit_evidence_dir
  && currentStateYaml?.release_grade_reinforcement?.completion_audit_report === "evidence/release-grade-reinforcement-completion-audit/release_grade_reinforcement_completion_audit_report.json"
  && currentStateJson?.release_grade_reinforcement?.completion_audit_report === currentStateYaml?.release_grade_reinforcement?.completion_audit_report, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});
addCheck(checks, "release-grade claim-state sync recorded", currentStateYaml?.release_grade_reinforcement?.claim_state_sync_runner === "tools/runners/workspace/run_release_grade_claim_state_sync.mjs"
  && currentStateJson?.release_grade_reinforcement?.claim_state_sync_runner === currentStateYaml?.release_grade_reinforcement?.claim_state_sync_runner
  && currentStateYaml?.release_grade_reinforcement?.claim_state_sync_checker === "tools/checks/workspace/check_release_grade_claim_state_sync.mjs"
  && currentStateJson?.release_grade_reinforcement?.claim_state_sync_checker === currentStateYaml?.release_grade_reinforcement?.claim_state_sync_checker
  && currentStateYaml?.release_grade_reinforcement?.claim_state_sync_evidence_dir === "evidence/release-grade-claim-state-sync"
  && currentStateJson?.release_grade_reinforcement?.claim_state_sync_evidence_dir === currentStateYaml?.release_grade_reinforcement?.claim_state_sync_evidence_dir
  && currentStateYaml?.release_grade_reinforcement?.claim_state_sync_report === "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json"
  && currentStateJson?.release_grade_reinforcement?.claim_state_sync_report === currentStateYaml?.release_grade_reinforcement?.claim_state_sync_report
  && currentStateYaml?.release_grade_reinforcement?.claim_state_sync_check_report === "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json"
  && currentStateJson?.release_grade_reinforcement?.claim_state_sync_check_report === currentStateYaml?.release_grade_reinforcement?.claim_state_sync_check_report, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});
addCheck(checks, "release-grade vLLM operator env guard recorded", currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_checker === "tools/checks/local/check_vllm_operator_env_guard.mjs"
  && currentStateJson?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_checker === currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_checker
  && currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_regression_checker === "tools/checks/local/check_vllm_operator_env_guard_regression.mjs"
  && currentStateJson?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_regression_checker === currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_regression_checker
  && currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_evidence_dir === "evidence/release-grade-vllm-operator-env-guard"
  && currentStateJson?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_evidence_dir === currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_env_guard_evidence_dir, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});
addCheck(checks, "release-grade Ollama evidence package records ordering guard", currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_ordering_guard === "general-release-grade-gate generated_at must be greater than or equal to adapter-checked final gate generated_at"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_evidence_ordering_guard === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_ordering_guard, {
  yaml_ordering_guard: currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_ordering_guard || null,
  json_ordering_guard: currentStateJson?.release_grade_reinforcement?.adapter_ollama_evidence_ordering_guard || null
});
addCheck(checks, "release-grade Ollama evidence package records claim promotion readiness surface", currentStateYaml?.release_grade_reinforcement?.claim_promotion_readiness_surface === "evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json#claim_promotion_readiness"
  && currentStateJson?.release_grade_reinforcement?.claim_promotion_readiness_surface === currentStateYaml?.release_grade_reinforcement?.claim_promotion_readiness_surface, {
  yaml_claim_promotion_readiness_surface: currentStateYaml?.release_grade_reinforcement?.claim_promotion_readiness_surface || null,
  json_claim_promotion_readiness_surface: currentStateJson?.release_grade_reinforcement?.claim_promotion_readiness_surface || null
});
addCheck(checks, "release-grade Ollama adapter preflight recorded", currentStateYaml?.release_grade_reinforcement?.adapter_ollama_preflight_checker === "tools/checks/adapters/check_release_grade_adapter_ollama_preflight.mjs"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_preflight_checker === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_preflight_checker
  && currentStateYaml?.release_grade_reinforcement?.adapter_ollama_preflight_evidence_dir === "evidence/release-grade-adapter-ollama-preflight"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_preflight_evidence_dir === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_preflight_evidence_dir, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});
addCheck(checks, "release-grade Ollama evidence package recorded", currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_package_checker === "tools/checks/adapters/check_release_grade_ollama_evidence_package.mjs"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_evidence_package_checker === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_package_checker
  && currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_package_dir === "evidence/release-grade-ollama-evidence-package"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_evidence_package_dir === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_package_dir
  && currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_gate_script === "npm run ollama-release-grade-evidence-gate"
  && currentStateJson?.release_grade_reinforcement?.adapter_ollama_evidence_gate_script === currentStateYaml?.release_grade_reinforcement?.adapter_ollama_evidence_gate_script, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});
addCheck(checks, "local vLLM version2 follow-up recorded", currentStateYaml?.release_grade_reinforcement?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && currentStateJson?.release_grade_reinforcement?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && currentStateYaml?.release_grade_reinforcement?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false
  && currentStateJson?.release_grade_reinforcement?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false
  && currentStateYaml?.release_grade_reinforcement?.local_vllm_version2_follow_up?.adapter_gate_script === "npm run local-vllm-adapter-checked-v2-gate"
  && currentStateJson?.release_grade_reinforcement?.local_vllm_version2_follow_up?.adapter_gate_script === "npm run local-vllm-adapter-checked-v2-gate"
  && currentStateYaml?.release_grade_reinforcement?.local_vllm_version2_follow_up?.gate_script === "npm run local-vllm-release-grade-v2-gate"
  && currentStateJson?.release_grade_reinforcement?.local_vllm_version2_follow_up?.gate_script === "npm run local-vllm-release-grade-v2-gate", {
  yaml_follow_up: currentStateYaml?.release_grade_reinforcement?.local_vllm_version2_follow_up || null,
  json_follow_up: currentStateJson?.release_grade_reinforcement?.local_vllm_version2_follow_up || null
});
addCheck(checks, "release-grade vLLM operator packet recorded", currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_packet_checker === "tools/checks/adapters/check_release_grade_vllm_operator_packet.mjs"
  && currentStateJson?.release_grade_reinforcement?.adapter_vllm_operator_packet_checker === currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_packet_checker
  && currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_packet_evidence_dir === "evidence/release-grade-vllm-operator-packet"
  && currentStateJson?.release_grade_reinforcement?.adapter_vllm_operator_packet_evidence_dir === currentStateYaml?.release_grade_reinforcement?.adapter_vllm_operator_packet_evidence_dir, {
  release_grade_reinforcement: currentStateYaml?.release_grade_reinforcement || null
});

if (currentStateYaml && finalClaimState) {
  addCheck(checks, "allowed claims match final_release_claim_state", sameArray(currentStateYaml.allowed_claims, finalClaimState.allowed_claims), {
    current_state_allowed_claims: currentStateYaml.allowed_claims,
    final_claim_state_allowed_claims: finalClaimState.allowed_claims
  });
  addCheck(checks, "blocked claims match final_release_claim_state", sameArray(currentStateYaml.blocked_claims, finalClaimState.blocked_claims), {
    current_state_blocked_claims: currentStateYaml.blocked_claims,
    final_claim_state_blocked_claims: finalClaimState.blocked_claims
  });
  for (const expectation of releaseGradeClaimExpectations) {
    const membershipDetail = {
      claim: expectation.claim,
      expected_open: expectation.expected_open,
      current_state_yaml_allowed: currentStateYaml.allowed_claims?.includes(expectation.claim) === true,
      current_state_yaml_blocked: currentStateYaml.blocked_claims?.includes(expectation.claim) === true,
      current_state_json_allowed: currentStateJson.allowed_claims?.includes(expectation.claim) === true,
      current_state_json_blocked: currentStateJson.blocked_claims?.includes(expectation.claim) === true,
      final_claim_state_allowed: finalClaimState.allowed_claims?.includes(expectation.claim) === true,
      final_claim_state_blocked: finalClaimState.blocked_claims?.includes(expectation.claim) === true,
      final_claim_state_flag: expectation.final_flag ? finalClaimState[expectation.final_flag] : null,
      evidence: expectation.evidence
    };
    addCheck(checks, `${expectation.claim} matches release-grade gate evidence`, claimMembershipMatches(currentStateYaml, expectation.claim, expectation.expected_open, {
      requireAllowedClaim: expectation.require_allowed_claim
    })
      && claimMembershipMatches(currentStateJson, expectation.claim, expectation.expected_open, {
        requireAllowedClaim: expectation.require_allowed_claim
      })
      && claimMembershipMatches(finalClaimState, expectation.claim, expectation.expected_open, {
        requireAllowedClaim: expectation.require_allowed_claim
      })
      && (expectation.final_flag === null || finalClaimState[expectation.final_flag] === expectation.expected_open), membershipDetail);
  }
  addCheck(checks, "provider-verified follows release-grade provider gate", providerVerifiedClaimOpen === true, {
    provider_gate_status: providerGate?.status || null,
    provider_gate_allowed: providerGate?.provider_verified_allowed ?? null,
    current_state_yaml_allowed: currentStateYaml.allowed_claims?.includes("provider-verified") === true,
    current_state_yaml_blocked: currentStateYaml.blocked_claims?.includes("provider-verified") === true,
    final_claim_state_allowed: finalClaimState.allowed_claims?.includes("provider-verified") === true,
    final_claim_state_blocked: finalClaimState.blocked_claims?.includes("provider-verified") === true,
    final_claim_state_flag: finalClaimState.provider_verified_allowed ?? null
  });
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
  addCheck(checks, "release-grade weak claims recordable", includesAll(currentStateYaml.release_grade_reinforcement?.weak_claims_recordable, REQUIRED_WEAK_RELEASE_GRADE_CLAIMS), {
    weak_claims_recordable: currentStateYaml.release_grade_reinforcement?.weak_claims_recordable || null
  });
  addCheck(checks, "release-grade claim rules keep bare claims gated", currentStateYaml.release_grade_reinforcement?.provider_verified_claim_rule === "status pass opens provider-verified; hold or blocked keeps provider-verified blocked"
    && currentStateYaml.release_grade_reinforcement?.adapter_checked_claim_rule === "Ollama evidence package is required before adapter-checked can open; local-vllm-adapter-checked is deferred to version2 after release-gated."
    && currentStateYaml.release_grade_reinforcement?.general_release_claim_rule === "provider-verified and adapter-checked must both pass, and explicit release approval is required before production-ready/stable/release-gated can open; bare release-gated remains blocked in version1."
    && currentStateYaml.release_grade_reinforcement?.new_live_execution_default === false, {
    release_grade_reinforcement: currentStateYaml.release_grade_reinforcement || null
  });
  addCheck(checks, "HARNESS Core final precommit convergence records commit boundary", currentStateYaml.harness_core_final_precommit_convergence?.commit_ready === true
    && currentStateYaml.harness_core_final_precommit_convergence?.commit_performed === false
    && currentStateYaml.harness_core_final_precommit_convergence?.commit_approval_required === true, {
    final_precommit_convergence: currentStateYaml.harness_core_final_precommit_convergence || null
  });
}

const referenceBaselineIntegrity = runNodeScript("tools/checks/workspace/check_reference_baseline_integrity.mjs");
addCheck(checks, "reference baseline integrity checker passes", referenceBaselineIntegrity.status === "pass", referenceBaselineIntegrity);
const referenceBaselineNaming = runNodeScript("tools/checks/workspace/check_reference_baseline_naming.mjs");
addCheck(checks, "reference baseline naming checker passes", referenceBaselineNaming.status === "pass", referenceBaselineNaming);
const noLegacySurface = runNodeScript("tools/checks/workspace/check_harness_core_no_legacy_surface.mjs");
addCheck(checks, "HARNESS Core no legacy surface checker passes", noLegacySurface.status === "pass", noLegacySurface);
const gitReadiness = runNodeScript("tools/checks/workspace/check_harness_core_git_readiness.mjs");
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
    ...REQUIRED_WEAK_FINAL_PRECOMMIT_CLAIMS,
    ...REQUIRED_WEAK_RELEASE_GRADE_CLAIMS
  ],
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  legacy_reference_source_modified: protectedStatus.legacy_reference_source_modified,
  dist_modified: protectedStatus.dist_modified,
  reference_baseline_compatibility_refreshed: protectedStatus.reference_baseline_compatibility_refreshed,
  provider_verified_allowed: providerVerifiedClaimOpen,
  adapter_checked_allowed: adapterCheckedClaimOpen,
  production_ready_allowed: productionReadyClaimOpen,
  stable_allowed: stableClaimOpen,
  release_gated_allowed: releaseGatedClaimOpen,
  bare_release_gated_allowed: bareReleaseGatedClaimOpen,
  release_grade_expected_claim_flags: {
    provider_verified_allowed: providerVerifiedGatePassed,
    adapter_checked_allowed: adapterCheckedGatePassed,
    production_ready_allowed: generalReleaseGatePassed,
    stable_allowed: generalReleaseGatePassed,
    release_gated_allowed: generalReleaseGatePassed,
    bare_release_gated_allowed: generalReleaseGatePassed
  }
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
    reference_baseline_policy: "docs/workspace/reference_baseline_policy.ko.md"
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
  provider_verified_allowed: providerVerifiedClaimOpen,
  adapter_checked_allowed: adapterCheckedClaimOpen,
  production_ready_allowed: productionReadyClaimOpen,
  stable_allowed: stableClaimOpen,
  release_gated_allowed: releaseGatedClaimOpen,
  bare_release_gated_allowed: bareReleaseGatedClaimOpen
};

const currentStateClaimBoundary = {
  status: report.status === "pass" ? "recorded" : "blocked",
  stage: STAGE,
  source: "CURRENT_STATE.yaml",
  project: currentStateYaml?.project || null,
  allowed_claims: currentStateYaml?.allowed_claims || [],
  blocked_claims: currentStateYaml?.blocked_claims || [],
  canonicalization_rules: currentStateYaml?.canonicalization_rules || [],
  provider_verified_allowed: providerVerifiedClaimOpen,
  adapter_checked_allowed: adapterCheckedClaimOpen,
  production_ready_allowed: productionReadyClaimOpen,
  stable_allowed: stableClaimOpen,
  release_gated_allowed: releaseGatedClaimOpen,
  bare_release_gated_allowed: bareReleaseGatedClaimOpen,
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
  provider_verified_allowed: providerVerifiedClaimOpen,
  adapter_checked_allowed: adapterCheckedClaimOpen,
  production_ready_allowed: productionReadyClaimOpen,
  stable_allowed: stableClaimOpen,
  release_gated_allowed: releaseGatedClaimOpen,
  bare_release_gated_allowed: bareReleaseGatedClaimOpen
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
