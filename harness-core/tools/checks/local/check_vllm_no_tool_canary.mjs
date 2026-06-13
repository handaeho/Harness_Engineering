#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-vllm-no-tool-canary";
const EVIDENCE_DIR = "post-stable-local-vllm-no-tool-canary";
const REQUIRED = [
  "vllm_no_tool_canary_report.json",
  "vllm_no_tool_canary_gate_report.json",
  "vllm_no_tool_claim_boundary.json",
  "vllm_response_mapping_report.json",
  "vllm_no_tool_redaction_report.json",
  "vllm_trace_samples.jsonl",
  "unresolved_items.json"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}

const report = readJsonIfExists(e("vllm_no_tool_canary_report.json"));
const gate = readJsonIfExists(e("vllm_no_tool_canary_gate_report.json"));
const boundary = readJsonIfExists(e("vllm_no_tool_claim_boundary.json"));
const mapping = readJsonIfExists(e("vllm_response_mapping_report.json"));
const redaction = readJsonIfExists(e("vllm_no_tool_redaction_report.json"));
const trace = fs.existsSync(e("vllm_trace_samples.jsonl"))
  ? fs.readFileSync(e("vllm_trace_samples.jsonl"), "utf8").split(/\r?\n/).filter(Boolean)
  : [];
const unresolved = readJsonIfExists(e("unresolved_items.json"));

addCheck(checks, "stage matches", report?.stage === STAGE && gate?.stage === STAGE, {
  report_stage: report?.stage || null,
  gate_stage: gate?.stage || null
});
addCheck(checks, "status pass", report?.status === "pass" && gate?.status === "pass", {
  report_status: report?.status || null,
  gate_status: gate?.status || null
});
addCheck(checks, "provider is vllm", report?.provider === "vllm" && mapping?.provider === "vllm", {
  provider: report?.provider || null,
  mapping_provider: mapping?.provider || null
});
addCheck(checks, "local execution and endpoint probe recorded", report?.local_model_execution === true
  && report?.local_endpoint_probe === true
  && report?.vllm_no_tool_canary_executed === true
  && report?.vllm_local_server_roundtrip_passed === true, report || {});
addCheck(checks, "no tool or structured output in no-tool lane", report?.tools_used === false
  && report?.structured_output_used === false
  && mapping?.request_mapping?.tools_present === false
  && mapping?.request_mapping?.structured_output_present === false, mapping || {});
addCheck(checks, "all cases passed", report?.cases_total > 0
  && report?.cases_failed === 0
  && report?.cases_passed === report?.cases_total, {
  cases_passed: report?.cases_passed || 0,
  cases_total: report?.cases_total || 0
});
addCheck(checks, "trace samples recorded", trace.length > 0 && report?.trace_events_total === trace.length, {
  trace_lines: trace.length,
  trace_events_total: report?.trace_events_total || 0
});
addCheck(checks, "redaction and storage boundary pass", redaction?.status === "pass"
  && report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && report?.secrets_logged === false
  && redaction?.api_key_recorded === false, redaction || {});
addCheck(checks, "strong adapter/release claims blocked", boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false, boundary || {});
addCheck(checks, "unresolved items empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});

const failures = checks.filter((check) => check.status !== "pass");
const checkReport = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_enter_vllm_adapter_conformance: failures.length === 0,
  checks,
  failures,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  adapter_checked_allowed: false
};
const md = `# vLLM No-tool Canary Check

Status: ${checkReport.status}

- Stage: ${STAGE}
- Can enter vLLM adapter conformance: ${checkReport.can_enter_vllm_adapter_conformance}
- Adapter-checked allowed: false
- Unresolved items: ${checkReport.unresolved_items_count}
`;

writeJson(p("evals", "reports", "vllm_no_tool_canary_check_report.json"), checkReport);
writeText(p("evals", "reports", "vllm_no_tool_canary_check_report.md"), md);

console.log(JSON.stringify(checkReport, null, 2));
process.exit(checkReport.status === "pass" ? 0 : 1);
