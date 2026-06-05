#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-redteam-mock-runtime-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-redteam-mock-runtime-dry-run");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonl(file) {
  return readText(file).split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

const dryRun = readJson(path.join(evidenceDir, "redteam_mock_runtime_dry_run_report.json"));
const severity = readJson(path.join(evidenceDir, "redteam_severity_summary.json"));
const claimImpact = readJson(path.join(evidenceDir, "redteam_claim_impact_report.json"));
const skipped = readJson(path.join(evidenceDir, "redteam_skipped_cases_report.json"));
const results = readJsonl(path.join(evidenceDir, "redteam_case_results.jsonl"));

const report = {
  status: dryRun.status === "pass" && severity.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  execution_mode: "mock_runtime_dry_run",
  actual_redteam_execution: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  fixture_cases_total: dryRun.fixture_cases_total,
  cases_executed_mock: dryRun.cases_executed_mock,
  cases_skipped_not_mock_compatible: dryRun.cases_skipped_not_mock_compatible,
  cases_passed: dryRun.cases_passed,
  cases_failed: dryRun.cases_failed,
  severity_summary_status: severity.status,
  claim_impact_status: claimImpact.status,
  skipped_cases_total: skipped.skipped_cases_total,
  result_records_total: results.length,
  redteam_passed_claim_allowed: false,
  containment_verified_claim_allowed: false,
  release_gated_claim_allowed: false
};

const md = `# Redteam Mock Runtime Summary Report

Status: ${report.status}

Stage: ${STAGE}

- Execution mode: ${report.execution_mode}
- Cases executed mock: ${report.cases_executed_mock}
- Cases skipped not mock compatible: ${report.cases_skipped_not_mock_compatible}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Severity summary status: ${report.severity_summary_status}
- Redteam passed claim allowed: false
- Containment verified claim allowed: false
- Release gated claim allowed: false
`;

writeJson(p("evals", "reports", "redteam_mock_runtime_summary_report.json"), report);
writeText(p("evals", "reports", "redteam_mock_runtime_summary_report.md"), md);

// This report is eval-only; the evidence directory keeps the detailed reports.
fs.existsSync(evidenceDir);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
