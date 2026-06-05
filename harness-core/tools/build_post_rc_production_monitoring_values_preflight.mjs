#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-values-owner-and-window-preflight";
const CONTROLS_STAGE = "v2.0.0-post-rc-production-monitoring-controls-design-and-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-values-preflight";
const ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-production-monitoring-values-preflight-completed",
  "post-rc-production-monitoring-defaults-drafted",
  "post-rc-production-monitoring-owner-template-drafted",
  "post-rc-production-monitoring-window-preconditions-drafted",
  "post-rc-production-monitoring-window-command-plan-drafted"
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
const MISSING_OPERATOR_VALUES = [
  "dashboard_owner",
  "alert_channel",
  "alert_review_owner",
  "escalation_policy",
  "missing_trace_rate_threshold",
  "error_rate_threshold",
  "p95_latency_threshold_ms",
  "minimum_duration",
  "required_sample_count",
  "trace_retention_period",
  "pii_retention_policy",
  "incident_owner",
  "escalation_owner",
  "rollback_owner"
];
const OBSERVABILITY_FILES = {
  operatorValues: "observability/production_monitoring_operator_values_template.yaml",
  recommendedDefaults: "observability/production_monitoring_recommended_defaults.yaml",
  ownerAssignment: "observability/production_monitoring_owner_assignment_template.yaml",
  windowPolicy: "observability/production_monitoring_window_execution_policy.yaml",
  finalGatePolicy: "observability/production_monitoring_final_gate_policy.yaml"
};
const SNAPSHOT_FILES = {
  operatorValues: `${EVIDENCE_DIR}/production_monitoring_operator_values_template_snapshot.yaml`,
  recommendedDefaults: `${EVIDENCE_DIR}/production_monitoring_recommended_defaults_snapshot.yaml`,
  ownerAssignment: `${EVIDENCE_DIR}/production_monitoring_owner_assignment_template_snapshot.yaml`,
  commandPlan: `${EVIDENCE_DIR}/production_monitoring_window_command_plan_snapshot.yaml`
};

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

function preflightMarkdown(report) {
  return `# Post-RC Production Monitoring Values Owner and Window Preflight

Status: ${report.status}

- Stage: ${report.stage}
- Telemetry connected: ${report.telemetry_connected}
- Production monitoring controls drafted: ${report.production_monitoring_controls_drafted}
- Operator values complete: ${report.operator_values_complete}
- Monitoring window can execute: ${report.monitoring_window_can_execute}
- Telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: ${report.local_model_execution}
- Production-monitored allowed: ${report.production_monitored_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}

Reason: ${report.reason}
`;
}

function gateMarkdown(gate) {
  return `# Post-RC Production Monitoring Values Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Operator values required: ${gate.operator_values_required}
- Monitoring window can execute: ${gate.monitoring_window_can_execute}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}

Reason: ${gate.reason}
`;
}

