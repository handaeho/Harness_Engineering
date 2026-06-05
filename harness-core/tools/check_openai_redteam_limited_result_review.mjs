#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-result-review-and-blocker-update";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-result-review");

const claimsAllowed = [
  "openai-redteam-limited-result-reviewed",
  "openai-redteam-limited-claim-boundary-audited",
  "openai-redteam-limited-evidence-indexed",
  "openai-redteam-limited-blocker-updated"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-verified",
  "provider-diverse",
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
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
  return {
    exitCode: result.status,
    parsed
  };
}

const checks = [];
const validateAlpha = runJsonTool("tools/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/check_reference_baseline_integrity.mjs");
const sourceExecutionGate = runJsonTool("tools/check_openai_redteam_limited_execution.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const resultReview = readIfExists("evidence/beta-openai-redteam-limited-result-review/result_review_report.json");
const evidenceCompleteness = readIfExists("evidence/beta-openai-redteam-limited-result-review/evidence_completeness_report.json");
const aliases = readIfExists("evidence/beta-openai-redteam-limited-result-review/claim_aliases.json");
const canonicalization = readIfExists("evidence/beta-openai-redteam-limited-result-review/claim_canonicalization_report.json");
const blockerUpdate = readIfExists("evidence/beta-openai-redteam-limited-result-review/blocker_update.json");
const releaseRefresh = readIfExists("evidence/beta-openai-redteam-limited-result-review/release_gate_blocker_refresh.json");
const unresolved = readIfExists("evidence/beta-openai-redteam-limited-result-review/unresolved_items.json");
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
addCheck(checks, "check_openai_redteam_limited_execution.mjs pass", sourceExecutionGate.exitCode === 0 && sourceExecutionGate.parsed?.status === "pass", {
  status: sourceExecutionGate.parsed?.status,
  exitCode: sourceExecutionGate.exitCode
});

for (const relPath of [
  "evidence/beta-openai-redteam-limited-result-review/result_review_report.json",
  "evidence/beta-openai-redteam-limited-result-review/evidence_completeness_report.json",
  "evidence/beta-openai-redteam-limited-result-review/claim_aliases.json",
  "evidence/beta-openai-redteam-limited-result-review/claim_canonicalization_report.json",
  "evidence/beta-openai-redteam-limited-result-review/blocker_update.json",
  "evidence/beta-openai-redteam-limited-result-review/release_gate_blocker_refresh.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no new execution occurred in review", resultReview?.new_provider_execution === false
  && resultReview?.new_redteam_execution === false
  && resultReview?.local_model_execution === false
  && resultReview?.telemetry_connection === false, {
  new_provider_execution: resultReview?.new_provider_execution,
  new_redteam_execution: resultReview?.new_redteam_execution,
  local_model_execution: resultReview?.local_model_execution,
  telemetry_connection: resultReview?.telemetry_connection
});
addCheck(checks, "dist modified false", resultReview?.dist_modified === false
  && distFiles.length === 1
  && distFiles[0] === "README.md", {
  dist_modified: resultReview?.dist_modified,
  dist_files: distFiles
});
addCheck(checks, "source execution status pass", resultReview?.source_execution_status === "pass", {
  source_execution_status: resultReview?.source_execution_status
});
addCheck(checks, "critical and high failures are zero", resultReview?.critical_failures === 0
  && resultReview?.high_failures === 0, {
  critical_failures: resultReview?.critical_failures,
  high_failures: resultReview?.high_failures
});
addCheck(checks, "redaction and raw storage checks pass", resultReview?.redaction_passed === true
  && resultReview?.raw_request_stored === false
  && resultReview?.raw_response_stored === false, {
  redaction_passed: resultReview?.redaction_passed,
  raw_request_stored: resultReview?.raw_request_stored,
  raw_response_stored: resultReview?.raw_response_stored
});
addCheck(checks, "claim alias and canonicalization pass", aliases?.status === "pass"
  && canonicalization?.status === "pass"
  && resultReview?.claims_allowed?.includes("openai-redteam-case-results-recorded")
  && resultReview?.claims_allowed?.includes("openai-redteam-trace-captured")
  && resultReview?.claims_allowed?.includes("openai-redteam-redaction-checked"), {
  aliases_status: aliases?.status,
  canonicalization_status: canonicalization?.status
});
addCheck(checks, "blocker update and release gate refresh preserve blocked release gate", blockerUpdate?.new_status === "openai_limited_redteam_execution_completed_broader_redteam_review_pending"
  && releaseRefresh?.release_gate_status === "blocked_not_release_gated"
  && releaseRefresh?.release_gate_passed === false
  && releaseRefresh?.redteam_passed === false
  && releaseRefresh?.containment_verified === false, {
  blocker_status: blockerUpdate?.new_status,
  release_gate_status: releaseRefresh?.release_gate_status,
  release_gate_passed: releaseRefresh?.release_gate_passed
});
addCheck(checks, "evidence completeness mapped or pass", ["pass", "pass_with_mapped_paths"].includes(evidenceCompleteness?.status), {
  status: evidenceCompleteness?.status,
  missing_unmapped_count: evidenceCompleteness?.missing_unmapped_count
});
addCheck(checks, "unresolved items empty on pass", resultReview?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
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
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Limited redteam execution result was reviewed, but broader redteam pass, containment proof, provider diversity, local runtime, and telemetry blockers remain."
    : "One or more limited redteam result review checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# OpenAI Redteam Limited Result Review Gate Report

Status: ${gateReport.status}

Stage: ${STAGE}

- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "result_review_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "result_review_gate_report.md"), md);
writeJson(p("evals", "reports", "openai_redteam_limited_result_review_gate_report.json"), gateReport);
writeText(p("evals", "reports", "openai_redteam_limited_result_review_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
