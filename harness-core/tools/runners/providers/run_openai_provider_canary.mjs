#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { mapCanaryRequest, assertNoDisallowedRequestSurface } from "../../../adapters/api/openai/request_mapper.mjs";
import { createTextOnlyResponse } from "../../../adapters/api/openai/responses_client.mjs";
import { mapOpenAIResponse } from "../../../adapters/api/openai/response_mapper.mjs";
import { redactionPassed, sanitizeMappedResponse, sanitizeRequest } from "../../../adapters/api/openai/redaction_policy.mjs";
import { checkProviderExecutionGuard } from "../../../runtime/provider/provider_execution_guard.mjs";
import { createProviderTraceRecorder } from "../../../runtime/provider/provider_trace_recorder.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-provider-canary-openai-credentialed-rerun";
const MODE = "openai_provider_canary_no_tools_no_structured_output";

const args = process.argv.slice(2);
const attemptArg = args.find((arg) => arg.startsWith("--attempt-id="));
const rootArg = args.find((arg) => !arg.startsWith("--"));
const ATTEMPT_ID = attemptArg
  ? attemptArg.slice("--attempt-id=".length)
  : process.env.OPENAI_PROVIDER_CANARY_ATTEMPT_ID || null;

const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked"
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

function statusIsBlocked(status) {
  return status === "blocked_by_missing_credential"
    || status === "blocked_by_missing_model"
    || status === "blocked_by_malformed_model_env";
}

function writeReports(report, mappingReport, redactionReport, traceEvents, unresolvedItems) {
  const md = `# OpenAI Provider Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: ${report.provider_execution}
- Local model execution: false
- External side effects: false
- Tools used: ${report.tools_used}
- Structured output used: ${report.structured_output_used}
- Store false enforced: ${report.store_false_enforced}
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after pass: ${claimsAllowed.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const traceLines = traceEvents.map((event) => JSON.stringify(event));
  writeJson(p("evals", "reports", "openai_provider_canary_report.json"), report);
  writeText(p("evals", "reports", "openai_provider_canary_report.md"), md);
  writeJson(p("evidence", "beta-provider-canary-openai", "provider_canary_report.json"), report);
  writeText(p("evidence", "beta-provider-canary-openai", "provider_canary_report.md"), md);
  writeText(p("evidence", "beta-provider-canary-openai", "provider_trace_samples.jsonl"), traceLines.join("\n"));
  writeJson(p("evidence", "beta-provider-canary-openai", "request_response_mapping_report.json"), mappingReport);
  writeJson(p("evidence", "beta-provider-canary-openai", "redaction_report.json"), redactionReport);
  writeJson(p("evidence", "beta-provider-canary-openai", "unresolved_items.json"), unresolvedItems);

  if (ATTEMPT_ID) {
    const attempt = p("evidence", "beta-provider-canary-openai", "attempts", ATTEMPT_ID);
    writeJson(path.join(attempt, "provider_canary_report.json"), report);
    writeText(path.join(attempt, "provider_canary_report.md"), md);
    writeText(path.join(attempt, "provider_trace_samples.jsonl"), traceLines.join("\n"));
    writeJson(path.join(attempt, "request_response_mapping_report.json"), mappingReport);
    writeJson(path.join(attempt, "redaction_report.json"), redactionReport);
    writeJson(path.join(attempt, "unresolved_items.json"), unresolvedItems);
  }
}

const canaryRecords = loadJsonl(p("adapters", "api", "openai", "canary_cases.jsonl"));
const cases = canaryRecords.map((record) => record.value);
const runId = `openai-canary-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = createProviderTraceRecorder(runId);
const caseResults = [];
const mappingCases = [];
const failures = [];

trace.record("provider_canary_started", {
  cases_total: cases.length,
  mode: MODE
}, false);

let providerExecution = false;
let guardStatus = "allowed";
let guardReason = "not_checked";
let storeFalseEnforced = true;
let toolsUsed = false;
let structuredOutputUsed = false;
let redactionOk = true;
const responseMappingSummaries = [];

const firstRequest = mapCanaryRequest(cases[0], process.env);
const firstSurface = assertNoDisallowedRequestSurface(firstRequest);
const firstGuard = checkProviderExecutionGuard({
  stage: STAGE,
  request: firstRequest,
  env: process.env
});
guardStatus = firstGuard.status;
guardReason = firstGuard.reason;
storeFalseEnforced = firstSurface.store_false_enforced;
toolsUsed = !firstSurface.ok && firstSurface.disallowed_fields.includes("tools");
structuredOutputUsed = !firstSurface.ok && firstSurface.disallowed_fields.some((field) => field === "response_format" || field === "text.format");

trace.record("provider_guard_checked", {
  status: firstGuard.status,
  allowed: firstGuard.allowed,
  reason: firstGuard.reason,
  request_surface: firstSurface
}, false);

if (!firstGuard.allowed) {
  const status = statusIsBlocked(firstGuard.status) ? firstGuard.status : "fail";
  trace.record("provider_canary_blocked", {
    status: firstGuard.status,
    reason: firstGuard.reason
  }, false);
  trace.record("provider_trace_recorded", {
    event_count: trace.events.length + 1
  }, false);

  const report = {
    status,
    stage: STAGE,
    mode: MODE,
    provider: "openai",
    provider_execution: false,
    local_model_execution: false,
    external_side_effects: false,
    tools_used: toolsUsed,
    structured_output_used: structuredOutputUsed,
    store_false_enforced: storeFalseEnforced,
    cases_total: cases.length,
    cases_passed: 0,
    cases_failed: 0,
    trace_events_total: trace.events.length,
    redaction_passed: true,
    raw_response_stored: false,
    model_from_env: Boolean(process.env.OPENAI_MODEL),
    model_env_present: Boolean(process.env.OPENAI_MODEL),
    credential_env_present: Boolean(process.env.OPENAI_API_KEY),
    guard_status: guardStatus,
    guard_reason: guardReason,
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
      tools_present: false,
      structured_output_present: false,
      store_false: firstRequest.store === false,
      max_output_tokens_bounded: firstSurface.max_output_tokens_bounded
    },
    response_mapping: {
      provider_response_id_present: false,
      output_text_extracted: false,
      usage_summary_present_if_available: true,
      raw_response_hash_present: false,
      raw_response_stored: false
    },
    cases_total: cases.length,
    cases_mapped: 0,
    request_examples_redacted: [sanitizeRequest(firstRequest)],
    response_examples_redacted: []
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
      id: "OPC-001",
      severity: "medium",
      description: "OpenAI provider canary remains blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
      blocks_tool_calling_execution: true,
      blocks_structured_output_execution: true,
      blocks_local_model_execution: false,
      owner: "human",
      recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL in the execution environment, then rerun the credentialed canary."
    }
  ];

  writeReports(report, mappingReport, redactionReport, trace.events, unresolvedItems);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

