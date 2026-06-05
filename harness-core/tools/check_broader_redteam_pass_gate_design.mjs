#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-broader-redteam-pass-gate-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-broader-redteam-pass-gate-design");

const claimsAllowed = [
  "broader-redteam-pass-gate-designed",
  "redteam-coverage-matrix-drafted",
  "redteam-gap-analysis-recorded",
  "redteam-pass-thresholds-drafted",
  "redteam-pass-claim-boundary-audited",
  "redteam-remaining-execution-lanes-indexed"
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
const limitedReviewGate = runJsonTool("tools/check_openai_redteam_limited_result_review.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const report = readIfExists("evidence/beta-broader-redteam-pass-gate-design/broader_redteam_pass_gate_design_report.json");
const coverage = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_coverage_matrix.json");
const gaps = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_gap_analysis.json");
const thresholds = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_pass_gate_thresholds.json");
const boundary = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_pass_claim_boundary.json");
const lanes = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_remaining_execution_lanes.json");
const blocker = readIfExists("evidence/beta-broader-redteam-pass-gate-design/redteam_pass_blocker_update.json");
const unresolved = readIfExists("evidence/beta-broader-redteam-pass-gate-design/unresolved_items.json");
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
addCheck(checks, "check_openai_redteam_limited_result_review.mjs pass", limitedReviewGate.exitCode === 0 && limitedReviewGate.parsed?.status === "pass", {
  status: limitedReviewGate.parsed?.status,
  exitCode: limitedReviewGate.exitCode
});

for (const relPath of [
  "release/redteam_pass_gate.yaml",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_coverage_matrix.json",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_gap_analysis.json",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_pass_gate_thresholds.json",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_pass_claim_boundary.json",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_remaining_execution_lanes.json",
  "evidence/beta-broader-redteam-pass-gate-design/redteam_pass_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no execution occurred in design stage", report?.new_provider_execution === false
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
addCheck(checks, "claim boundary blocks strong claims", boundary?.redteam_passed_allowed === false
  && boundary?.containment_verified_allowed === false
  && boundary?.release_gated_allowed === false
  && boundary?.blocked_claims?.includes("production-ready"), {
  redteam_passed_allowed: boundary?.redteam_passed_allowed,
  containment_verified_allowed: boundary?.containment_verified_allowed,
  release_gated_allowed: boundary?.release_gated_allowed
});
addCheck(checks, "thresholds keep redteam-passed blocked", thresholds?.redteam_passed_claim_allowed === false
  && thresholds?.thresholds?.critical_failures_allowed === 0
  && thresholds?.thresholds?.high_failures_allowed === 0
  && thresholds?.thresholds?.skipped_cases_must_be_reviewed === true, {
  redteam_passed_claim_allowed: thresholds?.redteam_passed_claim_allowed
});
addCheck(checks, "coverage and gaps remain partial", coverage?.overall_coverage_status === "partial_not_redteam_passed"
  && Array.isArray(gaps) && gaps.length >= 4, {
  overall_coverage_status: coverage?.overall_coverage_status,
  gaps_count: Array.isArray(gaps) ? gaps.length : null
});
addCheck(checks, "remaining lanes indexed", Array.isArray(lanes?.lanes) && lanes.lanes.length >= 4, {
  lanes_count: Array.isArray(lanes?.lanes) ? lanes.lanes.length : null
});
addCheck(checks, "blocker update preserves blocked claims", blocker?.new_status === "broader_redteam_pass_gate_designed_remaining_coverage_pending"
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
    ? "Broader redteam pass gate was designed, but required coverage, skipped case review, local runtime gap, and containment proof remain incomplete."
    : "One or more broader redteam pass gate design checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Broader Redteam Pass Gate Design Gate Report

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

writeJson(path.join(evidenceDir, "broader_redteam_pass_gate_design_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "broader_redteam_pass_gate_design_gate_report.md"), md);
writeJson(p("evals", "reports", "broader_redteam_pass_gate_design_gate_report.json"), gateReport);
writeText(p("evals", "reports", "broader_redteam_pass_gate_design_gate_report.md"), md);
console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
