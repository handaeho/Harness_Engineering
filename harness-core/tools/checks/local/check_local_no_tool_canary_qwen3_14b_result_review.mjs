#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-no-tool-canary-result-review-qwen3-14b";
const EVIDENCE_DIR = "post-stable-local-no-tool-canary-qwen3-14b-result-review";
const REQUIRED = [
  "local_no_tool_canary_qwen3_14b_result_review.json",
  "local_endpoint_readiness_evidence_index.json",
  "local_no_tool_canary_evidence_index.json",
  "qwen3_thinking_behavior_record.json",
  "local_no_tool_storage_redaction_review.json",
  "local_no_tool_canary_qwen3_14b_claim_boundary.json",
  "local_no_tool_canary_qwen3_14b_blocker_update.json",
  "qwen3_30b_comparison_preconditions.json",
  "local_no_tool_canary_qwen3_14b_gate_report.json",
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

const result = fs.existsSync(e("local_no_tool_canary_qwen3_14b_result_review.json"))
  ? readJson(e("local_no_tool_canary_qwen3_14b_result_review.json"))
  : null;
const boundary = fs.existsSync(e("local_no_tool_canary_qwen3_14b_claim_boundary.json"))
  ? readJson(e("local_no_tool_canary_qwen3_14b_claim_boundary.json"))
  : null;
const storage = fs.existsSync(e("local_no_tool_storage_redaction_review.json"))
  ? readJson(e("local_no_tool_storage_redaction_review.json"))
  : null;
const preconditions = fs.existsSync(e("qwen3_30b_comparison_preconditions.json"))
  ? readJson(e("qwen3_30b_comparison_preconditions.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

addCheck(checks, "stage matches", result?.stage === STAGE, { stage: result?.stage });
addCheck(checks, "readiness_preflight_passed == true", result?.readiness_preflight_passed === true, {});
addCheck(checks, "local_no_tool_canary_passed == true", result?.local_no_tool_canary_passed === true, {});
addCheck(checks, "cases_total == 2", result?.cases_total === 2, { cases_total: result?.cases_total });
addCheck(checks, "cases_passed == 2", result?.cases_passed === 2, { cases_passed: result?.cases_passed });
addCheck(checks, "cases_failed == 0", result?.cases_failed === 0, { cases_failed: result?.cases_failed });
addCheck(checks, "tool_calling_used == false", result?.tool_calling_used === false, {});
addCheck(checks, "structured_output_used == false", result?.structured_output_used === false, {});
addCheck(checks, "think_false_applied == true", result?.think_false_applied === true, {});
addCheck(checks, "final_content_non_empty == true", result?.final_content_non_empty === true, {});
addCheck(checks, "raw_request_stored == false", result?.raw_request_stored === false && storage?.raw_request_stored === false, {});
addCheck(checks, "raw_response_stored == false", result?.raw_response_stored === false && storage?.raw_response_stored === false, {});
addCheck(checks, "secrets_logged == false", result?.secrets_logged === false && storage?.secret_logged === false, {});
addCheck(checks, "redaction_passed == true", result?.redaction_passed === true && storage?.redaction_passed === true, {});
addCheck(checks, "local_model_verified_allowed == false", boundary?.local_model_verified_allowed === false, {});
addCheck(checks, "provider_diverse_allowed == false", boundary?.provider_diverse_allowed === false, {});
addCheck(checks, "provider_verified_allowed == false", boundary?.provider_verified_allowed === false, {});
addCheck(checks, "adapter_checked_allowed == false", boundary?.adapter_checked_allowed === false, {});
addCheck(checks, "production_ready_allowed == false", boundary?.production_ready_allowed === false, {});
addCheck(checks, "stable_allowed == false", boundary?.stable_allowed === false, {});
addCheck(checks, "reference_baseline_source_modified == false", result?.reference_baseline_source_modified === false, {});
addCheck(checks, "dist_modified == false", result?.dist_modified === false, {});
addCheck(checks, "qwen3:30b requires operator readiness", preconditions?.status === "operator_model_readiness_required"
  && preconditions?.do_not_auto_pull_model === true
  && preconditions?.do_not_auto_download_model === true, preconditions || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", {
  matches: scan.matches.length
});
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, {
  matches: blockedMatches
});

const dependency = {
  dependency_backed_validation_status: result?.dependency_backed_validation_status || "unknown",
  yaml_import_available: result?.yaml_import_available === true,
  does_not_invalidate_local_no_tool_result_review: result?.does_not_invalidate_local_no_tool_result_review === true
};
addCheck(checks, "dependency blocker recorded honestly", dependency.dependency_backed_validation_status !== "unknown"
  && dependency.does_not_invalidate_local_no_tool_result_review === true, dependency);

const failed = checks.filter((check) => check.status !== "pass");
const report = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  dependency,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  claims_allowed: result?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# qwen3:14b Local No-tool Result Review Gate

Status: ${report.status}

- Stage: ${STAGE}
- Dependency-backed validation: ${dependency.dependency_backed_validation_status}
- Unresolved items: ${report.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_no_tool_canary_qwen3_14b_gate_report.json"), report);
writeText(p("evals", "reports", "local_no_tool_canary_qwen3_14b_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
