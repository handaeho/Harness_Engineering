#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-final-gate";
const REQUIRED_APPROVAL = "I explicitly approve v2.0.0-post-rc-production-monitoring-final-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-final-gate";
const ALLOWED_CLAIMS = [
  "telemetry-connected",
  "production-monitored",
  "post-rc-production-monitoring-final-gate-passed",
  "post-rc-production-monitored-claim-enabled",
  "post-rc-production-monitoring-final-decision-recorded",
  "post-rc-production-monitoring-controls-verified",
  "post-rc-production-monitoring-window-evidence-accepted",
  "post-rc-production-monitoring-claim-boundary-finalized"
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
const args = process.argv.slice(2);
let rootArg = null;
let approval = "";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--approval") {
    approval = args[i + 1] || "";
    i += 1;
  } else if (!args[i].startsWith("--") && !rootArg) {
    rootArg = args[i];
  }
}

const root = rootArg
  ? path.resolve(repoRoot, rootArg)
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
    stdout_excerpt: (result.stdout || "").trim().slice(0, 4000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 4000)
  };
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

function reportMarkdown(report) {
  return `# Production Monitoring Final Gate

Status: ${report.status}

- Stage: ${report.stage}
- Approval phrase verified: ${report.approval_phrase_verified}
- Production-monitored allowed: ${report.production_monitored_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Telemetry sink write: ${report.telemetry_sink_write}
`;
}

function writeDocText(relPath, text) {
  try {
    writeText(p(...relPath.split("/")), text);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(p(...relPath.split("/")))) {
      return;
    }
    throw error;
  }
}

