#!/usr/bin/env node
import path from "node:path";
import { createGenerateContent } from "../../../adapters/api/gemini/generate_content_client.mjs";
import {
  assertStructuredOutputRequestSurface,
  mapStructuredOutputRequest,
  mapStructuredOutputResponse
} from "../../../adapters/api/gemini/structured_output_mapper.mjs";
import {
  redactionPassed,
  sanitizeGenerateContentRequest,
  sanitizeMappedResponse
} from "../../../adapters/api/gemini/redaction_policy.mjs";
import { createAjv, compileSchema } from "../../lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-structured-output-live-canary";
const MODE = "gemini_structured_output_live_canary_no_tools";
const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowedAfterLive = [
  "gemini-structured-output-live-canary-executed",
  "gemini-provider-structured-output-path-checked",
  "gemini-json-schema-response-live-validated",
  "gemini-structured-output-trace-captured",
  "gemini-structured-output-redaction-checked"
];
const claimsAllowedAfterBlockedDryRun = [
  "gemini-structured-output-dry-run-checked",
  "gemini-json-schema-local-validation-checked"
];
const claimsNotAllowed = [
  "schema-output-verified",
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
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

function writeReports(report, mappingReport, schemaReport, redactionReport, traceEvents, unresolvedItems) {
  const md = `# Gemini Structured Output Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: ${report.provider_execution}
- Structured output used: ${report.structured_output_used}
- Tools used: ${report.tools_used}
- Local model execution: false
- External side effects: false
- Store false enforced: ${report.store_false_enforced}
- Ajv validation used: ${report.ajv_validation_used}
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Schema validations passed: ${report.schema_validations_passed}
- Schema validations failed: ${report.schema_validations_failed}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after live pass: ${claimsAllowedAfterLive.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const top = p("evidence", "beta-structured-output-canary-gemini");
  writeJson(p("evals", "reports", "gemini_structured_output_canary_report.json"), report);
  writeText(p("evals", "reports", "gemini_structured_output_canary_report.md"), md);
  writeJson(path.join(top, "structured_output_canary_report.json"), report);
  writeText(path.join(top, "structured_output_canary_report.md"), md);
  writeJson(path.join(top, "structured_output_mapping_report.json"), mappingReport);
  writeJson(path.join(top, "schema_validation_report.json"), schemaReport);
  writeJson(path.join(top, "redaction_report.json"), redactionReport);
  writeJson(path.join(top, "unresolved_items.json"), unresolvedItems);
  writeText(path.join(top, "structured_output_trace_samples.jsonl"), traceEvents.map((event) => JSON.stringify(event)).join("\n"));
}

async function runLiveCase({ testCase, shape, ajv, trace }) {
  const env = { ...process.env, GEMINI_STRUCTURED_OUTPUT_SHAPE: shape };
  const request = mapStructuredOutputRequest(testCase, env);
  const surface = assertStructuredOutputRequestSurface(request);
  const requestRedacted = sanitizeGenerateContentRequest(request);
  const caseFailures = [];
  let mappedResponse = null;
  let responseRedacted = null;
  let schemaOk = false;

  if (!surface.ok) caseFailures.push(`request surface violation for ${shape}`);
  trace.record("gemini_structured_output_request_mapped", {
    case_id: testCase.case_id,
    shape,
    request_surface: surface,
    request_redacted: requestRedacted
  });

  if (!caseFailures.length) {
    trace.record("gemini_structured_output_request_sent", {
      case_id: testCase.case_id,
      shape,
      target: "models.generateContent",
      store: false
    }, true);
    const rawResponse = await createGenerateContent(request, env);
    mappedResponse = mapStructuredOutputResponse(rawResponse);
    responseRedacted = sanitizeMappedResponse(mappedResponse);
    trace.record("gemini_structured_output_response_mapped", {
      case_id: testCase.case_id,
      shape,
      response_redacted: responseRedacted
    }, true);
    if (mappedResponse.finish_reason === "MAX_TOKENS") {
      caseFailures.push("provider response finished with MAX_TOKENS");
    }
    const validate = compileSchema(ajv, testCase.schema, `${testCase.case_id}.schema`);
    schemaOk = Boolean(mappedResponse.parsed_json) && validate(mappedResponse.parsed_json);
    if (!schemaOk) caseFailures.push(`Ajv validation failed: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
  }

  return {
    shape,
    status: caseFailures.length ? "fail" : "pass",
    failures: caseFailures,
    request_surface: surface,
    request_redacted: requestRedacted,
    response_redacted: responseRedacted,
    parsed_json_present: Boolean(mappedResponse?.parsed_json),
    raw_response_hash_present: Boolean(mappedResponse?.raw_response_hash),
    schema_ok: schemaOk,
    redaction_ok: redactionPassed(requestRedacted) && redactionPassed(responseRedacted || {})
  };
}

