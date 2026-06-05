#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const READINESS_STAGE = "v2.0.0-post-rc-production-monitoring-readiness";
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runNodeScript(script, label) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024
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
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 2000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 2000)
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

function requiredControlsAllFalse(requiredControls = {}) {
  return [
    "dashboard_defined",
    "alerting_policy_defined",
    "anomaly_thresholds_defined",
    "monitoring_window_completed",
    "incident_response_owner_defined",
    "rollback_monitoring_linked",
    "retention_policy_defined"
  ].every((key) => requiredControls[key] === false);
}

const resultReviewGateRun = runNodeScript(
  "check_post_rc_telemetry_connection_result_review.mjs",
  "check_post_rc_telemetry_connection_result_review.mjs pass"
);
const assessmentRun = runNodeScript(
  "assess_post_rc_production_monitoring_readiness.mjs",
  "assess_post_rc_production_monitoring_readiness.mjs blocked_not_production_monitored"
);
const validateRun = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scanRun = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baselineRun = runNodeScript("check_reference_baseline_integrity.mjs", "check_reference_baseline_integrity.mjs pass");

const checks = [];
addCheck(checks, resultReviewGateRun.label, resultReviewGateRun.exit_code === 0 && resultReviewGateRun.status === "pass", {
  exit_code: resultReviewGateRun.exit_code,
  status: resultReviewGateRun.status
});
addCheck(checks, assessmentRun.label, assessmentRun.exit_code === 0 && assessmentRun.status === "blocked_not_production_monitored", {
  exit_code: assessmentRun.exit_code,
  status: assessmentRun.status
});
for (const run of [validateRun, scanRun, baselineRun]) {
  addCheck(checks, run.label, run.exit_code === 0 && run.status === "pass", {
    exit_code: run.exit_code,
    status: run.status
  });
}

for (const relPath of [
  "release/post_rc_production_monitoring_readiness_gate.yaml",
  "release/post_rc_production_monitoring_blocker_update.yaml",
  "evals/suites/post_rc_production_monitoring_readiness.yaml",
  "evals/reports/post_rc_production_monitoring_readiness_report.json",
  "evals/reports/post_rc_production_monitoring_readiness_report.md",
  `${READINESS_DIR}/production_monitoring_readiness_assessment.json`,
  `${READINESS_DIR}/production_monitoring_required_controls.json`,
  `${READINESS_DIR}/production_monitoring_blocker_update.json`,
  `${READINESS_DIR}/production_monitoring_claim_boundary.json`,
  `${READINESS_DIR}/unresolved_items.json`,
  "docs/production_monitoring_readiness.md",
  "docs/production_monitoring_remaining_controls.md",
  "docs/next_production_monitoring_gate_plan.md",
  "docs/next_local_canary_after_endpoint_ready.md",
  "docs/next_stable_scope_decision_plan.md"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const assessment = readJsonIfExists(`${READINESS_DIR}/production_monitoring_readiness_assessment.json`);
const controls = readJsonIfExists(`${READINESS_DIR}/production_monitoring_required_controls.json`);
const blocker = readJsonIfExists(`${READINESS_DIR}/production_monitoring_blocker_update.json`);
const boundary = readJsonIfExists(`${READINESS_DIR}/production_monitoring_claim_boundary.json`);
const unresolved = readJsonIfExists(`${READINESS_DIR}/unresolved_items.json`);
const scanMatches = Array.isArray(scanRun.parsed?.matches) ? scanRun.parsed.matches : [];

addCheck(checks, "production monitoring readiness is blocked_not_production_monitored",
  assessment?.status === "blocked_not_production_monitored"
    && assessment?.stage === READINESS_STAGE
    && assessment?.telemetry_connected === true
    && assessment?.langfuse_sink_connected === true
    && assessment?.live_trace_receipt_recorded === true
    && assessment?.production_monitoring_ready === false
    && assessment?.production_monitored_allowed === false
    && assessment?.production_ready_allowed === false
    && assessment?.stable_allowed === false, {
  status: assessment?.status,
  telemetry_connected: assessment?.telemetry_connected,
  production_monitoring_ready: assessment?.production_monitoring_ready
});
addCheck(checks, "required production monitoring controls are missing",
  requiredControlsAllFalse(assessment?.required_controls)
    && Array.isArray(controls?.required_before_production_monitored)
    && REQUIRED_CONTROL_NAMES.every((control) => controls.required_before_production_monitored.includes(control)), {
  required_controls: assessment?.required_controls,
  required_before_production_monitored: controls?.required_before_production_monitored
});
addCheck(checks, "local endpoint and provider diversity are not required now",
  controls?.does_not_require_now?.includes("local endpoint")
    && controls?.does_not_require_now?.includes("provider diversity")
    && blocker?.local_endpoint_status === "deferred_future_lane", {
  does_not_require_now: controls?.does_not_require_now,
  local_endpoint_status: blocker?.local_endpoint_status
});
addCheck(checks, "claim boundary blocks production monitoring and stronger claims",
  boundary?.status === "blocked_not_production_monitored"
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  production_monitored_allowed: boundary?.production_monitored_allowed,
  production_ready_allowed: boundary?.production_ready_allowed,
  stable_allowed: boundary?.stable_allowed
});
addCheck(checks, "forbidden execution flags false",
  assessment?.openai_model_api_call === false
    && assessment?.local_endpoint_probe === false
    && assessment?.local_model_execution === false
    && assessment?.telemetry_sink_additional_write === false
    && blocker?.openai_model_api_call === false
    && blocker?.local_endpoint_probe === false
    && blocker?.local_model_execution === false, {
  openai_model_api_call: assessment?.openai_model_api_call,
  local_endpoint_probe: assessment?.local_endpoint_probe,
  local_model_execution: assessment?.local_model_execution,
  telemetry_sink_additional_write: assessment?.telemetry_sink_additional_write
});
addCheck(checks, "secret and raw payload flags false",
  assessment?.secrets_logged === false && assessment?.raw_payload_stored === false, {
  secrets_logged: assessment?.secrets_logged,
  raw_payload_stored: assessment?.raw_payload_stored
});
addCheck(checks, "production readiness unresolved items recorded",
  unresolved?.status === "blocked_not_production_monitored"
    && Array.isArray(unresolved?.items)
    && unresolved.items.length === REQUIRED_CONTROL_NAMES.length, {
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

const failures = checks.filter((check) => check.status !== "pass");
const passed = failures.length === 0;
const gate = {
  status: passed ? "pass" : "fail",
  stage: READINESS_STAGE,
  readiness_status: assessment?.status || "missing",
  can_claim_telemetry_connected: passed && assessment?.telemetry_connected === true,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  production_monitoring_ready: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  local_endpoint_deferred: true,
  next_required_gate: "production monitoring controls design and gate",
  reason: passed
    ? "Production monitoring readiness assessed as blocked_not_production_monitored. Required controls and monitoring window remain missing."
    : "Production monitoring readiness gate failed.",
  required_controls_missing: REQUIRED_CONTROL_NAMES,
  checks,
  failures,
  claims_allowed_by_this_gate: passed ? [
    "telemetry-connected",
    "post-rc-production-monitoring-readiness-assessed",
    "post-rc-production-monitoring-blocker-recorded"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${READINESS_DIR}/production_monitoring_readiness_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_readiness_gate_report.json"), gate);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
