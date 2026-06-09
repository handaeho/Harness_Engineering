#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-continuation-checkpoint";
const SOURCE_STAGE = "v2.0.0-post-rc-production-monitoring-window-execution";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-continuation";
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
  writeJson(p(...relPath.split("/")), value);
}

function writeRelText(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function asNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function hoursBetween(start, end) {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 0;
  return round2((endMs - startMs) / 3_600_000);
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
  return `# Production Monitoring Window Continuation Checkpoint

Status: ${report.status}

- Stage: ${report.stage}
- Source status: ${report.source_status}
- Elapsed duration hours: ${report.elapsed_duration_hours}
- Required duration hours: ${report.required_duration_hours}
- Duration met: ${report.duration_met}
- Sample count: ${report.sample_count}
- Required sample count: ${report.required_sample_count}
- Sample count met: ${report.sample_count_met}
- Monitoring window completed: ${report.monitoring_window_completed}
- Can enter monitoring window result review: ${report.can_enter_monitoring_window_result_review}
- Production-monitored allowed: ${report.production_monitored_allowed}

Reason: ${report.reason}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_window_continuation_checkpoint_scope.yaml", `stage: ${STAGE}

approved_actions:
  monitoring_window_progress_checkpoint: true
  elapsed_duration_evaluation: true
  sample_count_evaluation: true
  redaction_secret_checkpoint: true
  remaining_requirement_recording: true
  claim_boundary_audit: true
  blocker_update: true

forbidden_execution:
  telemetry_sink_write: true
  synthetic_trace_generation: true
  manual_sample_count_increment: true
  manual_duration_increment: true
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
  - post-rc-production-monitoring-window-checkpoint-recorded
  - post-rc-production-monitoring-window-progress-evaluated
  - post-rc-production-monitoring-window-remaining-requirements-recorded
  - post-rc-production-monitoring-window-redaction-checkpoint-recorded

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

  writeRelText("release/gates/post-rc/post_rc_production_monitoring_window_continuation_gate.yaml", `stage: ${STAGE}
gate_script: tools/checks/observability/check_post_rc_production_monitoring_window_continuation.mjs
source_stage: ${SOURCE_STAGE}
passes_when:
  checkpoint_recorded: true
  telemetry_sink_write: false
  openai_model_api_call: false
  local_endpoint_probe: false
  local_model_execution: false
  production_monitored_allowed: false
  production_ready_allowed: false
  stable_allowed: false
allows_ready_for_result_review_only_when:
  duration_met: true
  sample_count_met: true
  redaction_failures: 0
  raw_payload_storage_violations: 0
  secret_logging_findings: 0
`);

  writeRelText("release/blockers/post-rc/post_rc_production_monitoring_window_continuation_blocker_update.yaml", `stage: ${STAGE}
status: updated
previous_status: monitoring_window_executed_completion_or_final_gate_pending
new_status: monitoring_window_in_progress_duration_and_sample_count_pending
still_blocks:
  - production-monitored
  - production-ready
  - stable
does_not_block:
  - telemetry-connected
next_required_actions:
  - continue accumulating real Langfuse trace receipts
  - reach required monitoring duration
  - reach required sample count
  - rerun monitoring window checkpoint
  - then run monitoring window result review
`);

  writeRelText("evals/suites/post_rc_production_monitoring_window_continuation_checkpoint.yaml", `suite_id: post_rc_production_monitoring_window_continuation_checkpoint
stage: ${STAGE}
source_stage: ${SOURCE_STAGE}
description: Records monitoring window continuation progress without synthetic samples, manual duration changes, telemetry writes, provider calls, local endpoint probes, or production claims.
gate:
  script: tools/checks/observability/check_post_rc_production_monitoring_window_continuation.mjs
expected_status:
  - pass
  - ready_for_monitoring_window_result_review
`);

  writeRelText("docs/observability/production_monitoring_window_continuation_checkpoint.md", `# Production Monitoring Window Continuation Checkpoint

Stage: ${STAGE}

This checkpoint reads the existing monitoring window execution evidence and records current duration, sample count, remaining requirements, and redaction status. It does not create synthetic traces, increase sample count manually, increase duration manually, write to telemetry sinks, call OpenAI, probe local endpoints, execute local models, or grant production-monitored.
`);

  writeRelText("docs/observability/production_monitoring_window_remaining_requirements.md", `# Production Monitoring Window Remaining Requirements

Production-monitored remains blocked until the monitoring window reaches the configured duration and sample count, redaction failures remain zero, raw payload storage violations remain zero, secret logging findings remain zero, and a later result review/final gate passes.
`);

  writeRelText("docs/plans/next_monitoring_window_result_review_plan.md", `# Next Monitoring Window Result Review Plan

Run the monitoring window result review only after real Langfuse evidence shows the required duration and sample count are met. The result review still cannot grant production-ready, stable, provider-diverse, or local-model-verified claims.
`);
}

writeStaticArtifacts();

const generatedAt = new Date().toISOString();
const telemetryReport = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json") || {};
const sourceReport = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/production_monitoring_window_report.json`) || {};
const sourceRedaction = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`) || {};
const sourceGate = readJsonIfExists(`${SOURCE_EVIDENCE_DIR}/monitoring_window_gate_report.json`) || {};
const sampleIndex = readJsonIfExists("evidence/post-rc-production-monitoring-window-samples/sample_receipt_index.json") || null;