for (const record of canaryRecords) {
  const testCase = record.value;
  const request = mapCanaryRequest(testCase, process.env);
  const requestSurface = assertNoDisallowedRequestSurface(request);
  const guard = checkProviderExecutionGuard({ stage: STAGE, request, env: process.env });
  const sanitizedRequest = sanitizeRequest(request);
  const caseFailures = [];
  let sanitizedResponse = null;

  trace.record("provider_guard_checked", {
    case_id: testCase.case_id,
    status: guard.status,
    allowed: guard.allowed,
    reason: guard.reason,
    request_surface: requestSurface
  }, false);

  if (!requestSurface.ok || !requestSurface.store_false_enforced) {
    caseFailures.push(`request surface violation: ${requestSurface.disallowed_fields.join(", ")}`);
  }
  if (!guard.allowed) {
    caseFailures.push(`provider guard blocked case: ${guard.status}`);
  }

  trace.record("provider_request_mapped", {
    case_id: testCase.case_id,
    request_redacted: sanitizedRequest
  }, false);

  if (!caseFailures.length) {
    trace.record("provider_request_sent", {
      case_id: testCase.case_id,
      target: "openai.responses",
      store: false
    }, true);
    providerExecution = true;

    try {
      const rawResponse = await createTextOnlyResponse(request, process.env);
      trace.record("provider_response_received", {
        case_id: testCase.case_id,
        response_id_present: Boolean(rawResponse.id)
      }, true);

      const mappedResponse = mapOpenAIResponse(rawResponse);
      sanitizedResponse = sanitizeMappedResponse(mappedResponse);
      responseMappingSummaries.push(sanitizedResponse);
      trace.record("provider_response_mapped", {
        case_id: testCase.case_id,
        response_redacted: sanitizedResponse
      }, true);

      if (!mappedResponse.output_text.includes(testCase.expected_contains)) {
        caseFailures.push(`expected output to contain ${testCase.expected_contains}`);
      }
      if (!mappedResponse.provider_response_id) {
        caseFailures.push("provider response id was not present");
      }
      if (!mappedResponse.output_text) {
        caseFailures.push("output text was not extracted");
      }
      if (!mappedResponse.raw_response_hash) {
        caseFailures.push("raw response hash was not present");
      }
      redactionOk = redactionOk && redactionPassed(sanitizedRequest) && redactionPassed(sanitizedResponse);
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
      trace.record("provider_canary_failed", {
        case_id: testCase.case_id,
        error_message: String(error.message).slice(0, 240),
        provider_error: providerError
      }, true);
    }
  }

  const caseStatus = caseFailures.length === 0 ? "pass" : "fail";
  if (caseStatus === "fail") failures.push({ case_id: testCase.case_id, failures: caseFailures });

  mappingCases.push({
    case_id: testCase.case_id,
    request_redacted: sanitizedRequest,
    response_redacted: sanitizedResponse,
    request_surface: requestSurface,
    status: caseStatus
  });

  caseResults.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status: caseStatus,
    expected_contains: testCase.expected_contains,
    failures: caseFailures
  });
}

