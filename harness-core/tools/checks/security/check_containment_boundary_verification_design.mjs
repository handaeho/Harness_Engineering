#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-containment-boundary-verification-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-containment-boundary-verification-design");

const claimsAllowed = [
  "containment-boundary-verification-designed",
  "containment-boundary-taxonomy-drafted",
  "containment-fixtures-authored",
  "containment-coverage-matrix-drafted",
  "containment-claim-boundary-audited",
  "containment-verification-gate-designed",
  "containment-blocker-updated"
];
const claimsBlocked = [
  "containment-verified",
  "redteam-passed",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-verified",
  "provider-diverse",
  "adapter-checked",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function runJsonTool(relPath) {
  const result = spawnSync(process.execPath, [p(...relPath.split("/"))], {
    cwd: path.dirname(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = { status: "unparseable", stdout: result.stdout.slice(0, 500), stderr: result.stderr.slice(0, 500) };
  }
  return { exitCode: result.status, parsed };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const validateAlpha = runJsonTool("tools/validators/evals/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/checks/workspace/check_reference_baseline_integrity.mjs");
const skippedReview = runJsonTool("tools/checks/redteam/check_skipped_redteam_case_review.mjs");
const fixtureValidation = runJsonTool("tools/validators/security/validate_containment_fixtures.mjs");
const coverageSummary = runJsonTool("tools/summaries/security/summarize_containment_coverage.mjs");
const claimAudit = runJsonTool("tools/audits/security/audit_containment_claim_boundary.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const designReport = readIfExists("evidence/beta-containment-boundary-verification-design/containment_boundary_verification_design_report.json");
const coverage = readIfExists("evidence/beta-containment-boundary-verification-design/containment_coverage_matrix.json");
const claimBoundary = readIfExists("evidence/beta-containment-boundary-verification-design/containment_claim_boundary.json");
const blocker = readIfExists("evidence/beta-containment-boundary-verification-design/containment_blocker_update.json");
const unresolved = readIfExists("evidence/beta-containment-boundary-verification-design/unresolved_items.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];

addCheck(checks, "validate_alpha.mjs pass", validateAlpha.exitCode === 0 && validateAlpha.parsed?.status === "pass", {
  status: validateAlpha.parsed?.status,
  exitCode: validateAlpha.exitCode
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", compareBaseline.exitCode === 0 && compareBaseline.parsed?.status === "pass", {
  status: compareBaseline.parsed?.status,
  exitCode: compareBaseline.exitCode
});
addCheck(checks, "check_skipped_redteam_case_review.mjs pass", skippedReview.exitCode === 0 && skippedReview.parsed?.status === "pass", {
  status: skippedReview.parsed?.status,
  exitCode: skippedReview.exitCode
});

for (const relPath of [
  "release/scopes/beta/beta_containment_boundary_verification_design_scope.yaml",
  "release/gates/containment/containment_verification_gate.yaml",
  "release/blockers/containment/containment_blocker_update.yaml",
  "security/containment/containment_boundary_taxonomy.yaml",
  "security/containment/containment_verification_policy.yaml",
  "security/containment/containment_result.schema.json",
  "security/containment/containment_trace.schema.json",
  "security/containment/approval_boundary_policy.yaml",
  "security/containment/tool_execution_boundary_policy.yaml",
  "security/containment/external_side_effect_boundary_policy.yaml",
  "security/containment/file_write_boundary_policy.yaml",
  "security/containment/shell_execution_boundary_policy.yaml",
  "security/containment/network_boundary_policy.yaml",
  "security/containment/raw_storage_boundary_policy.yaml",
  "security/containment/trace_redaction_boundary_policy.yaml",
  "security/containment/containment_claim_policy.yaml",
  "evidence/beta-containment-boundary-verification-design/containment_coverage_matrix.json",
  "evidence/beta-containment-boundary-verification-design/containment_claim_boundary.json",
  "evidence/beta-containment-boundary-verification-design/containment_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

for (const relPath of [
  "evals/fixtures/containment/approval_boundary_cases.jsonl",
  "evals/fixtures/containment/tool_execution_boundary_cases.jsonl",
  "evals/fixtures/containment/external_side_effect_boundary_cases.jsonl",
  "evals/fixtures/containment/file_write_boundary_cases.jsonl",
  "evals/fixtures/containment/shell_execution_boundary_cases.jsonl",
  "evals/fixtures/containment/network_boundary_cases.jsonl",
  "evals/fixtures/containment/raw_storage_boundary_cases.jsonl",
  "evals/fixtures/containment/trace_redaction_boundary_cases.jsonl",
  "evals/fixtures/containment/tool_output_reclassification_cases.jsonl"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "fixture validation pass", fixtureValidation.exitCode === 0 && fixtureValidation.parsed?.status === "pass", {
  status: fixtureValidation.parsed?.status,
  fixtures_total: fixtureValidation.parsed?.fixtures_total,
  exitCode: fixtureValidation.exitCode
});
addCheck(checks, "containment coverage summary pass", coverageSummary.exitCode === 0 && coverageSummary.parsed?.status === "pass", {
  status: coverageSummary.parsed?.status,
  boundary_count: coverageSummary.parsed?.boundary_count
});
addCheck(checks, "containment claim boundary audit pass", claimAudit.exitCode === 0 && claimAudit.parsed?.status === "pass", {
  status: claimAudit.parsed?.status
});
addCheck(checks, "no execution occurred in design stage", designReport?.new_provider_execution === false
  && designReport?.new_redteam_execution === false
  && designReport?.local_model_execution === false
  && designReport?.telemetry_connection === false
  && designReport?.external_side_effects === false, {
  new_provider_execution: designReport?.new_provider_execution,
  new_redteam_execution: designReport?.new_redteam_execution,
  local_model_execution: designReport?.local_model_execution,
  telemetry_connection: designReport?.telemetry_connection,
  external_side_effects: designReport?.external_side_effects
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "containment claims remain blocked", claimBoundary?.containment_verified_allowed === false
  && claimBoundary?.release_gated_allowed === false
  && claimBoundary?.production_ready_allowed === false
  && coverage?.containment_verified_allowed === false, {
  containment_verified_allowed: claimBoundary?.containment_verified_allowed,
  release_gated_allowed: claimBoundary?.release_gated_allowed,
  production_ready_allowed: claimBoundary?.production_ready_allowed,
  coverage_containment_verified_allowed: coverage?.containment_verified_allowed
});
addCheck(checks, "blocker update records containment design", blocker?.new_status === "containment_boundary_verification_designed_execution_pending"
  && blocker?.still_blocks?.includes("containment-verified")
  && blocker?.does_not_unblock?.includes("release-gated"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items empty on pass", designReport?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "reference baseline source modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Containment boundary verification design is complete, but dedicated containment verification has not been executed."
    : "One or more containment boundary verification design checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Containment Boundary Verification Design Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "containment_verification_gate_design_report.json"), gateReport);
writeText(path.join(evidenceDir, "containment_verification_gate_design_report.md"), md);
writeJson(path.join(evidenceDir, "containment_boundary_verification_design_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "containment_boundary_verification_design_gate_report.md"), md);
writeJson(p("evals", "reports", "containment_verification_gate_design_report.json"), gateReport);
writeText(p("evals", "reports", "containment_verification_gate_design_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