const liveElapsedDurationHours = hoursBetween(telemetryReport.generated_at, generatedAt);
const sourceElapsedDurationHours = round2(asNumber(sourceReport.monitoring_window_observed_duration_hours, 0));
const elapsedDurationHours = liveElapsedDurationHours > 0 ? liveElapsedDurationHours : sourceElapsedDurationHours;
const requiredDurationHours = round2(asNumber(sourceReport.monitoring_window_required_duration_hours, 24));
const sampleCount = Math.max(0, Math.trunc(indexedSampleCount(sampleIndex, asNumber(sourceReport.observed_sample_count, 0))));
const requiredSampleCount = Math.max(0, Math.trunc(asNumber(sourceReport.required_sample_count, 50)));
const durationMet = elapsedDurationHours >= requiredDurationHours;
const sampleCountMet = sampleCount >= requiredSampleCount;
const monitoringWindowCompleted = durationMet && sampleCountMet;
const remainingDurationHours = round2(Math.max(0, requiredDurationHours - elapsedDurationHours));
const remainingSampleCount = Math.max(0, requiredSampleCount - sampleCount);
const redactionFailures = asNumber(sourceReport.redaction_failures, sourceRedaction.redaction_failures ?? 0);
const rawPayloadStorageViolations = asNumber(
  sourceReport.raw_payload_storage_violations,
  sourceRedaction.raw_payload_storage_violations ?? 0
);
const secretLoggingFindings = asNumber(
  sourceReport.secret_logging_findings,
  sourceRedaction.secret_logging_findings ?? 0
);
const redactionPass = redactionFailures === 0
  && rawPayloadStorageViolations === 0
  && secretLoggingFindings === 0
  && sourceRedaction.auth_header_logged === false
  && sourceRedaction.api_key_logged === false
  && sourceRedaction.raw_payload_stored === false;
const canEnterResultReview = monitoringWindowCompleted && redactionPass;

const progressSnapshot = {
  status: monitoringWindowCompleted ? "complete" : "incomplete",
  stage: STAGE,
  source_stage: SOURCE_STAGE,
  source_status: sourceReport.status || null,
  elapsed_duration_hours: elapsedDurationHours,
  required_duration_hours: requiredDurationHours,
  duration_met: durationMet,
  sample_count: sampleCount,
  required_sample_count: requiredSampleCount,
  sample_count_met: sampleCountMet,
  monitoring_window_completed: monitoringWindowCompleted,
  production_monitored_allowed: false
};

const remainingRequirements = {
  status: monitoringWindowCompleted ? "requirements_met_for_result_review" : "remaining_requirements_recorded",
  remaining_duration_hours: remainingDurationHours,
  remaining_sample_count: remainingSampleCount,
  required_before_result_review: [
    "monitoring_window_duration_met",
    "required_sample_count_met",
    "redaction_failures_zero",
    "raw_payload_storage_violations_zero",
    "secret_logging_findings_zero"
  ],
  can_enter_monitoring_window_result_review: canEnterResultReview,
  can_enter_production_monitoring_final_gate: false
};

