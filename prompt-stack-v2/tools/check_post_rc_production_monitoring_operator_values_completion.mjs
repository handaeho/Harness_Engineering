#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-operator-values-completion";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-operator-values-completion";
const APPROVAL_PHRASE = "I explicitly approve v2.0.0-post-rc-production-monitoring-window-execution";
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
const REQUIRED_FILES = [
  "release/post_rc_production_monitoring_operator_values_completion_scope.yaml",
  "release/post_rc_production_monitoring_window_execution_approval_gate.yaml",
  "release/post_rc_production_monitoring_window_execution_approval_request.md",
  "observability/production_monitoring_operator_values.yaml",
  "observability/production_monitoring_threshold_values.yaml",
  "observability/production_monitoring_owner_assignments.yaml",
  "observability/production_monitoring_retention_values.yaml",
  "evals/suites/post_rc_production_monitoring_operator_values_completion.yaml",
  "evals/reports/post_rc_production_monitoring_operator_values_completion_report.json",
  "evals/reports/post_rc_production_monitoring_operator_values_completion_report.md",
  "evals/reports/post_rc_production_monitoring_operator_values_gate_report.json",
  "evals/reports/post_rc_production_monitoring_operator_values_gate_report.md",
  `${EVIDENCE_DIR}/production_monitoring_operator_values_completion_report.json`,
  `${EVIDENCE_DIR}/production_monitoring_operator_values_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_threshold_values_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_owner_assignments_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_retention_values_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_window_preconditions_after_values.json`,
  `${EVIDENCE_DIR}/production_monitoring_window_execution_approval_request.md`,
  `${EVIDENCE_DIR}/production_monitoring_operator_values_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_monitoring_operator_values_blocker_update.json`,
  `${EVIDENCE_DIR}/production_monitoring_operator_values_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_monitoring_operator_values_completion.md",
  "docs/production_monitoring_window_execution_approval_request.md",
  "docs/next_monitoring_window_execution_plan.md"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

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
    "prompt-stack/v36",
    "dist",
    "prompt-stack-v2/evidence/v36-baseline"
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
  return `# Post-RC Production Monitoring Operator Values Completion Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Operator values complete: ${gate.operator_values_complete}
- Monitoring window can execute after approval: ${gate.monitoring_window_can_execute_after_approval}
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
  "complete_post_rc_production_monitoring_operator_values.mjs",
  "complete_post_rc_production_monitoring_operator_values.mjs pass"
);
const validateRun = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scanRun = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baselineRun = runNodeScript("compare_v36_baseline.mjs", "compare_v36_baseline.mjs pass");

const checks = [];
for (const run of [buildRun, validateRun, scanRun, baselineRun]) {
  addCheck(checks, run.label, run.exit_code === 0 && run.status === "pass", {
    exit_code: run.exit_code,
    status: run.status
  });
}

