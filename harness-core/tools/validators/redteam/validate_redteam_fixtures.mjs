#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-redteam-suite-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-redteam-suite-design");

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function listFixtureFiles() {
  const dir = p("evals", "fixtures", "redteam");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .map((file) => path.join(dir, file));
}

function addFailure(failures, file, line, check, detail) {
  failures.push({ file: rel(file), line, check, detail });
}

const ajv = new Ajv({ allErrors: true, strict: false });
const schemaPath = p("security", "redteam", "redteam_case.schema.json");
const taxonomyPath = p("security", "redteam", "redteam_taxonomy.yaml");
const schema = readJson(schemaPath);
const validateCase = ajv.compile(schema);
const taxonomy = parseYamlFile(taxonomyPath);
const categories = taxonomy.categories || {};
const allowedCategories = new Set(Object.keys(categories));
const allowedSurfaces = new Set(Object.values(categories).flatMap((entry) => entry.target_surfaces || []));
const requiredBlockedClaims = new Set(["redteam-passed", "containment-verified", "release-gated"]);
const secretPattern = /sk-[A-Za-z0-9]{8,}|BEGIN (?:RSA|OPENSSH|PRIVATE) KEY|password\s*[:=]|api[_ -]?key\s*[:=]/i;
const sideEffectPattern = /https?:\/\/|curl\s|wget\s|powershell|cmd\.exe|rm\s+-rf|\/etc\/|[A-Za-z]:\\|\.ssh\/|file:\/\//i;
const files = listFixtureFiles();
const failures = [];
let casesTotal = 0;

for (const file of files) {
  const lines = readText(file).split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 3) {
    addFailure(failures, file, 0, "minimum_cases", `expected at least 3 cases, got ${lines.length}`);
  }
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    let data;
    try {
      data = JSON.parse(lines[index]);
    } catch (error) {
      addFailure(failures, file, lineNumber, "json_parse", error.message);
      continue;
    }
    casesTotal += 1;
    if (!validateCase(data)) {
      addFailure(failures, file, lineNumber, "schema", ajv.errorsText(validateCase.errors));
      continue;
    }
    if (!allowedCategories.has(data.category)) {
      addFailure(failures, file, lineNumber, "category", `${data.category} not present in taxonomy`);
    }
    if (!allowedSurfaces.has(data.target_surface)) {
      addFailure(failures, file, lineNumber, "target_surface", `${data.target_surface} not present in taxonomy target surfaces`);
    }
    for (const claim of requiredBlockedClaims) {
      if (!data.claims_not_allowed.includes(claim)) {
        addFailure(failures, file, lineNumber, "claims_not_allowed", `${claim} missing`);
      }
    }
    if (secretPattern.test(data.input)) {
      addFailure(failures, file, lineNumber, "secret_pattern", "secret-looking fixture input");
    }
    if (sideEffectPattern.test(data.input)) {
      addFailure(failures, file, lineNumber, "side_effect_pattern", "side-effect-looking fixture input");
    }
  }
}

const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  design_only: true,
  actual_redteam_execution: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  fixture_files_total: files.length,
  fixture_cases_total: casesTotal,
  fixture_validation_passed: failures.length === 0,
  schema_path: "security/redteam/redteam_case.schema.json",
  taxonomy_path: "security/redteam/redteam_taxonomy.yaml",
  failures
};

const md = `# Redteam Fixture Validation Report

Status: ${report.status}

Stage: ${STAGE}

- Fixture files total: ${report.fixture_files_total}
- Fixture cases total: ${report.fixture_cases_total}
- Fixture validation passed: ${report.fixture_validation_passed}
- Actual redteam execution: false
- Provider execution: false
- Local model execution: false
- External side effects: false
`;

writeJson(path.join(evidenceDir, "redteam_fixture_validation_report.json"), report);
writeText(path.join(evidenceDir, "redteam_fixture_validation_report.md"), md);

const designReportPath = path.join(evidenceDir, "redteam_suite_design_report.json");
if (fs.existsSync(designReportPath)) {
  const designReport = readJson(designReportPath);
  designReport.fixture_validation_passed = report.fixture_validation_passed;
  designReport.fixture_files_total = report.fixture_files_total;
  designReport.fixture_cases_total = report.fixture_cases_total;
  designReport.status = report.status;
  designReport.failures = failures;
  writeJson(designReportPath, designReport);
  writeJson(p("evals", "reports", "redteam_suite_design_report.json"), designReport);
}

const indexPath = path.join(evidenceDir, "redteam_fixture_index.json");
if (fs.existsSync(indexPath)) {
  const fixtureIndex = readJson(indexPath);
  fixtureIndex.fixture_validation_passed = report.fixture_validation_passed;
  writeJson(indexPath, fixtureIndex);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
