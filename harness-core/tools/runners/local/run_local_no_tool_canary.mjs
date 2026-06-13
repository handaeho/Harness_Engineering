#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { previewText, redactionPassed } from "../../../adapters/api/openai/redaction_policy.mjs";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-local-no-tool-canary";
const READINESS_STAGE = "v2.0.0-post-rc-local-endpoint-readiness-preflight";
const DEFAULT_EVIDENCE_DIR = "post-rc-local-no-tool-canary";
const DEFAULT_READINESS_EVIDENCE_DIR = "post-rc-local-endpoint-readiness-preflight";
const DEFAULT_REPORT_PREFIX = "post_rc_local_no_tool_canary";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SMART_QUOTES = /[\u2018\u2019\u201C\u201D]/;
const ASCII_SURROUNDING_QUOTES = /^["']|["']$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const CLAIMS_ALLOWED_AFTER_PASS = [
  "post-rc-local-no-tool-canary-completed",
  "post-rc-local-model-no-tool-path-checked",
  "post-rc-local-redaction-checked"
];
const CLAIMS_BLOCKED = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "production-ready",
  "stable",
  "release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

const provider = argValue("provider", process.env.LOCAL_ENDPOINT_PROVIDER || "ollama").trim().toLowerCase();
const endpointUrl = argValue("endpoint-url", process.env.LOCAL_ENDPOINT_URL || process.env.OLLAMA_BASE_URL || "");
const modelName = argValue("model", process.env.LOCAL_ENDPOINT_MODEL || process.env.OLLAMA_MODEL || "");
const timeoutMs = Number(argValue("timeout-ms", process.env.LOCAL_ENDPOINT_TIMEOUT_MS || "30000"));
const authRequired = argValue("auth-required", process.env.LOCAL_ENDPOINT_AUTH_REQUIRED || "no").toLowerCase();
const authTokenPresent = Boolean(process.env.LOCAL_ENDPOINT_API_KEY);
const evidenceDir = normalizeRelativePath(argValue(
  "evidence-dir",
  process.env.LOCAL_NO_TOOL_EVIDENCE_DIR || DEFAULT_EVIDENCE_DIR
));
const readinessEvidenceDir = normalizeRelativePath(argValue(
  "readiness-evidence-dir",
  process.env.LOCAL_READINESS_EVIDENCE_DIR || DEFAULT_READINESS_EVIDENCE_DIR
));
const reportPrefix = normalizeFileStem(argValue(
  "report-prefix",
  process.env.LOCAL_NO_TOOL_REPORT_PREFIX || DEFAULT_REPORT_PREFIX
));

function p(...parts) {
  return path.join(root, ...parts);
}

