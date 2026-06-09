#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-values-owner-and-window-preflight";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-values-preflight";
const BLOCKED_CLAIMS = [
  "production-monitored",
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
];
const REQUIRED_MISSING_VALUES = [
  "dashboard_owner",
  "alert_channel",
  "alert_review_owner",
  "escalation_policy",
  "missing_trace_rate_threshold",
  "error_rate_threshold",
  "p95_latency_threshold_ms",
  "minimum_duration",
  "required_sample_count",
  "trace_retention_period",
  "pii_retention_policy",
  "incident_owner",
  "escalation_owner",
  "rollback_owner"
];
const REQUIRED_FILES = [
  "release/scopes/post-rc/post_rc_production_monitoring_values_owner_preflight_scope.yaml",
  "release/gates/post-rc/post_rc_production_monitoring_values_owner_gate.yaml",
  "release/preconditions/post-rc/post_rc_production_monitoring_window_preconditions.yaml",
  "release/approvals/post-rc/post_rc_production_monitoring_values_approval_request.md",
  "release/commands/post-rc/post_rc_production_monitoring_window_command_plan.yaml",
  "observability/production_monitoring_operator_values_template.yaml",
  "observability/production_monitoring_recommended_defaults.yaml",
  "observability/production_monitoring_owner_assignment_template.yaml",
  "observability/production_monitoring_window_execution_policy.yaml",
  "observability/production_monitoring_final_gate_policy.yaml",
  "evals/suites/post_rc_production_monitoring_values_preflight.yaml",
  "evals/reports/post_rc_production_monitoring_values_preflight_report.json",
  "evals/reports/post_rc_production_monitoring_values_preflight_report.md",
  "evals/reports/post_rc_production_monitoring_values_gate_report.json",
  "evals/reports/post_rc_production_monitoring_values_gate_report.md",
  `${EVIDENCE_DIR}/production_monitoring_values_preflight_report.json`,
  `${EVIDENCE_DIR}/production_monitoring_operator_values_template_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_recommended_defaults_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_owner_assignment_template_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_window_preconditions.json`,
  `${EVIDENCE_DIR}/production_monitoring_values_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_monitoring_values_blocker_update.json`,
  `${EVIDENCE_DIR}/production_monitoring_window_command_plan_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_values_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/approvals/production_monitoring_values_owner_preflight.md",
  "docs/approvals/production_monitoring_operator_values_template.md",
  "docs/observability/production_monitoring_recommended_defaults.md",
  "docs/observability/production_monitoring_window_execution_plan.md",
  "docs/approvals/production_monitoring_values_approval_request.md",
  "docs/plans/next_monitoring_window_execution_plan.md"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function readYamlIfExists(relPath) {
  return exists(relPath) ? YAML.parse(readText(p(...relPath.split("/")))) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value) => actual.includes(value));
}

function runNodeScript(script, label) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    label,
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 2000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 2000)
  };
}

function gitForbiddenStatus() {
  const result = spawnSync("git", [
    "status",
    "--short",
    "--",
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function gateMarkdown(gate, checks) {
  return `# Post-RC Production Monitoring Values Preflight Gate Report

Status: ${gate.status}

- Stage: ${gate.stage}
- Operator values required: ${gate.operator_values_required}
- Monitoring window can execute: ${gate.monitoring_window_can_execute}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

const buildRun = runNodeScript(
  "build_post_rc_production_monitoring_values_preflight.mjs",
  "build_post_rc_production_monitoring_values_preflight.mjs completed"
);
const controlsRun = runNodeScript(
  "check_post_rc_production_monitoring_controls.mjs",
  "check_post_rc_production_monitoring_controls.mjs pass"
);
const validateRun = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scanRun = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baselineRun = runNodeScript("check_reference_baseline_integrity.mjs", "check_reference_baseline_integrity.mjs pass");

const checks = [];
addCheck(checks, buildRun.label,
  buildRun.exit_code === 0 && buildRun.status === "blocked_by_missing_operator_values", {
  exit_code: buildRun.exit_code,
  status: buildRun.status
});
for (const run of [controlsRun, validateRun, scanRun, baselineRun]) {
  addCheck(checks, run.label, run.exit_code === 0 && run.status === "pass", {
    exit_code: run.exit_code,
    status: run.status
  });
}

for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_values_preflight_report.json`);
const preconditions = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_window_preconditions.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_values_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_values_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const operatorValues = readYamlIfExists("observability/production_monitoring_operator_values_template.yaml");
const defaults = readYamlIfExists("observability/production_monitoring_recommended_defaults.yaml");
const ownerAssignment = readYamlIfExists("observability/production_monitoring_owner_assignment_template.yaml");
const windowPolicy = readYamlIfExists("observability/production_monitoring_window_execution_policy.yaml");
const finalGate = readYamlIfExists("observability/production_monitoring_final_gate_policy.yaml");
const commandPlan = readYamlIfExists("release/commands/post-rc/post_rc_production_monitoring_window_command_plan.yaml");
const scanMatches = Array.isArray(scanRun.parsed?.matches) ? scanRun.parsed.matches : [];

addCheck(checks, "values preflight report is blocked by missing operator values",
  report?.status === "blocked_by_missing_operator_values"
    && report?.stage === STAGE
    && report?.telemetry_connected === true
    && report?.production_monitoring_controls_drafted === true
    && report?.operator_values_required === true
    && report?.operator_values_complete === false
    && report?.monitoring_window_can_execute === false, {
  status: report?.status,
  operator_values_complete: report?.operator_values_complete,
  monitoring_window_can_execute: report?.monitoring_window_can_execute
});
addCheck(checks, "no new execution or forbidden execution occurred",
  report?.new_execution === false
    && report?.telemetry_sink_write === false
    && report?.live_monitoring_window_execution === false
    && report?.openai_model_api_call === false
    && report?.openai_provider_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.evidence_reference_baseline_modified === false, {
  new_execution: report?.new_execution,
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution
});
addCheck(checks, "operator values template matches required shape",
  operatorValues?.operator_values?.status === "pending_operator_input"
    && operatorValues?.operator_values?.dashboard?.dashboard_owner === "operator_required"
    && operatorValues?.operator_values?.alerting?.alert_channel === "operator_required"
    && operatorValues?.operator_values?.anomaly_thresholds?.redaction_failure_threshold === 0
    && operatorValues?.operator_values?.retention?.raw_payload_storage_allowed === false
    && operatorValues?.operator_values?.retention?.secret_storage_allowed === false
    && operatorValues?.operator_values?.incident_response?.incident_owner === "operator_required", {
  status: operatorValues?.operator_values?.status
});
addCheck(checks, "recommended defaults require operator approval",
  defaults?.recommended_defaults?.status === "draft_requires_operator_approval"
    && defaults?.recommended_defaults?.approval_required === true
    && defaults?.recommended_defaults?.anomaly_thresholds?.redaction_failure_threshold === 0
    && defaults?.recommended_defaults?.retention?.raw_payload_storage_allowed === false
    && defaults?.recommended_defaults?.retention?.secret_storage_allowed === false, {
  status: defaults?.recommended_defaults?.status,
  approval_required: defaults?.recommended_defaults?.approval_required
});
addCheck(checks, "owner assignment template remains pending",
  ownerAssignment?.owner_assignment?.status === "pending_operator_input"
    && ownerAssignment?.owner_assignment?.incident_owner === "operator_required"
    && ownerAssignment?.owner_assignment?.escalation_owner === "operator_required"
    && ownerAssignment?.owner_assignment?.rollback_owner === "operator_required"
    && ownerAssignment?.owner_assignment?.owner_approval_recorded === false, {
  status: ownerAssignment?.owner_assignment?.status
});
addCheck(checks, "monitoring window preconditions block execution",
  preconditions?.status === "operator_values_required"
    && preconditions?.operator_values_complete === false
    && preconditions?.monitoring_window_can_execute === false
    && preconditions?.local_endpoint_required_for_monitoring_window === false
    && preconditions?.local_endpoint_deferred === true
    && sameMembers(preconditions?.missing_operator_values, REQUIRED_MISSING_VALUES), {
  status: preconditions?.status,
  missing_operator_values: preconditions?.missing_operator_values
});
addCheck(checks, "window execution policy is preflight-only",
  windowPolicy?.monitoring_window_execution_policy?.status === "preflight_only"
    && windowPolicy?.monitoring_window_execution_policy?.execution_allowed_in_this_stage === false
    && windowPolicy?.monitoring_window_execution_policy?.local_endpoint_required === false
    && windowPolicy?.monitoring_window_execution_policy?.local_endpoint_deferred === true, {
  status: windowPolicy?.monitoring_window_execution_policy?.status
});
addCheck(checks, "final gate policy remains unexecuted",
  finalGate?.production_monitoring_final_gate_policy?.status === "drafted"
    && finalGate?.production_monitoring_final_gate_policy?.gate_not_executed_in_this_stage === true
    && finalGate?.production_monitoring_final_gate_policy?.still_blocked_until_gate_pass?.includes("production-monitored"), {
  status: finalGate?.production_monitoring_final_gate_policy?.status
});
addCheck(checks, "command plan is not executable in this stage",
  commandPlan?.command_plan?.stage_to_execute_after_operator_values === "v2.0.0-post-rc-production-monitoring-window-execution"
    && commandPlan?.command_plan?.not_executable_in_this_stage === true
    && commandPlan?.command_plan?.commands?.includes("node harness-core/tools/runners/observability/run_post_rc_production_monitoring_window.mjs")
    && commandPlan?.command_plan?.commands?.includes("node harness-core/tools/checks/observability/check_post_rc_production_monitoring_window.mjs"), {
  not_executable_in_this_stage: commandPlan?.command_plan?.not_executable_in_this_stage
});
addCheck(checks, "window execution scripts were not created",
  !exists("tools/runners/observability/run_post_rc_production_monitoring_window.mjs")
    && !exists("tools/checks/observability/check_post_rc_production_monitoring_window.mjs"), {
  run_script_exists: exists("tools/runners/observability/run_post_rc_production_monitoring_window.mjs"),
  check_script_exists: exists("tools/checks/observability/check_post_rc_production_monitoring_window.mjs")
});
addCheck(checks, "claim boundary keeps stronger claims blocked",
  boundary?.status === "pass"
    && boundary?.telemetry_connected_allowed === true
    && boundary?.production_monitoring_controls_drafted === true
    && boundary?.operator_values_complete === false
    && boundary?.monitoring_window_completed === false
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  production_monitored_allowed: boundary?.production_monitored_allowed,
  stable_allowed: boundary?.stable_allowed
});
addCheck(checks, "blocker updated to operator values required",
  blocker?.status === "updated"
    && blocker?.previous_status === "production_monitoring_controls_drafted_monitoring_window_pending"
    && blocker?.new_status === "operator_values_required_before_monitoring_window"
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items record missing operator values",
  unresolved?.status === "operator_values_required_before_monitoring_window"
    && unresolved?.unresolved_items_count === REQUIRED_MISSING_VALUES.length
    && sameMembers(unresolved?.missing_operator_values, REQUIRED_MISSING_VALUES), {
  unresolved_items_count: unresolved?.unresolved_items_count
});
addCheck(checks, "production-monitored / production-ready / stable / provider-diverse positive claims absent",
  scanMatches.filter((match) => [
    "production-monitored",
    "production-ready",
    "stable",
    "provider-diverse"
  ].includes(match.claim)).length === 0, {
  matches: scanMatches.filter((match) => [
    "production-monitored",
    "production-ready",
    "stable",
    "provider-diverse"
  ].includes(match.claim)).length
});
const forbiddenStatus = gitForbiddenStatus();
addCheck(checks, "guardrail paths remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);

const failures = checks.filter((check) => check.status !== "pass");
const passedPreflight = failures.length === 0;
const gate = {
  status: passedPreflight ? "blocked_by_missing_operator_values" : "fail",
  stage: STAGE,
  operator_values_required: true,
  monitoring_window_can_execute: false,
  can_claim_telemetry_connected: passedPreflight,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passedPreflight
    ? "Production monitoring values and owners must be completed before monitoring window execution."
    : "Production monitoring values preflight failed.",
  operator_values_complete: false,
  production_monitoring_controls_drafted: passedPreflight,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  checks,
  failures,
  claims_allowed_by_this_gate: passedPreflight ? [
    "telemetry-connected",
    "post-rc-production-monitoring-values-preflight-completed",
    "post-rc-production-monitoring-defaults-drafted",
    "post-rc-production-monitoring-owner-template-drafted",
    "post-rc-production-monitoring-window-preconditions-drafted",
    "post-rc-production-monitoring-window-command-plan-drafted"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${EVIDENCE_DIR}/production_monitoring_values_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_values_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_production_monitoring_values_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);
