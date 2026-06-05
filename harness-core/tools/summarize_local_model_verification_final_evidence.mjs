#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate";

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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const report = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_gate_report.json`);
const summary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_evidence_summary.json`);
const completeness = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_evidence_completeness.json`);
const decision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_decision_record.json`);

const checks = [];
addCheck(checks, "summary exists and passed", summary?.status === "pass", summary || {});
addCheck(checks, "completeness exists and passed", completeness?.status === "pass"
  && Array.isArray(completeness?.missing_evidence)
  && completeness.missing_evidence.length === 0, completeness || {});
addCheck(checks, "final gate report passed", report?.status === "pass"
  && report?.local_model_verification_final_gate_passed === true, report || {});
addCheck(checks, "owner final decision recorded", decision?.status === "recorded"
  && decision?.decision === "approve_local_model_verified_claim", decision || {});
addCheck(checks, "qwen no-tool evidence passed", summary?.qwen3_14b_no_tool_review_passed === true
  && summary?.qwen3_6_27b_no_tool_review_passed === true
  && summary?.multimodel_no_tool_comparison_passed === true, summary || {});
addCheck(checks, "local redteam adapter redaction and referenceBaseline evidence passed", summary?.local_redteam_bounded_smoke_passed === true
  && summary?.adapter_conformance_dependency_backed_validation_passed === true
  && summary?.local_ollama_adapter_conformance_reviewed === true
  && summary?.storage_redaction_audit_passed === true
  && summary?.reference_baseline_compare_passed === true
  && summary?.ds_store_exclusion_policy_enforced === true, summary || {});
addCheck(checks, "no new final-stage execution occurred", summary?.openai_model_api_call === false
  && summary?.openai_provider_call === false
  && summary?.telemetry_sink_write === false
  && summary?.local_endpoint_probe === false
  && summary?.new_local_model_execution === false
  && summary?.new_local_generation_calls === 0
  && summary?.evidence_reference_baseline_refreshed_in_this_stage === false, summary || {});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  evidence_summary_status: summary?.status || "missing",
  evidence_completeness_status: completeness?.status || "missing",
  provider: summary?.provider || null,
  scope: summary?.scope || null,
  models: summary?.models || [],
  required_evidence: completeness?.required_evidence || [],
  missing_evidence: completeness?.missing_evidence || ["local_model_verification_final_evidence_completeness.json"],
  source_reports: summary?.source_reports || {},
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  checks,
  failures
};
const md = `# Local Model Verification Final Evidence Report

Status: ${result.status}

- Stage: ${STAGE}
- Scope: ${result.scope || "missing"}
- Models: ${result.models.join(", ")}
- Missing evidence: ${result.missing_evidence.length ? result.missing_evidence.join(", ") : "none"}
- New local model execution in this stage: false
- Additional reference baseline refresh in this stage: false

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_final_evidence_report.json"), result);
writeText(p("evals", "reports", "local_model_verification_final_evidence_report.md"), md);

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