function normalizeRelativePath(value) {
  const normalized = path.posix.normalize(String(value || "").replaceAll("\\", "/"));
  if (!normalized || normalized.startsWith("/") || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Unsafe relative evidence path: ${value}`);
  }
  return normalized;
}

function normalizeFileStem(value) {
  const stem = String(value || "").trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(stem)) {
    throw new Error(`Unsafe report prefix: ${value}`);
  }
  return stem;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
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

function parseEndpoint(value) {
  try {
    const parsed = new URL(value);
    return {
      ok: true,
      parsed,
      safe_endpoint: `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function isLocalEndpoint(url) {
  return LOCAL_HOSTS.has(url.hostname);
}

function buildChatUrl(baseUrl) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basePath || "/v1"}/chat/completions`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.hash = "";
  return url;
}

function extractMessage(responseJson) {
  const choice = Array.isArray(responseJson?.choices) ? responseJson.choices[0] : null;
  const message = choice?.message || {};
  return {
    output_text: typeof message.content === "string" ? message.content : "",
    finish_reason: choice?.finish_reason || null,
    tool_calls_present: Array.isArray(message.tool_calls) && message.tool_calls.length > 0,
    thinking_present: Boolean(message.thinking || message.reasoning_content),
    structured_output_present: Boolean(message.parsed || message.refusal),
    usage: responseJson?.usage && typeof responseJson.usage === "object"
      ? {
        prompt_tokens: responseJson.usage.prompt_tokens,
        completion_tokens: responseJson.usage.completion_tokens,
        total_tokens: responseJson.usage.total_tokens
      }
      : null
  };
}

async function callLocalChat(testCase) {
  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "system",
        content: "You are running a local no-tool canary. Return a short text answer only."
      },
      {
        role: "user",
        content: testCase.input
      }
    ],
    temperature: 0,
    max_tokens: testCase.execution_constraints?.max_output_tokens || 96,
    stream: false
  };
  if (provider === "ollama") {
    requestBody.think = false;
    requestBody.reasoning_effort = "none";
    requestBody.reasoning = { effort: "none" };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { "Content-Type": "application/json" };
  if (authRequired === "yes" && process.env.LOCAL_ENDPOINT_API_KEY) {
    headers.Authorization = `Bearer ${process.env.LOCAL_ENDPOINT_API_KEY}`;
  }

  try {
    const response = await fetch(buildChatUrl(endpointUrl), {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const mapped = extractMessage(json);
    return {
      http_status: response.status,
      ok: response.ok,
      mapped,
      raw_response_hash: sha256(text),
      sanitized_request: {
        model_present: Boolean(requestBody.model),
        messages_count: requestBody.messages.length,
        input_preview: previewText(testCase.input, 120),
        input_hash: sha256(testCase.input),
        tools_present: false,
        structured_output_present: false,
        stream: false,
        max_tokens: requestBody.max_tokens,
        thinking_disabled: requestBody.think === false || requestBody.reasoning_effort === "none",
        reasoning_effort: requestBody.reasoning_effort || null,
        reasoning_present: Boolean(requestBody.reasoning)
      },
      sanitized_response: {
        output_text_preview: previewText(mapped.output_text, 300),
        output_text_hash: sha256(mapped.output_text),
        finish_reason: mapped.finish_reason,
        usage: mapped.usage,
        tool_calls_present: mapped.tool_calls_present,
        thinking_present: mapped.thinking_present,
        structured_output_present: mapped.structured_output_present,
        raw_response_hash: sha256(text)
      },
      raw_request_stored: false,
      raw_response_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

const checks = [];
const endpoint = parseEndpoint(endpointUrl);
const readinessPath = p("evidence", readinessEvidenceDir, "local_endpoint_readiness_gate_report.json");
const readiness = fs.existsSync(readinessPath) ? readJson(readinessPath) : null;

addCheck(checks, "readiness preflight gate passed", readiness?.status === "pass" && readiness?.can_enter_local_no_tool_canary === true, {
  readiness_status: readiness?.status || null,
  readiness_stage: readiness?.stage || null
});
addCheck(checks, "readiness stage matches expected stage", readiness?.stage === READINESS_STAGE, {
  readiness_stage: readiness?.stage || null
});
addCheck(checks, "provider type is supported", ["ollama", "vllm"].includes(provider), { provider });
addCheck(checks, "model name is present", Boolean(modelName), { model_name_present: Boolean(modelName) });
if (modelName) {
  addCheck(checks, "model name has no smart quotes", !SMART_QUOTES.test(modelName), {});
  addCheck(checks, "model name has no embedded shell quotes", !ASCII_SURROUNDING_QUOTES.test(modelName), {});
  addCheck(checks, "model name has no control characters", !CONTROL_CHARS.test(modelName), {});
}
addCheck(checks, "endpoint URL parses", endpoint.ok, { endpoint_url_present: Boolean(endpointUrl) });
if (endpoint.ok) {
  addCheck(checks, "endpoint is localhost-only", isLocalEndpoint(endpoint.parsed), {
    endpoint_host: endpoint.parsed.hostname
  });
  addCheck(checks, "endpoint has no embedded credentials", !endpoint.parsed.username && !endpoint.parsed.password, {});
  addCheck(checks, "endpoint has no query or hash", !endpoint.parsed.search && !endpoint.parsed.hash, {});
}
addCheck(checks, "auth token presence matches auth requirement", authRequired !== "yes" || authTokenPresent, {
  auth_required: authRequired,
  auth_token_present: authTokenPresent
});
addCheck(checks, "timeout is bounded", Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 120000, {
  timeout_ms: timeoutMs
});

const staticFailed = checks.some((check) => check.status !== "pass");
const cases = loadJsonl(p("evals", "fixtures", "local", "no_tool_canary_cases.jsonl")).map((record) => record.value);
const traceEvents = [];
const caseResults = [];
const mappingCases = [];
const failures = [];

function trace(event, payload) {
  traceEvents.push({
    event,
    stage: STAGE,
    timestamp: new Date().toISOString(),
    ...payload,
    raw_request_stored: false,
    raw_response_stored: false
  });
}

trace("local_no_tool_canary_started", {
  provider,
  model_name: modelName,
  cases_total: cases.length,
  local_model_execution: !staticFailed
});

if (!staticFailed) {
  for (const testCase of cases) {
    const caseFailures = [];
    let call = null;
    try {
      call = await callLocalChat(testCase);
    } catch (error) {
      caseFailures.push(`local chat request failed: ${error?.name || "Error"}`);
    }

    if (call) {
      if (!call.ok) caseFailures.push(`http status was not ok: ${call.http_status}`);
      if (!call.mapped.output_text.trim()) caseFailures.push("assistant output text was empty");
      if (call.mapped.tool_calls_present) caseFailures.push("tool calls were present");
      if (call.mapped.structured_output_present) caseFailures.push("structured output marker was present");
      if (call.raw_request_stored || call.raw_response_stored) caseFailures.push("raw request or response storage was detected");

      mappingCases.push({
        case_id: testCase.case_id,
        http_status: call.http_status,
        output_text_present: Boolean(call.mapped.output_text.trim()),
        tool_calls_present: call.mapped.tool_calls_present,
        thinking_present: call.mapped.thinking_present,
        structured_output_present: call.mapped.structured_output_present,
        request: call.sanitized_request,
        response: call.sanitized_response
      });
      trace("local_response_mapped", {
        case_id: testCase.case_id,
        http_status: call.http_status,
        output_text_hash: call.sanitized_response.output_text_hash,
        output_text_preview: call.sanitized_response.output_text_preview,
        tool_calls_present: call.mapped.tool_calls_present,
        thinking_present: call.mapped.thinking_present,
        structured_output_present: call.mapped.structured_output_present
      });
    }

    const result = {
      case_id: testCase.case_id,
      status: caseFailures.length === 0 ? "pass" : "fail",
      failures: caseFailures
    };
    caseResults.push(result);
    failures.push(...caseFailures.map((failure) => ({
      case_id: testCase.case_id,
      failure
    })));
  }
}

trace("local_no_tool_canary_completed", {
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: caseResults.filter((item) => item.status !== "pass").length
});

const failedChecks = checks.filter((check) => check.status !== "pass");
const failedCases = caseResults.filter((item) => item.status !== "pass");
const status = failedChecks.length === 0 && failedCases.length === 0 ? "pass" : "fail";
const redactionSubject = {
  checks,
  caseResults,
  mappingCases,
  traceEvents
};
const redactionReport = {
  status: redactionPassed(redactionSubject) ? "pass" : "fail",
  stage: STAGE,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false
};

const mappingReport = {
  status,
  stage: STAGE,
  provider,
  model_name: modelName,
  request_mapping: {
    chat_completions_path: true,
    tools_present: false,
    structured_output_present: false,
    thinking_disabled_for_ollama: provider === "ollama",
    reasoning_effort_none_for_ollama: provider === "ollama",
    stream: false,
    max_tokens_bounded: true
  },
  response_mapping: {
    output_text_extracted: mappingCases.every((item) => item.output_text_present),
    tool_calls_absent: mappingCases.every((item) => item.tool_calls_present === false),
    structured_output_absent: mappingCases.every((item) => item.structured_output_present === false),
    raw_response_stored: false
  },
  cases: mappingCases
};

const report = {
  status,
  stage: STAGE,
  provider,
  model_name: modelName,
  endpoint_url: endpoint.ok ? endpoint.safe_endpoint : null,
  local_endpoint_probe: true,
  local_model_execution: !staticFailed,
  external_provider_call: false,
  telemetry_sink_write: false,
  synthetic_trace_generation: false,
  tools_used: false,
  structured_output_used: false,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  cases_total: cases.length,
  cases_passed: caseResults.filter((item) => item.status === "pass").length,
  cases_failed: failedCases.length,
  trace_events_total: traceEvents.length,
  redaction_passed: redactionReport.status === "pass",
  checks,
  case_results: caseResults,
  claims_allowed: status === "pass" ? CLAIMS_ALLOWED_AFTER_PASS : [],
  claims_blocked: CLAIMS_BLOCKED,
  failures: failedChecks.concat(failures)
};

const unresolvedItems = status === "pass"
  ? []
  : report.failures.map((failure, index) => ({
    id: `LNTC-${String(index + 1).padStart(3, "0")}`,
    severity: "medium",
    description: typeof failure.failure === "string" ? failure.failure : `Local no-tool canary failed: ${failure.name}`,
    blocks_local_model_verified: true,
    recommended_next_action: "Fix the local endpoint, model response mapping, or canary input before rerunning local no-tool canary."
  }));

const md = `# Local No-tool Canary

Status: ${report.status}

- Stage: ${report.stage}
- Provider: ${report.provider}
- Endpoint: ${report.endpoint_url || "invalid"}
- Model: ${report.model_name || "missing"}
- Local model execution: ${report.local_model_execution}
- Tools used: false
- Structured output used: false
- Raw request stored: false
- Raw response stored: false
- Cases passed: ${report.cases_passed}/${report.cases_total}
- Redaction passed: ${report.redaction_passed}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}

## Claim Boundary

- Allows after pass: ${report.claims_allowed.join(", ") || "none"}
- Still blocked: ${CLAIMS_BLOCKED.join(", ")}
`;

writeJson(p("evidence", evidenceDir, "local_no_tool_canary_report.json"), report);
writeText(p("evidence", evidenceDir, "local_no_tool_canary_report.md"), md);
writeText(p("evidence", evidenceDir, "local_trace_samples.jsonl"), traceEvents.map((event) => JSON.stringify(event)).join("\n"));
writeJson(p("evidence", evidenceDir, "local_response_mapping_report.json"), mappingReport);
writeJson(p("evidence", evidenceDir, "local_no_tool_redaction_report.json"), redactionReport);
writeJson(p("evidence", evidenceDir, "local_no_tool_canary_gate_report.json"), report);
writeJson(p("evidence", evidenceDir, "unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", `${reportPrefix}_report.json`), report);
writeText(p("evals", "reports", `${reportPrefix}_report.md`), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" && redactionReport.status === "pass" ? 0 : 1);
