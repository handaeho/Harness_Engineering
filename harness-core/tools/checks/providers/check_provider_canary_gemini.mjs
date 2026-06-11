#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-runtime-dry-run-provider-canary-gate";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const acceptedCanaryStatuses = new Set([
  "pass",
  "blocked_by_missing_credential",
  "blocked_by_missing_model",
  "blocked_by_live_execution_not_enabled",
  "blocked_by_network_approval_missing"
]);

const forbiddenAllowedClaims = new Set([
  "provider-verified",
  "adapter-checked",
  "release-gated",
  "production-ready",
  "live Gemini canary passed",
  "tool-call-verified",
  "schema-output-verified",
  "integration-verified"
]);

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(...parts) {
  return fs.existsSync(p(...parts));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const report = readJson(p("evals", "reports", "gemini_provider_canary_report.json"));
const mapping = readJson(p("evidence", "beta-provider-canary-gemini", "request_response_mapping_report.json"));
const structured = readJson(p("evidence", "beta-provider-canary-gemini", "structured_output_validation_report.json"));
const tool = readJson(p("evidence", "beta-provider-canary-gemini", "tool_calling_dry_run_report.json"));
const safety = readJson(p("evidence", "beta-provider-canary-gemini", "safety_fixture_report.json"));
const redaction = readJson(p("evidence", "beta-provider-canary-gemini", "redaction_report.json"));
const unresolved = readJson(p("evidence", "beta-provider-canary-gemini", "unresolved_items.json"));

addCheck(checks, "run_gemini_provider_canary.mjs pass or explicit blocked status", acceptedCanaryStatuses.has(report.status), {
  status: report.status,
  provider_execution: report.provider_execution,
  local_dry_run_status: report.local_dry_run_status
});
addCheck(checks, "local dry-run status pass", report.local_dry_run_status === "pass", {
  local_dry_run_status: report.local_dry_run_status
});
addCheck(checks, "request/response mapping pass", mapping.status === "pass"
  && mapping.request_mapping.contents_parts_used === true
  && mapping.request_mapping.system_instruction_used === true
  && mapping.request_mapping.tools_present === false
  && mapping.request_mapping.structured_output_present === false
  && mapping.response_mapping.output_text_extracted === true, {
  status: mapping.status,
  request_mapping: mapping.request_mapping,
  response_mapping: mapping.response_mapping
});
addCheck(checks, "structured output local schema validation pass", structured.status === "pass"
  && structured.response_json_schema_used === true
  && structured.response_mime_type_json === true
  && structured.ajv_validation_used === true
  && structured.schema_validations_failed === 0, {
  status: structured.status,
  schema_validations_total: structured.schema_validations_total,
  schema_validations_failed: structured.schema_validations_failed
});
addCheck(checks, "tool calling dry-run pass", tool.status === "pass"
  && tool.function_declarations_used === true
  && tool.function_calling_config_used === true
  && tool.built_in_tools_used === false
  && tool.tool_argument_validations_failed === 0
  && tool.reinjections_failed === 0
  && tool.blocked_tools_executed === 0, {
  status: tool.status,
  tool_argument_validations_total: tool.tool_argument_validations_total,
  tool_argument_validations_failed: tool.tool_argument_validations_failed,
  reinjections_checked: tool.reinjections_checked,
  reinjections_failed: tool.reinjections_failed,
  blocked_tools_executed: tool.blocked_tools_executed
});
addCheck(checks, "safety fixture pass", safety.status === "pass"
  && safety.safety_settings_request_shape_checked === true
  && safety.blocked_response_handling_checked === true, {
  status: safety.status,
  safety_settings_request_shape_checked: safety.safety_settings_request_shape_checked,
  blocked_response_handling_checked: safety.blocked_response_handling_checked
});
addCheck(checks, "redaction report pass", redaction.status === "pass"
  && redaction.redaction_passed === true
  && redaction.api_key_recorded === false
  && redaction.raw_request_body_recorded === false
  && redaction.raw_response_recorded === false, {
  status: redaction.status,
  redaction_passed: redaction.redaction_passed,
  api_key_recorded: redaction.api_key_recorded
});
addCheck(checks, "provider trace samples exist", exists("evidence", "beta-provider-canary-gemini", "provider_trace_samples.jsonl"), {});
addCheck(checks, "no local model execution", report.local_model_execution === false, {
  local_model_execution: report.local_model_execution
});
addCheck(checks, "no external side effects", report.external_side_effects === false, {
  external_side_effects: report.external_side_effects
});
addCheck(checks, "forbidden claims are not allowed", !(report.claims_allowed || []).some((claim) => forbiddenAllowedClaims.has(claim)), {
  claims_allowed: report.claims_allowed || []
});
addCheck(checks, "unresolved items match live provider block state", report.status === "pass"
  ? Array.isArray(unresolved) && unresolved.length === 0
  : Array.isArray(unresolved) && unresolved.length > 0, {
  status: report.status,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : "not_array"
});

const failedChecks = checks.filter((item) => item.status !== "pass");
const status = failedChecks.length === 0 ? (report.status === "pass" ? "pass" : "blocked") : "fail";
const gateReport = {
  status,
  stage: STAGE,
  api_lane: "native_gemini_api",
  can_enter_provider_verified_claim: false,
  can_enter_adapter_checked_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "Gemini live text canary and local dry-run checks passed, but stronger release claims remain blocked."
    : status === "blocked"
      ? "Gemini local dry-run checks passed; live provider canary remains explicitly blocked."
      : "One or more Gemini provider canary gate checks failed.",
  checks,
  claims_allowed: report.status === "pass"
    ? ["gemini-provider-canary-executed", "gemini-provider-trace-captured"]
    : [
        "gemini-request-mapping-dry-run-checked",
        "gemini-structured-output-dry-run-checked",
        "gemini-tool-calling-dry-run-checked",
        "gemini-safety-fixture-checked"
      ],
  claims_blocked: [
    "provider-verified",
    "adapter-checked",
    "release-gated",
    "production-ready",
    "live Gemini canary passed"
  ]
};

const md = `# Gemini Provider Canary Gate Report

Status: ${gateReport.status}

Stage: ${gateReport.stage}

- API lane: ${gateReport.api_lane}
- Can enter provider-verified claim: ${gateReport.can_enter_provider_verified_claim}
- Can enter adapter-checked claim: ${gateReport.can_enter_adapter_checked_claim}
- Can enter release-gated claim: ${gateReport.can_enter_release_gated_claim}
- Reason: ${gateReport.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed now: ${gateReport.claims_allowed.join(", ")}
- Blocked: ${gateReport.claims_blocked.join(", ")}
`;

writeJson(p("evals", "reports", "gemini_provider_canary_gate_report.json"), gateReport);
writeText(p("evals", "reports", "gemini_provider_canary_gate_report.md"), md);
writeJson(p("evidence", "beta-provider-canary-gemini", "gemini_provider_canary_gate_report.json"), gateReport);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "fail" ? 1 : 0);
