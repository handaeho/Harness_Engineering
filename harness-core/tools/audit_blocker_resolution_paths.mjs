#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-execution-readiness-dashboard-and-blocker-resolution-plan";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-execution-readiness-dashboard");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const plan = exists("evidence/beta-execution-readiness-dashboard/blocker_resolution_plan.json")
  ? readJson(p("evidence", "beta-execution-readiness-dashboard", "blocker_resolution_plan.json"))
  : [];
const dashboard = exists("evidence/beta-execution-readiness-dashboard/execution_readiness_dashboard.json")
  ? readJson(p("evidence", "beta-execution-readiness-dashboard", "execution_readiness_dashboard.json"))
  : null;

const checks = [];
addCheck(checks, "blocker resolution plan exists", Array.isArray(plan) && plan.length >= 5, {
  blocker_count: plan.length
});
for (const required of ["BRP-001", "BRP-002", "BRP-003", "BRP-004", "BRP-005"]) {
  addCheck(checks, `${required} exists`, plan.some((item) => item.id === required), {});
}
addCheck(checks, "all blockers have owner action exit criteria and evidence", plan.every((item) => item.owner
  && item.next_action
  && item.exit_criteria
  && Array.isArray(item.evidence_needed)
  && item.evidence_needed.length > 0), {});
addCheck(checks, "dashboard lanes remain blocked", dashboard
  && Object.values(dashboard.lanes || {}).every((lane) => lane.can_execute_now === false), {
  lanes: Object.keys(dashboard?.lanes || {})
});
const openaiLane = dashboard?.lanes?.openai_limited_redteam_execution;
addCheck(checks, "OpenAI lane uses operator PowerShell credential mode", openaiLane?.status === "approval_blocked_operator_credentials_available"
  && openaiLane?.blocked_by?.length === 1
  && openaiLane.blocked_by.includes("missing_explicit_user_approval")
  && openaiLane?.credential_status?.agent_env_credential_present === false
  && openaiLane?.credential_status?.operator_powershell_credential_available === true
  && openaiLane?.credential_status?.credential_blocker_type === "execution_environment_dependent"
  && openaiLane?.can_execute_in_operator_shell_after_approval === true, {
  status: openaiLane?.status,
  blocked_by: openaiLane?.blocked_by,
  credential_status: openaiLane?.credential_status,
  can_execute_in_operator_shell_after_approval: openaiLane?.can_execute_in_operator_shell_after_approval
});
addCheck(checks, "OpenAI credential is not modeled as primary dashboard blocker", !openaiLane?.blocked_by?.includes("missing_openai_credentials_in_agent_environment")
  && !plan.some((item) => item.blocker === "missing_openai_credentials_in_agent_environment"), {
  openai_blocked_by: openaiLane?.blocked_by,
  matching_plan_items: plan.filter((item) => item.blocker === "missing_openai_credentials_in_agent_environment").map((item) => item.id)
});
addCheck(checks, "no new execution flags", dashboard?.new_provider_execution === false
  && dashboard?.new_local_model_execution === false
  && dashboard?.new_telemetry_connection === false
  && dashboard?.local_endpoint_probe === false, {
  new_provider_execution: dashboard?.new_provider_execution,
  new_local_model_execution: dashboard?.new_local_model_execution,
  new_telemetry_connection: dashboard?.new_telemetry_connection,
  local_endpoint_probe: dashboard?.local_endpoint_probe
});

const report = {
  status: checks.every((item) => item.status === "pass") ? "pass" : "fail",
  stage: STAGE,
  blocker_count: plan.length,
  p0_blocker_count: plan.filter((item) => item.priority === "P0").length,
  p1_blocker_count: plan.filter((item) => item.priority === "P1").length,
  checks,
  failures: checks.filter((item) => item.status !== "pass")
};
const md = `# Blocker Resolution Plan Report

Status: ${report.status}

Stage: ${STAGE}

- Blocker count: ${report.blocker_count}
- P0 blocker count: ${report.p0_blocker_count}
- P1 blocker count: ${report.p1_blocker_count}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "blocker_resolution_plan_report.json"), report);
writeText(p("evals", "reports", "blocker_resolution_plan_report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
