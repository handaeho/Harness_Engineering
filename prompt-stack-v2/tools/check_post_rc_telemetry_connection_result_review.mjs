#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "./lib/file_walk.mjs";

const REVIEW_STAGE = "v2.0.0-post-rc-telemetry-connection-result-review";
const REVIEW_DIR = "evidence/post-rc-telemetry-connection-result-review";
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
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

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
    "prompt-stack/v36",
    "dist",
    "prompt-stack-v2/evidence/v36-baseline"
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

const reviewRun = runNodeScript("review_post_rc_telemetry_connection_result.mjs", "review_post_rc_telemetry_connection_result.mjs pass");
const auditRun = runNodeScript("audit_post_rc_telemetry_connected_claims.mjs", "audit_post_rc_telemetry_connected_claims.mjs pass");
const connectionGateRun = runNodeScript("check_post_rc_telemetry_connection.mjs", "check_post_rc_telemetry_connection.mjs pass");
const validateRun = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scanRun = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baselineRun = runNodeScript("compare_v36_baseline.mjs", "compare_v36_baseline.mjs pass");

const checks = [];
for (const run of [reviewRun, auditRun, connectionGateRun, validateRun, scanRun, baselineRun]) {
  addCheck(checks, run.label, run.exit_code === 0 && ["pass", "blocked_not_production_monitored"].includes(run.status), {
    exit_code: run.exit_code,
    status: run.status
  });
}

for (const relPath of [
  "release/post_rc_telemetry_connection_result_review_scope.yaml",
  "release/post_rc_telemetry_connected_claim_gate.yaml",
  "evals/suites/post_rc_telemetry_connection_result_review.yaml",
  "evals/reports/post_rc_telemetry_connection_result_review_report.json",
  "evals/reports/post_rc_telemetry_connection_result_review_report.md",
  `${REVIEW_DIR}/telemetry_connection_result_review.json`,
  `${REVIEW_DIR}/telemetry_connected_claim_boundary.json`,
  `${REVIEW_DIR}/langfuse_receipt_evidence_index.json`,
  `${REVIEW_DIR}/telemetry_secret_redaction_review.json`,
  `${REVIEW_DIR}/unresolved_items.json`,
  "docs/post_rc_telemetry_connection_result_review.md",
  "docs/telemetry_connected_claim_boundary.md"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const review = readJsonIfExists(`${REVIEW_DIR}/telemetry_connection_result_review.json`);
const boundary = readJsonIfExists(`${REVIEW_DIR}/telemetry_connected_claim_boundary.json`);
const receiptIndex = readJsonIfExists(`${REVIEW_DIR}/langfuse_receipt_evidence_index.json`);
const redaction = readJsonIfExists(`${REVIEW_DIR}/telemetry_secret_redaction_review.json`);
const unresolved = readJsonIfExists(`${REVIEW_DIR}/unresolved_items.json`);
const scanMatches = Array.isArray(scanRun.parsed?.matches) ? scanRun.parsed.matches : [];

addCheck(checks, "telemetry connection result review passed",
  review?.status === "pass"
    && review?.stage === REVIEW_STAGE
    && review?.configured_sink === "langfuse"
    && review?.telemetry_connection === true
    && review?.telemetry_sink_write === true
    && review?.live_trace_receipt_recorded === true
    && review?.live_metric_or_event_receipt_recorded === true
    && review?.telemetry_connected_allowed === true, {
  status: review?.status,
  configured_sink: review?.configured_sink,
  telemetry_connection: review?.telemetry_connection,
  telemetry_connected_allowed: review?.telemetry_connected_allowed
});
addCheck(checks, "forbidden execution flags false",
  review?.openai_model_api_call === false
    && review?.local_endpoint_probe === false
    && review?.local_model_execution === false
    && review?.telemetry_sink_additional_write === false
    && review?.production_deployment === false
    && review?.release_gate_rerun === false, {
  openai_model_api_call: review?.openai_model_api_call,
  local_endpoint_probe: review?.local_endpoint_probe,
  local_model_execution: review?.local_model_execution,
  telemetry_sink_additional_write: review?.telemetry_sink_additional_write
});
addCheck(checks, "secret and raw payload flags false",
  review?.secrets_logged === false
    && review?.raw_payload_stored === false
    && review?.raw_request_stored === false
    && review?.raw_response_stored === false
    && redaction?.status === "pass"
    && redaction?.secrets_logged === false
    && redaction?.raw_payload_stored === false
    && redaction?.raw_request_stored === false
    && redaction?.raw_response_stored === false
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false, {
  secrets_logged: review?.secrets_logged,
  raw_payload_stored: review?.raw_payload_stored
});
addCheck(checks, "Langfuse receipt evidence index passed",
  receiptIndex?.status === "pass"
    && receiptIndex?.sink === "langfuse"
    && receiptIndex?.trace_id_present === true
    && receiptIndex?.event_receipt_recorded === true
    && receiptIndex?.raw_trace_payload_stored === false
    && receiptIndex?.secret_values_logged === false, {
  status: receiptIndex?.status,
  trace_id_present: receiptIndex?.trace_id_present,
  event_receipt_recorded: receiptIndex?.event_receipt_recorded
});
addCheck(checks, "telemetry-connected claim boundary passed",
  boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  telemetry_connected_allowed: boundary?.telemetry_connected_allowed,
  production_monitored_allowed: boundary?.production_monitored_allowed,
  stable_allowed: boundary?.stable_allowed
});
addCheck(checks, "unresolved items clear for result review",
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

const failures = checks.filter((check) => check.status !== "pass");
const passed = failures.length === 0;
const gate = {
  status: passed ? "pass" : "fail",
  stage: REVIEW_STAGE,
  source_stage: "v2.0.0-post-rc-telemetry-connection",
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  telemetry_sink_additional_write: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  reason: passed
    ? "Telemetry connection result review passed. Production monitoring, production readiness, stable, and provider-diverse claims remain blocked."
    : "Telemetry connection result review gate failed.",
  checks,
  failures,
  claims_allowed_by_this_gate: passed ? [
    "telemetry-connected",
    "post-rc-telemetry-connection-result-reviewed"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${REVIEW_DIR}/telemetry_connection_result_review_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_telemetry_connection_result_review_gate_report.json"), gate);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
