#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-gemini-structured-output-live-canary";
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

const top = p("evidence", "beta-structured-output-canary-gemini");
const report = readJson(path.join(top, "structured_output_canary_report.json"));
const mapping = readJson(path.join(top, "structured_output_mapping_report.json"));
const schema = readJson(path.join(top, "schema_validation_report.json"));
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
addCheck(checks, "trace samples exist", fs.existsSync(path.join(top, "structured_output_trace_samples.jsonl")), {});
addCheck(checks, "tools are not used", report.tools_used === false, { tools_used: report.tools_used });
addCheck(checks, "structured output surface used", report.structured_output_used === true, {
  structured_output_used: report.structured_output_used
});
addCheck(checks, "local model and external side effects are false", report.local_model_execution === false && report.external_side_effects === false, {
  local_model_execution: report.local_model_execution,
  external_side_effects: report.external_side_effects
});
addCheck(checks, "store false and raw response not stored", report.store_false_enforced === true && report.raw_response_stored === false, {
  store_false_enforced: report.store_false_enforced,
  raw_response_stored: report.raw_response_stored
});
addCheck(checks, "redaction passed", redaction.status === "pass"
  && redaction.redaction_passed === true
  && redaction.raw_request_body_recorded === false
  && redaction.raw_response_recorded === false
  && redaction.api_key_recorded === false, {
  redaction_status: redaction.status
});
addCheck(checks, "schema validation report exists and is coherent", schema.ajv_validation_used === true
  && schema.schema_validations_total === report.schema_validations_total
  && schema.schema_validations_failed === report.schema_validations_failed, {
  schema_validations_total: schema.schema_validations_total,
  schema_validations_failed: schema.schema_validations_failed
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
  addCheck(checks, "all schema validations passed", report.schema_validations_total > 0
    && report.schema_validations_passed === report.schema_validations_total
    && report.schema_validations_failed === 0, {
    schema_validations_total: report.schema_validations_total,
    schema_validations_passed: report.schema_validations_passed,
    schema_validations_failed: report.schema_validations_failed
  });
  addCheck(checks, "mapping report pass", mapping.status === "pass"
    && mapping.request_mapping?.structured_output_present === true
    && mapping.request_mapping?.tools_present === false
    && mapping.request_mapping?.store_false === true
    && mapping.response_mapping?.parsed_json_present === true
    && mapping.response_mapping?.raw_response_stored === false, {
    request_mapping: mapping.request_mapping,
    response_mapping: mapping.response_mapping
  });
} else {
  addCheck(checks, "provider execution false for blocked status", report.provider_execution === false, {
    provider_execution: report.provider_execution
  });
  addCheck(checks, "unresolved items record blocked state", Array.isArray(unresolved) && unresolved.length > 0, {
    unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : "not_array"
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
  can_enter_schema_output_verified_claim: false,
  can_enter_provider_verified_claim: false,
  can_enter_adapter_checked_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "Gemini structured output live canary passed, but strong promotion claims remain blocked."
    : status === "blocked"
      ? "Gemini structured output local checks passed; live execution is explicitly blocked."
      : "One or more Gemini structured output gate checks failed.",
  checks,
  claims_allowed: status === "pass"
    ? [
        "gemini-structured-output-live-canary-executed",
        "gemini-provider-structured-output-path-checked",
        "gemini-json-schema-response-live-validated",
        "gemini-structured-output-trace-captured"
      ]
    : [
        "gemini-structured-output-dry-run-checked",
        "gemini-json-schema-local-validation-checked"
      ],
  claims_blocked: claimsBlocked
};
const md = `# Gemini Structured Output Canary Gate

Status: ${gate.status}

Reason: ${gate.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "gemini_structured_output_gate_report.json"), gate);
writeText(p("evals", "reports", "gemini_structured_output_gate_report.md"), md);
writeJson(path.join(top, "structured_output_gate_report.json"), gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(status === "fail" ? 1 : 0);