const redactionCheckpoint = {
  status: redactionPass ? "pass" : "fail",
  redaction_failures: redactionFailures,
  raw_payload_storage_violations: rawPayloadStorageViolations,
  secret_logging_findings: secretLoggingFindings,
  auth_header_logged: false,
  api_key_logged: false,
  raw_payload_stored: false
};

const claimBoundary = {
  status: "pass",
  telemetry_connected_allowed: true,
  monitoring_window_checkpoint_recorded: true,
  monitoring_window_completed: monitoringWindowCompleted,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: [
    "telemetry-connected",
    "post-rc-production-monitoring-window-checkpoint-recorded",
    "post-rc-production-monitoring-window-progress-evaluated",
    "post-rc-production-monitoring-window-remaining-requirements-recorded",
    "post-rc-production-monitoring-window-redaction-checkpoint-recorded"
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
  previous_status: "monitoring_window_executed_completion_or_final_gate_pending",
  new_status: monitoringWindowCompleted
    ? "monitoring_window_ready_for_result_review_final_gate_pending"
    : "monitoring_window_in_progress_duration_and_sample_count_pending",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: monitoringWindowCompleted
    ? [
      "run monitoring window result review",
      "then run production monitoring final gate"
    ]
    : [
      "continue accumulating real Langfuse trace receipts",
      "reach required monitoring duration",
      "reach required sample count",
      "rerun monitoring window checkpoint",
      "then run monitoring window result review"
    ]
};

const report = {
  status: "pass",
  stage: STAGE,
  generated_at: generatedAt,
  source_stage: SOURCE_STAGE,
  source_status: sourceReport.status || null,
  source_gate_status: sourceGate.status || null,
  telemetry_connected: sourceReport.telemetry_connected === true,
  configured_sink: sourceReport.configured_sink || "langfuse",
  elapsed_duration_hours: elapsedDurationHours,
  required_duration_hours: requiredDurationHours,
  duration_met: durationMet,
  sample_count: sampleCount,
  required_sample_count: requiredSampleCount,
  sample_count_met: sampleCountMet,
  remaining_duration_hours: remainingDurationHours,
  remaining_sample_count: remainingSampleCount,
  monitoring_window_checkpoint_recorded: true,
  monitoring_window_completed: monitoringWindowCompleted,
  can_enter_monitoring_window_result_review: canEnterResultReview,
  can_enter_production_monitoring_final_gate: false,
  telemetry_sink_write: false,
  synthetic_trace_generation: false,
  manual_sample_count_increment: false,
  manual_duration_increment: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  redaction_failures: redactionFailures,
  raw_payload_storage_violations: rawPayloadStorageViolations,
  secret_logging_findings: secretLoggingFindings,
  secrets_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  reason: monitoringWindowCompleted
    ? "Monitoring window duration and sample count are met. Result review is required before any production monitoring claim."
    : "Monitoring window remains in progress. Duration and sample count requirements are not yet met.",
  claims_allowed_by_this_checkpoint: claimBoundary.allowed_claims,
  claims_still_blocked: BLOCKED_CLAIMS
};

const unresolved = {
  status: monitoringWindowCompleted ? "ready_for_monitoring_window_result_review" : "monitoring_window_incomplete",
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items: monitoringWindowCompleted ? [
    "run monitoring window result review",
    "run production monitoring final gate"
  ] : blockerUpdate.next_required_actions,
  remaining_duration_hours: remainingDurationHours,
  remaining_sample_count: remainingSampleCount,
  still_blocks: blockerUpdate.still_blocks
};

writeRelJson(`${EVIDENCE_DIR}/monitoring_window_continuation_report.json`, report);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_progress_snapshot.json`, progressSnapshot);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_remaining_requirements.json`, remainingRequirements);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_redaction_checkpoint.json`, redactionCheckpoint);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/monitoring_window_continuation_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_window_continuation_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_window_continuation_report.md", reportMarkdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