for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_operator_values_completion_report.json`);
const preflightReport = readJsonIfExists("evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_preflight_report.json");
const preconditions = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_window_preconditions_after_values.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_operator_values_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_operator_values_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const operatorValues = readYamlIfExists("observability/production_monitoring_operator_values.yaml");
const thresholdValues = readYamlIfExists("observability/production_monitoring_threshold_values.yaml");
const ownerAssignments = readYamlIfExists("observability/production_monitoring_owner_assignments.yaml");
const retentionValues = readYamlIfExists("observability/production_monitoring_retention_values.yaml");
const approvalRequest = exists("release/post_rc_production_monitoring_window_execution_approval_request.md")
  ? readText(p("release", "post_rc_production_monitoring_window_execution_approval_request.md"))
  : "";
const scanMatches = Array.isArray(scanRun.parsed?.matches) ? scanRun.parsed.matches : [];

addCheck(checks, "values preflight report exists and records missing-operator-values stage",
  preflightReport?.status === "blocked_by_missing_operator_values"
    && preflightReport?.telemetry_connected === true
    && preflightReport?.production_monitoring_controls_drafted === true, {
  status: preflightReport?.status,
  telemetry_connected: preflightReport?.telemetry_connected,
  production_monitoring_controls_drafted: preflightReport?.production_monitoring_controls_drafted
});

addCheck(checks, "completion report passed",
  report?.status === "pass"
    && report?.stage === STAGE
    && report?.telemetry_connected === true
    && report?.operator_values_complete === true
    && report?.owner_assignments_complete === true
    && report?.threshold_values_recorded === true
    && report?.retention_values_recorded === true
    && report?.monitoring_window_can_execute_after_approval === true, {
  status: report?.status,
  operator_values_complete: report?.operator_values_complete,
  monitoring_window_can_execute_after_approval: report?.monitoring_window_can_execute_after_approval
});
addCheck(checks, "operator values match provided values",
  operatorValues?.operator_values?.status === "complete"
    && operatorValues?.operator_values?.dashboard?.langfuse_project_name === "prompt-stack-v2-post-rc"
    && operatorValues?.operator_values?.dashboard?.dashboard_url === "not_available_manual_review"
    && operatorValues?.operator_values?.dashboard?.dashboard_owner === "operator"
    && operatorValues?.operator_values?.alerting?.alert_channel === "manual_review"
    && operatorValues?.operator_values?.alerting?.alert_review_owner === "operator"
    && operatorValues?.operator_values?.alerting?.escalation_policy === "operator_manual_escalation"
    && operatorValues?.operator_values?.monitoring_window?.minimum_duration === "24h"
    && operatorValues?.operator_values?.monitoring_window?.required_sample_count === 50
    && operatorValues?.operator_values?.monitoring_window?.allowed_environment === "post-rc controlled monitoring window", {
  status: operatorValues?.operator_values?.status
});
addCheck(checks, "threshold values recorded",
  thresholdValues?.threshold_values?.status === "recorded"
    && thresholdValues?.threshold_values?.anomaly_thresholds?.missing_trace_rate_threshold === "5%"
    && thresholdValues?.threshold_values?.anomaly_thresholds?.error_rate_threshold === "5%"
    && thresholdValues?.threshold_values?.anomaly_thresholds?.p95_latency_threshold_ms === 10000
    && thresholdValues?.threshold_values?.anomaly_thresholds?.redaction_failure_threshold === 0
    && thresholdValues?.threshold_values?.anomaly_thresholds?.raw_payload_storage_violation_threshold === 0
    && thresholdValues?.threshold_values?.anomaly_thresholds?.secret_logging_threshold === 0, {
  status: thresholdValues?.threshold_values?.status
});
addCheck(checks, "owner assignments complete",
  ownerAssignments?.owner_assignments?.status === "complete"
    && ownerAssignments?.owner_assignments?.owner_assignments_complete === true
    && ownerAssignments?.owner_assignments?.incident_owner === "operator"
    && ownerAssignments?.owner_assignments?.escalation_owner === "operator"
    && ownerAssignments?.owner_assignments?.rollback_owner === "operator", {
  status: ownerAssignments?.owner_assignments?.status
});
addCheck(checks, "retention values recorded without raw payload or secret storage",
  retentionValues?.retention_values?.status === "recorded"
    && retentionValues?.retention_values?.trace_retention_period === "30d"
    && retentionValues?.retention_values?.pii_retention_policy === "no_raw_payload_or_secret_storage"
    && retentionValues?.retention_values?.raw_payload_storage_allowed === false
    && retentionValues?.retention_values?.secret_storage_allowed === false
    && retentionValues?.retention_values?.retention_values_recorded === true, {
  status: retentionValues?.retention_values?.status
});
addCheck(checks, "window preconditions are ready for approval but unexecuted",
  preconditions?.status === "ready_for_operator_approval"
    && preconditions?.operator_values_complete === true
    && preconditions?.monitoring_window_can_execute_after_approval === true
    && preconditions?.monitoring_window_executed === false
    && preconditions?.required_approval_phrase === APPROVAL_PHRASE
    && preconditions?.does_not_require_now?.includes("local endpoint")
    && preconditions?.does_not_require_now?.includes("provider diversity"), {
  status: preconditions?.status,
  monitoring_window_executed: preconditions?.monitoring_window_executed
});
addCheck(checks, "approval request contains required phrase and boundaries",
  approvalRequest.includes(`Required approval phrase:\n${APPROVAL_PHRASE}`)
    && approvalRequest.includes("OpenAI model API call")
    && approvalRequest.includes("local endpoint probe")
    && approvalRequest.includes("production deployment")
    && approvalRequest.includes("stable release"), {
  phrase_present: approvalRequest.includes(APPROVAL_PHRASE)
});
addCheck(checks, "forbidden execution flags remain false",
  report?.monitoring_window_executed === false
    && report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false, {
  monitoring_window_executed: report?.monitoring_window_executed,
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe
});
addCheck(checks, "stronger claims remain blocked",
  report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  production_monitored_allowed: report?.production_monitored_allowed,
  stable_allowed: report?.stable_allowed
});
addCheck(checks, "blocker moved to window approval pending",
  blocker?.status === "updated"
    && blocker?.previous_status === "operator_values_required_before_monitoring_window"
    && blocker?.new_status === "operator_values_complete_monitoring_window_approval_pending"
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items record approval pending",
  unresolved?.status === "monitoring_window_execution_approval_pending"
    && unresolved?.required_approval_phrase === APPROVAL_PHRASE
    && unresolved?.unresolved_items_count === 4, {
  status: unresolved?.status,
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
const passed = failures.length === 0;
const gate = {
  status: passed ? "pass" : "fail",
  stage: STAGE,
  operator_values_complete: passed,
  monitoring_window_can_execute_after_approval: passed,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passed
    ? "Production monitoring operator values are complete. Monitoring window execution still requires explicit approval."
    : "Production monitoring operator values completion gate failed.",
  owner_assignments_complete: passed,
  threshold_values_recorded: passed,
  retention_values_recorded: passed,
  monitoring_window_executed: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  checks,
  failures,
  claims_allowed_by_this_gate: passed ? [
    "telemetry-connected",
    "post-rc-production-monitoring-operator-values-completed",
    "post-rc-production-monitoring-threshold-values-recorded",
    "post-rc-production-monitoring-owner-assignments-recorded",
    "post-rc-production-monitoring-window-execution-preconditions-satisfied",
    "post-rc-production-monitoring-window-approval-request-generated"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${EVIDENCE_DIR}/production_monitoring_operator_values_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_operator_values_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_production_monitoring_operator_values_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
