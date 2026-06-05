#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-tool-calling-canary-openai";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const baseClaimsAllowed = [
  "harness-designed",
  "static-structure-created",
  "baseline-snapshotted",
  "adapter-skeleton-created",
  "alpha-static-validated",
  "dependency-static-validated",
  "adapter-dry-run-checked",
  "beta-preflight-prepared",
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated",
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked",
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked"
];
const toolClaimsAllowed = [
  "openai-tool-calling-canary-executed",
  "provider-tool-call-path-checked",
  "tool-argument-schema-canary-validated",
  "mock-tool-output-reinjection-checked",
  "tool-approval-boundary-canary-checked",
  "tool-output-reclassification-checked",
  "tool-calling-trace-captured",
  "tool-calling-redaction-checked"
];
const claimsBlocked = [
  "adapter-checked",
  "provider-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "telemetry-connected",
  "production-ready",
  "production-monitored",
  "containment-verified",
  "replay-verified",
  "benchmark-backed",
  "provider-diverse",
  "integration-verified",
  "release-gated"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function isBlocked(status) {
  return status === "blocked_by_missing_credential" || status === "blocked_by_missing_model";
}

const checks = [];
const dependency = readJson(p("evidence", "beta-preflight", "dependency_validation_report.json"));
addCheck(checks, "validate_alpha.mjs pass", dependency.status === "pass" && dependency.fallback_used === false, {
  status: dependency.status,
  fallback_used: dependency.fallback_used
});

const scan = readJson(p("evidence", "alpha", "prohibited_claim_scan.json"));
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});

const baseline = readJson(p("evidence", "alpha", "baseline_comparison.json"));
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
  status: baseline.status,
  unresolved_items_count: baseline.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.alpha_snapshot.current_snapshot_mismatch_count
});

const adapterDryRun = readJson(p("evals", "reports", "adapter_conformance_dry_run.json"));
addCheck(checks, "run_adapter_conformance_dry_run.mjs pass", adapterDryRun.status === "pass", {
  status: adapterDryRun.status,
  cases_total: adapterDryRun.cases_total,
  cases_failed: adapterDryRun.cases_failed
});

const mockExecution = readJson(p("evals", "reports", "beta_mock_execution_report.json"));
addCheck(checks, "run_beta_mock_execution.mjs pass", mockExecution.status === "pass", {
  status: mockExecution.status,
  cases_total: mockExecution.cases_total,
  cases_failed: mockExecution.cases_failed
});

const providerGate = readJson(p("evidence", "beta-provider-canary-openai", "provider_canary_gate_report.json"));
addCheck(checks, "check_openai_credentialed_canary.mjs pass", providerGate.status === "pass", {
  status: providerGate.status
});

const structuredGate = readJson(p("evidence", "beta-structured-output-canary-openai", "structured_output_gate_report.json"));
addCheck(checks, "check_openai_structured_output_canary.mjs pass", structuredGate.status === "pass", {
  status: structuredGate.status
});

const tool = readJson(p("evals", "reports", "openai_tool_calling_canary_report.json"));
const mapping = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_call_mapping_report.json"));
const argument = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_argument_validation_report.json"));
const execution = readJson(p("evidence", "beta-tool-calling-canary-openai", "tool_execution_report.json"));
const approval = readJson(p("evidence", "beta-tool-calling-canary-openai", "approval_boundary_report.json"));
const redaction = readJson(p("evidence", "beta-tool-calling-canary-openai", "redaction_report.json"));

addCheck(checks, "run_openai_tool_calling_canary.mjs pass or explicit blocked status", tool.status === "pass" || isBlocked(tool.status), {
  status: tool.status,
  provider_execution: tool.provider_execution,
  cases_total: tool.cases_total,
  cases_passed: tool.cases_passed,
  cases_failed: tool.cases_failed
});
addCheck(checks, "tool calling trace samples exist", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "tool_calling_trace_samples.jsonl")), {});
addCheck(checks, "tool call mapping report exists", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "tool_call_mapping_report.json")), {});
addCheck(checks, "tool argument validation report exists", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "tool_argument_validation_report.json")), {});
addCheck(checks, "tool execution report exists", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "tool_execution_report.json")), {});
addCheck(checks, "approval boundary report exists", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "approval_boundary_report.json")), {});
addCheck(checks, "redaction report exists", fs.existsSync(p("evidence", "beta-tool-calling-canary-openai", "redaction_report.json")), {});
addCheck(checks, "built_in_tools_used is false", tool.built_in_tools_used === false, { built_in_tools_used: tool.built_in_tools_used });
addCheck(checks, "remote_mcp_used is false", tool.remote_mcp_used === false, { remote_mcp_used: tool.remote_mcp_used });
addCheck(checks, "local_model_execution is false", tool.local_model_execution === false, { local_model_execution: tool.local_model_execution });
addCheck(checks, "external_side_effects is false", tool.external_side_effects === false, { external_side_effects: tool.external_side_effects });
addCheck(checks, "store_false_enforced is true", tool.store_false_enforced === true, { store_false_enforced: tool.store_false_enforced });
addCheck(checks, "tool_argument_ajv_validation_used is true", tool.tool_argument_ajv_validation_used === true, { tool_argument_ajv_validation_used: tool.tool_argument_ajv_validation_used });
addCheck(checks, "mock_tools_only is true", tool.mock_tools_only === true, { mock_tools_only: tool.mock_tools_only });
addCheck(checks, "blocked_tools_executed is 0", tool.blocked_tools_executed === 0 && execution.blocked_tools_executed === 0 && approval.blocked_tools_executed === 0, {
  report_blocked_tools_executed: tool.blocked_tools_executed,
  execution_blocked_tools_executed: execution.blocked_tools_executed,
  approval_blocked_tools_executed: approval.blocked_tools_executed
});
addCheck(checks, "tool outputs reclassified untrusted", tool.tool_outputs_reclassified_untrusted >= tool.mock_tools_executed, {
  tool_outputs_reclassified_untrusted: tool.tool_outputs_reclassified_untrusted,
  mock_tools_executed: tool.mock_tools_executed
});
addCheck(checks, "redaction passed and raw response not stored", redaction.redaction_passed === true && redaction.raw_response_recorded === false && tool.raw_response_stored === false, {
  redaction_passed: redaction.redaction_passed,
  raw_response_recorded: redaction.raw_response_recorded,
  raw_response_stored: tool.raw_response_stored
});

