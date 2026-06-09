#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-openai-redteam-limited-execution-preflight-and-approval";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-openai-redteam-limited-execution-preflight");

const claimsAllowed = [
  "openai-redteam-limited-execution-preflight-completed",
  "openai-redteam-approval-packet-generated",
  "openai-redteam-credential-readiness-checked",
  "openai-redteam-command-plan-drafted",
  "openai-redteam-execution-preconditions-validated"
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
const acceptablePreflightStatus = new Set([
  "ready_but_blocked_by_missing_explicit_approval",
  "blocked_by_missing_credential",
  "blocked_by_missing_model"
]);

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

function readJsonlCount(relPath) {
  if (!exists(relPath)) return 0;
  return fs.readFileSync(p(relPath), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const planGate = readIfExists("evidence/beta-openai-redteam-limited-execution-plan/openai_redteam_limited_execution_plan_gate_report.json");
const preflight = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/preflight_report.json");
const approval = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/approval_readiness_report.json");
const credential = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/credential_readiness_report.json");
const guard = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/execution_guard_readiness.json");
const cost = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/cost_bound_readiness.json");
const stop = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/stop_criteria_readiness.json");
const redactionTrace = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/redaction_trace_readiness.json");
const approvalGate = exists("release/gates/openai/openai_redteam_limited_execution_approval_gate.yaml")
  ? parseYamlFile(p("release", "openai_redteam_limited_execution_approval_gate.yaml")).approval_gate
  : null;
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const selectedCasesTotal = readJsonlCount("evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl");

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_openai_redteam_limited_execution_plan.mjs pass", planGate?.status === "pass", {
  status: planGate?.status || "missing"
});

for (const relPath of [
  "evals/fixtures/redteam_openai_limited/openai_limited_case_subset.jsonl",
  "evals/fixtures/redteam_openai_limited/excluded_cases_report.jsonl",
  "security/redteam/openai_limited_execution_policy.yaml",
  "security/redteam/openai_redteam_cost_bound_policy.yaml",
  "security/redteam/openai_redteam_stop_criteria.yaml",
  "security/redteam/openai_redteam_redaction_policy.yaml",
  "security/redteam/openai_redteam_trace_policy.yaml",
  "security/redteam/openai_redteam_preflight_policy.yaml",
  "security/redteam/openai_redteam_credential_policy.yaml",
  "security/redteam/openai_redteam_execution_approval.schema.json",
  "release/gates/openai/openai_redteam_limited_execution_approval_gate.yaml",
  "release/approvals/openai/openai_redteam_limited_execution_approval_request.md",
  "release/commands/openai/openai_redteam_limited_execution_command_plan.yaml",
  "evidence/beta-openai-redteam-limited-execution-preflight/preflight_report.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/approval_readiness_report.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/credential_readiness_report.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/selected_case_subset_snapshot.jsonl",
  "evidence/beta-openai-redteam-limited-execution-preflight/execution_guard_readiness.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/cost_bound_readiness.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/stop_criteria_readiness.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/redaction_trace_readiness.json",
  "evidence/beta-openai-redteam-limited-execution-preflight/command_plan_snapshot.yaml"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "preflight status acceptable", acceptablePreflightStatus.has(preflight?.status), {
  status: preflight?.status || "missing"
});
addCheck(checks, "selected case subset valid", selectedCasesTotal <= 12 && preflight?.selected_cases_total <= 12, {
  selected_cases_total: preflight?.selected_cases_total,
  fixture_count: selectedCasesTotal
});
addCheck(checks, "guard readiness pass", guard?.status === "pass", guard || {});
addCheck(checks, "cost bound readiness pass", cost?.status === "pass", cost || {});
addCheck(checks, "stop criteria readiness pass", stop?.status === "pass", stop || {});
addCheck(checks, "redaction and trace readiness pass", redactionTrace?.status === "pass", redactionTrace || {});
addCheck(checks, "approval gate remains closed", approvalGate?.explicit_user_approval_present === false
  && approvalGate?.can_execute_provider_redteam === false
  && approval?.explicit_user_approval_present === false
  && approval?.can_execute_provider_redteam === false, {
  explicit_user_approval_present: approvalGate?.explicit_user_approval_present,
  can_execute_provider_redteam: approvalGate?.can_execute_provider_redteam
});
addCheck(checks, "no execution performed", preflight?.provider_execution === false
  && preflight?.actual_redteam_execution === false
  && preflight?.local_model_execution === false
  && preflight?.external_side_effects === false, {
  provider_execution: preflight?.provider_execution,
  actual_redteam_execution: preflight?.actual_redteam_execution,
  local_model_execution: preflight?.local_model_execution,
  external_side_effects: preflight?.external_side_effects
});
addCheck(checks, "credential presence checked without secrets", credential?.credential_presence_checked === true
  && credential?.secrets_logged === false
  && !Object.prototype.hasOwnProperty.call(credential || {}, "openai_api_key_value")
  && !Object.prototype.hasOwnProperty.call(credential || {}, "openai_model_value"), {
  credential_presence_checked: credential?.credential_presence_checked,
  openai_api_key_present: credential?.openai_api_key_present,
  openai_model_present: credential?.openai_model_present,
  secrets_logged: credential?.secrets_logged
});
addCheck(checks, "raw request and response not stored", preflight?.raw_request_stored === false
  && preflight?.raw_response_stored === false
  && credential?.raw_request_stored === false
  && credential?.raw_response_stored === false, {
  raw_request_stored: preflight?.raw_request_stored,
  raw_response_stored: preflight?.raw_response_stored
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

const failed = checks.filter((item) => item.status !== "pass");
let status = failed.length ? "fail" : "pass";
if (!failed.length && preflight?.status !== "ready_but_blocked_by_missing_explicit_approval") {
  status = "blocked";
}
const report = {
  status,
  stage: STAGE,
  can_enter_provider_redteam_execution: false,
  can_enter_redteam_passed_claim: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "fail"
    ? "One or more OpenAI limited redteam preflight checks failed."
    : status === "blocked"
      ? "Execution preflight artifacts are complete, but credential or model readiness is blocked before provider redteam execution."
      : "Execution preflight is complete, but explicit user approval is required before provider redteam execution.",
  checks,
  claims_allowed: status === "fail" ? [] : claimsAllowed,
  claims_blocked: claimsBlocked
};
const md = `# OpenAI Redteam Limited Execution Preflight Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter provider redteam execution: false
- Can enter redteam-passed claim: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "openai_redteam_limited_execution_preflight_gate_report.json"), report);
writeText(p("evals", "reports", "openai_redteam_limited_execution_preflight_gate_report.md"), md);
writeJson(path.join(evidenceDir, "preflight_gate_report.json"), report);
writeText(path.join(evidenceDir, "preflight_gate_report.md"), md);

if (status === "fail") {
  writeJson(path.join(evidenceDir, "unresolved_items.json"), [
    {
      id: "ORPF-003",
      severity: "high",
      description: "OpenAI limited redteam preflight failed because required plan, guard, policy, or selected case artifacts are missing or invalid.",
      blocks_provider_redteam_execution: true,
      owner: "agent",
      recommended_next_action: "Regenerate missing preflight artifacts and rerun check_openai_redteam_limited_execution_preflight.mjs."
    }
  ]);
}

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
