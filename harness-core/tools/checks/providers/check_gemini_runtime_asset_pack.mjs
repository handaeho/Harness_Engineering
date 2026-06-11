#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";

const STAGE = "v2.0.0-gemini-runtime-asset-pack-check";
const repoRoot = process.cwd();
const root = process.argv[2]
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const requiredFiles = [
  "adapters/api/gemini/adapter.yaml",
  "adapters/api/gemini/request_mapper.mjs",
  "adapters/api/gemini/response_mapper.mjs",
  "adapters/api/gemini/structured_output_mapper.mjs",
  "adapters/api/gemini/tool_calling_mapper.mjs",
  "adapters/api/gemini/safety_mapper.mjs",
  "adapters/api/gemini/generate_content_client.mjs",
  "adapters/api/gemini/canary_cases.jsonl",
  "adapters/api/gemini/structured_output_cases.jsonl",
  "adapters/api/gemini/tool_calling_cases.jsonl",
  "adapters/api/gemini/safety_cases.jsonl",
  "adapters/api/gemini/tool_schemas/canary_lookup.schema.json",
  "adapters/api/gemini/tool_schemas/canary_calculator.schema.json",
  "adapters/api/gemini/tool_schemas/blocked_external_post.schema.json",
  "tools/runners/providers/run_gemini_provider_canary.mjs",
  "tools/runners/providers/run_gemini_structured_output_canary.mjs",
  "tools/runners/providers/run_gemini_tool_calling_canary.mjs",
  "tools/checks/providers/check_gemini_live_canary_preflight.mjs",
  "tools/checks/providers/check_provider_canary_gemini.mjs",
  "tools/checks/providers/check_gemini_structured_output_canary.mjs",
  "tools/checks/providers/check_gemini_tool_calling_canary.mjs",
  "tools/checks/providers/check_gemini_runtime_asset_pack.mjs",
  "evals/suites/beta_provider_canary_gemini.yaml",
  "release/scopes/beta/beta_provider_canary_gemini_scope.yaml",
  "docs/providers/provider_canary_gemini.md",
  "docs/providers/gemini_autonomous_runtime_asset_pack.ko.md",
  "docs/providers/gemini_readiness_review.ko.md",
  "evidence/beta-provider-canary-gemini/gemini_provider_canary_report.json",
  "evidence/beta-provider-canary-gemini/gemini_live_canary_preflight_report.json",
  "evidence/beta-provider-canary-gemini/gemini_provider_canary_gate_report.json",
  "evidence/beta-provider-canary-gemini/request_response_mapping_report.json",
  "evidence/beta-provider-canary-gemini/structured_output_validation_report.json",
  "evidence/beta-provider-canary-gemini/tool_calling_dry_run_report.json",
  "evidence/beta-provider-canary-gemini/safety_fixture_report.json",
  "evidence/beta-provider-canary-gemini/redaction_report.json",
  "evidence/beta-provider-canary-gemini/provider_trace_samples.jsonl",
  "evidence/beta-structured-output-canary-gemini/structured_output_canary_report.json",
  "evidence/beta-structured-output-canary-gemini/structured_output_gate_report.json",
  "evidence/beta-structured-output-canary-gemini/structured_output_trace_samples.jsonl",
  "evidence/beta-tool-calling-canary-gemini/tool_calling_canary_report.json",
  "evidence/beta-tool-calling-canary-gemini/tool_calling_gate_report.json",
  "evidence/beta-tool-calling-canary-gemini/tool_calling_trace_samples.jsonl"
];

for (const file of requiredFiles) {
  addCheck(checks, `required file exists: ${file}`, exists(file), { file });
}