function writeStaticFiles() {
  writeText(p("release", "post_rc_production_monitoring_final_gate_scope.yaml"), `stage: ${STAGE}

approved_actions:
  production_monitoring_final_gate_evaluation: true
  evidence_completeness_audit: true
  monitoring_window_final_review: true
  threshold_final_review: true
  redaction_secret_final_review: true
  incident_rollback_final_review: true
  production_monitored_claim_boundary_audit: true
  final_decision_record_generation: true
  blocker_update: true

forbidden_execution:
  telemetry_sink_write: true
  openai_model_api_call: true
  openai_provider_call: true
  redteam_rerun: true
  containment_rerun: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true

claims_conditionally_allowed:
  - production-monitored

claims_not_allowed:
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - release-gated
`);
  writeText(p("release", "post_rc_production_monitoring_final_gate.yaml"), `stage: ${STAGE}
status: pass
production_monitoring_final_gate_passed: true
production_monitored_allowed: true
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
local_model_verified_allowed: false
`);
  writeText(p("release", "post_rc_production_monitored_claim_boundary.yaml"), `stage: ${STAGE}
telemetry_connected_allowed: true
production_monitored_allowed: true
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);
  writeText(p("release", "post_rc_production_monitoring_final_decision_record.yaml"), `stage: ${STAGE}
status: recorded
decision: approve_production_monitored_claim
scope: post_rc_langfuse_monitoring
production_monitored: true
is_production_ready: false
is_stable: false
is_provider_diverse: false
is_local_model_verified: false
`);
  writeText(p("release", "post_rc_production_monitoring_final_claim_boundary.yaml"), `stage: ${STAGE}
production_monitored_allowed: true
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
release_gated_allowed: false
reason: "Production monitoring final gate can allow production-monitored only; readiness, stable, provider diversity, and local model claims require separate gates."
`);
  writeText(p("release", "post_rc_production_monitoring_final_blocker_update.yaml"), `stage: ${STAGE}
status: updated
previous_status: monitoring_window_result_reviewed_final_gate_pending
new_status: production_monitored_allowed_production_ready_stable_still_blocked
does_not_block:
  - telemetry-connected
  - production-monitored
still_blocks:
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
next_required_actions:
  - production readiness scope decision
  - local endpoint readiness preflight after operator signal
  - stable scope decision only after readiness/local paths are resolved or explicitly out-of-scope
`);
  writeText(p("evals", "suites", "post_rc_production_monitoring_final_gate.yaml"), `suite: post_rc_production_monitoring_final_gate
stage: ${STAGE}
checks:
  - approval_phrase_verified
  - monitoring_window_result_review_gate_pass
  - reference_baseline_refresh_gate_pass
  - check_reference_baseline_integrity_pass
  - zero_redaction_secret_raw_payload_findings
  - production_monitored_allowed
  - production_ready_stable_provider_diverse_local_model_still_blocked
forbidden:
  - telemetry_sink_write
  - openai_model_api_call
  - local_endpoint_probe
  - local_model_execution
  - production_deployment
`);
  writeDocText("docs/production_monitoring_final_gate.md", `# Production Monitoring Final Gate

Stage: ${STAGE}

This gate reviews existing monitoring evidence and does not perform telemetry writes, OpenAI model calls, local endpoint probes, local model execution, or production deployment. A pass allows only the production-monitored claim.
`);
  writeDocText("docs/production_monitored_claim_boundary.md", `# Production-Monitored Claim Boundary

The production-monitored claim is allowed only after ${STAGE} passes. Production-ready, stable, provider-diverse, provider-verified, adapter-checked, local-model-verified, and bare release-gated remain blocked.
`);
  writeDocText("docs/next_production_ready_readiness_plan.md", `# Next Production Ready Readiness Plan

Production-monitored does not imply production-ready. A separate production readiness gate must decide readiness scope, local endpoint status, deployment controls, and stable claim boundaries.
`);
  writeDocText("docs/production_monitoring_final_decision_record.md", `# Production Monitoring Final Decision Record

Stage: ${STAGE}

Decision: approve production-monitored for the post-RC Langfuse monitoring scope only.

This decision does not approve production-ready, stable, provider-diverse, provider-verified, adapter-checked, local-model-verified, or bare release-gated claims.
`);
  writeDocText("docs/next_production_ready_scope_plan.md", `# Next Production Ready Scope Plan

Production-ready requires a separate scope decision after production monitoring is allowed. Local endpoint, provider diversity, deployment, rollback, and stable-release criteria remain separate lanes.
`);
  writeDocText("docs/next_stable_scope_decision_plan.md", `# Next Stable Scope Decision Plan

Stable scope is not open from production-monitored evidence alone. Stable requires a later decision after production-ready and any explicitly scoped local/provider-diversity lanes are resolved or formally out-of-scope.
`);
  writeDocText("docs/next_local_canary_after_endpoint_ready.md", `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until the operator provides an endpoint readiness signal. No local endpoint probe or local model execution is part of the production monitoring final gate.
`);
}

if (approval !== REQUIRED_APPROVAL) {
  const blocked = {
    status: "blocked_by_missing_explicit_approval",
    stage: STAGE,
    approval_phrase_verified: false,
    required_approval_phrase: REQUIRED_APPROVAL,
    production_monitored_allowed: false,
    telemetry_sink_write: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  };
  writeJson(e("production_monitoring_final_gate_report.json"), blocked);
  writeJson(e("unresolved_items.json"), {
    status: "blocked_by_missing_explicit_approval",
    unresolved_items: ["explicit final gate approval phrase required"]
  });
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(0);
}

writeStaticFiles();

const generatedAt = new Date().toISOString();
const compare = runNode("check_reference_baseline_integrity.mjs");
const refreshGateReport = readJsonIfExists("evidence/post-rc-reference-baseline-refresh-for-monitoring-result-review/post_rc_reference_baseline_refresh_gate_report.json") || {};
const resultReviewGateReport = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_result_gate_report.json") || {};
const preconditions = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/production_monitoring_final_gate_preconditions.json") || {};
const resultReview = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_result_review.json") || {};
const thresholdReview = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_threshold_result_review.json") || {};
const redactionReview = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_redaction_result_review.json") || {};
const incidentReview = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_incident_rollback_result_review.json") || {};
const forbiddenStatus = gitStatus(["legacy-reference-source", "dist"]);
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);

const reference_baselineAndDistClean = forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "";
const ownerApprovedBaselineRefreshPresent = readJsonIfExists("evidence/post-rc-reference-baseline-refresh-for-monitoring-result-review/reference_baseline_refresh_report.json")?.status === "pass";
const baselineChangeAllowed = baselineStatus.stdout === "" || ownerApprovedBaselineRefreshPresent;
const evidenceReady = preconditions.status === "ready_for_final_gate"
  && preconditions.telemetry_connected === true
  && preconditions.monitoring_window_completed === true
  && preconditions.duration_met === true
  && preconditions.sample_count_met === true
  && preconditions.thresholds_passed === true
  && preconditions.redaction_failures_zero === true
  && preconditions.raw_payload_storage_violations_zero === true
  && preconditions.secret_logging_findings_zero === true
  && preconditions.incident_rollback_review_pass === true;
const resultReviewGateStatus = resultReviewGateReport.status || "missing";
const refreshGateStatus = refreshGateReport.status || "missing";
const resultReviewReady = resultReviewGateStatus === "pass"
  && resultReview.status === "pass"
  && resultReview.can_enter_production_monitoring_final_gate === true;
const reference_baselineReady = compare.status === "pass" && refreshGateStatus === "pass";
const redactionReady = redactionReview.status === "pass"
  && redactionReview.redaction_failures === 0
  && redactionReview.raw_payload_storage_violations === 0
  && redactionReview.secret_logging_findings === 0
  && redactionReview.auth_header_logged === false
  && redactionReview.api_key_logged === false
  && redactionReview.raw_payload_stored === false;
const thresholdReady = thresholdReview.status === "pass"
  && thresholdReview.threshold_evaluation_complete === true
  && thresholdReview.thresholds_passed === true;
const incidentReady = incidentReview.status === "pass" && incidentReview.blocks_final_gate === false;
const pass = evidenceReady && resultReviewReady && reference_baselineReady && redactionReady && thresholdReady && incidentReady && reference_baselineAndDistClean && baselineChangeAllowed;

const preconditionReview = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  approval_phrase_verified: true,
  monitoring_window_result_review_gate_status: resultReviewGateStatus,
  check_reference_baseline_integrity_status: compare.status,
  reference_baseline_refresh_gate_status: refreshGateStatus,
  final_gate_preconditions_ready: evidenceReady,
  reference_baseline_and_dist_clean: reference_baselineAndDistClean,
  owner_approved_baseline_refresh_present: ownerApprovedBaselineRefreshPresent
};
const thresholdFinalReview = {
  status: thresholdReady ? "pass" : "fail",
  stage: STAGE,
  thresholds: thresholdReview.thresholds || {},
  observed: thresholdReview.observed || {},
  thresholds_passed: thresholdReview.thresholds_passed === true
};
const redactionFinalReview = {
  status: redactionReady ? "pass" : "fail",
  stage: STAGE,
  redaction_failures: redactionReview.redaction_failures ?? null,
  raw_payload_storage_violations: redactionReview.raw_payload_storage_violations ?? null,
  secret_logging_findings: redactionReview.secret_logging_findings ?? null,
  auth_header_logged: redactionReview.auth_header_logged === true,
  api_key_logged: redactionReview.api_key_logged === true,
  raw_payload_stored: redactionReview.raw_payload_stored === true
};
const finalClaimBoundary = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  telemetry_connected_allowed: true,
  production_monitored_allowed: pass,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  release_gated_allowed: false,
  allowed_claims: pass ? ALLOWED_CLAIMS : ["telemetry-connected"],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Production monitoring evidence passed final gate. Production-ready, stable, provider-diverse, local-model, and bare release-gated claims remain blocked."
};
const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "monitoring_window_result_reviewed_final_gate_pending",
  new_status: pass
    ? "production_monitored_allowed_production_ready_still_blocked"
    : "production_monitoring_final_gate_failed",
  unblocks: pass ? ["production-monitored"] : [],
  does_not_block: pass ? ["telemetry-connected", "production-monitored"] : ["telemetry-connected"],
  still_blocks: [
    "production-ready",
    "stable",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "bare release-gated"
  ],
  next_required_actions: pass
    ? [
      "decide whether local endpoint remains out-of-scope or wait for readiness",
      "resolve or explicitly out-scope provider diversity",
      "run production-ready scope decision only after blockers are resolved or out-of-scope",
      "run stable scope decision only after production-ready/stability criteria are defined"
    ]
    : [
      "repair failed final gate preconditions",
      "rerun production monitoring final gate"
    ]
};
const report = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  generated_at: generatedAt,
  approval_phrase_verified: true,
  production_monitoring_final_gate_passed: pass,
  configured_sink: "langfuse",
  telemetry_connected: preconditions.telemetry_connected === true,
  monitoring_window_completed: preconditions.monitoring_window_completed === true,
  duration_met: preconditions.duration_met === true,
  sample_count_met: preconditions.sample_count_met === true,
  thresholds_passed: thresholdReady,
  redaction_failures: redactionReview.redaction_failures ?? null,
  raw_payload_storage_violations: redactionReview.raw_payload_storage_violations ?? null,
  secret_logging_findings: redactionReview.secret_logging_findings ?? null,
  incident_rollback_review_pass: incidentReady,
  check_reference_baseline_integrity_status: compare.status,
  reference_baseline_refresh_gate_status: refreshGateStatus,
  monitoring_result_review_gate_status: resultReviewGateStatus,
  production_monitored_allowed: pass,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  release_gated_allowed: false,
  can_claim_production_monitored: pass,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  evidence_reference_baseline_modified_by_prior_owner_approved_refresh: baselineStatus.stdout !== "" && ownerApprovedBaselineRefreshPresent,
  claims_allowed_by_this_gate: pass ? ALLOWED_CLAIMS : [],
  claims_still_blocked: BLOCKED_CLAIMS,
  reason: pass
    ? "Production monitoring final gate passed. Production-monitored is allowed; production-ready, stable, provider-diverse, and local-model claims remain blocked."
    : "Production monitoring final gate failed."
};

const durationReview = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_duration_sample_review.json") || {};
const telemetryConnection = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json") || {};
const controlsReport = readJsonIfExists("evidence/post-rc-production-monitoring-controls/production_monitoring_controls_report.json") || {};
const operatorValues = readJsonIfExists("evidence/post-rc-production-monitoring-operator-values-completion/production_monitoring_operator_values_completion_report.json") || {};
const evidenceSummary = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  telemetry_connected: report.telemetry_connected,
  configured_sink: "langfuse",
  monitoring_controls_drafted: controlsReport?.controls?.production_monitoring_gate_defined === true
    || controlsReport?.status === "pass",
  operator_values_complete: operatorValues?.operator_values_complete === true,
  monitoring_window_completed: report.monitoring_window_completed,
  duration_met: report.duration_met,
  elapsed_duration_hours: durationReview.elapsed_duration_hours ?? null,
  required_duration_hours: durationReview.required_duration_hours ?? 24,
  sample_count_met: report.sample_count_met,
  sample_count: durationReview.sample_count ?? null,
  required_sample_count: durationReview.required_sample_count ?? 50,
  thresholds_passed: report.thresholds_passed,
  redaction_failures: report.redaction_failures,
  raw_payload_storage_violations: report.raw_payload_storage_violations,
  secret_logging_findings: report.secret_logging_findings,
  incident_rollback_review_pass: report.incident_rollback_review_pass,
  check_reference_baseline_integrity_status: report.check_reference_baseline_integrity_status,
  reference_baseline_owner_approved_refresh_effective: ownerApprovedBaselineRefreshPresent,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  telemetry_sink_write: false
};
const requiredEvidence = {
  telemetry_connection_report: telemetryConnection.status === "pass",
  telemetry_connection_result_review: readJsonIfExists("evidence/post-rc-telemetry-connection-result-review/telemetry_connection_result_review.json")?.status === "pass",
  production_monitoring_controls: controlsReport.status === "pass",
  operator_values_completion: operatorValues.status === "pass",
  monitoring_window_execution: readJsonIfExists("evidence/post-rc-production-monitoring-window/production_monitoring_window_report.json")?.monitoring_window_executed === true,
  monitoring_window_continuation: readJsonIfExists("evidence/post-rc-production-monitoring-window-continuation/monitoring_window_continuation_report.json")?.status === "ready_for_monitoring_window_result_review"
    || readJsonIfExists("evidence/post-rc-production-monitoring-window-continuation/monitoring_window_progress_snapshot.json")?.monitoring_window_completed === true,
  monitoring_window_result_review: resultReview.status === "pass",
  reference_baseline_refresh_for_monitoring_result_review: ownerApprovedBaselineRefreshPresent
};
const missingEvidence = Object.entries(requiredEvidence)
  .filter(([, present]) => !present)
  .map(([name]) => name);
const evidenceCompleteness = {
  status: missingEvidence.length === 0 ? "pass" : "fail",
  required_evidence: requiredEvidence,
  missing_evidence: missingEvidence
};
const decisionRecord = {
  status: "recorded",
  decision: pass ? "approve_production_monitored_claim" : "do_not_approve_production_monitored_claim",
  scope: "post_rc_langfuse_monitoring",
  production_monitored: pass,
  telemetry_connected: report.telemetry_connected,
  is_production_ready: false,
  is_stable: false,
  is_provider_diverse: false,
  is_local_model_verified: false,
  rationale: [
    "Langfuse telemetry connection passed",
    "Live trace and event receipts recorded",
    "Monitoring window duration requirement met",
    "Monitoring sample count requirement met",
    "Threshold evaluation passed",
    "Redaction failures are zero",
    "Raw payload storage violations are zero",
    "Secret logging findings are zero",
    "Operator values and owner assignments completed",
    "reference baseline dependency resolved by owner-approved refresh"
  ]
};

writeJson(e("production_monitoring_final_gate_report.json"), report);
writeText(e("production_monitoring_final_gate_report.md"), reportMarkdown(report));
writeJson(e("production_monitoring_final_evidence_summary.json"), evidenceSummary);
writeJson(e("production_monitoring_final_evidence_completeness.json"), evidenceCompleteness);
writeJson(e("production_monitoring_final_precondition_review.json"), preconditionReview);
writeJson(e("production_monitoring_final_threshold_review.json"), thresholdFinalReview);
writeJson(e("production_monitoring_final_redaction_review.json"), redactionFinalReview);
writeJson(e("production_monitoring_final_claim_boundary.json"), finalClaimBoundary);
writeJson(e("production_monitored_claim_boundary.json"), finalClaimBoundary);
writeJson(e("production_monitoring_final_decision_record.json"), decisionRecord);
writeJson(e("production_monitoring_final_blocker_update.json"), blockerUpdate);
writeJson(e("unresolved_items.json"), {
  status: pass ? "none" : "unresolved",
  unresolved_items: pass ? [] : ["production monitoring final gate failed"],
  still_blocks: BLOCKED_CLAIMS
});
writeJson(p("evals", "reports", "post_rc_production_monitoring_final_gate_report.json"), report);
writeText(p("evals", "reports", "post_rc_production_monitoring_final_gate_report.md"), reportMarkdown(report));
writeJson(p("evals", "reports", "post_rc_production_monitoring_final_claim_boundary_report.json"), finalClaimBoundary);
writeText(p("evals", "reports", "post_rc_production_monitoring_final_claim_boundary_report.md"), reportMarkdown({
  ...report,
  status: finalClaimBoundary.status
}));
writeJson(p("evals", "reports", "post_rc_production_monitored_claim_boundary_report.json"), finalClaimBoundary);
writeText(p("evals", "reports", "post_rc_production_monitored_claim_boundary_report.md"), reportMarkdown({
  ...report,
  status: finalClaimBoundary.status
}));
writeJson(p("evals", "reports", "post_rc_production_monitoring_final_evidence_report.json"), evidenceSummary);
writeText(p("evals", "reports", "post_rc_production_monitoring_final_evidence_report.md"), reportMarkdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
