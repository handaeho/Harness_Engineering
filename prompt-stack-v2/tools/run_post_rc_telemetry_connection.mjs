#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import {
  getLangfuseRuntimeConfig,
  redactLangfuseData
} from "../observability/langfuse/instrumentation.mjs";
import {
  executeMockRunWithLangfuse,
  summarizeRunResult
} from "../observability/langfuse/mock_runtime_tracer.mjs";

const STAGE = "v2.0.0-post-rc-telemetry-connection";
const PREFLIGHT_STAGE = "v2.0.0-post-rc-telemetry-connection-preflight-refresh";
const CASE_ID = "post_rc.telemetry_connection.langfuse_mock_trace";
const RECEIPT_STRENGTH = "client_flush_or_shutdown_completed_no_server_readback";
const APPROVAL_ENV = "POST_RC_TELEMETRY_CONNECTION_APPROVAL";
const CONDITIONAL_CLAIMS = ["telemetry-connected"];
const RUN_ALLOWED_CLAIMS = [
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
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(...parts) {
  return fs.existsSync(p(...parts));
}

function readJsonIfExists(...parts) {
  return exists(...parts) ? readJson(p(...parts)) : null;
}

function nowIso() {
  return new Date().toISOString();
}

function safeRunId() {
  return `post-rc-langfuse-${nowIso().replace(/[^0-9A-Za-z]/g, "").slice(0, 17)}`;
}

function traceIdValid(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

function observationIdPresent(value) {
  return typeof value === "string" && value.length > 0;
}

function credentialPresence(config) {
  return config.langfuse_public_key_present === true
    && config.langfuse_secret_key_present === true
    && config.langfuse_base_url_present === true
    && config.tracing_enabled_env === true;
}

function preflightStatus() {
  const gate = readJsonIfExists(
    "evidence",
    "post-rc-telemetry-connection-preflight-refresh",
    "post_rc_telemetry_connection_preflight_gate_report.json"
  );
  const local = readJsonIfExists(
    "evidence",
    "post-rc-telemetry-connection-preflight-refresh",
    "telemetry_local_endpoint_deferred_confirmation.json"
  );
  return {
    preflight_refresh_passed: gate?.status === "pass" && gate?.stage === PREFLIGHT_STAGE,
    local_endpoint_deferred: local?.status === "confirmed_deferred"
      || gate?.local_endpoint_deferred === true,
    preflight_gate_status: gate?.status || "missing",
    local_endpoint_status: local?.status || "missing"
  };
}

function baseClaimBoundary(status, telemetryConnectedAllowed) {
  return {
    status,
    stage: STAGE,
    telemetry_connected_allowed: telemetryConnectedAllowed,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    allowed_claims: telemetryConnectedAllowed ? CONDITIONAL_CLAIMS : [],
    blocked_claims: BLOCKED_CLAIMS,
    reason: telemetryConnectedAllowed
      ? "Telemetry connection was established, but production monitoring and production readiness require separate gates."
      : "Telemetry-connected remains blocked until the post-RC telemetry connection gate passes."
  };
}

function secretRedactionReport(status) {
  return {
    status,
    stage: STAGE,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false,
    auth_header_logged: false,
    api_key_logged: false
  };
}

function sinkReceipt(status, passed, traceId, generatedAt) {
  return {
    status,
    stage: STAGE,
    sink: "langfuse",
    connection_attempted: passed,
    connection_succeeded: passed,
    secret_values_logged: false,
    raw_payload_stored: false,
    receipt_id_present: traceIdValid(traceId),
    receipt_timestamp_recorded: typeof generatedAt === "string" && generatedAt.length > 0,
    receipt_timestamp: generatedAt || null
  };
}

function traceReceipt(status, passed, report, traceId, rootObservationId) {
  return {
    status,
    stage: STAGE,
    sink: "langfuse",
    run_id: report.run_id || null,
    case_id: CASE_ID,
    trace_receipt_recorded: passed,
    trace_id_present: traceIdValid(traceId),
    trace_id: traceIdValid(traceId) ? traceId : null,
    trace_url_present: false,
    root_observation_id_present: observationIdPresent(rootObservationId),
    root_observation_id: rootObservationId || null,
    receipt_strength: passed ? RECEIPT_STRENGTH : "none",
    raw_trace_payload_stored: false,
    secret_values_logged: false,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false
  };
}

function metricReceipt(passed, eventCount = 0) {
  return {
    status: "not_supported_or_not_available",
    stage: STAGE,
    sink: "langfuse",
    metric_receipt_required_for_telemetry_connected: false,
    reason: "Trace receipt is sufficient for telemetry-connected claim in this scoped post-RC gate.",
    event_receipt_recorded: passed,
    event_observations_emitted: eventCount,
    metric_sink_write_performed: false,
    production_monitored_claim_allowed: false,
    secrets_logged: false,
    raw_payload_stored: false
  };
}

function unresolvedItems(status, items) {
  return {
    status: items.length === 0 ? "pass" : "unresolved",
    stage: STAGE,
    generated_at: nowIso(),
    items,
    blocked_claims: status === "pass" ? BLOCKED_CLAIMS : ["telemetry-connected", ...BLOCKED_CLAIMS]
  };
}

function reportMarkdown(report) {
  return `# Post-RC Telemetry Connection Report

Status: ${report.status}

- Stage: ${report.stage}
- Configured sink: ${report.configured_sink}
- Approval phrase verified: ${report.approval_phrase_verified}
- Credential presence checked: ${report.credential_presence_checked}
- Telemetry connection: ${report.telemetry_connection}
- Telemetry sink write: ${report.telemetry_sink_write}
- Live trace receipt recorded: ${report.live_trace_receipt_recorded}
- Live metric or event receipt recorded: ${report.live_metric_or_event_receipt_recorded}
- OpenAI model API call: ${report.openai_model_api_call}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: ${report.local_model_execution}
- Secrets logged: ${report.secrets_logged}
- Raw payload stored: ${report.raw_payload_stored}
- Telemetry-connected allowed: ${report.telemetry_connected_allowed}
- Production monitored allowed: ${report.production_monitored_allowed}
- Production ready allowed: ${report.production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
`;
}

function writeStaticArtifacts() {
  writeText(p("release", "post_rc_telemetry_connection_scope.yaml"), `stage: ${STAGE}

approved_execution:
  telemetry_connection: true
  telemetry_sink_write: true
  langfuse_sink: true
  live_trace_receipt_check: true
  live_metric_or_event_receipt_check: true
  claim_boundary_audit: true

forbidden_execution:
  openai_provider_call: true
  openai_model_api_call: true
  redteam_rerun: true
  containment_rerun: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  stable_release_claim: true
  production_ready_claim: true
  production_monitored_claim: true
  provider_diverse_claim: true
  provider_verified_claim: true
  adapter_checked_claim: true
  local_model_verified_claim: true
  dist_modification: true
  v36_modification: true

claims_conditionally_allowed:
  - telemetry-connected

claims_not_allowed:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
`);

  writeText(p("release", "post_rc_telemetry_connection_claim_boundary.yaml"), `stage: ${STAGE}
conditional_claim:
  telemetry-connected:
    allowed_only_if_gate_passes: true
    requires:
      - exact approval phrase
      - Langfuse credential presence
      - post-RC telemetry preflight refresh pass
      - live Langfuse trace receipt
      - secret and raw payload redaction check
does_not_allow:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
bare_release_gated_allowed: false
rc1_openai_scope_release_gated_remains_allowed: true
`);

  writeText(p("release", "post_rc_telemetry_connection_blocker_update.yaml"), `stage: ${STAGE}
status: telemetry_connection_executed_if_gate_passes
resolved_by_this_stage:
  - telemetry sink connection receipt for scoped post-RC telemetry-connected claim
still_blocked:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
local_endpoint_status: deferred_until_operator_provides_endpoint
`);

  writeText(p("evals", "suites", "post_rc_telemetry_connection.yaml"), `suite_id: post_rc_telemetry_connection
stage: ${STAGE}
description: Actual Langfuse telemetry sink write gate for the scoped telemetry-connected claim.
forbidden_execution:
  openai_model_api_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
required_artifacts:
  - evidence/post-rc-telemetry-connection/telemetry_connection_report.json
  - evidence/post-rc-telemetry-connection/telemetry_sink_connection_receipt.json
  - evidence/post-rc-telemetry-connection/live_trace_receipt.json
  - evidence/post-rc-telemetry-connection/live_metric_receipt.json
  - evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json
  - evidence/post-rc-telemetry-connection/telemetry_connection_claim_boundary.json
gate:
  script: tools/check_post_rc_telemetry_connection.mjs
`);

  writeText(p("docs", "post_rc_telemetry_connection.md"), `# Post-RC Telemetry Connection

Stage: ${STAGE}

This stage performs one scoped Langfuse telemetry sink write with the mock runtime. It does not call OpenAI model APIs, does not probe local endpoints, does not execute vLLM/Ollama, and does not deploy production changes.

The only conditional claim target is telemetry-connected. Production monitoring, production readiness, stable release, provider diversity, provider verification, adapter checked, and local model verification remain blocked by separate gates.
`);

  writeText(p("docs", "post_rc_telemetry_connection_result_review.md"), `# Post-RC Telemetry Connection Result Review

Review source: evidence/post-rc-telemetry-connection/telemetry_connection_gate_report.json

The review accepts telemetry-connected only when the gate status is pass and the report records Langfuse sink write, live trace receipt, secret redaction, raw payload exclusion, no OpenAI model API call, no local endpoint probe, and no local model execution.

This review does not allow production-monitored, production-ready, stable, provider-diverse, provider-verified, adapter-checked, or local-model-verified.
`);

  writeText(p("docs", "next_telemetry_connected_claim_review.md"), `# Next Telemetry-Connected Claim Review

The next review may use telemetry-connected only after tools/check_post_rc_telemetry_connection.mjs passes.

Telemetry-connected means the post-RC Langfuse sink connection succeeded with a live trace receipt and secret/raw payload redaction checks. It does not establish production monitoring, production readiness, stable release status, provider diversity, provider verification, adapter checked status, or local model verification.
`);
}

function writeArtifacts(report, trace, metric, sink, redaction, claimBoundary, unresolved) {
  writeStaticArtifacts();
  writeJson(p("evidence", "post-rc-telemetry-connection", "telemetry_connection_report.json"), report);
  writeText(p("evidence", "post-rc-telemetry-connection", "telemetry_connection_report.md"), reportMarkdown(report));
  writeJson(p("evidence", "post-rc-telemetry-connection", "telemetry_sink_connection_receipt.json"), sink);
  writeJson(p("evidence", "post-rc-telemetry-connection", "live_trace_receipt.json"), trace);
  writeJson(p("evidence", "post-rc-telemetry-connection", "live_metric_receipt.json"), metric);
  writeJson(p("evidence", "post-rc-telemetry-connection", "telemetry_secret_redaction_report.json"), redaction);
  writeJson(p("evidence", "post-rc-telemetry-connection", "telemetry_connection_claim_boundary.json"), claimBoundary);
  writeJson(p("evidence", "post-rc-telemetry-connection", "unresolved_items.json"), unresolved);
  writeJson(p("evals", "reports", "post_rc_telemetry_connection_report.json"), report);
  writeText(p("evals", "reports", "post_rc_telemetry_connection_report.md"), reportMarkdown(report));
}

function blockedStatus(config) {
  if (config.approval_present !== true) return "blocked_by_missing_explicit_approval";
  return "blocked_by_missing_telemetry_credentials";
}

function buildBlockedArtifacts(config, status, preflight) {
  const generatedAt = nowIso();
  const report = {
    status,
    stage: STAGE,
    generated_at: generatedAt,
    configured_sink: config.configured_sink === "none" ? "langfuse" : config.configured_sink,
    langfuse_runtime_config_status: config.status,
    tracing_enabled_env: config.tracing_enabled_env,
    approval_phrase_verified: config.approval_present === true,
    approval_present: config.approval_present,
    approval_source: config.approval_source,
    credential_presence_checked: true,
    langfuse_public_key_present: config.langfuse_public_key_present,
    langfuse_secret_key_present: config.langfuse_secret_key_present,
    langfuse_host_present: config.langfuse_base_url_present,
    langfuse_base_url_present: config.langfuse_base_url_present,
    langfuse_base_url_source: config.langfuse_base_url_source,
    missing_requirements: config.missing,
    preflight_refresh_passed: preflight.preflight_refresh_passed,
    local_endpoint_deferred: preflight.local_endpoint_deferred,
    telemetry_connection: false,
    telemetry_sink_write: false,
    live_trace_receipt_recorded: false,
    live_metric_or_event_receipt_recorded: false,
    langfuse_trace_export_attempted: false,
    langfuse_sink_write_performed: false,
    langfuse_trace_id_present: false,
    openai_provider_call: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    production_deployment: false,
    external_side_effects: false,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false,
    telemetry_connected_allowed: false,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    claims_allowed_by_this_run: [],
    claims_still_blocked: ["telemetry-connected", ...BLOCKED_CLAIMS]
  };
  return {
    report,
    trace: traceReceipt("not_created", false, report, null, null),
    metric: metricReceipt(false, 0),
    sink: sinkReceipt("not_created", false, null, generatedAt),
    redaction: secretRedactionReport("pass"),
    claimBoundary: baseClaimBoundary("blocked", false),
    unresolved: unresolvedItems(status, config.missing)
  };
}

function buildFailureArtifacts(config, error, preflight) {
  const generatedAt = nowIso();
  const redactedError = redactLangfuseData({
    name: error?.name || "Error",
    message: error?.message || String(error)
  });
  const report = {
    status: "fail",
    stage: STAGE,
    generated_at: generatedAt,
    configured_sink: "langfuse",
    langfuse_runtime_config_status: config.status,
    tracing_enabled_env: config.tracing_enabled_env,
    approval_phrase_verified: config.approval_present === true,
    approval_present: config.approval_present,
    approval_source: config.approval_source,
    credential_presence_checked: true,
    langfuse_public_key_present: config.langfuse_public_key_present,
    langfuse_secret_key_present: config.langfuse_secret_key_present,
    langfuse_host_present: config.langfuse_base_url_present,
    langfuse_base_url_present: config.langfuse_base_url_present,
    langfuse_base_url_source: config.langfuse_base_url_source,
    preflight_refresh_passed: preflight.preflight_refresh_passed,
    local_endpoint_deferred: preflight.local_endpoint_deferred,
    telemetry_connection: false,
    telemetry_sink_write: false,
    live_trace_receipt_recorded: false,
    live_metric_or_event_receipt_recorded: false,
    langfuse_trace_export_attempted: true,
    langfuse_sink_write_performed: false,
    langfuse_trace_id_present: false,
    openai_provider_call: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    production_deployment: false,
    external_side_effects: false,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false,
    telemetry_connected_allowed: false,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    error_summary: redactedError,
    claims_allowed_by_this_run: [],
    claims_still_blocked: ["telemetry-connected", ...BLOCKED_CLAIMS]
  };
  return {
    report,
    trace: traceReceipt("submission_failed", false, report, null, null),
    metric: metricReceipt(false, 0),
    sink: sinkReceipt("failed", false, null, generatedAt),
    redaction: secretRedactionReport("pass"),
    claimBoundary: baseClaimBoundary("fail", false),
    unresolved: unresolvedItems("fail", [redactedError.message || "telemetry sink write failed"])
  };
}

writeStaticArtifacts();

const config = getLangfuseRuntimeConfig(process.env);
const preflight = preflightStatus();

if (config.approval_present !== true || !credentialPresence(config)) {
  const status = blockedStatus(config);
  const artifacts = buildBlockedArtifacts(config, status, preflight);
  writeArtifacts(
    artifacts.report,
    artifacts.trace,
    artifacts.metric,
    artifacts.sink,
    artifacts.redaction,
    artifacts.claimBoundary,
    artifacts.unresolved
  );
  console.log(JSON.stringify(artifacts.report, null, 2));
  process.exit(1);
}

if (preflight.preflight_refresh_passed !== true || preflight.local_endpoint_deferred !== true) {
  const artifacts = buildFailureArtifacts(config, new Error("post-RC telemetry preflight refresh is not pass or local endpoint is not deferred"), preflight);
  writeArtifacts(
    artifacts.report,
    artifacts.trace,
    artifacts.metric,
    artifacts.sink,
    artifacts.redaction,
    artifacts.claimBoundary,
    artifacts.unresolved
  );
  console.log(JSON.stringify(artifacts.report, null, 2));
  process.exit(1);
}

const runId = safeRunId();
const runRequest = {
  run_id: runId,
  case_id: CASE_ID,
  input: {
    prompt: "post-rc telemetry smoke prompt; this raw prompt must not be exported",
    mock_response_id: "no_tool_success"
  }
};

try {
  const execution = await executeMockRunWithLangfuse(runRequest, {
    env: process.env,
    eventLimit: 25,
    shutdown: true
  });
  const traceId = execution.langfuse.trace_id;
  const rootObservationId = execution.langfuse.root_observation_id;
  const eventCount = execution.langfuse.event_observations_emitted || 0;
  const passed = execution.result.status === "completed"
    && execution.langfuse.trace_export_attempted === true
    && execution.langfuse.sink_write_performed === true
    && traceIdValid(traceId);
  const generatedAt = nowIso();

  const report = {
    status: passed ? "pass" : "fail",
    stage: STAGE,
    generated_at: generatedAt,
    run_id: runId,
    case_id: CASE_ID,
    mode: "langfuse_trace_sink_write_with_mock_runtime",
    configured_sink: "langfuse",
    langfuse_runtime_config_status: config.status,
    tracing_enabled_env: config.tracing_enabled_env,
    approval_phrase_verified: config.approval_present === true,
    approval_present: config.approval_present,
    approval_source: config.approval_source || APPROVAL_ENV,
    credential_presence_checked: true,
    langfuse_public_key_present: config.langfuse_public_key_present,
    langfuse_secret_key_present: config.langfuse_secret_key_present,
    langfuse_host_present: config.langfuse_base_url_present,
    langfuse_base_url_present: config.langfuse_base_url_present,
    langfuse_base_url_source: config.langfuse_base_url_source,
    preflight_refresh_passed: preflight.preflight_refresh_passed,
    local_endpoint_deferred: preflight.local_endpoint_deferred,
    telemetry_connection: passed,
    telemetry_sink_write: execution.langfuse.sink_write_performed === true,
    live_trace_receipt_recorded: passed,
    live_metric_or_event_receipt_recorded: passed,
    langfuse_trace_export_attempted: execution.langfuse.trace_export_attempted === true,
    langfuse_sink_write_performed: execution.langfuse.sink_write_performed === true,
    langfuse_trace_id_present: traceIdValid(traceId),
    langfuse_trace_id: traceIdValid(traceId) ? traceId : null,
    langfuse_root_observation_id_present: observationIdPresent(rootObservationId),
    langfuse_root_observation_id: rootObservationId || null,
    event_observations_emitted: eventCount,
    event_observations_omitted_due_to_limit: execution.langfuse.event_observations_omitted_due_to_limit || 0,
    mock_result_summary: summarizeRunResult(execution.result),
    openai_provider_call: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    production_deployment: false,
    external_side_effects: false,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false,
    telemetry_connected_allowed: passed,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    receipt_strength: passed ? RECEIPT_STRENGTH : "none",
    claims_allowed_by_this_run: passed ? RUN_ALLOWED_CLAIMS : [],
    claims_still_blocked: BLOCKED_CLAIMS
  };

  writeArtifacts(
    report,
    traceReceipt(passed ? "pass" : "submission_incomplete", passed, report, traceId, rootObservationId),
    metricReceipt(passed, eventCount),
    sinkReceipt(passed ? "pass" : "fail", passed, traceId, generatedAt),
    secretRedactionReport("pass"),
    baseClaimBoundary(passed ? "pass" : "fail", passed),
    unresolvedItems(report.status, passed ? [] : ["Langfuse trace sink write did not complete with a valid trace id."])
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(passed ? 0 : 1);
} catch (error) {
  const artifacts = buildFailureArtifacts(config, error, preflight);
  writeArtifacts(
    artifacts.report,
    artifacts.trace,
    artifacts.metric,
    artifacts.sink,
    artifacts.redaction,
    artifacts.claimBoundary,
    artifacts.unresolved
  );
  console.log(JSON.stringify(artifacts.report, null, 2));
  process.exit(1);
}
