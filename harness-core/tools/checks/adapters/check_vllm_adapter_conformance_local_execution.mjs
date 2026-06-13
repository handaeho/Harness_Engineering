#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-vllm-adapter-conformance-local-execution";
const EVIDENCE_DIR = "post-stable-vllm-adapter-conformance-local-execution";
const REQUIRED = [
  "vllm_adapter_conformance_report.json",
  "vllm_adapter_conformance_mapping_review.json",
  "vllm_adapter_conformance_redaction_report.json",
  "vllm_adapter_conformance_claim_boundary.json",
  "vllm_adapter_conformance_gate_report.json",
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

const report = readJsonIfExists(e("vllm_adapter_conformance_report.json"));
const mapping = readJsonIfExists(e("vllm_adapter_conformance_mapping_review.json"));
const redaction = readJsonIfExists(e("vllm_adapter_conformance_redaction_report.json"));
const boundary = readJsonIfExists(e("vllm_adapter_conformance_claim_boundary.json"));
const unresolved = readJsonIfExists(e("unresolved_items.json"));

addCheck(checks, "stage matches", report?.stage === STAGE && mapping?.stage === STAGE, {
  report_stage: report?.stage || null,
  mapping_stage: mapping?.stage || null
});
addCheck(checks, "status pass", report?.status === "pass", {
  status: report?.status || null
});
addCheck(checks, "provider and adapter match vllm", report?.provider === "vllm"
  && report?.adapter_id === "vllm.local.skeleton"
  && mapping?.adapter_loaded === true, {
  provider: report?.provider || null,
  adapter_id: report?.adapter_id || null
});
addCheck(checks, "source no-tool execution reviewed", report?.source_no_tool_execution_reviewed === true
  && report?.chat_template_roundtrip_checked === true
  && mapping?.no_tool_roundtrip_reviewed === true, mapping || {});
addCheck(checks, "dry-run vllm cases passed", report?.dry_run_vllm_cases_total > 0
  && report?.dry_run_vllm_cases_passed === report?.dry_run_vllm_cases_total
  && mapping?.dry_run_vllm_cases_passed === mapping?.dry_run_vllm_cases_total, mapping || {});
addCheck(checks, "structured output runtime checked", report?.structured_output_runtime_checked === true
  && mapping?.structured_output_runtime_checked === true
  && Array.isArray(report?.structured_results)
  && report.structured_results.length > 0
  && report.structured_results.every((item) => item.status === "pass"), {
  structured_results: report?.structured_results || []
});
addCheck(checks, "tool parser runtime checked", report?.tool_parser_runtime_checked === true
  && mapping?.tool_parser_runtime_checked === true
  && Array.isArray(report?.tool_results)
  && report.tool_results.length > 0
  && report.tool_results.every((item) => item.status === "pass"), {
  tool_results: report?.tool_results || []
});
addCheck(checks, "new local execution bounded", report?.new_local_model_execution === true
  && report?.new_local_model_call_count > 0
  && report?.new_local_model_call_count <= 6, {
  new_local_model_call_count: report?.new_local_model_call_count || 0
});
addCheck(checks, "no external side effects or telemetry writes", report?.external_tool_executed === false
  && report?.telemetry_sink_write === false, report || {});
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
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  ready_for_release_grade_adapter_coverage_completion: failures.length === 0,
  checks,
  failures,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  adapter_checked_allowed: false
};
const md = `# vLLM Adapter Conformance Local Execution Check

Status: ${gate.status}

- Stage: ${STAGE}
- Ready for release-grade adapter coverage completion: ${gate.ready_for_release_grade_adapter_coverage_completion}
- Adapter-checked allowed: false
- Unresolved items: ${gate.unresolved_items_count}
`;

writeJson(p("evals", "reports", "vllm_adapter_conformance_check_report.json"), gate);
writeText(p("evals", "reports", "vllm_adapter_conformance_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
