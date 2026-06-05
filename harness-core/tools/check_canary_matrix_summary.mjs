#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-canary-matrix-summary-and-local-readiness";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readJson(p("evidence", "beta-preflight", "dependency_validation_report.json"));
const scan = readJson(p("evidence", "alpha", "prohibited_claim_scan.json"));
const baseline = readJson(p("evidence", "alpha", "baseline_comparison.json"));
const providerGate = readJson(p("evidence", "beta-provider-canary-openai", "provider_canary_gate_report.json"));
const structuredGate = readJson(p("evidence", "beta-structured-output-canary-openai", "structured_output_gate_report.json"));
const toolGate = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_calling_gate_report.json"));
const summary = readJson(p("evidence", "beta-canary-matrix-summary", "canary_matrix_summary.json"));
const localReadiness = readJson(p("evidence", "beta-canary-matrix-summary", "local_readiness_report.json"));
const blockers = readJson(p("evidence", "beta-canary-matrix-summary", "local_readiness_blockers.json"));
const claimStatus = readJson(p("evidence", "beta-canary-matrix-summary", "claim_status_report.json"));

addCheck(checks, "validate_alpha.mjs pass", dependency.status === "pass" && dependency.fallback_used === false, {
  status: dependency.status,
  fallback_used: dependency.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
  status: baseline.status,
  unresolved_items_count: baseline.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.alpha_snapshot.current_snapshot_mismatch_count
});
addCheck(checks, "check_openai_credentialed_canary.mjs pass", providerGate.status === "pass", { status: providerGate.status });
addCheck(checks, "check_openai_structured_output_canary.mjs pass", structuredGate.status === "pass", { status: structuredGate.status });
addCheck(checks, "check_openai_tool_calling_canary.mjs pass", toolGate.status === "pass", { status: toolGate.status });
addCheck(checks, "canary_matrix_summary.json exists", fs.existsSync(p("evidence", "beta-canary-matrix-summary", "canary_matrix_summary.json")), {});
addCheck(checks, "local_readiness_blockers.json exists", fs.existsSync(p("evidence", "beta-canary-matrix-summary", "local_readiness_blockers.json")), {});
addCheck(checks, "local_readiness_report.json exists", fs.existsSync(p("evidence", "beta-canary-matrix-summary", "local_readiness_report.json")), {});
addCheck(checks, "claim_status_report.json exists", fs.existsSync(p("evidence", "beta-canary-matrix-summary", "claim_status_report.json")), {});
addCheck(checks, "provider_execution_performed_in_this_stage is false", summary.provider_execution_performed_in_this_stage === false, {
  provider_execution_performed_in_this_stage: summary.provider_execution_performed_in_this_stage
});
addCheck(checks, "local_model_execution_performed_in_this_stage is false", summary.local_model_execution_performed_in_this_stage === false, {
  local_model_execution_performed_in_this_stage: summary.local_model_execution_performed_in_this_stage
});
addCheck(checks, "local endpoint probe not performed", summary.endpoint_probe_performed_in_this_stage === false, {
  endpoint_probe_performed_in_this_stage: summary.endpoint_probe_performed_in_this_stage
});
addCheck(checks, "OpenAI canary matrix is canary_only", summary.matrix.openai.claim_level === "canary_only"
  && summary.matrix.openai.no_tool_text_path === "canary_checked"
  && summary.matrix.openai.structured_output_path === "canary_checked"
  && summary.matrix.openai.tool_calling_path === "canary_checked", summary.matrix.openai);
addCheck(checks, "vLLM local canary blocked by missing endpoint", summary.matrix.vllm.local_no_tool_path === "blocked_by_missing_endpoint"
  && localReadiness.vllm_endpoint_available === false, summary.matrix.vllm);
addCheck(checks, "Ollama local canary blocked by missing endpoint", summary.matrix.ollama.local_no_tool_path === "blocked_by_missing_endpoint"
  && localReadiness.ollama_endpoint_available === false, summary.matrix.ollama);
addCheck(checks, "local blockers recorded", blockers.length === 2, { blockers: blockers.length });
addCheck(checks, "local execution claims absent", claimStatus.claims_not_allowed.includes("local-model-verified")
  && claimStatus.claims_not_allowed.includes("vllm-no-tool-canary-executed")
  && claimStatus.claims_not_allowed.includes("ollama-no-tool-canary-executed"), {});
addCheck(checks, "provider-diverse claim absent", claimStatus.claims_not_allowed.includes("provider-diverse")
  && localReadiness.provider_diversity_claim_allowed === false, {});
addCheck(checks, "reference baseline source modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_reference_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const report = {
  status: failed.length ? "fail" : "pass",
  stage: STAGE,
  can_enter_local_no_tool_canary: false,
  can_enter_provider_diversity_claim: false,
  can_enter_replay_verification: false,
  reason: "Local endpoint is not available; local canary remains blocked until explicitly configured.",
  checks,
  claims_allowed: [
    "canary-matrix-summarized",
    "local-readiness-documented",
    "local-endpoint-blocker-recorded"
  ],
  claims_blocked: [
    "local-no-tool-canary-executed",
    "vllm-no-tool-canary-executed",
    "ollama-no-tool-canary-executed",
    "local-model-verified",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "tool-call-verified",
    "schema-output-verified",
    "replay-verified",
    "integration-verified",
    "release-gated",
    "production-monitored"
  ]
};

const md = `# Canary Matrix Summary Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter local no-tool canary: false
- Can enter provider diversity claim: false
- Can enter replay verification: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "canary_matrix_summary_gate_report.json"), report);
writeText(p("evals", "reports", "canary_matrix_summary_gate_report.md"), md);
writeJson(p("evidence", "beta-canary-matrix-summary", "canary_matrix_summary_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
