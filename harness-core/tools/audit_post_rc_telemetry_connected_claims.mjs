#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";

const REVIEW_STAGE = "v2.0.0-post-rc-telemetry-connection-result-review";
const REVIEW_DIR = "evidence/post-rc-telemetry-connection-result-review";
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value, index) => actual[index] === value);
}

const review = readJsonIfExists(`${REVIEW_DIR}/telemetry_connection_result_review.json`);
const boundary = readJsonIfExists(`${REVIEW_DIR}/telemetry_connected_claim_boundary.json`);
const receiptIndex = readJsonIfExists(`${REVIEW_DIR}/langfuse_receipt_evidence_index.json`);
const redaction = readJsonIfExists(`${REVIEW_DIR}/telemetry_secret_redaction_review.json`);

const checks = [];

addCheck(checks, "telemetry connection result review passed", review?.status === "pass" && review?.stage === REVIEW_STAGE, {
  status: review?.status,
  stage: review?.stage
});
addCheck(checks, "telemetry-connected claim boundary passed",
  boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && sameArray(boundary?.allowed_claims, ALLOWED_CLAIMS), {
  status: boundary?.status,
  allowed_claims: boundary?.allowed_claims
});
addCheck(checks, "stronger claims remain blocked",
  boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && BLOCKED_CLAIMS.every((claim) => boundary?.blocked_claims?.includes(claim)), {
  blocked_claims: boundary?.blocked_claims
});
addCheck(checks, "Langfuse receipt evidence indexed", receiptIndex?.status === "pass" && receiptIndex?.trace_id_present === true, {
  status: receiptIndex?.status,
  trace_id_present: receiptIndex?.trace_id_present,
  event_receipt_recorded: receiptIndex?.event_receipt_recorded
});
addCheck(checks, "secret and raw payload review passed",
  redaction?.status === "pass"
    && redaction?.secrets_logged === false
    && redaction?.raw_payload_stored === false
    && redaction?.raw_request_stored === false
    && redaction?.raw_response_stored === false
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false, {
  status: redaction?.status
});
addCheck(checks, "forbidden execution flags remain false",
  review?.openai_model_api_call === false
    && review?.local_endpoint_probe === false
    && review?.local_model_execution === false
    && review?.telemetry_sink_additional_write === false
    && review?.production_deployment === false, {
  openai_model_api_call: review?.openai_model_api_call,
  local_endpoint_probe: review?.local_endpoint_probe,
  local_model_execution: review?.local_model_execution,
  telemetry_sink_additional_write: review?.telemetry_sink_additional_write
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: REVIEW_STAGE,
  telemetry_connected_allowed: failures.length === 0,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  checks,
  failures,
  allowed_claims: failures.length === 0 ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
