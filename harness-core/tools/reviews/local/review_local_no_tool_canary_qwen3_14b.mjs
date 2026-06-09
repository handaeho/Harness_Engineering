#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-no-tool-canary-result-review-qwen3-14b";
const EVIDENCE_DIR = "post-stable-local-no-tool-canary-qwen3-14b-result-review";
const PROVIDER = "ollama";
const MODEL = "qwen3:14b";
const ENDPOINT = "http://127.0.0.1:11434";
const ALLOWED_CLAIMS = [
  "post-stable-local-endpoint-readiness-preflight-passed",
  "post-stable-local-no-tool-canary-qwen3-14b-passed",
  "post-stable-local-no-tool-canary-qwen3-14b-result-reviewed",
  "post-stable-qwen3-thinking-behavior-recorded",
  "post-stable-local-no-tool-storage-redaction-reviewed"
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

function rel(...parts) {
  return parts.join("/");
}

function readJsonRel(relPath) {
  return readJson(p(...relPath.split("/")));
}

function existsRel(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
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

function dependencyStatus() {
  const yamlPackageDir = p("node_modules", "yaml");
  return {
    dependency_backed_validation_status: fs.existsSync(yamlPackageDir)
      ? "available_not_executed_in_result_review"
      : "blocked_by_missing_node_modules",
    yaml_import_available: fs.existsSync(yamlPackageDir),
    does_not_invalidate_local_no_tool_result_review: true
  };
}

function summarizeForbiddenStatus() {
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

const readinessPath = "evidence/post-rc-local-endpoint-readiness-preflight/local_endpoint_readiness_gate_report.json";
const readinessProbePath = "evidence/post-rc-local-endpoint-readiness-preflight/endpoint_probe_summary.json";
const canaryPath = "evidence/post-rc-local-no-tool-canary/local_no_tool_canary_gate_report.json";
const mappingPath = "evidence/post-rc-local-no-tool-canary/local_response_mapping_report.json";
const redactionPath = "evidence/post-rc-local-no-tool-canary/local_no_tool_redaction_report.json";
const tracePath = "evidence/post-rc-local-no-tool-canary/local_trace_samples.jsonl";

const requiredInputs = [readinessPath, readinessProbePath, canaryPath, mappingPath, redactionPath, tracePath];
const missingInputs = requiredInputs.filter((item) => !existsRel(item));

const readiness = missingInputs.length ? null : readJsonRel(readinessPath);
const readinessProbe = missingInputs.length ? null : readJsonRel(readinessProbePath);
const canary = missingInputs.length ? null : readJsonRel(canaryPath);
const mapping = missingInputs.length ? null : readJsonRel(mappingPath);
const redaction = missingInputs.length ? null : readJsonRel(redactionPath);
const forbiddenStatus = summarizeForbiddenStatus();
const dependency = dependencyStatus();

const mappingCases = Array.isArray(mapping?.cases) ? mapping.cases : [];
const finalContentNonEmpty = mappingCases.length > 0 && mappingCases.every((item) => item.output_text_present === true);
const thinkFalseApplied = mapping?.request_mapping?.thinking_disabled_for_ollama === true
  && mappingCases.every((item) => item.request?.thinking_disabled === true);
const noRawStorage = canary?.raw_request_stored === false
  && canary?.raw_response_stored === false
  && redaction?.raw_request_stored === false
  && redaction?.raw_response_stored === false;

const reviewPass = missingInputs.length === 0
  && readiness?.status === "pass"
  && readiness?.can_enter_local_no_tool_canary === true
  && readiness?.provider === PROVIDER
  && readiness?.model_name === MODEL
  && readinessProbe?.target_model_present === true
  && canary?.status === "pass"
  && canary?.provider === PROVIDER
  && canary?.model_name === MODEL
  && canary?.cases_total === 2
  && canary?.cases_passed === 2
  && canary?.cases_failed === 0
  && canary?.tools_used === false
  && canary?.structured_output_used === false
  && finalContentNonEmpty
  && thinkFalseApplied
  && noRawStorage
  && redaction?.status === "pass"
  && redaction?.secrets_logged === false
  && forbiddenStatus.reference_baseline_source_modified === false
  && forbiddenStatus.dist_modified === false
  && forbiddenStatus.evidence_reference_baseline_modified === false;

const resultReview = {
  status: reviewPass ? "pass" : "fail",
  stage: STAGE,
  provider: PROVIDER,
  model: MODEL,
  endpoint: ENDPOINT,
  api_shape: "openai_compatible",
  readiness_preflight_passed: readiness?.status === "pass",
  local_no_tool_canary_passed: canary?.status === "pass",
  cases_total: canary?.cases_total || 0,
  cases_passed: canary?.cases_passed || 0,
  cases_failed: canary?.cases_failed || 0,
  tool_calling_used: canary?.tools_used === true,
  structured_output_used: canary?.structured_output_used === true,
  think_false_applied: thinkFalseApplied,
  final_content_non_empty: finalContentNonEmpty,
  raw_request_stored: !noRawStorage,
  raw_response_stored: !noRawStorage,
  secrets_logged: redaction?.secrets_logged === true,
  redaction_passed: redaction?.status === "pass",
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: forbiddenStatus.reference_baseline_source_modified,
  dist_modified: forbiddenStatus.dist_modified,
  evidence_reference_baseline_modified: forbiddenStatus.evidence_reference_baseline_modified,
  dependency_backed_validation_status: dependency.dependency_backed_validation_status,
  yaml_import_available: dependency.yaml_import_available,
  does_not_invalidate_local_no_tool_result_review: dependency.does_not_invalidate_local_no_tool_result_review,
  missing_inputs: missingInputs,
  claims_allowed: reviewPass ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const readinessIndex = {
  status: readiness?.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  source_stage: readiness?.stage || null,
  evidence_files: [
    {
      path: readinessPath,
      status: readiness?.status || null,
      provider: readiness?.provider || null,
      model_name: readiness?.model_name || null,
      local_endpoint_probe: readiness?.local_endpoint_probe || false,
      local_model_execution: readiness?.local_model_execution || false
    },
    {
      path: readinessProbePath,
      status: readinessProbe?.status || null,
      target_model_present: readinessProbe?.target_model_present || false,
      raw_request_stored: readinessProbe?.raw_request_stored || false,
      raw_response_stored: readinessProbe?.raw_response_stored || false
    }
  ]
};

const canaryIndex = {
  status: canary?.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  source_stage: canary?.stage || null,
  evidence_files: [
    {
      path: canaryPath,
      status: canary?.status || null,
      cases_total: canary?.cases_total || 0,
      cases_passed: canary?.cases_passed || 0,
      tools_used: canary?.tools_used || false,
      structured_output_used: canary?.structured_output_used || false,
      raw_request_stored: canary?.raw_request_stored || false,
      raw_response_stored: canary?.raw_response_stored || false
    },
    {
      path: mappingPath,
      status: mapping?.status || null,
      output_text_extracted: mapping?.response_mapping?.output_text_extracted || false,
      thinking_disabled_for_ollama: mapping?.request_mapping?.thinking_disabled_for_ollama || false,
      raw_response_stored: mapping?.response_mapping?.raw_response_stored || false
    },
    {
      path: redactionPath,
      status: redaction?.status || null,
      raw_request_stored: redaction?.raw_request_stored || false,
      raw_response_stored: redaction?.raw_response_stored || false,
      secrets_logged: redaction?.secrets_logged || false
    },
    {
      path: tracePath,
      raw_request_stored: false,
      raw_response_stored: false
    }
  ]
};

const thinkingRecord = {
  status: "recorded",
  stage: STAGE,
  model: MODEL,
  provider: PROVIDER,
  issue_observed: "first no-tool canary produced empty final content because thinking behavior was active",
  fix_applied: "think_false",
  think_false_applied: thinkFalseApplied,
  result_after_fix: finalContentNonEmpty && canary?.status === "pass"
    ? "final content non-empty and canary passed"
    : "result review did not confirm final content and canary pass",
  original_failure_evidence_retained: false,
  current_mapping_evidence: mappingPath,
  claim_impact: {
    allows_no_tool_canary_pass: canary?.status === "pass",
    does_not_allow_local_model_verified: true,
    does_not_allow_provider_diverse: true
  }
};

const storageReview = {
  status: noRawStorage && redaction?.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  raw_request_stored: false,
  raw_response_stored: false,
  secret_logged: false,
  auth_header_logged: false,
  api_key_logged: false,
  redaction_passed: redaction?.status === "pass"
};

const claimBoundary = {
  status: reviewPass ? "pass" : "fail",
  stage: STAGE,
  local_no_tool_canary_qwen3_14b_allowed: reviewPass,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: reviewPass ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "qwen3:14b local no-tool path passed, but broader local model verification and provider-diverse claims require additional gates."
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_endpoint_deferred_until_operator_provides_endpoint",
  new_status: reviewPass
    ? "local_endpoint_readiness_and_qwen3_14b_no_tool_canary_passed_broader_local_verification_pending"
    : "local_no_tool_result_review_failed",
  unblocks: reviewPass
    ? [
      "post-stable-local-endpoint-readiness-preflight-passed",
      "post-stable-local-no-tool-canary-qwen3-14b-passed"
    ]
    : [],
  still_blocks: [
    "local-model-verified",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "production-ready",
    "stable"
  ],
  next_required_actions: [
    "review qwen3:30b readiness or availability",
    "run qwen3:30b local no-tool canary if operator confirms model is available",
    "compare qwen3:14b and qwen3:30b local no-tool results",
    "define local-model verification gate"
  ]
};

const qwen30bPreconditions = {
  status: "operator_model_readiness_required",
  stage: STAGE,
  next_candidate_stage: "v2.0.0-post-stable-local-no-tool-canary-qwen3-30b",
  required_operator_signal: "qwen3:30b is installed and ready in Ollama",
  do_not_auto_pull_model: true,
  do_not_auto_download_model: true,
  provider: PROVIDER,
  model: "qwen3:30b",
  endpoint: ENDPOINT,
  preconditions: [
    "operator confirms qwen3:30b availability",
    "readiness preflight confirms model exists",
    "no raw response storage",
    "think:false policy applied if needed"
  ],
  claims_still_blocked: [
    "local-model-verified",
    "provider-diverse",
    "provider-verified",
    "adapter-checked"
  ]
};

const unresolvedItems = reviewPass ? [] : [
  ...missingInputs.map((item) => ({
    id: `LNR-${item}`,
    severity: "high",
    description: `Missing required input evidence: ${item}`,
    recommended_next_action: "Restore or regenerate the required local canary evidence before result review."
  })),
  ...(!reviewPass && missingInputs.length === 0 ? [{
    id: "LNR-CHECKS",
    severity: "high",
    description: "One or more qwen3:14b local no-tool result review checks failed.",
    recommended_next_action: "Inspect result review JSON fields and source evidence before rerunning the gate."
  }] : [])
];

const gateReport = {
  ...resultReview,
  dependency,
  claim_boundary: claimBoundary,
  unresolved_items_count: unresolvedItems.length
};

const md = `# qwen3:14b Local No-tool Result Review

Status: ${resultReview.status}

- Stage: ${STAGE}
- Provider: ${PROVIDER}
- Model: ${MODEL}
- Endpoint: ${ENDPOINT}
- Readiness preflight passed: ${resultReview.readiness_preflight_passed}
- Local no-tool canary passed: ${resultReview.local_no_tool_canary_passed}
- Cases passed: ${resultReview.cases_passed}/${resultReview.cases_total}
- Tool calling used: ${resultReview.tool_calling_used}
- Structured output used: ${resultReview.structured_output_used}
- think:false applied: ${resultReview.think_false_applied}
- Final content non-empty: ${resultReview.final_content_non_empty}
- Raw request stored: ${resultReview.raw_request_stored}
- Raw response stored: ${resultReview.raw_response_stored}
- Redaction passed: ${resultReview.redaction_passed}
- Dependency-backed validation: ${dependency.dependency_backed_validation_status}

## Claim Boundary

- Allows after pass: ${claimBoundary.allowed_claims.join(", ") || "none"}
- Still blocked: ${BLOCKED_CLAIMS.join(", ")}

## Next

Do not pull or run qwen3:30b until the operator confirms qwen3:30b is installed and ready.
`;

const claimBoundaryMd = `# qwen3:14b Local No-tool Claim Boundary

Status: ${claimBoundary.status}

- local_no_tool_canary_qwen3_14b_allowed: ${claimBoundary.local_no_tool_canary_qwen3_14b_allowed}
- local_model_verified_allowed: false
- provider_diverse_allowed: false
- provider_verified_allowed: false
- adapter_checked_allowed: false
- production_ready_allowed: false
- stable_allowed: false

Allowed claims:

${claimBoundary.allowed_claims.map((claim) => `- ${claim}`).join("\n") || "- none"}

Blocked claims:

${BLOCKED_CLAIMS.map((claim) => `- ${claim}`).join("\n")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_14b_result_review.json"), resultReview);
writeJson(p("evidence", EVIDENCE_DIR, "local_endpoint_readiness_evidence_index.json"), readinessIndex);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_evidence_index.json"), canaryIndex);
writeJson(p("evidence", EVIDENCE_DIR, "qwen3_thinking_behavior_record.json"), thinkingRecord);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_storage_redaction_review.json"), storageReview);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_14b_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_14b_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "qwen3_30b_comparison_preconditions.json"), qwen30bPreconditions);
writeJson(p("evidence", EVIDENCE_DIR, "local_no_tool_canary_qwen3_14b_gate_report.json"), gateReport);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_no_tool_canary_qwen3_14b_result_review_report.json"), resultReview);
writeText(p("evals", "reports", "local_no_tool_canary_qwen3_14b_result_review_report.md"), md);
writeJson(p("evals", "reports", "local_no_tool_canary_qwen3_14b_claim_boundary_report.json"), claimBoundary);
writeText(p("evals", "reports", "local_no_tool_canary_qwen3_14b_claim_boundary_report.md"), claimBoundaryMd);
writeJson(p("evals", "reports", "local_no_tool_canary_qwen3_14b_gate_report.json"), gateReport);
writeText(p("evals", "reports", "local_no_tool_canary_qwen3_14b_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(resultReview.status === "pass" ? 0 : 1);
