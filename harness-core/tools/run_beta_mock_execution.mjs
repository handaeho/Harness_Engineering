#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createAjv, loadSchema, validateWithSchema } from "./lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "./lib/file_walk.mjs";
import { executeMockRunWithLangfuse } from "../observability/langfuse/mock_runtime_tracer.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const ajv = createAjv();
const claimsAllowed = [
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated"
];
const claimsNotAllowed = [
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
  "release-gated"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function loadJsonl(file) {
  return readText(file)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => ({
      file,
      line: index + 1,
      value: JSON.parse(line)
    }));
}

function loadRuntimeCases() {
  const fixtureDir = p("evals", "fixtures", "runtime");
  const files = fs.readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".jsonl"))
    .sort()
    .map((file) => path.join(fixtureDir, file));
  return files.flatMap((file) => loadJsonl(file));
}

function hasEvery(actual, expected) {
  return expected.every((item) => actual.includes(item));
}

function registerSchemas() {
  const stateTransitionSchema = loadSchema(p("runtime", "schemas", "state_transition.schema.json"));
  ajv.addSchema(stateTransitionSchema, stateTransitionSchema.$id);
}

function validateTraceEvents(traceSchema, traceEvents) {
  const failures = [];
  for (const event of traceEvents) {
    try {
      validateWithSchema(ajv, traceSchema, event, `${event.run_id}/${event.event_id}`);
    } catch (error) {
      failures.push(error.message);
    }
  }
  return failures;
}

registerSchemas();

const runRequestSchema = loadSchema(p("runtime", "schemas", "run_request.schema.json"));
const runResultSchema = loadSchema(p("runtime", "schemas", "run_result.schema.json"));
const traceSchema = loadSchema(p("observability", "trace.schema.json"));

const cases = loadRuntimeCases();
const caseResults = [];
const traceLines = [];
let blockedToolsRequested = 0;
let blockedToolsExecuted = 0;
let mockToolsExecuted = 0;
let stateTransitionsRecorded = 0;
let traceSchemaValid = true;
let langfuseTraceExportAttemptCount = 0;
let langfuseSinkWriteCount = 0;
const approvalCases = [];
const stateCases = [];
const schemaCases = [];

for (const record of cases) {
  const testCase = record.value;
  const failures = [];
  let result = null;

  try {
    validateWithSchema(ajv, runRequestSchema, testCase.run_request, `${testCase.case_id} run_request`);
    const execution = await executeMockRunWithLangfuse(testCase.run_request, { env: process.env });
    result = execution.result;
    if (execution.langfuse.trace_export_attempted) langfuseTraceExportAttemptCount += 1;
    if (execution.langfuse.sink_write_performed) langfuseSinkWriteCount += 1;
    validateWithSchema(ajv, runResultSchema, result, `${testCase.case_id} run_result`);
  } catch (error) {
    failures.push(error.message);
  }

  if (result) {
    const eventTypes = result.trace_events.map((event) => event.event_type);
    const transitionStates = result.state_transitions.map((transition) => transition.to_state);

    const traceFailures = validateTraceEvents(traceSchema, result.trace_events);
    if (traceFailures.length) {
      traceSchemaValid = false;
      failures.push(...traceFailures);
    }

    if (!hasEvery(eventTypes, testCase.expected_events || [])) {
      failures.push(`missing expected events: ${(testCase.expected_events || []).filter((event) => !eventTypes.includes(event)).join(", ")}`);
    }

    if (!hasEvery(result.blocked_tools, testCase.expected_blocked_tools || [])) {
      failures.push(`missing expected blocked tools: ${(testCase.expected_blocked_tools || []).filter((tool) => !result.blocked_tools.includes(tool)).join(", ")}`);
    }

    if (!hasEvery(result.executed_mock_tools, testCase.expected_executed_mock_tools || [])) {
      failures.push(`missing expected executed mock tools: ${(testCase.expected_executed_mock_tools || []).filter((tool) => !result.executed_mock_tools.includes(tool)).join(", ")}`);
    }

    if (!hasEvery(transitionStates, testCase.expected_state_transitions || [])) {
      failures.push(`missing expected state transitions: ${(testCase.expected_state_transitions || []).filter((state) => !transitionStates.includes(state)).join(", ")}`);
    }

    const blockedToolSet = new Set(result.blocked_tools);
    const blockedExecuted = result.executed_mock_tools.filter((tool) => blockedToolSet.has(tool));
    if (blockedExecuted.length) {
      blockedToolsExecuted += blockedExecuted.length;
      failures.push(`blocked tools executed: ${blockedExecuted.join(", ")}`);
    }

    if (result.executed_mock_tools.length && !eventTypes.includes("tool_output_reclassified_untrusted")) {
      failures.push("executed mock tool output was not reclassified as untrusted");
    }

    if (result.provider_execution !== false || result.local_model_execution !== false || result.external_side_effects !== false) {
      failures.push("execution boundary was not false for provider/local/external side effect");
    }

    blockedToolsRequested += result.blocked_tools.length;
    mockToolsExecuted += result.executed_mock_tools.length;
    stateTransitionsRecorded += result.state_transitions.length;
    for (const event of result.trace_events) traceLines.push(JSON.stringify(event));

    if (testCase.case_id.startsWith("approval.")) {
      approvalCases.push({
        case_id: testCase.case_id,
        blocked_tools: result.blocked_tools,
        executed_mock_tools: result.executed_mock_tools,
        status: failures.length === 0 ? "pass" : "fail"
      });
    }
    if (testCase.case_id.startsWith("state.") || testCase.case_id.startsWith("failure.")) {
      stateCases.push({
        case_id: testCase.case_id,
        state_transitions: result.state_transitions,
        status: failures.length === 0 ? "pass" : "fail"
      });
    }
    if (testCase.case_id.startsWith("schema.") || testCase.case_id.includes("structured_output")) {
      schemaCases.push({
        case_id: testCase.case_id,
        trace_schema_valid: traceFailures.length === 0,
        run_result_schema_valid: !failures.some((failure) => failure.includes("run_result")),
        status: failures.length === 0 ? "pass" : "fail"
      });
    }
  }

  caseResults.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    expected_events: testCase.expected_events || [],
    blocked_tools: result?.blocked_tools || [],
    executed_mock_tools: result?.executed_mock_tools || [],
    state_transitions: result?.state_transitions?.map((transition) => transition.to_state) || []
  });
}

