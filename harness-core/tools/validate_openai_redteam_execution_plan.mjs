#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";
import { parseYamlFile } from "./lib/yaml_loader.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-execution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-execution-plan");

const requiredBlockedClaims = new Set(["redteam-passed", "containment-verified", "release-gated"]);
const secretPattern = /sk-[A-Za-z0-9]{8,}|BEGIN (?:RSA|OPENSSH|PRIVATE) KEY|password\s*[:=]|api[_ -]?key\s*[:=]/i;
const sideEffectPattern = /https?:\/\/|curl\s|wget\s|powershell|cmd\.exe|rm\s+-rf|\/etc\/|[A-Za-z]:\\|\.ssh\/|file:\/\//i;

function p(...parts) {
  return path.join(root, ...parts);
}

function readJsonl(file) {
  return readText(file).split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function sourceFixtureCaseExists(caseData) {
  const sourcePath = p(caseData.source_fixture);
  if (!fs.existsSync(sourcePath)) return false;
  return readJsonl(sourcePath).some((item) => item.case_id === caseData.case_id);
}

function addFailure(failures, caseId, check, detail) {
  failures.push({ case_id: caseId, check, detail });
}

const policy = parseYamlFile(p("security", "redteam", "openai_redteam_case_selection_policy.yaml"));
const guardPolicy = parseYamlFile(p("security", "redteam", "openai_limited_execution_policy.yaml"));
const selected = readJsonl(p("evals", "fixtures", "redteam_openai_limited", "openai_limited_case_subset.jsonl"));
const selection = readJson(path.join(evidenceDir, "openai_limited_case_selection.json"));
const failures = [];
const included = new Set(policy.included_categories || []);
const maxCases = policy.selection_rules?.max_cases_total || 12;
const severityCounts = selected.reduce((acc, item) => {
  acc[item.severity] = (acc[item.severity] || 0) + 1;
  return acc;
}, {});

if (selected.length > maxCases) addFailure(failures, "all", "max_cases_total", `${selected.length} > ${maxCases}`);
if ((severityCounts.critical || 0) > policy.selection_rules.max_critical_cases) {
  addFailure(failures, "all", "max_critical_cases", severityCounts.critical);
}
if ((severityCounts.high || 0) > policy.selection_rules.max_high_cases) {
  addFailure(failures, "all", "max_high_cases", severityCounts.high);
}
if ((severityCounts.medium || 0) > policy.selection_rules.max_medium_cases) {
  addFailure(failures, "all", "max_medium_cases", severityCounts.medium);
}

for (const item of selected) {
  if (!included.has(item.category)) addFailure(failures, item.case_id, "category_allowlist", item.category);
  if (item.target_surface !== "openai_limited_redteam") addFailure(failures, item.case_id, "target_surface", item.target_surface);
  if (!["openai_no_tool", "openai_structured_output", "openai_tool_calling_mock_tools"].includes(item.provider_surface)) {
    addFailure(failures, item.case_id, "provider_surface", item.provider_surface);
  }
  if (!item.execution_constraints?.store_false) addFailure(failures, item.case_id, "store_false", "not enforced");
  if (item.execution_constraints?.external_side_effect_allowed !== false) {
    addFailure(failures, item.case_id, "external_side_effect_allowed", item.execution_constraints?.external_side_effect_allowed);
  }
  if (item.provider_surface === "openai_no_tool"
    && (item.execution_constraints.tools_allowed !== false || item.execution_constraints.structured_output_allowed !== false)) {
    addFailure(failures, item.case_id, "no_tool_constraints", item.execution_constraints);
  }
  if (item.provider_surface === "openai_structured_output"
    && (item.execution_constraints.tools_allowed !== false || item.execution_constraints.structured_output_allowed !== true)) {
    addFailure(failures, item.case_id, "structured_output_constraints", item.execution_constraints);
  }
  if (item.provider_surface === "openai_tool_calling_mock_tools"
    && (item.execution_constraints.tools_allowed !== true || item.execution_constraints.mock_tools_only !== true)) {
    addFailure(failures, item.case_id, "tool_calling_constraints", item.execution_constraints);
  }
  if (item.execution_constraints?.max_output_tokens > 256) addFailure(failures, item.case_id, "max_output_tokens", item.execution_constraints.max_output_tokens);
  if (secretPattern.test(item.input)) addFailure(failures, item.case_id, "secret_pattern", "secret-looking input");
  if (sideEffectPattern.test(item.input)) addFailure(failures, item.case_id, "side_effect_pattern", "side-effect-looking input");
  if (!sourceFixtureCaseExists(item)) addFailure(failures, item.case_id, "source_fixture_case", item.source_fixture);
  for (const claim of requiredBlockedClaims) {
    if (!item.claims_not_allowed.includes(claim)) {
      addFailure(failures, item.case_id, "claims_not_allowed", `${claim} missing`);
    }
  }
}

const guard = guardPolicy.openai_limited_redteam_execution_guard;
if (guard?.can_execute_provider_redteam !== false) {
  addFailure(failures, "guard", "can_execute_provider_redteam", guard?.can_execute_provider_redteam);
}

const requiredPolicies = [
  "security/redteam/openai_redteam_cost_bound_policy.yaml",
  "security/redteam/openai_redteam_stop_criteria.yaml",
  "security/redteam/openai_redteam_redaction_policy.yaml",
  "security/redteam/openai_redteam_trace_policy.yaml",
  "release/openai_redteam_limited_execution_gate.yaml"
];
for (const relPath of requiredPolicies) {
  if (!fs.existsSync(p(relPath))) addFailure(failures, "policy", "missing", relPath);
}

const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  design_only: true,
  actual_redteam_execution: false,
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  selected_cases_total: selected.length,
  excluded_cases_total: selection.excluded_cases_total,
  max_cases_total: maxCases,
  can_execute_provider_redteam: false,
  failures
};
const md = `# OpenAI Redteam Execution Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Design only: true
- Selected cases: ${report.selected_cases_total}
- Excluded cases: ${report.excluded_cases_total}
- Can execute provider redteam: false
- Failures: ${failures.length}
`;

writeJson(p("evals", "reports", "openai_redteam_execution_gate_report.json"), report);
writeText(p("evals", "reports", "openai_redteam_execution_gate_report.md"), md);
writeJson(path.join(evidenceDir, "openai_redteam_plan_validation_report.json"), report);
writeText(path.join(evidenceDir, "openai_redteam_plan_validation_report.md"), md);

// Ensure policy files remain parseable and copied snapshots are faithful YAML.
for (const relPath of requiredPolicies) YAML.parse(readText(p(relPath)));

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
