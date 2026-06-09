#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-structured-output-smoke-canary";
const EVIDENCE_DIR = "post-stable-local-structured-output-smoke-canary";
const REQUIRED = [
  "local_structured_output_smoke_report.json",
  "local_structured_output_response_mapping.json",
  "local_structured_output_redaction_report.json",
  "local_structured_output_claim_boundary.json",
  "local_structured_output_blocker_update.json",
  "local_structured_output_gate_report.json",
  "unresolved_items.json"
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "schema-output-verified"
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

const report = fs.existsSync(e("local_structured_output_smoke_report.json"))
  ? readJson(e("local_structured_output_smoke_report.json"))
  : null;
const boundary = fs.existsSync(e("local_structured_output_claim_boundary.json"))
  ? readJson(e("local_structured_output_claim_boundary.json"))
  : null;
const redaction = fs.existsSync(e("local_structured_output_redaction_report.json"))
  ? readJson(e("local_structured_output_redaction_report.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "status pass", report?.status === "pass", { status: report?.status });
addCheck(checks, "new local generation call count bounded", report?.new_local_model_execution === true
  && report?.new_local_generation_calls === 4, { calls: report?.new_local_generation_calls });
addCheck(checks, "models covered", Array.isArray(report?.models)
  && report.models.includes("qwen3:14b")
  && report.models.includes("qwen3.6:27b"), { models: report?.models });
addCheck(checks, "cases passed", report?.cases_total === 4 && report?.cases_passed === 4 && report?.cases_failed === 0, {});
addCheck(checks, "all json parse checks passed", report?.case_results?.every((item) => item.json_parse_passed === true
  && item.required_keys_present === true), {});
addCheck(checks, "raw request/response not stored", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && redaction?.raw_request_stored === false
  && redaction?.raw_response_stored === false, {});
addCheck(checks, "redaction passed", report?.redaction_passed === true && redaction?.status === "pass", {});
addCheck(checks, "protected paths unmodified", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, {});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.schema_output_verified_allowed === false, boundary || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_structured_output_smoke_check_report.json",
    "evals/reports/local_structured_output_smoke_check_report.md"
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
  can_proceed_to_tool_calling_mock_smoke: failed.length === 0,
  new_local_generation_calls: report?.new_local_generation_calls || 0,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# Local Structured-output Smoke Canary Check

Status: ${gate.status}

- Stage: ${STAGE}
- New local generation calls: ${gate.new_local_generation_calls}
- Can proceed to tool-calling mock smoke: ${gate.can_proceed_to_tool_calling_mock_smoke}
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_structured_output_smoke_check_report.json"), gate);
writeText(p("evals", "reports", "local_structured_output_smoke_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
