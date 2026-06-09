#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-telemetry-connection";
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

function readJsonIfExists(...parts) {
  const file = p(...parts);
  return fs.existsSync(file) ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const report = readJsonIfExists("evidence", "post-rc-telemetry-connection", "telemetry_connection_report.json");
const gate = readJsonIfExists("evidence", "post-rc-telemetry-connection", "telemetry_connection_gate_report.json");
const boundary = readJsonIfExists("evidence", "post-rc-telemetry-connection", "telemetry_connection_claim_boundary.json");
const redaction = readJsonIfExists("evidence", "post-rc-telemetry-connection", "telemetry_secret_redaction_report.json");

const checks = [];

addCheck(checks, "telemetry connection report passed", report?.status === "pass" && report?.stage === STAGE, {
  status: report?.status,
  stage: report?.stage
});
addCheck(checks, "gate passed", gate?.status === "pass" && gate?.can_claim_telemetry_connected === true, {
  status: gate?.status,
  can_claim_telemetry_connected: gate?.can_claim_telemetry_connected
});
addCheck(checks, "claim boundary allows only telemetry-connected",
  boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && Array.isArray(boundary?.allowed_claims)
    && boundary.allowed_claims.length === 1
    && boundary.allowed_claims[0] === "telemetry-connected", {
  status: boundary?.status,
  allowed_claims: boundary?.allowed_claims
});
addCheck(checks, "stronger claims remain blocked",
  report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  blocked_claims: BLOCKED_CLAIMS
});
addCheck(checks, "secret and raw payload boundary passed",
  redaction?.status === "pass"
    && redaction?.secrets_logged === false
    && redaction?.raw_payload_stored === false
    && redaction?.raw_request_stored === false
    && redaction?.raw_response_stored === false
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false, {
  status: redaction?.status
});
addCheck(checks, "forbidden execution flags are false",
  report?.openai_provider_call === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false, {
  openai_provider_call: report?.openai_provider_call,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution,
  production_deployment: report?.production_deployment
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_claim_telemetry_connected: failures.length === 0,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  checks,
  failures,
  claims_allowed: failures.length === 0 ? ["telemetry-connected"] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
