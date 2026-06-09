#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b";
const EVIDENCE_DIR = "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b";
const REQUIRED = [
  "local_no_tool_multimodel_comparison_report.json",
  "model_response_mapping_comparison.json",
  "reasoning_control_comparison.json",
  "storage_redaction_comparison.json",
  "local_model_verification_preconditions.json",
  "local_no_tool_multimodel_claim_boundary.json",
  "local_no_tool_multimodel_blocker_update.json",
  "local_no_tool_multimodel_gate_report.json",
  "unresolved_items.json"
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked"
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}

const report = fs.existsSync(e("local_no_tool_multimodel_comparison_report.json"))
  ? readJson(e("local_no_tool_multimodel_comparison_report.json"))
  : null;
const boundary = fs.existsSync(e("local_no_tool_multimodel_claim_boundary.json"))
  ? readJson(e("local_no_tool_multimodel_claim_boundary.json"))
  : null;
const storage = fs.existsSync(e("storage_redaction_comparison.json"))
  ? readJson(e("storage_redaction_comparison.json"))
  : null;
const reasoning = fs.existsSync(e("reasoning_control_comparison.json"))
  ? readJson(e("reasoning_control_comparison.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "status pass", report?.status === "pass", { status: report?.status });
addCheck(checks, "models covered", Array.isArray(report?.models)
  && report.models.includes("qwen3:14b")
  && report.models.includes("qwen3.6:27b"), { models: report?.models });
addCheck(checks, "new_local_model_execution == false", report?.new_local_model_execution === false, {});
addCheck(checks, "new_local_generation_calls == 0", report?.new_local_generation_calls === 0, {});
addCheck(checks, "all model result reviews passed", Array.isArray(report?.model_results)
  && report.model_results.length === 2
  && report.model_results.every((item) => item.result_review_passed === true), {});
addCheck(checks, "all no-tool canaries passed", report?.model_results?.every((item) => item.local_no_tool_canary_passed === true), {});
addCheck(checks, "all cases 2/2 passed", report?.model_results?.every((item) => item.cases_total === 2 && item.cases_passed === 2 && item.cases_failed === 0), {});
addCheck(checks, "tool calling not used", report?.model_results?.every((item) => item.tool_calling_used === false), {});
addCheck(checks, "structured output not used", report?.model_results?.every((item) => item.structured_output_used === false), {});
addCheck(checks, "raw request/response not stored", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && storage?.raw_request_stored_any === false
  && storage?.raw_response_stored_any === false, {});
addCheck(checks, "redaction passed all", storage?.redaction_passed_all === true, {});
addCheck(checks, "reasoning control compared", reasoning?.status === "recorded"
  && reasoning?.qwen3_6_27b?.reasoning_effort_none_applied === true, reasoning || {});
addCheck(checks, "protected paths unmodified", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, {});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false, boundary || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_no_tool_multimodel_check_report.json",
    "evals/reports/local_no_tool_multimodel_check_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, { matches: blockedMatches });

const failed = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  can_proceed_to_local_model_verification_gate_design: failed.length === 0,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# Local No-tool Multimodel Comparison Gate

Status: ${gate.status}

- Stage: ${STAGE}
- Unresolved items: ${gate.unresolved_items_count}
- Can proceed to gate design: ${gate.can_proceed_to_local_model_verification_gate_design}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_no_tool_multimodel_check_report.json"), gate);
writeText(p("evals", "reports", "local_no_tool_multimodel_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