const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
const gemini = matrix.providers?.gemini || {};
addCheck(checks, "provider matrix has gemini entry", Boolean(matrix.providers?.gemini), {
  providers: Object.keys(matrix.providers || {})
});
addCheck(checks, "gemini provider points to adapter", gemini.adapter_path === "adapters/api/gemini/adapter.yaml", {
  adapter_path: gemini.adapter_path
});
addCheck(checks, "gemini provider matrix records live text canary without strong claims", gemini.status === "provider_canary_checked"
  && gemini.provider_canary === "executed"
  && gemini.no_tool_text_path === "canary_checked"
  && gemini.provider_trace === "canary_checked"
  && gemini.provider_execution === "canary_only"
  && gemini.verified === false
  && gemini.local_model_execution === false
  && gemini.runtime_execution === false
  && gemini.production_monitoring === false
  && gemini.production_telemetry === false, {
  status: gemini.status,
  provider_canary: gemini.provider_canary,
  no_tool_text_path: gemini.no_tool_text_path,
  provider_trace: gemini.provider_trace,
  provider_execution: gemini.provider_execution,
  verified: gemini.verified,
  runtime_execution: gemini.runtime_execution,
  production_monitoring: gemini.production_monitoring
});
addCheck(checks, "gemini provider matrix records structured output live canary without strong claims", gemini.structured_output_canary === "executed"
  && gemini.structured_output_path === "canary_checked"
  && gemini.json_schema_response_validation === "canary_checked"
  && gemini.structured_outputs === "canary_only"
  && gemini.verified === false
  && gemini.runtime_execution === false
  && gemini.production_monitoring === false, {
  structured_output_canary: gemini.structured_output_canary,
  structured_output_path: gemini.structured_output_path,
  json_schema_response_validation: gemini.json_schema_response_validation,
  structured_outputs: gemini.structured_outputs,
  verified: gemini.verified,
  runtime_execution: gemini.runtime_execution,
  production_monitoring: gemini.production_monitoring
});

const canary = readJson(p("evidence", "beta-provider-canary-gemini", "gemini_provider_canary_report.json"));
const preflight = readJson(p("evidence", "beta-provider-canary-gemini", "gemini_live_canary_preflight_report.json"));
const gate = readJson(p("evidence", "beta-provider-canary-gemini", "gemini_provider_canary_gate_report.json"));
const structured = readJson(p("evidence", "beta-provider-canary-gemini", "structured_output_validation_report.json"));
const tool = readJson(p("evidence", "beta-provider-canary-gemini", "tool_calling_dry_run_report.json"));
const safety = readJson(p("evidence", "beta-provider-canary-gemini", "safety_fixture_report.json"));
const structuredLive = readJson(p("evidence", "beta-structured-output-canary-gemini", "structured_output_canary_report.json"));
const structuredLiveGate = readJson(p("evidence", "beta-structured-output-canary-gemini", "structured_output_gate_report.json"));
const toolLive = readJson(p("evidence", "beta-tool-calling-canary-gemini", "tool_calling_canary_report.json"));
const toolLiveGate = readJson(p("evidence", "beta-tool-calling-canary-gemini", "tool_calling_gate_report.json"));
const acceptedBlocked = new Set([
  "blocked_by_missing_credential",
  "blocked_by_missing_model",
  "blocked_by_live_execution_not_enabled",
  "blocked_by_network_approval_missing"
]);

