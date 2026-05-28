#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-execution";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window";
const REQUIRED_ALLOWED_CLAIMS = [
  "telemetry-connected",
  "post-rc-production-monitoring-window-executed",
  "post-rc-monitoring-window-trace-continuity-reviewed",
  "post-rc-monitoring-window-thresholds-evaluated",
  "post-rc-monitoring-window-redaction-reviewed",
  "post-rc-monitoring-window-incident-rollback-reviewed"
];
const REQUIRED_BLOCKED_CLAIMS = [
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

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_window_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_blocker_update.json`);
const redaction = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`);
const thresholds = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_threshold_evaluation.json`);
const continuity = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_trace_continuity.json`);

const checks = [];
addCheck(checks, "window report exists", report !== null, {});
addCheck(checks, "claim boundary exists", boundary !== null, {});
addCheck(checks, "blocker update exists", blocker !== null, {});
addCheck(checks, "redaction evaluation exists", redaction !== null, {});
addCheck(checks, "threshold evaluation exists", thresholds !== null, {});
addCheck(checks, "trace continuity evaluation exists", continuity !== null, {});

addCheck(checks, "window execution remains scoped",
  report?.stage === STAGE
    && report?.monitoring_window_executed === true
    && typeof report?.monitoring_window_completed === "boolean"
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false, {
  stage: report?.stage,
  monitoring_window_executed: report?.monitoring_window_executed,
  monitoring_window_completed: report?.monitoring_window_completed
});
addCheck(checks, "secret and raw payload boundary remains clean",
  report?.secrets_logged === false
    && report?.raw_payload_stored === false
    && redaction?.status === "pass"
    && redaction?.redaction_failures === 0
    && redaction?.raw_payload_storage_violations === 0
    && redaction?.secret_logging_findings === 0
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false
    && redaction?.raw_payload_stored === false, {
  secrets_logged: report?.secrets_logged,
  raw_payload_stored: report?.raw_payload_stored,
  redaction_status: redaction?.status
});
addCheck(checks, "production claims remain blocked",
  report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  production_monitored_allowed: report?.production_monitored_allowed,
  stable_allowed: report?.stable_allowed
});
addCheck(checks, "allowed claims are limited to telemetry/window evidence claims",
  Array.isArray(boundary?.allowed_claims)
    && REQUIRED_ALLOWED_CLAIMS.every((claim) => boundary.allowed_claims.includes(claim))
    && !boundary.allowed_claims.includes("production-monitored")
    && !boundary.allowed_claims.includes("production-ready")
    && !boundary.allowed_claims.includes("stable"), {
  allowed_claims: boundary?.allowed_claims
});
addCheck(checks, "blocked claims include production and provider/local claims",
  Array.isArray(boundary?.blocked_claims)
    && REQUIRED_BLOCKED_CLAIMS.every((claim) => boundary.blocked_claims.includes(claim)), {
  blocked_claims: boundary?.blocked_claims
});
addCheck(checks, "window incompleteness does not fail the scoped audit",
  report?.status === "pass"
    || (report?.status === "monitoring_window_incomplete"
      && continuity?.status === "incomplete"
      && thresholds?.status === "incomplete"
      && thresholds?.threshold_evaluation_complete === false), {
  report_status: report?.status,
  continuity_status: continuity?.status,
  threshold_status: thresholds?.status
});
addCheck(checks, "blocker remains on monitoring completion or final gate",
  blocker?.status === "updated"
    && blocker?.new_status === "monitoring_window_executed_completion_or_final_gate_pending"
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  new_status: blocker?.new_status
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  monitoring_window_executed: report?.monitoring_window_executed === true,
  monitoring_window_completed: report?.monitoring_window_completed === true,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  checks,
  failures
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
