import { LangfuseSpanProcessor, isLangfuseSpan } from "@langfuse/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-telemetry-connection";
const ENABLED_VALUES = new Set(["1", "true", "yes"]);
const SECRET_KEY_PATTERN = /(authorization|api[-_]?key|secret|token|password|credential|cookie|set-cookie|headers?)/i;
const RAW_KEY_PATTERN = /^(raw[-_]?request|raw[-_]?response|raw[-_]?payload|raw[-_]?body|request[-_]?body|response[-_]?body)$/i;
const SECRET_VALUE_PATTERN = /\b(Bearer\s+[A-Za-z0-9._~+/=-]+|sk-[A-Za-z0-9._~+/=-]+|pk-lf-[A-Za-z0-9._~+/=-]+|sk-lf-[A-Za-z0-9._~+/=-]+)\b/g;

let activeTracing = null;

function isEnabled(value) {
  return ENABLED_VALUES.has(String(value || "").trim().toLowerCase());
}

function resolveBaseUrl(env) {
  return {
    value: env.LANGFUSE_BASE_URL || env.LANGFUSE_HOST || "",
    source: env.LANGFUSE_BASE_URL ? "LANGFUSE_BASE_URL" : env.LANGFUSE_HOST ? "LANGFUSE_HOST" : null
  };
}

function resolveApproval(env) {
  if (env.POST_RC_TELEMETRY_CONNECTION_APPROVAL) {
    return {
      present: env.POST_RC_TELEMETRY_CONNECTION_APPROVAL === APPROVAL_PHRASE,
      source: "POST_RC_TELEMETRY_CONNECTION_APPROVAL"
    };
  }

  if (env.PROMPT_STACK_TELEMETRY_APPROVAL) {
    return {
      present: env.PROMPT_STACK_TELEMETRY_APPROVAL === APPROVAL_PHRASE,
      source: "PROMPT_STACK_TELEMETRY_APPROVAL"
    };
  }

  return { present: false, source: null };
}

export function getLangfuseRuntimeConfig(env = process.env) {
  const baseUrl = resolveBaseUrl(env);
  const approval = resolveApproval(env);
  const enabled = isEnabled(env.LANGFUSE_TRACING_ENABLED);
  const publicKeyPresent = Boolean(env.LANGFUSE_PUBLIC_KEY);
  const secretKeyPresent = Boolean(env.LANGFUSE_SECRET_KEY);
  const baseUrlPresent = Boolean(baseUrl.value);

  const missing = [];
  if (!enabled) missing.push("LANGFUSE_TRACING_ENABLED=true");
  if (!approval.present) missing.push("telemetry_connection_approval");
  if (!publicKeyPresent) missing.push("LANGFUSE_PUBLIC_KEY");
  if (!secretKeyPresent) missing.push("LANGFUSE_SECRET_KEY");
  if (!baseUrlPresent) missing.push("LANGFUSE_BASE_URL_or_LANGFUSE_HOST");

  return {
    status: missing.length === 0 ? "ready" : "disabled",
    configured_sink: publicKeyPresent || secretKeyPresent || baseUrlPresent ? "langfuse" : "none",
    tracing_enabled_env: enabled,
    approval_present: approval.present,
    approval_source: approval.source,
    langfuse_public_key_present: publicKeyPresent,
    langfuse_secret_key_present: secretKeyPresent,
    langfuse_base_url_present: baseUrlPresent,
    langfuse_base_url_source: baseUrl.source,
    can_start: missing.length === 0,
    missing,
    secrets_logged: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false
  };
}

export function redactLangfuseData(data, seen = new WeakSet()) {
  if (typeof data === "string") {
    return data.replace(SECRET_VALUE_PATTERN, "[redacted]");
  }

  if (!data || typeof data !== "object") return data;

  if (seen.has(data)) return "[circular]";
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactLangfuseData(item, seen));
  }

  return Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (SECRET_KEY_PATTERN.test(key) || RAW_KEY_PATTERN.test(key)) {
      return [key, "[redacted]"];
    }

    return [key, redactLangfuseData(value, seen)];
  }));
}

export function initializeLangfuseTracing(env = process.env) {
  if (activeTracing?.enabled) return activeTracing;

  const config = getLangfuseRuntimeConfig(env);
  if (!config.can_start) {
    return {
      enabled: false,
      status: "disabled_missing_requirements",
      config,
      sdk: null,
      processor: null
    };
  }

  const baseUrl = resolveBaseUrl(env).value;
  const processor = new LangfuseSpanProcessor({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl,
    environment: env.LANGFUSE_TRACING_ENVIRONMENT || env.NODE_ENV || "local",
    release: env.LANGFUSE_RELEASE || "prompt-stack-v2",
    exportMode: env.LANGFUSE_EXPORT_MODE === "immediate" ? "immediate" : "batched",
    mask: ({ data }) => redactLangfuseData(data),
    shouldExportSpan: ({ otelSpan }) => isLangfuseSpan(otelSpan)
  });
  const sdk = new NodeSDK({ spanProcessors: [processor] });
  sdk.start();

  activeTracing = {
    enabled: true,
    status: "started",
    config,
    sdk,
    processor
  };
  return activeTracing;
}

export async function flushLangfuseTracing(tracing = activeTracing) {
  if (!tracing?.enabled || !tracing.processor) return { flushed: false };
  await tracing.processor.forceFlush();
  return { flushed: true };
}

export async function shutdownLangfuseTracing(tracing = activeTracing) {
  if (!tracing?.enabled || !tracing.sdk) return { shutdown: false };
  await tracing.sdk.shutdown();
  if (tracing === activeTracing) activeTracing = null;
  return { shutdown: true };
}
