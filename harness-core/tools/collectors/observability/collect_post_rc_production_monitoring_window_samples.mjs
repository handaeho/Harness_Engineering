#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { getLangfuseRuntimeConfig } from "../../../observability/langfuse/instrumentation.mjs";
import { executeMockRunWithLangfuse, summarizeRunResult } from "../../../observability/langfuse/mock_runtime_tracer.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-sample-collection";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-production-monitoring-window-sample-collection";
const APPROVAL_ENV = "POST_RC_MONITORING_WINDOW_SAMPLE_COLLECTION_APPROVAL";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-samples";
const INDEX_PATH = `${EVIDENCE_DIR}/sample_receipt_index.json`;
const CASE_ID = "post_rc.production_monitoring.window.sample_collection";
const RECEIPT_STRENGTH = "client_flush_or_shutdown_completed_no_server_readback";
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

function nowIso() {
  return new Date().toISOString();
}

function traceIdValid(value) {
  return typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
}

function parseCount() {
  const index = process.argv.indexOf("--count");
  if (index === -1) return 1;
  const parsed = Number(process.argv[index + 1]);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10);
}

function makeRunId(sequence) {
  const stamp = nowIso().replace(/[^0-9A-Za-z]/g, "").slice(0, 17);
  return `post-rc-monitoring-sample-${stamp}-${String(sequence).padStart(2, "0")}`;
}

function blankIndex(generatedAt) {
  return {
    status: "empty",
    stage: STAGE,
    generated_at: generatedAt,
    sink: "langfuse",
    append_only: true,
    raw_payload_stored: false,
    secrets_logged: false,
    receipts: [],
    trace_receipt_count: 0,
    sample_units_total: 0,
    required_sample_count: 50,
    production_monitored_allowed: false
  };
}

function receiptKey(receipt) {
  return `${receipt.source_stage || "unknown"}:${receipt.run_id || "unknown"}:${receipt.trace_id || "none"}`;
}

function seedReceipts() {
  const report = readJsonIfExists("evidence/post-rc-telemetry-connection/telemetry_connection_report.json") || {};
  if (report.status !== "pass" || !traceIdValid(report.langfuse_trace_id)) return [];
  return [{
    source_stage: "v2.0.0-post-rc-telemetry-connection",
    run_id: report.run_id || null,
    case_id: report.case_id || null,
    trace_id: report.langfuse_trace_id,
    root_observation_id: report.langfuse_root_observation_id || null,
    receipt_timestamp: report.generated_at || null,
    event_observations_emitted: Math.max(0, Number(report.event_observations_emitted || 0)),
    receipt_strength: report.receipt_strength || RECEIPT_STRENGTH,
    raw_trace_payload_stored: false,
    secrets_logged: false,
    raw_payload_stored: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  }];
}

function normalizeIndex(index, generatedAt) {
  const base = index && Array.isArray(index.receipts) ? index : blankIndex(generatedAt);
  const byKey = new Map();
  for (const receipt of [...seedReceipts(), ...base.receipts]) {
    if (!traceIdValid(receipt.trace_id)) continue;
    byKey.set(receiptKey(receipt), {
      ...receipt,
      event_observations_emitted: Math.max(0, Number(receipt.event_observations_emitted || 0)),
      raw_trace_payload_stored: false,
      secrets_logged: false,
      raw_payload_stored: false,
      openai_model_api_call: false,
      local_endpoint_probe: false,
      local_model_execution: false
    });
  }
  const receipts = [...byKey.values()].sort((a, b) => String(a.receipt_timestamp).localeCompare(String(b.receipt_timestamp)));
  const sampleUnits = receipts.reduce((sum, item) => sum + Math.max(0, Number(item.event_observations_emitted || 0)), 0);
  return {
    ...base,
    status: receipts.length > 0 ? "pass" : "empty",
    stage: STAGE,
    generated_at: generatedAt,
    sink: "langfuse",
    append_only: true,
    raw_payload_stored: false,
    secrets_logged: false,
    receipts,
    trace_receipt_count: receipts.length,
    sample_units_total: sampleUnits,
    required_sample_count: 50,
    production_monitored_allowed: false
  };
}

