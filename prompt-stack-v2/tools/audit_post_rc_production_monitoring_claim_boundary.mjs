#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-controls-design-and-gate";
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

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value) => actual.includes(value));
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_controls_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_blocker_update.json`);

const checks = [];
addCheck(checks, "controls report passed", report?.status === "pass" && report?.stage === STAGE, {
  status: report?.status,
  stage: report?.stage
});
addCheck(checks, "claim boundary passed",
  boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && boundary?.production_monitoring_controls_drafted === true
    && sameMembers(boundary?.allowed_claims, ALLOWED_CLAIMS), {
  status: boundary?.status,
  allowed_claims: boundary?.allowed_claims
});
addCheck(checks, "stronger claims remain blocked",
  boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false
    && sameMembers(boundary?.blocked_claims, BLOCKED_CLAIMS), {
  blocked_claims: boundary?.blocked_claims
});
addCheck(checks, "blocker updated to monitoring window pending",
  blocker?.status === "updated"
    && blocker?.previous_status === "blocked_not_production_monitored"
    && blocker?.new_status === "production_monitoring_controls_drafted_monitoring_window_pending"
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  status: blocker?.status,
  new_status: blocker?.new_status
});
addCheck(checks, "forbidden execution flags remain false",
  report?.new_execution === false
    && report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.evidence_v36_baseline_modified === false, {
  new_execution: report?.new_execution,
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  production_monitoring_controls_drafted: failures.length === 0,
  can_claim_telemetry_connected: failures.length === 0,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  checks,
  failures,
  claims_allowed_by_this_audit: failures.length === 0 ? ALLOWED_CLAIMS : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
