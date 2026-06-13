#!/usr/bin/env node
import path from "node:path";
import { createTextOnlyResponse } from "../../../adapters/api/openai/responses_client.mjs";
import { mapStructuredOutputRequest, assertStructuredOutputRequestSurface } from "../../../adapters/api/openai/structured_output_mapper.mjs";
import { mapStructuredOutputResponse } from "../../../adapters/api/openai/structured_output_response_mapper.mjs";
import { redactionPassed, sanitizeStructuredOutputRequest, sanitizeStructuredOutputResponse } from "../../../adapters/api/openai/structured_output_redaction_policy.mjs";
import { checkStructuredOutputExecutionGuard } from "../../../runtime/provider/structured_output_execution_guard.mjs";
import { createStructuredOutputTraceRecorder } from "../../../runtime/provider/structured_output_trace_recorder.mjs";
import { createAjv, compileSchema } from "../../lib/json_schema_validator.mjs";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-structured-output-canary-openai";
const MODE = "openai_structured_output_canary_no_tools";
const args = process.argv.slice(2);
const attemptArg = args.find((arg) => arg.startsWith("--attempt-id="));
const rootArg = args.find((arg) => !arg.startsWith("--"));
const ATTEMPT_ID = attemptArg
  ? attemptArg.slice("--attempt-id=".length)
  : process.env.OPENAI_STRUCTURED_OUTPUT_ATTEMPT_ID || "001-structured-output-canary";

