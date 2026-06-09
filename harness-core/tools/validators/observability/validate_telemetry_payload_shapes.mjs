#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createAjv, validateWithSchema } from "../../lib/json_schema_validator.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-connection-preflight";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-connection-preflight");
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

function validatePayload(label, schemaRelPath, payloadRelPath) {
  const checks = [];
  if (!exists(schemaRelPath)) {
    addCheck(checks, `${label} schema exists`, false, { path: schemaRelPath });
  }
  if (!exists(payloadRelPath)) {
    addCheck(checks, `${label} dry payload exists`, false, { path: payloadRelPath });
  }
  if (checks.some((item) => item.status !== "pass")) {
    return { label, status: "fail", checks };
  }

  const schema = readJson(p(schemaRelPath));
  const payload = readJson(p(payloadRelPath));
  try {
    validateWithSchema(ajv, schema, payload, schemaRelPath);
    addCheck(checks, `${label} payload validates with Ajv`, true, {});
  } catch (error) {
    addCheck(checks, `${label} payload validates with Ajv`, false, { error: error.message });
  }

  const serialized = JSON.stringify(payload);
  const noSecretPatterns = !/sk-[A-Za-z0-9_-]{12,}|authorization|bearer\s+[A-Za-z0-9._-]+|LANGFUSE_SECRET_KEY|OTEL_EXPORTER_OTLP_HEADERS/i.test(serialized);
  addCheck(checks, `${label} dry payload has no secret-looking values`, noSecretPatterns, {});
  addCheck(checks, `${label} payload redacted`, payload.payload_redacted === true, {
    payload_redacted: payload.payload_redacted
  });

  return {
    label,
    status: checks.every((item) => item.status === "pass") ? "pass" : "fail",
    checks
  };
}

const otel = validatePayload(
  "otel",
  "observability/otel/otlp_payload_shape.schema.json",
  "observability/otel/otlp_dry_payload_example.json"
);
const langfuse = validatePayload(
  "langfuse",
  "observability/langfuse/langfuse_payload_shape.schema.json",
  "observability/langfuse/langfuse_dry_payload_example.json"
);

const report = {
  status: otel.status === "pass" && langfuse.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  validation_mode: "redacted_dry_payload_only",
  sink_write_performed: false,
  exporter_network_call_performed: false,
  raw_payload_stored: false,
  otel_payload_shape_valid: otel.status === "pass",
  langfuse_payload_shape_valid: langfuse.status === "pass",
  checks: [
    ...otel.checks.map((item) => ({ ...item, sink: "otel_otlp" })),
    ...langfuse.checks.map((item) => ({ ...item, sink: "langfuse" }))
  ],
  failures: [
    ...otel.checks.filter((item) => item.status !== "pass").map((item) => ({ ...item, sink: "otel_otlp" })),
    ...langfuse.checks.filter((item) => item.status !== "pass").map((item) => ({ ...item, sink: "langfuse" }))
  ]
};
const md = `# Telemetry Payload Shape Report

Status: ${report.status}

Stage: ${STAGE}

- Validation mode: redacted dry payload only
- Sink write performed: false
- Exporter network call performed: false
- Raw payload stored: false
- OTel payload shape valid: ${report.otel_payload_shape_valid}
- Langfuse payload shape valid: ${report.langfuse_payload_shape_valid}

## Checks

${report.checks.map((item) => `- ${item.status}: ${item.sink} ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "otel_payload_shape_report.json"), {
  status: otel.status,
  stage: STAGE,
  sink: "otel_otlp",
  dry_payload_only: true,
  sink_write_performed: false,
  exporter_network_call_performed: false,
  raw_payload_stored: false,
  payload_shape_valid: otel.status === "pass",
  checks: otel.checks
});
writeJson(path.join(evidenceDir, "langfuse_payload_shape_report.json"), {
  status: langfuse.status,
  stage: STAGE,
  sink: "langfuse",
  dry_payload_only: true,
  sink_write_performed: false,
  exporter_network_call_performed: false,
  raw_payload_stored: false,
  payload_shape_valid: langfuse.status === "pass",
  checks: langfuse.checks
});
writeJson(p("evals", "reports", "telemetry_payload_shape_report.json"), report);
writeText(p("evals", "reports", "telemetry_payload_shape_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
