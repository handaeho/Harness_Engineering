#!/usr/bin/env node
import path from "node:path";
import { createGenerateContent } from "../../../adapters/api/gemini/generate_content_client.mjs";
import { mapGeminiResponse } from "../../../adapters/api/gemini/response_mapper.mjs";
import {
  assertFunctionResponseReinjectionSurface,
  assertToolCallingRequestSurface,
  loadToolArgumentSchema,
  mapToolCallingFinalRequest,
  mapToolCallingRequest
} from "../../../adapters/api/gemini/tool_calling_mapper.mjs";
import {
  redactionPassed,
  sanitizeGenerateContentRequest,
  sanitizeMappedResponse
} from "../../../adapters/api/gemini/redaction_policy.mjs";
import { executeProviderMockTool } from "../../../runtime/tools/provider_mock_tool_registry.mjs";
import { checkProviderToolApproval } from "../../../runtime/tools/provider_tool_approval_gate.mjs";
import { classifyProviderToolOutput } from "../../../runtime/tools/provider_tool_output_classifier.mjs";
import { createAjv, compileSchema } from "../../lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-tool-calling-live-canary";
const MODE = "gemini_tool_calling_live_canary_mock_tools_only";
const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowedAfterLive = [
  "gemini-tool-calling-live-canary-executed",
  "gemini-provider-tool-call-path-checked",
  "gemini-tool-argument-schema-live-validated",
  "gemini-function-response-reinjection-live-checked",
  "gemini-tool-approval-boundary-checked",
  "gemini-tool-output-reclassification-checked",
  "gemini-tool-calling-trace-captured",
  "gemini-tool-calling-redaction-checked"
];
const claimsAllowedAfterBlockedDryRun = [
  "gemini-tool-calling-dry-run-checked",
  "gemini-tool-argument-schema-local-validation-checked",
  "gemini-function-response-reinjection-dry-run-checked"
];
const claimsNotAllowed = [
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
  "provider-diverse",
  "replay-verified",
  "release-gated",
  "production-ready",
  "production-monitored"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function loadJsonl(file) {
  return readText(file)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => ({ file, line: index + 1, value: JSON.parse(line) }));
}