const finalStatus = failures.length === 0 ? "pass" : "fail";
const requestMappingSummary = {
  model_from_env: Boolean(process.env.OPENAI_MODEL),
  input_text_only: mappingCases.every((item) => item.request_surface.input_text_only === true),
  tools_present: mappingCases.some((item) => item.request_redacted.tools_present === true),
  structured_output_present: mappingCases.some((item) => item.request_redacted.structured_output_present === true),
  store_false: mappingCases.every((item) => item.request_redacted.store === false),
  max_output_tokens_bounded: mappingCases.every((item) => item.request_surface.max_output_tokens_bounded === true)
};
const responseMappingSummary = {
  provider_response_id_present: responseMappingSummaries.length > 0 && responseMappingSummaries.every((item) => item.provider_response_id_present === true),
  output_text_extracted: responseMappingSummaries.length > 0 && responseMappingSummaries.every((item) => Boolean(item.output_text_preview)),
  usage_summary_present_if_available: true,
  raw_response_hash_present: responseMappingSummaries.length > 0 && responseMappingSummaries.every((item) => Boolean(item.raw_response_hash)),
  raw_response_stored: false
};
if (finalStatus === "pass") {
  trace.record("provider_canary_completed", {
    cases_total: cases.length,
    cases_passed: caseResults.filter((item) => item.status === "pass").length
  }, providerExecution);
} else {
  trace.record("provider_canary_failed", {
    failures_count: failures.length
  }, providerExecution);
}
trace.record("provider_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const report = {
  status: finalStatus,
  stage: STAGE,
  mode: MODE,
  provider: "openai",
  provider_execution: providerExecution,
  local_model_execution: false,
  external_side_effects: false,
  tools_used: false,
  structured_output_used: false,
  store_false_enforced: storeFalseEnforced,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status === "fail").length,
  trace_events_total: trace.events.length,
  redaction_passed: redactionOk,
  raw_response_stored: false,
  model_from_env: Boolean(process.env.OPENAI_MODEL),
  model_env_present: Boolean(process.env.OPENAI_MODEL),
  credential_env_present: Boolean(process.env.OPENAI_API_KEY),
  guard_status: guardStatus,
  guard_reason: guardReason,
  claims_allowed: finalStatus === "pass" ? claimsAllowed : [],
  claims_not_allowed: claimsNotAllowed,
  case_results: caseResults,
  failures
};

const mappingReport = {
  status: finalStatus,
  stage: STAGE,
  request_mapping: requestMappingSummary,
  response_mapping: responseMappingSummary,
  cases_total: cases.length,
  cases_mapped: mappingCases.length,
  cases: mappingCases
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
const allFailuresText = failures.flatMap((item) => item.failures).join("\n");
const unresolvedItems = finalStatus === "pass" ? [] : [
  {
    id: "OPC-002",
    severity: "high",
    description: allFailuresText.includes("HTTP 429")
      ? "OpenAI provider canary failed during credentialed execution because every canary case returned HTTP 429."
      : "OpenAI provider canary failed during credentialed execution.",
    blocks_tool_calling_execution: true,
    blocks_structured_output_execution: true,
    blocks_local_model_execution: false,
    owner: "agent",
    recommended_next_action: allFailuresText.includes("HTTP 429")
      ? "Check OpenAI rate limits, quota, project access, and selected model availability, then rerun the same no-tool canary before opening new provider surfaces."
      : "Inspect redacted failure details, request mapping, model availability, timeout, and response mapper, then rerun the same no-tool canary before opening new provider surfaces."
  }
];

writeReports(report, mappingReport, redactionReport, trace.events, unresolvedItems);
console.log(JSON.stringify(report, null, 2));
process.exit(finalStatus === "pass" ? 0 : 1);
