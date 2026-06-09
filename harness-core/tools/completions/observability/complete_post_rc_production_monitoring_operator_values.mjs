#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-operator-values-completion";
const PREFLIGHT_STAGE = "v2.0.0-post-rc-production-monitoring-values-owner-and-window-preflight";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-operator-values-completion";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-production-monitoring-window-execution";
const NEW_ALLOWED_CLAIMS = [
  "post-rc-production-monitoring-operator-values-completed",
  "post-rc-production-monitoring-threshold-values-recorded",
  "post-rc-production-monitoring-owner-assignments-recorded",
  "post-rc-production-monitoring-window-execution-preconditions-satisfied",
  "post-rc-production-monitoring-window-approval-request-generated"
];
const BOUNDARY_ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-production-monitoring-operator-values-completed",
  "post-rc-production-monitoring-window-execution-preconditions-satisfied"
];
const BLOCKED_CLAIMS = [
  "production-monitored",
  "production-ready",
  "stable",
  "provider-diverse",
  "local-model-verified",
  "provider-verified",
  "adapter-checked"
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

function writeRelText(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function writeRelJson(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function copyToSnapshot(sourceRel, snapshotRel) {
  writeRelText(snapshotRel, readText(p(...sourceRel.split("/"))));
}

const operatorValuesYaml = `operator_values:
  status: complete

  dashboard:
    langfuse_project_name: "harness-core-post-rc"
    dashboard_url: "not_available_manual_review"
    dashboard_owner: "operator"

  alerting:
    alert_channel: "manual_review"
    alert_review_owner: "operator"
    escalation_policy: "operator_manual_escalation"

  anomaly_thresholds:
    missing_trace_rate_threshold: "5%"
    error_rate_threshold: "5%"
    p95_latency_threshold_ms: 10000
    redaction_failure_threshold: 0
    raw_payload_storage_violation_threshold: 0
    secret_logging_threshold: 0

  monitoring_window:
    minimum_duration: "24h"
    required_sample_count: 50
    allowed_environment: "post-rc controlled monitoring window"

  retention:
    trace_retention_period: "30d"
    pii_retention_policy: "no_raw_payload_or_secret_storage"
    raw_payload_storage_allowed: false
    secret_storage_allowed: false

  incident_response:
    incident_owner: "operator"
    escalation_owner: "operator"
    rollback_owner: "operator"
`;

const thresholdValuesYaml = `threshold_values:
  status: recorded
  anomaly_thresholds:
    missing_trace_rate_threshold: "5%"
    error_rate_threshold: "5%"
    p95_latency_threshold_ms: 10000
    redaction_failure_threshold: 0
    raw_payload_storage_violation_threshold: 0
    secret_logging_threshold: 0
  zero_tolerance_thresholds:
    redaction_failure_threshold: 0
    raw_payload_storage_violation_threshold: 0
    secret_logging_threshold: 0
`;

const ownerAssignmentsYaml = `owner_assignments:
  status: complete
  dashboard_owner: "operator"
  alert_review_owner: "operator"
  incident_owner: "operator"
  escalation_owner: "operator"
  rollback_owner: "operator"
  owner_assignments_complete: true
`;

const retentionValuesYaml = `retention_values:
  status: recorded
  trace_retention_period: "30d"
  pii_retention_policy: "no_raw_payload_or_secret_storage"
  raw_payload_storage_allowed: false
  secret_storage_allowed: false
  retention_values_recorded: true
`;

function writeReleaseArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_operator_values_completion_scope.yaml", `stage: ${STAGE}

approved_actions:
  operator_values_completion: true
  owner_assignment_completion: true
  threshold_values_recording: true
  retention_values_recording: true
  monitoring_window_precondition_refresh: true
  monitoring_window_approval_request_generation: true
  claim_boundary_audit: true
  blocker_update: true

forbidden_execution:
  monitoring_window_execution: true
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
${NEW_ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

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

  writeRelText("release/gates/post-rc/post_rc_production_monitoring_window_execution_approval_gate.yaml", `stage: ${STAGE}
status: awaiting_operator_window_execution_approval
operator_values_complete: true
owner_assignments_complete: true
threshold_values_recorded: true
retention_values_recorded: true
monitoring_window_can_execute_after_approval: true
monitoring_window_executed: false
required_approval_phrase: "${APPROVAL_PHRASE}"
still_forbidden:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
`);

  const approvalRequest = `# Production Monitoring Window Execution Approval Request

Stage requesting approval:
v2.0.0-post-rc-production-monitoring-window-execution

Required approval phrase:
${APPROVAL_PHRASE}

What will execute after approval:
- monitoring window collection/review
- Langfuse trace receipt continuity check
- redaction/secret violation check
- missing trace / error / latency threshold evaluation
- incident/rollback readiness review

What will not execute:
- OpenAI model API call
- local endpoint probe
- local model execution
- production deployment
- stable release

Passing this stage may support production monitoring window evidence, but does not automatically allow:
- production-ready
- stable
- provider-diverse
- local-model-verified
`;
  writeRelText("release/approvals/post-rc/post_rc_production_monitoring_window_execution_approval_request.md", approvalRequest);
  writeRelText(`${EVIDENCE_DIR}/production_monitoring_window_execution_approval_request.md`, approvalRequest);
  writeRelText("docs/approvals/production_monitoring_window_execution_approval_request.md", approvalRequest);

  writeRelText("evals/suites/post_rc_production_monitoring_operator_values_completion.yaml", `suite_id: post_rc_production_monitoring_operator_values_completion
stage: ${STAGE}
description: Records completed operator values and confirms monitoring window execution can proceed only after explicit approval.
forbidden_execution:
  monitoring_window_execution: true
  telemetry_sink_write: true
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
gate:
  script: tools/checks/observability/check_post_rc_production_monitoring_operator_values_completion.mjs
required_artifacts:
  - ${EVIDENCE_DIR}/production_monitoring_operator_values_completion_report.json
  - ${EVIDENCE_DIR}/production_monitoring_window_preconditions_after_values.json
  - ${EVIDENCE_DIR}/production_monitoring_operator_values_claim_boundary.json
  - ${EVIDENCE_DIR}/production_monitoring_operator_values_gate_report.json
`);
}

function writeObservabilityArtifacts() {
  writeRelText("observability/production_monitoring_operator_values.yaml", operatorValuesYaml);
  writeRelText("observability/production_monitoring_threshold_values.yaml", thresholdValuesYaml);
  writeRelText("observability/production_monitoring_owner_assignments.yaml", ownerAssignmentsYaml);
  writeRelText("observability/production_monitoring_retention_values.yaml", retentionValuesYaml);

  copyToSnapshot(
    "observability/production_monitoring_operator_values.yaml",
    `${EVIDENCE_DIR}/production_monitoring_operator_values_snapshot.yaml`
  );
  copyToSnapshot(
    "observability/production_monitoring_threshold_values.yaml",
    `${EVIDENCE_DIR}/production_monitoring_threshold_values_snapshot.yaml`
  );
  copyToSnapshot(
    "observability/production_monitoring_owner_assignments.yaml",
    `${EVIDENCE_DIR}/production_monitoring_owner_assignments_snapshot.yaml`
  );
  copyToSnapshot(
    "observability/production_monitoring_retention_values.yaml",
    `${EVIDENCE_DIR}/production_monitoring_retention_values_snapshot.yaml`
  );
}

function writeDocs() {
  writeRelText("docs/approvals/production_monitoring_operator_values_completion.md", `# Production Monitoring Operator Values Completion

Stage: ${STAGE}

Operator-provided production monitoring values are recorded for dashboard, alerting, anomaly thresholds, monitoring window, retention, and incident response ownership. This stage does not execute the monitoring window.

Production-monitored, production-ready, stable, provider-diverse, and local-model-verified remain blocked.
`);

  writeRelText("docs/plans/next_monitoring_window_execution_plan.md", `# Next Monitoring Window Execution Plan

Next stage candidate: v2.0.0-post-rc-production-monitoring-window-execution.

Required approval phrase:
${APPROVAL_PHRASE}

The next stage remains blocked until the operator provides the exact approval phrase. It must not execute OpenAI model API calls, local endpoint probes, local model execution, production deployment, or stable release actions.
`);
}

function completionMarkdown(report) {
  return `# Post-RC Production Monitoring Operator Values Completion

Status: ${report.status}

- Stage: ${report.stage}
- Telemetry connected: ${report.telemetry_connected}
- Operator values complete: ${report.operator_values_complete}
- Owner assignments complete: ${report.owner_assignments_complete}
- Threshold values recorded: ${report.threshold_values_recorded}
- Retention values recorded: ${report.retention_values_recorded}
- Monitoring window can execute after approval: ${report.monitoring_window_can_execute_after_approval}
- Monitoring window executed: ${report.monitoring_window_executed}
- Telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: ${report.local_model_execution}
- Production-monitored allowed: ${report.production_monitored_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
`;
}

function gateMarkdown(gate) {
  return `# Post-RC Production Monitoring Operator Values Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Operator values complete: ${gate.operator_values_complete}
- Monitoring window can execute after approval: ${gate.monitoring_window_can_execute_after_approval}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}

Reason: ${gate.reason}
`;
}

writeReleaseArtifacts();
writeObservabilityArtifacts();
writeDocs();

const preflightReport = readJsonIfExists("evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_preflight_report.json") || {};
const preflightReady = preflightReport.stage === PREFLIGHT_STAGE
  && preflightReport.status === "blocked_by_missing_operator_values"
  && preflightReport.telemetry_connected === true
  && preflightReport.production_monitoring_controls_drafted === true;

const valuesComplete = preflightReady;
const preconditionsAfterValues = {
  status: "ready_for_operator_approval",
  stage: STAGE,
  operator_values_complete: valuesComplete,
  monitoring_window_can_execute_after_approval: valuesComplete,
  monitoring_window_executed: false,
  required_approval_phrase: APPROVAL_PHRASE,
  does_not_require_now: [
    "local endpoint",
    "provider diversity"
  ],
  still_forbidden: [
    "production-monitored",
    "production-ready",
    "stable",
    "provider-diverse",
    "local-model-verified"
  ]
};

const actualVsRecommended = [
  {
    field: "missing_trace_rate_threshold",
    recommended_default: "operator_review_recommended",
    operator_value: "5%"
  },
  {
    field: "error_rate_threshold",
    recommended_default: "operator_review_recommended",
    operator_value: "5%"
  },
  {
    field: "p95_latency_threshold_ms",
    recommended_default: "operator_review_recommended",
    operator_value: 10000
  },
  {
    field: "required_sample_count",
    recommended_default: "operator_review_recommended",
    operator_value: 50
  },
  {
    field: "allowed_environment",
    recommended_default: "post-rc non-production or controlled production-like environment",
    operator_value: "post-rc controlled monitoring window"
  },
  {
    field: "trace_retention_period",
    recommended_default: "operator_review_recommended",
    operator_value: "30d"
  },
  {
    field: "pii_retention_policy",
    recommended_default: "operator_review_recommended",
    operator_value: "no_raw_payload_or_secret_storage"
  }
];

const report = {
  status: valuesComplete ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  source_stage: PREFLIGHT_STAGE,
  telemetry_connected: true,
  operator_values_complete: valuesComplete,
  owner_assignments_complete: valuesComplete,
  threshold_values_recorded: valuesComplete,
  retention_values_recorded: valuesComplete,
  monitoring_window_can_execute_after_approval: valuesComplete,
  monitoring_window_executed: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  actual_vs_recommended_differences: actualVsRecommended
};

const claimBoundary = {
  status: report.status,
  stage: STAGE,
  telemetry_connected_allowed: true,
  operator_values_complete: valuesComplete,
  monitoring_window_can_execute_after_approval: valuesComplete,
  monitoring_window_executed: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: valuesComplete ? BOUNDARY_ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "operator_values_required_before_monitoring_window",
  new_status: "operator_values_complete_monitoring_window_approval_pending",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: [
    "operator provides monitoring window execution approval phrase",
    "execute monitoring window",
    "review monitoring window results",
    "run production monitoring final gate"
  ]
};

const unresolved = {
  status: "monitoring_window_execution_approval_pending",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  unresolved_items_count: 4,
  items: blockerUpdate.next_required_actions,
  required_approval_phrase: APPROVAL_PHRASE,
  still_blocks: blockerUpdate.still_blocks
};

const gateReport = {
  status: report.status,
  stage: STAGE,
  operator_values_complete: valuesComplete,
  monitoring_window_can_execute_after_approval: valuesComplete,
  can_claim_telemetry_connected: valuesComplete,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: valuesComplete
    ? "Production monitoring operator values are complete. Monitoring window execution still requires explicit approval."
    : "Production monitoring operator values completion failed."
};

writeRelJson(`${EVIDENCE_DIR}/production_monitoring_operator_values_completion_report.json`, report);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_window_preconditions_after_values.json`, preconditionsAfterValues);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_operator_values_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_operator_values_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_operator_values_gate_report.json`, gateReport);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_operator_values_completion_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_operator_values_completion_report.md", completionMarkdown(report));
writeRelJson("evals/reports/post_rc_production_monitoring_operator_values_gate_report.json", gateReport);
writeRelText("evals/reports/post_rc_production_monitoring_operator_values_gate_report.md", gateMarkdown(gateReport));

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
