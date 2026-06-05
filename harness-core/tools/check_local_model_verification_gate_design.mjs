#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-gate-design";
const EVIDENCE_DIR = "post-stable-local-model-verification-gate-design";
const REQUIRED = [
  "local_model_verification_gate_design_report.json",
  "local_model_verification_criteria_matrix.json",
  "local_model_verification_gate_definition.json",
  "local_model_verification_claim_boundary.json",
  "local_model_verification_blocker_update.json",
  "local_model_verification_gate_design_gate_report.json",
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
addCheck(checks, "release/local_model_verification_gate.yaml exists", fs.existsSync(p("release", "local_model_verification_gate.yaml")), {});
addCheck(checks, "docs/local_model_verification_execution_plan.md exists", fs.existsSync(p("docs", "local_model_verification_execution_plan.md")), {});

const report = fs.existsSync(e("local_model_verification_gate_design_report.json"))
  ? readJson(e("local_model_verification_gate_design_report.json"))
  : null;
const matrix = fs.existsSync(e("local_model_verification_criteria_matrix.json"))
  ? readJson(e("local_model_verification_criteria_matrix.json"))
  : null;
const boundary = fs.existsSync(e("local_model_verification_claim_boundary.json"))
  ? readJson(e("local_model_verification_claim_boundary.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

const criteria = Array.isArray(matrix?.criteria) ? matrix.criteria : [];
const criteriaIds = new Set(criteria.map((item) => item.id));

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "status pass", report?.status === "pass", { status: report?.status });
addCheck(checks, "no new local model execution", report?.new_local_model_execution === false && report?.new_local_generation_calls === 0, {});
addCheck(checks, "no-tool comparison prerequisite passed", report?.no_tool_multimodel_comparison_passed === true, {});
addCheck(checks, "structured smoke required", report?.structured_output_smoke_required === true && criteriaIds.has("structured_output_smoke"), {});
addCheck(checks, "tool mock smoke required", report?.tool_calling_mock_smoke_required === true && criteriaIds.has("tool_calling_mock_smoke"), {});
addCheck(checks, "replay smoke required", report?.replay_regression_smoke_required === true && criteriaIds.has("replay_regression_smoke"), {});
addCheck(checks, "redaction storage audit required", report?.redaction_storage_cross_suite_audit_required === true
  && criteriaIds.has("redaction_storage_cross_suite_audit"), {});
addCheck(checks, "local redteam blocker recorded", criteria.some((item) => item.id === "local_redteam_coverage"
  && item.blocker_if_missing === true), {});
addCheck(checks, "adapter conformance blocker recorded", criteria.some((item) => item.id === "adapter_conformance_dependency_backed_validation"
  && item.blocker_if_missing === true), {});
addCheck(checks, "owner decision required", report?.owner_decision_required_for_final_gate === true
  && criteria.some((item) => item.id === "owner_final_decision"), {});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false, boundary || {});
addCheck(checks, "protected paths unmodified", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verification_gate_design_check_report.json",
    "evals/reports/local_model_verification_gate_design_check_report.md"
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
  can_proceed_to_structured_output_smoke: failed.length === 0 && report?.structured_output_smoke_required === true,
  can_proceed_to_tool_calling_mock_smoke: failed.length === 0 && report?.tool_calling_mock_smoke_required === true,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# Local Model Verification Gate Design Check

Status: ${gate.status}

- Stage: ${STAGE}
- Can proceed to structured-output smoke: ${gate.can_proceed_to_structured_output_smoke}
- Can proceed to tool-calling mock smoke: ${gate.can_proceed_to_tool_calling_mock_smoke}
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_gate_design_check_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_gate_design_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
