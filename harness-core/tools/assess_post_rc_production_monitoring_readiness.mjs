#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const REVIEW_STAGE = "v2.0.0-post-rc-telemetry-connection-result-review";
const READINESS_STAGE = "v2.0.0-post-rc-production-monitoring-readiness";
const REVIEW_DIR = "evidence/post-rc-telemetry-connection-result-review";
const READINESS_DIR = "evidence/post-rc-production-monitoring-readiness";
const REQUIRED_CONTROL_NAMES = [
  "dashboard specification",
  "alerting policy",
  "anomaly thresholds",
  "minimum monitoring window",
  "incident response owner",
  "rollback monitoring linkage",
  "retention policy",
  "production monitoring gate"
];
const REQUIRED_CONTROLS = {
  dashboard_defined: false,
  alerting_policy_defined: false,
  anomaly_thresholds_defined: false,
  monitoring_window_completed: false,
  incident_response_owner_defined: false,
  rollback_monitoring_linked: false,
  retention_policy_defined: false
};
const BLOCKED_CLAIMS = [
  "production-monitored",
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
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

function writeRelTextIfMissing(relPath, value) {
  if (exists(relPath)) return;
  writeRelText(relPath, value);
}

function readinessMarkdown(assessment) {
  return `# Post-RC Production Monitoring Readiness

Status: ${assessment.status}

- Stage: ${assessment.stage}
- Telemetry connected: ${assessment.telemetry_connected}
- Langfuse sink connected: ${assessment.langfuse_sink_connected}
- Live trace receipt recorded: ${assessment.live_trace_receipt_recorded}
- Production monitoring ready: ${assessment.production_monitoring_ready}
- Production-monitored allowed: ${assessment.production_monitored_allowed}
- Production-ready allowed: ${assessment.production_ready_allowed}
- Stable allowed: ${assessment.stable_allowed}

Reason: ${assessment.reason}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/post_rc_production_monitoring_readiness_gate.yaml", `stage: ${READINESS_STAGE}
source_stage: ${REVIEW_STAGE}
status: blocked_not_production_monitored
production_monitored_allowed: false
requires_before_production_monitored:
  - dashboard specification
  - alerting policy
  - anomaly thresholds
  - minimum monitoring window
  - incident response owner
  - rollback monitoring linkage
  - retention policy
  - production monitoring gate
does_not_require_now:
  - local endpoint
  - provider diversity
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

  writeRelText("release/post_rc_production_monitoring_blocker_update.yaml", `stage: ${READINESS_STAGE}
status: blocked_not_production_monitored
resolved:
  - telemetry-connected evidence reviewed
remaining_blockers:
  - dashboard specification
  - alerting policy
  - anomaly thresholds
  - minimum monitoring window
  - incident response owner
  - rollback monitoring linkage
  - retention policy
  - production monitoring gate
local_endpoint_status: deferred_future_lane
provider_diversity_status: not_required_for_this_readiness_assessment
`);

  writeRelText("evals/suites/post_rc_production_monitoring_readiness.yaml", `suite_id: post_rc_production_monitoring_readiness
stage: ${READINESS_STAGE}
description: Assesses whether telemetry-connected evidence is enough to enter production-monitored. Expected result is blocked_not_production_monitored.
forbidden_execution:
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  telemetry_sink_additional_write: true
gate:
  script: tools/check_post_rc_production_monitoring_readiness.mjs
required_artifacts:
  - ${READINESS_DIR}/production_monitoring_readiness_assessment.json
  - ${READINESS_DIR}/production_monitoring_required_controls.json
  - ${READINESS_DIR}/production_monitoring_blocker_update.json
  - ${READINESS_DIR}/production_monitoring_claim_boundary.json
`);

  writeRelTextIfMissing("docs/production_monitoring_readiness.md", `# Production Monitoring Readiness

Stage: ${READINESS_STAGE}

Telemetry is connected through Langfuse, but this is not production monitoring. Production monitoring remains blocked until dashboard, alerting, anomaly thresholds, monitoring window, incident owner, rollback linkage, retention, and a production monitoring gate are established.
`);

  writeRelTextIfMissing("docs/production_monitoring_remaining_controls.md", `# Production Monitoring Remaining Controls

Required before production-monitored:
- dashboard specification
- alerting policy
- anomaly thresholds
- minimum monitoring window
- incident response owner
- rollback monitoring linkage
- retention policy
- production monitoring gate

Local endpoint and provider diversity are not required for this readiness assessment, but they remain separate future lanes.
`);

  writeRelTextIfMissing("docs/next_production_monitoring_gate_plan.md", `# Next Production Monitoring Gate Plan

The next production monitoring gate should define and validate dashboard coverage, alerting policy, anomaly thresholds, minimum monitoring window, incident response ownership, rollback linkage, retention policy, and claim boundary.

It must not infer production-ready, stable, provider-diverse, or local-model-verified from telemetry-connected evidence.
`);

  writeRelTextIfMissing("docs/next_local_canary_after_endpoint_ready.md", `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until an operator provides a ready endpoint. This readiness assessment did not probe local endpoints and did not execute vLLM, Ollama, or any local model.
`);

  writeRelTextIfMissing("docs/next_stable_scope_decision_plan.md", `# Next Stable Scope Decision Plan

Stable scope decision remains blocked until monitoring and local paths are either resolved by gates or explicitly ruled out of scope by an owner decision.

Telemetry-connected alone does not allow stable, production-ready, production-monitored, provider-diverse, provider-verified, adapter-checked, or local-model-verified.
`);
}

const review = readJsonIfExists(`${REVIEW_DIR}/telemetry_connection_result_review.json`) || {};
const receiptIndex = readJsonIfExists(`${REVIEW_DIR}/langfuse_receipt_evidence_index.json`) || {};
const telemetryConnected = review.status === "pass"
  && review.telemetry_connected_allowed === true
  && review.telemetry_connection === true
  && review.telemetry_sink_write === true
  && receiptIndex.status === "pass";

const assessment = {
  status: "blocked_not_production_monitored",
  stage: READINESS_STAGE,
  source_stage: REVIEW_STAGE,
  generated_at: new Date().toISOString(),
  telemetry_connected: telemetryConnected,
  langfuse_sink_connected: review.configured_sink === "langfuse" && review.telemetry_sink_write === true,
  live_trace_receipt_recorded: review.live_trace_receipt_recorded === true,
  production_monitoring_ready: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  telemetry_sink_additional_write: false,
  secrets_logged: false,
  raw_payload_stored: false,
  required_controls: REQUIRED_CONTROLS,
  reason: "Telemetry connection exists, but production monitoring controls and monitoring window are not established."
};

const requiredControls = {
  status: "blocked_not_production_monitored",
  stage: READINESS_STAGE,
  required_before_production_monitored: REQUIRED_CONTROL_NAMES,
  does_not_require_now: [
    "local endpoint",
    "provider diversity"
  ],
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ]
};

