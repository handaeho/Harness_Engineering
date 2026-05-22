#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile, yamlParserStatus } from "./lib/yaml_loader.mjs";
import { createAjv, jsonSchemaValidatorStatus, loadSchema, validateWithSchema, compileSchema } from "./lib/json_schema_validator.mjs";
import { readJson, walkFiles, relativeTo, writeJson, writeText } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-preflight");

const checks = [];
const errors = [];
const warnings = [];
const ajv = createAjv();

function p(...parts) {
  return path.join(root, ...parts);
}

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, status: "pass", detail });
  } catch (error) {
    checks.push({ name, status: "fail", detail: error.message });
    errors.push(`${name}: ${error.message}`);
  }
}

function validateSchemaFile(file) {
  const schema = loadSchema(p(file));
  compileSchema(ajv, schema, file);
  return schema;
}

function assertNoProviderTokenInCoreSpec() {
  const providerTokens = ["OpenAI", "Anthropic", "Claude", "Gemini", "vLLM", "Ollama", "tokenizer", "Responses API"];
  const matches = [];
  const files = walkFiles(p("core", "spec"), {
    extensions: [".md", ".yaml", ".json"]
  });
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    for (const token of providerTokens) {
      if (text.includes(token)) {
        matches.push({ file: relativeTo(root, file), token });
      }
    }
  }
  if (matches.length) throw new Error(JSON.stringify(matches));
  return { checked_files: files.map((file) => relativeTo(root, file)), provider_tokens: providerTokens };
}

check("required files exist", () => {
  const fixture = readJson(p("evals", "fixtures", "static", "required_files.json"));
  const missing = fixture.required_inputs.filter((file) => !fs.existsSync(p(file)));
  if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
  return { checked: fixture.required_inputs.length };
});

check("package lock exists", () => {
  if (!fs.existsSync(p("package.json"))) throw new Error("package.json missing");
  if (!fs.existsSync(p("package-lock.json"))) throw new Error("package-lock.json missing");
  return { package_json: true, package_lock: true };
});

check("YAML parser dependency is active", () => {
  if (!yamlParserStatus.external_parser_available || yamlParserStatus.fallback_used) {
    throw new Error("external YAML parser unavailable or fallback used");
  }
  return yamlParserStatus;
});

check("JSON Schema validator dependency is active", () => {
  if (!jsonSchemaValidatorStatus.external_validator_available || jsonSchemaValidatorStatus.fallback_used) {
    throw new Error("Ajv unavailable or fallback used");
  }
  return jsonSchemaValidatorStatus;
});

check("all JSON files parse", () => {
  const files = walkFiles(root, {
    excludedPaths: ["node_modules", ".git"],
    extensions: [".json"]
  });
  for (const file of files) JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  return { checked: files.length };
});

check("all YAML files parse with yaml package", () => {
  const files = walkFiles(root, {
    excludedPaths: ["node_modules", ".git"],
    extensions: [".yaml", ".yml"]
  });
  for (const file of files) parseYamlFile(file);
  return { checked: files.map((file) => relativeTo(root, file)), parser: "yaml" };
});

check("all JSON Schema files compile with Ajv", () => {
  const files = walkFiles(p("schemas"), { extensions: [".schema.json"] })
    .concat(walkFiles(root, { excludedPaths: ["node_modules", ".git"], extensions: [".schema.json"] }));
  const unique = [...new Set(files.map((file) => path.resolve(file)))];
  for (const file of unique) compileSchema(ajv, readJson(file), relativeTo(root, file));
  return { checked: unique.map((file) => relativeTo(root, file)), validator: "ajv" };
});

check("stack.yaml validates against schemas/stack.schema.json", () => {
  validateWithSchema(ajv, loadSchema(p("schemas", "stack.schema.json")), parseYamlFile(p("stack.yaml")), "stack.yaml");
  return { schema: "schemas/stack.schema.json" };
});

check("AGENTS.md System of Record entrypoint is declared", () => {
  const stack = parseYamlFile(p("stack.yaml"));
  if (!fs.existsSync(p("AGENTS.md"))) throw new Error("AGENTS.md missing");
  if (!fs.existsSync(p("MANIFEST.asset_classes.yaml"))) throw new Error("MANIFEST.asset_classes.yaml missing");
  if (stack.agent_entrypoint?.path !== "AGENTS.md") throw new Error("agent_entrypoint.path must be AGENTS.md");
  if (stack.asset_class_manifest?.path !== "MANIFEST.asset_classes.yaml") {
    throw new Error("asset_class_manifest.path must be MANIFEST.asset_classes.yaml");
  }
  if (!Array.isArray(stack.source_of_truth?.agent_index) || !stack.source_of_truth.agent_index.includes("AGENTS.md")) {
    throw new Error("source_of_truth.agent_index must include AGENTS.md");
  }
  return {
    agent_entrypoint: stack.agent_entrypoint.path,
    asset_class_manifest: stack.asset_class_manifest.path
  };
});

check("adapter.yaml files validate against schemas/adapter.schema.json", () => {
  const schema = loadSchema(p("schemas", "adapter.schema.json"));
  const adapters = [
    "adapters/api/openai/adapter.yaml",
    "adapters/local/vllm/adapter.yaml",
    "adapters/local/ollama/adapter.yaml"
  ];
  for (const adapter of adapters) {
    validateWithSchema(ajv, schema, parseYamlFile(p(adapter)), adapter);
  }
  return { checked: adapters };
});

check("provider_capability_matrix.yaml validates against schema", () => {
  validateWithSchema(
    ajv,
    loadSchema(p("schemas", "capability_matrix.schema.json")),
    parseYamlFile(p("adapters", "provider_capability_matrix.yaml")),
    "adapters/provider_capability_matrix.yaml"
  );
  return { schema: "schemas/capability_matrix.schema.json" };
});

