#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-rc-operator-sequence-record";
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

function readTextIfExists(relPath) {
  return exists(relPath) ? readText(p(...relPath.split("/"))) : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function hasHangul(text) {
  return /[가-힣]/.test(text);
}

function hangulCount(text) {
  return (text.match(/[가-힣]/g) || []).length;
}

const checks = [];
const documentPath = "POST_RC_WORK_SEQUENCE_TEMP.ko.md";
const documentText = readTextIfExists(documentPath);
const record = readJsonIfExists("evidence/post-rc-operator-sequence-record/post_rc_work_sequence_record.json");

addCheck(checks, "POST_RC_WORK_SEQUENCE_TEMP.ko.md exists", exists(documentPath), {});
addCheck(checks, "document_language == ko", record?.document_language === "ko", {
  document_language: record?.document_language
});
addCheck(checks, "document has Korean title and body", hasHangul(documentText) && hangulCount(documentText) >= 80, {
  hangul_count: hangulCount(documentText)
});
addCheck(checks, "telemetry first to local future lane to stable later is Korean-documented",
  documentText.includes("telemetry first")
    && documentText.includes("local future lane")
    && documentText.includes("stable later")
    && documentText.includes("먼저 telemetry")
    && documentText.includes("그 다음 local endpoint")
    && documentText.includes("stable scope decision은 telemetry 결과와 local lane"),
  {});
addCheck(checks, "local endpoint deferred policy is Korean-documented",
  documentText.includes("local endpoint는 operator가 준비 완료를 알릴 때까지 defer")
    && documentText.includes("local endpoint probe 금지")
    && documentText.includes("vLLM 실행 금지")
    && documentText.includes("Ollama 실행 금지")
    && documentText.includes("local no-tool canary 금지"),
  {});
addCheck(checks, "telemetry_first == true", record?.telemetry_first === true, {
  telemetry_first: record?.telemetry_first
});
addCheck(checks, "local_endpoint_documented_as_future_lane == true", record?.local_endpoint_documented_as_future_lane === true, {
  local_endpoint_documented_as_future_lane: record?.local_endpoint_documented_as_future_lane
});
addCheck(checks, "local_endpoint_deferred == true", record?.local_endpoint_deferred === true, {
  local_endpoint_deferred: record?.local_endpoint_deferred
});
addCheck(checks, "stable decision later policy recorded", record?.stable_decision_after_telemetry_and_local_or_out_of_scope === true, {
  stable_decision_after_telemetry_and_local_or_out_of_scope: record?.stable_decision_after_telemetry_and_local_or_out_of_scope
});
addCheck(checks, "new_execution == false", record?.new_execution === false, {
  new_execution: record?.new_execution
});
addCheck(checks, "local_endpoint_probe == false", record?.local_endpoint_probe === false, {
  local_endpoint_probe: record?.local_endpoint_probe
});
addCheck(checks, "local_model_execution == false", record?.local_model_execution === false, {
  local_model_execution: record?.local_model_execution
});
addCheck(checks, "telemetry_connection == false", record?.telemetry_connection === false, {
  telemetry_connection: record?.telemetry_connection
});
addCheck(checks, "claims_allowed_by_this_record == []", Array.isArray(record?.claims_allowed_by_this_record)
  && record.claims_allowed_by_this_record.length === 0, {
  claims_allowed_by_this_record: record?.claims_allowed_by_this_record
});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git"
  ]
});
addCheck(checks, "stable / bare release-gated / production-ready / provider-diverse positive claim absent",
  scan.status === "pass" && scan.matches.length === 0, {
  matches: scan.matches.length
});

const failed = checks.filter((check) => check.status !== "pass");
const report = {
  status: failed.length ? "fail" : "pass",
  stage: STAGE,
  document_created: exists(documentPath),
  document_language: "ko",
  telemetry_first: record?.telemetry_first === true,
  local_endpoint_future_lane_documented: record?.local_endpoint_documented_as_future_lane === true,
  local_endpoint_deferred: record?.local_endpoint_deferred === true,
  stable_decision_after_telemetry_and_local_or_out_of_scope: record?.stable_decision_after_telemetry_and_local_or_out_of_scope === true,
  new_execution: false,
  can_enter_telemetry_connection_preflight_refresh: failed.length === 0,
  can_enter_local_no_tool_canary: false,
  can_enter_stable_scope_decision: false,
  reason: failed.length
    ? "Post-RC operator sequence record is incomplete or invalid."
    : "Operator sequence recorded in Korean root temporary document. Telemetry path can proceed first; local endpoint remains deferred as future integration lane.",
  claims_allowed: failed.length ? [] : [
    "post-rc-operator-sequence-recorded"
  ],
  claims_blocked: [
    "stable",
    "release-gated",
    "production-ready",
    "production-monitored",
    "telemetry-connected",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified"
  ],
  checks
};

const md = `# Post-RC Operator Sequence Record Gate Report

Status: ${report.status}

- document_created: ${report.document_created}
- document_language: ko
- telemetry_first: ${report.telemetry_first}
- local_endpoint_future_lane_documented: ${report.local_endpoint_future_lane_documented}
- local_endpoint_deferred: ${report.local_endpoint_deferred}
- stable_decision_after_telemetry_and_local_or_out_of_scope: ${report.stable_decision_after_telemetry_and_local_or_out_of_scope}
- new_execution: false
- can_enter_telemetry_connection_preflight_refresh: ${report.can_enter_telemetry_connection_preflight_refresh}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evidence", "post-rc-operator-sequence-record", "post_rc_work_sequence_record_gate_report.json"), report);
writeText(p("evidence", "post-rc-operator-sequence-record", "post_rc_work_sequence_record_gate_report.md"), md);
writeJson(p("evals", "reports", "post_rc_work_sequence_record_report.json"), report);
writeText(p("evals", "reports", "post_rc_work_sequence_record_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
