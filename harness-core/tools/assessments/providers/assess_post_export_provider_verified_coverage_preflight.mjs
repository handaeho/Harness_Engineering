#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-export-provider-verified-coverage-completion-preflight";
const EVIDENCE_DIR = "evidence/post-export-provider-verified-coverage-preflight";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-rc.1-postrc-openai-local-provider-diverse-export";
const WEAK_STAGE_CLAIMS = [
  "post-export-provider-verified-coverage-preflight-recorded"
];
const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const MAINTAINED_CONTEXT_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function workspaceRoot() {
  return path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;
}

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(relPath), value);
}

function writeTextRel(relPath, value) {
  writeText(p(relPath), value);
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function protectedPathStatus() {
  const status = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"]);
  const paths = statusPaths(status);
  return {
    git_status: status,
    observed_dirty_paths: paths,
    reference_baseline_git_dirty: paths.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_git_dirty: paths.some((file) => file.startsWith("dist/") || file === "dist"),
    evidence_reference_baseline_git_dirty: paths.some((file) => file.startsWith("harness-core/evidence/reference-baseline/") || file === "harness-core/evidence/reference-baseline"),
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    interpretation: "The modified flags are scoped to this preflight stage. Observed git dirty paths are recorded separately and are not written by this tool."
  };
}

function source(relPath) {
  const json = relPath.endsWith(".json") ? readJsonIfExists(relPath) : null;
  return {
    path: relPath,
    exists: exists(relPath),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function sourcePassed(relPath) {
  return readJsonIfExists(relPath)?.status === "pass";
}

function noExecutionFlags(extra = {}) {
  return {
    openai_model_api_call: false,
    openai_provider_rerun: false,
    new_local_model_execution: false,
    new_local_model_generation: false,
    qwen3_model_pull_or_download: false,
    adapter_conformance_rerun_with_generation: false,
    telemetry_sink_write: false,
    npm_install_or_ci: false,
    prompt_stack_reference_baseline_source_modified: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function claimBoundary() {
  return {
    status: "pass",
    stage: STAGE,
    provider_diverse_allowed: true,
    local_model_verified_allowed: true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false,
    allowed_claims: [
      "provider-diverse",
      "local-model-verified"
    ],
    maintained_scoped_or_prior_claims: MAINTAINED_CONTEXT_CLAIMS,
    weak_stage_claims_allowed: WEAK_STAGE_CLAIMS,
    blocked_claims: BLOCKED_STRONG_CLAIMS,
    reason: "Provider-verified requires additional provider-level coverage beyond provider-diverse and local-model-verified."
  };
}

function writeMarkdownReport(relPath, title, lines) {
  writeTextRel(relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function writeYamlRel(relPath, lines) {
  writeTextRel(relPath, lines.join("\n"));
}

function missingItem(id, lane, currentEvidence, neededForProviderVerified, recommendedNextAction) {
  return {
    id,
    lane,
    status: "partial_or_missing",
    current_evidence: currentEvidence,
    needed_for_provider_verified: neededForProviderVerified,
    recommended_next_action: recommendedNextAction
  };
}

const sourceEvidence = {
  provider_diverse_final_gate: source("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json"),
  provider_diverse_final_summary: source("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_evidence_summary.json"),
  openai_provider_diverse_lane_summary: source("evidence/post-combined-provider-diverse-evidence-inventory/openai_lane_evidence_summary.json"),
  ollama_provider_diverse_lane_summary: source("evidence/post-combined-provider-diverse-evidence-inventory/ollama_qwen3_lane_evidence_summary.json"),
  local_model_verified_final_handoff: source("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json"),
  local_model_verification_final_gate: source("evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json"),
  openai_adapter_contract: source("adapters/api/openai/adapter.yaml"),
  ollama_adapter_contract: source("adapters/local/ollama/adapter.yaml"),
  provider_capability_matrix: source("adapters/provider_capability_matrix.yaml"),
  openai_provider_canary: source("evidence/beta-provider-canary-openai/provider_canary_report.json"),
  openai_canary_replay_suite: source("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"),
  openai_redteam_limited_execution: source("evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"),
  openai_storage_redaction_audit: source("evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json"),
  openai_stable_final_handoff: source("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json"),
  ollama_local_redteam_bounded_smoke: source("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json"),
  ollama_local_replay_regression_smoke: source("evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json"),
  ollama_structured_output_smoke: source("evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"),
  ollama_tool_calling_mock_smoke: source("evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"),
  ollama_local_redaction_storage_audit: source("evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json"),
  ollama_adapter_conformance: source("evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json"),
  prior_provider_verified_preflight_openai: source("evidence/post-combined-provider-verified-gate-preflight/openai_provider_verification_evidence_inventory.json"),
  prior_provider_verified_preflight_ollama: source("evidence/post-combined-provider-verified-gate-preflight/ollama_provider_verification_evidence_inventory.json")
};

const openaiCanaryReplay = readJsonIfExists("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json") || {};
const openaiRedteam = readJsonIfExists("evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json") || {};
const localFinalSummary = readJsonIfExists("evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_evidence_summary.json") || {};

const openaiMissing = [
  missingItem(
    "openai_provider_error_handling_review_unknown_or_partial",
    "openai_api_lane",
    "OpenAI provider canary, canary-suite, redaction, and limited redteam evidence exist, but no provider-level error handling review is recorded for this final claim.",
    "Provider-specific error handling, retry/failure behavior, and API-surface edge handling must be reviewed at provider level.",
    "Add a non-generative provider error-handling review or approved final-gate evidence packet before opening provider-verified."
  ),
  missingItem(
    "openai_provider_contract_regression_evidence_incomplete",
    "openai_api_lane",
    `Canary replay suite status is ${openaiCanaryReplay.status || "unknown"} with comparison_mode ${openaiCanaryReplay.comparison_mode || "unknown"}.`,
    "Provider-verified needs provider-level regression/replay evidence stronger than canary-suite-only rerun consistency.",
    "Record provider-level regression evidence or explicitly scoped replay review for OpenAI."
  )
];

const ollamaMissing = [
  missingItem(
    "ollama_provider_error_handling_review_unknown_or_partial",
    "ollama_qwen3_local_lane",
    "Local no-tool, structured-output smoke, mock tool-calling smoke, redteam, replay, and adapter reviews exist, but provider-level error handling remains unknown_or_partial.",
    "Provider-specific local runtime fallback, error, and malformed response behavior must be reviewed for qwen3 local lane.",
    "Add non-generative error-handling review or approved provider final-gate evidence."
  ),
  missingItem(
    "ollama_provider_replay_or_regression_evidence_partial",
    "ollama_qwen3_local_lane",
    "Local replay/regression smoke passed for no-tool, structured-output smoke, and tool-calling mock smoke.",
    "Provider-verified needs final-gate provider-level replay/regression coverage, not only smoke/regression summaries.",
    "Promote the smoke/regression evidence into an explicit provider-level final gate or record the missing coverage as blocker."
  ),
  missingItem(
    "ollama_structured_output_coverage_partial_smoke_only",
    "ollama_qwen3_local_lane",
    "Structured-output smoke evidence exists for qwen3:14b and qwen3.6:27b.",
    "Provider-verified needs provider-level structured-output coverage with final-gate acceptance criteria.",
    "Record structured-output provider coverage acceptance or keep this as partial coverage."
  ),
  missingItem(
    "ollama_tool_calling_coverage_partial_mock_only",
    "ollama_qwen3_local_lane",
    "Tool-calling mock smoke evidence exists, with external tool execution disabled.",
    "Provider-verified needs provider-level tool-calling coverage suitable for the claimed runtime surface.",
    "Record provider-level tool-calling coverage or explicitly constrain the provider-verified scope."
  )
];

const globalMissing = [
  missingItem(
    "full_provider_verified_final_gate_not_executed",
    "all_lanes",
    "Provider-diverse and local-model-verified final gates passed, but provider-verified final gate has not been executed.",
    "A dedicated provider-verified final gate must evaluate all required provider-level coverage and claim boundaries.",
    "Do not open provider-verified in this stage; run a final gate only after the missing coverage is closed."
  ),
  missingItem(
    "owner_final_decision_required_after_coverage_completion",
    "all_lanes",
    "No owner final decision for provider-verified is recorded in this post-export preflight.",
    "Provider-verified requires owner acceptance after complete evidence coverage.",
    "Prepare owner decision packet only after final-gate coverage is ready."
  )
];

const missingOrPartialCoverage = [...openaiMissing, ...ollamaMissing, ...globalMissing];

const openaiInventory = {
  status: "partial",
  stage: STAGE,
  lane_id: "openai_api_lane",
  provider_family: "openai",
  provider_contract_documented: exists("adapters/api/openai/adapter.yaml"),
  execution_evidence_exists: sourcePassed("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json")
    || sourcePassed("evidence/beta-provider-canary-openai/provider_canary_report.json"),
  canary_evidence_exists: sourcePassed("evidence/beta-provider-canary-openai/provider_canary_report.json"),
  redteam_evidence_exists: sourcePassed("evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"),
  redteam_evidence_scope: "limited_execution_evidence_exists_not_redteam_pass_claim",
  redteam_pass_claim_allowed: openaiRedteam.redteam_passed === true,
  replay_or_regression_evidence_exists: sourcePassed("evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"),
  replay_or_regression_coverage_strength: "canary_suite_only_not_replay_verified",
  error_handling_reviewed: "unknown_or_partial",
  capability_matrix_reviewed: exists("adapters/provider_capability_matrix.yaml"),
  storage_redaction_reviewed: sourcePassed("evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json"),
  provider_verified_ready: false,
  source_evidence: {
    adapter_contract: sourceEvidence.openai_adapter_contract,
    final_handoff: sourceEvidence.openai_stable_final_handoff,
    provider_canary: sourceEvidence.openai_provider_canary,
    canary_replay_suite: sourceEvidence.openai_canary_replay_suite,
    redteam_limited_execution: sourceEvidence.openai_redteam_limited_execution,
    storage_redaction_audit: sourceEvidence.openai_storage_redaction_audit,
    capability_matrix: sourceEvidence.provider_capability_matrix
  },
  missing_or_partial_coverage: openaiMissing.map((item) => item.id)
};

const ollamaInventory = {
  status: "partial",
  stage: STAGE,
  lane_id: "ollama_qwen3_local_lane",
  provider_family: "ollama_local",
  models_in_input_evidence: localFinalSummary.models || ["qwen3:14b", "qwen3.6:27b"],
  provider_contract_documented: exists("adapters/local/ollama/adapter.yaml"),
  execution_evidence_exists: sourcePassed("evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json")
    || sourcePassed("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json"),
  local_model_verified: localFinalSummary.local_redteam_bounded_smoke_passed === true
    || sourcePassed("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json"),
  redteam_evidence_exists: sourcePassed("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json"),
  replay_or_regression_evidence_exists: "partial",
  replay_or_regression_coverage_strength: "local_smoke_regression_only",
  structured_output_coverage: "partial_smoke_only",
  tool_calling_coverage: "partial_mock_smoke_only",
  error_handling_reviewed: "unknown_or_partial",
  capability_matrix_reviewed: sourcePassed("evidence/post-stable-local-ollama-adapter-conformance/local_ollama_provider_capability_matrix_review.json")
    || exists("adapters/provider_capability_matrix.yaml"),
  storage_redaction_reviewed: sourcePassed("evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json")
    || sourcePassed("evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_storage_redaction_review.json"),
  provider_verified_ready: false,
  source_evidence: {
    adapter_contract: sourceEvidence.ollama_adapter_contract,
    local_model_verified_final_handoff: sourceEvidence.local_model_verified_final_handoff,
    local_model_verification_final_gate: sourceEvidence.local_model_verification_final_gate,
    local_redteam_bounded_smoke: sourceEvidence.ollama_local_redteam_bounded_smoke,
    local_replay_regression_smoke: sourceEvidence.ollama_local_replay_regression_smoke,
    local_structured_output_smoke: sourceEvidence.ollama_structured_output_smoke,
    local_tool_calling_mock_smoke: sourceEvidence.ollama_tool_calling_mock_smoke,
    local_redaction_storage_audit: sourceEvidence.ollama_local_redaction_storage_audit,
    adapter_conformance: sourceEvidence.ollama_adapter_conformance,
    capability_matrix: sourceEvidence.provider_capability_matrix
  },
  missing_or_partial_coverage: ollamaMissing.map((item) => item.id)
};

const coverageMatrix = {
  status: "recorded",
  stage: STAGE,
  provider_verified_allowed: false,
  provider_lanes: {
    openai_api_lane: {
      provider_contract_documented: openaiInventory.provider_contract_documented,
      execution_evidence_exists: openaiInventory.execution_evidence_exists,
      canary_evidence_exists: openaiInventory.canary_evidence_exists,
      redteam_evidence_exists: openaiInventory.redteam_evidence_exists,
      replay_or_regression_evidence_exists: openaiInventory.replay_or_regression_evidence_exists,
      replay_or_regression_coverage_strength: openaiInventory.replay_or_regression_coverage_strength,
      error_handling_reviewed: openaiInventory.error_handling_reviewed,
      capability_matrix_reviewed: openaiInventory.capability_matrix_reviewed,
      storage_redaction_reviewed: openaiInventory.storage_redaction_reviewed
    },
    ollama_qwen3_local_lane: {
      provider_contract_documented: ollamaInventory.provider_contract_documented,
      execution_evidence_exists: ollamaInventory.execution_evidence_exists,
      local_model_verified: ollamaInventory.local_model_verified,
      redteam_evidence_exists: ollamaInventory.redteam_evidence_exists,
      replay_or_regression_evidence_exists: ollamaInventory.replay_or_regression_evidence_exists,
      replay_or_regression_coverage_strength: ollamaInventory.replay_or_regression_coverage_strength,
      structured_output_coverage: ollamaInventory.structured_output_coverage,
      tool_calling_coverage: ollamaInventory.tool_calling_coverage,
      error_handling_reviewed: ollamaInventory.error_handling_reviewed,
      capability_matrix_reviewed: ollamaInventory.capability_matrix_reviewed,
      storage_redaction_reviewed: ollamaInventory.storage_redaction_reviewed
    }
  },
  missing_or_partial_coverage: missingOrPartialCoverage.map((item) => item.id),
  can_enter_provider_verified_final_gate: false
};

const boundary = claimBoundary();
const protectedStatus = protectedPathStatus();
const blockerUpdate = {
  status: "blocked_by_missing_provider_coverage",
  stage: STAGE,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  can_enter_provider_verified_final_gate: false,
  blockers: missingOrPartialCoverage.map((item) => item.id),
  resolved_input_evidence_used: [
    "provider-diverse",
    "local-model-verified"
  ],
  recommended_next_action: "Close provider-level error handling and regression/replay gaps, then request a dedicated provider-verified final gate."
};

const report = {
  status: "blocked_by_missing_provider_coverage",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  provider_verified_coverage_preflight_completed: true,
  provider_diverse_allowed: true,
  local_model_verified_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  can_enter_provider_verified_final_gate: false,
  source_evidence: sourceEvidence,
  provider_lanes: {
    openai_api_lane: {
      status: openaiInventory.status,
      coverage_summary: "OpenAI provider contract, execution/canary, limited redteam, canary-suite replay, capability matrix, and storage redaction evidence exist; error handling and provider-level regression coverage remain partial."
    },
    ollama_qwen3_local_lane: {
      status: ollamaInventory.status,
      coverage_summary: "Ollama qwen3 local execution, local-model-verified, redteam, structured-output smoke, tool-calling mock smoke, replay/regression smoke, capability matrix review, and storage redaction evidence exist; provider-level error handling and final-gate coverage remain partial."
    }
  },
  missing_or_partial_coverage: missingOrPartialCoverage,
  missing_or_partial_coverage_count: missingOrPartialCoverage.length,
  weak_stage_claims_allowed: WEAK_STAGE_CLAIMS,
  blocked_claims: BLOCKED_STRONG_CLAIMS,
  protected_path_status: protectedStatus,
  reason: "Provider-verified coverage preflight recorded current coverage and gaps. Final claim remains blocked.",
  ...noExecutionFlags({ provider_diverse_allowed: true, local_model_verified_allowed: true })
};

writeJsonRel(`${EVIDENCE_DIR}/provider_verified_coverage_preflight_report.json`, report);
writeJsonRel(`${EVIDENCE_DIR}/openai_provider_coverage_inventory.json`, openaiInventory);
writeJsonRel(`${EVIDENCE_DIR}/ollama_provider_coverage_inventory.json`, ollamaInventory);
writeJsonRel(`${EVIDENCE_DIR}/provider_verified_coverage_matrix.json`, coverageMatrix);
writeJsonRel(`${EVIDENCE_DIR}/provider_verified_missing_coverage.json`, {
  status: "blocked_by_missing_provider_coverage",
  stage: STAGE,
  provider_verified_allowed: false,
  can_enter_provider_verified_final_gate: false,
  missing_or_partial_coverage_count: missingOrPartialCoverage.length,
  missing_or_partial_coverage: missingOrPartialCoverage
});
writeJsonRel(`${EVIDENCE_DIR}/provider_verified_claim_boundary.json`, boundary);
writeJsonRel(`${EVIDENCE_DIR}/provider_verified_blocker_update.json`, blockerUpdate);
writeJsonRel(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: "blocked",
  stage: STAGE,
  unresolved_items_count: missingOrPartialCoverage.length,
  unresolved_items: missingOrPartialCoverage
});

writeYamlRel("release/scopes/post-export/post_export_provider_verified_coverage_preflight_scope.yaml", [
  `stage: ${STAGE}`,
  "status: blocked_by_missing_provider_coverage",
  `scope: ${SCOPE}`,
  `archive_label: ${ARCHIVE_LABEL}`,
  "mode: coverage_inventory_preflight_only",
  "provider_diverse_allowed: true",
  "local_model_verified_allowed: true",
  "provider_verified_allowed: false",
  "adapter_checked_allowed: false",
  "production_ready_allowed: false",
  "stable_allowed: false",
  "release_gated_allowed: false",
  "can_enter_provider_verified_final_gate: false",
  "openai_model_api_call: false",
  "openai_provider_rerun: false",
  "new_local_model_execution: false",
  "telemetry_sink_write: false",
  "npm_install_or_ci: false",
  "reference_baseline_source_modified: false",
  "dist_modified: false",
  "evidence_reference_baseline_modified: false"
]);
writeYamlRel("release/matrices/post-export/post_export_provider_verified_coverage_matrix.yaml", [
  `stage: ${STAGE}`,
  "status: recorded",
  "provider_verified_allowed: false",
  "can_enter_provider_verified_final_gate: false",
  "provider_lanes:",
  "  openai_api_lane:",
  `    status: ${openaiInventory.status}`,
  `    error_handling_reviewed: ${openaiInventory.error_handling_reviewed}`,
  `    replay_or_regression_coverage_strength: ${openaiInventory.replay_or_regression_coverage_strength}`,
  "  ollama_qwen3_local_lane:",
  `    status: ${ollamaInventory.status}`,
  `    error_handling_reviewed: ${ollamaInventory.error_handling_reviewed}`,
  `    replay_or_regression_evidence_exists: ${ollamaInventory.replay_or_regression_evidence_exists}`,
  `    structured_output_coverage: ${ollamaInventory.structured_output_coverage}`,
  `    tool_calling_coverage: ${ollamaInventory.tool_calling_coverage}`,
  "missing_or_partial_coverage:",
  ...missingOrPartialCoverage.map((item) => `  - ${item.id}`)
]);
writeYamlRel("release/claims/post-export/post_export_provider_verified_claim_boundary.yaml", [
  `stage: ${STAGE}`,
  "status: pass",
  "provider_diverse_allowed: true",
  "local_model_verified_allowed: true",
  "provider_verified_allowed: false",
  "adapter_checked_allowed: false",
  "production_ready_allowed: false",
  "stable_allowed: false",
  "release_gated_allowed: false",
  "allowed_claims:",
  "  - provider-diverse",
  "  - local-model-verified",
  "blocked_claims:",
  ...BLOCKED_STRONG_CLAIMS.map((claim) => `  - ${claim}`)
]);
writeYamlRel("release/blockers/post-export/post_export_provider_verified_blocker_update.yaml", [
  `stage: ${STAGE}`,
  "status: blocked_by_missing_provider_coverage",
  "provider_verified_allowed: false",
  "can_enter_provider_verified_final_gate: false",
  "blockers:",
  ...missingOrPartialCoverage.map((item) => `  - ${item.id}`)
]);
writeYamlRel("evals/suites/post_export_provider_verified_coverage_preflight.yaml", [
  "suite_id: post_export_provider_verified_coverage_preflight",
  `stage: ${STAGE}`,
  "mode: coverage_inventory_preflight_only",
  "required_outputs:",
  "  - evidence/post-export-provider-verified-coverage-preflight/provider_verified_coverage_preflight_report.json",
  "  - evidence/post-export-provider-verified-coverage-preflight/openai_provider_coverage_inventory.json",
  "  - evidence/post-export-provider-verified-coverage-preflight/ollama_provider_coverage_inventory.json",
  "  - evidence/post-export-provider-verified-coverage-preflight/provider_verified_coverage_matrix.json",
  "  - evidence/post-export-provider-verified-coverage-preflight/provider_verified_missing_coverage.json",
  "forbidden_actions:",
  "  openai_model_api_call: false",
  "  openai_provider_rerun: false",
  "  new_local_model_execution: false",
  "  telemetry_sink_write: false",
  "  npm_install_or_ci: false",
  "expected_claim_boundary:",
  "  provider_verified_allowed: false",
  "  adapter_checked_allowed: false",
  "  production_ready_allowed: false",
  "  stable_allowed: false",
  "  release_gated_allowed: false"
]);

writeJsonRel("evals/reports/post_export_provider_verified_coverage_preflight_report.json", report);
writeMarkdownReport("evals/reports/post_export_provider_verified_coverage_preflight_report.md", "Post Export Provider-Verified Coverage Preflight Report", [
  `Status: ${report.status}`,
  "",
  `- Stage: ${STAGE}`,
  "- Provider-diverse allowed: true",
  "- Local-model-verified allowed: true",
  "- Provider-verified allowed: false",
  "- Can enter provider-verified final gate: false",
  `- Missing or partial coverage: ${missingOrPartialCoverage.length}`,
  "- OpenAI: contract/execution/canary/redteam/redaction evidence exists; error handling and provider-level regression coverage remain partial.",
  "- Ollama: local-model/redteam/replay smoke/structured smoke/tool mock evidence exists; provider-level error handling and final-gate coverage remain partial."
]);

writeMarkdownReport("docs/providers/provider_verified_coverage_preflight.ko.md", "Provider-Verified Coverage Preflight", [
  "이번 단계는 `provider-verified`를 여는 단계가 아니라 post-export 상태의 provider-level coverage를 inventory하는 단계입니다.",
  "",
  "- `provider-diverse`: 유지 허용",
  "- `local-model-verified`: 유지 허용",
  "- `provider-verified`: 미허용",
  "- `adapter-checked`, `production-ready`, `stable`, `release-gated`: 미허용",
  "- OpenAI API call / local generation / telemetry write / npm install: 수행하지 않음",
  "",
  "결론: coverage gap이 남아 있어 provider-verified final gate에 진입하지 않습니다."
]);
writeMarkdownReport("docs/providers/provider_verified_coverage_matrix.ko.md", "Provider-Verified Coverage Matrix", [
  "OpenAI와 Ollama qwen3 local lane을 분리해 coverage를 기록했습니다.",
  "",
  "- OpenAI: contract, execution/canary, limited redteam, canary-suite replay, capability matrix, storage redaction evidence는 존재합니다.",
  "- OpenAI gap: provider-level error handling review, provider-level regression/replay acceptance.",
  "- Ollama: contract, local-model-verified execution, bounded redteam, local replay/regression smoke, structured-output smoke, tool-calling mock smoke, capability matrix, storage redaction evidence는 존재합니다.",
  "- Ollama gap: provider-level error handling review, replay/regression final-gate coverage, structured-output/tool-calling coverage의 provider-level acceptance."
]);
writeMarkdownReport("docs/providers/provider_verified_missing_coverage.ko.md", "Provider-Verified Missing Coverage", [
  "Provider-verified를 열기 전 필요한 blocker입니다.",
  "",
  ...missingOrPartialCoverage.map((item) => `- ${item.id}: ${item.recommended_next_action}`)
]);
writeMarkdownReport("docs/plans/next_provider_verified_final_gate_plan.ko.md", "Next Provider-Verified Final Gate Plan", [
  "현재는 final gate 진입 전 coverage gap이 남아 있습니다.",
  "",
  "다음 조건이 충족될 때만 final gate를 열 수 있습니다.",
  "",
  "- OpenAI provider-level error handling review 보강",
  "- OpenAI provider-level regression/replay acceptance 보강",
  "- Ollama provider-level error handling review 보강",
  "- Ollama structured-output/tool-calling coverage를 smoke/mock 수준에서 final-gate acceptance 수준으로 승격하거나 claim scope를 명시적으로 제한",
  "- owner final decision packet 준비",
  "",
  "`provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`는 계속 blocked입니다."
]);
writeMarkdownReport("docs/plans/next_adapter_checked_coverage_plan.ko.md", "Next Adapter-Checked Coverage Plan", [
  "`adapter-checked`는 이번 provider-verified coverage preflight에서 열지 않습니다.",
  "",
  "다음 단계에서는 OpenAI/Ollama adapter mapping, structured-output/tool-calling mapping, error mapping, cross-adapter contract, replay/regression coverage를 별도 matrix로 확인해야 합니다.",
  "",
  "현재 claim boundary에서는 `adapter-checked`도 계속 blocked입니다."
]);

console.log(JSON.stringify(report, null, 2));
process.exit(report.provider_verified_allowed === false && report.can_enter_provider_verified_final_gate === false ? 0 : 1);
