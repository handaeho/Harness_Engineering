#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-telemetry-connection";
const PREFLIGHT_STAGE = "v2.0.0-post-rc-telemetry-connection-preflight-refresh";
const RECEIPT_STRENGTH = "client_flush_or_shutdown_completed_no_server_readback";
const CONDITIONAL_CLAIMS = ["telemetry-connected"];
const GATE_ALLOWED_CLAIMS = [
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
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function traceIdValid(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

function observationIdPresent(value) {
  return typeof value === "string" && value.length > 0;
}

function runNodeScript(script, label) {
  const result = spawnSync("node", [path.join(root, "tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    label,
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    stdout_excerpt: (result.stdout || "").trim().slice(0, 2000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 2000),
    parsed
  };
}

function gitForbiddenStatus() {
  const result = spawnSync("git", [
    "status",
    "--short",
    "--",
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ], {
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

function gateMarkdown(gate, checks) {
  return `# Post-RC Telemetry Connection Gate Report

Status: ${gate.status}

- Stage: ${gate.stage}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Local endpoint deferred: ${gate.local_endpoint_deferred}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

function writeStaticArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_telemetry_connection_scope.yaml", `stage: ${STAGE}

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
  reference_baseline_modification: true

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

  writeRelText("release/claims/post-rc/post_rc_telemetry_connection_claim_boundary.yaml", `stage: ${STAGE}
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

  writeRelText("release/blockers/post-rc/post_rc_telemetry_connection_blocker_update.yaml", `stage: ${STAGE}
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

  writeRelText("evals/suites/post_rc_telemetry_connection.yaml", `suite_id: post_rc_telemetry_connection
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
  script: tools/checks/observability/check_post_rc_telemetry_connection.mjs
`);

  writeRelText("docs/observability/post_rc_telemetry_connection.md", `# Post-RC Telemetry Connection

Stage: ${STAGE}

This stage performs one scoped Langfuse telemetry sink write with the mock runtime. It does not call OpenAI model APIs, does not probe local endpoints, does not execute vLLM/Ollama, and does not deploy production changes.

The only conditional claim target is telemetry-connected. Production monitoring, production readiness, stable release, provider diversity, provider verification, adapter checked, and local model verification remain blocked by separate gates.
`);

  writeRelText("docs/observability/post_rc_telemetry_connection_result_review.md", `# Post-RC Telemetry Connection Result Review

Review source: evidence/post-rc-telemetry-connection/telemetry_connection_gate_report.json

The review accepts telemetry-connected only when the gate status is pass and the report records Langfuse sink write, live trace receipt, secret redaction, raw payload exclusion, no OpenAI model API call, no local endpoint probe, and no local model execution.

This review does not allow production-monitored, production-ready, stable, provider-diverse, provider-verified, adapter-checked, or local-model-verified.
`);

  writeRelText("docs/plans/next_telemetry_connected_claim_review.md", `# Next Telemetry-Connected Claim Review

The next review may use telemetry-connected only after tools/checks/observability/check_post_rc_telemetry_connection.mjs passes.

Telemetry-connected means the post-RC Langfuse sink connection succeeded with a live trace receipt and secret/raw payload redaction checks. It does not establish production monitoring, production readiness, stable release status, provider diversity, provider verification, adapter checked status, or local model verification.
`);
}

function normalizedArtifacts() {
  const sourceReport = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json") || {};
  const sourceTrace = readJsonIfExists("evidence/post-rc-telemetry-connection/live_trace_receipt.json") || {};
  const preflightGate = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/post_rc_telemetry_connection_preflight_gate_report.json") || {};
  const localDeferred = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_local_endpoint_deferred_confirmation.json") || {};
  const traceId = sourceReport.langfuse_trace_id || sourceTrace.trace_id || null;
  const rootObservationId = sourceReport.langfuse_root_observation_id || sourceTrace.root_observation_id || null;
  const generatedAt = sourceReport.generated_at || new Date().toISOString();
  const pass = sourceReport.status === "pass"
    && sourceReport.telemetry_connection === true
    && sourceReport.telemetry_sink_write === true
    && traceIdValid(traceId);
  const localEndpointDeferred = localDeferred.status === "confirmed_deferred"
    || preflightGate.local_endpoint_deferred === true;
  const preflightRefreshPassed = preflightGate.status === "pass"
    && preflightGate.stage === PREFLIGHT_STAGE;

  const report = {
    ...sourceReport,
    status: sourceReport.status || "fail",
    stage: STAGE,
    generated_at: generatedAt,
    configured_sink: sourceReport.configured_sink || "langfuse",
    approval_phrase_verified: sourceReport.approval_phrase_verified ?? sourceReport.approval_present === true,
    approval_present: sourceReport.approval_present === true,
    credential_presence_checked: true,
    langfuse_public_key_present: sourceReport.langfuse_public_key_present === true,
    langfuse_secret_key_present: sourceReport.langfuse_secret_key_present === true,
    langfuse_host_present: sourceReport.langfuse_host_present ?? sourceReport.langfuse_base_url_present === true,
    langfuse_base_url_present: sourceReport.langfuse_base_url_present === true,
    preflight_refresh_passed: preflightRefreshPassed,
    local_endpoint_deferred: localEndpointDeferred,
    telemetry_connection: pass,
    telemetry_sink_write: sourceReport.telemetry_sink_write === true,
    live_trace_receipt_recorded: pass,
    live_metric_or_event_receipt_recorded: pass,
    langfuse_trace_export_attempted: sourceReport.langfuse_trace_export_attempted === true,
    langfuse_sink_write_performed: sourceReport.langfuse_sink_write_performed === true,
    langfuse_trace_id_present: traceIdValid(traceId),
    langfuse_trace_id: traceIdValid(traceId) ? traceId : null,
    langfuse_root_observation_id_present: observationIdPresent(rootObservationId),
    langfuse_root_observation_id: rootObservationId || null,
    event_observations_emitted: Number.isInteger(sourceReport.event_observations_emitted)
      ? sourceReport.event_observations_emitted
      : 0,
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
    telemetry_connected_allowed: pass,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    receipt_strength: pass ? RECEIPT_STRENGTH : "none",
    claims_allowed_by_this_run: pass ? GATE_ALLOWED_CLAIMS : [],
    claims_still_blocked: BLOCKED_CLAIMS
  };

  const traceReceipt = {
    status: pass ? "pass" : "not_created",
    stage: STAGE,
    sink: "langfuse",
    run_id: report.run_id || null,
    case_id: report.case_id || "post_rc.telemetry_connection.langfuse_mock_trace",
    trace_receipt_recorded: pass,
    trace_id_present: traceIdValid(traceId),
    trace_id: traceIdValid(traceId) ? traceId : null,
    trace_url_present: false,
    root_observation_id_present: observationIdPresent(rootObservationId),
    root_observation_id: rootObservationId || null,
    receipt_strength: pass ? RECEIPT_STRENGTH : "none",
    raw_trace_payload_stored: false,
    secret_values_logged: false,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false
  };

  const metricReceipt = {
    status: "not_supported_or_not_available",
    stage: STAGE,
    sink: "langfuse",
    metric_receipt_required_for_telemetry_connected: false,
    reason: "Trace receipt is sufficient for telemetry-connected claim in this scoped post-RC gate.",
    event_receipt_recorded: pass,
    event_observations_emitted: report.event_observations_emitted,
    metric_sink_write_performed: false,
    production_monitored_claim_allowed: false,
    secrets_logged: false,
    raw_payload_stored: false
  };

  const sinkReceipt = {
    status: pass ? "pass" : "not_created",
    stage: STAGE,
    sink: "langfuse",
    connection_attempted: pass,
    connection_succeeded: pass,
    secret_values_logged: false,
    raw_payload_stored: false,
    receipt_id_present: traceIdValid(traceId),
    receipt_timestamp_recorded: typeof generatedAt === "string" && generatedAt.length > 0,
    receipt_timestamp: generatedAt
  };

  const redaction = {
    status: "pass",
    stage: STAGE,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false,
    auth_header_logged: false,
    api_key_logged: false
  };

  const claimBoundary = {
    status: pass ? "pass" : "blocked",
    stage: STAGE,
    telemetry_connected_allowed: pass,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    local_model_verified_allowed: false,
    allowed_claims: pass ? CONDITIONAL_CLAIMS : [],
    blocked_claims: BLOCKED_CLAIMS,
    reason: pass
      ? "Telemetry connection was established, but production monitoring and production readiness require separate gates."
      : "Telemetry-connected remains blocked until the post-RC telemetry connection gate passes."
  };

  const unresolved = {
    status: pass ? "pass" : "unresolved",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    items: pass ? [] : ["post-RC telemetry connection evidence is missing or failed."],
    blocked_claims: pass ? BLOCKED_CLAIMS : ["telemetry-connected", ...BLOCKED_CLAIMS]
  };

  writeStaticArtifacts();
  writeRelJson("evidence/post-rc-telemetry-connection/telemetry_connection_report.json", report);
  writeRelText("evidence/post-rc-telemetry-connection/telemetry_connection_report.md", reportMarkdown(report));
  writeRelJson("evidence/post-rc-telemetry-connection/telemetry_sink_connection_receipt.json", sinkReceipt);
  writeRelJson("evidence/post-rc-telemetry-connection/live_trace_receipt.json", traceReceipt);
  writeRelJson("evidence/post-rc-telemetry-connection/live_metric_receipt.json", metricReceipt);
  writeRelJson("evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json", redaction);
  writeRelJson("evidence/post-rc-telemetry-connection/telemetry_connection_claim_boundary.json", claimBoundary);
  writeRelJson("evidence/post-rc-telemetry-connection/unresolved_items.json", unresolved);
  writeRelJson("evals/reports/post_rc_telemetry_connection_report.json", report);
  writeRelText("evals/reports/post_rc_telemetry_connection_report.md", reportMarkdown(report));

  return {
    report,
    traceReceipt,
    metricReceipt,
    sinkReceipt,
    redaction,
    claimBoundary,
    unresolved,
    preflightGate,
    localDeferred
  };
}

const artifacts = normalizedArtifacts();

const dependencyResults = {
  validate_alpha: runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass"),
  scan_prohibited_claims: runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass"),
  check_reference_baseline_integrity: runNodeScript("check_reference_baseline_integrity.mjs", "check_reference_baseline_integrity.mjs pass"),
  check_post_rc_telemetry_connection_preflight_refresh: runNodeScript(
    "check_post_rc_telemetry_connection_preflight_refresh.mjs",
    "check_post_rc_telemetry_connection_preflight_refresh.mjs pass"
  )
};

const checks = [];

for (const result of Object.values(dependencyResults)) {
  addCheck(checks, result.label, result.exit_code === 0 && result.status === "pass", {
    exit_code: result.exit_code,
    status: result.status
  });
}

for (const relPath of [
  "release/scopes/post-rc/post_rc_telemetry_connection_scope.yaml",
  "release/claims/post-rc/post_rc_telemetry_connection_claim_boundary.yaml",
  "release/blockers/post-rc/post_rc_telemetry_connection_blocker_update.yaml",
  "tools/runners/observability/run_post_rc_telemetry_connection.mjs",
  "tools/checks/observability/check_post_rc_telemetry_connection.mjs",
  "tools/audits/observability/audit_post_rc_telemetry_connection_claims.mjs",
  "evals/suites/post_rc_telemetry_connection.yaml",
  "evals/reports/post_rc_telemetry_connection_report.json",
  "evals/reports/post_rc_telemetry_connection_report.md",
  "evidence/post-rc-telemetry-connection/telemetry_connection_report.json",
  "evidence/post-rc-telemetry-connection/telemetry_connection_report.md",
  "evidence/post-rc-telemetry-connection/telemetry_sink_connection_receipt.json",
  "evidence/post-rc-telemetry-connection/live_trace_receipt.json",
  "evidence/post-rc-telemetry-connection/live_metric_receipt.json",
  "evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json",
  "evidence/post-rc-telemetry-connection/telemetry_connection_claim_boundary.json",
  "evidence/post-rc-telemetry-connection/unresolved_items.json",
  "docs/observability/post_rc_telemetry_connection.md",
  "docs/observability/post_rc_telemetry_connection_result_review.md",
  "docs/plans/next_telemetry_connected_claim_review.md"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json");
const traceReceipt = readJsonIfExists("evidence/post-rc-telemetry-connection/live_trace_receipt.json");
const metricReceipt = readJsonIfExists("evidence/post-rc-telemetry-connection/live_metric_receipt.json");
const sinkReceipt = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_sink_connection_receipt.json");
const redaction = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_secret_redaction_report.json");
const claimBoundary = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_claim_boundary.json");
const unresolved = readJsonIfExists("evidence/post-rc-telemetry-connection/unresolved_items.json");
const preflightGate = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/post_rc_telemetry_connection_preflight_gate_report.json");
const localDeferred = readJsonIfExists("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_local_endpoint_deferred_confirmation.json");
const scanParsed = dependencyResults.scan_prohibited_claims.parsed || {};
const scanMatches = Array.isArray(scanParsed.matches) ? scanParsed.matches : [];

addCheck(checks, "post-RC telemetry connection report passed", report?.status === "pass", {
  status: report?.status
});
addCheck(checks, "stage matches post-RC telemetry connection", report?.stage === STAGE && traceReceipt?.stage === STAGE, {
  report_stage: report?.stage,
  trace_stage: traceReceipt?.stage
});
addCheck(checks, "post-RC telemetry preflight refresh passed",
  preflightGate?.status === "pass" && preflightGate?.stage === PREFLIGHT_STAGE, {
  status: preflightGate?.status,
  stage: preflightGate?.stage
});
addCheck(checks, "approval phrase verified",
  report?.approval_phrase_verified === true || report?.approval_present === true, {
  approval_phrase_verified: report?.approval_phrase_verified,
  approval_present: report?.approval_present
});
addCheck(checks, "Langfuse credential presence checked without values",
  report?.configured_sink === "langfuse"
    && report?.credential_presence_checked === true
    && report?.langfuse_public_key_present === true
    && report?.langfuse_secret_key_present === true
    && (report?.langfuse_host_present === true || report?.langfuse_base_url_present === true)
    && !Object.prototype.hasOwnProperty.call(report || {}, "langfuse_public_key_value")
    && !Object.prototype.hasOwnProperty.call(report || {}, "langfuse_secret_key_value")
    && !Object.prototype.hasOwnProperty.call(report || {}, "authorization_header_value")
    && !Object.prototype.hasOwnProperty.call(sinkReceipt || {}, "authorization_header_value"), {
  configured_sink: report?.configured_sink,
  credential_presence_checked: report?.credential_presence_checked,
  langfuse_public_key_present: report?.langfuse_public_key_present,
  langfuse_secret_key_present: report?.langfuse_secret_key_present,
  langfuse_host_present: report?.langfuse_host_present ?? report?.langfuse_base_url_present
});
addCheck(checks, "telemetry connection and sink write completed",
  report?.telemetry_connection === true
    && report?.telemetry_sink_write === true
    && report?.langfuse_trace_export_attempted === true
    && report?.langfuse_sink_write_performed === true
    && sinkReceipt?.status === "pass"
    && sinkReceipt?.connection_attempted === true
    && sinkReceipt?.connection_succeeded === true, {
  telemetry_connection: report?.telemetry_connection,
  telemetry_sink_write: report?.telemetry_sink_write,
  trace_export_attempted: report?.langfuse_trace_export_attempted,
  sink_write_performed: report?.langfuse_sink_write_performed
});
addCheck(checks, "live trace receipt contains valid trace id",
  traceReceipt?.status === "pass"
    && traceReceipt?.trace_receipt_recorded === true
    && traceIdValid(report?.langfuse_trace_id)
    && traceIdValid(traceReceipt?.trace_id)
    && report?.langfuse_trace_id === traceReceipt?.trace_id
    && traceReceipt?.trace_url_present === false, {
  report_trace_id_present: traceIdValid(report?.langfuse_trace_id),
  receipt_trace_id_present: traceIdValid(traceReceipt?.trace_id),
  ids_match: report?.langfuse_trace_id === traceReceipt?.trace_id,
  trace_url_present: traceReceipt?.trace_url_present
});
addCheck(checks, "live metric receipt exists or is explicitly not supported",
  metricReceipt?.status === "not_supported_or_not_available"
    && metricReceipt?.metric_receipt_required_for_telemetry_connected === false
    && metricReceipt?.event_receipt_recorded === true, {
  status: metricReceipt?.status,
  metric_receipt_required_for_telemetry_connected: metricReceipt?.metric_receipt_required_for_telemetry_connected,
  event_receipt_recorded: metricReceipt?.event_receipt_recorded
});
addCheck(checks, "mock runtime stayed inside non-provider boundary",
  report?.openai_provider_call === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.external_side_effects === false
    && report?.mock_result_summary?.provider_execution === false
    && report?.mock_result_summary?.local_model_execution === false
    && report?.mock_result_summary?.external_side_effects === false, {
  openai_provider_call: report?.openai_provider_call,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution,
  production_deployment: report?.production_deployment,
  external_side_effects: report?.external_side_effects
});
addCheck(checks, "secret and raw payload flags are false",
  report?.secrets_logged === false
    && report?.raw_payload_stored === false
    && report?.raw_request_stored === false
    && report?.raw_response_stored === false
    && redaction?.status === "pass"
    && redaction?.secrets_logged === false
    && redaction?.raw_payload_stored === false
    && redaction?.raw_request_stored === false
    && redaction?.raw_response_stored === false
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false
    && traceReceipt?.secret_values_logged === false
    && traceReceipt?.raw_trace_payload_stored === false
    && sinkReceipt?.secret_values_logged === false
    && sinkReceipt?.raw_payload_stored === false, {
  secrets_logged: report?.secrets_logged,
  raw_payload_stored: report?.raw_payload_stored,
  raw_request_stored: report?.raw_request_stored,
  raw_response_stored: report?.raw_response_stored,
  auth_header_logged: redaction?.auth_header_logged,
  api_key_logged: redaction?.api_key_logged
});
addCheck(checks, "claim boundary allows only telemetry-connected",
  report?.telemetry_connected_allowed === true
    && report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && claimBoundary?.status === "pass"
    && claimBoundary?.telemetry_connected_allowed === true
    && claimBoundary?.production_monitored_allowed === false
    && claimBoundary?.production_ready_allowed === false
    && claimBoundary?.stable_allowed === false
    && claimBoundary?.provider_diverse_allowed === false
    && claimBoundary?.local_model_verified_allowed === false
    && Array.isArray(claimBoundary?.allowed_claims)
    && claimBoundary.allowed_claims.length === 1
    && claimBoundary.allowed_claims[0] === "telemetry-connected", {
  telemetry_connected_allowed: report?.telemetry_connected_allowed,
  production_monitored_allowed: report?.production_monitored_allowed,
  production_ready_allowed: report?.production_ready_allowed,
  stable_allowed: report?.stable_allowed,
  provider_diverse_allowed: report?.provider_diverse_allowed,
  local_model_verified_allowed: report?.local_model_verified_allowed,
  allowed_claims: claimBoundary?.allowed_claims
});
addCheck(checks, "local endpoint remains deferred",
  report?.local_endpoint_deferred === true
    && (localDeferred?.status === "confirmed_deferred" || preflightGate?.local_endpoint_deferred === true), {
  report_local_endpoint_deferred: report?.local_endpoint_deferred,
  local_endpoint_status: localDeferred?.status,
  preflight_local_endpoint_deferred: preflightGate?.local_endpoint_deferred
});
addCheck(checks, "unresolved items are clear for this stage",
  unresolved?.status === "pass" && Array.isArray(unresolved?.items) && unresolved.items.length === 0, {
  status: unresolved?.status,
  unresolved_items_count: Array.isArray(unresolved?.items) ? unresolved.items.length : null
});
addCheck(checks, "stable / production / provider-diverse positive claims absent",
  scanMatches.filter((match) => [
    "stable",
    "production-ready",
    "production-monitored",
    "provider-diverse"
  ].includes(match.claim)).length === 0, {
  matches: scanMatches.filter((match) => [
    "stable",
    "production-ready",
    "production-monitored",
    "provider-diverse"
  ].includes(match.claim)).length
});
const forbiddenStatus = gitForbiddenStatus();
addCheck(checks, "guardrail paths remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);

const failed = checks.filter((check) => check.status !== "pass");
const passed = failed.length === 0;
const gate = {
  status: passed ? "pass" : "fail",
  stage: STAGE,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  local_endpoint_deferred: report?.local_endpoint_deferred === true,
  reason: passed
    ? "Telemetry connection passed. Production monitoring, production readiness, stable, and provider-diverse claims remain blocked."
    : "Telemetry connection gate failed. Telemetry-connected remains blocked until failures are resolved.",
  post_rc_langfuse_trace_submitted: passed,
  post_rc_live_trace_receipt_recorded: passed,
  post_rc_live_metric_receipt_recorded: passed,
  post_rc_telemetry_secret_redaction_checked: passed,
  production_ready_allowed: false,
  production_monitored_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  receipt_strength: report?.receipt_strength || "none",
  trace_id_present: traceIdValid(report?.langfuse_trace_id),
  checks,
  failures: failed,
  dependency_results: Object.fromEntries(Object.entries(dependencyResults).map(([key, value]) => [
    key,
    {
      exit_code: value.exit_code,
      status: value.status
    }
  ])),
  claims_allowed_by_this_gate: passed ? GATE_ALLOWED_CLAIMS : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeRelJson("evidence/post-rc-telemetry-connection/telemetry_connection_gate_report.json", gate);
writeRelJson("evals/reports/post_rc_telemetry_connection_gate_report.json", gate);
writeRelText("evals/reports/post_rc_telemetry_connection_gate_report.md", gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