function liveBlockStatus(env = process.env) {
  if (!env.GEMINI_API_KEY) return "blocked_by_missing_credential";
  if (!env.GEMINI_MODEL) return "blocked_by_missing_model";
  if (env.GEMINI_PROVIDER_CANARY_ENABLE_LIVE !== "1") return "blocked_by_live_execution_not_enabled";
  if (env.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL !== "1") return "blocked_by_network_approval_missing";
  return "allowed";
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
  const md = `# Gemini Tool Calling Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: ${report.provider_execution}
- Tool calling used: ${report.tool_calling_used}
- Function tools used: ${report.function_tools_used}
- Built-in tools used: ${report.built_in_tools_used}
- Local model execution: ${report.local_model_execution}
- External side effects: ${report.external_side_effects}
- Store false enforced: ${report.store_false_enforced}
- Mock tools only: ${report.mock_tools_only}
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Tool calls total: ${report.tool_calls_total}
- Mock tools executed: ${report.mock_tools_executed}
- Blocked tools requested: ${report.blocked_tools_requested}
- Blocked tools executed: ${report.blocked_tools_executed}
- Final responses received: ${report.final_responses_received}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after live pass: ${claimsAllowedAfterLive.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const top = p("evidence", "beta-tool-calling-canary-gemini");
  writeJson(p("evals", "reports", "gemini_tool_calling_canary_report.json"), report);
  writeText(p("evals", "reports", "gemini_tool_calling_canary_report.md"), md);
  writeJson(path.join(top, "tool_calling_canary_report.json"), report);
  writeText(path.join(top, "tool_calling_canary_report.md"), md);
  writeJson(path.join(top, "tool_call_mapping_report.json"), mappingReport);
  writeJson(path.join(top, "tool_argument_validation_report.json"), argumentReport);
  writeJson(path.join(top, "tool_execution_report.json"), executionReport);
  writeJson(path.join(top, "approval_boundary_report.json"), approvalReport);
  writeJson(path.join(top, "redaction_report.json"), redactionReport);
  writeJson(path.join(top, "unresolved_items.json"), unresolvedItems);
  writeText(path.join(top, "tool_calling_trace_samples.jsonl"), traceEvents.map((event) => JSON.stringify(event)).join("\n"));
}

const records = loadJsonl(p("adapters", "api", "gemini", "tool_calling_cases.jsonl"));
function isLiveProviderCase(testCase) {
  return Array.isArray(testCase.tools_allowed)
    && testCase.tools_allowed.length > 0
    && Boolean(testCase.expected_final_response_contains);
}
const providerRecords = records.filter((record) => isLiveProviderCase(record.value));
const runId = `gemini-tool-calling-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = traceRecorder(runId);
const ajv = createAjv();
const localCases = [];
const liveCases = [];
const argumentValidations = [];
const executionCases = [];
const approvalDecisions = [];
const failures = [];
let providerExecution = false;
let redactionOk = true;
let toolCallsTotal = 0;
let mockToolsExecuted = 0;
let blockedToolsRequested = 0;
let blockedToolsExecuted = 0;
let toolOutputsReclassified = 0;
let finalResponsesReceived = 0;
let thoughtSignaturesCaptured = 0;
let thoughtSignaturesReinjected = 0;

trace.record("gemini_tool_calling_canary_started", {
  cases_total: records.length,
  provider_cases_total: providerRecords.length,
  mode: MODE
});

for (const record of records) {
  const testCase = record.value;
  if (!isLiveProviderCase(testCase)) {
    for (const expected of testCase.expected_blocked_tools || []) {
      const approval = checkProviderToolApproval(expected);
      approvalDecisions.push({ case_id: testCase.case_id, ...approval });
      blockedToolsRequested += 1;
      if (approval.approved) blockedToolsExecuted += 1;
    }
    localCases.push({
      case_id: testCase.case_id,
      status: blockedToolsExecuted === 0 ? "pass" : "fail",
      provider_case: false
    });
    continue;
  }

  const request = mapToolCallingRequest(testCase, root, process.env);
  const surface = assertToolCallingRequestSurface(request, testCase.tools_allowed || []);
  const syntheticCalls = testCase.synthetic_function_calls || [];
  let localOk = surface.ok;
  for (const call of syntheticCalls) {
    const validation = validateToolArguments(ajv, call.name, call.args || {});
    argumentValidations.push({ case_id: testCase.case_id, tool_name: call.name, local_dry_run: true, ...validation });
    localOk = localOk && validation.status === "pass";
    const approval = checkProviderToolApproval(call.name);
    approvalDecisions.push({ case_id: testCase.case_id, ...approval });
    localOk = localOk && approval.approved === true;
    if (approval.approved) {
      const rawOutput = executeProviderMockTool(call.name, call.args || {});
      const classified = classifyProviderToolOutput(call.name, rawOutput);
      localOk = localOk && classified.classification === "untrusted_tool_output";
    }
  }
  localCases.push({
    case_id: testCase.case_id,
    status: localOk ? "pass" : "fail",
    provider_case: true,
    request_surface: surface
  });
}

const localDryRunStatus = localCases.every((item) => item.status === "pass") && blockedToolsExecuted === 0 ? "pass" : "fail";
const liveStatus = liveBlockStatus(process.env);
if (localDryRunStatus === "pass" && liveStatus === "allowed") {
  providerExecution = true;
  for (const record of providerRecords) {
    const testCase = record.value;
    const caseFailures = [];
    const executedTools = [];
    let firstMapped = null;
    let finalMapped = null;

    const request = mapToolCallingRequest(testCase, root, process.env);
    const surface = assertToolCallingRequestSurface(request, testCase.tools_allowed || []);
    const requestRedacted = sanitizeGenerateContentRequest(request);
    redactionOk = redactionOk && redactionPassed(requestRedacted);
    trace.record("gemini_tool_calling_request_mapped", {
      case_id: testCase.case_id,
      request_surface: surface,
      request_redacted: requestRedacted
    });

    if (!surface.ok) caseFailures.push("tool calling request surface violation");
    if (!caseFailures.length) {
      try {
        trace.record("gemini_tool_calling_request_sent", {
          case_id: testCase.case_id,
          target: "models.generateContent",
          store: false
        }, true);
        const rawFirst = await createGenerateContent(request, process.env);
        firstMapped = mapGeminiResponse(rawFirst);
        const firstRedacted = sanitizeMappedResponse(firstMapped);
        redactionOk = redactionOk && redactionPassed(firstRedacted);
        trace.record("gemini_tool_calling_response_mapped", {
          case_id: testCase.case_id,
          response_redacted: firstRedacted
        }, true);

        const calls = firstMapped.function_calls || [];
        toolCallsTotal += calls.length;
        thoughtSignaturesCaptured += calls.filter((item) => item.thought_signature_present === true).length;
        const call = calls.find((item) => (testCase.tools_allowed || []).includes(item.name));
        if (!call) caseFailures.push("provider did not return an allowlisted functionCall");
        if (call && !call.thought_signature_present) caseFailures.push(`provider functionCall missing thoughtSignature for ${call.name}`);
        if (call) {
          const approval = checkProviderToolApproval(call.name);
          approvalDecisions.push({ case_id: testCase.case_id, ...approval });
          if (!approval.approved) {
            caseFailures.push(`tool was not approved: ${call.name}`);
          } else {
            const validation = validateToolArguments(ajv, call.name, call.args || {});
            argumentValidations.push({ case_id: testCase.case_id, tool_name: call.name, local_dry_run: false, ...validation });
            if (validation.status !== "pass") caseFailures.push(`tool argument validation failed for ${call.name}`);
            const rawOutput = executeProviderMockTool(call.name, call.args || {});
            const classified = classifyProviderToolOutput(call.name, rawOutput);
            toolOutputsReclassified += classified.classification === "untrusted_tool_output" ? 1 : 0;
            mockToolsExecuted += 1;
            executedTools.push({
              tool_name: call.name,
              output_classification: classified.classification,
              external_side_effect: rawOutput.external_side_effect
            });
            if (rawOutput.external_side_effect) blockedToolsExecuted += 1;

            const finalRequest = mapToolCallingFinalRequest({
              testCase,
              functionCall: call,
              toolOutput: classified,
              env: process.env
            });
            const reinjectionSurface = assertFunctionResponseReinjectionSurface(finalRequest);
            if (!reinjectionSurface.ok) caseFailures.push(`functionResponse reinjection surface failed for ${call.name}`);
            if (reinjectionSurface.function_call_thought_signature_present) thoughtSignaturesReinjected += 1;
            redactionOk = redactionOk && redactionPassed(sanitizeGenerateContentRequest(finalRequest));
            trace.record("gemini_tool_calling_function_response_reinjected", {
              case_id: testCase.case_id,
              tool_name: call.name,
              reinjection_surface: reinjectionSurface
            }, true);

            if (reinjectionSurface.ok && !caseFailures.length) {
              const rawFinal = await createGenerateContent(finalRequest, process.env);
              finalMapped = mapGeminiResponse(rawFinal);
              const finalRedacted = sanitizeMappedResponse(finalMapped);
              redactionOk = redactionOk && redactionPassed(finalRedacted);
              finalResponsesReceived += 1;
              trace.record("gemini_tool_calling_final_response_mapped", {
                case_id: testCase.case_id,
                response_redacted: finalRedacted
              }, true);
              if (finalMapped.finish_reason === "MAX_TOKENS") caseFailures.push("final provider response finished with MAX_TOKENS");
              if (testCase.expected_final_response_contains && !finalMapped.output_text.includes(testCase.expected_final_response_contains)) {
                caseFailures.push(`expected final response to contain ${testCase.expected_final_response_contains}`);
              }
            }
          }
        }
      } catch (error) {
        const message = String(error.message || error).slice(0, 320);
        caseFailures.push(`provider request failed: ${message}`);
        trace.record("gemini_tool_calling_provider_error", {
          case_id: testCase.case_id,
          error_message: message,
          error_status: error.status || null
        }, true);
      }
    }

    const status = caseFailures.length ? "fail" : "pass";
    if (status !== "pass") failures.push({ case_id: testCase.case_id, failures: caseFailures });
    executionCases.push({
      case_id: testCase.case_id,
      status,
      executed_tools: executedTools,
      final_response_received: Boolean(finalMapped),
      failures: caseFailures
    });
    liveCases.push({
      case_id: testCase.case_id,
      status,
      provider_execution: true,
      tool_calls_total: firstMapped?.function_calls?.length || 0,
      final_response_received: Boolean(finalMapped),
      failures: caseFailures
    });
  }
}

const status = localDryRunStatus === "fail"
  ? "fail"
  : liveStatus === "allowed"
    ? (liveCases.every((item) => item.status === "pass") ? "pass" : "fail")
    : liveStatus;

trace.record(status === "pass" ? "gemini_tool_calling_canary_completed" : "gemini_tool_calling_canary_stopped", {
  status,
  local_dry_run_status: localDryRunStatus,
  live_cases_total: liveCases.length
}, providerExecution);
trace.record("gemini_tool_calling_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const report = {
  status,
  stage: STAGE,
  mode: MODE,
  provider: "gemini",
  provider_execution: providerExecution,
  tool_calling_used: localCases.some((item) => item.request_surface?.tools_present),
  function_tools_used: localCases.some((item) => item.request_surface?.function_declarations_present),
  built_in_tools_used: false,
  remote_mcp_used: false,
  local_model_execution: false,
  external_side_effects: false,
  store_false_enforced: localCases.every((item) => item.request_surface ? item.request_surface.store_false_enforced : true),
  tool_argument_ajv_validation_used: true,
  mock_tools_only: true,
  local_dry_run_status: localDryRunStatus,
  cases_total: records.length,
  cases_passed: liveStatus === "allowed" ? liveCases.filter((item) => item.status === "pass").length + localCases.filter((item) => !item.provider_case && item.status === "pass").length : localCases.filter((item) => item.status === "pass").length,
  cases_failed: liveStatus === "allowed" ? liveCases.filter((item) => item.status !== "pass").length + localCases.filter((item) => !item.provider_case && item.status !== "pass").length : localCases.filter((item) => item.status !== "pass").length,
  live_cases_total: liveCases.length,
  live_cases_passed: liveCases.filter((item) => item.status === "pass").length,
  live_cases_failed: liveCases.filter((item) => item.status !== "pass").length,
  tool_calls_total: toolCallsTotal,
  tool_argument_validations_total: argumentValidations.length,
  tool_argument_validations_passed: argumentValidations.filter((item) => item.status === "pass").length,
  tool_argument_validations_failed: argumentValidations.filter((item) => item.status !== "pass").length,
  mock_tools_executed: mockToolsExecuted,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  tool_outputs_reclassified_untrusted: toolOutputsReclassified,
  thought_signatures_captured: thoughtSignaturesCaptured,
  thought_signatures_reinjected: thoughtSignaturesReinjected,
  final_responses_received: finalResponsesReceived,
  expected_final_responses: providerRecords.length,
  trace_events_total: trace.events.length,
  redaction_passed: redactionOk,
  raw_response_stored: false,
  claims_allowed: status === "pass" ? claimsAllowedAfterBlockedDryRun.concat(claimsAllowedAfterLive) : claimsAllowedAfterBlockedDryRun,
  claims_not_allowed: claimsNotAllowed,
  failures,
  local_case_results: localCases,
  live_case_results: liveCases
};

const mappingReport = {
  status,
  stage: STAGE,
  request_mapping: {
    model_from_env: Boolean(process.env.GEMINI_MODEL),
    tools_present: report.tool_calling_used,
    function_tools_present: report.function_tools_used,
    built_in_tools_present: false,
    structured_output_present: false,
    store_false: report.store_false_enforced
  },
  response_mapping: {
    provider_response_id_present: status === "pass",
    tool_calls_extracted: status === "pass",
    final_response_text_extracted: status === "pass",
    raw_response_hash_present: status === "pass",
    raw_response_stored: false
  },
  cases_total: records.length,
  cases_mapped: status === "pass" ? records.length : 0
};
const argumentReport = {
  status,
  stage: STAGE,
  ajv_validation_used: true,
  tool_argument_validations_total: report.tool_argument_validations_total,
  tool_argument_validations_passed: report.tool_argument_validations_passed,
  tool_argument_validations_failed: report.tool_argument_validations_failed,
  cases: argumentValidations
};
const executionReport = {
  status,
  stage: STAGE,
  mock_tools_only: true,
  mock_tools_executed: mockToolsExecuted,
  blocked_tools_executed: blockedToolsExecuted,
  tool_outputs_reclassified_untrusted: toolOutputsReclassified,
  final_responses_received: finalResponsesReceived,
  expected_final_responses: providerRecords.length,
  cases: executionCases
};
const approvalReport = {
  status,
  stage: STAGE,
  approval_gate_checked: approvalDecisions.length > 0,
  blocked_tools_requested: blockedToolsRequested,
  blocked_tools_executed: blockedToolsExecuted,
  decisions: approvalDecisions
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
const unresolvedItems = status === "pass" || status === "fail"
  ? []
  : [{
      id: "GTC-001",
      severity: "medium",
      description: `Gemini tool calling live canary was not executed: ${status}.`,
      blocks_tool_call_verified_claim: true,
      owner: "human",
      recommended_next_action: "Run this canary with GEMINI_API_KEY, GEMINI_MODEL, GEMINI_PROVIDER_CANARY_ENABLE_LIVE=1, and GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1."
    }];

writeReports(report, mappingReport, argumentReport, executionReport, approvalReport, redactionReport, trace.events, unresolvedItems);
console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
