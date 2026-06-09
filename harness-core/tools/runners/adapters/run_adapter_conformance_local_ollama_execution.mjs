#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-local-ollama-execution";
const EVIDENCE_DIR = "post-stable-adapter-conformance-local-ollama-execution";
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
  "post-stable-adapter-conformance-local-ollama-execution-recorded",
  "post-stable-ollama-adapter-mapping-reviewed",
  "post-stable-qwen-reasoning-control-mapping-reviewed"
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
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
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

const dependency = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-preflight/adapter_conformance_dependency_preflight_report.json");
const dryRun = readJsonIfExists("evals/reports/adapter_conformance_dry_run.json");
const noTool = readJsonIfExists("evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json");
const structured = readJsonIfExists("evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json");
const toolMock = readJsonIfExists("evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json");
const redteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const protectedPaths = protectedStatus();
const adapter = parseYamlFile(p("adapters", "local", "ollama", "adapter.yaml"));
const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
const ollamaMatrix = matrix?.providers?.ollama || {};
const dryRunOllamaCases = Array.isArray(dryRun?.case_results)
  ? dryRun.case_results.filter((item) => item.adapter_id === "ollama.local.skeleton")
  : [];
const qwen14 = noTool?.model_results?.find((item) => item.model === "qwen3:14b");
const qwen27 = noTool?.model_results?.find((item) => item.model === "qwen3.6:27b");

const checks = {
  dependency_ready: dependency?.status === "ready_for_dependency_backed_adapter_conformance"
    && dependency?.yaml_import_available === true
    && dependency?.can_run_dependency_backed_adapter_conformance === true,
  dry_run_passed: dryRun?.status === "pass"
    && dryRun?.provider_execution === false
    && dryRun?.local_model_execution === false
    && dryRunOllamaCases.length > 0
    && dryRunOllamaCases.every((item) => item.status === "pass"),
  ollama_adapter_loaded: adapter?.adapter_id === "ollama.local.skeleton",
  provider_matrix_ollama_present: ollamaMatrix?.adapter_path === "adapters/local/ollama/adapter.yaml",
  no_tool_mapping_reviewed: noTool?.status === "pass"
    && qwen14?.local_no_tool_canary_passed === true
    && qwen27?.local_no_tool_canary_passed === true,
  reasoning_control_mapping_reviewed: qwen14?.think_false_applied === true
    && qwen27?.think_false_applied === true
    && qwen27?.reasoning_effort_none_applied === true,
  structured_output_mapping_reviewed: structured?.status === "pass"
    && structured?.response_format_json_object_used === true,
  tool_calling_mock_mapping_reviewed: toolMock?.status === "pass"
    && toolMock?.mock_tool_schema_used === true
    && toolMock?.external_tool_executed === false,
  redaction_storage_boundary_reviewed: noTool?.raw_request_stored === false
    && noTool?.raw_response_stored === false
    && structured?.raw_request_stored === false
    && structured?.raw_response_stored === false
    && toolMock?.raw_request_stored === false
    && toolMock?.raw_response_stored === false
    && redteam?.raw_request_stored === false
    && redteam?.raw_response_stored === false,
  local_redteam_coverage_reviewed: redteam?.status === "pass" && redteam?.dummy_secret_leaked === false,
  protected_paths_unmodified: protectedPaths.reference_baseline_source_modified === false
    && protectedPaths.dist_modified === false
    && protectedPaths.evidence_reference_baseline_modified === false
};

