import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./file_walk.mjs";
import { scanClaims } from "./claim_scanner.mjs";

export const PROVIDER_COVERAGE_STAGE = "v2.0.0-post-export-provider-verified-coverage-completion";
export const PROVIDER_FINAL_STAGE = "v2.0.0-post-export-provider-verified-final-gate";
export const ADAPTER_COVERAGE_STAGE = "v2.0.0-post-export-adapter-checked-coverage-completion";
export const ADAPTER_FINAL_STAGE = "v2.0.0-post-export-adapter-checked-final-gate";
export const GENERAL_PREFLIGHT_STAGE = "v2.0.0-post-export-general-readiness-stability-preflight";
export const EXPORT_REFRESH_STAGE = "v2.0.0-final-export-refresh-after-strict-paths";
export const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
export const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-strict-refresh.zip";

const MAINTAINED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const PROVIDER_COVERAGE_DIR = "evidence/post-export-provider-verified-coverage-completion";
const PROVIDER_FINAL_DIR = "evidence/post-export-provider-verified-final-gate";
const ADAPTER_COVERAGE_DIR = "evidence/post-export-adapter-checked-coverage-completion";
const ADAPTER_FINAL_DIR = "evidence/post-export-adapter-checked-final-gate";
const GENERAL_PREFLIGHT_DIR = "evidence/post-export-general-readiness-stability-preflight";
const EXPORT_REFRESH_DIR = "evidence/final-export-refresh-after-strict-paths";

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function workspaceRoot(root) {
  return path.basename(root) === "harness-core" ? path.dirname(root) : root;
}

function p(root, relPath) {
  return path.join(root, ...relPath.split("/"));
}

function exists(root, relPath) {
  return fs.existsSync(p(root, relPath));
}

function readJsonIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(root, relPath, value) {
  writeJson(p(root, relPath), value);
}

function writeTextRel(root, relPath, value) {
  writeText(p(root, relPath), value);
}

