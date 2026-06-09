#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { relativeTo, toPosix, walkFiles, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-execution-readiness-dashboard-and-blocker-resolution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-execution-readiness-dashboard");
const windowsAbsPattern = /[A-Za-z]:\\/;
const allowedContextFiles = new Set([
  "session_handoff_2026-05-22.md",
  "docs/handoffs/operator_next_steps.md"
]);
const scannedRoots = [
  "release",
  "observability",
  "docs",
  "evals/suites",
  "evidence/beta-execution-readiness-dashboard"
];
const currentReportFiles = new Set([
  "evals/reports/execution_readiness_dashboard_report.json",
  "evals/reports/execution_readiness_dashboard_report.md",
  "evals/reports/blocker_resolution_plan_report.json",
  "evals/reports/blocker_resolution_plan_report.md",
  "evals/reports/execution_readiness_gate_report.json",
  "evals/reports/execution_readiness_gate_report.md"
]);
const selfReportFiles = new Set([
  "evidence/beta-execution-readiness-dashboard/path_portability_audit.json",
  "evals/reports/path_portability_audit_report.json",
  "evals/reports/path_portability_audit_report.md"
]);

function p(...parts) {
  return path.join(root, ...parts);
}

function isUnder(rel, prefix) {
  return rel === prefix || rel.startsWith(`${prefix}/`);
}

const files = walkFiles(root, {
  excludedPaths: [
    "node_modules",
    ".git",
    "dist",
    "evidence/reference-baseline"
  ],
  extensions: [".md", ".json", ".jsonl", ".yaml", ".yml", ".mjs", ".js", ".txt"]
}).filter((file) => {
  const rel = toPosix(relativeTo(root, file));
  if (selfReportFiles.has(rel)) return false;
  return scannedRoots.some((prefix) => isUnder(rel, prefix))
    || currentReportFiles.has(rel)
    || allowedContextFiles.has(rel);
});

const disallowedAbsolutePaths = [];
const allowedContextPaths = [];
for (const file of files) {
  const rel = toPosix(relativeTo(root, file));
  const lines = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (!windowsAbsPattern.test(lines[i])) continue;
    const finding = { file: rel, line: i + 1, context: lines[i].trim() };
    if (allowedContextFiles.has(rel)) {
      allowedContextPaths.push(rel);
    } else {
      disallowedAbsolutePaths.push(finding);
    }
  }
}

const distFiles = fs.existsSync(p("dist"))
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const distModified = !(distFiles.length === 1 && distFiles[0] === "README.md");

const report = {
  status: disallowedAbsolutePaths.length === 0 && distModified === false ? "pass" : "fail",
  stage: STAGE,
  audit_scope: "current readiness artifacts and reusable release/observability/docs configuration",
  windows_absolute_paths_found: disallowedAbsolutePaths,
  allowed_context_paths: [...new Set(allowedContextPaths)],
  disallowed_absolute_paths: disallowedAbsolutePaths,
  dist_modified: distModified,
  node_modules_excluded: true
};
const md = `# Path Portability Audit Report

Status: ${report.status}

Stage: ${STAGE}

- Audit scope: ${report.audit_scope}
- Windows absolute paths found outside allowed context: ${report.windows_absolute_paths_found.length}
- Disallowed absolute paths: ${report.disallowed_absolute_paths.length}
- dist modified: ${report.dist_modified}
- node_modules excluded: true
`;

writeJson(path.join(evidenceDir, "path_portability_audit.json"), report);
writeJson(p("evals", "reports", "path_portability_audit_report.json"), report);
writeText(p("evals", "reports", "path_portability_audit_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
