#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { createAjv, compileSchema } from "./lib/json_schema_validator.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-design");
const ajv = createAjv();

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function safeYaml(relPath) {
  try {
    return parseYamlFile(p(relPath));
  } catch (error) {
    return { __error: error.message };
  }
}

const checks = [];
const traceSchema = readJson(p("observability", "trace.schema.json"));
const telemetrySchema = readJson(p("observability", "telemetry.schema.json"));
try {
  compileSchema(ajv, traceSchema, "observability/trace.schema.json");
  addCheck(checks, "trace.schema.json parse and compile", true, {});
} catch (error) {
  addCheck(checks, "trace.schema.json parse and compile", false, { error: error.message });
}
try {
  compileSchema(ajv, telemetrySchema, "observability/telemetry.schema.json");
  addCheck(checks, "telemetry.schema.json parse and compile", true, {});
} catch (error) {
  addCheck(checks, "telemetry.schema.json parse and compile", false, { error: error.message });
}

const policy = safeYaml("observability/production_telemetry_policy.yaml").production_telemetry_policy;
const taxonomy = safeYaml("observability/telemetry_event_taxonomy.yaml");
const metrics = safeYaml("observability/telemetry_metric_catalog.yaml");
const otel = safeYaml("observability/otel/genai_semantic_mapping.yaml").otel_genai_mapping;
const langfuse = safeYaml("observability/langfuse/integration_plan.yaml").langfuse_integration_plan;
const redaction = safeYaml("observability/telemetry_redaction_policy.yaml").telemetry_redaction_policy;
const anomaly = safeYaml("observability/telemetry_anomaly_thresholds.yaml").anomaly_thresholds;
const dashboard = safeYaml("observability/telemetry_dashboard_spec.yaml").telemetry_dashboard_spec;
const gate = safeYaml("release/production_telemetry_gate.yaml").production_telemetry_gate;

for (const relPath of [
  "observability/production_telemetry_policy.yaml",
  "observability/telemetry_event_taxonomy.yaml",
  "observability/telemetry_metric_catalog.yaml",
  "observability/telemetry_redaction_policy.yaml",
  "observability/telemetry_retention_policy.yaml",
  "observability/telemetry_anomaly_thresholds.yaml",
  "observability/telemetry_dashboard_spec.yaml",
  "observability/otel/genai_semantic_mapping.yaml",
  "observability/otel/trace_attribute_mapping.yaml",
  "observability/otel/metric_mapping.yaml",
  "observability/otel/exporter_policy.yaml",
  "observability/langfuse/integration_plan.yaml",
  "observability/langfuse/trace_mapping.yaml",
  "observability/langfuse/score_mapping.yaml",
  "observability/langfuse/dashboard_plan.yaml",
  "release/production_telemetry_gate.yaml"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "production telemetry policy closed", policy?.status === "design_only"
  && policy?.live_telemetry_connected === false
  && policy?.telemetry_sink_write_enabled === false
  && policy?.production_monitored_claim_allowed === false, policy || {});
addCheck(checks, "event taxonomy has required families", [
  "run_lifecycle",
  "provider_execution",
  "structured_output",
  "tool_calling",
  "redteam",
  "release_gate",
  "safety"
].every((family) => taxonomy.event_families?.[family]?.events?.length > 0), {
  families: Object.keys(taxonomy.event_families || {})
});
addCheck(checks, "metric catalog has required metrics", [
  "latency_ms",
  "input_tokens",
  "output_tokens",
  "estimated_cost",
  "case_pass_rate",
  "schema_validation_failure_count",
  "blocked_tool_execution_count",
  "redaction_failure_count",
  "prohibited_claim_count"
].every((metric) => metrics.metrics?.[metric]), {
  metrics: Object.keys(metrics.metrics || {})
});
addCheck(checks, "OTel mapping closed", otel?.stability?.status === "design_only"
  && otel?.stability?.live_emission_enabled === false
  && otel?.internal_to_otel?.provider?.maps_to === "gen_ai.system", otel?.stability || {});
addCheck(checks, "Langfuse integration closed", langfuse?.status === "design_only"
  && langfuse?.live_connection_enabled === false
  && langfuse?.api_call_allowed === false, {
  status: langfuse?.status,
  live_connection_enabled: langfuse?.live_connection_enabled,
  api_call_allowed: langfuse?.api_call_allowed
});
addCheck(checks, "redaction policy valid", redaction?.raw_prompt_stored === false
  && redaction?.raw_response_stored === false
  && redaction?.api_keys_logged === false
  && redaction?.authorization_headers_logged === false
  && redaction?.env_values_logged === false, redaction || {});
addCheck(checks, "anomaly thresholds draft inactive", anomaly?.status === "draft"
  && anomaly?.active_in_production === false
  && anomaly?.safety?.redaction_failure_count_critical === 1, anomaly || {});
addCheck(checks, "dashboard spec draft only", dashboard?.status === "draft"
  && dashboard?.live_dashboard_available === false
  && Array.isArray(dashboard?.panels), {
  status: dashboard?.status,
  live_dashboard_available: dashboard?.live_dashboard_available,
  panels: dashboard?.panels?.length
});
addCheck(checks, "production telemetry gate blocks claims", gate?.status === "design_only"
  && gate?.can_claim_telemetry_connected === false
  && gate?.can_claim_production_monitored === false
  && gate?.can_claim_production_ready === false, gate || {});

const failures = checks.filter((item) => item.status !== "pass");
const report = {
  status: failures.length ? "fail" : "pass",
  stage: STAGE,
  design_only: true,
  live_telemetry_connected: false,
  telemetry_sink_write_enabled: false,
  live_connection_enabled: false,
  telemetry_sink_write_disabled: true,
  checks,
  failures
};
const md = `# Telemetry Design Validation Report

Status: ${report.status}

Stage: ${STAGE}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "telemetry_design_validation_report.json"), report);
writeText(path.join(evidenceDir, "telemetry_design_validation_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
