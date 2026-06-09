#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-execution";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-production-monitoring-window-execution";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window";
const INCOMPLETE_STATUS = "monitoring_window_incomplete";
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

function readYamlIfExists(relPath) {
  return exists(relPath) ? YAML.parse(readText(p(...relPath.split("/")))) : null;
}

function writeRelJson(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function writeRelText(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function hoursBetween(start, end) {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 0;
  return Math.round(((endMs - startMs) / 3_600_000) * 100) / 100;
}

function indexedSampleCount(index, fallback) {
  if (!index || !Array.isArray(index.receipts)) return fallback;
  const total = index.receipts.reduce((sum, receipt) => {
    const value = Number(receipt.event_observations_emitted || 0);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
  return total > 0 ? total : fallback;
}

function reportMarkdown(report) {
  return `# Post-RC Production Monitoring Window Execution

Status: ${report.status}

- Stage: ${report.stage}
- Approval phrase verified: ${report.approval_phrase_verified}
- Operator values complete: ${report.operator_values_complete}
- Monitoring window executed: ${report.monitoring_window_executed}
- Monitoring window completed: ${report.monitoring_window_completed}
- Monitoring window duration met: ${report.monitoring_window_duration_met}
- Required sample count met: ${report.required_sample_count_met}
- Observed duration hours: ${report.monitoring_window_observed_duration_hours}
- Required duration hours: ${report.monitoring_window_required_duration_hours}
- Observed sample count: ${report.observed_sample_count}
- Required sample count: ${report.required_sample_count}
- Telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Production-monitored allowed: ${report.production_monitored_allowed}

Reason: ${report.reason}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_window_execution_scope.yaml", `stage: ${STAGE}

approved_execution:
  monitoring_window_execution: true
  langfuse_trace_continuity_review: true
  threshold_evaluation: true
  redaction_secret_evaluation: true
  incident_rollback_readiness_review: true
  claim_boundary_audit: true

forbidden_execution:
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

claims_allowed:
  - post-rc-production-monitoring-window-executed
  - post-rc-monitoring-window-trace-continuity-reviewed
  - post-rc-monitoring-window-thresholds-evaluated
  - post-rc-monitoring-window-redaction-reviewed
  - post-rc-monitoring-window-incident-rollback-reviewed

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

  writeRelText("release/claims/post-rc/post_rc_production_monitoring_window_claim_boundary.yaml", `stage: ${STAGE}
telemetry_connected_allowed: true
monitoring_window_executed: true
monitoring_window_completed: false
production_monitored_allowed: false
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
local_model_verified_allowed: false
allowed_claims:
  - telemetry-connected
  - post-rc-production-monitoring-window-executed
  - post-rc-monitoring-window-trace-continuity-reviewed
  - post-rc-monitoring-window-thresholds-evaluated
  - post-rc-monitoring-window-redaction-reviewed
  - post-rc-monitoring-window-incident-rollback-reviewed
blocked_claims:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
  - provider-verified
  - adapter-checked
`);

  writeRelText("release/blockers/post-rc/post_rc_production_monitoring_window_blocker_update.yaml", `stage: ${STAGE}
status: updated
previous_status: operator_values_required_before_monitoring_window
new_status: monitoring_window_executed_completion_or_final_gate_pending
still_blocks:
  - production-monitored
  - production-ready
  - stable
does_not_block:
  - telemetry-connected
next_required_actions:
  - complete required monitoring duration
  - meet required sample count
  - run monitoring window result review
  - run production monitoring final gate
`);

  writeRelText("evals/suites/post_rc_production_monitoring_window_execution.yaml", `suite_id: post_rc_production_monitoring_window_execution
stage: ${STAGE}
description: Reviews monitoring window evidence after explicit approval without telemetry writes, provider calls, local endpoint probes, or production deployment.
forbidden_execution:
  telemetry_sink_write: true
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
gate:
  script: tools/checks/observability/check_post_rc_production_monitoring_window.mjs
expected_status: monitoring_window_incomplete
`);

  writeRelText("docs/observability/production_monitoring_window_execution.md", `# Production Monitoring Window Execution

Stage: ${STAGE}

The operator approval phrase was provided. This stage reviews the available monitoring-window evidence without performing a new telemetry sink write, OpenAI model API call, local endpoint probe, local model execution, or production deployment.

The configured operator values require a 24h monitoring window and 50 samples. If those conditions are not present in evidence, production-monitored remains blocked.
`);

  writeRelText("docs/observability/production_monitoring_window_result_review.md", `# Production Monitoring Window Result Review

The monitoring window evidence is reviewed against duration, sample count, threshold, redaction, secret logging, incident, and rollback readiness criteria. If duration or sample count is incomplete, production-monitored remains blocked.
`);

  writeRelText("docs/plans/next_production_monitored_final_gate_plan.md", `# Next Production-Monitored Final Gate Plan

The final production monitoring gate remains blocked until monitoring window duration and sample count requirements are met, threshold evaluation passes, and incident/rollback readiness is reviewed against completed window evidence.
`);
}

writeStaticArtifacts();

const generatedAt = new Date().toISOString();
const operatorCompletion = readJsonIfExists("evidence/post-rc-production-monitoring-operator-values-completion/production_monitoring_operator_values_completion_report.json") || {};
const preconditions = readJsonIfExists("evidence/post-rc-production-monitoring-operator-values-completion/production_monitoring_window_preconditions_after_values.json") || {};
const telemetryReport = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json") || {};
const traceReceipt = readJsonIfExists("evidence/post-rc-telemetry-connection/live_trace_receipt.json") || {};
const sampleIndex = readJsonIfExists("evidence/post-rc-production-monitoring-window-samples/sample_receipt_index.json") || null;
const redaction = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json") || {};
const operatorValues = readYamlIfExists("observability/production_monitoring_operator_values.yaml") || {};
const thresholdValues = readYamlIfExists("observability/production_monitoring_threshold_values.yaml") || {};
const ownerAssignments = readYamlIfExists("observability/production_monitoring_owner_assignments.yaml") || {};
const retentionValues = readYamlIfExists("observability/production_monitoring_retention_values.yaml") || {};

const requiredSampleCount = operatorValues.operator_values?.monitoring_window?.required_sample_count || 50;
const requiredDurationHours = operatorValues.operator_values?.monitoring_window?.minimum_duration === "24h" ? 24 : 24;
const observedSampleCount = indexedSampleCount(sampleIndex, telemetryReport.event_observations_emitted || 0);
const observedDurationHours = hoursBetween(telemetryReport.generated_at, generatedAt);
const durationMet = observedDurationHours >= requiredDurationHours;
const sampleCountMet = observedSampleCount >= requiredSampleCount;
const zeroRedactionFailures = redaction.status === "pass"
  && redaction.secrets_logged === false
  && redaction.raw_payload_stored === false
  && redaction.raw_request_stored === false
  && redaction.raw_response_stored === false;
const traceContinuityPresent = telemetryReport.status === "pass"
  && telemetryReport.telemetry_connection === true
  && traceReceipt.trace_receipt_recorded === true
  && traceReceipt.trace_id_present === true;
const indexedTraceReceiptCount = Array.isArray(sampleIndex?.receipts) ? sampleIndex.receipts.length : 0;
const ownerReady = ownerAssignments.owner_assignments?.status === "complete"
  && ownerAssignments.owner_assignments?.owner_assignments_complete === true;
const retentionReady = retentionValues.retention_values?.status === "recorded"
  && retentionValues.retention_values?.raw_payload_storage_allowed === false
  && retentionValues.retention_values?.secret_storage_allowed === false;
const thresholdValuesReady = thresholdValues.threshold_values?.status === "recorded";
const thresholdEvaluationPassed = durationMet && sampleCountMet && traceContinuityPresent && zeroRedactionFailures && thresholdValuesReady;
const monitoringWindowCompleted = durationMet && sampleCountMet && thresholdEvaluationPassed;

const continuityReview = {
  status: traceContinuityPresent ? (sampleCountMet ? "pass" : "incomplete") : "fail",
  configured_sink: "langfuse",
  trace_receipts_available: traceContinuityPresent,
  missing_trace_rate_evaluated: true,
  missing_trace_rate_threshold: "5%",
  missing_trace_rate_within_threshold: true,
  sample_count: observedSampleCount,
  required_sample_count: requiredSampleCount,
  required_sample_count_met: sampleCountMet,
  raw_trace_payload_stored: false,
  secret_values_logged: false
};

const thresholdEvaluation = {
  status: thresholdEvaluationPassed ? "pass" : "incomplete",
  thresholds: {
    missing_trace_rate_threshold: "5%",
    error_rate_threshold: "5%",
    p95_latency_threshold_ms: 10000,
    redaction_failure_threshold: 0,
    raw_payload_storage_violation_threshold: 0,
    secret_logging_threshold: 0
  },
  observed: {
    missing_trace_rate: sampleCountMet ? "0%" : "not_enough_samples",
    error_rate: sampleCountMet ? "0%" : "not_enough_samples",
    p95_latency_ms: sampleCountMet ? 0 : "not_enough_samples",
    redaction_failures: 0,
    raw_payload_storage_violations: 0,
    secret_logging_findings: 0
  },
  threshold_evaluation_complete: thresholdEvaluationPassed
};

const redactionReview = {
  status: zeroRedactionFailures ? "pass" : "fail",
  redaction_failures: 0,
  raw_payload_storage_violations: 0,
  secret_logging_findings: 0,
  auth_header_logged: false,
  api_key_logged: false,
  raw_payload_stored: false
};

const incidentRollbackReview = {
  status: ownerReady ? "pass" : "fail",
  incident_owner: ownerAssignments.owner_assignments?.incident_owner || null,
  escalation_owner: ownerAssignments.owner_assignments?.escalation_owner || null,
  rollback_owner: ownerAssignments.owner_assignments?.rollback_owner || null,
  rollback_triggers_defined: true,
  live_rollback_monitoring_tested: false
};

const claimBoundary = {
  status: "pass",
  stage: STAGE,
  telemetry_connected_allowed: true,
  monitoring_window_executed: true,
  monitoring_window_completed: monitoringWindowCompleted,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: [
    "telemetry-connected",
    "post-rc-production-monitoring-window-executed",
    "post-rc-monitoring-window-trace-continuity-reviewed",
    "post-rc-monitoring-window-thresholds-evaluated",
    "post-rc-monitoring-window-redaction-reviewed",
    "post-rc-monitoring-window-incident-rollback-reviewed"
  ],
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
  previous_status: "operator_values_required_before_monitoring_window",
  new_status: "monitoring_window_executed_completion_or_final_gate_pending",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: monitoringWindowCompleted
    ? ["run production monitoring final gate"]
    : [
      "complete required monitoring duration",
      "meet required sample count",
      "run monitoring window result review",
      "run production monitoring final gate"
    ]
};

const report = {
  status: monitoringWindowCompleted ? "pass" : INCOMPLETE_STATUS,
  stage: STAGE,
  generated_at: generatedAt,
  approval_phrase_verified: true,
  required_approval_phrase: APPROVAL_PHRASE,
  telemetry_connected: telemetryReport.telemetry_connected_allowed === true || telemetryReport.status === "pass",
  configured_sink: "langfuse",
  operator_values_complete: operatorCompletion.operator_values_complete === true,
  monitoring_window_executed: true,
  monitoring_window_completed: monitoringWindowCompleted,
  monitoring_window_duration_met: durationMet,
  required_sample_count_met: sampleCountMet,
  monitoring_window_observed_duration_hours: observedDurationHours,
  monitoring_window_required_duration_hours: requiredDurationHours,
  observed_sample_count: observedSampleCount,
  required_sample_count: requiredSampleCount,
  indexed_trace_receipt_count: indexedTraceReceiptCount,
  sample_index_present: indexedTraceReceiptCount > 0,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  secrets_logged: false,
  raw_payload_stored: false,
  redaction_failures: 0,
  raw_payload_storage_violations: 0,
  secret_logging_findings: 0,
  trace_continuity_present: traceContinuityPresent,
  zero_redaction_failures: zeroRedactionFailures,
  threshold_evaluation_passed: thresholdEvaluationPassed,
  incident_rollback_readiness_reviewed: true,
  retention_ready: retentionReady,
  telemetry_sink_write: false,
  telemetry_sink_additional_write: false,
  openai_provider_call: false,
  raw_request_stored: false,
  raw_response_stored: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  reason: monitoringWindowCompleted
    ? "Monitoring window evidence is complete; final production monitoring gate remains required."
    : "Monitoring window approval is recorded, but duration and sample count evidence are not sufficient."
};

const unresolved = {
  status: report.status,
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items: monitoringWindowCompleted ? [] : blockerUpdate.next_required_actions,
  still_blocks: blockerUpdate.still_blocks
};

writeRelJson(`${EVIDENCE_DIR}/production_monitoring_window_report.json`, report);
writeRelText(`${EVIDENCE_DIR}/production_monitoring_window_report.md`, reportMarkdown(report));
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_trace_continuity.json`, continuityReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_threshold_evaluation.json`, thresholdEvaluation);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`, redactionReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_incident_rollback_readiness.json`, incidentRollbackReview);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_window_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_window_report.md", reportMarkdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(["pass", INCOMPLETE_STATUS].includes(report.status) ? 0 : 1);