const records = loadJsonl(p("adapters", "api", "gemini", "structured_output_cases.jsonl"));
const runId = `gemini-structured-output-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = traceRecorder(runId);
const ajv = createAjv();
const localCases = [];
const liveCases = [];
const failures = [];
let providerExecution = false;
let redactionOk = true;

trace.record("gemini_structured_output_canary_started", {
  cases_total: records.length,
  mode: MODE
});

for (const record of records) {
  const testCase = record.value;
  const request = mapStructuredOutputRequest(testCase, process.env);
  const surface = assertStructuredOutputRequestSurface(request);
  const mapped = mapStructuredOutputResponse(syntheticStructuredResponse(testCase));
  const validate = compileSchema(ajv, testCase.schema, `${testCase.case_id}.local.schema`);
  const schemaOk = validate(mapped.parsed_json);
  const status = surface.ok && schemaOk ? "pass" : "fail";
  if (status !== "pass") failures.push({ case_id: testCase.case_id, failures: ["local structured output dry-run failed"] });
  localCases.push({
    case_id: testCase.case_id,
    status,
    request_surface: surface,
    ajv_valid: schemaOk
  });
}

const localDryRunStatus = localCases.every((item) => item.status === "pass") ? "pass" : "fail";
const liveStatus = liveBlockStatus(process.env);
if (localDryRunStatus === "pass" && liveStatus === "allowed") {
  providerExecution = true;
  const preferredShape = process.env.GEMINI_STRUCTURED_OUTPUT_SHAPE;
  const shapes = preferredShape ? [preferredShape] : ["responseJsonSchema", "responseFormat"];
  for (const record of records) {
    const testCase = record.value;
    let caseResult = null;
    const providerErrors = [];
    for (const shape of shapes) {
      try {
        caseResult = await runLiveCase({ testCase, shape, ajv, trace });
        if (caseResult.status === "pass") break;
      } catch (error) {
        providerErrors.push(`${shape}: ${String(error.message).slice(0, 240)}`);
        trace.record("gemini_structured_output_provider_error", {
          case_id: testCase.case_id,
          shape,
          error_message: String(error.message).slice(0, 240)
        }, true);
      }
    }
    if (!caseResult || caseResult.status !== "pass") {
      const caseFailures = caseResult?.failures?.length ? caseResult.failures : providerErrors;
      failures.push({ case_id: testCase.case_id, failures: caseFailures });
      liveCases.push({
        case_id: testCase.case_id,
        status: "fail",
        provider_execution: true,
        shape: caseResult?.shape || null,
        failures: caseFailures
      });
    } else {
      liveCases.push({
        case_id: testCase.case_id,
        status: "pass",
        provider_execution: true,
        shape: caseResult.shape,
        failures: []
      });
    }
    redactionOk = redactionOk && (caseResult?.redaction_ok !== false);
  }
}

const status = localDryRunStatus === "fail"
  ? "fail"
  : liveStatus === "allowed"
    ? (liveCases.every((item) => item.status === "pass") ? "pass" : "fail")
    : liveStatus;

trace.record(status === "pass" ? "gemini_structured_output_canary_completed" : "gemini_structured_output_canary_stopped", {
  status,
  local_dry_run_status: localDryRunStatus,
  live_cases_total: liveCases.length
}, providerExecution);
trace.record("gemini_structured_output_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const structuredOutputUsed = localCases.every((item) => item.request_surface.structured_output_used);
const report = {
  status,
  stage: STAGE,
  mode: MODE,
  provider: "gemini",
  provider_execution: providerExecution,
  structured_output_used: structuredOutputUsed,
  tools_used: false,
  local_model_execution: false,
  external_side_effects: false,
  store_false_enforced: localCases.every((item) => item.request_surface.store_false_enforced),
  ajv_validation_used: true,
  local_dry_run_status: localDryRunStatus,
  cases_total: records.length,
  cases_passed: liveStatus === "allowed" ? liveCases.filter((item) => item.status === "pass").length : localCases.filter((item) => item.status === "pass").length,
  cases_failed: liveStatus === "allowed" ? liveCases.filter((item) => item.status !== "pass").length : localCases.filter((item) => item.status !== "pass").length,
  schema_validations_total: records.length,
  schema_validations_passed: liveStatus === "allowed" ? liveCases.filter((item) => item.status === "pass").length : localCases.filter((item) => item.ajv_valid).length,
  schema_validations_failed: liveStatus === "allowed" ? liveCases.filter((item) => item.status !== "pass").length : localCases.filter((item) => !item.ajv_valid).length,
  live_cases_total: liveCases.length,
  live_cases_passed: liveCases.filter((item) => item.status === "pass").length,
  live_cases_failed: liveCases.filter((item) => item.status !== "pass").length,
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
    tools_present: false,
    structured_output_present: structuredOutputUsed,
    response_json_schema_seen: localCases.some((item) => item.request_surface.response_json_schema_used),
    response_format_seen: localCases.some((item) => item.request_surface.response_format_used),
    store_false: report.store_false_enforced,
    max_output_tokens_bounded: localCases.every((item) => item.request_surface.max_output_tokens_bounded)
  },
  response_mapping: {
    output_text_extracted: status === "pass",
    parsed_json_present: status === "pass",
    raw_response_hash_present: status === "pass",
    raw_response_stored: false
  },
  cases_total: records.length,
  cases_mapped: status === "pass" ? records.length : 0
};
const schemaReport = {
  status,
  stage: STAGE,
  ajv_validation_used: true,
  schema_validations_total: report.schema_validations_total,
  schema_validations_passed: report.schema_validations_passed,
  schema_validations_failed: report.schema_validations_failed,
  local_cases: localCases,
  live_cases: liveCases
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
      id: "GSO-001",
      severity: "medium",
      description: `Gemini structured output live canary was not executed: ${status}.`,
      blocks_schema_output_verified_claim: true,
      owner: "human",
      recommended_next_action: "Run this canary with GEMINI_API_KEY, GEMINI_MODEL, GEMINI_PROVIDER_CANARY_ENABLE_LIVE=1, and GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1."
    }];

writeReports(report, mappingReport, schemaReport, redactionReport, trace.events, unresolvedItems);
console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