const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const claimsAllowed = [
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked"
];
const claimsNotAllowed = [
  "schema-output-verified",
  "tool-call-verified",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
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

function writeReports(report, mappingReport, schemaReport, redactionReport, traceEvents, unresolvedItems) {
  const md = `# OpenAI Structured Output Canary Report

Status: ${report.status}

Stage: ${report.stage}

- Mode: ${report.mode}
- Provider execution: ${report.provider_execution}
- Structured output used: ${report.structured_output_used}
- Tools used: ${report.tools_used}
- Local model execution: false
- External side effects: false
- Store false enforced: ${report.store_false_enforced}
- Strict JSON Schema used: ${report.strict_json_schema_used}
- Ajv validation used: ${report.ajv_validation_used}
- Cases total: ${report.cases_total}
- Cases passed: ${report.cases_passed}
- Cases failed: ${report.cases_failed}
- Schema validations passed: ${report.schema_validations_passed}
- Schema validations failed: ${report.schema_validations_failed}
- Trace events total: ${report.trace_events_total}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Allows after pass: ${claimsAllowed.join(", ")}
- Does not allow: ${claimsNotAllowed.join(", ")}
`;

  const traceLines = traceEvents.map((event) => JSON.stringify(event));
  const top = p("evidence", "beta-structured-output-canary-openai");
  const attempt = p("evidence", "beta-structured-output-canary-openai", "attempts", ATTEMPT_ID);
  const writes = [
    [p("evals", "reports", "openai_structured_output_canary_report.json"), report],
    [p("evals", "reports", "openai_structured_output_canary_report.md"), md],
    [path.join(top, "structured_output_canary_report.json"), report],
    [path.join(top, "structured_output_canary_report.md"), md],
    [path.join(top, "structured_output_mapping_report.json"), mappingReport],
    [path.join(top, "schema_validation_report.json"), schemaReport],
    [path.join(top, "redaction_report.json"), redactionReport],
    [path.join(top, "unresolved_items.json"), unresolvedItems],
    [path.join(attempt, "structured_output_canary_report.json"), report],
    [path.join(attempt, "structured_output_canary_report.md"), md],
    [path.join(attempt, "structured_output_mapping_report.json"), mappingReport],
    [path.join(attempt, "schema_validation_report.json"), schemaReport],
    [path.join(attempt, "redaction_report.json"), redactionReport],
    [path.join(attempt, "unresolved_items.json"), unresolvedItems]
  ];
  for (const [file, data] of writes) {
    if (typeof data === "string") writeText(file, data);
    else writeJson(file, data);
  }
  writeText(path.join(top, "structured_output_trace_samples.jsonl"), traceLines.join("\n"));
  writeText(path.join(attempt, "structured_output_trace_samples.jsonl"), traceLines.join("\n"));
}

const records = loadJsonl(p("adapters", "api", "openai", "structured_output_cases.jsonl"));
const cases = records.map((record) => record.value);
const runId = `openai-structured-output-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const trace = createStructuredOutputTraceRecorder(runId);
const ajv = createAjv();
const caseResults = [];
const mappingCases = [];
const validationCases = [];
const failures = [];
let providerExecution = false;
let redactionOk = true;

trace.record("structured_output_canary_started", {
  cases_total: cases.length,
  mode: MODE
}, false);

const firstRequest = mapStructuredOutputRequest(cases[0], process.env);
const firstSurface = assertStructuredOutputRequestSurface(firstRequest);
const firstGuard = checkStructuredOutputExecutionGuard({
  stage: STAGE,
  request: firstRequest,
  env: process.env
});

trace.record("structured_output_guard_checked", {
  status: firstGuard.status,
  allowed: firstGuard.allowed,
  reason: firstGuard.reason,
  request_surface: firstSurface
}, false);

if (!firstGuard.allowed) {
  const status = statusIsBlocked(firstGuard.status) ? firstGuard.status : "fail";
  trace.record("structured_output_canary_blocked", {
    status: firstGuard.status,
    reason: firstGuard.reason
  }, false);
  trace.record("structured_output_trace_recorded", {
    event_count: trace.events.length + 1
  }, false);

  const report = {
    status,
    stage: STAGE,
    mode: MODE,
    provider: "openai",
    provider_execution: false,
    structured_output_used: firstSurface.structured_output_used,
    tools_used: false,
    local_model_execution: false,
    external_side_effects: false,
    store_false_enforced: firstSurface.store_false_enforced,
    strict_json_schema_used: firstSurface.strict_json_schema_used,
    ajv_validation_used: true,
    cases_total: cases.length,
    cases_passed: 0,
    cases_failed: 0,
    schema_validations_total: 0,
    schema_validations_passed: 0,
    schema_validations_failed: 0,
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
      tools_present: false,
      structured_output_present: true,
      store_false: firstRequest.store === false,
      strict_json_schema: firstRequest.text?.format?.strict === true,
      max_output_tokens_bounded: firstSurface.max_output_tokens_bounded
    },
    response_mapping: {
      provider_response_id_present: false,
      output_text_extracted: false,
      parsed_json_present: false,
      raw_response_hash_present: false,
      raw_response_stored: false
    },
    cases_total: cases.length,
    cases_mapped: 0,
    request_examples_redacted: [sanitizeStructuredOutputRequest(firstRequest)],
    response_examples_redacted: []
  };
  const schemaReport = {
    status,
    stage: STAGE,
    ajv_validation_used: true,
    schema_validations_total: 0,
    schema_validations_passed: 0,
    schema_validations_failed: 0,
    cases: []
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
      id: status === "blocked_by_missing_model" ? "SOC-001" : "SOC-001",
      severity: "medium",
      description: "OpenAI structured output canary was blocked because OPENAI_API_KEY or OPENAI_MODEL was not available.",
      blocks_tool_calling_execution: true,
      blocks_local_model_execution: false,
      owner: "human",
      recommended_next_action: "Provide OPENAI_API_KEY and OPENAI_MODEL, then rerun structured output canary."
    }
  ];

  writeReports(report, mappingReport, schemaReport, redactionReport, trace.events, unresolvedItems);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

for (const record of records) {
  const testCase = record.value;
  const request = mapStructuredOutputRequest(testCase, process.env);
  const requestSurface = assertStructuredOutputRequestSurface(request);
  const guard = checkStructuredOutputExecutionGuard({ stage: STAGE, request, env: process.env });
  const sanitizedRequest = sanitizeStructuredOutputRequest(request);
  const caseFailures = [];
  let sanitizedResponse = null;
  let schemaValidation = null;

  trace.record("structured_output_guard_checked", {
    case_id: testCase.case_id,
    status: guard.status,
    allowed: guard.allowed,
    reason: guard.reason,
    request_surface: requestSurface
  }, false);

  if (!requestSurface.ok || !requestSurface.store_false_enforced || !requestSurface.strict_json_schema_used) {
    caseFailures.push(`request surface violation: ${requestSurface.disallowed_fields.join(", ") || "structured output surface invalid"}`);
  }
  if (!guard.allowed) caseFailures.push(`structured output guard blocked case: ${guard.status}`);

  trace.record("structured_output_request_mapped", {
    case_id: testCase.case_id,
    request_redacted: sanitizedRequest
  }, false);

  if (!caseFailures.length) {
    trace.record("structured_output_request_sent", {
      case_id: testCase.case_id,
      target: "openai.responses",
      store: false
    }, true);
    providerExecution = true;

    try {
      const rawResponse = await createTextOnlyResponse(request, process.env);
      trace.record("structured_output_response_received", {
        case_id: testCase.case_id,
        response_id_present: Boolean(rawResponse.id)
      }, true);

      const mappedResponse = mapStructuredOutputResponse(rawResponse);
      sanitizedResponse = sanitizeStructuredOutputResponse(mappedResponse);
      trace.record("structured_output_response_mapped", {
        case_id: testCase.case_id,
        response_redacted: sanitizedResponse
      }, true);

      if (!mappedResponse.provider_response_id) caseFailures.push("provider response id was not present");
      if (!mappedResponse.output_text) caseFailures.push("output text was not extracted");
      if (!mappedResponse.raw_response_hash) caseFailures.push("raw response hash was not present");
      if (mappedResponse.json_parse_error) caseFailures.push(`JSON parse failed: ${mappedResponse.json_parse_error}`);

      let schemaOk = false;
      let schemaErrors = [];
      if (mappedResponse.parsed_json) {
        const validate = compileSchema(ajv, testCase.schema, `${testCase.case_id}.schema`);
        schemaOk = validate(mappedResponse.parsed_json);
        schemaErrors = schemaOk ? [] : (validate.errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`);
        if (!schemaOk) caseFailures.push(`Ajv validation failed: ${schemaErrors.join("; ")}`);
      }
      schemaValidation = {
        case_id: testCase.case_id,
        status: schemaOk ? "pass" : "fail",
        json_parse_ok: Boolean(mappedResponse.parsed_json) && !mappedResponse.json_parse_error,
        ajv_valid: schemaOk,
        errors: schemaErrors
      };
      trace.record("schema_validation_completed", {
        case_id: testCase.case_id,
        status: schemaValidation.status,
        errors_count: schemaValidation.errors.length
      }, true);

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
      trace.record("structured_output_canary_failed", {
        case_id: testCase.case_id,
        error_message: String(error.message).slice(0, 240),
        provider_error: providerError
      }, true);
    }
  }

  if (!schemaValidation) {
    schemaValidation = {
      case_id: testCase.case_id,
      status: "fail",
      json_parse_ok: false,
      ajv_valid: false,
      errors: caseFailures
    };
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
  validationCases.push(schemaValidation);
  caseResults.push({
    case_id: testCase.case_id,
    fixture_file: path.relative(root, record.file).split(path.sep).join("/"),
    fixture_line: record.line,
    status: caseStatus,
    failures: caseFailures
  });
}

