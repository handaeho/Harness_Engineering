#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "post-rc-local-endpoint-future-integration-record";
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

function readTextIfExists(relPath) {
  return exists(relPath) ? readText(p(...relPath.split("/"))) : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function hasKoreanBody(text) {
  return (text.match(/[가-힣]/g) || []).length >= 60;
}

const checks = [];
const docs = [
  "docs/local_endpoint_future_integration.ko.md",
  "docs/local_endpoint_future_unit_integration_verification.ko.md",
  "docs/local_endpoint_operator_handoff_template.ko.md"
];
const docTexts = Object.fromEntries(docs.map((doc) => [doc, readTextIfExists(doc)]));
const record = readJsonIfExists("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_integration_record.json");
const verificationPlan = readJsonIfExists("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_verification_plan.json");

for (const doc of docs) {
  addCheck(checks, `${doc} exists`, exists(doc), {});
  addCheck(checks, `${doc} has Korean title/body`, hasKoreanBody(docTexts[doc]), {
    hangul_count: (docTexts[doc].match(/[가-힣]/g) || []).length
  });
}

addCheck(checks, "local endpoint deferred policy is Korean-documented",
  docTexts["docs/local_endpoint_future_integration.ko.md"].includes("현재 local endpoint는 준비되지 않았다")
    && docTexts["docs/local_endpoint_future_integration.ko.md"].includes("현재 goal에서 수행하지 않는다")
    && docTexts["docs/local_endpoint_operator_handoff_template.ko.md"].includes("operator 준비 완료 신호 전에는 local endpoint probe를 수행하지 않는다"),
  {});
addCheck(checks, "telemetry first to local future lane to stable later preserved in root Korean doc",
  readTextIfExists("POST_RC_WORK_SEQUENCE_TEMP.ko.md").includes("telemetry first")
    && readTextIfExists("POST_RC_WORK_SEQUENCE_TEMP.ko.md").includes("local future lane")
    && readTextIfExists("POST_RC_WORK_SEQUENCE_TEMP.ko.md").includes("stable later"),
  {});
addCheck(checks, "local endpoint future integration record exists", Boolean(record), {});
addCheck(checks, "current_goal_runs_local_endpoint == false", record?.current_goal_runs_local_endpoint === false, {
  current_goal_runs_local_endpoint: record?.current_goal_runs_local_endpoint
});
addCheck(checks, "local_endpoint_not_ready_is_not_current_goal_blocker == true",
  record?.local_endpoint_not_ready_is_not_current_goal_blocker === true, {
  local_endpoint_not_ready_is_not_current_goal_blocker: record?.local_endpoint_not_ready_is_not_current_goal_blocker
});
addCheck(checks, "local_endpoint_probe_allowed_now == false", record?.local_endpoint_probe_allowed_now === false, {
  local_endpoint_probe_allowed_now: record?.local_endpoint_probe_allowed_now
});
addCheck(checks, "local_model_execution_allowed_now == false", record?.local_model_execution_allowed_now === false, {
  local_model_execution_allowed_now: record?.local_model_execution_allowed_now
});
addCheck(checks, "future_operator_signal_required == true", record?.future_operator_signal_required === true, {
  future_operator_signal_required: record?.future_operator_signal_required
});
addCheck(checks, "future stages are documented", Array.isArray(record?.future_stages)
  && record.future_stages.includes("v2.0.0-post-rc-local-endpoint-readiness-preflight")
  && record.future_stages.includes("v2.0.0-post-rc-local-no-tool-canary")
  && record.future_stages.includes("v2.0.0-post-rc-local-no-tool-canary-result-review"), {
  future_stages: record?.future_stages
});
addCheck(checks, "operator handoff template evidence exists",
  exists("evidence/post-rc-local-endpoint-future-integration/local_endpoint_operator_handoff_template.md"), {});
addCheck(checks, "unit/integration verification plan exists", Boolean(verificationPlan)
  && verificationPlan?.future_operator_signal_required === true
  && verificationPlan?.local_endpoint_probe_allowed_now === false, verificationPlan || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git"
  ]
});
addCheck(checks, "provider-diverse/local-model-verified positive claims absent",
  scan.status === "pass" && scan.matches.length === 0, {
  matches: scan.matches.length
});

const failed = checks.filter((check) => check.status !== "pass");
const report = {
  status: failed.length ? "fail" : "pass",
  stage: STAGE,
  current_goal_runs_local_endpoint: false,
  local_endpoint_not_ready_is_not_current_goal_blocker: true,
  local_endpoint_probe_allowed_now: false,
  local_model_execution_allowed_now: false,
  future_operator_signal_required: true,
  future_stages_documented: failed.length === 0,
  local_endpoint_probe: false,
  local_model_execution: false,
  claims_allowed: failed.length ? [] : [
    "post-rc-local-endpoint-future-integration-recorded",
    "post-rc-local-endpoint-operator-handoff-documented",
    "post-rc-local-endpoint-verification-plan-documented"
  ],
  claims_blocked: [
    "provider-diverse",
    "local-model-verified",
    "provider-verified",
    "adapter-checked",
    "production-ready",
    "stable"
  ],
  checks
};

const md = `# Local Endpoint Future Integration Gate Report

Status: ${report.status}

- current_goal_runs_local_endpoint: false
- local_endpoint_not_ready_is_not_current_goal_blocker: true
- local_endpoint_probe_allowed_now: false
- local_model_execution_allowed_now: false
- future_operator_signal_required: true

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evidence", "post-rc-local-endpoint-future-integration", "local_endpoint_future_integration_gate_report.json"), report);
writeText(p("evidence", "post-rc-local-endpoint-future-integration", "local_endpoint_future_integration_gate_report.md"), md);
writeJson(p("evals", "reports", "post_rc_local_endpoint_future_integration_report.json"), report);
writeText(p("evals", "reports", "post_rc_local_endpoint_future_integration_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
