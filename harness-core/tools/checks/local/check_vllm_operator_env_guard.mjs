#!/usr/bin/env node
import path from "node:path";
import { redactionPassed } from "../../../adapters/api/openai/redaction_policy.mjs";
import { writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-vllm-operator-env-guard";
const DEFAULT_EVIDENCE_DIR = "release-grade-vllm-operator-env-guard";
const DEFAULT_REPORT_PREFIX = "release_grade_vllm_operator_env_guard";
const DEFAULT_ENDPOINT = "http://127.0.0.1:8000/v1";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SMART_QUOTES = /[\u2018\u2019\u201C\u201D]/;
const ASCII_SURROUNDING_QUOTES = /^["']|["']$/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const CLAIMS_BLOCKED = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
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

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
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

function parseEndpoint(value) {
  try {
    const parsed = new URL(value);
    return {
      ok: true,
      parsed,
      safe_endpoint: `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "") || "/v1"}`
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function isLocalEndpoint(url) {
  return LOCAL_HOSTS.has(url.hostname);
}

function isOpenAiCompatibleBasePath(url) {
  const pathname = url.pathname.replace(/\/+$/, "");
  return pathname === "" || pathname === "/v1" || pathname.endsWith("/v1");
}

function addCheck(checks, name, status, detail = {}) {
  checks.push({ name, status, detail });
}

function requiredStatus(value, strict) {
  return value ? "pass" : strict ? "fail" : "hold";
}

function parseApiKeyPresence() {
  const override = argValue("api-key-present", null);
  if (override !== null) {
    return {
      present: ["yes", "true", "1"].includes(String(override).trim().toLowerCase()),
      source: "presence_override"
    };
  }
  return {
    present: Boolean(process.env.VLLM_API_KEY || process.env.LOCAL_ENDPOINT_API_KEY),
    source: "environment_presence_only"
  };
}

const strict = hasFlag("strict") || argValue("strict", "false") === "true";
const endpointRaw = argValue("endpoint-url", process.env.VLLM_ENDPOINT_URL || process.env.LOCAL_ENDPOINT_URL || "");
const modelRaw = argValue("model", process.env.VLLM_MODEL || process.env.LOCAL_ENDPOINT_MODEL || "");
const authRequiredRaw = argValue("auth-required", process.env.VLLM_AUTH_REQUIRED || process.env.LOCAL_ENDPOINT_AUTH_REQUIRED || "no");
const timeoutRaw = argValue("timeout-ms", process.env.VLLM_TIMEOUT_MS || process.env.LOCAL_ENDPOINT_TIMEOUT_MS || "90000");
const evidenceDir = normalizeRelativePath(argValue("evidence-dir", DEFAULT_EVIDENCE_DIR));
const reportPrefix = normalizeFileStem(argValue("report-prefix", DEFAULT_REPORT_PREFIX));
const endpointUrl = String(endpointRaw || "").trim();
const modelName = String(modelRaw || "").trim();
const authRequired = String(authRequiredRaw || "").trim();
const timeoutMs = Number(String(timeoutRaw || "").trim());
const apiKey = parseApiKeyPresence();
const endpoint = endpointUrl ? parseEndpoint(endpointUrl) : null;
const checks = [];

addCheck(checks, "endpoint URL is present", requiredStatus(Boolean(endpointUrl), strict), {
  endpoint_url_present: Boolean(endpointUrl),
  default_endpoint_hint: DEFAULT_ENDPOINT
});
if (endpointUrl) {
  addCheck(checks, "endpoint URL parses", endpoint.ok ? "pass" : "fail", {
    error: endpoint.ok ? null : endpoint.error
  });
  if (endpoint.ok) {
    addCheck(checks, "endpoint protocol is http or https", ["http:", "https:"].includes(endpoint.parsed.protocol) ? "pass" : "fail", {
      protocol: endpoint.parsed.protocol
    });
    addCheck(checks, "endpoint is localhost-only", isLocalEndpoint(endpoint.parsed) ? "pass" : "fail", {
      endpoint_host: endpoint.parsed.hostname
    });
    addCheck(checks, "endpoint has no embedded credentials", !endpoint.parsed.username && !endpoint.parsed.password ? "pass" : "fail", {});
    addCheck(checks, "endpoint has no query or hash", !endpoint.parsed.search && !endpoint.parsed.hash ? "pass" : "fail", {});
    addCheck(checks, "endpoint is OpenAI-compatible base URL", isOpenAiCompatibleBasePath(endpoint.parsed) ? "pass" : "fail", {
      endpoint_path: endpoint.parsed.pathname.replace(/\/+$/, "") || "/v1"
    });
  }
}

addCheck(checks, "model name is present", requiredStatus(Boolean(modelName), strict), {
  model_name_present: Boolean(modelName)
});
if (modelName) {
  addCheck(checks, "model name has no smart quotes", SMART_QUOTES.test(modelName) ? "fail" : "pass", {});
  addCheck(checks, "model name has no embedded shell quotes", ASCII_SURROUNDING_QUOTES.test(modelName) ? "fail" : "pass", {});
  addCheck(checks, "model name has no control characters", CONTROL_CHARS.test(modelName) ? "fail" : "pass", {});
  addCheck(checks, "model name length is bounded", modelName.length <= 200 ? "pass" : "fail", {
    model_name_length: modelName.length
  });
}

addCheck(checks, "auth requirement is exactly yes or no", ["yes", "no"].includes(authRequired) ? "pass" : "fail", {
  auth_required: authRequired
});
if (authRequired === "yes") {
  addCheck(checks, "api key presence matches auth requirement", apiKey.present ? "pass" : "fail", {
    auth_required: authRequired,
    api_key_present: apiKey.present,
    api_key_source: apiKey.source
  });
} else if (authRequired === "no") {
  addCheck(checks, "api key is not required", "pass", {
    auth_required: authRequired,
    api_key_present: apiKey.present,
    api_key_value_stored: false
  });
}
addCheck(checks, "timeout is bounded", Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 180000 ? "pass" : "fail", {
  timeout_ms: Number.isFinite(timeoutMs) ? timeoutMs : null
});

const failures = checks.filter((check) => check.status === "fail");
const holds = checks.filter((check) => check.status === "hold");
const status = failures.length > 0 ? "fail" : holds.length > 0 ? "hold" : "pass";
const safeEndpoint = endpoint?.ok ? endpoint.safe_endpoint : null;

const report = {
  status,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  strict,
  provider: "vllm",
  endpoint_url: safeEndpoint,
  endpoint_url_present: Boolean(endpointUrl),
  model_name: modelName || null,
  model_name_present: Boolean(modelName),
  auth_required: authRequired || null,
  api_key_present: apiKey.present,
  api_key_value_stored: false,
  raw_authorization_header_recorded: false,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  external_provider_call: false,
  telemetry_sink_write: false,
  can_enter_vllm_live_evidence_gate: status === "pass",
  provider_verified_allowed_by_this_artifact: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  claims_allowed: status === "pass" ? ["release-grade-vllm-operator-env-guard-passed"] : [],
  claims_blocked: CLAIMS_BLOCKED,
  checks,
  failures,
  holds,
  next_actions: status === "pass"
    ? ["Run npm run vllm-release-grade-evidence-gate, or continue the manual vLLM evidence sequence."]
    : [
      "Set VLLM_ENDPOINT_URL to a localhost OpenAI-compatible base URL such as http://127.0.0.1:8000/v1.",
      "Set VLLM_MODEL to the exact served model id using ASCII quotes only.",
      "Set VLLM_AUTH_REQUIRED to yes or no. If yes, set VLLM_API_KEY without storing the token in evidence."
    ]
};

const redactionReport = {
  status: redactionPassed(report) ? "pass" : "fail",
  stage: STAGE,
  raw_authorization_header_recorded: false,
  raw_request_body_recorded: false,
  raw_response_recorded: false,
  api_key_recorded: false,
  secrets_logged: false,
  raw_request_stored: false,
  raw_response_stored: false
};

const unresolvedItems = status === "pass" ? [] : [...failures, ...holds].map((check, index) => ({
  id: `VLLM-ENV-${String(index + 1).padStart(3, "0")}`,
  severity: check.status === "fail" ? "high" : "medium",
  status: check.status,
  description: `vLLM operator environment guard did not pass: ${check.name}`,
  blocks_vllm_live_evidence_gate: true,
  blocks_adapter_checked: true,
  recommended_next_action: "Correct the vLLM environment values, then rerun npm run preflight:vllm-operator-env."
}));

const md = `# vLLM Operator Environment Guard

Status: ${status}

- Stage: ${STAGE}
- Strict mode: ${strict}
- Endpoint: ${report.endpoint_url || "missing"}
- Model present: ${report.model_name_present}
- Auth required: ${report.auth_required || "missing"}
- API key present: ${report.api_key_present}
- Local endpoint probe: false
- Local model execution: false
- Raw request stored: false
- Raw response stored: false
- Can enter vLLM live evidence gate: ${report.can_enter_vllm_live_evidence_gate}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evidence", evidenceDir, "vllm_operator_env_guard_report.json"), report);
writeJson(p("evidence", evidenceDir, "vllm_operator_env_guard_redaction_report.json"), redactionReport);
writeJson(p("evidence", evidenceDir, "unresolved_items.json"), {
  status,
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeText(p("evidence", evidenceDir, "vllm_operator_env_guard_report.md"), md);
writeJson(p("evals", "reports", `${reportPrefix}_report.json`), report);
writeText(p("evals", "reports", `${reportPrefix}_report.md`), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" || (!strict && status === "hold") ? 0 : 1);