const failedCases = caseResults.filter((item) => item.status !== "pass");
const report = {
  status: failedCases.length === 0 ? "pass" : "fail",
  stage: "v2.0.0-beta-mock-execution",
  mode: "mock_only_runtime_execution",
  provider_execution: false,
  local_model_execution: false,
  external_side_effects: false,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: failedCases.length,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  mock_tools_executed: mockToolsExecuted,
  trace_events_total: traceLines.length,
  trace_schema_valid: traceSchemaValid,
  state_transitions_recorded: stateTransitionsRecorded,
  langfuse_trace_export_attempted: langfuseTraceExportAttemptCount > 0,
  langfuse_sink_write_performed: langfuseSinkWriteCount > 0,
  langfuse_trace_export_attempt_count: langfuseTraceExportAttemptCount,
  langfuse_sink_write_count: langfuseSinkWriteCount,
  claims_allowed: claimsAllowed,
  claims_not_allowed: claimsNotAllowed,
  case_results: caseResults,
  failures: failedCases
};

const md = `# Beta Mock Execution Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: false
- Local model execution: false
- External side effects: false
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Blocked tools requested: ${report.blocked_tools_requested}
- Blocked tools executed: ${report.blocked_tools_executed}
- Mock tools executed: ${report.mock_tools_executed}
- Trace events total: ${report.trace_events_total}
- Trace schema valid: ${report.trace_schema_valid}
- State transitions recorded: ${report.state_transitions_recorded}
- Langfuse trace export attempted: ${report.langfuse_trace_export_attempted}
- Langfuse sink write performed: ${report.langfuse_sink_write_performed}

## Claim Boundary

- Allows: ${claimsAllowed.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

const approvalReport = {
  status: approvalCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: "v2.0.0-beta-mock-execution",
  cases: approvalCases,
  blocked_tools_executed: blockedToolsExecuted
};
const stateReport = {
  status: stateCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: "v2.0.0-beta-mock-execution",
  cases: stateCases,
  state_transitions_recorded: stateTransitionsRecorded
};
const schemaReport = {
  status: schemaCases.every((item) => item.status === "pass") && traceSchemaValid ? "pass" : "fail",
  stage: "v2.0.0-beta-mock-execution",
  trace_schema_valid: traceSchemaValid,
  cases: schemaCases
};
const unresolvedItems = failedCases.length === 0 ? [] : failedCases.map((item, index) => ({
  id: `BME-${String(index + 1).padStart(3, "0")}`,
  severity: "high",
  description: `${item.case_id} failed mock execution validation`,
  blocks_provider_execution: true,
  blocks_local_model_execution: true,
  owner: "agent",
  recommended_next_action: "Fix mock execution validation failure before opening provider or local execution."
}));

writeJson(p("evals", "reports", "beta_mock_execution_report.json"), report);
writeText(p("evals", "reports", "beta_mock_execution_report.md"), md);
writeJson(p("evidence", "beta-mock-execution", "execution_report.json"), report);
writeText(p("evidence", "beta-mock-execution", "execution_report.md"), md);
writeText(p("evidence", "beta-mock-execution", "trace_samples.jsonl"), traceLines.join("\n"));
writeJson(p("evidence", "beta-mock-execution", "approval_boundary_report.json"), approvalReport);
writeJson(p("evidence", "beta-mock-execution", "state_transition_report.json"), stateReport);
writeJson(p("evidence", "beta-mock-execution", "schema_contract_report.json"), schemaReport);
writeJson(p("evidence", "beta-mock-execution", "unresolved_items.json"), unresolvedItems);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
