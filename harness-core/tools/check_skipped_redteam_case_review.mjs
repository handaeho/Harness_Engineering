#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-skipped-redteam-case-review-and-lane-classification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-skipped-redteam-case-review");

const claimsAllowed = [
  "skipped-redteam-cases-reviewed",
  "redteam-case-lanes-classified",
  "redteam-case-dispositions-recorded",
  "redteam-skipped-case-gap-refined",
  "redteam-future-execution-lanes-drafted",
  "redteam-skipped-case-blocker-updated"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
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

function readJsonlIfExists(relPath) {
  if (!exists(relPath)) return [];
  return fs.readFileSync(p(...relPath.split("/")), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
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
const validateAlpha = runJsonTool("tools/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/check_reference_baseline_integrity.mjs");
const broaderGate = runJsonTool("tools/check_broader_redteam_pass_gate_design.mjs");
const dispositionAudit = runJsonTool("tools/audit_skipped_redteam_case_dispositions.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const report = readIfExists("evidence/beta-skipped-redteam-case-review/skipped_case_review_report.json");
const summary = readIfExists("evidence/beta-skipped-redteam-case-review/lane_classification_summary.json");
const exclusion = readIfExists("evidence/beta-skipped-redteam-case-review/exclusion_justification_report.json");
const blocker = readIfExists("evidence/beta-skipped-redteam-case-review/skipped_case_blocker_update.json");
const unresolved = readIfExists("evidence/beta-skipped-redteam-case-review/unresolved_items.json");
const dispositions = readJsonlIfExists("evidence/beta-skipped-redteam-case-review/skipped_case_disposition.jsonl");
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
addCheck(checks, "check_broader_redteam_pass_gate_design.mjs pass", broaderGate.exitCode === 0 && broaderGate.parsed?.status === "pass", {
  status: broaderGate.parsed?.status,
  exitCode: broaderGate.exitCode
});
addCheck(checks, "audit_skipped_redteam_case_dispositions.mjs pass", dispositionAudit.exitCode === 0 && dispositionAudit.parsed?.status === "pass", {
  status: dispositionAudit.parsed?.status,
  exitCode: dispositionAudit.exitCode
});

for (const relPath of [
  "evidence/beta-skipped-redteam-case-review/skipped_case_disposition.jsonl",
  "evidence/beta-skipped-redteam-case-review/lane_classification_summary.json",
  "evidence/beta-skipped-redteam-case-review/exclusion_justification_report.json",
  "evidence/beta-skipped-redteam-case-review/skipped_case_blocker_update.json",
  "evidence/beta-skipped-redteam-case-review/remaining_provider_compatible_cases.jsonl",
  "evidence/beta-skipped-redteam-case-review/local_runtime_redteam_candidates.jsonl",
  "evidence/beta-skipped-redteam-case-review/future_rag_candidates.jsonl",
  "evidence/beta-skipped-redteam-case-review/containment_boundary_candidates.jsonl"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "skipped cases and disposition counts match", summary?.skipped_cases_total === 12
  && summary?.dispositions_recorded === 12
  && dispositions.length === 12, {
  skipped_cases_total: summary?.skipped_cases_total,
  dispositions_recorded: summary?.dispositions_recorded,
  disposition_lines: dispositions.length
});
addCheck(checks, "manual review required count is zero", summary?.manual_review_required_count === 0, {
  manual_review_required_count: summary?.manual_review_required_count
});
addCheck(checks, "no execution occurred in review stage", report?.new_provider_execution === false
  && report?.new_redteam_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false, {
  new_provider_execution: report?.new_provider_execution,
  new_redteam_execution: report?.new_redteam_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection
});
addCheck(checks, "dist modified false", report?.dist_modified === false
  && distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: report?.dist_modified,
  dist_files: distFiles
});
addCheck(checks, "strong claims remain blocked", summary?.redteam_passed_allowed === false
  && summary?.containment_verified_allowed === false
  && summary?.release_gated_allowed === false, {
  redteam_passed_allowed: summary?.redteam_passed_allowed,
  containment_verified_allowed: summary?.containment_verified_allowed,
  release_gated_allowed: summary?.release_gated_allowed
});
addCheck(checks, "exclusion report complete", exclusion?.status === "pass"
  && Array.isArray(exclusion?.cases_without_disposition)
  && exclusion.cases_without_disposition.length === 0
  && Array.isArray(exclusion?.manual_review_required_cases)
  && exclusion.manual_review_required_cases.length === 0, {
  cases_without_disposition: exclusion?.cases_without_disposition,
  manual_review_required_cases: exclusion?.manual_review_required_cases
});
addCheck(checks, "blocker update records skipped case review", blocker?.new_status === "skipped_cases_reviewed_and_lanes_classified"
  && blocker?.still_blocks?.includes("redteam-passed")
  && blocker?.does_not_unblock?.includes("release-gated"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items empty on pass", report?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
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
    ? "Skipped redteam cases were reviewed and classified into future lanes, but execution gaps and containment proof remain incomplete."
    : "One or more skipped redteam case review checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Skipped Redteam Case Review Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "skipped_case_review_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "skipped_case_review_gate_report.md"), md);
writeJson(p("evals", "reports", "skipped_redteam_case_review_gate_report.json"), gateReport);
writeText(p("evals", "reports", "skipped_redteam_case_review_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