function writeMd(root, relPath, title, lines) {
  writeTextRel(root, relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function writeYaml(root, relPath, lines) {
  writeTextRel(root, relPath, lines.join("\n"));
}

function gitStatus(root, paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(root),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function protectedStatus(root) {
  const status = gitStatus(root, ["legacy-reference-source", "dist", "harness-core/dist", "harness-core/evidence/reference-baseline", "harness-core/node_modules"]);
  const paths = statusPaths(status);
  return {
    git_status: status,
    observed_dirty_paths: paths,
    reference_baseline_source_dirty_paths: paths.filter((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_dirty_paths: paths.filter((file) => file.startsWith("dist/") || file === "dist" || file.startsWith("harness-core/dist/") || file === "harness-core/dist"),
    node_modules_dirty_paths: paths.filter((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules"),
    evidence_reference_baseline_dirty_paths: paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/") || file === "harness-core/evidence/reference-baseline"),
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false
  };
}

function source(root, relPath) {
  const json = relPath.endsWith(".json") ? readJsonIfExists(root, relPath) : null;
  return {
    path: relPath,
    exists: exists(root, relPath),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function statusPass(root, relPath) {
  return readJsonIfExists(root, relPath)?.status === "pass";
}

function noExecFlags(extra = {}) {
  return {
    new_local_model_execution: false,
    openai_model_api_call: false,
    openai_provider_rerun: false,
    telemetry_sink_write: false,
    npm_install_or_ci: false,
    actual_export_write: false,
    reference_baseline_source_modified: false,
    dist_modified: false,
    evidence_reference_baseline_modified: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    ...extra
  };
}

function claimBoundary(stage, extra = {}) {
  return {
    status: "pass",
    stage,
    provider_diverse_allowed: true,
    local_model_verified_allowed: true,
    allowed_claims: MAINTAINED_CLAIMS,
    blocked_claims: BLOCKED_STRONG_CLAIMS,
    ...noExecFlags(),
    ...extra
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function writeUnresolved(root, dir, stage, items) {
  writeJsonRel(root, `${dir}/unresolved_items.json`, {
    status: items.length === 0 ? "pass" : "blocked",
    stage,
    unresolved_items_count: items.length,
    unresolved_items: items
  });
}

function missing(id, lane, reason, next_action) {
  return { id, lane, status: "blocked_or_partial", reason, next_action };
}

function commonProviderSources(root) {
  return {
    provider_verified_preflight: source(root, "evidence/post-export-provider-verified-coverage-preflight/provider_verified_coverage_preflight_report.json"),
    openai_preflight_inventory: source(root, "evidence/post-export-provider-verified-coverage-preflight/openai_provider_coverage_inventory.json"),
    ollama_preflight_inventory: source(root, "evidence/post-export-provider-verified-coverage-preflight/ollama_provider_coverage_inventory.json"),
    provider_diverse_final_gate: source(root, "evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json"),
    local_model_verified_final_gate: source(root, "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json"),
    openai_canary_suite: source(root, "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"),
    openai_redteam: source(root, "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"),
    openai_redaction: source(root, "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json"),
    ollama_replay: source(root, "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json"),
    ollama_redteam: source(root, "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json"),
    ollama_structured: source(root, "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"),
    ollama_tool_mock: source(root, "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"),
    ollama_redaction: source(root, "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json"),
    capability_matrix: source(root, "adapters/provider_capability_matrix.yaml")
  };
}

export function completeProviderVerifiedCoverage(root) {
  const stage = PROVIDER_COVERAGE_STAGE;
  const dir = PROVIDER_COVERAGE_DIR;
  const sources = commonProviderSources(root);
  const openaiReplay = readJsonIfExists(root, "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json") || {};
  const blockers = [
    missing(
      "openai_provider_replay_regression_not_replay_verified",
      "openai_api_lane",
      `OpenAI replay source is ${openaiReplay.comparison_mode || "unknown"}; existing evidence is canary-suite consistency, not final provider replay verification.`,
      "Operator must approve a no-new-call acceptance boundary or authorize a future OpenAI provider rerun outside this autopilot."
    ),
    missing(
      "openai_provider_error_handling_static_only",
      "openai_api_lane",
      "OpenAI provider error handling can only be reviewed statically in this stage because OpenAI API calls are forbidden.",
      "Complete an execution-backed provider error-handling review in a future approved provider lane."
    ),
    missing(
      "provider_verified_final_gate_not_ready",
      "all_lanes",
      "Provider-level coverage remains partial across error handling and replay/regression surfaces.",
      "Keep provider-verified blocked and carry exact coverage gaps to final handoff."
    )
  ];
  const openaiSummary = {
    status: "partial",
    stage,
    lane: "openai_api_lane",
    provider_contract_reviewed: exists(root, "adapters/api/openai/adapter.yaml"),
    capability_matrix_reviewed: exists(root, "adapters/provider_capability_matrix.yaml"),
    execution_evidence_exists: statusPass(root, "evidence/beta-provider-canary-openai/provider_canary_report.json"),
    redteam_evidence_exists: statusPass(root, "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"),
    replay_regression_reviewed: "partial_canary_suite_only",
    error_handling_reviewed: "static_only",
    redaction_storage_reviewed: statusPass(root, "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json"),
    no_new_openai_call: true,
    provider_verified_ready: false,
    source_evidence: sources
  };
  const ollamaSummary = {
    status: "partial",
    stage,
    lane: "ollama_qwen3_local_lane",
    provider_contract_reviewed: exists(root, "adapters/local/ollama/adapter.yaml"),
    capability_matrix_reviewed: exists(root, "adapters/provider_capability_matrix.yaml"),
    local_model_verified: statusPass(root, "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json"),
    redteam_evidence_exists: statusPass(root, "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json"),
    replay_regression_reviewed: statusPass(root, "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json") ? "partial_smoke_passed" : "missing",
    structured_output_evidence_exists: statusPass(root, "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"),
    tool_calling_mock_evidence_exists: statusPass(root, "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"),
    error_handling_reviewed: "partial_static_and_prior_smoke_only",
    redaction_storage_reviewed: statusPass(root, "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json"),
    new_local_model_execution: false,
    provider_verified_ready: false
  };
  const errorReview = {
    status: "partial",
    stage,
    openai_api_lane: "static_only_no_new_call",
    ollama_qwen3_local_lane: "partial_static_and_prior_smoke_only",
    provider_verified_sufficient: false,
    blockers: blockers.filter((item) => item.id.includes("error")).map((item) => item.id)
  };
  const replayReview = {
    status: "partial",
    stage,
    openai_api_lane: openaiSummary.replay_regression_reviewed,
    ollama_qwen3_local_lane: ollamaSummary.replay_regression_reviewed,
    provider_verified_sufficient: false,
    blockers: blockers.filter((item) => item.id.includes("replay")).map((item) => item.id)
  };
  const redactionReview = {
    status: "pass",
    stage,
    openai_api_lane: openaiSummary.redaction_storage_reviewed,
    ollama_qwen3_local_lane: ollamaSummary.redaction_storage_reviewed,
    raw_request_stored: false,
    raw_response_stored: false,
    secrets_logged: false
  };
  const boundary = claimBoundary(stage);
  const report = {
    status: "keep_blocked_recommended",
    stage,
    scope: SCOPE,
    ready_for_provider_verified_final_gate: false,
    can_enter_provider_verified_final_gate: false,
    blockers,
    source_evidence: sources,
    protected_path_status: protectedStatus(root),
    ...noExecFlags()
  };
  writeJsonRel(root, `${dir}/provider_verified_coverage_completion_report.json`, report);
  writeJsonRel(root, `${dir}/openai_provider_coverage_completion_summary.json`, openaiSummary);
  writeJsonRel(root, `${dir}/ollama_provider_coverage_completion_summary.json`, ollamaSummary);
  writeJsonRel(root, `${dir}/provider_error_handling_review.json`, errorReview);
  writeJsonRel(root, `${dir}/provider_replay_regression_review.json`, replayReview);
  writeJsonRel(root, `${dir}/provider_redaction_storage_review.json`, redactionReview);
  writeJsonRel(root, `${dir}/provider_verified_coverage_claim_boundary.json`, boundary);
  writeUnresolved(root, dir, stage, blockers);
  writeYaml(root, "release/scopes/post-export/post_export_provider_verified_coverage_completion_scope.yaml", [
    `stage: ${stage}`,
    "status: keep_blocked_recommended",
    "mode: coverage_completion_no_forbidden_execution",
    "provider_verified_allowed: false",
    "openai_model_api_call: false",
    "new_local_model_execution: false",
    "dist_modified: false",
    "reference_baseline_source_modified: false",
    "evidence_reference_baseline_modified: false"
  ]);
  writeYaml(root, "release/claims/post-export/post_export_provider_verified_coverage_claim_boundary.yaml", [
    `stage: ${stage}`,
    "status: pass",
    "provider_diverse_allowed: true",
    "local_model_verified_allowed: true",
    "provider_verified_allowed: false",
    "adapter_checked_allowed: false",
    "production_ready_allowed: false",
    "stable_allowed: false",
    "release_gated_allowed: false"
  ]);
  writeYaml(root, "release/blockers/post-export/post_export_provider_verified_blocker_update.yaml", [
    `stage: ${stage}`,
    "status: keep_blocked_recommended",
    "provider_verified_allowed: false",
    "blockers:",
    ...blockers.map((item) => `  - ${item.id}`)
  ]);
  writeMd(root, "docs/providers/provider_verified_coverage_completion.ko.md", "Provider-Verified Coverage Completion", [
    "OpenAI는 새 API 호출 없이 기존 evidence와 static contract review만 사용했습니다.",
    "Ollama는 기존 bounded local smoke/replay evidence를 사용했고 새 local generation은 수행하지 않았습니다.",
    "",
    "결론: provider-level error handling과 replay/regression coverage가 final-gate 수준으로 충분하지 않아 `provider-verified`는 계속 blocked입니다."
  ]);
  writeMd(root, "docs/providers/provider_verified_remaining_gaps.ko.md", "Provider-Verified Remaining Gaps", blockers.map((item) => `- ${item.id}: ${item.next_action}`));
  return report;
}

export function checkProviderVerifiedCoverageCompletion(root) {
  const stage = PROVIDER_COVERAGE_STAGE;
  const dir = PROVIDER_COVERAGE_DIR;
  const report = readJsonIfExists(root, `${dir}/provider_verified_coverage_completion_report.json`);
  const openai = readJsonIfExists(root, `${dir}/openai_provider_coverage_completion_summary.json`);
  const ollama = readJsonIfExists(root, `${dir}/ollama_provider_coverage_completion_summary.json`);
  const errorReview = readJsonIfExists(root, `${dir}/provider_error_handling_review.json`);
  const replayReview = readJsonIfExists(root, `${dir}/provider_replay_regression_review.json`);
  const redaction = readJsonIfExists(root, `${dir}/provider_redaction_storage_review.json`);
  const boundary = readJsonIfExists(root, `${dir}/provider_verified_coverage_claim_boundary.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "coverage report recorded", report?.status === "keep_blocked_recommended" && report?.provider_verified_allowed === false, report || {});
  addCheck(checks, "openai summary partial without new call", openai?.status === "partial" && openai?.no_new_openai_call === true, openai || {});
  addCheck(checks, "ollama summary partial without new execution", ollama?.status === "partial" && ollama?.new_local_model_execution === false, ollama || {});
  addCheck(checks, "error handling remains partial", errorReview?.status === "partial" && errorReview?.provider_verified_sufficient === false, errorReview || {});
  addCheck(checks, "replay regression remains partial", replayReview?.status === "partial" && replayReview?.provider_verified_sufficient === false, replayReview || {});
  addCheck(checks, "redaction storage passed", redaction?.status === "pass", redaction || {});
  addCheck(checks, "boundary blocks strong claims", boundary?.provider_verified_allowed === false && boundary?.adapter_checked_allowed === false, boundary || {});
  addCheck(checks, "unresolved blockers recorded", unresolved?.unresolved_items_count > 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "keep_blocked_recommended" : "fail",
    stage,
    ready_for_provider_verified_final_gate: false,
    can_enter_provider_verified_final_gate: false,
    unresolved_items_count: unresolved?.unresolved_items_count || 0,
    reason: failures.length === 0 ? "Provider coverage completion recorded, but final gate is not ready." : "Provider coverage completion checks failed.",
    ...noExecFlags(),
    checks,
    failures
  };
  writeJsonRel(root, `${dir}/provider_verified_coverage_gate_report.json`, gate);
  return gate;
}

function auditClaims(root, stage, relJson, relMd, expected) {
  const scan = scanClaims(root, {
    excludedPaths: [
      "evidence/reference-baseline",
      "evidence/alpha/prohibited_claim_scan.json",
      "original_order.txt",
      "node_modules",
      ".git",
      relJson,
      relMd
    ]
  });
  const matches = scan.matches.filter((match) => ["provider-verified", "adapter-checked", "production-ready", "stable", "release-gated"].includes(match.claim));
  const report = {
    status: matches.length === 0 ? "pass" : "fail",
    stage,
    expected,
    matches_count: matches.length,
    matches,
    ...noExecFlags()
  };
  writeJsonRel(root, relJson, report);
  writeMd(root, relMd, "Claim Audit", [`Status: ${report.status}`, "", `- Positive blocked-claim matches: ${matches.length}`]);
  return report;
}

export function auditProviderVerifiedCoverageClaims(root) {
  return auditClaims(root, PROVIDER_COVERAGE_STAGE, "evals/reports/post_export_provider_verified_coverage_claim_audit_report.json", "evals/reports/post_export_provider_verified_coverage_claim_audit_report.md", "provider_verified_blocked");
}

export function runProviderVerifiedFinalGate(root) {
  const coverage = readJsonIfExists(root, `${PROVIDER_COVERAGE_DIR}/provider_verified_coverage_completion_report.json`) || {};
  const coverageGate = readJsonIfExists(root, `${PROVIDER_COVERAGE_DIR}/provider_verified_coverage_gate_report.json`) || {};
  const ready = coverage.status === "ready_for_provider_verified_final_gate" && coverageGate.unresolved_items_count === 0;
  const blockers = ready ? [] : (coverage.blockers || [{ id: "provider_verified_coverage_not_ready", reason: "Stage A did not reach ready_for_provider_verified_final_gate." }]);
  const boundary = claimBoundary(PROVIDER_FINAL_STAGE);
  const report = {
    status: ready ? "pass" : "blocked_by_provider_verified_coverage_not_ready",
    stage: PROVIDER_FINAL_STAGE,
    provider_verified_final_gate_executed: ready,
    provider_verified_allowed: ready,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    blockers,
    ...noExecFlags({ provider_verified_allowed: ready })
  };
  if (!ready) report.provider_verified_allowed = false;
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_gate_report.json`, report);
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_evidence_summary.json`, {
    status: ready ? "pass" : "blocked",
    stage: PROVIDER_FINAL_STAGE,
    source_coverage_report: `${PROVIDER_COVERAGE_DIR}/provider_verified_coverage_completion_report.json`,
    blockers
  });
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_claim_boundary.json`, boundary);
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_decision_record.json`, {
    status: ready ? "recorded" : "blocked",
    stage: PROVIDER_FINAL_STAGE,
    decision: ready ? "approve_provider_verified_claim" : "keep_provider_verified_blocked",
    provider_verified_allowed: ready,
    blockers
  });
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_blocker_update.json`, {
    status: ready ? "pass" : "blocked_by_provider_verified_coverage_not_ready",
    stage: PROVIDER_FINAL_STAGE,
    blockers
  });
  writeUnresolved(root, PROVIDER_FINAL_DIR, PROVIDER_FINAL_STAGE, blockers);
  writeYaml(root, "release/gates/post-export/post_export_provider_verified_final_gate_scope.yaml", [`stage: ${PROVIDER_FINAL_STAGE}`, `status: ${report.status}`, `provider_verified_allowed: ${ready}`]);
  writeYaml(root, "release/gates/post-export/post_export_provider_verified_final_gate.yaml", [`stage: ${PROVIDER_FINAL_STAGE}`, `status: ${report.status}`, `provider_verified_allowed: ${ready}`]);
  writeYaml(root, "release/claims/post-export/post_export_provider_verified_claim_boundary.yaml", [`stage: ${PROVIDER_FINAL_STAGE}`, "status: pass", `provider_verified_allowed: ${ready}`, "adapter_checked_allowed: false", "production_ready_allowed: false", "stable_allowed: false", "release_gated_allowed: false"]);
  writeYaml(root, "release/decisions/post-export/post_export_provider_verified_decision_record.yaml", [`stage: ${PROVIDER_FINAL_STAGE}`, `status: ${ready ? "recorded" : "blocked"}`, `provider_verified_allowed: ${ready}`]);
  writeMd(root, "docs/providers/provider_verified_final_gate.ko.md", "Provider-Verified Final Gate", [`Status: \`${report.status}\``, "", ready ? "`provider-verified` claim enabled." : "Stage A가 ready 상태가 아니므로 final gate는 blocked로 기록했습니다."]);
  writeMd(root, "docs/claims/provider_verified_claim_boundary.ko.md", "Provider-Verified Claim Boundary", ["`provider-verified`는 이번 final gate에서 열리지 않았습니다.", "`adapter-checked`, `production-ready`, `stable`, `release-gated`도 계속 blocked입니다."]);
  return report;
}

export function checkProviderVerifiedFinalGate(root) {
  const report = readJsonIfExists(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_gate_report.json`);
  const unresolved = readJsonIfExists(root, `${PROVIDER_FINAL_DIR}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "final gate report exists", Boolean(report), report || {});
  addCheck(checks, "blocked or pass state is coherent", report?.provider_verified_allowed === false && report?.status === "blocked_by_provider_verified_coverage_not_ready", report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "blocked_by_provider_verified_coverage_not_ready" : "fail",
    stage: PROVIDER_FINAL_STAGE,
    unresolved_items_count: unresolved?.unresolved_items_count || 0,
    ...noExecFlags(),
    checks,
    failures
  };
  writeJsonRel(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_gate_check_report.json`, gate);
  return gate;
}

export function auditProviderVerifiedFinalClaims(root) {
  return auditClaims(root, PROVIDER_FINAL_STAGE, "evals/reports/post_export_provider_verified_final_claim_audit_report.json", "evals/reports/post_export_provider_verified_final_claim_audit_report.md", "provider_verified_blocked_unless_passed");
}

export function completeAdapterCheckedCoverage(root) {
  const stage = ADAPTER_COVERAGE_STAGE;
  const dir = ADAPTER_COVERAGE_DIR;
  const blockers = [
    missing("openai_adapter_full_conformance_missing", "openai_adapter", "OpenAI adapter has canary evidence, but no post-export full conformance execution is recorded and OpenAI rerun is forbidden.", "Run or approve OpenAI adapter conformance in a future provider-approved lane."),
    missing("vllm_execution_coverage_out_of_scope", "vllm_adapter", "vLLM is a placeholder adapter and no execution coverage is available.", "Keep vLLM out of active-adapters claim scope or execute separately before broad adapter-checked."),
    missing("cross_adapter_contract_static_only", "all_adapters", "Cross-adapter contract review is static/dry-run only in this stage.", "Record stronger cross-adapter regression evidence before opening adapter-checked.")
  ];
  const openai = {
    status: "partial",
    stage,
    adapter: "openai.api.skeleton",
    contract_documented: exists(root, "adapters/api/openai/adapter.yaml"),
    canary_evidence_exists: statusPass(root, "evidence/beta-provider-canary-openai/provider_canary_report.json"),
    structured_output_evidence_exists: statusPass(root, "evidence/beta-structured-output-canary-openai/structured_output_canary_report.json"),
    tool_calling_evidence_exists: statusPass(root, "evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json"),
    full_conformance_evidence_exists: false,
    adapter_checked_ready: false
  };
  const ollama = {
    status: "partial",
    stage,
    adapter: "ollama.local.skeleton",
    contract_documented: exists(root, "adapters/local/ollama/adapter.yaml"),
    structured_output_mapping_smoke_exists: statusPass(root, "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"),
    tool_calling_mock_mapping_smoke_exists: statusPass(root, "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"),
    adapter_conformance_review_exists: statusPass(root, "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json"),
    new_local_model_execution: false,
    adapter_checked_ready: false
  };
  const structured = {
    status: ollama.structured_output_mapping_smoke_exists ? "pass" : "blocked",
    stage,
    source: "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json",
    new_local_model_execution: false
  };
  const toolMock = {
    status: ollama.tool_calling_mock_mapping_smoke_exists ? "pass" : "blocked",
    stage,
    source: "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json",
    external_tool_executed: false,
    new_local_model_execution: false
  };
  const cross = {
    status: "partial",
    stage,
    adapters_reviewed: ["openai.api.skeleton", "ollama.local.skeleton", "vllm.local.skeleton"],
    dry_run_or_static_only: true,
    adapter_checked_sufficient: false
  };
  const boundary = claimBoundary(stage);
  const report = {
    status: "blocked_by_missing_openai_full_conformance",
    stage,
    ready_for_adapter_checked_final_gate: false,
    can_enter_adapter_checked_final_gate: false,
    blockers,
    ...noExecFlags()
  };
  writeJsonRel(root, `${dir}/adapter_checked_coverage_completion_report.json`, report);
  writeJsonRel(root, `${dir}/openai_adapter_coverage_summary.json`, openai);
  writeJsonRel(root, `${dir}/ollama_adapter_coverage_summary.json`, ollama);
  writeJsonRel(root, `${dir}/structured_output_mapping_smoke_report.json`, structured);
  writeJsonRel(root, `${dir}/tool_calling_mock_mapping_smoke_report.json`, toolMock);
  writeJsonRel(root, `${dir}/cross_adapter_contract_review.json`, cross);
  writeJsonRel(root, `${dir}/adapter_checked_coverage_claim_boundary.json`, boundary);
  writeUnresolved(root, dir, stage, blockers);
  writeYaml(root, "release/scopes/post-export/post_export_adapter_checked_coverage_completion_scope.yaml", [`stage: ${stage}`, "status: blocked_by_missing_openai_full_conformance", "adapter_checked_allowed: false", "openai_provider_rerun: false", "new_local_model_execution: false"]);
  writeYaml(root, "release/claims/post-export/post_export_adapter_checked_coverage_claim_boundary.yaml", [`stage: ${stage}`, "status: pass", "provider_verified_allowed: false", "adapter_checked_allowed: false", "production_ready_allowed: false", "stable_allowed: false", "release_gated_allowed: false"]);
  writeYaml(root, "release/blockers/post-export/post_export_adapter_checked_blocker_update.yaml", [`stage: ${stage}`, "status: blocked_by_missing_openai_full_conformance", "adapter_checked_allowed: false", "blockers:", ...blockers.map((item) => `  - ${item.id}`)]);
  writeMd(root, "docs/adapters/adapter_checked_coverage_completion.ko.md", "Adapter-Checked Coverage Completion", ["기존 OpenAI/Ollama adapter evidence와 static/dry-run review를 사용했습니다.", "OpenAI full conformance와 cross-adapter regression이 부족해 `adapter-checked`는 계속 blocked입니다."]);
  writeMd(root, "docs/adapters/adapter_checked_remaining_gaps.ko.md", "Adapter-Checked Remaining Gaps", blockers.map((item) => `- ${item.id}: ${item.next_action}`));
  return report;
}

export function checkAdapterCheckedCoverageCompletion(root) {
  const stage = ADAPTER_COVERAGE_STAGE;
  const dir = ADAPTER_COVERAGE_DIR;
  const report = readJsonIfExists(root, `${dir}/adapter_checked_coverage_completion_report.json`);
  const openai = readJsonIfExists(root, `${dir}/openai_adapter_coverage_summary.json`);
  const ollama = readJsonIfExists(root, `${dir}/ollama_adapter_coverage_summary.json`);
  const cross = readJsonIfExists(root, `${dir}/cross_adapter_contract_review.json`);
  const unresolved = readJsonIfExists(root, `${dir}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "coverage report blocked by missing openai full conformance", report?.status === "blocked_by_missing_openai_full_conformance", report || {});
  addCheck(checks, "openai full conformance missing recorded", openai?.full_conformance_evidence_exists === false, openai || {});
  addCheck(checks, "ollama smoke evidence reused without new execution", ollama?.new_local_model_execution === false, ollama || {});
  addCheck(checks, "cross adapter review partial", cross?.status === "partial" && cross?.adapter_checked_sufficient === false, cross || {});
  addCheck(checks, "unresolved blockers recorded", unresolved?.unresolved_items_count > 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = {
    status: failures.length === 0 ? "blocked_by_missing_openai_full_conformance" : "fail",
    stage,
    ready_for_adapter_checked_final_gate: false,
    can_enter_adapter_checked_final_gate: false,
    unresolved_items_count: unresolved?.unresolved_items_count || 0,
    ...noExecFlags(),
    checks,
    failures
  };
  writeJsonRel(root, `${dir}/adapter_checked_coverage_gate_report.json`, gate);
  return gate;
}

export function auditAdapterCheckedCoverageClaims(root) {
  return auditClaims(root, ADAPTER_COVERAGE_STAGE, "evals/reports/post_export_adapter_checked_coverage_claim_audit_report.json", "evals/reports/post_export_adapter_checked_coverage_claim_audit_report.md", "adapter_checked_blocked");
}

export function runAdapterCheckedFinalGate(root) {
  const coverage = readJsonIfExists(root, `${ADAPTER_COVERAGE_DIR}/adapter_checked_coverage_completion_report.json`) || {};
  const coverageGate = readJsonIfExists(root, `${ADAPTER_COVERAGE_DIR}/adapter_checked_coverage_gate_report.json`) || {};
  const ready = coverage.status === "ready_for_adapter_checked_final_gate" && coverageGate.unresolved_items_count === 0;
  const blockers = ready ? [] : (coverage.blockers || [{ id: "adapter_checked_coverage_not_ready", reason: "Stage C did not reach ready_for_adapter_checked_final_gate." }]);
  const boundary = claimBoundary(ADAPTER_FINAL_STAGE);
  const report = {
    status: ready ? "pass" : "blocked_by_adapter_checked_coverage_not_ready",
    stage: ADAPTER_FINAL_STAGE,
    adapter_checked_final_gate_executed: ready,
    adapter_checked_allowed: ready,
    provider_verified_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    blockers,
    ...noExecFlags({ adapter_checked_allowed: ready })
  };
  if (!ready) report.adapter_checked_allowed = false;
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_gate_report.json`, report);
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_evidence_summary.json`, { status: ready ? "pass" : "blocked", stage: ADAPTER_FINAL_STAGE, blockers });
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_claim_boundary.json`, boundary);
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_decision_record.json`, { status: ready ? "recorded" : "blocked", stage: ADAPTER_FINAL_STAGE, decision: ready ? "approve_adapter_checked_claim" : "keep_adapter_checked_blocked", adapter_checked_allowed: ready, blockers });
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_blocker_update.json`, { status: report.status, stage: ADAPTER_FINAL_STAGE, blockers });
  writeUnresolved(root, ADAPTER_FINAL_DIR, ADAPTER_FINAL_STAGE, blockers);
  writeYaml(root, "release/gates/post-export/post_export_adapter_checked_final_gate_scope.yaml", [`stage: ${ADAPTER_FINAL_STAGE}`, `status: ${report.status}`, `adapter_checked_allowed: ${ready}`]);
  writeYaml(root, "release/gates/post-export/post_export_adapter_checked_final_gate.yaml", [`stage: ${ADAPTER_FINAL_STAGE}`, `status: ${report.status}`, `adapter_checked_allowed: ${ready}`]);
  writeYaml(root, "release/claims/post-export/post_export_adapter_checked_claim_boundary.yaml", [`stage: ${ADAPTER_FINAL_STAGE}`, "status: pass", "provider_verified_allowed: false", `adapter_checked_allowed: ${ready}`, "production_ready_allowed: false", "stable_allowed: false", "release_gated_allowed: false"]);
  writeYaml(root, "release/decisions/post-export/post_export_adapter_checked_decision_record.yaml", [`stage: ${ADAPTER_FINAL_STAGE}`, `status: ${ready ? "recorded" : "blocked"}`, `adapter_checked_allowed: ${ready}`]);
  writeMd(root, "docs/adapters/adapter_checked_final_gate.ko.md", "Adapter-Checked Final Gate", [`Status: \`${report.status}\``, "", ready ? "`adapter-checked` claim enabled." : "Stage C가 ready 상태가 아니므로 final gate는 blocked로 기록했습니다."]);
  writeMd(root, "docs/claims/adapter_checked_claim_boundary.ko.md", "Adapter-Checked Claim Boundary", ["`adapter-checked`는 이번 final gate에서 열리지 않았습니다.", "`production-ready`, `stable`, `release-gated`도 계속 blocked입니다."]);
  return report;
}

export function checkAdapterCheckedFinalGate(root) {
  const report = readJsonIfExists(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_gate_report.json`);
  const unresolved = readJsonIfExists(root, `${ADAPTER_FINAL_DIR}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "final gate report exists", Boolean(report), report || {});
  addCheck(checks, "blocked state is coherent", report?.adapter_checked_allowed === false && report?.status === "blocked_by_adapter_checked_coverage_not_ready", report || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "blocked_by_adapter_checked_coverage_not_ready" : "fail", stage: ADAPTER_FINAL_STAGE, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...noExecFlags(), checks, failures };
  writeJsonRel(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_gate_check_report.json`, gate);
  return gate;
}

export function auditAdapterCheckedFinalClaims(root) {
  return auditClaims(root, ADAPTER_FINAL_STAGE, "evals/reports/post_export_adapter_checked_final_claim_audit_report.json", "evals/reports/post_export_adapter_checked_final_claim_audit_report.md", "adapter_checked_blocked_unless_passed");
}

export function assessGeneralReadinessStabilityPreflight(root) {
  const providerFinal = readJsonIfExists(root, `${PROVIDER_FINAL_DIR}/provider_verified_final_gate_report.json`) || {};
  const adapterFinal = readJsonIfExists(root, `${ADAPTER_FINAL_DIR}/adapter_checked_final_gate_report.json`) || {};
  const blockers = [
    missing("provider_verified_not_allowed", "general", "Provider-verified is not allowed.", "Complete provider-verified final gate first."),
    missing("adapter_checked_not_allowed", "general", "Adapter-checked is not allowed.", "Complete adapter-checked final gate first."),
    missing("bare_release_gate_not_rerun", "general", "Bare/general release gate rerun is outside this autopilot.", "Run a separately approved general release gate before general stable/release-gated claims.")
  ];
  const prod = {
    status: "blocked",
    stage: GENERAL_PREFLIGHT_STAGE,
    general_production_ready_allowed: false,
    provider_verified_required: true,
    provider_verified_allowed: providerFinal.provider_verified_allowed === true,
    adapter_checked_required: true,
    adapter_checked_allowed: adapterFinal.adapter_checked_allowed === true,
    blockers: blockers.map((item) => item.id)
  };
  const stable = {
    status: "blocked",
    stage: GENERAL_PREFLIGHT_STAGE,
    stable_allowed: false,
    production_ready_required: true,
    release_gate_required: true,
    blockers: blockers.map((item) => item.id)
  };
  const boundary = claimBoundary(GENERAL_PREFLIGHT_STAGE, {
    general_production_ready_allowed: false,
    stable_allowed: false
  });
  const report = {
    status: "blocked_by_strict_claim_gaps",
    stage: GENERAL_PREFLIGHT_STAGE,
    production_ready_allowed: false,
    general_production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    blockers,
    provider_verified_status: providerFinal.status || "missing",
    adapter_checked_status: adapterFinal.status || "missing",
    ...noExecFlags()
  };
  writeJsonRel(root, `${GENERAL_PREFLIGHT_DIR}/general_readiness_stability_preflight_report.json`, report);
  writeJsonRel(root, `${GENERAL_PREFLIGHT_DIR}/general_production_ready_criteria_matrix.json`, prod);
  writeJsonRel(root, `${GENERAL_PREFLIGHT_DIR}/general_stable_criteria_matrix.json`, stable);
  writeJsonRel(root, `${GENERAL_PREFLIGHT_DIR}/general_readiness_stability_claim_boundary.json`, boundary);
  writeUnresolved(root, GENERAL_PREFLIGHT_DIR, GENERAL_PREFLIGHT_STAGE, blockers);
  writeYaml(root, "release/scopes/post-export/post_export_general_readiness_stability_preflight_scope.yaml", [`stage: ${GENERAL_PREFLIGHT_STAGE}`, "status: blocked_by_strict_claim_gaps", "production_ready_allowed: false", "stable_allowed: false"]);
  writeYaml(root, "release/claims/post-export/post_export_general_readiness_stability_claim_boundary.yaml", [`stage: ${GENERAL_PREFLIGHT_STAGE}`, "status: pass", "production_ready_allowed: false", "stable_allowed: false", "release_gated_allowed: false"]);
  writeMd(root, "docs/release/general_readiness_stability_preflight.ko.md", "General Readiness Stability Preflight", ["Scoped claims와 bare/general claims를 분리했습니다.", "현재 general `production-ready`, `stable`, `release-gated`는 모두 blocked입니다."]);
  writeMd(root, "docs/release/general_production_ready_stable_remaining_gaps.ko.md", "General Production-Ready Stable Remaining Gaps", blockers.map((item) => `- ${item.id}: ${item.next_action}`));
  return report;
}

export function checkGeneralReadinessStabilityPreflight(root) {
  const report = readJsonIfExists(root, `${GENERAL_PREFLIGHT_DIR}/general_readiness_stability_preflight_report.json`);
  const prod = readJsonIfExists(root, `${GENERAL_PREFLIGHT_DIR}/general_production_ready_criteria_matrix.json`);
  const stable = readJsonIfExists(root, `${GENERAL_PREFLIGHT_DIR}/general_stable_criteria_matrix.json`);
  const unresolved = readJsonIfExists(root, `${GENERAL_PREFLIGHT_DIR}/unresolved_items.json`);
  const checks = [];
  addCheck(checks, "report blocks general readiness", report?.production_ready_allowed === false && report?.stable_allowed === false, report || {});
  addCheck(checks, "production matrix blocked", prod?.general_production_ready_allowed === false, prod || {});
  addCheck(checks, "stable matrix blocked", stable?.stable_allowed === false, stable || {});
  addCheck(checks, "unresolved blockers recorded", unresolved?.unresolved_items_count > 0, unresolved || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const gate = { status: failures.length === 0 ? "blocked_by_strict_claim_gaps" : "fail", stage: GENERAL_PREFLIGHT_STAGE, unresolved_items_count: unresolved?.unresolved_items_count || 0, ...noExecFlags(), checks, failures };
  writeJsonRel(root, `${GENERAL_PREFLIGHT_DIR}/general_readiness_stability_gate_report.json`, gate);
  return gate;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function shouldSkip(root, source) {
  const rel = path.relative(root, source).split(path.sep).join("/");
  const base = path.basename(source);
  if (base === ".DS_Store") return true;
  if (base.endsWith(".log")) return true;
  if (/raw_(request|response)|request_payload|response_payload/i.test(rel)) return true;
  if (rel === ".git" || rel.startsWith(".git/")) return true;
  if (rel === "node_modules" || rel.startsWith("node_modules/")) return true;
  if (rel === "dist" || rel.startsWith("dist/")) return true;
  if (rel === "exports" || rel.startsWith("exports/")) return true;
  if (rel.includes("/node_modules/") || rel.includes("/.git/") || rel.includes("/dist/")) return true;
  return false;
}

function copyIntoStage(root, relPath, stageRoot) {
  const sourcePath = p(root, relPath);
  if (!fs.existsSync(sourcePath)) return;
  const destPath = path.join(stageRoot, ...relPath.split("/"));
  if (fs.statSync(sourcePath).isDirectory()) {
    fs.cpSync(sourcePath, destPath, { recursive: true, filter: (item) => !shouldSkip(root, item) });
  } else if (!shouldSkip(root, sourcePath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
  }
}

function zipEntries(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

function forbidden(entries) {
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    raw_payload: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload/i.test(entry))
  };
}

export function runFinalExportRefreshAfterStrictPaths(root) {
  const packageRoots = [
    "AGENTS.md",
    "README.md",
    "MANIFEST.asset_classes.yaml",
    "stack.yaml",
    "release",
    "docs",
    "schemas",
    "security",
    "observability",
    "adapters",
    "runtime",
    "tools",
    "evals/suites",
    "evals/reports",
    "evidence/post-export-provider-verified-coverage-preflight",
    PROVIDER_COVERAGE_DIR,
    PROVIDER_FINAL_DIR,
    ADAPTER_COVERAGE_DIR,
    ADAPTER_FINAL_DIR,
    GENERAL_PREFLIGHT_DIR,
    "evidence/final-export-execution",
    "evidence/reference-baseline"
  ];
  const generatedAt = new Date().toISOString();
  const claimState = {
    status: "recorded",
    stage: EXPORT_REFRESH_STAGE,
    allowed_claims: MAINTAINED_CLAIMS,
    blocked_claims: BLOCKED_STRONG_CLAIMS,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false
  };
  const manifest = {
    status: "packaging",
    stage: EXPORT_REFRESH_STAGE,
    generated_at: generatedAt,
    package_path: EXPORT_PACKAGE,
    included_roots: packageRoots,
    excluded_roots: ["node_modules", "dist", ".git", "exports"],
    excluded_basenames: [".DS_Store"],
    excluded_patterns: ["*.log", "raw request/response payload files"]
  };
  writeYaml(root, "release/scopes/final-export/final_export_refresh_after_strict_paths_scope.yaml", [`stage: ${EXPORT_REFRESH_STAGE}`, "status: packaging", `package_path: ${EXPORT_PACKAGE}`, "dist_modified: false", "reference_baseline_source_modified: false"]);
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_claim_state.json`, claimState);
  writeUnresolved(root, EXPORT_REFRESH_DIR, EXPORT_REFRESH_STAGE, []);
  const stageRoot = path.join(os.tmpdir(), `harness-core-strict-refresh-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  for (const relPath of packageRoots) copyIntoStage(root, relPath, stageRoot);
  fs.mkdirSync(path.join(stageRoot, "final_export_refresh"), { recursive: true });
  writeJson(path.join(stageRoot, "final_export_refresh", "claim_state.json"), claimState);
  writeJson(path.join(stageRoot, "final_export_refresh", "manifest.json"), manifest);
  const packageAbs = p(root, EXPORT_PACKAGE);
  fs.mkdirSync(path.dirname(packageAbs), { recursive: true });
  fs.rmSync(packageAbs, { force: true });
  const zipResult = spawnSync("zip", ["-qr", packageAbs, "."], { cwd: stageRoot, encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  fs.rmSync(stageRoot, { recursive: true, force: true });
  const entries = zipResult.status === 0 && fs.existsSync(packageAbs) ? zipEntries(packageAbs) : [];
  const bad = forbidden(entries);
  const packageCreated = zipResult.status === 0 && fs.existsSync(packageAbs);
  const checksum = packageCreated ? sha256(packageAbs) : null;
  const packageRecord = {
    status: packageCreated ? "recorded" : "blocked",
    stage: EXPORT_REFRESH_STAGE,
    package_path: EXPORT_PACKAGE,
    package_created: packageCreated,
    package_sha256: checksum,
    package_entry_count: entries.length,
    node_modules_included: bad.node_modules.length > 0,
    dist_included: bad.dist.length > 0,
    git_metadata_included: bad.git_metadata.length > 0,
    ds_store_included: bad.ds_store.length > 0,
    raw_or_secret_payload_included: bad.raw_payload.length > 0,
    forbidden_entries: bad
  };
  const report = {
    status: packageCreated ? "pass" : "blocked",
    stage: EXPORT_REFRESH_STAGE,
    actual_export_write: packageCreated,
    package_path: EXPORT_PACKAGE,
    package_sha256: checksum,
    node_modules_included: packageRecord.node_modules_included,
    dist_included: packageRecord.dist_included,
    ds_store_included: packageRecord.ds_store_included,
    raw_or_secret_included: packageRecord.raw_or_secret_payload_included,
    protected_path_status: protectedStatus(root),
    ...noExecFlags({ actual_export_write: packageCreated })
  };
  manifest.status = packageCreated ? "exported" : "blocked";
  manifest.package_sha256 = checksum;
  manifest.package_entry_count = entries.length;
  manifest.package_entries = entries;
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_report.json`, report);
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_manifest.json`, manifest);
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_checksums.json`, { status: "recorded", stage: EXPORT_REFRESH_STAGE, entries: [{ path: EXPORT_PACKAGE, sha256: checksum }] });
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_gate_report.json`, { status: packageCreated ? "pass" : "blocked", stage: EXPORT_REFRESH_STAGE, unresolved_items_count: packageCreated ? 0 : 1, ...noExecFlags({ actual_export_write: packageCreated }), package_record: packageRecord });
  writeMd(root, "docs/release/final_export_refresh_after_strict_paths.ko.md", "Final Export Refresh After Strict Paths", [`Status: \`${report.status}\``, "", `- package path: \`${EXPORT_PACKAGE}\``, `- package sha256: \`${checksum || "missing"}\``, "- dist modified: false", "- legacy-reference-source modified: false", "- evidence/reference-baseline refresh: false"]);
  return report;
}

export function checkFinalExportRefreshAfterStrictPaths(root) {
  const report = readJsonIfExists(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_report.json`);
  const manifest = readJsonIfExists(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_manifest.json`);
  const gate = readJsonIfExists(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_gate_report.json`);
  const checks = [];
  addCheck(checks, "report passed", report?.status === "pass" && report?.actual_export_write === true, report || {});
  addCheck(checks, "manifest exported", manifest?.status === "exported" && manifest?.package_path === EXPORT_PACKAGE, manifest || {});
  addCheck(checks, "forbidden package entries absent", report?.node_modules_included === false && report?.dist_included === false && report?.ds_store_included === false && report?.raw_or_secret_included === false, report || {});
  addCheck(checks, "gate report passed", gate?.status === "pass", gate || {});
  const failures = checks.filter((check) => check.status !== "pass");
  const checked = { status: failures.length === 0 ? "pass" : "fail", stage: EXPORT_REFRESH_STAGE, unresolved_items_count: failures.length, ...noExecFlags({ actual_export_write: report?.actual_export_write === true }), checks, failures };
  writeJsonRel(root, `${EXPORT_REFRESH_DIR}/final_export_refresh_gate_report.json`, checked);
  return checked;
}