addCheck(checks, "gemini local dry-run report pass", canary.local_dry_run_status === "pass", {
  status: canary.status,
  local_dry_run_status: canary.local_dry_run_status
});
addCheck(checks, "gemini live text canary executed and passed when present", canary.status === "pass"
  && canary.provider_execution === true
  && canary.live_cases_total > 0
  && canary.live_cases_failed === 0
  && canary.redaction_passed === true
  && canary.raw_response_stored === false, {
  status: canary.status,
  provider_execution: canary.provider_execution,
  live_cases_total: canary.live_cases_total,
  live_cases_failed: canary.live_cases_failed,
  raw_response_stored: canary.raw_response_stored
});
addCheck(checks, "gemini live preflight recorded", ["ready", "blocked"].includes(preflight.status)
  && preflight.live_provider_execution === false
  && preflight.network_call_performed === false, {
  status: preflight.status,
  blocking_checks: Array.isArray(preflight.blocking_checks) ? preflight.blocking_checks.length : "not_array"
});
addCheck(checks, "gemini structured output freshness gate recorded", preflight.structured_output_shape_decision?.target_shape === "generationConfig.responseJsonSchema"
  && Array.isArray(preflight.structured_output_shape_decision?.official_sources_required_before_shape_change)
  && preflight.structured_output_shape_decision.official_sources_required_before_shape_change.includes("https://ai.google.dev/gemini-api/docs/structured-output"), {
  structured_output_shape_decision: preflight.structured_output_shape_decision
});
addCheck(checks, "gemini gate blocks strong claims", gate.can_enter_provider_verified_claim === false
  && gate.can_enter_adapter_checked_claim === false
  && gate.can_enter_release_gated_claim === false, {
  status: gate.status,
  can_enter_provider_verified_claim: gate.can_enter_provider_verified_claim
});
addCheck(checks, "structured output evidence pass", structured.status === "pass" && structured.schema_validations_failed === 0, {
  status: structured.status,
  schema_validations_failed: structured.schema_validations_failed
});
addCheck(checks, "tool calling dry-run evidence pass", tool.status === "pass"
  && tool.tool_argument_validations_failed === 0
  && tool.reinjections_failed === 0
  && tool.blocked_tools_executed === 0, {
  status: tool.status,
  tool_argument_validations_failed: tool.tool_argument_validations_failed,
  reinjections_failed: tool.reinjections_failed,
  blocked_tools_executed: tool.blocked_tools_executed
});
addCheck(checks, "safety fixture evidence pass", safety.status === "pass" && safety.blocked_response_handling_checked === true, {
  status: safety.status,
  blocked_response_handling_checked: safety.blocked_response_handling_checked
});
addCheck(checks, "gemini structured output live canary pass or explicit blocked", structuredLive.status === "pass" || acceptedBlocked.has(structuredLive.status), {
  status: structuredLive.status,
  provider_execution: structuredLive.provider_execution,
  live_cases_total: structuredLive.live_cases_total,
  live_cases_failed: structuredLive.live_cases_failed
});
addCheck(checks, "gemini structured output gate pass or blocked", ["pass", "blocked"].includes(structuredLiveGate.status)
  && structuredLiveGate.can_enter_provider_verified_claim === false
  && structuredLiveGate.can_enter_release_gated_claim === false, {
  status: structuredLiveGate.status
});
addCheck(checks, "gemini tool calling live canary pass or explicit blocked", toolLive.status === "pass" || acceptedBlocked.has(toolLive.status), {
  status: toolLive.status,
  provider_execution: toolLive.provider_execution,
  live_cases_total: toolLive.live_cases_total,
  live_cases_failed: toolLive.live_cases_failed
});
addCheck(checks, "gemini tool calling gate pass or blocked", ["pass", "blocked"].includes(toolLiveGate.status)
  && toolLiveGate.can_enter_provider_verified_claim === false
  && toolLiveGate.can_enter_release_gated_claim === false, {
  status: toolLiveGate.status
});
addCheck(checks, "gemini tool calling thought signature evidence pass when live pass", toolLive.status === "pass"
  ? toolLive.thought_signatures_captured >= toolLive.expected_final_responses
    && toolLive.thought_signatures_reinjected >= toolLive.expected_final_responses
    && toolLive.raw_response_stored === false
  : true, {
  status: toolLive.status,
  thought_signatures_captured: toolLive.thought_signatures_captured,
  thought_signatures_reinjected: toolLive.thought_signatures_reinjected,
  expected_final_responses: toolLive.expected_final_responses,
  raw_response_stored: toolLive.raw_response_stored
});