const blockerUpdate = {
  status: "blocked_not_production_monitored",
  stage: READINESS_STAGE,
  blocker_id: "POST-RC-PRODUCTION-MONITORING-001",
  telemetry_connected: telemetryConnected,
  production_monitoring_ready: false,
  remaining_controls: REQUIRED_CONTROL_NAMES,
  local_endpoint_status: "deferred_future_lane",
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false
};

const claimBoundary = {
  status: "blocked_not_production_monitored",
  stage: READINESS_STAGE,
  telemetry_connected_allowed: telemetryConnected,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: telemetryConnected ? [
    "telemetry-connected",
    "post-rc-telemetry-connection-result-reviewed",
    "post-rc-production-monitoring-readiness-assessed",
    "post-rc-production-monitoring-blocker-recorded"
  ] : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Production monitoring controls and a monitoring window are not established."
};

const unresolved = {
  status: "blocked_not_production_monitored",
  stage: READINESS_STAGE,
  generated_at: new Date().toISOString(),
  items: REQUIRED_CONTROL_NAMES.map((control) => ({
    control,
    status: "missing_before_production_monitored"
  })),
  still_blocks: requiredControls.still_blocks
};

writeStaticArtifacts();
writeRelJson(`${READINESS_DIR}/production_monitoring_readiness_assessment.json`, assessment);
writeRelJson(`${READINESS_DIR}/production_monitoring_required_controls.json`, requiredControls);
writeRelJson(`${READINESS_DIR}/production_monitoring_blocker_update.json`, blockerUpdate);
writeRelJson(`${READINESS_DIR}/production_monitoring_claim_boundary.json`, claimBoundary);
writeRelJson(`${READINESS_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_production_monitoring_readiness_report.json", assessment);
writeRelText("evals/reports/post_rc_production_monitoring_readiness_report.md", readinessMarkdown(assessment));

console.log(JSON.stringify(assessment, null, 2));
process.exit(assessment.status === "blocked_not_production_monitored" && telemetryConnected ? 0 : 1);