if (tool.status === "pass") {
  addCheck(checks, "provider_execution is true for tool calling pass", tool.provider_execution === true, { provider_execution: tool.provider_execution });
  addCheck(checks, "tool_calling_used is true for pass", tool.tool_calling_used === true, { tool_calling_used: tool.tool_calling_used });
  addCheck(checks, "function_tools_used is true for pass", tool.function_tools_used === true, { function_tools_used: tool.function_tools_used });
  addCheck(checks, "all tool calling cases passed", tool.cases_total === 7 && tool.cases_passed === 7 && tool.cases_failed === 0, {
    cases_total: tool.cases_total,
    cases_passed: tool.cases_passed,
    cases_failed: tool.cases_failed
  });
  addCheck(checks, "all tool argument validations passed", tool.tool_argument_validations_total > 0 && tool.tool_argument_validations_failed === 0 && argument.status === "pass", {
    tool_argument_validations_total: tool.tool_argument_validations_total,
    tool_argument_validations_passed: tool.tool_argument_validations_passed,
    tool_argument_validations_failed: tool.tool_argument_validations_failed,
    argument_report_status: argument.status
  });
  addCheck(checks, "final responses received", tool.final_responses_received >= tool.expected_final_responses && execution.final_responses_received >= execution.expected_final_responses, {
    final_responses_received: tool.final_responses_received,
    expected_final_responses: tool.expected_final_responses
  });
  addCheck(checks, "request response mapping report pass", mapping.status === "pass"
    && mapping.request_mapping?.model_from_env === true
    && mapping.request_mapping?.tools_present === true
    && mapping.request_mapping?.function_tools_present === true
    && mapping.request_mapping?.built_in_tools_present === false
    && mapping.request_mapping?.structured_output_present === false
    && mapping.request_mapping?.store_false === true
    && mapping.response_mapping?.provider_response_id_present === true
    && mapping.response_mapping?.tool_calls_extracted === true
    && mapping.response_mapping?.final_response_text_extracted === true
    && mapping.response_mapping?.raw_response_hash_present === true
    && mapping.response_mapping?.raw_response_stored === false, {
      request_mapping: mapping.request_mapping,
      response_mapping: mapping.response_mapping
    });
} else if (isBlocked(tool.status)) {
  addCheck(checks, "provider_execution is false for blocked status", tool.provider_execution === false, { provider_execution: tool.provider_execution });
}

addCheck(checks, "reference baseline source modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_reference_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : isBlocked(tool.status) ? "blocked" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_local_model_execution: false,
  can_enter_replay_verification: false,
  can_enter_redteam_execution: false,
  reason: status === "pass"
    ? "OpenAI tool-calling canary passed. Local model execution, replay verification, and redteam execution remain closed."
    : status === "blocked"
      ? "OpenAI tool-calling canary is blocked by missing credential or model environment."
      : "One or more OpenAI tool-calling canary gate checks failed.",
  checks,
  claims_allowed: status === "pass" ? baseClaimsAllowed.concat(toolClaimsAllowed) : baseClaimsAllowed,
  claims_blocked: claimsBlocked
};

const md = `# OpenAI Tool Calling Canary Gate Report

Status: ${report.status}

Stage: ${report.stage}

- Can enter local model execution: ${report.can_enter_local_model_execution}
- Can enter replay verification: ${report.can_enter_replay_verification}
- Can enter redteam execution: ${report.can_enter_redteam_execution}
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed now: ${report.claims_allowed.join(", ")}
- Blocked: ${claimsBlocked.join(", ")}
`;

const top = p("evidence", "beta-tool-calling-canary-openai");
const attempt = p("evidence", "beta-tool-calling-canary-openai", "attempts", "001-tool-calling-canary");
writeJson(p("evals", "reports", "openai_tool_calling_gate_report.json"), report);
writeText(p("evals", "reports", "openai_tool_calling_gate_report.md"), md);
writeJson(path.join(top, "tool_calling_gate_report.json"), report);
writeJson(path.join(attempt, "tool_calling_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
