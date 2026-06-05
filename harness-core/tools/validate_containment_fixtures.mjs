#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-containment-boundary-verification-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const fixtureFiles = [
  "approval_boundary_cases.jsonl",
  "tool_execution_boundary_cases.jsonl",
  "external_side_effect_boundary_cases.jsonl",
  "file_write_boundary_cases.jsonl",
  "shell_execution_boundary_cases.jsonl",
  "network_boundary_cases.jsonl",
  "raw_storage_boundary_cases.jsonl",
  "trace_redaction_boundary_cases.jsonl",
  "tool_output_reclassification_cases.jsonl"
];
const allowedBoundaries = new Set([
  "approval_boundary",
  "tool_execution_boundary",
  "external_side_effect_boundary",
  "file_write_boundary",
  "shell_execution_boundary",
  "network_boundary",
  "raw_storage_boundary",
  "trace_redaction_boundary",
  "tool_output_trust_boundary"
]);
const requiredFields = [
  "case_id",
  "boundary",
  "severity",
  "purpose",
  "input",
  "expected_boundary_behavior",
  "must_not_happen",
  "evidence_required",
  "claim_if_passed",
  "claims_not_allowed"
];
const severities = new Set(["low", "medium", "high", "critical"]);
const forbiddenIntentPatterns = [
  /https?:\/\//i,
  /\bcurl\b/i,
  /\bpowershell\b/i,
  /\bInvoke-WebRequest\b/i,
  /\brm\s+-rf\b/i,
  /\bdel\s+/i,
  /\bRemove-Item\b/i
];

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return { exists: false, items: [], errors: ["file_missing"] };
  const lines = fs.readFileSync(file, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const items = [];
  const errors = [];
  lines.forEach((line, index) => {
    try {
      items.push(JSON.parse(line));
    } catch (error) {
      errors.push(`line_${index + 1}_invalid_json:${error.message}`);
    }
  });
  return { exists: true, items, errors };
}

function validateCase(item) {
  const errors = [];
  for (const field of requiredFields) {
    if (!(field in item)) errors.push(`missing_${field}`);
  }
  if (!allowedBoundaries.has(item.boundary)) errors.push("invalid_boundary");
  if (!severities.has(item.severity)) errors.push("invalid_severity");
  if (!Array.isArray(item.must_not_happen)) errors.push("must_not_happen_not_array");
  if (!Array.isArray(item.evidence_required)) errors.push("evidence_required_not_array");
  if (!Array.isArray(item.claims_not_allowed)) errors.push("claims_not_allowed_not_array");
  if (!item.claims_not_allowed?.includes?.("containment-verified")) errors.push("containment_claim_not_blocked");
  if (item.claim_if_passed !== "containment-boundary-case-designed") errors.push("unexpected_claim_if_passed");
  const serialized = JSON.stringify(item);
  for (const pattern of forbiddenIntentPatterns) {
    if (pattern.test(serialized)) errors.push(`forbidden_executable_or_url_pattern:${pattern.source}`);
  }
  return errors;
}

const fileResults = [];
const allErrors = [];
let totalCases = 0;

for (const fixtureFile of fixtureFiles) {
  const relPath = `evals/fixtures/containment/${fixtureFile}`;
  const file = p(...relPath.split("/"));
  const result = readJsonl(file);
  const caseErrors = [];
  result.items.forEach((item, index) => {
    const errors = validateCase(item);
    if (errors.length > 0) {
      caseErrors.push({ line: index + 1, case_id: item.case_id || null, errors });
    }
  });
  const errors = [
    ...result.errors,
    ...(result.items.length < 2 ? ["less_than_two_cases"] : []),
    ...caseErrors.map((entry) => `${entry.case_id || `line_${entry.line}`}:${entry.errors.join(",")}`)
  ];
  totalCases += result.items.length;
  if (errors.length > 0) allErrors.push({ path: relPath, errors });
  fileResults.push({
    path: relPath,
    exists: result.exists,
    cases: result.items.length,
    status: errors.length === 0 ? "pass" : "fail",
    errors
  });
}

const report = {
  status: allErrors.length === 0 && totalCases === 18 ? "pass" : "fail",
  stage: STAGE,
  fixture_files_expected: fixtureFiles.length,
  fixture_files_checked: fileResults.length,
  fixtures_total: totalCases,
  minimum_cases_per_file: 2,
  new_provider_execution: false,
  new_redteam_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  external_side_effects: false,
  file_results: fileResults,
  failures: allErrors
};
const md = `# Containment Fixture Validation Report

Status: ${report.status}

Stage: ${STAGE}

- Fixture files checked: ${fileResults.length}
- Fixtures total: ${totalCases}
- New provider execution: false
- New redteam execution: false
- Local model execution: false
- Telemetry connection: false
- External side effects: false
`;

writeJson(p("evals", "reports", "containment_fixture_validation_report.json"), report);
writeText(p("evals", "reports", "containment_fixture_validation_report.md"), md);
writeJson(p("evidence", "beta-containment-boundary-verification-design", "containment_fixture_validation_report.json"), report);
writeText(p("evidence", "beta-containment-boundary-verification-design", "containment_fixture_validation_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "pass" ? 0 : 1;
