#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-containment-boundary-verification-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

function p(...parts) {
  return path.join(root, ...parts);
}

const coveragePath = p("evidence", "beta-containment-boundary-verification-design", "containment_coverage_matrix.json");
const fixtureIndexPath = p("evidence", "beta-containment-boundary-verification-design", "containment_fixture_index.json");
const coverage = fs.existsSync(coveragePath) ? readJson(coveragePath) : null;
const fixtureIndex = fs.existsSync(fixtureIndexPath) ? readJson(fixtureIndexPath) : null;
const boundaryCount = coverage?.boundaries ? Object.keys(coverage.boundaries).length : 0;
const report = {
  status: coverage?.status === "partial_design_only"
    && boundaryCount === 9
    && coverage?.containment_verified_allowed === false
    && fixtureIndex?.fixtures_total === 18
    ? "pass"
    : "fail",
  stage: STAGE,
  coverage_matrix_status: coverage?.status || "missing",
  boundary_count: boundaryCount,
  fixtures_total: fixtureIndex?.fixtures_total ?? null,
  containment_verified_allowed: coverage?.containment_verified_allowed ?? null,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  external_side_effects: false,
  coverage_matrix_path: "evidence/beta-containment-boundary-verification-design/containment_coverage_matrix.json"
};
const md = `# Containment Coverage Matrix Report

Status: ${report.status}

Stage: ${STAGE}

- Coverage matrix status: ${report.coverage_matrix_status}
- Boundary count: ${report.boundary_count}
- Fixtures total: ${report.fixtures_total}
- Containment verified allowed: ${report.containment_verified_allowed}
`;

writeJson(p("evals", "reports", "containment_coverage_matrix_report.json"), report);
writeText(p("evals", "reports", "containment_coverage_matrix_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;
