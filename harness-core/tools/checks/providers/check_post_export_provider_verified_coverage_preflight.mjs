#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-export-provider-verified-coverage-completion-preflight";
const EVIDENCE_DIR = "evidence/post-export-provider-verified-coverage-preflight";
const BLOCKED_STRONG_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const REQUIRED_EVIDENCE_FILES = [
  "provider_verified_coverage_preflight_report.json",
  "openai_provider_coverage_inventory.json",
  "ollama_provider_coverage_inventory.json",
  "provider_verified_coverage_matrix.json",
  "provider_verified_missing_coverage.json",
  "provider_verified_claim_boundary.json",
  "provider_verified_blocker_update.json",
  "unresolved_items.json"
];
const REQUIRED_REL_PATHS = [
  "release/scopes/post-export/post_export_provider_verified_coverage_preflight_scope.yaml",
  "release/matrices/post-export/post_export_provider_verified_coverage_matrix.yaml",
  "release/claims/post-export/post_export_provider_verified_claim_boundary.yaml",
  "release/blockers/post-export/post_export_provider_verified_blocker_update.yaml",
  "evals/suites/post_export_provider_verified_coverage_preflight.yaml",
  "evals/reports/post_export_provider_verified_coverage_preflight_report.json",
  "evals/reports/post_export_provider_verified_coverage_preflight_report.md",
  "evals/reports/post_export_provider_verified_claim_boundary_report.json",
  "evals/reports/post_export_provider_verified_claim_boundary_report.md",
  "docs/providers/provider_verified_coverage_preflight.ko.md",
  "docs/providers/provider_verified_coverage_matrix.ko.md",
  "docs/providers/provider_verified_missing_coverage.ko.md",
  "docs/plans/next_provider_verified_final_gate_plan.ko.md",
  "docs/plans/next_adapter_checked_coverage_plan.ko.md",
  "tools/assessments/providers/assess_post_export_provider_verified_coverage_preflight.mjs",
  "tools/audits/providers/audit_post_export_provider_verified_claim_boundary.mjs",
  "tools/checks/providers/check_post_export_provider_verified_coverage_preflight.mjs"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function workspaceRoot() {
  return path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;
}

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(relPath), value);
}

