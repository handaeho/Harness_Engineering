#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-structured-output-canary-openai";
const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

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
  "provider-redaction-checked"
];
const structuredClaimsAllowed = [
  "openai-structured-output-canary-executed",
  "provider-structured-output-path-checked",
  "json-schema-response-canary-validated",
  "structured-output-trace-captured",
  "structured-output-redaction-checked"
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
addCheck(checks, "compare_v36_baseline.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
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

const structured = readJson(p("evals", "reports", "openai_structured_output_canary_report.json"));
const mapping = readJson(p("evidence", "beta-structured-output-canary-openai", "structured_output_mapping_report.json"));
const schema = readJson(p("evidence", "beta-structured-output-canary-openai", "schema_validation_report.json"));
const redaction = readJson(p("evidence", "beta-structured-output-canary-openai", "redaction_report.json"));

addCheck(checks, "run_openai_structured_output_canary.mjs pass or explicit blocked status", structured.status === "pass" || isBlocked(structured.status), {
  status: structured.status,
  provider_execution: structured.provider_execution,
  cases_total: structured.cases_total,
  cases_passed: structured.cases_passed,
  cases_failed: structured.cases_failed
});
addCheck(checks, "structured output trace samples exist", fs.existsSync(p("evidence", "beta-structured-output-canary-openai", "structured_output_trace_samples.jsonl")), {});
addCheck(checks, "structured output mapping report exists", fs.existsSync(p("evidence", "beta-structured-output-canary-openai", "structured_output_mapping_report.json")), {});
addCheck(checks, "schema validation report exists", fs.existsSync(p("evidence", "beta-structured-output-canary-openai", "schema_validation_report.json")), {});
addCheck(checks, "redaction report exists", fs.existsSync(p("evidence", "beta-structured-output-canary-openai", "redaction_report.json")), {});
addCheck(checks, "tools_used is false", structured.tools_used === false, { tools_used: structured.tools_used });
addCheck(checks, "local_model_execution is false", structured.local_model_execution === false, { local_model_execution: structured.local_model_execution });
addCheck(checks, "external_side_effects is false", structured.external_side_effects === false, { external_side_effects: structured.external_side_effects });
addCheck(checks, "store_false_enforced is true", structured.store_false_enforced === true, { store_false_enforced: structured.store_false_enforced });
addCheck(checks, "strict_json_schema_used is true", structured.strict_json_schema_used === true, { strict_json_schema_used: structured.strict_json_schema_used });
addCheck(checks, "ajv_validation_used is true", structured.ajv_validation_used === true, { ajv_validation_used: structured.ajv_validation_used });
addCheck(checks, "redaction passed and raw response not stored", redaction.redaction_passed === true && redaction.raw_response_recorded === false && structured.raw_response_stored === false, {
  redaction_passed: redaction.redaction_passed,
  raw_response_recorded: redaction.raw_response_recorded,
  raw_response_stored: structured.raw_response_stored
});

if (structured.status === "pass") {
  addCheck(checks, "provider_execution is true for structured output pass", structured.provider_execution === true, { provider_execution: structured.provider_execution });
  addCheck(checks, "structured_output_used is true for pass", structured.structured_output_used === true, { structured_output_used: structured.structured_output_used });
  addCheck(checks, "all structured output cases passed", structured.cases_total === 5 && structured.cases_passed === 5 && structured.cases_failed === 0, {
    cases_total: structured.cases_total,
    cases_passed: structured.cases_passed,
    cases_failed: structured.cases_failed
  });
  addCheck(checks, "all Ajv schema validations passed", structured.schema_validations_total === 5 && structured.schema_validations_passed === 5 && structured.schema_validations_failed === 0 && schema.status === "pass", {
    schema_validations_total: structured.schema_validations_total,
    schema_validations_passed: structured.schema_validations_passed,
    schema_validations_failed: structured.schema_validations_failed,
    schema_report_status: schema.status
  });
  addCheck(checks, "request response mapping report pass", mapping.status === "pass"
    && mapping.request_mapping?.model_from_env === true
    && mapping.request_mapping?.input_text_only === true
    && mapping.request_mapping?.tools_present === false
    && mapping.request_mapping?.structured_output_present === true
    && mapping.request_mapping?.store_false === true
    && mapping.request_mapping?.strict_json_schema === true
    && mapping.request_mapping?.max_output_tokens_bounded === true
    && mapping.response_mapping?.provider_response_id_present === true
    && mapping.response_mapping?.output_text_extracted === true
    && mapping.response_mapping?.parsed_json_present === true
    && mapping.response_mapping?.raw_response_hash_present === true
    && mapping.response_mapping?.raw_response_stored === false, {
      request_mapping: mapping.request_mapping,
      response_mapping: mapping.response_mapping
    });
} else if (isBlocked(structured.status)) {
  addCheck(checks, "provider_execution is false for blocked status", structured.provider_execution === false, { provider_execution: structured.provider_execution });
}

addCheck(checks, "v36 modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_v36_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : isBlocked(structured.status) ? "blocked" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_tool_calling_execution: false,
  can_enter_local_model_execution: false,
  can_enter_replay_verification: false,
  reason: status === "pass"
    ? "OpenAI structured output canary passed. Tool calling, local model execution, and replay verification remain closed."
    : status === "blocked"
      ? "OpenAI structured output canary is blocked by missing credential or model environment."
      : "One or more OpenAI structured output canary gate checks failed.",
  checks,
  claims_allowed: status === "pass" ? baseClaimsAllowed.concat(structuredClaimsAllowed) : baseClaimsAllowed,
  claims_blocked: claimsBlocked
};

const md = `# OpenAI Structured Output Canary Gate Report

Status: ${report.status}

Stage: ${report.stage}

- Can enter tool calling execution: ${report.can_enter_tool_calling_execution}
- Can enter local model execution: ${report.can_enter_local_model_execution}
- Can enter replay verification: ${report.can_enter_replay_verification}
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed now: ${report.claims_allowed.join(", ")}
- Blocked: ${claimsBlocked.join(", ")}
`;

const top = p("evidence", "beta-structured-output-canary-openai");
const attempt = p("evidence", "beta-structured-output-canary-openai", "attempts", "001-structured-output-canary");
writeJson(p("evals", "reports", "openai_structured_output_gate_report.json"), report);
writeText(p("evals", "reports", "openai_structured_output_gate_report.md"), md);
writeJson(path.join(top, "structured_output_gate_report.json"), report);
writeJson(path.join(attempt, "structured_output_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