check("release_gate.yaml validates and blocks forbidden claims", () => {
  const gate = parseYamlFile(p("release", "release_gate.yaml"));
  validateWithSchema(ajv, loadSchema(p("schemas", "release_gate.schema.json")), gate, "release/release_gate.yaml");
  let containmentVerifiedConditionallyAllowed = false;
  try {
    const decision = readJson(p("evidence", "beta-containment-verified-decision-gate", "containment_verified_decision_report.json"));
    containmentVerifiedConditionallyAllowed = decision.status === "containment_verified_decision_approved"
      && decision.owner_final_decision_present === true
      && decision.owner_final_decision === "approve_containment_verified"
      && decision.containment_verified_allowed === true
      && decision.release_gated_allowed === false
      && decision.production_ready_allowed === false;
  } catch {
    containmentVerifiedConditionallyAllowed = false;
  }
  const requiredBlocked = [
    "adapter-checked",
    "provider-verified",
    "runtime-verified",
    "tool-call-verified",
    "schema-output-verified",
    "telemetry-connected",
    "production-ready",
    "production-monitored",
    "replay-verified",
    "benchmark-backed",
    "provider-diverse",
    "integration-verified",
    "stable",
    "release-gated"
  ];
  if (!containmentVerifiedConditionallyAllowed) {
    requiredBlocked.push("containment-verified");
  }
  const blocked = new Set(gate.prohibited_positive_claims || []);
  const missing = requiredBlocked.filter((claim) => !blocked.has(claim));
  if (missing.length) throw new Error(`release gate missing blocked claims: ${missing.join(", ")}`);
  return { blocked_count: blocked.size, containment_verified_conditionally_allowed: containmentVerifiedConditionallyAllowed };
});

check("observability schemas register with Ajv", () => {
  const trace = validateSchemaFile("observability/trace.schema.json");
  const telemetry = validateSchemaFile("observability/telemetry.schema.json");
  return { registered: ["observability/trace.schema.json", "observability/telemetry.schema.json"] };
});

check("schema copies register with Ajv", () => {
  const trace = validateSchemaFile("schemas/trace.schema.json");
  const telemetry = validateSchemaFile("schemas/telemetry.schema.json");
  return { registered: ["schemas/trace.schema.json", "schemas/telemetry.schema.json"] };
});

check("core/spec remains provider-neutral", assertNoProviderTokenInCoreSpec);

check("dist boundary", () => {
  const files = fs.readdirSync(p("dist")).filter((file) => fs.statSync(p("dist", file)).isFile());
  if (files.length !== 1 || files[0] !== "README.md") throw new Error(`dist files: ${files.join(", ")}`);
  return { files };
});

check("provider capability matrix has no true or verified feature values", () => {
  const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
  const bad = [];
  const forbidden = new Set(["true", "verified", "production", "production_monitored", "integration_verified"]);
  for (const [provider, values] of Object.entries(matrix.providers || {})) {
    for (const [key, value] of Object.entries(values)) {
      if (value === true || forbidden.has(String(value))) {
        bad.push({ provider, key, value });
      }
    }
  }
  if (bad.length) throw new Error(JSON.stringify(bad));
  return { providers_checked: Object.keys(matrix.providers || {}) };
});

const status = errors.length === 0 ? "pass" : "fail";
const report = {
  status,
  generated_at: new Date().toISOString(),
  stage: "v2.0.0-beta-preflight",
  parser_status: {
    yaml: yamlParserStatus,
    json_schema: jsonSchemaValidatorStatus
  },
  checks,
  fallback_used: false,
  warnings,
  errors,
  runner_reexecution: {
    v36_runners_reexecuted: false,
    provider_execution: false,
    local_model_execution: false,
    runtime_execution_loop_implemented: false,
    live_telemetry_connected: false
  },
  claims_allowed_after_pass: [
    "harness-designed",
    "static-structure-created",
    "baseline-snapshotted",
    "adapter-skeleton-created",
    "alpha-static-validated",
    "dependency-static-validated"
  ],
  claims_blocked: [
    "adapter-checked",
    "provider-verified",
    "runtime-verified",
    "tool-call-verified",
    "schema-output-verified",
    "telemetry-connected",
    "production-ready",
    "production-monitored",
    "containment-verified",
    "replay-verified",
    "benchmark-backed",
    "provider-diverse",
    "integration-verified",
    "stable",
    "release-gated"
  ]
};

try {
  validateWithSchema(ajv, loadSchema(p("schemas", "validation_report.schema.json")), report, "dependency_validation_report");
} catch (error) {
  report.status = "fail";
  report.errors.push(`validation report schema check failed: ${error.message}`);
}

const finalStatus = report.errors.length === 0 ? "pass" : "fail";
report.status = finalStatus;

const md = `# Dependency Validation Report

Status: ${report.status}

Stage: v2.0.0-beta-preflight

## Parser Status

- YAML parser: ${yamlParserStatus.parser}
- YAML fallback used: ${yamlParserStatus.fallback_used}
- JSON Schema validator: ${jsonSchemaValidatorStatus.validator}
- JSON Schema fallback used: ${jsonSchemaValidatorStatus.fallback_used}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Warnings

${warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : "- none"}

## Errors

${report.errors.length ? report.errors.map((item) => `- ${item}`).join("\n") : "- none"}

## Execution Boundary

- Provider execution: false
- Local model execution: false
- Runtime execution loop implemented: false
- Live telemetry connected: false
- v36 runners re-executed: false
`;

writeJson(p("evidence", "beta-preflight", "dependency_validation_report.json"), report);
writeText(p("evidence", "beta-preflight", "dependency_validation_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
