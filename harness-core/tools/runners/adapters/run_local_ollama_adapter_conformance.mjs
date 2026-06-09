#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-dependency-install-and-local-ollama-validation";
const EVIDENCE_DIR = "post-stable-local-ollama-adapter-conformance";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-adapter-conformance-dependency-backed-validation-passed",
  "post-stable-local-ollama-adapter-conformance-reviewed",
  "post-stable-local-ollama-reasoning-control-mapping-reviewed",
  "post-stable-local-provider-capability-matrix-reviewed"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function protectedStatus() {
  const result = spawnSync("git", ["status", "--short", "--", "legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

const dependencyInstall = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-install/dependency_install_report.json");
const dependencyPreflight = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-preflight/adapter_conformance_dependency_preflight_report.json");
const dryRun = readJsonIfExists("evidence/beta-preflight/adapter_dry_run_report.json")
  || readJsonIfExists("evals/reports/adapter_conformance_dry_run.json");
const noTool = readJsonIfExists("evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json");
const redteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const structured = readJsonIfExists("evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json");
const toolMock = readJsonIfExists("evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json");
const adapter = parseYamlFile(p("adapters", "local", "ollama", "adapter.yaml"));
const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
const ollamaMatrix = matrix?.providers?.ollama || {};
const qwen14 = noTool?.model_results?.find((item) => item.model === "qwen3:14b");
const qwen27 = noTool?.model_results?.find((item) => item.model === "qwen3.6:27b");
const protectedPaths = protectedStatus();

const dependencyBackedValidation = dependencyInstall?.status === "pass"
  || dependencyPreflight?.status === "ready_for_dependency_backed_adapter_conformance";
const dryRunPassed = dryRun?.status === "pass";
const dryRunOllamaCases = Array.isArray(dryRun?.case_results)
  ? dryRun.case_results.filter((item) => item.adapter_id === "ollama.local.skeleton")
  : [];
const noToolModelsPass = noTool?.status === "pass"
  && qwen14?.local_no_tool_canary_passed === true
  && qwen27?.local_no_tool_canary_passed === true;
const requestMappingReviewed = adapter?.adapter_id === "ollama.local.skeleton"
  && noToolModelsPass
  && qwen14?.think_false_applied === true
  && qwen27?.think_false_applied === true
  && qwen27?.reasoning_effort_none_applied === true;
const responseMappingReviewed = qwen14?.final_content_non_empty === true
  && qwen27?.final_content_non_empty === true
  && qwen14?.tool_calling_used === false
  && qwen27?.tool_calling_used === false
  && qwen14?.structured_output_used === false
  && qwen27?.structured_output_used === false;
const providerMatrixReviewed = ollamaMatrix?.adapter_path === "adapters/local/ollama/adapter.yaml"
  && ollamaMatrix?.local_no_tool_canary === "canary_checked"
  && ollamaMatrix?.provider_execution === false
  && ollamaMatrix?.local_model_execution === false
  && ollamaMatrix?.verified === false;
const storageRedactionReviewed = noTool?.raw_request_stored === false
  && noTool?.raw_response_stored === false
  && redteam?.raw_request_stored === false
  && redteam?.raw_response_stored === false
  && structured?.raw_request_stored === false
  && structured?.raw_response_stored === false
  && toolMock?.raw_request_stored === false
  && toolMock?.raw_response_stored === false;
const redteamSmokeChecked = redteam?.status === "pass" && redteam?.dummy_secret_leaked === false;

const checks = {
  dependency_backed_validation: dependencyBackedValidation,
  dry_run_passed: dryRunPassed,
  dry_run_ollama_cases_passed: dryRunOllamaCases.length > 0 && dryRunOllamaCases.every((item) => item.status === "pass"),
  request_mapping_reviewed: requestMappingReviewed,
  response_mapping_reviewed: responseMappingReviewed,
  reasoning_control_mapping_reviewed: requestMappingReviewed,
  provider_capability_matrix_reviewed: providerMatrixReviewed,
  storage_redaction_reviewed: storageRedactionReviewed,
  redteam_smoke_checked: redteamSmokeChecked,
  protected_paths_unmodified: !protectedPaths.reference_baseline_source_modified && !protectedPaths.dist_modified && !protectedPaths.evidence_reference_baseline_modified
};
const status = Object.values(checks).every(Boolean) ? "pass" : "fail";

const requestMappingReview = {
  status: checks.request_mapping_reviewed ? "pass" : "fail",
  stage: STAGE,
  provider: "ollama",
  api_shape: "openai_compatible",
  models: {
    "qwen3:14b": {
      think_false_required: true,
      reasoning_effort_none_required: false,
      reasoning_effort_nested_none_required: false
    },
    "qwen3.6:27b": {
      think_false_required: true,
      reasoning_effort_none_required: true,
      reasoning_effort_nested_none_required: true
    }
  },
  raw_request_stored: false
};

const responseMappingReview = {
  status: checks.response_mapping_reviewed ? "pass" : "fail",
  stage: STAGE,
  qwen3_14b_final_content_non_empty: qwen14?.final_content_non_empty === true,
  qwen3_6_27b_final_content_non_empty: qwen27?.final_content_non_empty === true,
  response_mapping_passed_for_no_tool_path: checks.response_mapping_reviewed,
  tool_calling_mapping_reviewed: false,
  structured_output_mapping_reviewed: false,
  does_not_establish_adapter_checked: true
};

const reasoningControlMappingReview = {
  status: checks.reasoning_control_mapping_reviewed ? "pass" : "fail",
  stage: STAGE,
  provider: "ollama",
  models: {
    "qwen3:14b": {
      think_false_observed: qwen14?.think_false_applied === true,
      reasoning_effort_none_observed: qwen14?.reasoning_effort_none_applied === true,
      requirement: "think:false only in existing no-tool evidence"
    },
    "qwen3.6:27b": {
      think_false_observed: qwen27?.think_false_applied === true,
      reasoning_effort_none_observed: qwen27?.reasoning_effort_none_applied === true,
      requirement: "think:false plus reasoning_effort none controls in existing no-tool evidence"
    }
  },
  raw_request_stored: false,
  raw_response_stored: false
};

const providerCapabilityMatrixReview = {
  status: checks.provider_capability_matrix_reviewed ? "pass" : "fail",
  stage: STAGE,
  provider: "ollama",
  models: MODELS,
  no_tool_text_path_checked: ollamaMatrix?.local_no_tool_canary === "canary_checked",
  structured_output_checked: false,
  tool_calling_checked: false,
  redteam_smoke_checked: redteamSmokeChecked,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};

const storageRedactionReview = {
  status: checks.storage_redaction_reviewed ? "pass" : "fail",
  stage: STAGE,
  provider: "ollama",
  raw_request_stored: false,
  raw_response_stored: false,
  no_tool_redaction_checked: noTool?.raw_request_stored === false && noTool?.raw_response_stored === false,
  structured_output_redaction_checked: structured?.raw_request_stored === false && structured?.raw_response_stored === false,
  tool_calling_mock_redaction_checked: toolMock?.raw_request_stored === false && toolMock?.raw_response_stored === false,
  redteam_redaction_checked: redteam?.raw_request_stored === false && redteam?.raw_response_stored === false
};

const claimBoundary = {
  status,
  stage: STAGE,
  adapter_conformance_dependency_backed_validation_passed: checks.dependency_backed_validation && checks.dry_run_passed,
  local_ollama_adapter_conformance_reviewed: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Dependency-backed adapter conformance and Ollama mapping reviews passed, but final local-model verification claim requires owner decision."
};

const report = {
  status,
  stage: STAGE,
  provider: "ollama",
  models: MODELS,
  dependency_backed_validation: checks.dependency_backed_validation && checks.dry_run_passed,
  new_local_model_execution: false,
  uses_existing_evidence: true,
  request_mapping_reviewed: checks.request_mapping_reviewed,
  response_mapping_reviewed: checks.response_mapping_reviewed,
  reasoning_control_mapping_reviewed: checks.reasoning_control_mapping_reviewed,
  provider_capability_matrix_reviewed: checks.provider_capability_matrix_reviewed,
  storage_redaction_reviewed: checks.storage_redaction_reviewed,
  raw_request_stored: false,
  raw_response_stored: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  checks,
  claims_allowed: claimBoundary.allowed_claims,
  claims_blocked: BLOCKED_CLAIMS
};

const unresolvedItems = status === "pass" ? [] : Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([id], index) => ({
    id: `LOAC-${String(index + 1).padStart(3, "0")}`,
    severity: "medium",
    description: `${id} failed`,
    blocks_final_gate: true,
    recommended_next_action: "Inspect local Ollama adapter conformance source evidence."
  }));
const gateReport = {
  status,
  stage: STAGE,
  checks: Object.entries(checks).map(([name, passed]) => ({ name, status: passed ? "pass" : "fail" })),
  unresolved_items_count: unresolvedItems.length,
  can_refresh_owner_decision_packet: status === "pass",
  claims_allowed: claimBoundary.allowed_claims,
  claims_blocked: BLOCKED_CLAIMS
};

writeJson(e("local_ollama_adapter_conformance_report.json"), report);
writeJson(e("local_ollama_adapter_request_mapping_review.json"), requestMappingReview);
writeJson(e("local_ollama_adapter_response_mapping_review.json"), responseMappingReview);
writeJson(e("local_ollama_reasoning_control_mapping_review.json"), reasoningControlMappingReview);
writeJson(e("local_ollama_provider_capability_matrix_review.json"), providerCapabilityMatrixReview);
writeJson(e("local_ollama_adapter_storage_redaction_review.json"), storageRedactionReview);
writeJson(e("local_ollama_adapter_conformance_claim_boundary.json"), claimBoundary);
writeJson(e("local_ollama_adapter_conformance_gate_report.json"), gateReport);
writeJson(e("unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", "local_ollama_adapter_conformance_report.json"), report);
writeText(p("evals", "reports", "local_ollama_adapter_conformance_report.md"), `# Local Ollama Adapter Conformance

Status: ${status}

- Models: ${MODELS.join(", ")}
- Dependency-backed validation: ${report.dependency_backed_validation}
- New local model execution: false
- Request mapping reviewed: ${report.request_mapping_reviewed}
- Response mapping reviewed: ${report.response_mapping_reviewed}
- Reasoning control mapping reviewed: ${report.reasoning_control_mapping_reviewed}
- Provider capability matrix reviewed: ${report.provider_capability_matrix_reviewed}
- Storage redaction reviewed: ${report.storage_redaction_reviewed}
`);
writeJson(p("evals", "reports", "local_ollama_adapter_conformance_gate_report.json"), gateReport);
writeText(p("release", "post_stable_adapter_conformance_local_ollama_scope.yaml"), `stage: ${STAGE}
provider: ollama
models:
  - qwen3:14b
  - qwen3.6:27b
uses_existing_evidence: true
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
`);
writeText(p("release", "post_stable_adapter_conformance_claim_boundary.yaml"), `stage: ${STAGE}
status: ${status}
local_model_verified_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
allowed_claims:
${claimBoundary.allowed_claims.map((claim) => `  - ${claim}`).join("\n")}
blocked_claims:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);
writeText(p("evals", "suites", "post_stable_local_ollama_adapter_conformance.yaml"), `suite: post_stable_local_ollama_adapter_conformance
stage: ${STAGE}
runner: tools/runners/adapters/run_local_ollama_adapter_conformance.mjs
checker: tools/checks/adapters/check_local_ollama_adapter_conformance.mjs
`);
writeText(p("docs", "local_ollama_adapter_conformance.ko.md"), `# Local Ollama adapter conformance

상태: ${status}

- 대상 모델: ${MODELS.join(", ")}
- 새 local model generation: false
- 기존 no-tool/redteam/storage evidence 기반 review
- request mapping 검토: ${report.request_mapping_reviewed}
- response mapping 검토: ${report.response_mapping_reviewed}
- reasoning control mapping 검토: ${report.reasoning_control_mapping_reviewed}
- provider capability matrix 검토: ${report.provider_capability_matrix_reviewed}
- strong local verification wording은 owner final decision 전까지 차단
`);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
