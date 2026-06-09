#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-broader-redteam-pass-gate-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

const matrix = readJson(p("evidence", "beta-broader-redteam-pass-gate-design", "redteam_coverage_matrix.json"));
const gaps = readJson(p("evidence", "beta-broader-redteam-pass-gate-design", "redteam_gap_analysis.json"));
const surfaces = Object.entries(matrix.surfaces);
const covered = surfaces.filter(([, value]) => value.coverage_status.startsWith("covered")).length;
const blocked = surfaces.filter(([, value]) => value.claim_level === "blocked" || value.coverage_status.startsWith("not_executed")).length;
const report = {
  status: "pass",
  stage: STAGE,
  coverage_status: matrix.overall_coverage_status,
  surfaces_total: surfaces.length,
  surfaces_covered_or_partially_covered: covered,
  surfaces_blocked_or_not_executed: blocked,
  gaps_total: gaps.length,
  high_gaps: gaps.filter((gap) => gap.severity === "high").length,
  medium_gaps: gaps.filter((gap) => gap.severity === "medium").length,
  redteam_passed_allowed: false
};
const md = `# Redteam Coverage Gap Report

Status: ${report.status}

- Coverage status: ${report.coverage_status}
- Surfaces total: ${report.surfaces_total}
- Surfaces covered or partially covered: ${report.surfaces_covered_or_partially_covered}
- Surfaces blocked or not executed: ${report.surfaces_blocked_or_not_executed}
- Gaps total: ${report.gaps_total}
- High gaps: ${report.high_gaps}
- Medium gaps: ${report.medium_gaps}
- Redteam-passed allowed: false
`;

writeJson(p("evals", "reports", "redteam_coverage_gap_report.json"), report);
writeText(p("evals", "reports", "redteam_coverage_gap_report.md"), md);
console.log(JSON.stringify(report, null, 2));