function writeTextRel(relPath, value) {
  writeText(p(relPath), value);
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(),
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

function protectedPathStatus() {
  const status = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"]);
  const paths = statusPaths(status);
  const referenceBaselineSourcePaths = paths.filter((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source");
  const distPaths = paths.filter((file) => file.startsWith("dist/") || file === "dist");
  const baselinePaths = paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/") || file === "harness-core/evidence/reference-baseline");
  return {
    git_status: status,
    observed_dirty_paths: paths,
    reference_baseline_source_dirty_paths: referenceBaselineSourcePaths,
    dist_dirty_paths: distPaths,
    evidence_reference_baseline_dirty_paths: baselinePaths,
    reference_baseline_git_dirty: referenceBaselineSourcePaths.length > 0,
    dist_git_dirty: distPaths.length > 0,
    evidence_reference_baseline_git_dirty: baselinePaths.length > 0
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function allBlockedFlagsFalse(record) {
  return record?.provider_verified_allowed === false
    && record?.adapter_checked_allowed === false
    && record?.production_ready_allowed === false
    && record?.stable_allowed === false
    && record?.release_gated_allowed === false;
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_coverage_preflight_report.json`);
const openai = readJsonIfExists(`${EVIDENCE_DIR}/openai_provider_coverage_inventory.json`);
const ollama = readJsonIfExists(`${EVIDENCE_DIR}/ollama_provider_coverage_inventory.json`);
const matrix = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_coverage_matrix.json`);
const missing = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_missing_coverage.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/provider_verified_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const claimAudit = readJsonIfExists("evals/reports/post_export_provider_verified_claim_boundary_report.json");
const protectedStatus = protectedPathStatus();
const claimScan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/post_export_provider_verified_coverage_preflight_gate_report.json",
    "evals/reports/post_export_provider_verified_coverage_preflight_gate_report.md"
  ]
});
const blockedPositiveMatches = claimScan.matches.filter((match) => BLOCKED_STRONG_CLAIMS.includes(match.claim));

const missingEvidenceFiles = REQUIRED_EVIDENCE_FILES
  .map((file) => `${EVIDENCE_DIR}/${file}`)
  .filter((relPath) => !exists(relPath));
const missingRelPaths = REQUIRED_REL_PATHS.filter((relPath) => !exists(relPath));

const checks = [];
addCheck(checks, "required evidence files exist", missingEvidenceFiles.length === 0, { missing_evidence_files: missingEvidenceFiles });
addCheck(checks, "required release eval docs and tools exist", missingRelPaths.length === 0, { missing_rel_paths: missingRelPaths });
addCheck(checks, "preflight report records blocked state", report?.status === "blocked_by_missing_provider_coverage"
  && report?.provider_verified_coverage_preflight_completed === true
  && report?.provider_diverse_allowed === true
  && report?.local_model_verified_allowed === true
  && report?.can_enter_provider_verified_final_gate === false
  && allBlockedFlagsFalse(report), report || {});
addCheck(checks, "openai coverage inventory records provider-level partials", openai?.status === "partial"
  && openai?.provider_contract_documented === true
  && openai?.execution_evidence_exists === true
  && openai?.canary_evidence_exists === true
  && openai?.redteam_evidence_exists === true
  && openai?.replay_or_regression_evidence_exists === true
  && openai?.error_handling_reviewed === "unknown_or_partial"
  && openai?.capability_matrix_reviewed === true
  && openai?.storage_redaction_reviewed === true, openai || {});
addCheck(checks, "ollama coverage inventory records provider-level partials", ollama?.status === "partial"
  && ollama?.provider_contract_documented === true
  && ollama?.execution_evidence_exists === true
  && ollama?.local_model_verified === true
  && ollama?.redteam_evidence_exists === true
  && ollama?.replay_or_regression_evidence_exists === "partial"
  && ollama?.error_handling_reviewed === "unknown_or_partial"
  && ollama?.capability_matrix_reviewed === true
  && ollama?.storage_redaction_reviewed === true, ollama || {});
addCheck(checks, "coverage matrix keeps provider-verified blocked", matrix?.status === "recorded"
  && matrix?.provider_verified_allowed === false
  && matrix?.can_enter_provider_verified_final_gate === false
  && matrix?.provider_lanes?.openai_api_lane?.error_handling_reviewed === "unknown_or_partial"
  && matrix?.provider_lanes?.ollama_qwen3_local_lane?.replay_or_regression_evidence_exists === "partial"
  && Array.isArray(matrix?.missing_or_partial_coverage)
  && matrix.missing_or_partial_coverage.length > 0, matrix || {});
addCheck(checks, "missing coverage is recorded", missing?.status === "blocked_by_missing_provider_coverage"
  && missing?.provider_verified_allowed === false
  && missing?.can_enter_provider_verified_final_gate === false
  && Array.isArray(missing?.missing_or_partial_coverage)
  && missing.missing_or_partial_coverage.length > 0, missing || {});
addCheck(checks, "claim boundary blocks strong claims", boundary?.status === "pass"
  && boundary?.provider_diverse_allowed === true
  && boundary?.local_model_verified_allowed === true
  && allBlockedFlagsFalse(boundary)
  && BLOCKED_STRONG_CLAIMS.every((claim) => boundary?.blocked_claims?.includes(claim)), boundary || {});
addCheck(checks, "blocker update recorded", blocker?.status === "blocked_by_missing_provider_coverage"
  && blocker?.provider_verified_allowed === false
  && blocker?.can_enter_provider_verified_final_gate === false
  && Array.isArray(blocker?.blockers)
  && blocker.blockers.length > 0, blocker || {});
addCheck(checks, "unresolved items recorded", unresolved?.status === "blocked"
  && unresolved?.unresolved_items_count === missing?.missing_or_partial_coverage_count, unresolved || {});
addCheck(checks, "claim boundary audit passed", claimAudit?.status === "pass", claimAudit || {});
addCheck(checks, "forbidden execution flags are false", report?.openai_model_api_call === false
  && report?.openai_provider_rerun === false
  && report?.new_local_model_execution === false
  && report?.new_local_model_generation === false
  && report?.telemetry_sink_write === false
  && report?.npm_install_or_ci === false
  && report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, report || {});
addCheck(checks, "protected referenceBaseline and dist paths are not dirty", protectedStatus.reference_baseline_git_dirty === false && protectedStatus.dist_git_dirty === false, protectedStatus);
addCheck(checks, "evidence reference baseline not modified by this stage", report?.evidence_reference_baseline_modified === false, protectedStatus);
addCheck(checks, "blocked positive claims absent", blockedPositiveMatches.length === 0, {
  scan_status: claimScan.status,
  blocked_positive_matches: blockedPositiveMatches
});

const failures = checks.filter((check) => check.status !== "pass");
const status = failures.length === 0 ? "blocked_by_missing_provider_coverage" : "fail";
const gate = {
  status,
  stage: STAGE,
  provider_diverse_allowed: true,
  local_model_verified_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  can_enter_provider_verified_final_gate: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  new_local_model_execution: false,
  new_local_model_generation: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified: false,
  provider_verified_positive_claim_absent: blockedPositiveMatches.every((match) => match.claim !== "provider-verified"),
  adapter_checked_positive_claim_absent: blockedPositiveMatches.every((match) => match.claim !== "adapter-checked"),
  production_ready_positive_claim_absent: blockedPositiveMatches.every((match) => match.claim !== "production-ready"),
  stable_positive_claim_absent: blockedPositiveMatches.every((match) => match.claim !== "stable"),
  release_gated_positive_claim_absent: blockedPositiveMatches.every((match) => match.claim !== "release-gated"),
  unresolved_items_count: missing?.missing_or_partial_coverage_count ?? 0,
  protected_path_status: protectedStatus,
  reason: failures.length === 0
    ? "Provider-verified coverage preflight recorded current coverage and gaps. Final claim remains blocked."
    : "Provider-verified coverage preflight checks failed.",
  checks,
  failures
};

writeJsonRel(`${EVIDENCE_DIR}/provider_verified_coverage_preflight_gate_report.json`, gate);
writeJsonRel("evals/reports/post_export_provider_verified_coverage_preflight_gate_report.json", gate);
writeTextRel("evals/reports/post_export_provider_verified_coverage_preflight_gate_report.md", `# Post Export Provider-Verified Coverage Preflight Gate Report

Status: ${gate.status}

- Stage: ${STAGE}
- Provider-diverse allowed: true
- Local-model-verified allowed: true
- Provider-verified allowed: false
- Adapter-checked allowed: false
- Production-ready allowed: false
- Stable allowed: false
- Release-gated allowed: false
- Can enter provider-verified final gate: false
- Unresolved items: ${gate.unresolved_items_count}
- Reason: ${gate.reason}
`);

console.log(JSON.stringify(gate, null, 2));
process.exit(status === "fail" ? 1 : 0);
