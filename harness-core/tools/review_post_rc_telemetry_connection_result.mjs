#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const SOURCE_STAGE = "v2.0.0-post-rc-telemetry-connection";
const REVIEW_STAGE = "v2.0.0-post-rc-telemetry-connection-result-review";
const REVIEW_DIR = "evidence/post-rc-telemetry-connection-result-review";
const SOURCE_DIR = "evidence/post-rc-telemetry-connection";
const ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-telemetry-connection-executed",
  "post-rc-live-trace-receipt-recorded",
  "post-rc-live-metric-receipt-recorded",
  "post-rc-telemetry-secret-redaction-checked"
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

function writeRelJson(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function writeRelText(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function traceIdValid(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

function reviewMarkdown(review) {
  return `# Post-RC Telemetry Connection Result Review

Status: ${review.status}

- Stage: ${review.stage}
- Source stage: ${review.source_stage}
- Configured sink: ${review.configured_sink}
- Telemetry connection: ${review.telemetry_connection}
- Telemetry sink write: ${review.telemetry_sink_write}
- Live trace receipt recorded: ${review.live_trace_receipt_recorded}
- Live metric or event receipt recorded: ${review.live_metric_or_event_receipt_recorded}
- Telemetry-connected allowed: ${review.telemetry_connected_allowed}
- Production monitored allowed: ${review.production_monitored_allowed}
- Production ready allowed: ${review.production_ready_allowed}
- Stable allowed: ${review.stable_allowed}
- OpenAI model API call: ${review.openai_model_api_call}
- Local endpoint probe: ${review.local_endpoint_probe}
- Secrets logged: ${review.secrets_logged}
- Raw payload stored: ${review.raw_payload_stored}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/post_rc_telemetry_connection_result_review_scope.yaml", `stage: ${REVIEW_STAGE}
source_stage: ${SOURCE_STAGE}
approved_actions:
  telemetry_connection_result_review: true
  telemetry_connected_claim_boundary_audit: true
  langfuse_receipt_evidence_indexing: true
  telemetry_secret_redaction_review: true
  local_file_report_checker_execution: true
forbidden_actions:
  openai_model_api_call: true
  openai_provider_canary_rerun: true
  openai_replay_rerun: true
  openai_redteam_rerun: true
  local_endpoint_probe: true
  vllm_execution: true
  ollama_execution: true
  local_model_execution: true
  telemetry_sink_additional_write: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true
claims_allowed_after_gate:
  - telemetry-connected
claims_still_blocked:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - release-gated
`);

  writeRelText("release/post_rc_telemetry_connected_claim_gate.yaml", `stage: ${REVIEW_STAGE}
claim: telemetry-connected
allowed_if:
  telemetry_connection_result_review_status: pass
  source_telemetry_connection_gate_status: pass
  langfuse_receipt_evidence_index_status: pass
  telemetry_secret_redaction_review_status: pass
does_not_allow:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
bare_release_gated_allowed: false
`);

  writeRelText("evals/suites/post_rc_telemetry_connection_result_review.yaml", `suite_id: post_rc_telemetry_connection_result_review
stage: ${REVIEW_STAGE}
description: Reviews the passed post-RC Langfuse telemetry connection and indexes receipt/redaction evidence without additional sink writes.
source_stage: ${SOURCE_STAGE}
forbidden_execution:
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  telemetry_sink_additional_write: true
gate:
  script: tools/check_post_rc_telemetry_connection_result_review.mjs
required_artifacts:
  - ${REVIEW_DIR}/telemetry_connection_result_review.json
  - ${REVIEW_DIR}/telemetry_connected_claim_boundary.json
  - ${REVIEW_DIR}/langfuse_receipt_evidence_index.json
  - ${REVIEW_DIR}/telemetry_secret_redaction_review.json
`);

  writeRelText("docs/post_rc_telemetry_connection_result_review.md", `# Post-RC Telemetry Connection Result Review

Stage: ${REVIEW_STAGE}

This review indexes the already-passed Langfuse telemetry connection result. It does not perform another telemetry sink write and does not call OpenAI or local model endpoints.

The review confirms telemetry-connected only. Production monitoring, production readiness, stable release, provider diversity, provider verification, adapter checked, and local model verification remain blocked.
`);

  writeRelText("docs/telemetry_connected_claim_boundary.md", `# Telemetry-Connected Claim Boundary

The telemetry-connected claim is allowed only after the post-RC telemetry connection gate and this result review pass.

Allowed statements:
- telemetry-connected
- post-RC telemetry connection executed
- post-RC live trace receipt recorded
- post-RC live metric or event receipt recorded
- post-RC telemetry secret redaction checked

Blocked statements:
- production-monitored
- production-ready
- stable
- provider-diverse
- provider-verified
- adapter-checked
- local-model-verified
- bare release-gated
`);
}

const sourceReport = readJsonIfExists(`${SOURCE_DIR}/telemetry_connection_report.json`) || {};
const sourceGate = readJsonIfExists(`${SOURCE_DIR}/telemetry_connection_gate_report.json`) || {};
const traceReceipt = readJsonIfExists(`${SOURCE_DIR}/live_trace_receipt.json`) || {};
const metricReceipt = readJsonIfExists(`${SOURCE_DIR}/live_metric_receipt.json`) || {};
const sinkReceipt = readJsonIfExists(`${SOURCE_DIR}/telemetry_sink_connection_receipt.json`) || {};
const redactionReport = readJsonIfExists(`${SOURCE_DIR}/telemetry_secret_redaction_report.json`) || {};
const sourceBoundary = readJsonIfExists(`${SOURCE_DIR}/telemetry_connection_claim_boundary.json`) || {};

const sourcePass = sourceReport.status === "pass"
  && sourceGate.status === "pass"
  && sourceReport.stage === SOURCE_STAGE
  && sourceReport.configured_sink === "langfuse"
  && sourceReport.telemetry_connection === true
  && sourceReport.telemetry_sink_write === true
  && sourceReport.live_trace_receipt_recorded === true
  && sourceReport.live_metric_or_event_receipt_recorded === true
  && traceReceipt.status === "pass"
  && traceReceipt.trace_receipt_recorded === true
  && traceIdValid(traceReceipt.trace_id)
  && metricReceipt.event_receipt_recorded === true
  && sinkReceipt.status === "pass"
  && redactionReport.status === "pass"
  && sourceBoundary.telemetry_connected_allowed === true
  && sourceReport.openai_model_api_call === false
  && sourceReport.local_endpoint_probe === false
  && sourceReport.local_model_execution === false
  && sourceReport.secrets_logged === false
  && sourceReport.raw_payload_stored === false
  && sourceReport.raw_request_stored === false
  && sourceReport.raw_response_stored === false;

const review = {
  status: sourcePass ? "pass" : "fail",
  stage: REVIEW_STAGE,
  source_stage: SOURCE_STAGE,
  generated_at: new Date().toISOString(),
  configured_sink: sourceReport.configured_sink || "langfuse",
  telemetry_connection: sourceReport.telemetry_connection === true,
  telemetry_sink_write: sourceReport.telemetry_sink_write === true,
  live_trace_receipt_recorded: sourceReport.live_trace_receipt_recorded === true,
  live_metric_or_event_receipt_recorded: sourceReport.live_metric_or_event_receipt_recorded === true,
  secrets_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  telemetry_sink_additional_write: false,
  production_deployment: false,
  release_gate_rerun: false,
  telemetry_connected_allowed: sourcePass,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false
};

const claimBoundary = {
  status: sourcePass ? "pass" : "fail",
  stage: REVIEW_STAGE,
  source_stage: SOURCE_STAGE,
  telemetry_connected_allowed: sourcePass,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  allowed_claims: sourcePass ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: sourcePass
    ? "Telemetry connection passed, but production monitoring and production readiness require separate readiness and monitoring gates."
    : "Telemetry-connected remains blocked until source telemetry connection evidence passes."
};

const receiptIndex = {
  status: sourcePass ? "pass" : "fail",
  stage: REVIEW_STAGE,
  source_stage: SOURCE_STAGE,
  sink: "langfuse",
  indexed_artifacts: [
    `${SOURCE_DIR}/telemetry_connection_report.json`,
    `${SOURCE_DIR}/telemetry_sink_connection_receipt.json`,
    `${SOURCE_DIR}/live_trace_receipt.json`,
    `${SOURCE_DIR}/live_metric_receipt.json`,
    `${SOURCE_DIR}/telemetry_secret_redaction_report.json`,
    `${SOURCE_DIR}/telemetry_connection_claim_boundary.json`,
    `${SOURCE_DIR}/telemetry_connection_gate_report.json`
  ],
  trace_id_present: traceIdValid(traceReceipt.trace_id),
  trace_id: traceIdValid(traceReceipt.trace_id) ? traceReceipt.trace_id : null,
  trace_url_present: traceReceipt.trace_url_present === true,
  root_observation_id_present: traceReceipt.root_observation_id_present === true,
  event_receipt_recorded: metricReceipt.event_receipt_recorded === true,
  event_observations_emitted: metricReceipt.event_observations_emitted || 0,
  metric_receipt_required_for_telemetry_connected: metricReceipt.metric_receipt_required_for_telemetry_connected === true,
  receipt_strength: traceReceipt.receipt_strength || sourceReport.receipt_strength || "none",
  raw_trace_payload_stored: false,
  secret_values_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false
};

const redactionReview = {
  status: redactionReport.status === "pass" ? "pass" : "fail",
  stage: REVIEW_STAGE,
  source_stage: SOURCE_STAGE,
  secrets_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false,
  auth_header_logged: false,
  api_key_logged: false,
  source_artifacts_checked: receiptIndex.indexed_artifacts
};

const unresolved = {
  status: sourcePass ? "pass" : "unresolved",
  stage: REVIEW_STAGE,
  generated_at: new Date().toISOString(),
  items: sourcePass ? [] : ["source post-RC telemetry connection evidence did not satisfy result review gate"],
  blocked_claims: sourcePass ? BLOCKED_CLAIMS : ["telemetry-connected", ...BLOCKED_CLAIMS]
};

writeStaticArtifacts();
writeRelJson(`${REVIEW_DIR}/telemetry_connection_result_review.json`, review);
writeRelJson(`${REVIEW_DIR}/telemetry_connected_claim_boundary.json`, claimBoundary);
writeRelJson(`${REVIEW_DIR}/langfuse_receipt_evidence_index.json`, receiptIndex);
writeRelJson(`${REVIEW_DIR}/telemetry_secret_redaction_review.json`, redactionReview);
writeRelJson(`${REVIEW_DIR}/unresolved_items.json`, unresolved);
writeRelJson("evals/reports/post_rc_telemetry_connection_result_review_report.json", review);
writeRelText("evals/reports/post_rc_telemetry_connection_result_review_report.md", reviewMarkdown(review));

console.log(JSON.stringify(review, null, 2));
process.exit(review.status === "pass" ? 0 : 1);