const geminiRuntimeFiles = [
  "adapters/api/gemini/request_mapper.mjs",
  "adapters/api/gemini/response_mapper.mjs",
  "adapters/api/gemini/structured_output_mapper.mjs",
  "adapters/api/gemini/tool_calling_mapper.mjs",
  "adapters/api/gemini/safety_mapper.mjs",
  "tools/runners/providers/run_gemini_provider_canary.mjs",
  "tools/runners/providers/run_gemini_structured_output_canary.mjs",
  "tools/runners/providers/run_gemini_tool_calling_canary.mjs",
  "tools/checks/providers/check_gemini_live_canary_preflight.mjs",
  "tools/checks/providers/check_provider_canary_gemini.mjs",
  "tools/checks/providers/check_gemini_structured_output_canary.mjs",
  "tools/checks/providers/check_gemini_tool_calling_canary.mjs"
];
const promptStackImports = [];
for (const file of geminiRuntimeFiles) {
  const text = readText(p(...file.split("/")));
  if (text.includes("prompt-stack") || text.includes("prompt_stack")) {
    promptStackImports.push(file);
  }
}
addCheck(checks, "harness-core gemini runtime does not import prompt-stack assets", promptStackImports.length === 0, {
  prompt_stack_imports: promptStackImports
});

const liveTextCanaryPassed = canary.status === "pass"
  && canary.provider_execution === true
  && canary.live_cases_total > 0
  && canary.live_cases_failed === 0;
const structuredLiveCanaryPassed = structuredLive.status === "pass"
  && structuredLive.provider_execution === true
  && structuredLive.live_cases_total > 0
  && structuredLive.live_cases_failed === 0
  && structuredLiveGate.status === "pass";
const toolLiveCanaryPassed = toolLive.status === "pass"
  && toolLive.provider_execution === true
  && toolLive.live_cases_total > 0
  && toolLive.live_cases_failed === 0
  && toolLiveGate.status === "pass";
const providerExecutionEvidenceEquivalent = liveTextCanaryPassed
  && structuredLiveCanaryPassed
  && toolLiveCanaryPassed;
