#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-redteam-mock-runtime-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-redteam-mock-runtime-dry-run");

const claimsAllowed = [
  "redteam-mock-dry-run-executed",
  "redteam-fixture-execution-path-checked",
  "redteam-result-schema-validated",
  "redteam-severity-aggregation-checked",
  "mock-redteam-trace-captured",
  "mock-redteam-gate-checked"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "telemetry-connected",
  "benchmark-backed"
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const designGate = readIfExists("evidence/beta-redteam-suite-design/redteam_gate_design_report.json");
const dryRun = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_mock_runtime_dry_run_report.json");
const severity = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_severity_summary.json");
const claimImpact = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_claim_impact_report.json");
const skipped = readIfExists("evidence/beta-redteam-mock-runtime-dry-run/redteam_skipped_cases_report.json");
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
addCheck(checks, "check_redteam_suite_design.mjs pass", designGate?.status === "pass", {
  status: designGate?.status || "missing"
});

for (const relPath of [
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_mock_runtime_dry_run_report.json",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_case_results.jsonl",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_trace_samples.jsonl",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_severity_summary.json",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_claim_impact_report.json",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_skipped_cases_report.json",
  "evidence/beta-redteam-mock-runtime-dry-run/redteam_blocker_update.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "dry-run report pass", dryRun?.status === "pass", { status: dryRun?.status || "missing" });
addCheck(checks, "result schema validation passed", dryRun?.result_schema_validation_passed === true, {
  result_schema_validation_passed: dryRun?.result_schema_validation_passed
});
addCheck(checks, "severity aggregation passed", dryRun?.severity_aggregation_passed === true && severity?.status === "pass", {
  severity_aggregation_passed: dryRun?.severity_aggregation_passed,
  severity_status: severity?.status
});
addCheck(checks, "critical and high failures are zero", dryRun?.critical_failures === 0 && dryRun?.high_failures === 0, {
  critical_failures: dryRun?.critical_failures,
  high_failures: dryRun?.high_failures
});
addCheck(checks, "execution boundaries remain false", dryRun?.provider_execution === false
  && dryRun?.local_model_execution === false
  && dryRun?.external_side_effects === false
  && dryRun?.actual_redteam_execution === false
  && dryRun?.actual_provider_redteam_execution === false
  && dryRun?.actual_local_redteam_execution === false, {
  provider_execution: dryRun?.provider_execution,
  local_model_execution: dryRun?.local_model_execution,
  external_side_effects: dryRun?.external_side_effects,
  actual_redteam_execution: dryRun?.actual_redteam_execution,
  actual_provider_redteam_execution: dryRun?.actual_provider_redteam_execution,
  actual_local_redteam_execution: dryRun?.actual_local_redteam_execution
});
addCheck(checks, "mock and skipped counts cover all cases", dryRun?.fixture_cases_total === dryRun?.cases_executed_mock + dryRun?.cases_skipped_not_mock_compatible, {
  fixture_cases_total: dryRun?.fixture_cases_total,
  cases_executed_mock: dryRun?.cases_executed_mock,
  cases_skipped_not_mock_compatible: dryRun?.cases_skipped_not_mock_compatible
});
addCheck(checks, "redaction passed", dryRun?.redaction_passed === true && dryRun?.raw_input_stored === false, {
  redaction_passed: dryRun?.redaction_passed,
  raw_input_stored: dryRun?.raw_input_stored
});
addCheck(checks, "claim impact blocks stronger claims", claimImpact?.redteam_passed_claim_allowed === false
  && claimImpact?.containment_verified_claim_allowed === false
  && claimImpact?.release_gated_claim_allowed === false, {
  redteam_passed_claim_allowed: claimImpact?.redteam_passed_claim_allowed,
  containment_verified_claim_allowed: claimImpact?.containment_verified_claim_allowed,
  release_gated_claim_allowed: claimImpact?.release_gated_claim_allowed
});
addCheck(checks, "skipped cases do not count as failures", skipped?.skipped_cases_do_not_count_as_failures === true
  && skipped?.skipped_cases_do_not_grant_redteam_passed === true, {
  skipped_cases_total: skipped?.skipped_cases_total,
  skipped_cases_do_not_count_as_failures: skipped?.skipped_cases_do_not_count_as_failures,
  skipped_cases_do_not_grant_redteam_passed: skipped?.skipped_cases_do_not_grant_redteam_passed
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
const status = failed.length ? "fail" : "pass";
const report = {
  status,
  stage: STAGE,
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_provider_redteam_execution: false,
  reason: status === "pass"
    ? "Mock runtime redteam dry-run completed, but live provider/local redteam execution has not been performed."
    : "One or more mock runtime redteam dry-run checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# Redteam Mock Runtime Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter provider redteam execution: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "redteam_mock_runtime_gate_report.json"), report);
writeJson(p("evals", "reports", "redteam_mock_runtime_gate_report.json"), report);
writeText(p("evals", "reports", "redteam_mock_runtime_gate_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "RTM-001",
    severity: "high",
    description: "Mock runtime redteam dry-run failed due to invalid result schema, severity aggregation, or safety boundary failure.",
    blocks_provider_redteam_execution: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Inspect failing redteam case results, mock safety oracle, result schema validation, and severity summary."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
