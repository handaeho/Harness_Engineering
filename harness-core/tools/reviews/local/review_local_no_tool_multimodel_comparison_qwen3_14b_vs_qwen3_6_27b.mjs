#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b";
const EVIDENCE_DIR = "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const ALLOWED_CLAIMS = [
  "post-stable-local-no-tool-multimodel-comparison-recorded",
  "post-stable-local-no-tool-qwen3-models-compared",
  "post-stable-local-no-tool-reasoning-control-compared",
  "post-stable-local-no-tool-storage-redaction-compared",
  "post-stable-local-model-verification-preconditions-drafted"
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function existsRel(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonRel(relPath) {
  return readJson(p(...relPath.split("/")));
}

function gitStatusFor(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function protectedStatus() {
  const status = gitStatusFor([
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline")),
    git_status: status
  };
}

const inputs = {
  "qwen3:14b": {
    resultReview: "evidence/post-stable-local-no-tool-canary-qwen3-14b-result-review/local_no_tool_canary_qwen3_14b_result_review.json",
    readiness: "evidence/post-rc-local-endpoint-readiness-preflight/local_endpoint_readiness_gate_report.json",
    canary: "evidence/post-rc-local-no-tool-canary/local_no_tool_canary_gate_report.json",
    mapping: "evidence/post-rc-local-no-tool-canary/local_response_mapping_report.json",
    redaction: "evidence/post-rc-local-no-tool-canary/local_no_tool_redaction_report.json"
  },
  "qwen3.6:27b": {
    resultReview: "evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review/local_no_tool_canary_qwen3_6_27b_result_review.json",
    readiness: "evidence/post-rc-local-endpoint-readiness-preflight-qwen3-6-27b/local_endpoint_readiness_gate_report.json",
    canary: "evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_no_tool_canary_gate_report.json",
    mapping: "evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_response_mapping_report.json",
    redaction: "evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_no_tool_redaction_report.json"
  }
};

const missingInputs = Object.values(inputs)
  .flatMap((group) => Object.values(group))
  .filter((file) => !existsRel(file));
const protectedPaths = protectedStatus();

function summarizeModel(model) {
  const paths = inputs[model];
  const resultReview = existsRel(paths.resultReview) ? readJsonRel(paths.resultReview) : null;
  const readiness = existsRel(paths.readiness) ? readJsonRel(paths.readiness) : null;
  const canary = existsRel(paths.canary) ? readJsonRel(paths.canary) : null;
  const mapping = existsRel(paths.mapping) ? readJsonRel(paths.mapping) : null;
  const redaction = existsRel(paths.redaction) ? readJsonRel(paths.redaction) : null;
  const cases = Array.isArray(mapping?.cases) ? mapping.cases : [];
  const responseUsages = cases.map((item) => item.response?.usage).filter(Boolean);
  const completionTokens = responseUsages
    .map((usage) => usage.completion_tokens)
    .filter((value) => Number.isFinite(value));

  return {
    model,
    provider: canary?.provider || resultReview?.provider || null,
    readiness_preflight_passed: readiness?.status === "pass" && resultReview?.readiness_preflight_passed === true,
    local_no_tool_canary_passed: canary?.status === "pass" && resultReview?.local_no_tool_canary_passed === true,
    result_review_passed: resultReview?.status === "pass",
    cases_total: canary?.cases_total || 0,
    cases_passed: canary?.cases_passed || 0,
    cases_failed: canary?.cases_failed || 0,
    final_content_non_empty: resultReview?.final_content_non_empty === true
      && cases.every((item) => item.output_text_present === true),
    tool_calling_used: resultReview?.tool_calling_used === true || canary?.tools_used === true,
    structured_output_used: resultReview?.structured_output_used === true || canary?.structured_output_used === true,
    think_false_applied: resultReview?.think_false_applied === true,
    reasoning_effort_none_applied: resultReview?.reasoning_effort_none_applied === true
      || mapping?.request_mapping?.reasoning_effort_none_for_ollama === true,
    raw_request_stored: resultReview?.raw_request_stored === true
      || canary?.raw_request_stored === true
      || redaction?.raw_request_stored === true,
    raw_response_stored: resultReview?.raw_response_stored === true
      || canary?.raw_response_stored === true
      || mapping?.response_mapping?.raw_response_stored === true
      || redaction?.raw_response_stored === true,
    redaction_passed: resultReview?.redaction_passed === true && redaction?.status === "pass",
    output_text_hashes: cases.map((item) => ({
      case_id: item.case_id,
      hash: item.response?.output_text_hash || null,
      finish_reason: item.response?.finish_reason || null
    })),
    completion_tokens: completionTokens,
    completion_tokens_total: completionTokens.reduce((sum, value) => sum + value, 0),
    source_files: paths
  };
}

const modelResults = MODELS.map(summarizeModel);
const noToolComparisonPassed = missingInputs.length === 0
  && modelResults.every((item) => item.readiness_preflight_passed === true)
  && modelResults.every((item) => item.local_no_tool_canary_passed === true)
  && modelResults.every((item) => item.result_review_passed === true)
  && modelResults.every((item) => item.cases_total === 2 && item.cases_passed === 2 && item.cases_failed === 0)
  && modelResults.every((item) => item.tool_calling_used === false)
  && modelResults.every((item) => item.structured_output_used === false)
  && modelResults.every((item) => item.raw_request_stored === false && item.raw_response_stored === false)
  && modelResults.every((item) => item.redaction_passed === true)
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false;

const reasoningControlComparison = {
  status: "recorded",
  qwen3_14b: {
    think_false_applied: modelResults.find((item) => item.model === "qwen3:14b")?.think_false_applied === true,
    reasoning_effort_none_applied: false
  },
  qwen3_6_27b: {
    think_false_applied: modelResults.find((item) => item.model === "qwen3.6:27b")?.think_false_applied === true,
    reasoning_effort_none_applied: modelResults.find((item) => item.model === "qwen3.6:27b")?.reasoning_effort_none_applied === true
  },
  conclusion: "qwen3.6:27b required explicit reasoning_effort none controls; qwen3:14b no-tool evidence only records think:false."
};

const storageRedactionComparison = {
  status: noToolComparisonPassed ? "pass" : "fail",
  raw_request_stored_any: modelResults.some((item) => item.raw_request_stored === true),
  raw_response_stored_any: modelResults.some((item) => item.raw_response_stored === true),
  redaction_passed_all: modelResults.every((item) => item.redaction_passed === true)
};

const localModelVerificationPreconditions = {
  status: "drafted",
  stage: STAGE,
  no_tool_multimodel_comparison_passed: noToolComparisonPassed,
  required_next_surfaces: [
    "local-model verification gate design",
    "structured-output smoke canary",
    "tool-calling mock smoke canary",
    "local replay/regression smoke",
    "local redaction/storage cross-suite audit",
    "local model verification evidence bundle draft",
    "owner decision required before any strong local verification claim"
  ],
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};

const claimBoundary = {
  status: noToolComparisonPassed ? "pass" : "fail",
  stage: STAGE,
  local_no_tool_multimodel_comparison_recorded: noToolComparisonPassed,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: noToolComparisonPassed ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const unresolvedItems = noToolComparisonPassed ? [] : [
  ...missingInputs.map((file, index) => ({
    id: `LMM-${String(index + 1).padStart(3, "0")}`,
    severity: "high",
    description: `Missing required comparison input: ${file}`,
    recommended_next_action: "Restore the missing no-tool evidence before rerunning the multi-model comparison."
  })),
  ...(!noToolComparisonPassed && missingInputs.length === 0 ? [{
    id: "LMM-CHECKS",
    severity: "high",
    description: "One or more multi-model no-tool comparison checks failed.",
    recommended_next_action: "Inspect model comparison summaries and source evidence."
  }] : [])
];

const report = {
  status: noToolComparisonPassed ? "pass" : "fail",
  stage: STAGE,
  models: MODELS,
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: storageRedactionComparison.raw_request_stored_any,
  raw_response_stored: storageRedactionComparison.raw_response_stored_any,
  secrets_logged: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  model_results: modelResults,
  reasoning_control_comparison: reasoningControlComparison,
  storage_redaction_comparison: storageRedactionComparison,
  local_model_verification_preconditions: localModelVerificationPreconditions,
  claims_allowed: claimBoundary.allowed_claims,
  claims_blocked: BLOCKED_CLAIMS,
  missing_inputs: missingInputs,
  unresolved_items_count: unresolvedItems.length
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "qwen3_14b_and_qwen3_6_27b_no_tool_paths_passed_multimodel_comparison_pending",
  new_status: noToolComparisonPassed
    ? "local_no_tool_multimodel_comparison_passed_local_model_verification_gate_design_pending"
    : "local_no_tool_multimodel_comparison_failed",
  unblocks: noToolComparisonPassed ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "design local-model verification gate criteria",
    "run structured-output smoke if required or recommended",
    "run tool-calling mock smoke if required or recommended"
  ]
};

const md = `# Local No-tool Multimodel Comparison

Status: ${report.status}

- Stage: ${STAGE}
- Models: ${MODELS.join(", ")}
- New local model execution: false
- New local generation calls: 0
- Raw request stored: ${report.raw_request_stored}
- Raw response stored: ${report.raw_response_stored}
- Redaction passed all: ${storageRedactionComparison.redaction_passed_all}
- qwen3.6:27b reasoning_effort none: ${reasoningControlComparison.qwen3_6_27b.reasoning_effort_none_applied}

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_comparison_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_comparison_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "model_response_mapping_comparison.json"), modelResults);
writeJson(p("evidence", EVIDENCE_DIR, "reasoning_control_comparison.json"), reasoningControlComparison);
writeJson(p("evidence", EVIDENCE_DIR, "storage_redaction_comparison.json"), storageRedactionComparison);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_preconditions.json"), localModelVerificationPreconditions);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_no_tool_multimodel_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_no_tool_multimodel_comparison_report.json"), report);
writeText(p("evals", "reports", "local_no_tool_multimodel_comparison_report.md"), md);
writeJson(p("evals", "reports", "local_no_tool_multimodel_gate_report.json"), report);
writeText(p("evals", "reports", "local_no_tool_multimodel_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
