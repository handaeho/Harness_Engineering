#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-tool-calling-live-canary";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const acceptedBlocked = new Set([
  "blocked_by_missing_credential",
  "blocked_by_missing_model",
  "blocked_by_live_execution_not_enabled",
  "blocked_by_network_approval_missing"
]);
const claimsBlocked = [
  "provider-verified",
  "adapter-checked",
  "release-gated",
  "production-ready",
  "tool-call-verified",
  "schema-output-verified",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const top = p("evidence", "beta-tool-calling-canary-gemini");
const report = readJson(path.join(top, "tool_calling_canary_report.json"));
const mapping = readJson(path.join(top, "tool_call_mapping_report.json"));
const argument = readJson(path.join(top, "tool_argument_validation_report.json"));
const execution = readJson(path.join(top, "tool_execution_report.json"));
const approval = readJson(path.join(top, "approval_boundary_report.json"));
const redaction = readJson(path.join(top, "redaction_report.json"));
const unresolved = readJson(path.join(top, "unresolved_items.json"));
const checks = [];

addCheck(checks, "runner pass or explicit blocked status", report.status === "pass" || acceptedBlocked.has(report.status), {
  status: report.status,
  provider_execution: report.provider_execution,
  local_dry_run_status: report.local_dry_run_status
});
addCheck(checks, "local dry-run status pass", report.local_dry_run_status === "pass", {
  local_dry_run_status: report.local_dry_run_status
});
addCheck(checks, "trace samples exist", fs.existsSync(path.join(top, "tool_calling_trace_samples.jsonl")), {});
addCheck(checks, "tool calling surface used", report.tool_calling_used === true && report.function_tools_used === true, {
  tool_calling_used: report.tool_calling_used,
  function_tools_used: report.function_tools_used
});
addCheck(checks, "built-in tools remote MCP local model and external side effects are false", report.built_in_tools_used === false
  && report.remote_mcp_used === false
  && report.local_model_execution === false
  && report.external_side_effects === false, {
  built_in_tools_used: report.built_in_tools_used,
  remote_mcp_used: report.remote_mcp_used,
  local_model_execution: report.local_model_execution,
  external_side_effects: report.external_side_effects
});
addCheck(checks, "store false raw response not stored", report.store_false_enforced === true && report.raw_response_stored === false, {
  store_false_enforced: report.store_false_enforced,
  raw_response_stored: report.raw_response_stored
});
addCheck(checks, "mock tools only and blocked tools not executed", report.mock_tools_only === true
  && report.blocked_tools_executed === 0
  && execution.blocked_tools_executed === 0
  && approval.blocked_tools_executed === 0, {
  mock_tools_only: report.mock_tools_only,
  blocked_tools_executed: report.blocked_tools_executed
});
addCheck(checks, "redaction passed", redaction.status === "pass"
  && redaction.redaction_passed === true
  && redaction.raw_request_body_recorded === false
  && redaction.raw_response_recorded === false
  && redaction.api_key_recorded === false, {
  redaction_status: redaction.status
});
addCheck(checks, "argument validation report coherent", argument.ajv_validation_used === true
  && argument.tool_argument_validations_total === report.tool_argument_validations_total
  && argument.tool_argument_validations_failed === report.tool_argument_validations_failed, {
  tool_argument_validations_total: argument.tool_argument_validations_total,
  tool_argument_validations_failed: argument.tool_argument_validations_failed
});

if (report.status === "pass") {
  addCheck(checks, "provider execution true for pass", report.provider_execution === true, {
    provider_execution: report.provider_execution
  });
  addCheck(checks, "all live cases passed", report.live_cases_total > 0
    && report.live_cases_passed === report.live_cases_total
    && report.live_cases_failed === 0, {
    live_cases_total: report.live_cases_total,
    live_cases_passed: report.live_cases_passed,
    live_cases_failed: report.live_cases_failed
  });
  addCheck(checks, "tool argument validations passed", report.tool_argument_validations_total > 0
    && report.tool_argument_validations_failed === 0, {
    tool_argument_validations_total: report.tool_argument_validations_total,
    tool_argument_validations_failed: report.tool_argument_validations_failed
  });
  addCheck(checks, "final responses received", report.final_responses_received >= report.expected_final_responses
    && execution.final_responses_received >= execution.expected_final_responses, {
    final_responses_received: report.final_responses_received,
    expected_final_responses: report.expected_final_responses
  });
  addCheck(checks, "tool outputs reclassified untrusted", report.tool_outputs_reclassified_untrusted >= report.mock_tools_executed, {
    tool_outputs_reclassified_untrusted: report.tool_outputs_reclassified_untrusted,
    mock_tools_executed: report.mock_tools_executed
  });
  addCheck(checks, "thought signatures captured and reinjected without raw storage", report.thought_signatures_captured >= report.expected_final_responses
    && report.thought_signatures_reinjected >= report.expected_final_responses
    && redaction.raw_request_body_recorded === false
    && redaction.raw_response_recorded === false, {
    thought_signatures_captured: report.thought_signatures_captured,
    thought_signatures_reinjected: report.thought_signatures_reinjected,
    expected_final_responses: report.expected_final_responses,
    raw_request_body_recorded: redaction.raw_request_body_recorded,
    raw_response_recorded: redaction.raw_response_recorded
  });
  addCheck(checks, "mapping report pass", mapping.status === "pass"
    && mapping.request_mapping?.tools_present === true
    && mapping.request_mapping?.function_tools_present === true
    && mapping.request_mapping?.built_in_tools_present === false
    && mapping.request_mapping?.store_false === true
    && mapping.response_mapping?.tool_calls_extracted === true
    && mapping.response_mapping?.final_response_text_extracted === true
    && mapping.response_mapping?.raw_response_stored === false, {
    request_mapping: mapping.request_mapping,
    response_mapping: mapping.response_mapping
  });
} else if (acceptedBlocked.has(report.status)) {
  addCheck(checks, "provider execution false for blocked status", report.provider_execution === false, {
    provider_execution: report.provider_execution
  });
  addCheck(checks, "unresolved items record blocked state", Array.isArray(unresolved) && unresolved.length > 0, {
    unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : "not_array"
  });
} else {
  addCheck(checks, "provider execution state recorded for failed live run", typeof report.provider_execution === "boolean", {
    provider_execution: report.provider_execution,
    status: report.status
  });
  addCheck(checks, "failed live run records failures", Array.isArray(report.failures) && report.failures.length > 0, {
    failures_count: Array.isArray(report.failures) ? report.failures.length : "not_array"
  });
}

addCheck(checks, "forbidden strong claims are not allowed", !(report.claims_allowed || []).some((claim) => claimsBlocked.includes(claim)), {
  claims_allowed: report.claims_allowed || []
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : report.status === "pass" ? "pass" : "blocked";
const gate = {
  status,
  stage: STAGE,
  provider: "gemini",
  can_enter_tool_call_verified_claim: false,
  can_enter_provider_verified_claim: false,
  can_enter_adapter_checked_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "Gemini tool calling live canary passed, but strong promotion claims remain blocked."
    : status === "blocked"
      ? "Gemini tool calling local checks passed; live execution is explicitly blocked."
      : "One or more Gemini tool calling gate checks failed.",
  checks,
  claims_allowed: status === "pass"
    ? [
        "gemini-tool-calling-live-canary-executed",
        "gemini-provider-tool-call-path-checked",
        "gemini-tool-argument-schema-live-validated",
        "gemini-function-response-reinjection-live-checked",
        "gemini-tool-calling-trace-captured"
      ]
    : [
        "gemini-tool-calling-dry-run-checked",
        "gemini-tool-argument-schema-local-validation-checked",
        "gemini-function-response-reinjection-dry-run-checked"
      ],
  claims_blocked: claimsBlocked
};
const md = `# Gemini Tool Calling Canary Gate

Status: ${gate.status}

Reason: ${gate.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "gemini_tool_calling_gate_report.json"), gate);
writeText(p("evals", "reports", "gemini_tool_calling_gate_report.md"), md);
writeJson(path.join(top, "tool_calling_gate_report.json"), gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(status === "fail" ? 1 : 0);
