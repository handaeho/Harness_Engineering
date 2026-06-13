#!/usr/bin/env node
import path from "node:path";
import { createTextOnlyResponse } from "../../../adapters/api/openai/responses_client.mjs";
import {
  assertToolCallingRequestSurface,
  loadToolArgumentSchema,
  mapToolCallingFinalRequest,
  mapToolCallingRequest
} from "../../../adapters/api/openai/tool_calling_mapper.mjs";
import { mapToolCallingResponse } from "../../../adapters/api/openai/tool_calling_response_mapper.mjs";
import {
  redactionPassed,
  sanitizeToolCallingRequest,
  sanitizeToolCallingResponse,
  sanitizeToolOutput
} from "../../../adapters/api/openai/tool_calling_redaction_policy.mjs";
import { checkToolCallingExecutionGuard } from "../../../runtime/provider/tool_calling_execution_guard.mjs";
import { createToolCallingTraceRecorder } from "../../../runtime/provider/tool_calling_trace_recorder.mjs";
import { executeProviderMockTool } from "../../../runtime/tools/provider_mock_tool_registry.mjs";
import { checkProviderToolApproval } from "../../../runtime/tools/provider_tool_approval_gate.mjs";
import { classifyProviderToolOutput } from "../../../runtime/tools/provider_tool_output_classifier.mjs";
import { createAjv, compileSchema } from "../../lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-tool-calling-canary-openai";
const MODE = "openai_tool_calling_canary_mock_tools_only";
const args = process.argv.slice(2);
const attemptArg = args.find((arg) => arg.startsWith("--attempt-id="));
const rootArg = args.find((arg) => !arg.startsWith("--"));
const ATTEMPT_ID = attemptArg
  ? attemptArg.slice("--attempt-id=".length)
  : process.env.OPENAI_TOOL_CALLING_ATTEMPT_ID || "001-tool-calling-canary";

