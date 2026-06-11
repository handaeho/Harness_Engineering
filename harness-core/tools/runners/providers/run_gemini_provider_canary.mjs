#!/usr/bin/env node
import path from "node:path";
import {
  assertNoDisallowedRequestSurface,
  mapCanaryRequest
} from "../../../adapters/api/gemini/request_mapper.mjs";
import { createGenerateContent } from "../../../adapters/api/gemini/generate_content_client.mjs";
import { mapGeminiResponse } from "../../../adapters/api/gemini/response_mapper.mjs";
import {
  assertStructuredOutputRequestSurface,
  mapStructuredOutputRequest,
  mapStructuredOutputResponse
} from "../../../adapters/api/gemini/structured_output_mapper.mjs";
import {
  assertFunctionResponseReinjectionSurface,
  assertToolCallingRequestSurface,
  loadToolArgumentSchema,
  mapToolCallingFinalRequest,
  mapToolCallingRequest
} from "../../../adapters/api/gemini/tool_calling_mapper.mjs";
import {
  assertSafetySettingsSurface,
  mapSafetyBlockedResponse,
  mapSafetySettingsRequest
} from "../../../adapters/api/gemini/safety_mapper.mjs";
import {
  redactionPassed,
  sanitizeGenerateContentRequest,
  sanitizeMappedResponse
} from "../../../adapters/api/gemini/redaction_policy.mjs";
import { createAjv, compileSchema } from "../../lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";
import { executeProviderMockTool } from "../../../runtime/tools/provider_mock_tool_registry.mjs";
import { checkProviderToolApproval } from "../../../runtime/tools/provider_tool_approval_gate.mjs";
import { classifyProviderToolOutput } from "../../../runtime/tools/provider_tool_output_classifier.mjs";