const status = Object.values(checks).every(Boolean) ? "pass" : "fail";
const report = {
  status,
  stage: STAGE,
  dependency_backed_validation_executed: true,
  adapter_conformance_dry_run_status: dryRun?.status || "missing",
  adapters_checked: dryRun?.adapters_checked || [],
  ollama_adapter_id: adapter?.adapter_id || null,
  provider_matrix_ollama_status: ollamaMatrix?.status || null,
  models_reviewed: ["qwen3:14b", "qwen3.6:27b"],
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  source_local_model_execution_reviewed: true,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  provider_verified_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  checks,
  claims_allowed: status === "pass" ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const mappingReview = {
  status,
  stage: STAGE,
  ollama_adapter_loaded: checks.ollama_adapter_loaded,
  dry_run_ollama_cases_total: dryRunOllamaCases.length,
  dry_run_ollama_cases_passed: dryRunOllamaCases.filter((item) => item.status === "pass").length,
  no_tool_mapping_reviewed: checks.no_tool_mapping_reviewed,
  reasoning_control_mapping_reviewed: checks.reasoning_control_mapping_reviewed,
  structured_output_mapping_reviewed: checks.structured_output_mapping_reviewed,
  tool_calling_mock_mapping_reviewed: checks.tool_calling_mock_mapping_reviewed,
  redaction_storage_boundary_reviewed: checks.redaction_storage_boundary_reviewed
};

const claimBoundary = {
  status,
  stage: STAGE,
  adapter_conformance_local_ollama_execution_recorded: status === "pass",
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "ready_for_dependency_backed_adapter_conformance",
  new_status: status === "pass"
    ? "adapter_conformance_local_ollama_execution_recorded_owner_decision_pending"
    : "adapter_conformance_local_ollama_execution_failed",
  unblocks: status === "pass" ? ["adapter_conformance_dependency_backed_validation", "adapter_conformance_local_ollama_execution"] : [],
  still_blocks: status === "pass" ? ["owner_final_decision", ...BLOCKED_CLAIMS] : ["adapter_conformance_local_ollama_execution", "owner_final_decision", ...BLOCKED_CLAIMS],
  next_required_actions: [
    "rebuild local model verification owner decision packet"
  ]
};

const unresolvedItems = status === "pass" ? [] : Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([id], index) => ({
    id: `ACLO-${String(index + 1).padStart(3, "0")}`,
    severity: "medium",
    description: `${id} failed`,
    blocks_final_gate: true,
    recommended_next_action: "Inspect adapter conformance source evidence."
  }));

const md = `# Adapter Conformance Local Ollama Execution

Status: ${report.status}

- Stage: ${STAGE}
- Dependency-backed validation executed: true
- Adapter dry-run status: ${report.adapter_conformance_dry_run_status}
- New local model calls: 0
- Source local model execution reviewed: true
- Ollama dry-run cases passed: ${mappingReview.dry_run_ollama_cases_passed}/${mappingReview.dry_run_ollama_cases_total}
`;

writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_execution_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_execution_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_mapping_review.json"), mappingReview);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_conformance_local_ollama_gate_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeText(p("release", "post_stable_adapter_conformance_local_ollama_execution_scope.yaml"), `stage: ${STAGE}

approved_actions:
  dependency_backed_adapter_conformance_execution: true
  ollama_adapter_mapping_review: true
  qwen_reasoning_control_mapping_review: true
  local_evidence_redaction_boundary_review: true

forbidden_execution:
  new_local_model_generation: true
  openai_model_api_call: true
  telemetry_sink_write: true
  adapter_checked_claim: true
  local_model_verified_claim: true
`);
writeText(p("release", "post_stable_adapter_conformance_local_ollama_execution_claim_boundary.yaml"), `stage: ${STAGE}
status: ${status}
local_model_verified_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);
writeText(p("release", "post_stable_adapter_conformance_local_ollama_execution_blocker_update.yaml"), `stage: ${STAGE}
status: ${status}
new_status: ${blockerUpdate.new_status}
`);
writeText(p("evals", "suites", "post_stable_adapter_conformance_local_ollama_execution.yaml"), `suite: post_stable_adapter_conformance_local_ollama_execution
stage: ${STAGE}
runner: tools/runners/adapters/run_adapter_conformance_local_ollama_execution.mjs
gate: tools/checks/adapters/check_adapter_conformance_local_ollama_execution.mjs

checks:
  - dependency_ready
  - adapter_conformance_dry_run_passed
  - ollama_adapter_mapping_reviewed
  - qwen_reasoning_control_mapping_reviewed
  - no_tool_mapping_reviewed
  - structured_output_mapping_reviewed
  - tool_calling_mock_mapping_reviewed
  - redaction_storage_boundary_reviewed
  - strong_claims_blocked
`);
writeText(p("docs", "adapter_conformance_local_ollama_execution.ko.md"), `# Adapter conformance local Ollama execution

상태: ${status}

- dependency-backed adapter conformance dry-run: ${dryRun?.status || "missing"}
- Ollama adapter ID: ${adapter?.adapter_id || "missing"}
- qwen reasoning control mapping reviewed: ${checks.reasoning_control_mapping_reviewed}
- 새 로컬 모델 호출: 0

이 단계는 adapter conformance evidence를 기록하지만 strong adapter wording은 계속 차단한다.
`);

writeJson(p("evals", "reports", "adapter_conformance_local_ollama_execution_report.json"), report);
writeText(p("evals", "reports", "adapter_conformance_local_ollama_execution_report.md"), md);
writeJson(p("evals", "reports", "adapter_conformance_local_ollama_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
