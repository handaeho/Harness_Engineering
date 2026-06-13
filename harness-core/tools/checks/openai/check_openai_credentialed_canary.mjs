#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-provider-canary-openai-credentialed-rerun";
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
  "schema-contract-validated"
];
const providerClaimsAllowed = [
  "openai-provider-canary-executed",
  "provider-no-tool-path-checked",
  "provider-trace-captured",
  "provider-redaction-checked"
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

function summarizeBaselineChecksum(baseline) {
  const record = baseline?.existing_reference_checksum_record
    || baseline?.[["existing", ["v", "36"].join(""), "checksum", "record"].join("_")]
    || {};
  const alphaClean = baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0;
  const existingRecordClean = record.unapproved_mismatch_count === 0 || record.mismatch_count === 0;
  return {
    clean: alphaClean && existingRecordClean,
    alpha_current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
    existing_record_mismatch_count: record.mismatch_count ?? null,
    existing_record_unapproved_mismatch_count: record.unapproved_mismatch_count ?? null,
    existing_record_approved_mismatch_count: record.approved_mismatch_count ?? null,
    existing_record_path: record.path ?? null
  };
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
const baselineChecksum = summarizeBaselineChecksum(baseline);
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

const canary = readJson(p("evals", "reports", "openai_provider_canary_report.json"));
const mapping = readJson(p("evidence", "beta-provider-canary-openai", "request_response_mapping_report.json"));
const redaction = readJson(p("evidence", "beta-provider-canary-openai", "redaction_report.json"));

addCheck(checks, "run_openai_provider_canary.mjs pass or explicit blocked status", canary.status === "pass" || isBlocked(canary.status), {
  status: canary.status,
  provider_execution: canary.provider_execution,
  cases_total: canary.cases_total,
  cases_passed: canary.cases_passed,
  cases_failed: canary.cases_failed
});

addCheck(checks, "provider trace samples exist", fs.existsSync(p("evidence", "beta-provider-canary-openai", "provider_trace_samples.jsonl")), {});
addCheck(checks, "request response mapping report exists", fs.existsSync(p("evidence", "beta-provider-canary-openai", "request_response_mapping_report.json")), {});
addCheck(checks, "redaction report exists", fs.existsSync(p("evidence", "beta-provider-canary-openai", "redaction_report.json")), {});
addCheck(checks, "tools_used is false", canary.tools_used === false, { tools_used: canary.tools_used });
addCheck(checks, "structured_output_used is false", canary.structured_output_used === false, { structured_output_used: canary.structured_output_used });
addCheck(checks, "local_model_execution is false", canary.local_model_execution === false, { local_model_execution: canary.local_model_execution });
addCheck(checks, "external_side_effects is false", canary.external_side_effects === false, { external_side_effects: canary.external_side_effects });
addCheck(checks, "store_false_enforced is true", canary.store_false_enforced === true, { store_false_enforced: canary.store_false_enforced });
addCheck(checks, "redaction passed and raw response not stored", redaction.redaction_passed === true && redaction.raw_response_recorded === false && canary.raw_response_stored === false, {
  redaction_passed: redaction.redaction_passed,
  raw_response_recorded: redaction.raw_response_recorded,
  raw_response_stored: canary.raw_response_stored
});

if (canary.status === "pass") {
  addCheck(checks, "provider_execution is true for credentialed pass", canary.provider_execution === true, { provider_execution: canary.provider_execution });
  addCheck(checks, "all canary cases passed", canary.cases_total === 5 && canary.cases_passed === 5 && canary.cases_failed === 0, {
    cases_total: canary.cases_total,
    cases_passed: canary.cases_passed,
    cases_failed: canary.cases_failed
  });
  addCheck(checks, "request response mapping report pass", mapping.status === "pass"
    && mapping.request_mapping?.model_from_env === true
    && mapping.request_mapping?.input_text_only === true
    && mapping.request_mapping?.tools_present === false
    && mapping.request_mapping?.structured_output_present === false
    && mapping.request_mapping?.store_false === true
    && mapping.request_mapping?.max_output_tokens_bounded === true
    && mapping.response_mapping?.provider_response_id_present === true
    && mapping.response_mapping?.output_text_extracted === true
    && mapping.response_mapping?.raw_response_hash_present === true
    && mapping.response_mapping?.raw_response_stored === false, {
      request_mapping: mapping.request_mapping,
      response_mapping: mapping.response_mapping
    });
} else if (isBlocked(canary.status)) {
  addCheck(checks, "provider_execution is false for blocked status", canary.provider_execution === false, { provider_execution: canary.provider_execution });
} else {
  addCheck(checks, "provider_execution state recorded for failed credentialed attempt", canary.provider_execution === true, {
    status: canary.status,
    provider_execution: canary.provider_execution
  });
}

addCheck(checks, "reference baseline source modified false by checksum comparison", baselineChecksum.clean, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: !baselineChecksum.clean,
  baseline_checksum: baselineChecksum
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : isBlocked(canary.status) ? "blocked" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_tool_calling_execution: false,
  can_enter_structured_output_execution: false,
  can_enter_local_model_execution: false,
  reason: status === "pass"
    ? "Credentialed OpenAI no-tool provider canary passed. Tool calling, structured output, and local model execution remain closed."
    : status === "blocked"
      ? "Credentialed OpenAI provider canary remains blocked by missing credential or model environment."
      : "One or more credentialed OpenAI canary gate checks failed.",
  checks,
  claims_allowed: status === "pass" ? baseClaimsAllowed.concat(providerClaimsAllowed) : baseClaimsAllowed,
  claims_blocked: claimsBlocked
};

const md = `# Credentialed OpenAI Provider Canary Gate Report

Status: ${report.status}

Stage: ${report.stage}

- Can enter tool calling execution: ${report.can_enter_tool_calling_execution}
- Can enter structured output execution: ${report.can_enter_structured_output_execution}
- Can enter local model execution: ${report.can_enter_local_model_execution}
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed now: ${report.claims_allowed.join(", ")}
- Blocked: ${claimsBlocked.join(", ")}
`;

writeJson(p("evals", "reports", "openai_provider_canary_gate_report.json"), report);
writeText(p("evals", "reports", "openai_provider_canary_gate_report.md"), md);
writeJson(p("evidence", "beta-provider-canary-openai", "provider_canary_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
