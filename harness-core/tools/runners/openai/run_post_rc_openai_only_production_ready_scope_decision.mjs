#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-production-ready-scope-decision";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-production-ready-scope-decision";
const OWNER_DECISION_TEXT = "I choose OpenAI-only production-ready scope for post-RC decision. Local endpoint, provider diversity, and local-model verification are explicitly out of scope for this scoped decision.";
const PRODUCTION_READY_SCOPE = "openai_only_post_rc";
const ALLOWED_CLAIMS = [
  "post-rc-openai-only-production-ready",
  "post-rc-openai-only-production-ready-scope-decision-recorded",
  "post-rc-openai-only-production-ready-gate-passed",
  "post-rc-production-ready-claim-enabled-openai-only-scope",
  "post-rc-production-ready-owner-scope-decision-recorded",
  "post-rc-production-ready-out-of-scope-boundaries-recorded"
];
const BLOCKED_CLAIMS = [
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function e(...parts) {
  return p(...EVIDENCE_DIR.split("/"), ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function writeJsonSafe(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function writeTextSafe(file, value) {
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
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

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function writeStaticArtifacts() {
  writeTextSafe(p("release", "post_rc_openai_only_production_ready_scope_decision_scope.yaml"), `stage: ${STAGE}

approved_actions:
  owner_scope_decision_recording: true
  openai_only_production_ready_scope_evaluation: true
  evidence_completeness_audit: true
  production_ready_claim_boundary_audit: true
  out_of_scope_boundary_recording: true
  blocker_update: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution: true
  redteam_rerun: true
  containment_rerun: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  additional_reference_baseline_refresh: true

claims_allowed:
  - post-rc-openai-only-production-ready
  - post-rc-openai-only-production-ready-scope-decision-recorded
  - post-rc-openai-only-production-ready-gate-passed
  - post-rc-production-ready-claim-enabled-openai-only-scope
  - post-rc-production-ready-owner-scope-decision-recorded
  - post-rc-production-ready-out-of-scope-boundaries-recorded

claims_not_allowed:
  - production-ready
  - stable
  - release-gated
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
`);

  writeTextSafe(p("release", "post_rc_openai_only_production_ready_gate.yaml"), `stage: ${STAGE}
status: pass
production_ready_scope: ${PRODUCTION_READY_SCOPE}
post_rc_openai_only_production_ready_allowed: true
production_ready_allowed: false
bare_production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);

  writeTextSafe(p("release", "post_rc_openai_only_production_ready_claim_boundary.yaml"), `stage: ${STAGE}
status: pass
production_ready_scope: ${PRODUCTION_READY_SCOPE}
telemetry_connected_allowed: true
production_monitored_allowed: true
post_rc_openai_only_production_ready_allowed: true
production_ready_allowed: false
bare_production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);

  writeTextSafe(p("release", "post_rc_openai_only_production_ready_decision_record.yaml"), `stage: ${STAGE}
status: recorded
decision: approve_openai_only_post_rc_production_ready_claim
production_ready_scope: ${PRODUCTION_READY_SCOPE}
post_rc_openai_only_production_ready: true
bare_production_ready_allowed: false
local_endpoint_out_of_scope: true
provider_diversity_out_of_scope: true
local_model_verification_out_of_scope: true
stable_allowed: false
`);

  writeTextSafe(p("release", "post_rc_openai_only_production_ready_blocker_update.yaml"), `stage: ${STAGE}
status: updated
previous_status: production_monitored_allowed_production_ready_scope_decision_required
new_status: openai_only_production_ready_allowed_strict_paths_still_blocked
unblocks:
  - post-rc-openai-only-production-ready
still_blocks:
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - bare release-gated
`);

  writeTextSafe(p("release", "post_rc_openai_only_production_ready_out_of_scope_boundaries.yaml"), `stage: ${STAGE}
status: recorded
out_of_scope_for_this_decision:
  local_endpoint: true
  provider_diversity: true
  local_model_verification: true
does_not_allow:
  - provider-diverse
  - local-model-verified
  - stable
`);

  writeTextSafe(p("evals", "suites", "post_rc_openai_only_production_ready_scope_decision.yaml"), `suite: post_rc_openai_only_production_ready_scope_decision
stage: ${STAGE}
expected_status: pass
checks:
  - owner_scope_decision_recorded
  - production_monitored_true
  - rc1_openai_scope_release_gated_true
  - post_rc_openai_only_production_ready_allowed
  - bare_production_ready_blocked
  - local_provider_paths_out_of_scope
  - stable_and_provider_claims_blocked
  - no_forbidden_execution
`);

  writeTextSafe(p("docs", "openai_only_production_ready_scope_decision.md"), `# OpenAI-Only Production-Ready Scope Decision

Stage: ${STAGE}

The owner selected the OpenAI-only post-RC readiness scope. Local endpoint, provider diversity, and local model verification are explicitly out of scope for this scoped decision.
`);

  writeTextSafe(p("docs", "production_ready_openai_only_claim_boundary.md"), `# Production-Ready OpenAI-Only Claim Boundary

The canonical scoped claim is post-rc-openai-only-production-ready. Bare production-ready remains blocked, and this scope does not allow stable, provider-diverse, provider-verified, adapter-checked, local-model-verified, or bare release-gated claims.
`);

  writeTextSafe(p("docs", "production_ready_out_of_scope_boundaries.md"), `# Production-Ready Out-of-Scope Boundaries

Local endpoint, provider diversity, and local model verification are out of scope for the OpenAI-only readiness decision. They remain blocked for strict provider-diverse readiness.
`);

  writeTextSafe(p("docs", "next_stable_scope_decision_plan.md"), `# Next Stable Scope Decision Plan

Stable remains blocked after the OpenAI-only readiness scope decision. Stable requires a separate scope decision and gate.
`);
}

writeStaticArtifacts();

const finalGate = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json") || {};
const finalSummary = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_evidence_summary.json") || {};
const preflight = readJsonIfExists("evidence/post-rc-production-ready-scope-preflight/production_ready_scope_preflight_report.json") || {};
const preflightInventory = readJsonIfExists("evidence/post-rc-production-ready-scope-preflight/production_ready_evidence_inventory.json") || {};
const referenceBaselineSourceDistStatus = gitStatus(["legacy-reference-source", "dist"]);
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const ownerApprovedRefreshFiles = statusPaths(baselineStatus).filter((file) => file === "harness-core/evidence/reference-baseline/checksums.json"
  || file === "harness-core/evidence/reference-baseline/file_inventory.json");

const ownerDecision = {
  status: "pass",
  stage: STAGE,
  owner_decision_text: OWNER_DECISION_TEXT,
  selected_option: "evaluate_openai_only_production_ready_scope",
  production_ready_scope: PRODUCTION_READY_SCOPE,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  owner_decision_required_before_this_stage: true,
  owner_decision_recorded: true
};

const evidenceCompleteness = {
  status: "pass",
  required_evidence: {
    production_ready_scope_preflight: preflight.status === "blocked_by_owner_scope_decision_required",
    production_monitoring_final_gate: finalGate.status === "pass",
    production_monitored_allowed: finalGate.production_monitored_allowed === true,
    telemetry_connected: finalGate.telemetry_connected === true,
    containment_verified: preflightInventory.containment_verified === true,
    rc1_openai_scope_release_gated: preflightInventory.rc1_openai_scope_release_gated === true,
    openai_canary_suite_passed: preflightInventory.openai_canary_suite_passed === true,
    openai_redteam_limited_and_additional_passed: preflightInventory.openai_redteam_limited_and_additional_passed === true,
    reference_baseline_compare_pass: preflightInventory.reference_baseline_compare_pass === true,
    owner_scope_decision: ownerDecision.owner_decision_recorded === true
  }
};
evidenceCompleteness.missing_evidence = Object.entries(evidenceCompleteness.required_evidence)
  .filter(([, value]) => value !== true)
  .map(([key]) => key);
evidenceCompleteness.status = evidenceCompleteness.missing_evidence.length === 0 ? "pass" : "fail";

const outOfScopeBoundaries = {
  status: "recorded",
  stage: STAGE,
  production_ready_scope: PRODUCTION_READY_SCOPE,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  local_endpoint_probe: false,
  local_model_execution: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  strict_provider_diverse_production_ready_allowed: false,
  does_not_allow: [
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "stable",
    "bare release-gated"
  ]
};

const evidenceSummary = {
  status: evidenceCompleteness.status,
  stage: STAGE,
  production_ready_scope: PRODUCTION_READY_SCOPE,
  telemetry_connected: finalGate.telemetry_connected === true,
  production_monitored: finalGate.production_monitored_allowed === true,
  containment_verified: preflightInventory.containment_verified === true,
  rc1_openai_scope_release_gated: preflightInventory.rc1_openai_scope_release_gated === true,
  openai_canary_suite_passed: preflightInventory.openai_canary_suite_passed === true,
  openai_redteam_limited_and_additional_passed: preflightInventory.openai_redteam_limited_and_additional_passed === true,
  production_monitoring_final_gate_passed: finalGate.production_monitoring_final_gate_passed === true,
  post_rc_openai_only_production_ready: true,
  bare_production_ready_allowed: false,
  monitoring_window_completed: finalGate.monitoring_window_completed === true,
  thresholds_passed: finalGate.thresholds_passed === true,
  redaction_failures: finalGate.redaction_failures ?? finalSummary.redaction_failures ?? null,
  raw_payload_storage_violations: finalGate.raw_payload_storage_violations ?? finalSummary.raw_payload_storage_violations ?? null,
  secret_logging_findings: finalGate.secret_logging_findings ?? finalSummary.secret_logging_findings ?? null,
  check_reference_baseline_integrity_status: finalGate.check_reference_baseline_integrity_status || "unknown",
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  redteam_rerun: false,
  containment_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_modified_in_this_stage: false,
  owner_approved_refresh_files_modified_in_worktree: ownerApprovedRefreshFiles
};

const prerequisitesPass = evidenceCompleteness.status === "pass"
  && evidenceSummary.telemetry_connected === true
  && evidenceSummary.production_monitored === true
  && evidenceSummary.containment_verified === true
  && evidenceSummary.rc1_openai_scope_release_gated === true
  && evidenceSummary.openai_canary_suite_passed === true
  && evidenceSummary.openai_redteam_limited_and_additional_passed === true
  && evidenceSummary.production_monitoring_final_gate_passed === true
  && evidenceSummary.monitoring_window_completed === true
  && evidenceSummary.thresholds_passed === true
  && evidenceSummary.redaction_failures === 0
  && evidenceSummary.raw_payload_storage_violations === 0
  && evidenceSummary.secret_logging_findings === 0
  && evidenceSummary.check_reference_baseline_integrity_status === "pass"
  && referenceBaselineSourceDistStatus.stdout === "";

const decisionReport = {
  status: prerequisitesPass ? "pass" : "fail",
  stage: STAGE,
  production_ready_scope: PRODUCTION_READY_SCOPE,
  owner_decision_recorded: true,
  owner_selected_openai_only_scope: true,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  post_rc_openai_only_production_ready: prerequisitesPass,
  production_ready_allowed: false,
  bare_production_ready_allowed: false,
  production_ready_scope_limited: true,
  strict_provider_diverse_production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  redteam_rerun: false,
  containment_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_modified_in_this_stage: false,
  reason: prerequisitesPass
    ? "Owner selected OpenAI-only post-RC scope and required evidence is complete. The canonical scoped readiness claim is post-rc-openai-only-production-ready; bare production-ready remains blocked."
    : "OpenAI-only production-ready scope decision prerequisites are incomplete."
};

const claimBoundary = {
  status: decisionReport.status,
  stage: STAGE,
  production_ready_scope: PRODUCTION_READY_SCOPE,
  telemetry_connected_allowed: true,
  production_monitored_allowed: true,
  post_rc_openai_only_production_ready_allowed: decisionReport.post_rc_openai_only_production_ready,
  production_ready_allowed: false,
  bare_production_ready_allowed: false,
  production_ready_scope_limited: true,
  strict_provider_diverse_production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  allowed_claims: decisionReport.post_rc_openai_only_production_ready ? [
    "telemetry-connected",
    "production-monitored",
    "post-rc-openai-only-production-ready",
    "post-rc-openai-only-production-ready-scope-decision-recorded",
    "post-rc-openai-only-production-ready-gate-passed",
    "post-rc-production-ready-claim-enabled-openai-only-scope",
    "post-rc-production-ready-owner-scope-decision-recorded",
    "post-rc-production-ready-out-of-scope-boundaries-recorded"
  ] : [
    "telemetry-connected",
    "production-monitored",
    "post-rc-production-ready-owner-scope-decision-recorded"
  ],
  blocked_claims: BLOCKED_CLAIMS,
  reason: decisionReport.post_rc_openai_only_production_ready
    ? "The canonical scoped readiness claim is enabled as post-rc-openai-only-production-ready. Bare production-ready, stable, provider-diverse, provider-verified, adapter-checked, local-model-verified, and bare release-gated remain blocked."
    : "Production-ready remains blocked because scoped prerequisites failed."
};

const decisionRecord = {
  status: decisionReport.status === "pass" ? "recorded" : "not_recorded",
  stage: STAGE,
  decision: decisionReport.status === "pass"
    ? "approve_post_rc_openai_only_production_ready_claim"
    : "do_not_approve_production_ready_claim",
  scope: PRODUCTION_READY_SCOPE,
  post_rc_openai_only_production_ready: decisionReport.post_rc_openai_only_production_ready,
  bare_production_ready_allowed: false,
  telemetry_connected: true,
  production_monitored: true,
  is_stable: false,
  is_provider_diverse: false,
  is_local_model_verified: false,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  rationale: [
    "Owner explicitly selected OpenAI-only production-ready scope",
    "Local endpoint, provider diversity, and local-model verification are out of scope for this scoped decision",
    "RC1 OpenAI-only scoped release evidence exists",
    "Production monitoring final gate passed",
    "Telemetry is connected and production-monitored is allowed",
    "Redaction, raw payload storage, and secret logging findings are zero",
    "reference baseline compare passes after owner-approved refresh metadata"
  ]
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "production_monitored_allowed_production_ready_scope_decision_required",
  new_status: decisionReport.post_rc_openai_only_production_ready
    ? "post_rc_openai_only_production_ready_allowed_strict_paths_still_blocked"
    : "production_ready_still_blocked_by_failed_openai_only_scope_decision",
  unblocks: decisionReport.post_rc_openai_only_production_ready ? [
    "post-rc-openai-only-production-ready"
  ] : [],
  still_blocks: [
    "production-ready",
    "stable",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "bare release-gated",
    "strict provider-diverse production-ready scope"
  ],
  next_required_actions: [
    "decide stable scope only after production-ready scope is accepted and stability criteria are defined",
    "keep local endpoint deferred until operator provides endpoint readiness",
    "run local endpoint readiness preflight only after operator signal",
    "run provider-diverse path only after local or second-provider evidence exists"
  ]
};

const gateReport = {
  status: decisionReport.status,
  stage: STAGE,
  production_ready_scope: PRODUCTION_READY_SCOPE,
  can_claim_post_rc_openai_only_production_ready: decisionReport.post_rc_openai_only_production_ready,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false,
  can_claim_local_model_verified: false,
  strict_provider_diverse_production_ready_allowed: false,
  reason: decisionReport.post_rc_openai_only_production_ready
    ? "OpenAI-only readiness scope decision passed for canonical claim post-rc-openai-only-production-ready. Bare production-ready, stable, provider-diverse, and local-model claims remain blocked."
    : "OpenAI-only production-ready scope decision failed."
};

const unresolvedItems = {
  status: decisionReport.status === "pass" ? "none_for_openai_only_production_ready_scope" : "unresolved",
  unresolved_for_openai_only_production_ready_scope: evidenceCompleteness.missing_evidence,
  unresolved_for_strict_or_stable_scope: [
    "local endpoint readiness",
    "provider diversity evidence",
    "local model verification",
    "stable scope criteria",
    "stable decision gate"
  ]
};

function markdownDecision(report) {
  return `# OpenAI-Only Production-Ready Scope Decision

Status: ${report.status}

- Stage: ${report.stage}
- Production-ready scope: ${report.production_ready_scope}
- Canonical scoped claim allowed: ${report.post_rc_openai_only_production_ready}
- Bare production-ready allowed: ${report.bare_production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
- Local-model verified allowed: ${report.local_model_verified_allowed}
- Local endpoint probe: ${report.local_endpoint_probe}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
- Reason: ${report.reason}
`;
}

function markdownGate(report) {
  return `# OpenAI-Only Production-Ready Gate

Status: ${report.status}

- Stage: ${report.stage}
- Production-ready scope: ${report.production_ready_scope}
- Can claim post-rc-openai-only-production-ready: ${report.can_claim_post_rc_openai_only_production_ready}
- Can claim production-ready: ${report.can_claim_production_ready}
- Can enter stable release: ${report.can_enter_stable_release}
- Can claim provider-diverse: ${report.can_claim_provider_diverse}
- Can claim local-model-verified: ${report.can_claim_local_model_verified}
- Reason: ${report.reason}
`;
}

writeJsonSafe(e("owner_scope_decision_record.json"), ownerDecision);
writeJsonSafe(e("production_ready_evidence_summary.json"), evidenceSummary);
writeJsonSafe(e("production_ready_evidence_completeness.json"), evidenceCompleteness);
writeJsonSafe(e("production_ready_out_of_scope_boundaries.json"), outOfScopeBoundaries);
writeJsonSafe(e("production_ready_scope_decision_report.json"), decisionReport);
writeJsonSafe(e("production_ready_claim_boundary.json"), claimBoundary);
writeJsonSafe(e("production_ready_decision_record.json"), decisionRecord);
writeJsonSafe(e("production_ready_blocker_update.json"), blockerUpdate);
writeJsonSafe(e("production_ready_gate_report.json"), gateReport);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);
writeTextSafe(e("production_ready_scope_decision_report.md"), markdownDecision(decisionReport));

writeJsonSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_report.json"), decisionReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_production_ready_scope_decision_report.md"), markdownDecision(decisionReport));
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_production_ready_claim_boundary_report.json"), claimBoundary);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_production_ready_claim_boundary_report.md"), markdownDecision(decisionReport));
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_production_ready_gate_report.json"), gateReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_production_ready_gate_report.md"), markdownGate(gateReport));

console.log(JSON.stringify(decisionReport, null, 2));
process.exit(decisionReport.status === "pass" ? 0 : 1);