addCheck(checks, "gemini provider matrix records tool calling live state without overclaim", toolLiveCanaryPassed
  ? gemini.tool_calling_canary === "executed"
    && gemini.tool_call_path === "canary_checked"
    && gemini.tool_argument_schema_validation === "canary_checked"
    && gemini.mock_tool_output_reinjection === "canary_checked"
    && gemini.tool_output_reclassification === "canary_checked"
    && gemini.tool_calling === "canary_only"
    && gemini.verified === false
    && gemini.runtime_execution === false
    && gemini.production_monitoring === false
  : gemini.tool_calling_canary === "dry_run_checked"
    && gemini.tool_call_path === "dry_run_checked"
    && gemini.tool_argument_schema_validation === "dry_run_checked"
    && gemini.mock_tool_output_reinjection === "dry_run_checked"
    && gemini.tool_output_reclassification === "dry_run_checked"
    && gemini.tool_calling === "canary_only"
    && gemini.verified === false
    && gemini.runtime_execution === false
    && gemini.production_monitoring === false, {
  tool_live_canary_passed: toolLiveCanaryPassed,
  tool_calling_canary: gemini.tool_calling_canary,
  tool_call_path: gemini.tool_call_path,
  tool_argument_schema_validation: gemini.tool_argument_schema_validation,
  mock_tool_output_reinjection: gemini.mock_tool_output_reinjection,
  tool_output_reclassification: gemini.tool_output_reclassification,
  tool_calling: gemini.tool_calling,
  verified: gemini.verified,
  runtime_execution: gemini.runtime_execution,
  production_monitoring: gemini.production_monitoring
});
const failedChecks = checks.filter((item) => item.status !== "pass");
const dryRunClaims = [
  "gemini-runtime-asset-pack-checked",
  "gemini-request-mapping-dry-run-checked",
  "gemini-structured-output-dry-run-checked",
  "gemini-tool-calling-dry-run-checked",
  "gemini-safety-fixture-checked"
];
const liveTextClaims = [
  "gemini-provider-canary-executed",
  "gemini-provider-trace-captured"
];
const structuredLiveClaims = [
  "gemini-structured-output-live-canary-executed",
  "gemini-provider-structured-output-path-checked",
  "gemini-json-schema-response-live-validated",
  "gemini-structured-output-trace-captured"
];
const toolLiveClaims = [
  "gemini-tool-calling-live-canary-executed",
  "gemini-provider-tool-call-path-checked",
  "gemini-tool-argument-schema-live-validated",
  "gemini-function-response-reinjection-live-checked",
  "gemini-tool-approval-boundary-checked",
  "gemini-tool-output-reclassification-checked",
  "gemini-tool-calling-trace-captured",
  "gemini-tool-calling-redaction-checked"
];
const report = {
  status: failedChecks.length === 0 ? "pass" : "fail",
  stage: STAGE,
  provider: "gemini",
  owner_layer: "harness-core provider runtime",
  target_agent: "fully autonomous programming agent",
  asset_pack_surface_equivalent_to_openai_local: failedChecks.length === 0,
  live_text_execution_evidence_equivalent_to_openai: liveTextCanaryPassed,
  structured_output_live_evidence_equivalent_to_openai: structuredLiveCanaryPassed,
  tool_calling_live_evidence_equivalent_to_openai: toolLiveCanaryPassed,
  execution_evidence_equivalent_to_openai_local: providerExecutionEvidenceEquivalent,
  execution_evidence_equivalence_gap: [
    liveTextCanaryPassed ? "Gemini live text canary passed." : "Gemini live text canary is not passed.",
    structuredLiveCanaryPassed ? "Gemini structured output live canary passed." : "Gemini structured output live canary is not passed.",
    toolLiveCanaryPassed ? "Gemini tool-calling live canary passed." : "Gemini tool-calling live canary is not passed.",
    "Provider-verified, adapter-checked, release-gated, and production-ready claims remain blocked."
  ],
  live_provider_execution: canary.provider_execution === true,
  local_dry_run_status: canary.local_dry_run_status,
  checks,
  failures: failedChecks,
  claims_allowed: dryRunClaims
    .concat(liveTextCanaryPassed ? liveTextClaims : [])
    .concat(structuredLiveCanaryPassed ? structuredLiveClaims : [])
    .concat(toolLiveCanaryPassed ? toolLiveClaims : []),
  claims_blocked: [
    "provider-verified",
    "adapter-checked",
    "release-gated",
    "production-ready",
    "live Gemini canary passed"
  ]
};

const md = `# Gemini Runtime Asset Pack Check

Status: ${report.status}

- Owner layer: ${report.owner_layer}
- Target agent: ${report.target_agent}
- Asset-pack surface equivalent to OpenAI/local: ${report.asset_pack_surface_equivalent_to_openai_local}
- Live text execution evidence equivalent to OpenAI: ${report.live_text_execution_evidence_equivalent_to_openai}
- Structured output live evidence equivalent to OpenAI: ${report.structured_output_live_evidence_equivalent_to_openai}
- Tool calling live evidence equivalent to OpenAI: ${report.tool_calling_live_evidence_equivalent_to_openai}
- Execution evidence equivalent to OpenAI/local: ${report.execution_evidence_equivalent_to_openai_local}
- Live provider execution: ${report.live_provider_execution}
- Local dry-run status: ${report.local_dry_run_status}

## Claim Boundary

- Allowed: ${report.claims_allowed.join(", ")}
- Blocked: ${report.claims_blocked.join(", ")}
`;

writeJson(p("evals", "reports", "gemini_runtime_asset_pack_report.json"), report);
writeText(p("evals", "reports", "gemini_runtime_asset_pack_report.md"), md);
writeJson(p("evidence", "beta-provider-canary-gemini", "gemini_runtime_asset_pack_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
