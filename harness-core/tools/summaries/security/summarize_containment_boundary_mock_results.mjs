#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-containment-boundary-mock-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

const evidenceDir = p("evidence", "beta-containment-boundary-mock-dry-run");
const report = readJson(path.join(evidenceDir, "containment_boundary_mock_dry_run_report.json"));
const boundarySummary = readJson(path.join(evidenceDir, "containment_boundary_summary.json"));
const severitySummary = readJson(path.join(evidenceDir, "containment_severity_summary.json"));
const noSideEffect = readJson(path.join(evidenceDir, "containment_no_side_effect_report.json"));
const schemaValidation = readJson(path.join(evidenceDir, "containment_schema_validation_report.json"));
const summary = {
  status: report.status === "pass"
    && boundarySummary.status === "pass"
    && noSideEffect.status === "pass"
    && schemaValidation.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  execution_mode: report.execution_mode,
  fixtures_total: report.fixtures_total,
  cases_total: report.cases_total,
  cases_executed_mock: report.cases_executed_mock,
  cases_passed: report.cases_passed,
  cases_failed: report.cases_failed,
  critical_failures: report.critical_failures,
  high_failures: report.high_failures,
  boundary_summary_status: boundarySummary.status,
  severity_summary: severitySummary,
  no_side_effect_status: noSideEffect.status,
  schema_validation_status: schemaValidation.status,
  containment_verified_allowed: false,
  release_gated_allowed: false,
  production_ready_allowed: false
};
const md = `# Containment Boundary Mock Summary Report

Status: ${summary.status}

Stage: ${STAGE}

- Execution mode: ${summary.execution_mode}
- Fixtures total: ${summary.fixtures_total}
- Cases executed mock: ${summary.cases_executed_mock}
- Cases failed: ${summary.cases_failed}
- No side effect status: ${summary.no_side_effect_status}
- Schema validation status: ${summary.schema_validation_status}
`;

writeJson(p("evals", "reports", "containment_boundary_mock_summary_report.json"), summary);
writeText(p("evals", "reports", "containment_boundary_mock_summary_report.md"), md);
writeJson(path.join(evidenceDir, "containment_boundary_mock_summary_report.json"), summary);
writeText(path.join(evidenceDir, "containment_boundary_mock_summary_report.md"), md);

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.status === "pass" ? 0 : 1;