const STAGE = "v2.0.0-gemini-runtime-dry-run-provider-canary";
const MODE = "gemini_native_generate_content_static_and_optional_live_canary";
const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowedAfterDryRun = [
  "gemini-adapter-skeleton-created",
  "gemini-request-mapping-dry-run-checked",
  "gemini-response-mapping-dry-run-checked",
  "gemini-structured-output-dry-run-checked",
  "gemini-json-schema-local-validation-checked",
  "gemini-tool-calling-dry-run-checked",
  "gemini-tool-argument-schema-local-validation-checked",
  "gemini-function-response-reinjection-dry-run-checked",
  "gemini-safety-fixture-checked",
  "gemini-redaction-dry-run-checked"
];
const claimsAllowedAfterLive = [
  ...claimsAllowedAfterDryRun,
  "gemini-provider-canary-executed",
  "gemini-provider-trace-captured"
];
const claimsNotAllowed = [
  "provider-verified",
  "adapter-checked",
  "release-gated",
  "production-ready",
  "live Gemini canary passed",
  "tool-call-verified",
  "schema-output-verified",
  "integration-verified",
  "provider-diverse",
  "replay-verified",
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

function traceRecorder(runId) {
  const events = [];
  return {
    events,
    record(type, payload = {}, providerExecution = false) {
      events.push({
        event_id: `${runId}-${String(events.length + 1).padStart(4, "0")}`,
        run_id: runId,
        adapter_id: "gemini.api.skeleton",
        provider: "gemini",
        type,
        provider_execution: providerExecution,
        local_model_execution: false,
        external_side_effect: false,
        payload_redacted: true,
        payload
      });
    }
  };
}

function syntheticTextResponse(testCase) {
  return {
    responseId: `synthetic-${testCase.case_id}`,
    candidates: [
      {
        content: {
          role: "model",
          parts: [{ text: testCase.expected_contains }]
        },
        finishReason: "STOP",
        safetyRatings: []
      }
    ],
    usageMetadata: {
      promptTokenCount: 1,
      candidatesTokenCount: 1,
      totalTokenCount: 2
    }
  };
}

function syntheticStructuredResponse(testCase) {
  return {
    responseId: `synthetic-${testCase.case_id}`,
    candidates: [
      {
        content: {
          role: "model",
          parts: [{ text: JSON.stringify(testCase.expected_object) }]
        },
        finishReason: "STOP",
        safetyRatings: []
      }
    ],
    usageMetadata: {
      promptTokenCount: 1,
      candidatesTokenCount: 1,
      totalTokenCount: 2
    }
  };
}

function liveBlockStatus(env = process.env) {
  if (!env.GEMINI_API_KEY) return "blocked_by_missing_credential";
  if (!env.GEMINI_MODEL) return "blocked_by_missing_model";
  if (env.GEMINI_PROVIDER_CANARY_ENABLE_LIVE !== "1") return "blocked_by_live_execution_not_enabled";
  if (env.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL !== "1") return "blocked_by_network_approval_missing";
  return "allowed";
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

function writeReports({
  report,
  mappingReport,
  structuredReport,
  toolReport,
  safetyReport,
  redactionReport,
  traceEvents,
  unresolvedItems
}) {
  const md = `# Gemini Provider Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- API lane: ${report.api_lane}
- Provider execution: ${report.provider_execution}
- Live execution enabled: ${report.live_execution_enabled}
- Local dry-run status: ${report.local_dry_run_status}
- Text mapping status: ${mappingReport.status}
- Structured output status: ${structuredReport.status}
- Tool calling dry-run status: ${toolReport.status}
- Safety fixture status: ${safetyReport.status}
- Redaction passed: ${report.redaction_passed}
- Trace events total: ${report.trace_events_total}

## Claim Boundary

- Allows after dry-run: ${claimsAllowedAfterDryRun.join(", ")}
- Allows after live pass only: gemini-provider-canary-executed, gemini-provider-trace-captured
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const top = p("evidence", "beta-provider-canary-gemini");
  const traceLines = traceEvents.map((event) => JSON.stringify(event));
  writeJson(p("evals", "reports", "gemini_provider_canary_report.json"), report);
  writeText(p("evals", "reports", "gemini_provider_canary_report.md"), md);
  writeJson(path.join(top, "gemini_provider_canary_report.json"), report);
  writeText(path.join(top, "gemini_provider_canary_report.md"), md);
  writeJson(path.join(top, "request_response_mapping_report.json"), mappingReport);
  writeJson(path.join(top, "structured_output_validation_report.json"), structuredReport);
  writeJson(path.join(top, "tool_calling_dry_run_report.json"), toolReport);
  writeJson(path.join(top, "safety_fixture_report.json"), safetyReport);
  writeJson(path.join(top, "redaction_report.json"), redactionReport);
  writeJson(path.join(top, "unresolved_items.json"), unresolvedItems);
  writeText(path.join(top, "provider_trace_samples.jsonl"), traceLines.join("\n"));
}

const runId = `gemini-canary-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = traceRecorder(runId);
const ajv = createAjv();
const failures = [];
const sanitizedRequests = [];
const sanitizedResponses = [];
let redactionOk = true;
let providerExecution = false;

trace.record("gemini_provider_canary_started", {
  mode: MODE,
  api_lane: "native_gemini_api"
});

const canaryRecords = loadJsonl(p("adapters", "api", "gemini", "canary_cases.jsonl"));
const mappingCases = [];
for (const record of canaryRecords) {
  const testCase = record.value;
  const request = mapCanaryRequest(testCase, process.env);
  const surface = assertNoDisallowedRequestSurface(request);
  const mappedResponse = mapGeminiResponse(syntheticTextResponse(testCase));
  const requestRedacted = sanitizeGenerateContentRequest(request);
  const responseRedacted = sanitizeMappedResponse(mappedResponse);
  const caseFailures = [];

  if (!surface.ok) caseFailures.push(`request surface violation: ${surface.disallowed_fields.join(", ")}`);
  if (!mappedResponse.output_text.includes(testCase.expected_contains)) {
    caseFailures.push(`synthetic response did not contain ${testCase.expected_contains}`);
  }
  if (!mappedResponse.raw_response_hash) caseFailures.push("raw response hash missing");
  redactionOk = redactionOk && redactionPassed(requestRedacted) && redactionPassed(responseRedacted);
  sanitizedRequests.push(requestRedacted);
  sanitizedResponses.push(responseRedacted);

  trace.record("gemini_request_response_mapping_checked", {
    case_id: testCase.case_id,
    request_surface: surface,
    response_redacted: responseRedacted
  });

  const status = caseFailures.length ? "fail" : "pass";
  if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
  mappingCases.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status,
    request_surface: surface,
    response_mapping: responseRedacted,
    failures: caseFailures
  });
}

const structuredRecords = loadJsonl(p("adapters", "api", "gemini", "structured_output_cases.jsonl"));
const structuredCases = [];
for (const record of structuredRecords) {
  const testCase = record.value;
  const request = mapStructuredOutputRequest(testCase, process.env);
  const surface = assertStructuredOutputRequestSurface(request);
  const mappedResponse = mapStructuredOutputResponse(syntheticStructuredResponse(testCase));
  const validate = compileSchema(ajv, testCase.schema, `${testCase.case_id}.schema`);
  const schemaOk = validate(mappedResponse.parsed_json);
  const requestRedacted = sanitizeGenerateContentRequest(request);
  const responseRedacted = sanitizeMappedResponse(mappedResponse);
  const caseFailures = [];

  if (!surface.ok) caseFailures.push(`structured request surface violation: ${surface.disallowed_fields.join(", ")}`);
  if (!schemaOk) caseFailures.push(`Ajv validation failed: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
  redactionOk = redactionOk && redactionPassed(requestRedacted) && redactionPassed(responseRedacted);
  sanitizedRequests.push(requestRedacted);
  sanitizedResponses.push(responseRedacted);

  trace.record("gemini_structured_output_validation_checked", {
    case_id: testCase.case_id,
    request_surface: surface,
    ajv_valid: schemaOk
  });

  const status = caseFailures.length ? "fail" : "pass";
  if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
  structuredCases.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status,
    request_surface: surface,
    ajv_valid: schemaOk,
    parsed_json: mappedResponse.parsed_json,
    failures: caseFailures
  });
}

const toolRecords = loadJsonl(p("adapters", "api", "gemini", "tool_calling_cases.jsonl"));
const toolCases = [];
let toolArgumentValidationsTotal = 0;
let toolArgumentValidationsPassed = 0;
let mockToolsExecuted = 0;
let blockedToolsRequested = 0;
let blockedToolsExecuted = 0;
let reinjectionsChecked = 0;
let reinjectionsPassed = 0;
let toolOutputsReclassified = 0;

for (const record of toolRecords) {
  const testCase = record.value;
  const request = mapToolCallingRequest(testCase, root, process.env);
  const surface = assertToolCallingRequestSurface(request, testCase.tools_allowed || []);
  const requestRedacted = sanitizeGenerateContentRequest(request);
  const caseFailures = [];
  const argumentResults = [];
  const toolExecutions = [];
  const approvalDecisions = [];
  const reinjectionSurfaces = [];

  if (!surface.ok) caseFailures.push("tool calling request surface violation");
  redactionOk = redactionOk && redactionPassed(requestRedacted);
  sanitizedRequests.push(requestRedacted);

  for (const functionCall of testCase.synthetic_function_calls || []) {
    const approval = checkProviderToolApproval(functionCall.name);
    approvalDecisions.push(approval);
    if (!approval.approved) {
      blockedToolsRequested += 1;
      continue;
    }

    toolArgumentValidationsTotal += 1;
    const validation = validateToolArguments(ajv, functionCall.name, functionCall.args || {});
    argumentResults.push({
      tool_name: functionCall.name,
      ...validation
    });
    if (validation.status === "pass") toolArgumentValidationsPassed += 1;
    else caseFailures.push(`tool argument validation failed for ${functionCall.name}`);

    const rawOutput = executeProviderMockTool(functionCall.name, functionCall.args || {});
    const classifiedOutput = classifyProviderToolOutput(functionCall.name, rawOutput);
    toolOutputsReclassified += classifiedOutput.classification === "untrusted_tool_output" ? 1 : 0;
    mockToolsExecuted += 1;
    toolExecutions.push({
      tool_name: functionCall.name,
      output_classification: classifiedOutput.classification,
      external_side_effect: rawOutput.external_side_effect
    });
    if (rawOutput.external_side_effect) blockedToolsExecuted += 1;

    const finalRequest = mapToolCallingFinalRequest({
      testCase,
      functionCall,
      toolOutput: classifiedOutput,
      env: process.env
    });
    const reinjectionSurface = assertFunctionResponseReinjectionSurface(finalRequest);
    reinjectionsChecked += 1;
    if (reinjectionSurface.ok) reinjectionsPassed += 1;
    else caseFailures.push(`functionResponse reinjection surface failed for ${functionCall.name}`);
    reinjectionSurfaces.push(reinjectionSurface);
    redactionOk = redactionOk && redactionPassed(sanitizeGenerateContentRequest(finalRequest));
  }

  const expectedBlocked = testCase.expected_blocked_tools || [];
  for (const expected of expectedBlocked) {
    if (!approvalDecisions.some((decision) => decision.tool_name === expected && decision.approved === false)) {
      caseFailures.push(`expected blocked tool was not blocked: ${expected}`);
    }
  }
  for (const expected of testCase.expected_mock_tools_executed || []) {
    if (!toolExecutions.some((execution) => execution.tool_name === expected)) {
      caseFailures.push(`expected mock tool was not executed: ${expected}`);
    }
  }

  trace.record("gemini_tool_calling_dry_run_checked", {
    case_id: testCase.case_id,
    request_surface: surface,
    argument_results: argumentResults,
    approval_decisions: approvalDecisions,
    reinjection_surfaces: reinjectionSurfaces
  });

  const status = caseFailures.length ? "fail" : "pass";
  if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
  toolCases.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status,
    request_surface: surface,
    argument_results: argumentResults,
    approval_decisions: approvalDecisions,
    tool_executions: toolExecutions,
    reinjection_surfaces: reinjectionSurfaces,
    failures: caseFailures
  });
}

const safetyRecords = loadJsonl(p("adapters", "api", "gemini", "safety_cases.jsonl"));
const safetyCases = [];
for (const record of safetyRecords) {
  const testCase = record.value;
  const request = mapSafetySettingsRequest(testCase, process.env);
  const surface = assertSafetySettingsSurface(request);
  const mappedBlocked = mapSafetyBlockedResponse(testCase.synthetic_blocked_response);
  const requestRedacted = sanitizeGenerateContentRequest(request);
  const responseRedacted = sanitizeMappedResponse(mappedBlocked);
  const caseFailures = [];

  if (!surface.ok) caseFailures.push("safetySettings request surface violation");
  if (!mappedBlocked.blocked_response_handled) caseFailures.push("blocked response was not handled");
  if (mappedBlocked.block_reason !== testCase.expected_block_reason) {
    caseFailures.push(`expected block reason ${testCase.expected_block_reason}`);
  }
  redactionOk = redactionOk && redactionPassed(requestRedacted) && redactionPassed(responseRedacted);
  sanitizedRequests.push(requestRedacted);
  sanitizedResponses.push(responseRedacted);

  trace.record("gemini_safety_fixture_checked", {
    case_id: testCase.case_id,
    request_surface: surface,
    blocked_response_handled: mappedBlocked.blocked_response_handled,
    block_reason: mappedBlocked.block_reason
  });

  const status = caseFailures.length ? "fail" : "pass";
  if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
  safetyCases.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status,
    request_surface: surface,
    blocked_response_handled: mappedBlocked.blocked_response_handled,
    block_reason: mappedBlocked.block_reason,
    failures: caseFailures
  });
}

const liveStatus = liveBlockStatus(process.env);
const liveCaseResults = [];
if (liveStatus === "allowed") {
  for (const record of canaryRecords) {
    const testCase = record.value;
    const request = mapCanaryRequest(testCase, process.env);
    const surface = assertNoDisallowedRequestSurface(request);
    const caseFailures = [];
    if (!surface.ok) caseFailures.push(`request surface violation: ${surface.disallowed_fields.join(", ")}`);
    if (!caseFailures.length) {
      trace.record("gemini_provider_request_sent", {
        case_id: testCase.case_id,
        target: "models.generateContent",
        store: false
      }, true);
      providerExecution = true;
      try {
        const rawResponse = await createGenerateContent(request, process.env);
        const mapped = mapGeminiResponse(rawResponse);
        const responseRedacted = sanitizeMappedResponse(mapped);
        if (mapped.finish_reason === "MAX_TOKENS") {
          caseFailures.push("provider response finished with MAX_TOKENS; increase GEMINI_MAX_OUTPUT_TOKENS or reduce Gemini thinking budget");
        }
        if (!mapped.output_text.includes(testCase.expected_contains)) {
          caseFailures.push(`expected output to contain ${testCase.expected_contains}`);
        }
        redactionOk = redactionOk && redactionPassed(responseRedacted);
        trace.record("gemini_provider_response_mapped", {
          case_id: testCase.case_id,
          response_redacted: responseRedacted
        }, true);
      } catch (error) {
        caseFailures.push(`provider request failed: ${error.message}`);
        trace.record("gemini_provider_canary_failed", {
          case_id: testCase.case_id,
          error_message: String(error.message).slice(0, 240)
        }, true);
      }
    }
    const status = caseFailures.length ? "fail" : "pass";
    if (status === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });
    liveCaseResults.push({
      case_id: testCase.case_id,
      status,
      provider_execution: true,
      finish_reason: caseFailures.some((failure) => failure.includes("MAX_TOKENS")) ? "MAX_TOKENS" : null,
      failures: caseFailures
    });
  }
}

const mappingReport = {
  status: mappingCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  api_lane: "native_gemini_api",
  request_mapping: {
    contents_parts_used: mappingCases.every((item) => item.request_surface.contents_parts_used),
    system_instruction_used: mappingCases.every((item) => item.request_surface.system_instruction_used),
    tools_present: mappingCases.some((item) => item.request_surface.tools_used),
    structured_output_present: mappingCases.some((item) => item.request_surface.structured_output_used),
    store_false: mappingCases.every((item) => item.request_surface.store_false_enforced),
    max_output_tokens_bounded: mappingCases.every((item) => item.request_surface.max_output_tokens_bounded)
  },
  response_mapping: {
    output_text_extracted: mappingCases.every((item) => Boolean(item.response_mapping.output_text_hash)),
    raw_response_hash_present: mappingCases.every((item) => Boolean(item.response_mapping.raw_response_hash)),
    raw_response_stored: false
  },
  cases_total: mappingCases.length,
  cases_passed: mappingCases.filter((item) => item.status === "pass").length,
  cases_failed: mappingCases.filter((item) => item.status !== "pass").length,
  cases: mappingCases
};

const structuredReport = {
  status: structuredCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  api_lane: "native_gemini_api",
  response_json_schema_used: structuredCases.every((item) => item.request_surface.response_json_schema_used),
  response_mime_type_json: structuredCases.every((item) => item.request_surface.response_mime_type_json),
  ajv_validation_used: true,
  schema_validations_total: structuredCases.length,
  schema_validations_passed: structuredCases.filter((item) => item.ajv_valid).length,
  schema_validations_failed: structuredCases.filter((item) => !item.ajv_valid).length,
  tools_used: false,
  cases: structuredCases
};

const toolReport = {
  status: toolCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  api_lane: "native_gemini_api",
  function_declarations_used: toolCases.some((item) => item.request_surface.function_declarations_present),
  function_calling_config_used: toolCases.every((item) => item.request_surface.function_calling_config_present),
  built_in_tools_used: toolCases.some((item) => item.request_surface.built_in_tools_present),
  tool_argument_ajv_validation_used: true,
  tool_argument_validations_total: toolArgumentValidationsTotal,
  tool_argument_validations_passed: toolArgumentValidationsPassed,
  tool_argument_validations_failed: toolArgumentValidationsTotal - toolArgumentValidationsPassed,
  mock_tools_only: true,
  mock_tools_executed: mockToolsExecuted,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  tool_outputs_reclassified_untrusted: toolOutputsReclassified,
  reinjections_checked: reinjectionsChecked,
  reinjections_passed: reinjectionsPassed,
  reinjections_failed: reinjectionsChecked - reinjectionsPassed,
  external_side_effects: false,
  cases: toolCases
};

const safetyReport = {
  status: safetyCases.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  api_lane: "native_gemini_api",
  safety_settings_request_shape_checked: safetyCases.every((item) => item.request_surface.safety_settings_present),
  blocked_response_handling_checked: safetyCases.every((item) => item.blocked_response_handled),
  cases_total: safetyCases.length,
  cases_passed: safetyCases.filter((item) => item.status === "pass").length,
  cases_failed: safetyCases.filter((item) => item.status !== "pass").length,
  cases: safetyCases
};

const localDryRunStatus = [
  mappingReport.status,
  structuredReport.status,
  toolReport.status,
  safetyReport.status
].every((status) => status === "pass") && redactionOk ? "pass" : "fail";

const status = localDryRunStatus === "fail"
  ? "fail"
  : liveStatus === "allowed"
    ? (liveCaseResults.every((item) => item.status === "pass") ? "pass" : "fail")
    : liveStatus;

if (status === "pass") {
  trace.record("gemini_provider_canary_completed", {
    local_dry_run_status: localDryRunStatus,
    live_cases_total: liveCaseResults.length
  }, providerExecution);
} else if (status === "fail") {
  trace.record("gemini_provider_canary_failed", {
    failures_total: failures.length
  }, providerExecution);
} else {
  trace.record("gemini_provider_canary_blocked", {
    status,
    local_dry_run_status: localDryRunStatus
  });
}
trace.record("gemini_provider_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const redactionReport = {
  status: redactionOk ? "pass" : "fail",
  stage: STAGE,
  redaction_passed: redactionOk,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false,
  request_examples_redacted: sanitizedRequests.slice(0, 8),
  response_examples_redacted: sanitizedResponses.slice(0, 8)
};

const unresolvedItems = status === "pass" || status === "fail"
  ? []
  : [
      {
        id: "GPC-001",
        severity: "medium",
        description: status === "blocked_by_live_execution_not_enabled"
          ? "Gemini live provider canary was not executed because GEMINI_PROVIDER_CANARY_ENABLE_LIVE=1 was not set."
          : status === "blocked_by_network_approval_missing"
            ? "Gemini live provider canary was not executed because GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1 was not set."
            : "Gemini live provider canary was not executed because GEMINI_API_KEY or GEMINI_MODEL was unavailable.",
        blocks_provider_verified_claim: true,
        blocks_adapter_checked_claim: true,
        owner: "human",
        recommended_next_action: "Provide GEMINI_API_KEY, GEMINI_MODEL, GEMINI_PROVIDER_CANARY_ENABLE_LIVE=1, explicit network approval, and GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1, then rerun the Gemini provider canary."
      }
    ];

const report = {
  status,
  stage: STAGE,
  mode: MODE,
  api_lane: "native_gemini_api",
  provider: "gemini",
  provider_execution: providerExecution,
  live_execution_enabled: process.env.GEMINI_PROVIDER_CANARY_ENABLE_LIVE === "1",
  local_model_execution: false,
  external_side_effects: false,
  local_dry_run_status: localDryRunStatus,
  request_response_mapping_status: mappingReport.status,
  structured_output_status: structuredReport.status,
  tool_calling_dry_run_status: toolReport.status,
  safety_fixture_status: safetyReport.status,
  cases_total: mappingCases.length + structuredCases.length + toolCases.length + safetyCases.length,
  cases_passed: mappingCases.concat(structuredCases, toolCases, safetyCases).filter((item) => item.status === "pass").length,
  cases_failed: mappingCases.concat(structuredCases, toolCases, safetyCases).filter((item) => item.status !== "pass").length,
  live_cases_total: liveCaseResults.length,
  live_cases_passed: liveCaseResults.filter((item) => item.status === "pass").length,
  live_cases_failed: liveCaseResults.filter((item) => item.status !== "pass").length,
  redaction_passed: redactionOk,
  trace_events_total: trace.events.length,
  raw_response_stored: false,
  model_env_present: Boolean(process.env.GEMINI_MODEL),
  credential_env_present: Boolean(process.env.GEMINI_API_KEY),
  network_approval_marker_present: process.env.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL === "1",
  claims_allowed: status === "pass" ? claimsAllowedAfterLive : claimsAllowedAfterDryRun,
  claims_not_allowed: claimsNotAllowed,
  failures,
  live_case_results: liveCaseResults
};

writeReports({
  report,
  mappingReport,
  structuredReport,
  toolReport,
  safetyReport,
  redactionReport,
  traceEvents: trace.events,
  unresolvedItems
});

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
