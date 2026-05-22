#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-execution-readiness-dashboard-and-blocker-resolution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-execution-readiness-dashboard");

const claimsAllowed = [
  "execution-readiness-dashboard-drafted",
  "blocker-resolution-plan-drafted",
  "approval-requirements-indexed",
  "environment-requirements-indexed",
  "command-plans-indexed",
  "claim-impact-matrix-drafted",
  "path-portability-audited"
];
const claimsBlocked = [
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified",
  "release-gated",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
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
const openaiPreflightGate = readIfExists("evidence/beta-openai-redteam-limited-execution-preflight/preflight_gate_report.json");
const telemetryPreflightGate = readIfExists("evidence/beta-production-telemetry-connection-preflight/preflight_gate_report.json");
const releaseGateDryRun = readIfExists("evidence/beta-release-gate-dry-run/release_gate_dry_run_gate_report.json");
const dashboard = readIfExists("evidence/beta-execution-readiness-dashboard/execution_readiness_dashboard.json");
const blockerPlan = readIfExists("evidence/beta-execution-readiness-dashboard/blocker_resolution_plan.json");
const approvalIndex = readIfExists("evidence/beta-execution-readiness-dashboard/approval_phrase_index.json");
const envIndex = readIfExists("evidence/beta-execution-readiness-dashboard/environment_requirement_index.json");
const commandIndex = readIfExists("evidence/beta-execution-readiness-dashboard/command_plan_index.json");
const claimImpact = readIfExists("evidence/beta-execution-readiness-dashboard/claim_impact_matrix.json");
const portability = readIfExists("evidence/beta-execution-readiness-dashboard/path_portability_audit.json");
const blockerAudit = readIfExists("evals/reports/blocker_resolution_plan_report.json");
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
addCheck(checks, "check_openai_redteam_limited_execution_preflight.mjs blocked/pass with no execution", ["blocked", "pass"].includes(openaiPreflightGate?.status)
  && openaiPreflightGate?.can_enter_provider_redteam_execution === false, {
  status: openaiPreflightGate?.status || "missing",
  can_enter_provider_redteam_execution: openaiPreflightGate?.can_enter_provider_redteam_execution
});
addCheck(checks, "check_production_telemetry_connection_preflight.mjs blocked/pass with no connection", ["blocked", "pass"].includes(telemetryPreflightGate?.status)
  && telemetryPreflightGate?.can_enter_telemetry_connection === false, {
  status: telemetryPreflightGate?.status || "missing",
  can_enter_telemetry_connection: telemetryPreflightGate?.can_enter_telemetry_connection
});
addCheck(checks, "check_release_gate_dry_run.mjs pass", releaseGateDryRun?.status === "pass", {
  status: releaseGateDryRun?.status || "missing"
});

for (const relPath of [
  "release/beta_execution_readiness_dashboard_scope.yaml",
  "release/execution_readiness_gate.yaml",
  "release/next_execution_decision_matrix.yaml",
  "release/blocked_execution_lanes.yaml",
  "release/approval_phrase_index.yaml",
  "release/environment_requirement_index.yaml",
  "release/command_plan_index.yaml",
  "release/claim_impact_matrix.yaml",
  "evidence/beta-execution-readiness-dashboard/execution_readiness_dashboard.json",
  "evidence/beta-execution-readiness-dashboard/blocked_execution_lanes.json",
  "evidence/beta-execution-readiness-dashboard/blocker_resolution_plan.json",
  "evidence/beta-execution-readiness-dashboard/approval_phrase_index.json",
  "evidence/beta-execution-readiness-dashboard/environment_requirement_index.json",
  "evidence/beta-execution-readiness-dashboard/command_plan_index.json",
  "evidence/beta-execution-readiness-dashboard/claim_impact_matrix.json",
  "evidence/beta-execution-readiness-dashboard/path_portability_audit.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "dashboard blocks all execution lanes", dashboard?.new_provider_execution === false
  && dashboard?.new_local_model_execution === false
  && dashboard?.new_telemetry_connection === false
  && dashboard?.local_endpoint_probe === false
  && Object.values(dashboard?.lanes || {}).every((lane) => lane.can_execute_now === false), {
  new_provider_execution: dashboard?.new_provider_execution,
  new_local_model_execution: dashboard?.new_local_model_execution,
  new_telemetry_connection: dashboard?.new_telemetry_connection,
  local_endpoint_probe: dashboard?.local_endpoint_probe
});
const openaiLane = dashboard?.lanes?.openai_limited_redteam_execution;
const openaiCommandPlan = commandIndex?.command_plans?.find((item) => item.lane === "openai_limited_redteam_execution");
addCheck(checks, "OpenAI redteam lane approval-blocked with operator credential mode", openaiLane?.status === "approval_blocked_operator_credentials_available"
  && openaiLane?.blocked_by?.length === 1
  && openaiLane.blocked_by.includes("missing_explicit_user_approval")
  && openaiLane?.credential_status?.agent_env_credential_present === false
  && openaiLane?.credential_status?.operator_powershell_credential_available === true
  && openaiLane?.credential_status?.credential_blocker_type === "execution_environment_dependent"
  && openaiLane?.operator_execution_mode?.supported === true
  && openaiLane?.operator_execution_mode?.shell === "PowerShell"
  && openaiLane?.operator_execution_mode?.must_verify_env_at_execution_time === true
  && openaiLane?.can_execute_now === false
  && openaiLane?.can_execute_in_operator_shell_after_approval === true, {
  status: openaiLane?.status,
  blocked_by: openaiLane?.blocked_by,
  credential_status: openaiLane?.credential_status,
  operator_execution_mode: openaiLane?.operator_execution_mode,
  can_execute_in_operator_shell_after_approval: openaiLane?.can_execute_in_operator_shell_after_approval
});
addCheck(checks, "OpenAI credential missing is not primary readiness blocker", !openaiLane?.blocked_by?.includes("missing_openai_credentials_in_agent_environment"), {
  blocked_by: openaiLane?.blocked_by
});
addCheck(checks, "blocker resolution plan valid", Array.isArray(blockerPlan)
  && blockerPlan.length >= 5
  && blockerAudit?.status === "pass", {
  blocker_count: blockerPlan?.length,
  audit_status: blockerAudit?.status
});
addCheck(checks, "approval phrase index valid", approvalIndex?.approval_phrases?.length === 2, {
  approval_phrases: approvalIndex?.approval_phrases?.length
});
addCheck(checks, "environment requirement index valid", Object.keys(envIndex?.lanes || {}).length >= 5, {
  lanes: Object.keys(envIndex?.lanes || {}).length
});
addCheck(checks, "OpenAI environment requirement index uses operator PowerShell availability", envIndex?.lanes?.openai_limited_redteam_execution?.agent_env_present === false
  && envIndex?.lanes?.openai_limited_redteam_execution?.operator_powershell_available === true
  && envIndex?.lanes?.openai_limited_redteam_execution?.must_verify_at_execution_time === true
  && envIndex?.lanes?.openai_limited_redteam_execution?.secret_values_logged === false, {
  openai_environment_requirements: envIndex?.lanes?.openai_limited_redteam_execution
});
addCheck(checks, "command plan index valid", commandIndex?.command_plans?.length >= 3
  && commandIndex.command_plans.every((item) => item.currently_executable === false), {
  command_plans: commandIndex?.command_plans?.length
});
addCheck(checks, "OpenAI command plan indexed for operator PowerShell but not executable yet", openaiCommandPlan?.currently_executable_in_agent_env === false
  && openaiCommandPlan?.operator_powershell_execution_supported === true
  && openaiCommandPlan?.requires_exact_approval_phrase === true
  && openaiCommandPlan?.currently_executable === false, {
  openai_command_plan: openaiCommandPlan
});
addCheck(checks, "claim impact matrix valid", claimImpact?.claim_impacts?.length >= 3, {
  claim_impacts: claimImpact?.claim_impacts?.length
});
addCheck(checks, "path portability audit pass", portability?.status === "pass"
  && portability?.disallowed_absolute_paths?.length === 0
  && portability?.dist_modified === false, {
  status: portability?.status,
  disallowed_absolute_paths: portability?.disallowed_absolute_paths?.length,
  dist_modified: portability?.dist_modified
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
  can_enter_openai_redteam_execution: false,
  can_enter_telemetry_connection: false,
  can_enter_local_no_tool_canary: false,
  can_enter_release_gate: false,
  reason: status === "pass"
    ? "Execution readiness dashboard is drafted, but execution lanes remain blocked. OpenAI redteam is approval-blocked; credentials can be supplied through operator PowerShell and must be verified at execution time."
    : "One or more execution readiness dashboard checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Execution Readiness Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter OpenAI redteam execution: false
- Can enter telemetry connection: false
- Can enter local no-tool canary: false
- Can enter release gate: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "execution_readiness_gate_report.json"), report);
writeJson(p("evals", "reports", "execution_readiness_gate_report.json"), report);
writeText(p("evals", "reports", "execution_readiness_gate_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "ERD-001",
    severity: "high",
    description: "Execution readiness dashboard artifacts are missing or invalid.",
    blocks_next_execution_decision: true,
    owner: "agent",
    recommended_next_action: "Regenerate readiness dashboard artifacts and rerun check_execution_readiness_dashboard.mjs."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