const finalStatus = failures.length === 0 ? "pass" : "fail";
if (finalStatus === "pass") {
  trace.record("structured_output_canary_completed", {
    cases_total: cases.length,
    cases_passed: caseResults.filter((item) => item.status === "pass").length
  }, providerExecution);
} else {
  trace.record("structured_output_canary_failed", {
    failures_count: failures.length
  }, providerExecution);
}
trace.record("structured_output_trace_recorded", {
  event_count: trace.events.length + 1
}, providerExecution);

const schemaValidationsPassed = validationCases.filter((item) => item.status === "pass").length;
const schemaValidationsFailed = validationCases.filter((item) => item.status === "fail").length;
const report = {
  status: finalStatus,
  stage: STAGE,
  mode: MODE,
  provider: "openai",
  provider_execution: providerExecution,
  structured_output_used: true,
  tools_used: false,
  local_model_execution: false,
  external_side_effects: false,
  store_false_enforced: true,
  strict_json_schema_used: true,
  ajv_validation_used: true,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status === "fail").length,
  schema_validations_total: validationCases.length,
  schema_validations_passed: schemaValidationsPassed,
  schema_validations_failed: schemaValidationsFailed,
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
    input_text_only: mappingCases.every((item) => item.request_surface.input_text_only === true),
    tools_present: mappingCases.some((item) => item.request_redacted.tools_present === true),
    structured_output_present: mappingCases.every((item) => item.request_redacted.structured_output_present === true),
    store_false: mappingCases.every((item) => item.request_redacted.store === false),
    strict_json_schema: mappingCases.every((item) => item.request_redacted.strict === true),
    max_output_tokens_bounded: mappingCases.every((item) => item.request_surface.max_output_tokens_bounded === true)
  },
  response_mapping: {
    provider_response_id_present: mappingCases.length > 0 && mappingCases.every((item) => item.response_redacted?.provider_response_id_present === true),
    output_text_extracted: mappingCases.length > 0 && mappingCases.every((item) => Boolean(item.response_redacted?.output_text_preview)),
    parsed_json_present: mappingCases.length > 0 && mappingCases.every((item) => item.response_redacted?.parsed_json && typeof item.response_redacted.parsed_json === "object"),
    usage_summary_present_if_available: true,
    raw_response_hash_present: mappingCases.length > 0 && mappingCases.every((item) => Boolean(item.response_redacted?.raw_response_hash)),
    raw_response_stored: false
  },
  cases_total: cases.length,
  cases_mapped: mappingCases.length,
  cases: mappingCases
};
const schemaReport = {
  status: schemaValidationsFailed === 0 && validationCases.length === cases.length ? "pass" : "fail",
  stage: STAGE,
  ajv_validation_used: true,
  schema_validations_total: validationCases.length,
  schema_validations_passed: schemaValidationsPassed,
  schema_validations_failed: schemaValidationsFailed,
  cases: validationCases
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
    id: "SOC-002",
    severity: "high",
    description: "OpenAI structured output canary failed during provider execution or schema validation.",
    blocks_tool_calling_execution: true,
    blocks_local_model_execution: false,
    owner: "agent",
    recommended_next_action: "Inspect redacted request mapping, schema subset compatibility, model support, response mapper, and Ajv validation failures."
  }
];

writeReports(report, mappingReport, schemaReport, redactionReport, trace.events, unresolvedItems);
console.log(JSON.stringify(report, null, 2));
process.exit(finalStatus === "pass" ? 0 : 1);