const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-tool-calling-canary-executed",
  "provider-tool-call-path-checked",
  "tool-argument-schema-canary-validated",
  "mock-tool-output-reinjection-checked",
  "tool-approval-boundary-canary-checked",
  "tool-output-reclassification-checked",
  "tool-calling-trace-captured",
  "tool-calling-redaction-checked"
];
const claimsNotAllowed = [
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
  "provider-diverse",
  "replay-verified",
  "release-gated",
  "production-monitored"
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

function statusIsBlocked(status) {
  return status === "blocked_by_missing_credential"
    || status === "blocked_by_missing_model"
    || status === "blocked_by_malformed_model_env";
}

function validateToolArguments(ajv, toolName, args) {
  const schema = loadToolArgumentSchema(root, toolName);
  const validate = compileSchema(ajv, schema, `${toolName}.schema`);
  const ok = validate(args);
  return {
    status: ok ? "pass" : "fail",
    ajv_valid: ok,
    errors: ok ? [] : (validate.errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`)
  };
}

function writeReports(report, mappingReport, argumentReport, executionReport, approvalReport, redactionReport, traceEvents, unresolvedItems) {
  const md = `# OpenAI Tool Calling Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: ${report.provider_execution}
- Tool calling used: ${report.tool_calling_used}
- Function tools used: ${report.function_tools_used}
- Built-in tools used: ${report.built_in_tools_used}
- Remote MCP used: ${report.remote_mcp_used}
- Local model execution: ${report.local_model_execution}
- External side effects: ${report.external_side_effects}
- Store false enforced: ${report.store_false_enforced}
- Tool argument Ajv validation used: ${report.tool_argument_ajv_validation_used}
- Mock tools only: ${report.mock_tools_only}
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Tool calls total: ${report.tool_calls_total}
- Mock tools executed: ${report.mock_tools_executed}
- Blocked tools requested: ${report.blocked_tools_requested}
- Blocked tools executed: ${report.blocked_tools_executed}
- Tool outputs reclassified untrusted: ${report.tool_outputs_reclassified_untrusted}
- Final responses received: ${report.final_responses_received}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after pass: ${claimsAllowed.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const traceLines = traceEvents.map((event) => JSON.stringify(event));
  const top = p("evidence", "beta-tool-calling-canary-openai");
  const attempt = p("evidence", "beta-tool-calling-canary-openai", "attempts", ATTEMPT_ID);
  const writes = [
    [p("evals", "reports", "openai_tool_calling_canary_report.json"), report],
    [p("evals", "reports", "openai_tool_calling_canary_report.md"), md],
    [path.join(top, "tool_calling_canary_report.json"), report],
    [path.join(top, "tool_calling_canary_report.md"), md],
    [path.join(top, "tool_call_mapping_report.json"), mappingReport],
    [path.join(top, "tool_argument_validation_report.json"), argumentReport],
    [path.join(top, "tool_execution_report.json"), executionReport],
    [path.join(top, "approval_boundary_report.json"), approvalReport],
    [path.join(top, "redaction_report.json"), redactionReport],
    [path.join(top, "unresolved_items.json"), unresolvedItems],
    [path.join(attempt, "tool_calling_canary_report.json"), report],
    [path.join(attempt, "tool_calling_canary_report.md"), md],
    [path.join(attempt, "tool_call_mapping_report.json"), mappingReport],
    [path.join(attempt, "tool_argument_validation_report.json"), argumentReport],
    [path.join(attempt, "tool_execution_report.json"), executionReport],
    [path.join(attempt, "approval_boundary_report.json"), approvalReport],
    [path.join(attempt, "redaction_report.json"), redactionReport],
    [path.join(attempt, "unresolved_items.json"), unresolvedItems]
  ];
  for (const [file, data] of writes) {
    if (typeof data === "string") writeText(file, data);
    else writeJson(file, data);
  }
  writeText(path.join(top, "tool_calling_trace_samples.jsonl"), traceLines.join("\n"));
  writeText(path.join(attempt, "tool_calling_trace_samples.jsonl"), traceLines.join("\n"));
}

const records = loadJsonl(p("adapters", "api", "openai", "tool_calling_cases.jsonl"));
const cases = records.map((record) => record.value);
const providerCases = cases.filter((item) => item.provider_call_required !== false);
const expectedFinalResponses = providerCases.filter((item) => Boolean(item.expected_final_response_contains)).length;
const runId = `openai-tool-calling-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = createToolCallingTraceRecorder(runId);
const ajv = createAjv();

const caseResults = [];
const mappingCases = [];
const argumentValidations = [];
const executionCases = [];
const approvalCases = [];
const failures = [];
let providerExecution = false;
let redactionOk = true;
let toolCallsTotal = 0;
let mockToolsExecuted = 0;
let blockedToolsRequested = 0;
let blockedToolsExecuted = 0;
let toolOutputsReclassifiedUntrusted = 0;
let finalResponsesReceived = 0;

trace.record("tool_calling_canary_started", {
  cases_total: cases.length,
  provider_cases_total: providerCases.length,
  mode: MODE
}, false);

const firstProviderCase = providerCases[0];
const firstRequest = mapToolCallingRequest(firstProviderCase, root, process.env);
const firstSurface = assertToolCallingRequestSurface(firstRequest, firstProviderCase.tools_allowed || []);
const firstGuard = checkToolCallingExecutionGuard({
  stage: STAGE,
  request: firstRequest,
  env: process.env
});

trace.record("tool_calling_guard_checked", {
  status: firstGuard.status,
  allowed: firstGuard.allowed,
  reason: firstGuard.reason,
  request_surface: firstSurface
}, false);

if (!firstGuard.allowed) {
  const status = statusIsBlocked(firstGuard.status) ? firstGuard.status : "fail";
  trace.record("tool_calling_canary_blocked", {
    status: firstGuard.status,
    reason: firstGuard.reason
  }, false);
  trace.record("tool_calling_trace_recorded", {
    event_count: trace.events.length + 1
  }, false);

  const report = {
    status,
    stage: STAGE,
    mode: MODE,
    provider: "openai",
    provider_execution: false,
    tool_calling_used: firstSurface.tools_present,
    function_tools_used: firstSurface.function_tools_used,
    built_in_tools_used: firstSurface.built_in_tools_present,
    remote_mcp_used: false,
    local_model_execution: false,
    external_side_effects: false,
    store_false_enforced: firstSurface.store_false_enforced,
    tool_argument_ajv_validation_used: true,
    mock_tools_only: true,
    cases_total: cases.length,
    cases_passed: 0,
    cases_failed: 0,
    tool_calls_total: 0,
    tool_argument_validations_total: 0,
    tool_argument_validations_passed: 0,
    tool_argument_validations_failed: 0,
    mock_tools_executed: 0,
    blocked_tools_requested: 0,
    blocked_tools_executed: 0,
    tool_outputs_reclassified_untrusted: 0,
    final_responses_received: 0,
    expected_final_responses: expectedFinalResponses,
    trace_events_total: trace.events.length,
    redaction_passed: true,
    raw_response_stored: false,
    claims_allowed: [],
    claims_not_allowed: claimsNotAllowed,
    failures: []
  };
  const mappingReport = {
    status,
    stage: STAGE,
    request_mapping: {
      model_from_env: Boolean(process.env.OPENAI_MODEL),
      input_text_only: typeof firstRequest.input === "string",
      tools_present: firstSurface.tools_present,
      function_tools_present: firstSurface.function_tools_used,
      built_in_tools_present: firstSurface.built_in_tools_present,
      structured_output_present: false,
      store_false: firstRequest.store === false,
      max_output_tokens_bounded: firstSurface.max_output_tokens_bounded
    },
    response_mapping: {
      provider_response_id_present: false,
      tool_calls_extracted: false,
      final_response_text_extracted: false,
      raw_response_hash_present: false,
      raw_response_stored: false
    },
    cases_total: cases.length,
    cases_mapped: 0,
    request_examples_redacted: [sanitizeToolCallingRequest(firstRequest)],
    response_examples_redacted: []
  };
  const argumentReport = {
    status,
    stage: STAGE,
    ajv_validation_used: true,
    tool_argument_validations_total: 0,
    tool_argument_validations_passed: 0,
    tool_argument_validations_failed: 0,
    cases: []
  };
  const executionReport = {
    status,
    stage: STAGE,
    mock_tools_only: true,
    mock_tools_executed: 0,
    blocked_tools_executed: 0,
    tool_outputs_reclassified_untrusted: 0,
    final_responses_received: 0,
    cases: []
  };
  const approvalReport = {
    status,
    stage: STAGE,
    approval_gate_checked: false,
    blocked_tools_requested: 0,
    blocked_tools_executed: 0,
    decisions: []
  };
  const redactionReport = {
    status: "pass",
    stage: STAGE,
    redaction_passed: true,
    raw_authorization_header_recorded: false,
    raw_request_body_recorded: false,
    raw_response_recorded: false,
    api_key_recorded: false
  };
  const unresolvedItems = [
    {
      id: "TCC-001",
      severity: "medium",
      description: "OpenAI tool-calling canary was blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
      blocks_local_model_execution: false,
      blocks_replay_verification: true,
      owner: "human",
      recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun tool-calling canary."
    }
  ];

  writeReports(report, mappingReport, argumentReport, executionReport, approvalReport, redactionReport, trace.events, unresolvedItems);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

for (const record of records) {
  const testCase = record.value;
  const caseFailures = [];
  const executedTools = [];
  const blockedTools = [];
  const toolOutputs = [];
  let initialSanitizedRequest = null;
  let initialSanitizedResponse = null;
  let finalSanitizedRequest = null;
  let finalSanitizedResponse = null;

  if (testCase.provider_call_required === false) {
    for (const toolName of testCase.expected_blocked_tools || []) {
      const approval = checkProviderToolApproval(toolName);
      blockedToolsRequested += 1;
      approvalCases.push({
        case_id: testCase.case_id,
        tool_name: toolName,
        decision: approval.status,
        approved: approval.approved,
        reason: approval.reason
      });
      trace.record("tool_approval_checked", {
        case_id: testCase.case_id,
        tool_name: toolName,
        decision: approval.status,
        reason: approval.reason
      }, providerExecution);
      if (approval.approved) {
        blockedToolsExecuted += 1;
        caseFailures.push(`${toolName} was approved but must be blocked`);
      } else {
        blockedTools.push(toolName);
        trace.record("tool_blocked", {
          case_id: testCase.case_id,
          tool_name: toolName,
          reason: approval.reason
        }, providerExecution);
      }
    }
    const status = caseFailures.length === 0 ? "pass" : "fail";
    if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
    executionCases.push({
      case_id: testCase.case_id,
      status,
      provider_call_required: false,
      mock_tools_executed: [],
      blocked_tools: blockedTools,
      tool_outputs_reclassified_untrusted: 0,
      final_response_received: false
    });
    mappingCases.push({
      case_id: testCase.case_id,
      status,
      provider_call_required: false,
      request_redacted: null,
      initial_response_redacted: null,
      final_request_redacted: null,
      final_response_redacted: null
    });
    caseResults.push({
      case_id: testCase.case_id,
      fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
      fixture_line: record.line,
      status,
      failures: caseFailures
    });
    continue;
  }

  const request = mapToolCallingRequest(testCase, root, process.env);
  const requestSurface = assertToolCallingRequestSurface(request, testCase.tools_allowed || []);
  const guard = checkToolCallingExecutionGuard({ stage: STAGE, request, env: process.env });
  initialSanitizedRequest = sanitizeToolCallingRequest(request);

  trace.record("tool_calling_guard_checked", {
    case_id: testCase.case_id,
    status: guard.status,
    allowed: guard.allowed,
    reason: guard.reason,
    request_surface: requestSurface
  }, providerExecution);
  trace.record("tool_calling_request_mapped", {
    case_id: testCase.case_id,
    request_redacted: initialSanitizedRequest
  }, providerExecution);

  if (!requestSurface.ok) {
    caseFailures.push(`request surface violation: ${requestSurface.disallowed_fields.join(", ") || "tool surface invalid"}`);
  }
  if (!guard.allowed) caseFailures.push(`tool calling guard blocked case: ${guard.status}`);

  let initialRawResponse = null;
  let initialMappedResponse = null;
  if (!caseFailures.length) {
    trace.record("tool_calling_request_sent", {
      case_id: testCase.case_id,
      target: "openai.responses",
      store: false,
      tool_names: requestSurface.tool_names
    }, true);
    providerExecution = true;
    try {
      initialRawResponse = await createTextOnlyResponse(request, process.env);
      initialMappedResponse = mapToolCallingResponse(initialRawResponse);
      initialSanitizedResponse = sanitizeToolCallingResponse(initialMappedResponse);
      redactionOk = redactionOk && redactionPassed(initialSanitizedRequest) && redactionPassed(initialSanitizedResponse);
      trace.record("tool_calling_response_received", {
        case_id: testCase.case_id,
        response_id_present: Boolean(initialMappedResponse.provider_response_id)
      }, true);

      if (initialMappedResponse.built_in_tool_items.length > 0) {
        caseFailures.push("built-in tool item was returned");
      }
      const toolCallNames = initialMappedResponse.tool_calls.map((call) => call.name);
      for (const expected of testCase.expected_tool_calls || []) {
        if (!toolCallNames.includes(expected)) caseFailures.push(`expected tool call missing: ${expected}`);
      }
      if (initialMappedResponse.tool_calls.length === 0) {
        caseFailures.push("no function tool call was returned");
      }

      for (const toolCall of initialMappedResponse.tool_calls) {
        toolCallsTotal += 1;
        trace.record("tool_call_detected", {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          call_id_present: Boolean(toolCall.call_id)
        }, true);

        if (!toolCall.call_id) caseFailures.push(`tool call missing call_id: ${toolCall.name}`);
        if (toolCall.arguments_parse_error) caseFailures.push(`tool arguments parse failed for ${toolCall.name}: ${toolCall.arguments_parse_error}`);

        let validation = {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          status: "fail",
          ajv_valid: false,
          errors: ["arguments were not parsed"]
        };
        if (toolCall.arguments && !toolCall.arguments_parse_error) {
          validation = {
            case_id: testCase.case_id,
            tool_name: toolCall.name,
            ...validateToolArguments(ajv, toolCall.name, toolCall.arguments)
          };
        }
        argumentValidations.push(validation);
        trace.record("tool_arguments_validated", {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          status: validation.status,
          errors_count: validation.errors.length
        }, true);
        if (validation.status !== "pass") {
          caseFailures.push(`tool argument validation failed for ${toolCall.name}: ${validation.errors.join("; ")}`);
          continue;
        }

        const approval = checkProviderToolApproval(toolCall.name);
        approvalCases.push({
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          decision: approval.status,
          approved: approval.approved,
          reason: approval.reason
        });
        trace.record("tool_approval_checked", {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          decision: approval.status,
          reason: approval.reason
        }, true);

        if (!approval.approved) {
          blockedToolsRequested += 1;
          blockedTools.push(toolCall.name);
          trace.record("tool_blocked", {
            case_id: testCase.case_id,
            tool_name: toolCall.name,
            reason: approval.reason
          }, true);
          if (!(testCase.expected_blocked_tools || []).includes(toolCall.name)) {
            caseFailures.push(`unexpected blocked tool: ${toolCall.name}`);
          }
          continue;
        }

        const mockResult = executeProviderMockTool(toolCall.name, toolCall.arguments);
        mockToolsExecuted += 1;
        executedTools.push(toolCall.name);
        trace.record("mock_tool_executed", {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          external_side_effect: false
        }, true);

        const classifiedOutput = classifyProviderToolOutput(toolCall.name, mockResult);
        toolOutputsReclassifiedUntrusted += classifiedOutput.classification === "untrusted_tool_output" ? 1 : 0;
        const toolOutput = {
          call_id: toolCall.call_id,
          tool_name: toolCall.name,
          output: classifiedOutput
        };
        toolOutputs.push(toolOutput);
        trace.record("tool_output_reclassified_untrusted", {
          case_id: testCase.case_id,
          tool_name: toolCall.name,
          classification: classifiedOutput.classification
        }, true);
      }

      for (const expected of testCase.expected_mock_tools_executed || []) {
        if (!executedTools.includes(expected)) caseFailures.push(`expected mock tool was not executed: ${expected}`);
      }
      for (const unexpected of testCase.tools_forbidden || []) {
        if (executedTools.includes(unexpected)) caseFailures.push(`forbidden tool was executed: ${unexpected}`);
      }

      if (toolOutputs.length > 0 && !caseFailures.length) {
        const finalRequest = mapToolCallingFinalRequest({
          initialResponse: initialRawResponse,
          toolOutputs,
          testCase,
          root,
          env: process.env
        });
        const finalSurface = assertToolCallingRequestSurface(finalRequest, testCase.tools_allowed || []);
        const finalGuard = checkToolCallingExecutionGuard({ stage: STAGE, request: finalRequest, env: process.env });
        finalSanitizedRequest = sanitizeToolCallingRequest(finalRequest);
        redactionOk = redactionOk && redactionPassed(finalSanitizedRequest) && toolOutputs.every((item) => redactionPassed(sanitizeToolOutput(item)));
        trace.record("tool_output_reinjected", {
          case_id: testCase.case_id,
          outputs: toolOutputs.map((item) => sanitizeToolOutput(item))
        }, true);
        if (!finalSurface.ok || !finalGuard.allowed) {
          caseFailures.push(`final request guard failed: ${finalGuard.status}`);
        } else {
          const finalRawResponse = await createTextOnlyResponse(finalRequest, process.env);
          const finalMappedResponse = mapToolCallingResponse(finalRawResponse);
          finalSanitizedResponse = sanitizeToolCallingResponse(finalMappedResponse);
          redactionOk = redactionOk && redactionPassed(finalSanitizedResponse);
          finalResponsesReceived += 1;
          trace.record("final_response_received", {
            case_id: testCase.case_id,
            response_id_present: Boolean(finalMappedResponse.provider_response_id),
            output_text_present: Boolean(finalMappedResponse.output_text)
          }, true);
          if (!finalMappedResponse.output_text || !finalMappedResponse.output_text.includes(testCase.expected_final_response_contains)) {
            caseFailures.push(`final response did not include expected marker: ${testCase.expected_final_response_contains}`);
          }
        }
      }
    } catch (error) {
      const providerError = error.provider_error || {
        status: error.status || null,
        type: null,
        code: null,
        param: null,
        message_preview: String(error.message).slice(0, 220)
      };
      const providerErrorLabel = [
        `HTTP ${providerError.status || "unknown"}`,
        providerError.type,
        providerError.code,
        providerError.param ? `param:${providerError.param}` : null
      ].filter(Boolean).join(" ");
      caseFailures.push(`provider request failed: ${providerErrorLabel || error.message}`);
      trace.record("tool_calling_canary_failed", {
        case_id: testCase.case_id,
        error_message: String(error.message).slice(0, 240),
        provider_error: providerError
      }, providerExecution);
    }
  }

  const status = caseFailures.length === 0 ? "pass" : "fail";
  if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
  mappingCases.push({
    case_id: testCase.case_id,
    status,
    provider_call_required: true,
    request_redacted: initialSanitizedRequest,
    initial_response_redacted: initialSanitizedResponse,
    final_request_redacted: finalSanitizedRequest,
    final_response_redacted: finalSanitizedResponse
  });
  executionCases.push({
    case_id: testCase.case_id,
    status,
    provider_call_required: true,
    mock_tools_executed: executedTools,
    blocked_tools: blockedTools,
    tool_outputs_reclassified_untrusted: toolOutputs.length,
    final_response_received: Boolean(finalSanitizedResponse)
  });
  caseResults.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status,
    failures: caseFailures
  });
}

const finalStatus = failures.length === 0 ? "pass" : "fail";
if (finalStatus === "pass") {
  trace.record("tool_calling_canary_completed", {
    cases_total: cases.length,
    cases_passed: caseResults.filter((item) => item.status === "pass").length
  }, providerExecution);
} else {
  trace.record("tool_calling_canary_failed", {
    failures_count: failures.length
  }, providerExecution);
}
trace.record("tool_calling_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const argumentValidationsPassed = argumentValidations.filter((item) => item.status === "pass").length;
const argumentValidationsFailed = argumentValidations.filter((item) => item.status === "fail").length;
const report = {
  status: finalStatus,
  stage: STAGE,
  mode: MODE,
  provider: "openai",
  provider_execution: providerExecution,
  tool_calling_used: true,
  function_tools_used: true,
  built_in_tools_used: false,
  remote_mcp_used: false,
  local_model_execution: false,
  external_side_effects: false,
  store_false_enforced: true,
  tool_argument_ajv_validation_used: true,
  mock_tools_only: true,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status === "fail").length,
  tool_calls_total: toolCallsTotal,
  tool_argument_validations_total: argumentValidations.length,
  tool_argument_validations_passed: argumentValidationsPassed,
  tool_argument_validations_failed: argumentValidationsFailed,
  mock_tools_executed: mockToolsExecuted,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  tool_outputs_reclassified_untrusted: toolOutputsReclassifiedUntrusted,
  final_responses_received: finalResponsesReceived,
  expected_final_responses: expectedFinalResponses,
  trace_events_total: trace.events.length,
  redaction_passed: redactionOk,
  raw_response_stored: false,
  claims_allowed: finalStatus === "pass" ? claimsAllowed : [],
  claims_not_allowed: claimsNotAllowed,
  case_results: caseResults,
  failures
};

const mappingReport = {
  status: finalStatus,
  stage: STAGE,
  request_mapping: {
    model_from_env: Boolean(process.env.OPENAI_MODEL),
    input_text_only: mappingCases.filter((item) => item.provider_call_required).every((item) => Boolean(item.request_redacted?.input_preview)),
    tools_present: mappingCases.filter((item) => item.provider_call_required).every((item) => item.request_redacted?.tools_present === true),
    function_tools_present: mappingCases.filter((item) => item.provider_call_required).every((item) => item.request_redacted?.function_tools_used === true),
    built_in_tools_present: false,
    structured_output_present: false,
    store_false: mappingCases.filter((item) => item.provider_call_required).every((item) => item.request_redacted?.store === false),
    max_output_tokens_bounded: true
  },
  response_mapping: {
    provider_response_id_present: mappingCases.filter((item) => item.provider_call_required).every((item) => item.initial_response_redacted?.provider_response_id_present === true),
    tool_calls_extracted: toolCallsTotal > 0,
    final_response_text_extracted: finalResponsesReceived >= expectedFinalResponses,
    raw_response_hash_present: mappingCases.filter((item) => item.provider_call_required).every((item) => Boolean(item.initial_response_redacted?.raw_response_hash)),
    raw_response_stored: false
  },
  cases_total: cases.length,
  cases_mapped: mappingCases.length,
  cases: mappingCases
};
const argumentReport = {
  status: argumentValidationsFailed === 0 && argumentValidations.length > 0 ? "pass" : "fail",
  stage: STAGE,
  ajv_validation_used: true,
  tool_argument_validations_total: argumentValidations.length,
  tool_argument_validations_passed: argumentValidationsPassed,
  tool_argument_validations_failed: argumentValidationsFailed,
  cases: argumentValidations
};
const executionReport = {
  status: finalStatus,
  stage: STAGE,
  mock_tools_only: true,
  mock_tools_executed: mockToolsExecuted,
  blocked_tools_executed: blockedToolsExecuted,
  tool_outputs_reclassified_untrusted: toolOutputsReclassifiedUntrusted,
  final_responses_received: finalResponsesReceived,
  expected_final_responses: expectedFinalResponses,
  cases: executionCases
};
const approvalReport = {
  status: blockedToolsExecuted === 0 && approvalCases.length > 0 ? "pass" : "fail",
  stage: STAGE,
  approval_gate_checked: approvalCases.length > 0,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  decisions: approvalCases
};
const redactionReport = {
  status: redactionOk ? "pass" : "fail",
  stage: STAGE,
  redaction_passed: redactionOk,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false
};
const unresolvedItems = finalStatus === "pass" ? [] : [
  {
    id: "TCC-002",
    severity: "high",
    description: "OpenAI tool-calling canary failed during provider execution, tool call mapping, argument validation, approval boundary, tool output reinjection, or final response validation.",
    blocks_local_model_execution: false,
    blocks_replay_verification: true,
    owner: "agent",
    recommended_next_action: "Inspect redacted request mapping, tool schema compatibility, response mapper, approval gate, function_call_output reinjection, and final response validation."
  }
];

writeReports(report, mappingReport, argumentReport, executionReport, approvalReport, redactionReport, trace.events, unresolvedItems);
console.log(JSON.stringify(report, null, 2));
process.exit(finalStatus === "pass" ? 0 : 1);