function writeReleaseArtifacts() {
  writeRelText("release/post_rc_production_monitoring_values_owner_preflight_scope.yaml", `stage: ${STAGE}

approved_actions:
  production_monitoring_values_template: true
  recommended_defaults_draft: true
  owner_assignment_template: true
  monitoring_window_precondition_definition: true
  monitoring_window_command_plan: true
  production_monitoring_final_gate_policy: true
  blocker_update: true
  claim_boundary_audit: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  live_monitoring_window_execution: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true

claims_allowed:
  - post-rc-production-monitoring-values-preflight-completed
  - post-rc-production-monitoring-defaults-drafted
  - post-rc-production-monitoring-owner-template-drafted
  - post-rc-production-monitoring-window-preconditions-drafted
  - post-rc-production-monitoring-window-command-plan-drafted

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

  writeRelText("release/post_rc_production_monitoring_values_owner_gate.yaml", `stage: ${STAGE}
status: blocked_by_missing_operator_values
operator_values_required: true
operator_values_complete: false
monitoring_window_can_execute: false
production_monitored_allowed: false
production_ready_allowed: false
stable_allowed: false
requires_before_monitoring_window:
  - operator_values_complete
  - operator_approval_for_monitoring_window
  - telemetry_connected
  - production_monitoring_controls_drafted
`);

  writeRelText("release/post_rc_production_monitoring_window_preconditions.yaml", `stage: ${STAGE}
status: operator_values_required
telemetry_connected: true
production_monitoring_controls_drafted: true
operator_values_complete: false
monitoring_window_can_execute: false
local_endpoint_required_for_monitoring_window: false
local_endpoint_deferred: true
missing_operator_values:
${MISSING_OPERATOR_VALUES.map((value) => `  - ${value}`).join("\n")}
`);

  writeRelText("release/post_rc_production_monitoring_values_approval_request.md", `# Post-RC Production Monitoring Values Approval Request

Stage: ${STAGE}

Operator input is required before the monitoring window can execute. Fill the operator values template, approve the recommended defaults or replace them, assign incident and escalation owners, and approve the monitoring window execution command plan.

This request does not authorize production-monitored, production-ready, stable, provider-diverse, local-model-verified, telemetry sink write, OpenAI model API call, or local endpoint probing.
`);

  writeRelText("release/post_rc_production_monitoring_window_command_plan.yaml", `command_plan:
  stage_to_execute_after_operator_values: v2.0.0-post-rc-production-monitoring-window-execution

  required_before_execution:
    - operator_values_complete
    - operator_approval_for_monitoring_window
    - telemetry_connected
    - production_monitoring_controls_drafted

  commands:
    - node harness-core/tools/run_post_rc_production_monitoring_window.mjs
    - node harness-core/tools/check_post_rc_production_monitoring_window.mjs

  not_executable_in_this_stage: true

  still_forbidden:
    - production-monitored
    - production-ready
    - stable
    - provider-diverse
    - local-model-verified
`);

  writeRelText("evals/suites/post_rc_production_monitoring_values_preflight.yaml", `suite_id: post_rc_production_monitoring_values_preflight
stage: ${STAGE}
description: Records operator-defined values, owner assignment, retention, and monitoring window preconditions before any monitoring window execution.
forbidden_execution:
  openai_model_api_call: true
  telemetry_sink_write: true
  live_monitoring_window_execution: true
  local_endpoint_probe: true
  local_model_execution: true
gate:
  script: tools/check_post_rc_production_monitoring_values_preflight.mjs
expected_status: blocked_by_missing_operator_values
required_artifacts:
  - ${EVIDENCE_DIR}/production_monitoring_values_preflight_report.json
  - ${EVIDENCE_DIR}/production_monitoring_window_preconditions.json
  - ${EVIDENCE_DIR}/production_monitoring_values_claim_boundary.json
  - ${EVIDENCE_DIR}/production_monitoring_values_blocker_update.json
  - ${EVIDENCE_DIR}/production_monitoring_values_gate_report.json
`);
}

function writeObservabilityArtifacts() {
  writeRelText(OBSERVABILITY_FILES.operatorValues, `operator_values:
  status: pending_operator_input

  dashboard:
    langfuse_project_name: operator_required
    dashboard_url: operator_required_or_not_available
    dashboard_owner: operator_required

  alerting:
    alert_channel: operator_required
    alert_review_owner: operator_required
    escalation_policy: operator_required

  anomaly_thresholds:
    missing_trace_rate_threshold: operator_required
    error_rate_threshold: operator_required
    p95_latency_threshold_ms: operator_required
    redaction_failure_threshold: 0
    raw_payload_storage_violation_threshold: 0
    secret_logging_threshold: 0

  monitoring_window:
    minimum_duration: operator_required
    required_sample_count: operator_required
    allowed_environment: operator_required

  retention:
    trace_retention_period: operator_required
    pii_retention_policy: operator_required
    raw_payload_storage_allowed: false
    secret_storage_allowed: false

  incident_response:
    incident_owner: operator_required
    escalation_owner: operator_required
    rollback_owner: operator_required
`);

  writeRelText(OBSERVABILITY_FILES.recommendedDefaults, `recommended_defaults:
  status: draft_requires_operator_approval

  anomaly_thresholds:
    redaction_failure_threshold: 0
    raw_payload_storage_violation_threshold: 0
    secret_logging_threshold: 0
    missing_trace_rate_threshold: "operator_review_recommended"
    error_rate_threshold: "operator_review_recommended"
    p95_latency_threshold_ms: "operator_review_recommended"

  monitoring_window:
    recommended_minimum_duration: "24h"
    recommended_required_sample_count: "operator_review_recommended"
    recommended_environment: "post-rc non-production or controlled production-like environment"

  retention:
    raw_payload_storage_allowed: false
    secret_storage_allowed: false
    trace_retention_period: "operator_review_recommended"
    pii_retention_policy: "operator_review_recommended"

  approval_required: true
`);

  writeRelText(OBSERVABILITY_FILES.ownerAssignment, `owner_assignment:
  status: pending_operator_input
  incident_owner: operator_required
  escalation_owner: operator_required
  rollback_owner: operator_required
  dashboard_owner: operator_required
  alert_review_owner: operator_required
  approval_owner: operator_required
  owner_approval_recorded: false
`);

  writeRelText(OBSERVABILITY_FILES.windowPolicy, `monitoring_window_execution_policy:
  status: preflight_only
  execution_allowed_in_this_stage: false
  operator_values_complete_required: true
  operator_approval_required: true
  telemetry_connected_required: true
  production_monitoring_controls_drafted_required: true
  local_endpoint_required: false
  local_endpoint_deferred: true
  evidence_required_after_execution:
    - continuous_trace_receipts
    - zero_redaction_failures
    - zero_secret_logging_findings
    - alert_policy_review
    - incident_owner_acknowledgement
`);

  writeRelText(OBSERVABILITY_FILES.finalGatePolicy, `production_monitoring_final_gate_policy:
  status: drafted
  gate_not_executed_in_this_stage: true
  required_before_production_monitored:
    - operator_values_complete
    - operator_approval_for_monitoring_window
    - monitoring_window_completed
    - continuous_trace_receipts_recorded
    - zero_redaction_failures
    - zero_secret_logging_findings
    - alerting_policy_reviewed
    - incident_response_owner_acknowledged
    - retention_policy_values_approved
  still_blocked_until_gate_pass:
    - production-monitored
    - production-ready
    - stable
`);

  copyToSnapshot(OBSERVABILITY_FILES.operatorValues, SNAPSHOT_FILES.operatorValues);
  copyToSnapshot(OBSERVABILITY_FILES.recommendedDefaults, SNAPSHOT_FILES.recommendedDefaults);
  copyToSnapshot(OBSERVABILITY_FILES.ownerAssignment, SNAPSHOT_FILES.ownerAssignment);
  copyToSnapshot("release/post_rc_production_monitoring_window_command_plan.yaml", SNAPSHOT_FILES.commandPlan);
}

function writeDocs() {
  writeRelText("docs/production_monitoring_values_owner_preflight.md", `# Production Monitoring Values Owner and Window Preflight

Stage: ${STAGE}

This stage records the operator-defined values, owner assignment inputs, retention value requirements, and monitoring window command plan needed before production monitoring execution. It does not execute the monitoring window or enable production-monitored.
`);

  writeRelText("docs/production_monitoring_operator_values_template.md", `# Production Monitoring Operator Values Template

The operator values template identifies dashboard, alerting, anomaly threshold, monitoring window, retention, and incident response values that must be completed before monitoring window execution.
`);

  writeRelText("docs/production_monitoring_recommended_defaults.md", `# Production Monitoring Recommended Defaults

Recommended defaults are draft-only and require operator approval. Zero tolerance is drafted for redaction failures, raw payload storage violations, and secret logging.
`);

  writeRelText("docs/production_monitoring_window_execution_plan.md", `# Production Monitoring Window Execution Plan

The command plan is recorded for a later stage only. It is not executable in this preflight stage, and the monitoring window cannot execute until operator values and approval are complete.
`);

  writeRelText("docs/production_monitoring_values_approval_request.md", `# Production Monitoring Values Approval Request

Operator approval is required for production monitoring values, incident and escalation owners, retention values, and monitoring window execution. This document does not authorize production-monitored or any production readiness claim.
`);

  writeRelText("docs/next_monitoring_window_execution_plan.md", `# Next Monitoring Window Execution Plan

Next stage candidate: v2.0.0-post-rc-production-monitoring-window-execution.

Required first: completed operator values template, explicit operator approval for monitoring window execution, and confirmation that telemetry-connected and production monitoring controls drafted evidence remain valid.
`);
}

writeReleaseArtifacts();
writeObservabilityArtifacts();
writeDocs();

const controlsReport = readJsonIfExists("evidence/post-rc-production-monitoring-controls/production_monitoring_controls_report.json") || {};
const controlsGate = readJsonIfExists("evidence/post-rc-production-monitoring-controls/production_monitoring_gate_report.json") || {};
const controlsReady = controlsReport.status === "pass"
  && controlsReport.stage === CONTROLS_STAGE
  && controlsReport.telemetry_connected === true
  && controlsReport.production_monitoring_ready === false
  && controlsReport.production_monitored_allowed === false
  && controlsGate.status === "pass"
  && controlsGate.production_monitoring_controls_drafted === true;

const windowPreconditions = {
  status: "operator_values_required",
  stage: STAGE,
  telemetry_connected: true,
  production_monitoring_controls_drafted: controlsReady,
  operator_values_complete: false,
  monitoring_window_can_execute: false,
  missing_operator_values: MISSING_OPERATOR_VALUES,
  local_endpoint_required_for_monitoring_window: false,
  local_endpoint_deferred: true
};

const claimBoundary = {
  status: controlsReady ? "pass" : "fail",
  stage: STAGE,
  telemetry_connected_allowed: true,
  production_monitoring_controls_drafted: controlsReady,
  operator_values_complete: false,
  monitoring_window_completed: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: controlsReady ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "production_monitoring_controls_drafted_monitoring_window_pending",
  new_status: "operator_values_required_before_monitoring_window",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: [
    "operator fills production monitoring values template",
    "operator approves monitoring window execution",
    "execute monitoring window",
    "review monitoring window results",
    "run production monitoring final gate"
  ]
};

const report = {
  status: controlsReady ? "blocked_by_missing_operator_values" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  source_stage: CONTROLS_STAGE,
  telemetry_connected: true,
  configured_sink: "langfuse",
  production_monitoring_controls_drafted: controlsReady,
  new_execution: false,
  telemetry_sink_write: false,
  live_monitoring_window_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  operator_values_required: true,
  operator_values_complete: false,
  monitoring_window_can_execute: false,
  recommended_defaults_status: "draft_requires_operator_approval",
  local_endpoint_required_for_monitoring_window: false,
  local_endpoint_deferred: true,
  production_monitoring_ready: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  missing_operator_values: MISSING_OPERATOR_VALUES,
  reason: controlsReady
    ? "Production monitoring values and owners must be completed before monitoring window execution."
    : "Production monitoring controls gate evidence is missing or not passing."
};

const unresolved = {
  status: "operator_values_required_before_monitoring_window",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  unresolved_items_count: MISSING_OPERATOR_VALUES.length,
  missing_operator_values: MISSING_OPERATOR_VALUES,
  next_required_actions: blockerUpdate.next_required_actions,
  still_blocks: blockerUpdate.still_blocks
};

const gateReport = {
  status: report.status,
  stage: STAGE,
  operator_values_required: true,
  monitoring_window_can_execute: false,
  can_claim_telemetry_connected: controlsReady,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: report.reason
};

writeRelJson(`${EVIDENCE_DIR}/production_monitoring_values_preflight_report.json`, report);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_window_preconditions.json`, windowPreconditions);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_values_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_values_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_values_gate_report.json`, gateReport);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_values_preflight_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_values_preflight_report.md", preflightMarkdown(report));
writeRelJson("evals/reports/post_rc_production_monitoring_values_gate_report.json", gateReport);
writeRelText("evals/reports/post_rc_production_monitoring_values_gate_report.md", gateMarkdown(gateReport));

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