function writeStaticArtifacts() {
  writeRelText("release/scopes/post-rc/post_rc_production_monitoring_window_sample_collection_scope.yaml", `stage: ${STAGE}

approved_execution:
  langfuse_trace_sample_collection: true
  mock_runtime_only: true
  append_only_receipt_indexing: true
  monitoring_window_sample_progress_update: true

required_approval_phrase: ${APPROVAL_PHRASE}
approval_env: ${APPROVAL_ENV}

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_modification: true
  raw_payload_storage: true
  secret_logging: true

claims_allowed:
  - post-rc-production-monitoring-window-samples-collected
  - post-rc-production-monitoring-window-sample-receipts-indexed

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

  writeRelText("docs/observability/production_monitoring_window_sample_collection.md", `# Production Monitoring Window Sample Collection

Stage: ${STAGE}

This stage can add real Langfuse trace receipts for the production monitoring window by running the mock runtime through the Langfuse tracing wrapper. It requires the exact approval phrase in ${APPROVAL_ENV}.

It does not call OpenAI model APIs, probe local endpoints, execute local models, deploy production changes, store raw payloads, or log secrets.

The append-only index is ${INDEX_PATH}. Monitoring window sample count is calculated from indexed event observation counts.
`);
}

function writeReport(report, index) {
  writeRelJson(`${EVIDENCE_DIR}/sample_collection_report.json`, report);
  writeRelJson(INDEX_PATH, index);
  writeRelJson("evals/reports/post_rc_production_monitoring_window_sample_collection_report.json", report);
}

writeStaticArtifacts();

const generatedAt = nowIso();
const existingIndex = normalizeIndex(readJsonIfExists(INDEX_PATH), generatedAt);
const config = getLangfuseRuntimeConfig(process.env);
const approvalPhraseVerified = process.env[APPROVAL_ENV] === APPROVAL_PHRASE;
const credentialsReady = config.tracing_enabled_env === true
  && config.langfuse_public_key_present === true
  && config.langfuse_secret_key_present === true
  && config.langfuse_base_url_present === true;

if (!approvalPhraseVerified || !credentialsReady) {
  const status = approvalPhraseVerified ? "blocked_by_missing_telemetry_credentials" : "blocked_by_missing_explicit_approval";
  const report = {
    status,
    stage: STAGE,
    generated_at: generatedAt,
    approval_phrase_verified: approvalPhraseVerified,
    credential_presence_checked: true,
    langfuse_public_key_present: config.langfuse_public_key_present,
    langfuse_secret_key_present: config.langfuse_secret_key_present,
    langfuse_host_present: config.langfuse_base_url_present,
    telemetry_sink_write: false,
    samples_requested: parseCount(),
    samples_collected_this_run: 0,
    trace_receipt_count_total: existingIndex.trace_receipt_count,
    sample_units_total: existingIndex.sample_units_total,
    required_sample_count: existingIndex.required_sample_count,
    sample_count_met: existingIndex.sample_units_total >= existingIndex.required_sample_count,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    production_deployment: false,
    secrets_logged: false,
    raw_payload_stored: false,
    production_monitored_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    provider_diverse_allowed: false,
    claims_still_blocked: BLOCKED_CLAIMS
  };
  writeReport(report, existingIndex);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const requested = parseCount();
const receipts = [];
let sinkWritePerformed = false;

for (let i = 1; i <= requested; i += 1) {
  const runId = makeRunId(i);
  const execution = await executeMockRunWithLangfuse({
    run_id: runId,
    case_id: CASE_ID,
    input: {
      mock_response_id: "no_tool_success",
      collection_sequence: i
    }
  }, {
    env: process.env,
    eventLimit: 25,
    shutdown: i === requested
  });

  sinkWritePerformed = sinkWritePerformed || execution.langfuse.sink_write_performed === true;
  if (execution.result.status !== "completed" || !traceIdValid(execution.langfuse.trace_id)) {
    continue;
  }

  receipts.push({
    source_stage: STAGE,
    run_id: runId,
    case_id: CASE_ID,
    trace_id: execution.langfuse.trace_id,
    root_observation_id: execution.langfuse.root_observation_id || null,
    receipt_timestamp: nowIso(),
    event_observations_emitted: execution.langfuse.event_observations_emitted || 0,
    receipt_strength: RECEIPT_STRENGTH,
    mock_result_summary: summarizeRunResult(execution.result),
    raw_trace_payload_stored: false,
    secrets_logged: false,
    raw_payload_stored: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  });
}

const mergedIndex = normalizeIndex({
  ...existingIndex,
  receipts: [...existingIndex.receipts, ...receipts]
}, generatedAt);
const report = {
  status: receipts.length === requested ? "pass" : "partial",
  stage: STAGE,
  generated_at: generatedAt,
  approval_phrase_verified: true,
  credential_presence_checked: true,
  configured_sink: "langfuse",
  telemetry_sink_write: sinkWritePerformed,
  samples_requested: requested,
  samples_collected_this_run: receipts.length,
  trace_receipt_count_total: mergedIndex.trace_receipt_count,
  sample_units_total: mergedIndex.sample_units_total,
  required_sample_count: mergedIndex.required_sample_count,
  sample_count_met: mergedIndex.sample_units_total >= mergedIndex.required_sample_count,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  secrets_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  claims_allowed_by_this_run: [
    "post-rc-production-monitoring-window-samples-collected",
    "post-rc-production-monitoring-window-sample-receipts-indexed"
  ],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeReport(report, mergedIndex);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
