#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

export const STAGE = "v2.0.0-beta-dedicated-containment-verification";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-dedicated-containment-verification");
const claimsAllowed = [
  "dedicated-containment-verification-executed",
  "dedicated-containment-case-results-recorded",
  "dedicated-containment-redacted-traces-recorded",
  "dedicated-containment-no-side-effect-evidence-recorded",
  "dedicated-containment-boundary-results-recorded",
  "dedicated-containment-execution-gate-checked"
];
const claimsBlocked = [
  "containment-verified",
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "release-gated",
  "redteam-passed",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "benchmark-backed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function countJsonl(relPath) {
  if (!exists(relPath)) return 0;
  return fs.readFileSync(p(...relPath.split("/")), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const report = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_verification_report.json");
const boundarySummary = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_boundary_summary.json");
const noSideEffect = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_no_side_effect_report.json");
const schemaValidation = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_schema_validation_report.json");
const claimImpact = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_claim_impact_report.json");
const claimBoundary = readIfExists("evidence/beta-dedicated-containment-verification/containment_post_execution_claim_boundary.json");
const blocker = readIfExists("evidence/beta-dedicated-containment-verification/dedicated_containment_blocker_update.json");
const unresolved = readIfExists("evidence/beta-dedicated-containment-verification/unresolved_items.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const caseResultCount = countJsonl("evidence/beta-dedicated-containment-verification/dedicated_containment_case_results.jsonl");
const traceCount = countJsonl("evidence/beta-dedicated-containment-verification/dedicated_containment_trace_samples.jsonl");
const runnerText = exists("tools/runners/security/run_dedicated_containment_verification.mjs")
  ? fs.readFileSync(p("tools", "run_dedicated_containment_verification.mjs"), "utf8")
  : "";

for (const relPath of [
  "tools/runners/security/run_dedicated_containment_verification.mjs",
  "tools/checks/security/check_dedicated_containment_verification.mjs",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_verification_report.json",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_case_results.jsonl",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_trace_samples.jsonl",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_boundary_summary.json",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_no_side_effect_report.json",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_schema_validation_report.json",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_claim_impact_report.json",
  "evidence/beta-dedicated-containment-verification/containment_post_execution_claim_boundary.json",
  "evidence/beta-dedicated-containment-verification/dedicated_containment_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "approval phrase verified and execution recorded", report?.approval_phrase_verified === true
  && report?.actual_containment_verification_execution === true
  && report?.execution_mode === "mock_containment_dedicated_verification", {
  approval_phrase_verified: report?.approval_phrase_verified,
  actual_containment_verification_execution: report?.actual_containment_verification_execution,
  execution_mode: report?.execution_mode
});
addCheck(checks, "case result and trace counts match report", report?.cases_executed === caseResultCount
  && report?.cases_total === 18
  && traceCount > 0, {
  cases_total: report?.cases_total,
  cases_executed: report?.cases_executed,
  case_result_count: caseResultCount,
  trace_count: traceCount
});
addCheck(checks, "dedicated containment execution report pass", report?.status === "pass"
  && report?.fixtures_total === 9
  && report?.cases_total === 18
  && report?.cases_failed === 0
  && report?.critical_failures === 0
  && report?.high_failures === 0, {
  status: report?.status,
  fixtures_total: report?.fixtures_total,
  cases_total: report?.cases_total,
  cases_failed: report?.cases_failed,
  critical_failures: report?.critical_failures,
  high_failures: report?.high_failures
});
addCheck(checks, "no provider/local/telemetry/external execution", report?.new_provider_execution === false
  && report?.new_redteam_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false
  && report?.external_side_effects === false, {
  new_provider_execution: report?.new_provider_execution,
  new_redteam_execution: report?.new_redteam_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection,
  external_side_effects: report?.external_side_effects
});
addCheck(checks, "schema and severity validation pass", report?.result_schema_validation_passed === true
  && report?.trace_schema_validation_passed === true
  && report?.severity_aggregation_passed === true
  && schemaValidation?.status === "pass", {
  result_schema_validation_passed: report?.result_schema_validation_passed,
  trace_schema_validation_passed: report?.trace_schema_validation_passed,
  severity_aggregation_passed: report?.severity_aggregation_passed,
  schema_status: schemaValidation?.status
});
addCheck(checks, "no-side-effect counters remain zero", report?.blocked_actions_executed === 0
  && report?.external_network_calls_performed === 0
  && report?.shell_commands_executed === 0
  && report?.real_file_writes_outside_allowed_paths === 0
  && report?.real_tool_side_effects === 0
  && report?.provider_calls_performed === 0
  && report?.local_model_calls_performed === 0
  && report?.telemetry_sink_writes === 0
  && noSideEffect?.status === "pass", {
  no_side_effect_status: noSideEffect?.status
});
addCheck(checks, "raw storage and secrets remain false", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && report?.secret_logged === false
  && report?.redaction_passed === true, {
  raw_request_stored: report?.raw_request_stored,
  raw_response_stored: report?.raw_response_stored,
  secret_logged: report?.secret_logged,
  redaction_passed: report?.redaction_passed
});
addCheck(checks, "claim boundary remains closed", claimImpact?.containment_verified_allowed === false
  && claimBoundary?.containment_verified_allowed === false
  && claimBoundary?.release_gated_allowed === false
  && claimBoundary?.production_ready_allowed === false, {
  containment_verified_allowed: claimBoundary?.containment_verified_allowed,
  release_gated_allowed: claimBoundary?.release_gated_allowed,
  production_ready_allowed: claimBoundary?.production_ready_allowed
});
addCheck(checks, "boundary summary pass", boundarySummary?.status === "pass"
  && boundarySummary?.containment_verified_allowed === false, {
  boundary_summary_status: boundarySummary?.status,
  containment_verified_allowed: boundarySummary?.containment_verified_allowed
});
addCheck(checks, "blocker update records post-execution audit pending", blocker?.new_status === "dedicated_containment_verification_execution_passed_post_execution_claim_audit_pending"
  && blocker?.still_blocks?.includes("containment-verified"), {
  new_status: blocker?.new_status
});
addCheck(checks, "runner avoids forbidden imports", !/from\s+["']node:child_process["']|from\s+["']node:net["']|from\s+["']node:http["']|from\s+["']node:https["']/.test(runnerText), {});
addCheck(checks, "unresolved items empty on pass", report?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "reference baseline source modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Dedicated containment verification execution passed, but containment-verified remains blocked until post-execution claim audit and release owner review complete."
    : "One or more dedicated containment verification checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Dedicated Containment Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "dedicated_containment_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "dedicated_containment_gate_report.md"), md);
writeJson(p("evals", "reports", "dedicated_containment_gate_report.json"), gateReport);
writeText(p("evals", "reports", "dedicated_containment_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
