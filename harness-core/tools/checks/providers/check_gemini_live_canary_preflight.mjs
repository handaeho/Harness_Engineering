#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-live-provider-canary-preflight";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(rel) {
  return fs.existsSync(p(...rel.split("/")));
}

function addCheck(checks, name, pass, detail = {}, blocksLive = true) {
  checks.push({ name, status: pass ? "pass" : "blocked", blocks_live_canary: blocksLive && !pass, detail });
}

function redactEnvPresence(env) {
  return {
    GEMINI_API_KEY: Boolean(env.GEMINI_API_KEY),
    GEMINI_MODEL: Boolean(env.GEMINI_MODEL),
    GEMINI_PROVIDER_CANARY_ENABLE_LIVE: env.GEMINI_PROVIDER_CANARY_ENABLE_LIVE === "1",
    GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL: env.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL === "1"
  };
}

const checks = [];
const envPresence = redactEnvPresence(process.env);
const liveCredentialGateOpen = envPresence.GEMINI_API_KEY
  && envPresence.GEMINI_MODEL
  && envPresence.GEMINI_PROVIDER_CANARY_ENABLE_LIVE;
const structuredMapper = exists("adapters/api/gemini/structured_output_mapper.mjs")
  ? readText(p("adapters", "api", "gemini", "structured_output_mapper.mjs"))
  : "";
const canaryRunner = exists("tools/runners/providers/run_gemini_provider_canary.mjs")
  ? readText(p("tools", "runners", "providers", "run_gemini_provider_canary.mjs"))
  : "";
const scope = exists("release/scopes/beta/beta_provider_canary_gemini_scope.yaml")
  ? readText(p("release", "scopes", "beta", "beta_provider_canary_gemini_scope.yaml"))
  : "";
const suite = exists("evals/suites/beta_provider_canary_gemini.yaml")
  ? readText(p("evals", "suites", "beta_provider_canary_gemini.yaml"))
  : "";

addCheck(checks, "GEMINI_API_KEY present", envPresence.GEMINI_API_KEY, { present: envPresence.GEMINI_API_KEY });
addCheck(checks, "GEMINI_MODEL present", envPresence.GEMINI_MODEL, { present: envPresence.GEMINI_MODEL });
addCheck(checks, "GEMINI_PROVIDER_CANARY_ENABLE_LIVE equals 1", envPresence.GEMINI_PROVIDER_CANARY_ENABLE_LIVE, {
  present_and_enabled: envPresence.GEMINI_PROVIDER_CANARY_ENABLE_LIVE
});
addCheck(checks, "network approval boundary recorded", envPresence.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL, {
  required_boundary: "separate user/tool approval before live network execution",
  env_marker_present: envPresence.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL,
  note: "This marker records operator intent only; sandbox/tool approval remains a separate runtime gate."
});
addCheck(checks, "raw request and response storage remains disabled", canaryRunner.includes("raw_response_stored: false")
  && canaryRunner.includes("raw_request_body_recorded: false")
  && canaryRunner.includes("raw_response_recorded: false"), {
  raw_response_stored_false: canaryRunner.includes("raw_response_stored: false")
}, true);
addCheck(checks, "redaction policy is part of canary runner", canaryRunner.includes("redaction_passed")
  && canaryRunner.includes("sanitizeGenerateContentRequest")
  && canaryRunner.includes("sanitizeMappedResponse"), {}, true);
addCheck(checks, "structured output target shape is explicit", structuredMapper.includes("responseJsonSchema")
  && structuredMapper.includes("responseMimeType")
  && structuredMapper.includes("application/json"), {
  target_shape: "generationConfig.responseJsonSchema with generationConfig.responseMimeType=application/json"
}, true);
addCheck(checks, "structured output source freshness gate is recorded", scope.includes("structured_output_doc_freshness_gate")
  && suite.includes("https://ai.google.dev/gemini-api/docs/structured-output")
  && suite.includes("https://ai.google.dev/api/generate-content"), {
  required_sources: [
    "https://ai.google.dev/api/generate-content",
    "https://ai.google.dev/gemini-api/docs/structured-output"
  ]
}, true);
addCheck(checks, "live text canary remains separate from live structured/tool claims", scope.includes("structured_output_live_canary")
  && scope.includes("tool_calling_live_canary")
  && scope.includes("separate_future_stage"), {}, true);
addCheck(checks, "direct live runner requires network approval marker", canaryRunner.includes("GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL")
  && canaryRunner.includes("blocked_by_network_approval_missing"), {
  runner_live_guard: "GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1 required in addition to credential/model/live-enable env."
}, true);

const blocking = checks.filter((item) => item.blocks_live_canary);
const status = blocking.length === 0 ? "ready" : "blocked";
const shouldFailClosed = liveCredentialGateOpen && !envPresence.GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL;
const report = {
  status,
  stage: STAGE,
  provider: "gemini",
  api_lane: "native_gemini_api",
  live_provider_execution: false,
  network_call_performed: false,
  env_presence: envPresence,
  live_credential_gate_open: liveCredentialGateOpen,
  fail_closed: shouldFailClosed,
  structured_output_shape_decision: {
    target_shape: "generationConfig.responseJsonSchema",
    response_mime_type: "application/json",
    official_sources_required_before_shape_change: [
      "https://ai.google.dev/api/generate-content",
      "https://ai.google.dev/gemini-api/docs/structured-output"
    ],
    note: "The live text canary does not validate live structured output or live tool calling."
  },
  checks,
  blocking_checks: blocking,
  claims_allowed_when_ready: [
    "gemini-live-canary-preflight-ready"
  ],
  claims_blocked: [
    "provider-verified",
    "adapter-checked",
    "release-gated",
    "production-ready",
    "live Gemini canary passed",
    "tool-call-verified",
    "schema-output-verified"
  ]
};

const md = `# Gemini Live Provider Canary Preflight

Status: ${report.status}

Stage: ${report.stage}

- Provider: ${report.provider}
- API lane: ${report.api_lane}
- Live provider execution: false
- Network call performed: false
- Blocking checks: ${blocking.length}

## Structured Output Shape

- Target shape: ${report.structured_output_shape_decision.target_shape}
- Response MIME type: ${report.structured_output_shape_decision.response_mime_type}
- Live text canary does not validate live structured output or live tool calling.

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "gemini_live_canary_preflight_report.json"), report);
writeText(p("evals", "reports", "gemini_live_canary_preflight_report.md"), md);
writeJson(p("evidence", "beta-provider-canary-gemini", "gemini_live_canary_preflight_report.json"), report);
writeText(p("evidence", "beta-provider-canary-gemini", "gemini_live_canary_preflight_report.md"), md);

console.log(JSON.stringify({
  status: report.status,
  blocking_checks: blocking.length,
  live_provider_execution: false,
  fail_closed: shouldFailClosed
}, null, 2));

if (shouldFailClosed) process.exit(1);
