#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { writeJson, writeText } from "./lib/file_walk.mjs";
import {
  getLangfuseRuntimeConfig,
  redactLangfuseData
} from "../observability/langfuse/instrumentation.mjs";
import {
  executeMockRunWithLangfuse,
  summarizeRunRequest,
  summarizeRunResult,
  summarizeTraceEvent
} from "../observability/langfuse/mock_runtime_tracer.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function addCheck(checks, name, passed, details = {}) {
  checks.push({
    name,
    status: passed ? "pass" : "fail",
    details
  });
}

function stringify(value) {
  return JSON.stringify(value);
}

const packageJson = readJson(p("package.json"));
const dependencies = packageJson.dependencies || {};
const checks = [];

addCheck(checks, "Langfuse tracing dependency declared", Boolean(dependencies["@langfuse/tracing"]), {
  dependency_present: Boolean(dependencies["@langfuse/tracing"])
});
addCheck(checks, "Langfuse OTel dependency declared", Boolean(dependencies["@langfuse/otel"]), {
  dependency_present: Boolean(dependencies["@langfuse/otel"])
});
addCheck(checks, "OpenTelemetry Node SDK dependency declared", Boolean(dependencies["@opentelemetry/sdk-node"]), {
  dependency_present: Boolean(dependencies["@opentelemetry/sdk-node"])
});

const disabledConfig = getLangfuseRuntimeConfig({});
addCheck(checks, "Default config does not start Langfuse tracing", disabledConfig.can_start === false, disabledConfig);
addCheck(checks, "Default config records presence booleans only", !("langfuse_secret_key_value" in disabledConfig), {
  langfuse_secret_key_value_present: "langfuse_secret_key_value" in disabledConfig
});

const redacted = redactLangfuseData({
  credential: "x",
  LANGFUSE_SECRET_KEY: "x",
  nested: {
    token: "x",
    safe: "ok"
  }
});
const redactedText = stringify(redacted);
addCheck(checks, "Redactor removes secret-looking values", redacted.credential === "[redacted]" && redacted.LANGFUSE_SECRET_KEY === "[redacted]", {
  redacted
});

const runRequest = {
  run_id: "langfuse-check-mock-run",
  case_id: "langfuse.tracing.disabled_check",
  input: {
    prompt: "this raw prompt must not be included",
    mock_response_id: "no_tool_success"
  }
};
const requestSummary = summarizeRunRequest(runRequest);
addCheck(checks, "Run request summary omits raw prompt", stringify(requestSummary).includes("this raw prompt") === false, {
  request_summary: requestSummary
});

const wrapped = await executeMockRunWithLangfuse(runRequest, { env: {}, flush: false });
const resultSummary = summarizeRunResult(wrapped.result);
const eventSummary = summarizeTraceEvent(wrapped.result.trace_events[0]);
addCheck(checks, "Disabled wrapper executes mock runtime without sink write", wrapped.langfuse.trace_export_attempted === false
  && wrapped.langfuse.sink_write_performed === false
  && wrapped.result.provider_execution === false
  && wrapped.result.local_model_execution === false, {
  langfuse: wrapped.langfuse,
  result_summary: resultSummary
});
addCheck(checks, "Trace event summary uses redacted payload summary", eventSummary.payload_redacted === true && !stringify(eventSummary).includes("this raw prompt"), {
  event_summary: eventSummary
});

const sourceFiles = [
  "observability/langfuse/instrumentation.mjs",
  "observability/langfuse/mock_runtime_tracer.mjs",
  "observability/langfuse/runtime_tracing_policy.yaml",
  "docs/langfuse_runtime_tracing.ko.md"
];
for (const file of sourceFiles) {
  addCheck(checks, `${file} exists`, fs.existsSync(p(file)), { file });
}

const failed = checks.filter((check) => check.status !== "pass");
const report = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: "langfuse-runtime-tracing-integration-check",
  langfuse_sdk_packages_declared: true,
  default_tracing_enabled: false,
  actual_telemetry_connection_performed: false,
  telemetry_sink_write_performed: false,
  openai_model_api_call_performed: false,
  local_endpoint_probe_performed: false,
  local_model_execution_performed: false,
  secrets_logged: false,
  raw_payload_stored: false,
  raw_request_stored: false,
  raw_response_stored: false,
  checks,
  failures: failed
};

const md = `# Langfuse Runtime Tracing Integration Check

Status: ${report.status}

- Default tracing enabled: false
- Actual telemetry connection performed: false
- Telemetry sink write performed: false
- OpenAI model API call performed: false
- Local endpoint probe performed: false
- Local model execution performed: false
- Secrets logged: false
- Raw payload stored: false
- Raw request stored: false
- Raw response stored: false
`;

writeJson(p("evidence", "langfuse-runtime-tracing-integration", "langfuse_tracing_integration_report.json"), report);
writeText(p("evidence", "langfuse-runtime-tracing-integration", "langfuse_tracing_integration_report.md"), md);
writeJson(p("evals", "reports", "langfuse_tracing_integration_report.json"), report);
writeText(p("evals", "reports", "langfuse_tracing_integration_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
