#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { readJson, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-controls-design-and-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-controls";
const CONTROL_FILES = [
  "observability/production_monitoring_dashboard_spec.yaml",
  "observability/production_monitoring_alerting_policy.yaml",
  "observability/production_monitoring_anomaly_thresholds.yaml",
  "observability/production_monitoring_window_policy.yaml",
  "observability/production_monitoring_retention_policy.yaml",
  "observability/production_monitoring_incident_response_policy.yaml",
  "observability/production_monitoring_rollback_linkage_policy.yaml"
];
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

function allControlsTrue(controls = {}) {
  return [
    "dashboard_spec_defined",
    "alerting_policy_defined",
    "anomaly_thresholds_defined",
    "monitoring_window_policy_defined",
    "incident_response_owner_policy_defined",
    "rollback_monitoring_linkage_defined",
    "retention_policy_defined",
    "production_monitoring_gate_defined"
  ].every((key) => controls[key] === true);
}

function gateMarkdown(gate, checks) {
  return `# Post-RC Production Monitoring Controls Gate Report

Status: ${gate.status}

- Stage: ${gate.stage}
- Production monitoring controls drafted: ${gate.production_monitoring_controls_drafted}
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
  "build_post_rc_production_monitoring_controls.mjs",
  "build_post_rc_production_monitoring_controls.mjs pass"
);
const auditRun = runNodeScript(
  "audit_post_rc_production_monitoring_claim_boundary.mjs",
  "audit_post_rc_production_monitoring_claim_boundary.mjs pass"
);
const resultReviewRun = runNodeScript(
  "check_post_rc_telemetry_connection_result_review.mjs",
  "check_post_rc_telemetry_connection_result_review.mjs pass"
);
const validateRun = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scanRun = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baselineRun = runNodeScript("check_reference_baseline_integrity.mjs", "check_reference_baseline_integrity.mjs pass");

const checks = [];
for (const run of [buildRun, auditRun, resultReviewRun, validateRun, scanRun, baselineRun]) {
  addCheck(checks, run.label, run.exit_code === 0 && run.status === "pass", {
    exit_code: run.exit_code,
    status: run.status
  });
}

for (const relPath of [
  "release/scopes/post-rc/post_rc_production_monitoring_controls_scope.yaml",
  "release/gates/post-rc/post_rc_production_monitoring_gate.yaml",
  "release/claims/post-rc/post_rc_production_monitoring_claim_boundary.yaml",
  "release/blockers/post-rc/post_rc_production_monitoring_blocker_update.yaml",
  "evals/suites/post_rc_production_monitoring_controls.yaml",
  "evals/reports/post_rc_production_monitoring_controls_report.json",
  "evals/reports/post_rc_production_monitoring_controls_report.md",
  "evals/reports/post_rc_production_monitoring_claim_boundary_report.json",
  "evals/reports/post_rc_production_monitoring_claim_boundary_report.md",
  `${EVIDENCE_DIR}/production_monitoring_controls_report.json`,
  `${EVIDENCE_DIR}/production_monitoring_controls_report.md`,
  `${EVIDENCE_DIR}/production_monitoring_dashboard_spec_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_alerting_policy_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_anomaly_thresholds_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_window_policy_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_incident_response_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_rollback_linkage_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_retention_policy_snapshot.yaml`,
  `${EVIDENCE_DIR}/production_monitoring_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_monitoring_blocker_update.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/observability/production_monitoring_controls.md",
  "docs/observability/production_monitoring_dashboard_spec.md",
  "docs/observability/production_monitoring_alerting_policy.md",
  "docs/observability/production_monitoring_anomaly_thresholds.md",
  "docs/observability/production_monitoring_window_policy.md",
  "docs/observability/production_monitoring_incident_response.md",
  "docs/observability/production_monitoring_rollback_linkage.md",
  "docs/plans/next_production_monitoring_window_plan.md",
  "docs/plans/next_stable_scope_decision_plan.md",
  ...CONTROL_FILES
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_controls_report.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const dashboard = readYamlIfExists("observability/production_monitoring_dashboard_spec.yaml");
const alerting = readYamlIfExists("observability/production_monitoring_alerting_policy.yaml");
const thresholds = readYamlIfExists("observability/production_monitoring_anomaly_thresholds.yaml");
const windowPolicy = readYamlIfExists("observability/production_monitoring_window_policy.yaml");
const incident = readYamlIfExists("observability/production_monitoring_incident_response_policy.yaml");
const rollback = readYamlIfExists("observability/production_monitoring_rollback_linkage_policy.yaml");
const retention = readYamlIfExists("observability/production_monitoring_retention_policy.yaml");
const scanMatches = Array.isArray(scanRun.parsed?.matches) ? scanRun.parsed.matches : [];

addCheck(checks, "controls report passed",
  report?.status === "pass"
    && report?.stage === STAGE
    && report?.telemetry_connected === true
    && report?.configured_sink === "langfuse"
    && allControlsTrue(report?.controls), {
  status: report?.status,
  telemetry_connected: report?.telemetry_connected,
  controls: report?.controls
});
addCheck(checks, "no new execution or forbidden execution occurred",
  report?.new_execution === false
    && report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
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
addCheck(checks, "production monitoring claims remain blocked",
  report?.production_monitoring_ready === false
    && report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false
    && report?.local_model_verified_allowed === false
    && boundary?.production_monitored_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, {
  production_monitoring_ready: report?.production_monitoring_ready,
  production_monitored_allowed: report?.production_monitored_allowed,
  stable_allowed: report?.stable_allowed
});
addCheck(checks, "dashboard spec matches required shape",
  dashboard?.dashboard?.name === "post_rc_langfuse_monitoring_dashboard"
    && dashboard?.dashboard?.sink === "langfuse"
    && dashboard?.dashboard?.status === "drafted"
    && dashboard?.dashboard?.live_dashboard_created === false
    && [
      "trace_volume",
      "error_rate",
      "latency_distribution",
      "tool_or_harness_failure_count",
      "redaction_failure_count",
      "missing_trace_count",
      "cost_or_token_usage_if_available"
    ].every((panel) => dashboard?.dashboard?.required_panels?.includes(panel)), {
  dashboard: dashboard?.dashboard
});
addCheck(checks, "alerting policy matches required shape",
  alerting?.alerting_policy?.status === "drafted"
    && alerting?.alerting_policy?.live_alerts_enabled === false
    && alerting?.alerting_policy?.alerts?.length === 4, {
  status: alerting?.alerting_policy?.status,
  live_alerts_enabled: alerting?.alerting_policy?.live_alerts_enabled
});
addCheck(checks, "anomaly thresholds require operator values",
  thresholds?.anomaly_thresholds?.status === "drafted"
    && thresholds?.anomaly_thresholds?.operator_defined_values_required === true
    && thresholds?.anomaly_thresholds?.thresholds?.redaction_failure_count?.critical === "> 0"
    && thresholds?.anomaly_thresholds?.thresholds?.raw_payload_storage_violation?.critical === "> 0", {
  operator_defined_values_required: thresholds?.anomaly_thresholds?.operator_defined_values_required
});
addCheck(checks, "monitoring window policy remains unexecuted",
  windowPolicy?.monitoring_window?.status === "drafted"
    && windowPolicy?.monitoring_window?.minimum_window_required_before_production_monitored === true
    && windowPolicy?.monitoring_window?.window_completed === false, {
  window_completed: windowPolicy?.monitoring_window?.window_completed
});
addCheck(checks, "incident response owner remains required",
  incident?.incident_response?.status === "drafted"
    && incident?.incident_response?.incident_owner_defined === false
    && incident?.incident_response?.escalation_path_defined === false, {
  incident_owner_defined: incident?.incident_response?.incident_owner_defined
});
addCheck(checks, "rollback linkage drafted but not live-tested",
  rollback?.rollback_monitoring_linkage?.status === "drafted"
    && rollback?.rollback_monitoring_linkage?.linked_to_rollback_plan === true
    && rollback?.rollback_monitoring_linkage?.live_rollback_monitoring_tested === false, {
  linked_to_rollback_plan: rollback?.rollback_monitoring_linkage?.linked_to_rollback_plan,
  live_rollback_monitoring_tested: rollback?.rollback_monitoring_linkage?.live_rollback_monitoring_tested
});
addCheck(checks, "retention policy forbids raw payload and secret storage",
  retention?.retention_policy?.status === "drafted"
    && retention?.retention_policy?.raw_payload_storage_allowed === false
    && retention?.retention_policy?.secret_storage_allowed === false
    && retention?.retention_policy?.operator_values_required === true, {
  raw_payload_storage_allowed: retention?.retention_policy?.raw_payload_storage_allowed,
  secret_storage_allowed: retention?.retention_policy?.secret_storage_allowed
});
addCheck(checks, "blocker updated to monitoring window pending",
  blocker?.status === "updated"
    && blocker?.previous_status === "blocked_not_production_monitored"
    && blocker?.new_status === "production_monitoring_controls_drafted_monitoring_window_pending"
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items record pending next actions",
  unresolved?.status === "monitoring_window_pending"
    && Array.isArray(unresolved?.items)
    && unresolved.items.length === 5, {
  status: unresolved?.status,
  unresolved_items_count: Array.isArray(unresolved?.items) ? unresolved.items.length : null
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
  production_monitoring_controls_drafted: passed,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passed
    ? "Production monitoring controls are drafted, but live monitoring window and final production monitoring gate remain pending."
    : "Production monitoring controls gate failed.",
  production_monitoring_ready: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  checks,
  failures,
  claims_allowed_by_this_gate: passed ? [
    "telemetry-connected",
    "post-rc-production-monitoring-controls-drafted",
    "post-rc-production-monitoring-gate-designed",
    "post-rc-production-monitoring-claim-boundary-audited",
    "post-rc-production-monitoring-blocker-updated"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${EVIDENCE_DIR}/production_monitoring_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_production_monitoring_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
