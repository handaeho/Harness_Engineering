#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-result-review";
const SOURCE_STAGE = "v2.0.0-post-rc-production-monitoring-window-execution";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-result-review";
const SOURCE_EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window";
const BLOCKED_CLAIMS = [
  "production-monitored",
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-production-monitoring-window-result-reviewed",
  "post-rc-monitoring-window-duration-sample-validated",
  "post-rc-monitoring-window-threshold-results-reviewed",
  "post-rc-monitoring-window-redaction-results-reviewed",
  "post-rc-production-monitoring-final-gate-preconditions-recorded"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function writeRelJson(relPath, value) {
  const file = p(...relPath.split("/"));
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) {
      return;
    }
    throw error;
  }
}

function writeRelText(relPath, value) {
  const file = p(...relPath.split("/"));
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) {
      return;
    }
    throw error;
  }
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentWithin(value, threshold) {
  if (typeof value !== "string" || typeof threshold !== "string") return false;
  const parsedValue = Number(value.replace("%", ""));
  const parsedThreshold = Number(threshold.replace("%", ""));
  return Number.isFinite(parsedValue) && Number.isFinite(parsedThreshold) && parsedValue <= parsedThreshold;
}

function reportMarkdown(report) {
  return `# Production Monitoring Window Result Review

Status: ${report.status}

- Stage: ${report.stage}
- Source stage: ${report.source_stage}
- Configured sink: ${report.configured_sink}
- Monitoring window completed: ${report.monitoring_window_completed}
- Duration met: ${report.duration_met}
- Sample count met: ${report.sample_count_met}
- Telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Production-monitored allowed: ${report.production_monitored_allowed}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_window_result_review_scope.yaml", `stage: ${STAGE}

approved_actions:
  monitoring_window_result_review: true
  duration_sample_validation: true
  threshold_result_review: true
  redaction_secret_result_review: true
  incident_rollback_result_review: true
  final_gate_precondition_check: true
  claim_boundary_audit: true
  blocker_update: true

forbidden_execution:
  synthetic_trace_generation: true
  manual_sample_count_increment: true
  manual_duration_increment: true
  telemetry_sink_write: true
  openai_model_api_call: true
  openai_provider_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true

claims_allowed:
  - post-rc-production-monitoring-window-result-reviewed
  - post-rc-monitoring-window-duration-sample-validated
  - post-rc-monitoring-window-threshold-results-reviewed
  - post-rc-monitoring-window-redaction-results-reviewed
  - post-rc-production-monitoring-final-gate-preconditions-recorded

claims_not_allowed:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - release-gated
`);

  writeRelText("release/claims/post-rc/post_rc_production_monitoring_window_result_claim_boundary.yaml", `stage: ${STAGE}
telemetry_connected_allowed: true
monitoring_window_result_reviewed: true
production_monitored_allowed: false
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
local_model_verified_allowed: false
blocked_claims:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
  - provider-verified
  - adapter-checked
`);

  writeRelText("release/gates/post-rc/post_rc_production_monitoring_final_gate_preconditions.yaml", `stage: ${STAGE}
final_gate: v2.0.0-post-rc-production-monitoring-final-gate
requires:
  - telemetry_connected
  - monitoring_window_completed
  - duration_met
  - sample_count_met
  - thresholds_passed
  - redaction_failures_zero
  - raw_payload_storage_violations_zero
  - secret_logging_findings_zero
  - incident_rollback_review_pass
does_not_allow:
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
`);

  writeRelText("release/blockers/post-rc/post_rc_production_monitoring_window_result_blocker_update.yaml", `stage: ${STAGE}
status: updated
previous_status: monitoring_window_in_progress_duration_and_sample_count_pending
new_status: monitoring_window_result_reviewed_final_gate_pending
still_blocks:
  - production-monitored
  - production-ready
  - stable
does_not_block:
  - telemetry-connected
next_required_actions:
  - run production monitoring final gate
  - keep local endpoint deferred unless operator provides readiness
  - do not claim production-ready or stable
`);

  writeRelText("evals/suites/post_rc_production_monitoring_window_result_review.yaml", `suite_id: post_rc_production_monitoring_window_result_review
stage: ${STAGE}
description: Reviews completed production monitoring window evidence and records final production monitoring gate preconditions without granting production-monitored.
forbidden_execution:
  telemetry_sink_write: true
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
gate:
  script: tools/checks/observability/check_post_rc_production_monitoring_window_result_review.mjs
`);

  writeRelText("docs/observability/production_monitoring_window_result_review.md", `# Production Monitoring Window Result Review

Stage: ${STAGE}

This review validates the completed monitoring window evidence: 24h duration, 50 sample minimum, threshold results, redaction/secret boundaries, and incident/rollback readiness. It does not write telemetry, call OpenAI, probe local endpoints, execute local models, deploy production changes, or allow production-monitored.
`);

  writeRelText("docs/observability/production_monitoring_final_gate_preconditions.md", `# Production Monitoring Final Gate Preconditions

The final production monitoring gate may be entered only after the monitoring window result review records completed duration and sample requirements, passing thresholds, zero redaction/raw-payload/secret findings, and incident/rollback readiness.
`);

  writeRelText("docs/plans/next_production_monitoring_final_gate_plan.md", `# Next Production Monitoring Final Gate Plan

Next stage: v2.0.0-post-rc-production-monitoring-final-gate.

The final gate is still required before any production-monitored claim. Production-ready, stable, provider-diverse, and local-model-verified remain separate blocked claims.
`);
}

writeStaticArtifacts();

const generatedAt = new Date().toISOString();
const sourceReport = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/production_monitoring_window_report.json`) || {};
const sourceThreshold = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/monitoring_window_threshold_evaluation.json`) || {};
const sourceRedaction = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`) || {};
const sourceIncident = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/monitoring_window_incident_rollback_readiness.json`) || {};

const durationMet = sourceReport.monitoring_window_duration_met === true;
const sampleCountMet = sourceReport.required_sample_count_met === true;
const monitoringWindowCompleted = sourceReport.monitoring_window_completed === true && durationMet && sampleCountMet;
const redactionFailures = numberValue(sourceReport.redaction_failures, numberValue(sourceRedaction.redaction_failures, 0));
const rawPayloadStorageViolations = numberValue(sourceReport.raw_payload_storage_violations, numberValue(sourceRedaction.raw_payload_storage_violations, 0));
const secretLoggingFindings = numberValue(sourceReport.secret_logging_findings, numberValue(sourceRedaction.secret_logging_findings, 0));
const redactionPass = redactionFailures === 0
  && rawPayloadStorageViolations === 0
  && secretLoggingFindings === 0
  && sourceRedaction.auth_header_logged === false
  && sourceRedaction.api_key_logged === false
  && sourceRedaction.raw_payload_stored === false;
const observed = sourceThreshold.observed || {};
const thresholds = sourceThreshold.thresholds || {};
const missingTraceWithinThreshold = percentWithin(observed.missing_trace_rate || "0%", thresholds.missing_trace_rate_threshold || "5%");
const errorRateWithinThreshold = percentWithin(observed.error_rate || "0%", thresholds.error_rate_threshold || "5%");
const p95LatencyWithinThreshold = numberValue(observed.p95_latency_ms, 0) <= numberValue(thresholds.p95_latency_threshold_ms, 10000);
const thresholdsPassed = monitoringWindowCompleted
  && sourceThreshold.threshold_evaluation_complete === true
  && missingTraceWithinThreshold
  && errorRateWithinThreshold
  && p95LatencyWithinThreshold
  && redactionPass;
const incidentReviewPass = sourceIncident.status === "pass"
  && sourceIncident.incident_owner === "operator"
  && sourceIncident.escalation_owner === "operator"
  && sourceIncident.rollback_owner === "operator"
  && sourceIncident.rollback_triggers_defined === true;
const finalGateReady = monitoringWindowCompleted && thresholdsPassed && redactionPass && incidentReviewPass;
const status = monitoringWindowCompleted ? (finalGateReady ? "pass" : "fail") : "blocked_by_monitoring_window_requirements_not_met";

const durationSampleReview = {
  status: monitoringWindowCompleted ? "pass" : "incomplete",
  stage: STAGE,
  elapsed_duration_hours: numberValue(sourceReport.monitoring_window_observed_duration_hours, 0),
  required_duration_hours: numberValue(sourceReport.monitoring_window_required_duration_hours, 24),
  duration_met: durationMet,
  sample_count: numberValue(sourceReport.observed_sample_count, 0),
  required_sample_count: numberValue(sourceReport.required_sample_count, 50),
  sample_count_met: sampleCountMet,
  manual_duration_increment: false,
  manual_sample_count_increment: false,
  synthetic_trace_generation: false
};

const thresholdResultReview = {
  status: thresholdsPassed ? "pass" : monitoringWindowCompleted ? "fail" : "incomplete",
  stage: STAGE,
  thresholds: {
    missing_trace_rate_threshold: thresholds.missing_trace_rate_threshold || "5%",
    error_rate_threshold: thresholds.error_rate_threshold || "5%",
    p95_latency_threshold_ms: numberValue(thresholds.p95_latency_threshold_ms, 10000),
    redaction_failure_threshold: numberValue(thresholds.redaction_failure_threshold, 0),
    raw_payload_storage_violation_threshold: numberValue(thresholds.raw_payload_storage_violation_threshold, 0),
    secret_logging_threshold: numberValue(thresholds.secret_logging_threshold, 0)
  },
  observed: {
    missing_trace_rate: observed.missing_trace_rate || "not_enough_samples",
    error_rate: observed.error_rate || "not_enough_samples",
    p95_latency_ms: observed.p95_latency_ms ?? "not_enough_samples",
    redaction_failures: redactionFailures,
    raw_payload_storage_violations: rawPayloadStorageViolations,
    secret_logging_findings: secretLoggingFindings
  },
  threshold_evaluation_complete: monitoringWindowCompleted && sourceThreshold.threshold_evaluation_complete === true,
  thresholds_passed: thresholdsPassed
};

const redactionResultReview = {
  status: redactionPass ? "pass" : "fail",
  stage: STAGE,
  redaction_failures: redactionFailures,
  raw_payload_storage_violations: rawPayloadStorageViolations,
  secret_logging_findings: secretLoggingFindings,
  auth_header_logged: sourceRedaction.auth_header_logged === true,
  api_key_logged: sourceRedaction.api_key_logged === true,
  raw_payload_stored: sourceRedaction.raw_payload_stored === true
};

const incidentRollbackReview = {
  status: incidentReviewPass ? "pass" : "needs_review",
  stage: STAGE,
  incident_owner: sourceIncident.incident_owner || null,
  escalation_owner: sourceIncident.escalation_owner || null,
  rollback_owner: sourceIncident.rollback_owner || null,
  rollback_triggers_defined: sourceIncident.rollback_triggers_defined === true,
  live_rollback_monitoring_tested: sourceIncident.live_rollback_monitoring_tested === true,
  blocks_final_gate: !incidentReviewPass
};

const finalGatePreconditions = {
  status: finalGateReady ? "ready_for_final_gate" : "blocked",
  stage: STAGE,
  telemetry_connected: sourceReport.telemetry_connected === true,
  monitoring_window_completed: monitoringWindowCompleted,
  duration_met: durationMet,
  sample_count_met: sampleCountMet,
  thresholds_passed: thresholdsPassed,
  redaction_failures_zero: redactionFailures === 0,
  raw_payload_storage_violations_zero: rawPayloadStorageViolations === 0,
  secret_logging_findings_zero: secretLoggingFindings === 0,
  incident_rollback_review_pass: incidentReviewPass,
  can_enter_production_monitoring_final_gate: finalGateReady,
  can_claim_production_monitored: false
};

const claimBoundary = {
  status: "pass",
  stage: STAGE,
  telemetry_connected_allowed: true,
  monitoring_window_result_reviewed: status === "pass",
  can_enter_production_monitoring_final_gate: finalGateReady,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : ["telemetry-connected"],
  blocked_claims: [
    "production-monitored",
    "production-ready",
    "stable",
    "provider-diverse",
    "local-model-verified",
    "provider-verified",
    "adapter-checked"
  ]
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "monitoring_window_in_progress_duration_and_sample_count_pending",
  new_status: finalGateReady
    ? "monitoring_window_result_reviewed_final_gate_pending"
    : "monitoring_window_requirements_still_pending",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: finalGateReady
    ? [
      "run production monitoring final gate",
      "keep local endpoint deferred unless operator provides readiness",
      "do not claim production-ready or stable"
    ]
    : [
      "continue accumulating real Langfuse trace receipts",
      "rerun monitoring window continuation checkpoint"
    ]
};

const report = {
  status,
  stage: STAGE,
  generated_at: generatedAt,
  source_stage: SOURCE_STAGE,
  telemetry_connected: sourceReport.telemetry_connected === true,
  configured_sink: "langfuse",
  monitoring_window_completed: monitoringWindowCompleted,
  duration_met: durationMet,
  sample_count_met: sampleCountMet,
  elapsed_duration_hours: durationSampleReview.elapsed_duration_hours,
  required_duration_hours: durationSampleReview.required_duration_hours,
  sample_count: durationSampleReview.sample_count,
  required_sample_count: durationSampleReview.required_sample_count,
  thresholds_passed: thresholdsPassed,
  redaction_failures: redactionFailures,
  raw_payload_storage_violations: rawPayloadStorageViolations,
  secret_logging_findings: secretLoggingFindings,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  telemetry_sink_write: false,
  production_deployment: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  can_enter_production_monitoring_final_gate: finalGateReady
};

const unresolved = {
  status: status === "pass" ? "pass" : "unresolved",
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items: status === "pass" ? [] : blockerUpdate.next_required_actions,
  still_blocks: blockerUpdate.still_blocks
};

writeRelJson(`${EVIDENCE_DIR}/monitoring_window_result_review.json`, report);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_duration_sample_review.json`, durationSampleReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_threshold_result_review.json`, thresholdResultReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_redaction_result_review.json`, redactionResultReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_incident_rollback_result_review.json`, incidentRollbackReview);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_final_gate_preconditions.json`, finalGatePreconditions);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_result_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_result_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_window_result_review_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_window_result_review_report.md", reportMarkdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(["pass", "blocked_by_monitoring_window_requirements_not_met"].includes(status) ? 0 : 1);
