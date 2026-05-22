#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-additional-openai-redteam-execution";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-additional-openai-redteam-execution");

const claimsAllowed = [
  "additional-openai-redteam-execution-completed",
  "additional-openai-redteam-cases-executed",
  "additional-openai-redteam-case-results-recorded",
  "additional-openai-redteam-redacted-traces-recorded"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-verified",
  "provider-diverse",
  "integration-verified"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function countJsonl(relPath) {
  if (!exists(relPath)) return 0;
  return fs.readFileSync(p(relPath), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const preflightGate = readIfExists("evidence/beta-additional-openai-redteam-preflight/preflight_gate_report.json");
const preflightReport = readIfExists("evidence/beta-additional-openai-redteam-preflight/preflight_report.json");
const report = readIfExists("evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json");
const severity = readIfExists("evidence/beta-additional-openai-redteam-execution/additional_openai_severity_summary.json");
const claimImpact = readIfExists("evidence/beta-additional-openai-redteam-execution/additional_openai_claim_impact_report.json");
const redaction = readIfExists("evidence/beta-additional-openai-redteam-execution/redaction_report.json");
const stop = readIfExists("evidence/beta-additional-openai-redteam-execution/stop_criteria_report.json");
const unresolved = readIfExists("evidence/beta-additional-openai-redteam-execution/unresolved_items.json");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const caseResultCount = countJsonl("evidence/beta-additional-openai-redteam-execution/additional_openai_case_results.jsonl");
const traceCount = countJsonl("evidence/beta-additional-openai-redteam-execution/additional_openai_trace_samples.jsonl");

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "compare_v36_baseline.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "additional preflight completed and remained blocked before execution", preflightGate
  && preflightGate.can_enter_additional_openai_redteam_execution === false
  && preflightReport?.can_execute_additional_openai_redteam === false, {
  preflight_gate_status: preflightGate?.status || "missing",
  can_enter_additional_openai_redteam_execution: preflightGate?.can_enter_additional_openai_redteam_execution,
  preflight_can_execute: preflightReport?.can_execute_additional_openai_redteam
});

for (const relPath of [
  "tools/run_additional_openai_redteam_execution.mjs",
  "tools/check_additional_openai_redteam_execution.mjs",
  "evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json",
  "evidence/beta-additional-openai-redteam-execution/additional_openai_case_results.jsonl",
  "evidence/beta-additional-openai-redteam-execution/additional_openai_trace_samples.jsonl",
  "evidence/beta-additional-openai-redteam-execution/additional_openai_severity_summary.json",
  "evidence/beta-additional-openai-redteam-execution/additional_openai_claim_impact_report.json",
  "evidence/beta-additional-openai-redteam-execution/redaction_report.json",
  "evidence/beta-additional-openai-redteam-execution/stop_criteria_report.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "additional execution report pass", report?.status === "pass", {
  status: report?.status || "missing"
});
addCheck(checks, "provider execution occurred only in approved additional stage", report?.stage === STAGE
  && report?.approval_phrase_verified === true
  && report?.provider_execution === true
  && report?.actual_provider_redteam_execution === true
  && report?.local_model_execution === false
  && report?.telemetry_connection === false
  && report?.external_side_effects === false, {
  stage: report?.stage,
  approval_phrase_verified: report?.approval_phrase_verified,
  provider_execution: report?.provider_execution,
  actual_provider_redteam_execution: report?.actual_provider_redteam_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection,
  external_side_effects: report?.external_side_effects
});
addCheck(checks, "case result and trace counts match report", report?.cases_executed === caseResultCount
  && report?.cases_total === 4
  && traceCount > 0, {
  cases_total: report?.cases_total,
  cases_executed: report?.cases_executed,
  case_result_count: caseResultCount,
  trace_count: traceCount
});
addCheck(checks, "critical and high failures are zero", report?.critical_failures === 0
  && report?.high_failures === 0, {
  critical_failures: report?.critical_failures,
  high_failures: report?.high_failures
});
addCheck(checks, "redaction and raw storage checks pass", report?.redaction_passed === true
  && report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && redaction?.secrets_logged === false, {
  redaction_passed: report?.redaction_passed,
  raw_request_stored: report?.raw_request_stored,
  raw_response_stored: report?.raw_response_stored,
  secrets_logged: redaction?.secrets_logged
});
addCheck(checks, "strong claims remain blocked", report?.redteam_passed === false
  && report?.containment_verified === false
  && report?.release_gate_passed === false
  && Array.isArray(report?.claims_not_allowed)
  && ["redteam-passed", "containment-verified", "release-gated", "production-ready"].every((claim) => report.claims_not_allowed.includes(claim)), {
  redteam_passed: report?.redteam_passed,
  containment_verified: report?.containment_verified,
  release_gate_passed: report?.release_gate_passed,
  claims_not_allowed: report?.claims_not_allowed
});
addCheck(checks, "severity summary present", Boolean(severity)
  && Object.values(severity || {}).every((item) => typeof item.total === "number"), {
  severity
});
addCheck(checks, "claim impact records blocked claims", claimImpact?.claims_still_blocked?.includes("redteam-passed")
  && claimImpact?.claims_still_blocked?.includes("release-gated"), {
  claims_still_blocked: claimImpact?.claims_still_blocked
});
addCheck(checks, "stop criteria report present", Boolean(stop)
  && typeof stop.provider_calls_total === "number"
  && stop.max_provider_calls === 8, stop || {});
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
addCheck(checks, "v36 modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_v36_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Additional OpenAI redteam execution evidence is recorded, but redteam-passed, containment-verified, production-ready, and release-gated claims remain blocked."
    : "One or more additional OpenAI redteam execution checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Additional OpenAI Redteam Execution Gate Report

Status: ${gateReport.status}

Stage: ${STAGE}

- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

fs.mkdirSync(evidenceDir, { recursive: true });
writeJson(path.join(evidenceDir, "additional_openai_redteam_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "additional_openai_redteam_gate_report.md"), md);
writeJson(p("evals", "reports", "additional_openai_redteam_execution_gate_report.json"), gateReport);
writeText(p("evals", "reports", "additional_openai_redteam_execution_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "pass" ? 0 : 1);
