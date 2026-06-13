#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { previewText, redactionPassed } from "../../../adapters/api/openai/redaction_policy.mjs";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-vllm-adapter-conformance-local-execution";
const EVIDENCE_DIR = "post-stable-vllm-adapter-conformance-local-execution";
const NO_TOOL_REPORT = "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json";
const READINESS_REPORT = "evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_gate_report.json";
const DEFAULT_ENDPOINT = "http://127.0.0.1:8000/v1";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SMART_QUOTES = /[\u2018\u2019\u201C\u201D]/;
const ASCII_SURROUNDING_QUOTES = /^["']|["']$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const TOOL_NAME = "vllm_mock_lookup";
const CLAIMS_ALLOWED_AFTER_PASS = [
  "post-stable-vllm-adapter-conformance-local-execution-passed",
  "vllm-chat-template-roundtrip-checked",
  "vllm-structured-output-runtime-checked",
  "vllm-tool-parser-runtime-checked"
];
const CLAIMS_BLOCKED = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const STRUCTURED_CASES = [
  {
    case_id: "vllm_structured_status",
    input: "Return only JSON with keys status, adapter, and count. status must be ok, adapter must be vllm, count must be 1.",
    required_keys: ["adapter", "count", "status"]
  },
  {
    case_id: "vllm_structured_meta",
    input: "Return only JSON with keys status and meta. status must be ok. meta must be an object with key runtime.",
    required_keys: ["meta", "status"]
  }
];
const TOOL_CASES = [
  {
    case_id: "vllm_tool_alpha",
    input: "Call the vllm_mock_lookup tool with key alpha. Do not answer directly.",
    required_key: "key"
  },
  {
    case_id: "vllm_tool_beta",
    input: "Call the vllm_mock_lookup tool with key beta. Keep all work local.",
    required_key: "key"
  }
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function parseEndpoint(value) {
  try {
    const parsed = new URL(value);
    return { ok: true, parsed, safe_endpoint: `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}` };
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

function parseJsonObject(content) {
  const stripped = String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function parseArguments(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mockToolSpec() {
  return [{
    type: "function",
    function: {
      name: TOOL_NAME,
      description: "Mock local lookup tool for adapter conformance. It has no external side effects.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Local canary key." }
        },
        required: ["key"],
        additionalProperties: false
      }
    }
  }];
}

async function callVllmChat({ endpointUrl, modelName, authRequired, timeoutMs, messages, maxTokens = 256, responseFormat = null, tools = null, toolChoice = null }) {
  const requestBody = {
    model: modelName,
    messages,
    temperature: 0,
    max_tokens: maxTokens,
    stream: false
  };
  if (responseFormat) requestBody.response_format = responseFormat;
  if (tools) requestBody.tools = tools;
  if (toolChoice) requestBody.tool_choice = toolChoice;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { "Content-Type": "application/json" };
  const token = process.env.VLLM_API_KEY || process.env.LOCAL_ENDPOINT_API_KEY || "";
  if (authRequired === "yes" && token) {
    headers.Authorization = `Bearer ${token}`;
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
    const choice = Array.isArray(json?.choices) ? json.choices[0] : null;
    const message = choice?.message || {};
    return {
      ok: response.ok,
      http_status: response.status,
      finish_reason: choice?.finish_reason || null,
      usage: json?.usage || null,
      content: typeof message.content === "string" ? message.content : "",
      tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
      raw_response_hash: sha256(text),
      sanitized_request: {
        model_present: Boolean(requestBody.model),
        messages_count: requestBody.messages.length,
        tools_present: Array.isArray(requestBody.tools),
        tool_choice_present: Boolean(requestBody.tool_choice),
        structured_output_present: Boolean(requestBody.response_format),
        stream: false,
        max_tokens: requestBody.max_tokens
      },
      raw_request_stored: false,
      raw_response_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

const noTool = readJsonIfExists(NO_TOOL_REPORT);
const readiness = readJsonIfExists(READINESS_REPORT);
const dryRun = readJsonIfExists("evals/reports/adapter_conformance_dry_run.json");
const adapter = parseYamlFile(p("adapters", "local", "vllm", "adapter.yaml"));
const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
const dryRunVllmCases = Array.isArray(dryRun?.case_results)
  ? dryRun.case_results.filter((item) => item.adapter_id === "vllm.local.skeleton")
  : [];
const endpointUrl = argValue("endpoint-url", process.env.VLLM_ENDPOINT_URL || process.env.LOCAL_ENDPOINT_URL || noTool?.endpoint_url || DEFAULT_ENDPOINT);
const modelName = argValue("model", process.env.VLLM_MODEL || process.env.LOCAL_ENDPOINT_MODEL || noTool?.model_name || "");
const authRequired = argValue("auth-required", process.env.VLLM_AUTH_REQUIRED || process.env.LOCAL_ENDPOINT_AUTH_REQUIRED || "no").toLowerCase();
const timeoutMs = Number(argValue("timeout-ms", process.env.VLLM_TIMEOUT_MS || process.env.LOCAL_ENDPOINT_TIMEOUT_MS || "90000"));
const endpoint = parseEndpoint(endpointUrl);

const preflightChecks = [];
addCheck(preflightChecks, "vllm no-tool canary passed", noTool?.status === "pass"
  && noTool?.vllm_no_tool_canary_executed === true
  && noTool?.local_model_execution === true, noTool || {});
addCheck(preflightChecks, "readiness gate passed", readiness?.status === "pass"
  && readiness?.can_enter_local_no_tool_canary === true, readiness || {});
addCheck(preflightChecks, "adapter manifest loaded", adapter?.adapter_id === "vllm.local.skeleton", {
  adapter_id: adapter?.adapter_id || null
});
addCheck(preflightChecks, "provider capability matrix has vllm", matrix?.providers?.vllm?.adapter_path === "adapters/local/vllm/adapter.yaml", {
  adapter_path: matrix?.providers?.vllm?.adapter_path || null
});
addCheck(preflightChecks, "dry-run vllm cases passed", dryRun?.status === "pass"
  && dryRunVllmCases.length > 0
  && dryRunVllmCases.every((item) => item.status === "pass"), {
  dry_run_status: dryRun?.status || null,
  vllm_cases_total: dryRunVllmCases.length
});
addCheck(preflightChecks, "endpoint URL parses", endpoint.ok, {
  endpoint_url_present: Boolean(endpointUrl)
});
if (endpoint.ok) {
  addCheck(preflightChecks, "endpoint is localhost-only", isLocalEndpoint(endpoint.parsed), {
    endpoint_host: endpoint.parsed.hostname
  });
  addCheck(preflightChecks, "endpoint has no embedded credentials", !endpoint.parsed.username && !endpoint.parsed.password, {});
  addCheck(preflightChecks, "endpoint has no query or hash", !endpoint.parsed.search && !endpoint.parsed.hash, {});
}
addCheck(preflightChecks, "model name is present", Boolean(modelName), {
  model_name_present: Boolean(modelName)
});
if (modelName) {
  addCheck(preflightChecks, "model name has no smart quotes", !SMART_QUOTES.test(modelName), {});
  addCheck(preflightChecks, "model name has no embedded shell quotes", !ASCII_SURROUNDING_QUOTES.test(modelName), {});
  addCheck(preflightChecks, "model name has no control characters", !CONTROL_CHARS.test(modelName), {});
}
addCheck(preflightChecks, "auth requirement is explicit", ["yes", "no"].includes(authRequired), {
  auth_required: authRequired
});
addCheck(preflightChecks, "timeout is bounded", Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 180000, {
  timeout_ms: timeoutMs
});

const structuredResults = [];
const toolResults = [];
const staticFailed = preflightChecks.some((check) => check.status !== "pass");

if (!staticFailed) {
  for (const testCase of STRUCTURED_CASES) {
    try {
      const response = await callVllmChat({
        endpointUrl,
        modelName,
        authRequired,
        timeoutMs,
        responseFormat: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only compact JSON. Do not include prose." },
          { role: "user", content: testCase.input }
        ]
      });
      const parsed = parseJsonObject(response.content);
      const parsedKeys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [];
      const requiredKeysPresent = testCase.required_keys.every((key) => parsedKeys.includes(key));
      structuredResults.push({
        case_id: testCase.case_id,
        status: response.ok && Boolean(parsed) && requiredKeysPresent ? "pass" : "fail",
        http_status: response.http_status,
        finish_reason: response.finish_reason,
        usage: response.usage,
        output_text_preview: previewText(response.content, 180),
        output_text_hash: sha256(response.content),
        raw_response_hash: response.raw_response_hash,
        json_parse_passed: Boolean(parsed),
        required_keys_present: requiredKeysPresent,
        parsed_keys: parsedKeys,
        request: response.sanitized_request,
        raw_request_stored: false,
        raw_response_stored: false
      });
    } catch (error) {
      structuredResults.push({
        case_id: testCase.case_id,
        status: "fail",
        error_name: error?.name || "Error",
        error_message_preview: previewText(error?.message || "structured output request failed", 160),
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
  }

  for (const testCase of TOOL_CASES) {
    try {
      const response = await callVllmChat({
        endpointUrl,
        modelName,
        authRequired,
        timeoutMs,
        tools: mockToolSpec(),
        toolChoice: { type: "function", function: { name: TOOL_NAME } },
        messages: [
          { role: "system", content: "Use the provided mock tool when requested. Never execute real external actions." },
          { role: "user", content: testCase.input }
        ]
      });
      const firstCall = response.tool_calls[0] || null;
      const argsValue = parseArguments(firstCall?.function?.arguments);
      const argumentKeys = argsValue && typeof argsValue === "object" ? Object.keys(argsValue).sort() : [];
      const toolNameMatches = firstCall?.function?.name === TOOL_NAME;
      const passed = response.ok
        && response.tool_calls.length > 0
        && toolNameMatches
        && argumentKeys.includes(testCase.required_key);
      toolResults.push({
        case_id: testCase.case_id,
        status: passed ? "pass" : "fail",
        http_status: response.http_status,
        finish_reason: response.finish_reason,
        usage: response.usage,
        tool_schema_sent: true,
        tool_choice_forced: true,
        tool_calls_present: response.tool_calls.length > 0,
        tool_call_count: response.tool_calls.length,
        tool_name_matches: toolNameMatches,
        tool_arguments_parse_passed: Boolean(argsValue),
        tool_argument_keys: argumentKeys,
        external_tool_executed: false,
        mock_tool_output_reinjected: false,
        assistant_content_preview: previewText(response.content, 180),
        assistant_content_hash: sha256(response.content),
        tool_arguments_hash: sha256(firstCall?.function?.arguments || ""),
        raw_response_hash: response.raw_response_hash,
        request: response.sanitized_request,
        raw_request_stored: false,
        raw_response_stored: false
      });
    } catch (error) {
      toolResults.push({
        case_id: testCase.case_id,
        status: "fail",
        error_name: error?.name || "Error",
        error_message_preview: previewText(error?.message || "tool-calling request failed", 160),
        tool_schema_sent: true,
        tool_calls_present: false,
        external_tool_executed: false,
        raw_request_stored: false,
        raw_response_stored: false
      });
    }
  }
}

const structuredPassed = structuredResults.filter((item) => item.status === "pass").length;
const toolPassed = toolResults.filter((item) => item.status === "pass").length;
const runtimeChecks = [];
addCheck(runtimeChecks, "structured output cases passed", structuredResults.length === STRUCTURED_CASES.length
  && structuredPassed === STRUCTURED_CASES.length, {
  structured_passed: structuredPassed,
  structured_total: STRUCTURED_CASES.length
});
addCheck(runtimeChecks, "tool parser cases passed", toolResults.length === TOOL_CASES.length
  && toolPassed === TOOL_CASES.length, {
  tool_passed: toolPassed,
  tool_total: TOOL_CASES.length
});
addCheck(runtimeChecks, "tool cases had no external side effects", toolResults.every((item) => item.external_tool_executed === false), {});
addCheck(runtimeChecks, "raw request/response not stored", [...structuredResults, ...toolResults].every((item) => item.raw_request_stored === false && item.raw_response_stored === false), {});

const checks = [...preflightChecks, ...runtimeChecks];
const failures = checks.filter((check) => check.status !== "pass");
const status = failures.length === 0 ? "pass" : "fail";
const runtimeCallCount = structuredResults.length + toolResults.length;
const redactionSubject = { preflightChecks, structuredResults, toolResults };
const redaction = {
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

const report = {
  status,
  stage: STAGE,
  provider: "vllm",
  adapter_id: adapter?.adapter_id || null,
  endpoint_url: endpoint.ok ? endpoint.safe_endpoint : null,
  model_name: modelName,
  local_endpoint_probe: readiness?.local_endpoint_probe === true || noTool?.local_endpoint_probe === true,
  local_model_execution: !staticFailed,
  new_local_model_execution: !staticFailed,
  new_local_model_call_count: runtimeCallCount,
  source_no_tool_execution_reviewed: noTool?.status === "pass",
  dry_run_vllm_cases_total: dryRunVllmCases.length,
  dry_run_vllm_cases_passed: dryRunVllmCases.filter((item) => item.status === "pass").length,
  chat_template_roundtrip_checked: noTool?.vllm_local_server_roundtrip_passed === true,
  structured_output_runtime_checked: structuredPassed === STRUCTURED_CASES.length,
  tool_parser_runtime_checked: toolPassed === TOOL_CASES.length,
  external_tool_executed: false,
  telemetry_sink_write: false,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  redaction_passed: redaction.status === "pass",
  cases_total: runtimeCallCount,
  cases_passed: structuredPassed + toolPassed,
  cases_failed: runtimeCallCount - structuredPassed - toolPassed,
  structured_results: structuredResults,
  tool_results: toolResults,
  checks,
  failures,
  blockers: failures.map((failure) => ({
    id: failure.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
    lane: "vllm_adapter",
    status: "hold",
    reason: "vLLM adapter conformance surface is not established.",
    detail: failure.detail
  })),
  claims_allowed: status === "pass" ? CLAIMS_ALLOWED_AFTER_PASS : [],
  claims_blocked: CLAIMS_BLOCKED,
  provider_verified_allowed_by_this_artifact: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

const mappingReview = {
  status,
  stage: STAGE,
  adapter_loaded: adapter?.adapter_id === "vllm.local.skeleton",
  dry_run_vllm_cases_total: dryRunVllmCases.length,
  dry_run_vllm_cases_passed: dryRunVllmCases.filter((item) => item.status === "pass").length,
  no_tool_roundtrip_reviewed: noTool?.status === "pass",
  chat_template_roundtrip_checked: report.chat_template_roundtrip_checked,
  structured_output_runtime_checked: report.structured_output_runtime_checked,
  tool_parser_runtime_checked: report.tool_parser_runtime_checked,
  redaction_storage_boundary_reviewed: redaction.status === "pass"
};

const claimBoundary = {
  status,
  stage: STAGE,
  vllm_adapter_conformance_local_execution_recorded: status === "pass",
  provider_verified_allowed_by_this_artifact: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: report.claims_allowed,
  blocked_claims: CLAIMS_BLOCKED
};

const unresolvedItems = status === "pass" ? [] : report.blockers.map((blocker, index) => ({
  id: `VLLM-AC-${String(index + 1).padStart(3, "0")}`,
  severity: "high",
  description: blocker.reason,
  blocks_adapter_checked: true,
  source_check: blocker.id,
  recommended_next_action: "Fix vLLM endpoint/model/tool-parser/structured-output support and rerun run:vllm-adapter-conformance."
}));

const md = `# vLLM Adapter Conformance Local Execution

Status: ${status}

- Stage: ${STAGE}
- Endpoint: ${report.endpoint_url || "missing"}
- Model: ${report.model_name || "missing"}
- New local model calls: ${report.new_local_model_call_count}
- No-tool roundtrip reviewed: ${mappingReview.no_tool_roundtrip_reviewed}
- Structured output runtime checked: ${report.structured_output_runtime_checked}
- Tool parser runtime checked: ${report.tool_parser_runtime_checked}
- Raw request stored: false
- Raw response stored: false
- Adapter-checked allowed: false
`;

writeJson(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_mapping_review.json"), mappingReview);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_redaction_report.json"), redaction);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "vllm_adapter_conformance_gate_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", "vllm_adapter_conformance_report.json"), report);
writeText(p("evals", "reports", "vllm_adapter_conformance_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
