#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-adapter-coverage-completion";
const EVIDENCE_DIR = "release-grade-adapter-coverage-completion";
const REQUIRED = [
  "release_grade_adapter_coverage_completion_report.json",
  "release_grade_adapter_coverage_matrix.json",
  "release_grade_adapter_coverage_claim_boundary.json",
  "release_grade_adapter_coverage_gate_report.json",
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

const report = readJsonIfExists(e("release_grade_adapter_coverage_completion_report.json"));
const matrix = readJsonIfExists(e("release_grade_adapter_coverage_matrix.json"));
const boundary = readJsonIfExists(e("release_grade_adapter_coverage_claim_boundary.json"));
const unresolved = readJsonIfExists(e("unresolved_items.json"));

addCheck(checks, "stage matches", report?.stage === STAGE && boundary?.stage === STAGE, {
  report_stage: report?.stage || null,
  boundary_stage: boundary?.stage || null
});
addCheck(checks, "ready for adapter final gate", report?.status === "ready_for_adapter_checked_final_gate"
  && report?.ready_for_adapter_checked_final_gate === true
  && report?.can_enter_adapter_checked_final_gate === true, {
  status: report?.status || null,
  ready_for_adapter_checked_final_gate: report?.ready_for_adapter_checked_final_gate || false
});
addCheck(checks, "provider-verified prerequisite open", report?.provider_verified_allowed === true
  && boundary?.provider_verified_allowed === true, boundary || {});
addCheck(checks, "adapter final not executed by coverage report", report?.adapter_checked_final_gate_not_executed_by_this_report === true
  && report?.adapter_checked_allowed === false
  && boundary?.adapter_checked_allowed === false, report || {});
addCheck(checks, "openai coverage pass", matrix?.openai?.provider_gate_runtime_coverage === "pass"
  && matrix?.openai?.dry_run?.all_passed === true, matrix?.openai || {});
addCheck(checks, "gemini coverage pass", matrix?.gemini?.provider_gate_runtime_coverage === "pass"
  && matrix?.gemini?.dry_run?.all_passed === true, matrix?.gemini || {});
addCheck(checks, "ollama coverage pass", matrix?.ollama?.local_adapter_conformance === "pass"
  && matrix?.ollama?.local_model_final_gate === "pass"
  && matrix?.ollama?.structured_output === "pass"
  && matrix?.ollama?.tool_calling === "pass"
  && matrix?.ollama?.replay_regression === "pass"
  && matrix?.ollama?.redaction_storage === "pass"
  && matrix?.ollama?.local_adapter_conformance_execution === "pass"
  && matrix?.ollama?.dry_run?.all_passed === true, matrix?.ollama || {});
addCheck(checks, "local vllm follow-up deferred to version2", matrix?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && matrix?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false
  && matrix?.local_vllm_version2_follow_up?.status === "deferred_until_version2"
  && matrix?.local_vllm_version2_follow_up?.adapter_manifest_exists === true, matrix?.local_vllm_version2_follow_up || {});
addCheck(checks, "common adapter dry-run pass", matrix?.common?.adapter_dry_run_status === "pass"
  && matrix?.common?.required_adapters_checked === true, matrix?.common || {});
addCheck(checks, "unresolved items empty", unresolved?.unresolved_items_count === 0
  && Array.isArray(unresolved?.unresolved_items)
  && unresolved.unresolved_items.length === 0, unresolved || {});
addCheck(checks, "strong release claims blocked", boundary?.adapter_checked_allowed === false
  && Array.isArray(boundary?.blocked_claims)
  && boundary.blocked_claims.includes("adapter-checked")
  && boundary.blocked_claims.includes("production-ready")
  && boundary.blocked_claims.includes("stable")
  && boundary.blocked_claims.includes("release-gated"), boundary || {});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "hold",
  stage: STAGE,
  ready_for_adapter_checked_final_gate: failures.length === 0,
  checks,
  failures,
  unresolved_items_count: unresolved?.unresolved_items_count ?? null,
  adapter_checked_allowed: false
};
const md = `# Release-grade Adapter Coverage Completion Check

Status: ${gate.status}

- Stage: ${STAGE}
- Ready for adapter-checked final gate: ${gate.ready_for_adapter_checked_final_gate}
- Adapter-checked allowed: false
- Unresolved items: ${gate.unresolved_items_count}
`;

writeJson(p("evals", "reports", "release_grade_adapter_coverage_completion_check_report.json"), gate);
writeText(p("evals", "reports", "release_grade_adapter_coverage_completion_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
