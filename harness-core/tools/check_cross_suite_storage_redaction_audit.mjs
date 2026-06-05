#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runAudit, resolveRoot, STAGE } from "./run_cross_suite_storage_redaction_audit.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-cross-suite-storage-redaction-audit");
const claimsAllowedPass = [
  "cross-suite-storage-redaction-audit-executed",
  "raw-storage-audit-passed",
  "redaction-boundary-audit-passed",
  "secret-pattern-audit-passed",
  "allowed-preview-hash-summary-classified",
  "storage-redaction-blocker-updated"
];
const claimsAllowedReview = [
  "cross-suite-storage-redaction-audit-executed"
];
const claimsBlocked = [
  "containment-verified",
  "telemetry-connected",
  "production-monitored",
  "release-gated",
  "production-ready",
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

function runJsonTool(relPath, tolerateNeedsReview = false) {
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
  const acceptableExit = result.status === 0 || (tolerateNeedsReview && result.status === 2);
  return { exitCode: result.status, acceptableExit, parsed };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

runAudit({ root, write: true });
const classifyTool = runJsonTool("tools/classify_storage_redaction_findings.mjs", true);
const summaryTool = runJsonTool("tools/summarize_storage_redaction_audit.mjs", true);
const validateAlpha = runJsonTool("tools/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/check_reference_baseline_integrity.mjs");
const containmentGate = runJsonTool("tools/check_containment_verification_gate_refinement.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const report = readIfExists("evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json");
const redactionBoundary = readIfExists("evidence/beta-cross-suite-storage-redaction-audit/redaction_boundary_audit.json");
const claimBoundary = readIfExists("evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_claim_boundary.json");
const blocker = readIfExists("evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_blocker_update.json");
const unresolved = readIfExists("evidence/beta-cross-suite-storage-redaction-audit/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const checks = [];

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
addCheck(checks, "check_containment_verification_gate_refinement.mjs pass", containmentGate.exitCode === 0 && containmentGate.parsed?.status === "pass", {
  status: containmentGate.parsed?.status,
  exitCode: containmentGate.exitCode
});
addCheck(checks, "classify_storage_redaction_findings.mjs pass", classifyTool.acceptableExit && classifyTool.parsed?.status === report?.status, {
  status: classifyTool.parsed?.status,
  exitCode: classifyTool.exitCode
});
addCheck(checks, "summarize_storage_redaction_audit.mjs pass", summaryTool.acceptableExit && summaryTool.parsed?.status === report?.status, {
  status: summaryTool.parsed?.status,
  exitCode: summaryTool.exitCode
});

for (const relPath of [
  "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json",
  "evidence/beta-cross-suite-storage-redaction-audit/scanned_artifact_index.json",
  "evidence/beta-cross-suite-storage-redaction-audit/raw_storage_findings.json",
  "evidence/beta-cross-suite-storage-redaction-audit/secret_pattern_findings.json",
  "evidence/beta-cross-suite-storage-redaction-audit/redaction_boundary_audit.json",
  "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_claim_boundary.json",
  "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no execution occurred in audit stage", report?.new_provider_execution === false
  && report?.new_redteam_execution === false
  && report?.containment_fixture_rerun === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false, {
  new_provider_execution: report?.new_provider_execution,
  new_redteam_execution: report?.new_redteam_execution,
  containment_fixture_rerun: report?.containment_fixture_rerun,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection
});
addCheck(checks, "dist modified false", report?.dist_modified === false && distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: report?.dist_modified,
  dist_files: distFiles
});
addCheck(checks, "storage and secret violation counts are zero", report?.raw_request_storage_violations === 0
  && report?.raw_response_storage_violations === 0
  && report?.secret_pattern_violations === 0
  && report?.auth_header_violations === 0, {
  raw_request_storage_violations: report?.raw_request_storage_violations,
  raw_response_storage_violations: report?.raw_response_storage_violations,
  secret_pattern_violations: report?.secret_pattern_violations,
  auth_header_violations: report?.auth_header_violations
});
addCheck(checks, "needs review findings zero", report?.needs_review_findings === 0, {
  needs_review_findings: report?.needs_review_findings
});
addCheck(checks, "audit pass flags true", report?.redaction_boundary_audit_passed === true
  && report?.raw_storage_audit_passed === true
  && report?.secret_pattern_audit_passed === true
  && redactionBoundary?.redaction_boundary_audit_passed === true, {
  redaction_boundary_audit_passed: report?.redaction_boundary_audit_passed,
  raw_storage_audit_passed: report?.raw_storage_audit_passed,
  secret_pattern_audit_passed: report?.secret_pattern_audit_passed
});
addCheck(checks, "claim boundary remains closed", claimBoundary?.containment_verified_allowed === false
  && claimBoundary?.telemetry_connected_allowed === false
  && claimBoundary?.release_gated_allowed === false
  && claimBoundary?.production_ready_allowed === false, {
  containment_verified_allowed: claimBoundary?.containment_verified_allowed,
  telemetry_connected_allowed: claimBoundary?.telemetry_connected_allowed,
  release_gated_allowed: claimBoundary?.release_gated_allowed,
  production_ready_allowed: claimBoundary?.production_ready_allowed
});
addCheck(checks, "blocker update records storage redaction audit", blocker?.new_status === "cross_suite_storage_redaction_audit_completed"
  && blocker?.unblocks?.includes("cross_suite_raw_storage_audit_pass")
  && blocker?.does_not_unblock?.includes("release-gated"), {
  new_status: blocker?.new_status,
  unblocks: blocker?.unblocks
});
addCheck(checks, "unresolved items empty on pass", report?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "reference baseline source modified false by checksum comparison", compareBaseline.parsed?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && compareBaseline.parsed?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
let status = failed.length === 0 ? "pass" : "fail";
if (report?.status === "needs_review") status = "needs_review";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_containment_verified_claim: false,
  can_enter_telemetry_connected_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Cross-suite storage/redaction audit completed, but containment-verified remains blocked until dedicated verification and all remaining criteria pass."
    : status === "needs_review"
      ? "Cross-suite storage/redaction audit found findings that need review before audit-pass claims are allowed."
      : "One or more cross-suite storage/redaction audit checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowedPass : claimsAllowedReview,
  claims_blocked: claimsBlocked
};
const md = `# Storage Redaction Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment-verified claim: false
- Can enter telemetry-connected claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "storage_redaction_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "storage_redaction_gate_report.md"), md);
writeJson(p("evals", "reports", "storage_redaction_gate_report.json"), gateReport);
writeText(p("evals", "reports", "storage_redaction_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : status === "needs_review" ? 2 : 1;
