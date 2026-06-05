#!/usr/bin/env node
import path from "node:path";
import { redactionPassed } from "../adapters/api/openai/redaction_policy.mjs";
import { writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-local-endpoint-readiness-preflight";
const DEFAULT_EVIDENCE_DIR = "post-rc-local-endpoint-readiness-preflight";
const DEFAULT_REPORT_PREFIX = "post_rc_local_endpoint_readiness_preflight";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const CLAIMS_BLOCKED = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "local-no-tool-canary-executed",
  "vllm-no-tool-canary-executed",
  "ollama-no-tool-canary-executed",
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
const apiShape = argValue("api-shape", process.env.LOCAL_ENDPOINT_API_SHAPE || "OpenAI-compatible");
const authRequired = argValue("auth-required", process.env.LOCAL_ENDPOINT_AUTH_REQUIRED || "no").toLowerCase();
const operatorSignal = argValue("operator-signal", process.env.LOCAL_ENDPOINT_OPERATOR_SIGNAL || "");
const timeoutMs = Number(argValue("timeout-ms", process.env.LOCAL_ENDPOINT_TIMEOUT_MS || "5000"));
const authTokenPresent = Boolean(process.env.LOCAL_ENDPOINT_API_KEY);
const evidenceDir = normalizeRelativePath(argValue(
  "evidence-dir",
  process.env.LOCAL_ENDPOINT_EVIDENCE_DIR || DEFAULT_EVIDENCE_DIR
));
const reportPrefix = normalizeFileStem(argValue(
  "report-prefix",
  process.env.LOCAL_ENDPOINT_REPORT_PREFIX || DEFAULT_REPORT_PREFIX
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function isReadySignal(value) {
  return ["ready", "local-endpoint-ready", "local_endpoint_ready"].includes(String(value).trim().toLowerCase());
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

function buildModelsUrl(baseUrl) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, "");
  url.pathname = `${basePath || "/v1"}/models`.replace(/\/{2,}/g, "/");
  url.search = "";
  url.hash = "";
  return url;
}

async function fetchModels(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = {};
  if (authRequired === "yes" && process.env.LOCAL_ENDPOINT_API_KEY) {
    headers.Authorization = `Bearer ${process.env.LOCAL_ENDPOINT_API_KEY}`;
  }

  try {
    const url = buildModelsUrl(baseUrl);
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const models = Array.isArray(json?.data) ? json.data : [];
    return {
      ok: response.ok,
      http_status: response.status,
      content_type_json: contentType.includes("json"),
      data_array_present: Array.isArray(json?.data),
      models_count: models.length,
      target_model_present: models.some((item) => item?.id === modelName),
      raw_response_stored: false,
      raw_request_stored: false
    };
  } finally {
    clearTimeout(timeout);
  }
}

const checks = [];
const endpoint = parseEndpoint(endpointUrl);

addCheck(checks, "operator readiness signal is present", isReadySignal(operatorSignal), {
  operator_signal_present: Boolean(operatorSignal)
});
addCheck(checks, "provider type is supported", ["ollama", "vllm"].includes(provider), { provider });
addCheck(checks, "model name is present", Boolean(modelName), { model_name_present: Boolean(modelName) });
addCheck(checks, "endpoint URL parses", endpoint.ok, { endpoint_url_present: Boolean(endpointUrl) });
if (endpoint.ok) {
  addCheck(checks, "endpoint is localhost-only", isLocalEndpoint(endpoint.parsed), {
    endpoint_host: endpoint.parsed.hostname
  });
  addCheck(checks, "endpoint has no embedded credentials", !endpoint.parsed.username && !endpoint.parsed.password, {});
  addCheck(checks, "endpoint has no query or hash", !endpoint.parsed.search && !endpoint.parsed.hash, {});
}
addCheck(checks, "api shape is OpenAI-compatible", /^openai-compatible$/i.test(apiShape), { api_shape: apiShape });
addCheck(checks, "auth requirement is explicit", ["yes", "no"].includes(authRequired), { auth_required: authRequired });
addCheck(checks, "auth token presence matches auth requirement", authRequired !== "yes" || authTokenPresent, {
  auth_required: authRequired,
  auth_token_present: authTokenPresent
});
addCheck(checks, "timeout is bounded", Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 30000, {
  timeout_ms: timeoutMs
});

let probe = null;
const staticFailed = checks.some((check) => check.status !== "pass");
if (!staticFailed) {
  try {
    probe = await fetchModels(endpointUrl);
  } catch (error) {
    probe = {
      ok: false,
      error_name: error?.name || "Error",
      error_message: error?.message || "endpoint probe failed",
      raw_response_stored: false,
      raw_request_stored: false
    };
  }
  addCheck(checks, "models endpoint is reachable", probe.ok === true, {
    http_status: probe.http_status || null,
    error_name: probe.error_name || null
  });
  addCheck(checks, "models endpoint returns JSON data array", probe.data_array_present === true, {
    content_type_json: probe.content_type_json || false,
    models_count: probe.models_count || 0
  });
  addCheck(checks, "target model is available", probe.target_model_present === true, {
    model_name: modelName
  });
}

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const localEndpointProbe = Boolean(probe);

const probeSummary = {
  status: probe?.ok ? "pass" : "fail",
  stage: STAGE,
  provider,
  endpoint_host: endpoint.ok ? endpoint.parsed.hostname : null,
  endpoint_path: endpoint.ok ? endpoint.parsed.pathname.replace(/\/+$/, "") : null,
  model_name: modelName,
  local_endpoint_probe: localEndpointProbe,
  local_model_execution: false,
  raw_request_stored: false,
  raw_response_stored: false,
  http_status: probe?.http_status || null,
  data_array_present: probe?.data_array_present || false,
  models_count: probe?.models_count || 0,
  target_model_present: probe?.target_model_present || false
};

const claimBoundary = {
  status,
  stage: STAGE,
  can_enter_local_no_tool_canary: status === "pass",
  local_endpoint_probe_allowed_after_operator_signal: true,
  local_endpoint_probe: localEndpointProbe,
  local_model_execution: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  claims_allowed: status === "pass"
    ? [
      "post-rc-local-endpoint-readiness-preflight-completed",
      "post-rc-local-endpoint-probe-checked"
    ]
    : [],
  claims_blocked: CLAIMS_BLOCKED
};

const report = {
  status,
  stage: STAGE,
  provider,
  api_shape: apiShape,
  model_name: modelName,
  endpoint_url: endpoint.ok ? endpoint.safe_endpoint : null,
  auth_required: authRequired,
  auth_token_present: authTokenPresent,
  operator_signal_present: isReadySignal(operatorSignal),
  local_endpoint_probe: localEndpointProbe,
  local_model_execution: false,
  external_provider_call: false,
  telemetry_sink_write: false,
  synthetic_trace_generation: false,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  can_enter_local_no_tool_canary: status === "pass",
  checks,
  probe_summary: probeSummary,
  claims_allowed: claimBoundary.claims_allowed,
  claims_blocked: CLAIMS_BLOCKED,
  failures: failed
};

const redactionReport = {
  status: redactionPassed(report) && redactionPassed(probeSummary) ? "pass" : "fail",
  stage: STAGE,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false
};

const unresolvedItems = status === "pass"
  ? []
  : failed.map((check, index) => ({
    id: `LERP-${String(index + 1).padStart(3, "0")}`,
    severity: "medium",
    description: `Local endpoint readiness preflight failed: ${check.name}`,
    blocks_local_no_tool_canary: true,
    blocks_local_model_verified: true,
    recommended_next_action: "Fix the readiness input or local endpoint state, then rerun the readiness preflight."
  }));

const md = `# Local Endpoint Readiness Preflight

Status: ${report.status}

- Stage: ${report.stage}
- Provider: ${report.provider}
- Endpoint: ${report.endpoint_url || "invalid"}
- Model: ${report.model_name || "missing"}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: false
- Raw request stored: false
- Raw response stored: false
- Can enter local no-tool canary: ${report.can_enter_local_no_tool_canary}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}

## Claim Boundary

- Allows after pass: ${claimBoundary.claims_allowed.join(", ") || "none"}
- Still blocked: ${CLAIMS_BLOCKED.join(", ")}
`;

writeJson(p("evidence", evidenceDir, "local_endpoint_readiness_preflight_report.json"), report);
writeJson(p("evidence", evidenceDir, "endpoint_probe_summary.json"), probeSummary);
writeJson(p("evidence", evidenceDir, "local_endpoint_readiness_redaction_report.json"), redactionReport);
writeJson(p("evidence", evidenceDir, "local_endpoint_readiness_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", evidenceDir, "local_endpoint_readiness_gate_report.json"), report);
writeJson(p("evidence", evidenceDir, "unresolved_items.json"), unresolvedItems);
writeText(p("evidence", evidenceDir, "local_endpoint_readiness_preflight_report.md"), md);
writeJson(p("evals", "reports", `${reportPrefix}_report.json`), report);
writeText(p("evals", "reports", `${reportPrefix}_report.md`), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" && redactionReport.status === "pass" ? 0 : 1);
