#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-controls-design-and-gate";
const READINESS_STAGE = "v2.0.0-post-rc-production-monitoring-readiness";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-controls";
const ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-production-monitoring-controls-drafted",
  "post-rc-production-monitoring-gate-designed",
  "post-rc-production-monitoring-claim-boundary-audited",
  "post-rc-production-monitoring-blocker-updated"
];
const BLOCKED_CLAIMS = [
  "production-monitored",
  "production-ready",
  "stable",
  "provider-diverse",
  "local-model-verified",
  "provider-verified",
  "adapter-checked",
  "release-gated"
];
const CONTROL_FILES = {
  dashboard: "observability/production_monitoring_dashboard_spec.yaml",
  alerting: "observability/production_monitoring_alerting_policy.yaml",
  anomaly: "observability/production_monitoring_anomaly_thresholds.yaml",
  window: "observability/production_monitoring_window_policy.yaml",
  incident: "observability/production_monitoring_incident_response_policy.yaml",
  rollback: "observability/production_monitoring_rollback_linkage_policy.yaml",
  retention: "observability/production_monitoring_retention_policy.yaml"
};
const SNAPSHOT_FILES = {
  dashboard: `${EVIDENCE_DIR}/production_monitoring_dashboard_spec_snapshot.yaml`,
  alerting: `${EVIDENCE_DIR}/production_monitoring_alerting_policy_snapshot.yaml`,
  anomaly: `${EVIDENCE_DIR}/production_monitoring_anomaly_thresholds_snapshot.yaml`,
  window: `${EVIDENCE_DIR}/production_monitoring_window_policy_snapshot.yaml`,
  incident: `${EVIDENCE_DIR}/production_monitoring_incident_response_snapshot.yaml`,
  rollback: `${EVIDENCE_DIR}/production_monitoring_rollback_linkage_snapshot.yaml`,
  retention: `${EVIDENCE_DIR}/production_monitoring_retention_policy_snapshot.yaml`
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

function writeRelTextIfMissing(relPath, value) {
  if (exists(relPath)) return;
  writeRelText(relPath, value);
}

function writeRelJson(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function copyToSnapshot(sourceRel, snapshotRel) {
  writeRelText(snapshotRel, readText(p(...sourceRel.split("/"))));
}

function controlsMarkdown(report) {
  return `# Post-RC Production Monitoring Controls

Status: ${report.status}

- Stage: ${report.stage}
- Telemetry connected: ${report.telemetry_connected}
- Configured sink: ${report.configured_sink}
- New execution: ${report.new_execution}
- Telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: ${report.local_model_execution}
- Production monitoring ready: ${report.production_monitoring_ready}
- Production-monitored allowed: ${report.production_monitored_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}

Reason: ${report.reason}
`;
}

function claimBoundaryMarkdown(boundary) {
  return `# Post-RC Production Monitoring Claim Boundary

Status: ${boundary.status}

- Telemetry-connected allowed: ${boundary.telemetry_connected_allowed}
- Production monitoring controls drafted: ${boundary.production_monitoring_controls_drafted}
- Production-monitored allowed: ${boundary.production_monitored_allowed}
- Production-ready allowed: ${boundary.production_ready_allowed}
- Stable allowed: ${boundary.stable_allowed}
- Provider-diverse allowed: ${boundary.provider_diverse_allowed}
- Local-model-verified allowed: ${boundary.local_model_verified_allowed}

Reason: ${boundary.reason}
`;
}

function writeStaticReleaseArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_controls_scope.yaml", `stage: ${STAGE}

approved_actions:
  production_monitoring_controls_design: true
  dashboard_spec_drafting: true
  alerting_policy_drafting: true
  anomaly_threshold_drafting: true
  monitoring_window_policy_drafting: true
  incident_response_policy_drafting: true
  rollback_monitoring_linkage_drafting: true
  retention_policy_drafting: true
  claim_boundary_audit: true
  blocker_update: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  redteam_rerun: true
  containment_rerun: true
  local_endpoint_probe: true
  local_model_execution: true
  telemetry_sink_write: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true

claims_allowed:
  - post-rc-production-monitoring-controls-drafted
  - post-rc-production-monitoring-gate-designed
  - post-rc-production-monitoring-claim-boundary-audited
  - post-rc-production-monitoring-blocker-updated

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

  writeRelText("release/gates/post-rc/post_rc_production_monitoring_gate.yaml", `stage: ${STAGE}
status: designed
production_monitoring_controls_drafted: true
production_monitoring_ready: false
production_monitored_allowed: false
requires_before_production_monitored:
  - operator_defined_dashboard_values
  - operator_defined_threshold_values
  - incident_owner_and_escalation_path
  - retention_policy_values
  - executed_monitoring_window
  - final_production_monitoring_gate_pass
forbidden_claims:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - release-gated
`);

  writeRelText("release/claims/post-rc/post_rc_production_monitoring_claim_boundary.yaml", `stage: ${STAGE}
telemetry_connected_allowed: true
production_monitoring_controls_drafted: true
production_monitored_allowed: false
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
local_model_verified_allowed: false
allowed_claims:
  - telemetry-connected
  - post-rc-production-monitoring-controls-drafted
  - post-rc-production-monitoring-gate-designed
  - post-rc-production-monitoring-claim-boundary-audited
  - post-rc-production-monitoring-blocker-updated
blocked_claims:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - local-model-verified
  - provider-verified
  - adapter-checked
  - release-gated
`);

  writeRelText("release/blockers/post-rc/post_rc_production_monitoring_blocker_update.yaml", `stage: ${STAGE}
status: production_monitoring_controls_drafted_monitoring_window_pending
previous_status: blocked_not_production_monitored
still_blocks:
  - production-monitored
  - production-ready
  - stable
does_not_block:
  - telemetry-connected
next_required_actions:
  - operator defines dashboard and threshold values
  - operator defines incident owner and escalation path
  - operator defines retention policy values
  - execute monitoring window
  - run production monitoring final gate
`);

  writeRelText("evals/suites/post_rc_production_monitoring_controls.yaml", `suite_id: post_rc_production_monitoring_controls
stage: ${STAGE}
description: Designs production monitoring controls and claim gate without enabling production-monitored.
forbidden_execution:
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  telemetry_sink_write: true
gate:
  script: tools/checks/observability/check_post_rc_production_monitoring_controls.mjs
required_artifacts:
  - ${EVIDENCE_DIR}/production_monitoring_controls_report.json
  - ${EVIDENCE_DIR}/production_monitoring_claim_boundary.json
  - ${EVIDENCE_DIR}/production_monitoring_blocker_update.json
  - ${EVIDENCE_DIR}/production_monitoring_gate_report.json
`);
}

function writeControlSpecs() {
  writeRelText(CONTROL_FILES.dashboard, `dashboard:
  name: post_rc_langfuse_monitoring_dashboard
  sink: langfuse
  required_panels:
    - trace_volume
    - error_rate
    - latency_distribution
    - tool_or_harness_failure_count
    - redaction_failure_count
    - missing_trace_count
    - cost_or_token_usage_if_available
  status: drafted
  live_dashboard_created: false
`);

  writeRelText(CONTROL_FILES.alerting, `alerting_policy:
  status: drafted
  alerts:
    - name: redaction_failure_detected
      severity: critical
      condition: redaction_failure_count > 0
    - name: missing_trace_spike
      severity: high
      condition: missing_trace_rate exceeds threshold
    - name: error_rate_spike
      severity: high
      condition: error_rate exceeds threshold
    - name: latency_regression
      severity: medium
      condition: p95 latency exceeds threshold
  live_alerts_enabled: false
`);

  writeRelText(CONTROL_FILES.anomaly, `anomaly_thresholds:
  status: drafted
  thresholds:
    redaction_failure_count:
      critical: "> 0"
    raw_payload_storage_violation:
      critical: "> 0"
    missing_trace_rate:
      high: "operator_defined"
    error_rate:
      high: "operator_defined"
    p95_latency:
      medium: "operator_defined"
  operator_defined_values_required: true
`);

  writeRelText(CONTROL_FILES.window, `monitoring_window:
  status: drafted
  minimum_window_required_before_production_monitored: true
  recommended_minimum_window: "operator_defined"
  window_completed: false
  evidence_required:
    - continuous_trace_receipts
    - zero_redaction_failures
    - zero_secret_logging_findings
    - alert_policy_review
    - incident_owner_acknowledgement
`);

  writeRelText(CONTROL_FILES.incident, `incident_response:
  status: drafted
  incident_owner_defined: false
  escalation_path_defined: false
  required_before_production_monitored:
    - incident_owner_defined
    - escalation_path_defined
    - rollback_owner_defined
`);

  writeRelText(CONTROL_FILES.rollback, `rollback_monitoring_linkage:
  status: drafted
  linked_to_rollback_plan: true
  rollback_triggers:
    - redaction_failure_detected
    - raw_payload_storage_violation
    - telemetry_sink_unavailable
    - sustained_error_rate_spike
  live_rollback_monitoring_tested: false
`);

  writeRelText(CONTROL_FILES.retention, `retention_policy:
  status: drafted
  raw_payload_storage_allowed: false
  secret_storage_allowed: false
  trace_retention_period: "operator_defined"
  pii_retention_policy: "operator_defined"
  operator_values_required: true
`);

  for (const key of Object.keys(CONTROL_FILES)) {
    copyToSnapshot(CONTROL_FILES[key], SNAPSHOT_FILES[key]);
  }
}

function writeDocs() {
  writeRelText("docs/observability/production_monitoring_controls.md", `# Production Monitoring Controls

Stage: ${STAGE}

This stage drafts production monitoring controls for the telemetry-connected Langfuse sink. It does not execute a monitoring window, enable live alerts, perform additional telemetry writes, or allow production-monitored.
`);

  writeRelText("docs/observability/production_monitoring_dashboard_spec.md", `# Production Monitoring Dashboard Spec

The drafted dashboard requires trace volume, error rate, latency distribution, tool or harness failure count, redaction failure count, missing trace count, and cost or token usage when available. The live dashboard is not created in this stage.
`);

  writeRelText("docs/observability/production_monitoring_alerting_policy.md", `# Production Monitoring Alerting Policy

The drafted alerting policy covers redaction failures, missing trace spikes, error rate spikes, and latency regressions. Live alerts remain disabled until a later production monitoring gate.
`);

  writeRelText("docs/observability/production_monitoring_anomaly_thresholds.md", `# Production Monitoring Anomaly Thresholds

Critical thresholds are drafted for redaction and raw payload storage violations. Missing trace rate, error rate, and p95 latency require operator-defined values before production-monitored can be considered.
`);

  writeRelText("docs/observability/production_monitoring_window_policy.md", `# Production Monitoring Window Policy

Production-monitored requires an executed minimum monitoring window with continuous trace receipts, zero redaction failures, zero secret logging findings, alert policy review, and incident owner acknowledgement.
`);

  writeRelText("docs/observability/production_monitoring_incident_response.md", `# Production Monitoring Incident Response

Incident owner, escalation path, and rollback owner remain required before production-monitored. This stage drafts the requirement but does not assign those owners.
`);

  writeRelText("docs/observability/production_monitoring_rollback_linkage.md", `# Production Monitoring Rollback Linkage

Rollback triggers are drafted for redaction failures, raw payload storage violations, telemetry sink unavailability, and sustained error rate spikes. Live rollback monitoring is not tested in this stage.
`);

  writeRelText("docs/plans/next_production_monitoring_window_plan.md", `# Next Production Monitoring Window Plan

Next actions are operator value completion, owner assignment, retention value completion, monitoring window execution, and final production monitoring gate execution.
`);

  writeRelTextIfMissing("docs/plans/next_stable_scope_decision_plan.md", `# Next Stable Scope Decision Plan

Stable scope decision remains blocked until monitoring and local paths are resolved or explicitly ruled out of scope by owner decision.
`);
}

writeStaticReleaseArtifacts();
writeControlSpecs();
writeDocs();

const readiness = readJsonIfExists("evidence/post-rc-production-monitoring-readiness/production_monitoring_readiness_assessment.json") || {};
const resultReview = readJsonIfExists("evidence/post-rc-telemetry-connection-result-review/telemetry_connection_result_review.json") || {};
const telemetryConnected = readiness.status === "blocked_not_production_monitored"
  && readiness.telemetry_connected === true
  && resultReview.status === "pass"
  && resultReview.telemetry_connected_allowed === true;

const controls = {
  dashboard_spec_defined: exists(CONTROL_FILES.dashboard),
  alerting_policy_defined: exists(CONTROL_FILES.alerting),
  anomaly_thresholds_defined: exists(CONTROL_FILES.anomaly),
  monitoring_window_policy_defined: exists(CONTROL_FILES.window),
  incident_response_owner_policy_defined: exists(CONTROL_FILES.incident),
  rollback_monitoring_linkage_defined: exists(CONTROL_FILES.rollback),
  retention_policy_defined: exists(CONTROL_FILES.retention),
  production_monitoring_gate_defined: exists("release/gates/post-rc/post_rc_production_monitoring_gate.yaml")
};
const allControlsDefined = Object.values(controls).every((value) => value === true);
const report = {
  status: telemetryConnected && allControlsDefined ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  telemetry_connected: telemetryConnected,
  configured_sink: "langfuse",
  new_execution: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  controls,
  production_monitoring_ready: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  reason: "Production monitoring controls are drafted, but production-monitored requires an executed monitoring window and production monitoring gate."
};

const claimBoundary = {
  status: report.status,
  stage: STAGE,
  telemetry_connected_allowed: telemetryConnected,
  production_monitoring_controls_drafted: allControlsDefined,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: report.status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Controls are drafted but production-monitored requires live monitoring window evidence and final production monitoring gate."
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "blocked_not_production_monitored",
  new_status: "production_monitoring_controls_drafted_monitoring_window_pending",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: [
    "operator defines dashboard and threshold values",
    "operator defines incident owner and escalation path",
    "operator defines retention policy values",
    "execute monitoring window",
    "run production monitoring final gate"
  ]
};

const unresolved = {
  status: "monitoring_window_pending",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  items: blockerUpdate.next_required_actions.map((action) => ({
    action,
    status: "pending_before_production_monitored"
  })),
  still_blocks: blockerUpdate.still_blocks
};

writeRelJson(`${EVIDENCE_DIR}/production_monitoring_controls_report.json`, report);
writeRelText(`${EVIDENCE_DIR}/production_monitoring_controls_report.md`, controlsMarkdown(report));
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_claim_boundary.json`, claimBoundary);
writeRelJson(`${EVIDENCE_DIR}/production_monitoring_blocker_update.json`, blockerUpdate);
writeRelJson(`${EVIDENCE_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_controls_report.json", report);
writeRelText("evals/reports/post_rc_production_monitoring_controls_report.md", controlsMarkdown(report));
writeRelJson("evals/reports/post_rc_production_monitoring_claim_boundary_report.json", claimBoundary);
writeRelText("evals/reports/post_rc_production_monitoring_claim_boundary_report.md", claimBoundaryMarkdown(claimBoundary));

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
