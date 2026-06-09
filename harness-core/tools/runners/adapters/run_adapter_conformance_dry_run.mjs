#!/usr/bin/env node
import path from "node:path";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { createAjv, loadSchema, validateWithSchema } from "../../lib/json_schema_validator.mjs";
import { loadAdapterFixtures } from "../../lib/adapter_fixture_loader.mjs";
import { runAdapterDryCase } from "../../lib/adapter_dry_run_mapper.mjs";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const ajv = createAjv();

function p(...parts) {
  return path.join(root, ...parts);
}

const adapterPaths = [
  "adapters/api/openai/adapter.yaml",
  "adapters/local/vllm/adapter.yaml",
  "adapters/local/ollama/adapter.yaml"
];

const adapterSchema = loadSchema(p("schemas", "adapter.schema.json"));
const caseSchema = loadSchema(p("schemas", "conformance_case.schema.json"));
const capabilityMatrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));

const adaptersById = new Map();
const failures = [];

for (const adapterPath of adapterPaths) {
  try {
    const adapter = parseYamlFile(p(adapterPath));
    validateWithSchema(ajv, adapterSchema, adapter, adapterPath);
    adaptersById.set(adapter.adapter_id, adapter);
  } catch (error) {
    failures.push({
      case_id: "adapter-load",
      adapter_id: adapterPath,
      status: "fail",
      failures: [error.message]
    });
  }
}

const cases = loadAdapterFixtures(root);
const caseResults = [];
for (const testCase of cases) {
  try {
    const { file, line, ...caseBody } = testCase;
    validateWithSchema(ajv, caseSchema, caseBody, caseBody.case_id);
    caseResults.push({
      ...runAdapterDryCase(caseBody, adaptersById, capabilityMatrix),
      fixture_file: file,
      fixture_line: line
    });
  } catch (error) {
    caseResults.push({
      case_id: testCase.case_id || "unknown",
      adapter_id: testCase.adapter_id || "unknown",
      status: "fail",
      failures: [error.message]
    });
  }
}

const allResults = failures.concat(caseResults);
const failed = allResults.filter((item) => item.status !== "pass");

const report = {
  status: failed.length === 0 ? "pass" : "fail",
  mode: "dry_run_no_provider_execution",
  provider_execution: false,
  local_model_execution: false,
  runtime_execution: false,
  tool_call_execution: false,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: failed.length,
  adapters_checked: [...adaptersById.keys()].sort(),
  claims_allowed: [
    "adapter-dry-run-checked"
  ],
  claims_not_allowed: [
    "adapter-checked",
    "integration-verified",
    "provider-diverse",
    "replay-verified",
    "production-monitored",
    "release-gated"
  ],
  case_results: allResults,
  failures: failed
};

const md = `# Adapter Conformance Dry-run

Status: ${report.status}

Mode: ${report.mode}

- Provider execution: false
- Local model execution: false
- Runtime execution: false
- Tool call execution: false
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Adapters checked: ${report.adapters_checked.join(", ")}

## Claim Boundary

- Allows: adapter-dry-run-checked
- Does not allow: adapter-checked, integration-verified, provider-diverse, replay-verified, production-monitored, release-gated
`;

writeJson(p("evals", "reports", "adapter_conformance_dry_run.json"), report);
writeText(p("evals", "reports", "adapter_conformance_dry_run.md"), md);
writeJson(p("evidence", "beta-preflight", "adapter_dry_run_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
