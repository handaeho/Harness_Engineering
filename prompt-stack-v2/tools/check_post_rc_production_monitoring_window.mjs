#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-execution";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window";
const INCOMPLETE_STATUS = "monitoring_window_incomplete";
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
  "release/post_rc_production_monitoring_window_execution_scope.yaml",
  "release/post_rc_production_monitoring_window_claim_boundary.yaml",
  "release/post_rc_production_monitoring_window_blocker_update.yaml",
  "tools/run_post_rc_production_monitoring_window.mjs",
  "tools/check_post_rc_production_monitoring_window.mjs",
  "tools/audit_post_rc_monitoring_window_claims.mjs",
  "evals/suites/post_rc_production_monitoring_window_execution.yaml",
  "evals/reports/post_rc_production_monitoring_window_report.json",
  "evals/reports/post_rc_production_monitoring_window_report.md",
  `${EVIDENCE_DIR}/production_monitoring_window_report.json`,
  `${EVIDENCE_DIR}/production_monitoring_window_report.md`,
  `${EVIDENCE_DIR}/monitoring_window_trace_continuity.json`,
  `${EVIDENCE_DIR}/monitoring_window_threshold_evaluation.json`,
  `${EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`,
  `${EVIDENCE_DIR}/monitoring_window_incident_rollback_readiness.json`,
  `${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`,
  `${EVIDENCE_DIR}/monitoring_window_blocker_update.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_monitoring_window_execution.md",
  "docs/production_monitoring_window_result_review.md",
  "docs/next_production_monitored_final_gate_plan.md"
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
  return `# Post-RC Production Monitoring Window Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

const operatorValuesGate = runNodeScript(
  "check_post_rc_production_monitoring_operator_values_completion.mjs",
  "check_post_rc_production_monitoring_operator_values_completion.mjs pass"
);
const runWindow = runNodeScript(
  "run_post_rc_production_monitoring_window.mjs",
  "run_post_rc_production_monitoring_window.mjs completed"
);
const auditClaims = runNodeScript(
  "audit_post_rc_monitoring_window_claims.mjs",
  "audit_post_rc_monitoring_window_claims.mjs pass"
);
const validate = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scan = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baseline = runNodeScript("compare_v36_baseline.mjs", "compare_v36_baseline.mjs pass");

const checks = [];
addCheck(checks, operatorValuesGate.label,
  operatorValuesGate.exit_code === 0 && operatorValuesGate.status === "pass", {
  exit_code: operatorValuesGate.exit_code,
  status: operatorValuesGate.status
});
addCheck(checks, runWindow.label,
  runWindow.exit_code === 0 && [INCOMPLETE_STATUS, "pass"].includes(runWindow.status), {
  exit_code: runWindow.exit_code,
  status: runWindow.status
});
addCheck(checks, auditClaims.label,
  auditClaims.exit_code === 0 && auditClaims.status === "pass", {
  exit_code: auditClaims.exit_code,
  status: auditClaims.status
});
for (const result of [validate, scan, baseline]) {
  addCheck(checks, result.label, result.exit_code === 0 && result.status === "pass", {
    exit_code: result.exit_code,
    status: result.status
  });
}

for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_window_report.json`);
const continuity = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_trace_continuity.json`);
const thresholds = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_threshold_evaluation.json`);
const redaction = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_redaction_evaluation.json`);
const incident = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_incident_rollback_readiness.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const operatorValuesReport = readJsonIfExists("evidence/post-rc-production-monitoring-operator-values-completion/production_monitoring_operator_values_completion_report.json");
const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];

addCheck(checks, "operator values completion evidence passed",
  operatorValuesReport?.status === "pass"
    && operatorValuesReport?.operator_values_complete === true
    && operatorValuesReport?.monitoring_window_can_execute_after_approval === true
    && operatorValuesReport?.monitoring_window_executed === false, {
  status: operatorValuesReport?.status,
  operator_values_complete: operatorValuesReport?.operator_values_complete,
  monitoring_window_can_execute_after_approval: operatorValuesReport?.monitoring_window_can_execute_after_approval
});

addCheck(checks, "approval phrase verified",
  report?.approval_phrase_verified === true, {
  approval_phrase_verified: report?.approval_phrase_verified
});
addCheck(checks, "window report records execution evidence without granting production-monitored",
  [INCOMPLETE_STATUS, "pass"].includes(report?.status)
    && report?.stage === STAGE
    && report?.telemetry_connected === true
    && report?.configured_sink === "langfuse"
    && report?.operator_values_complete === true
    && report?.monitoring_window_executed === true
    && report?.production_monitored_allowed === false, {
  status: report?.status,
  telemetry_connected: report?.telemetry_connected,
  monitoring_window_executed: report?.monitoring_window_executed,
  production_monitored_allowed: report?.production_monitored_allowed
});
addCheck(checks, "incomplete window honestly records unmet duration or sample count",
  report?.status === "pass"
    || (report?.status === INCOMPLETE_STATUS
      && report?.monitoring_window_completed === false
      && (report?.monitoring_window_duration_met === false || report?.required_sample_count_met === false)), {
  status: report?.status,
  monitoring_window_completed: report?.monitoring_window_completed,
  monitoring_window_duration_met: report?.monitoring_window_duration_met,
  required_sample_count_met: report?.required_sample_count_met
});
addCheck(checks, "trace continuity review uses Langfuse receipt evidence without raw trace payload",
  ["pass", "incomplete"].includes(continuity?.status)
    && continuity?.configured_sink === "langfuse"
    && continuity?.trace_receipts_available === true
    && continuity?.missing_trace_rate_evaluated === true
    && continuity?.missing_trace_rate_threshold === "5%"
    && continuity?.raw_trace_payload_stored === false
    && continuity?.secret_values_logged === false, {
  status: continuity?.status,
  sample_count: continuity?.sample_count,
  required_sample_count_met: continuity?.required_sample_count_met
});
addCheck(checks, "threshold evaluation records insufficient sample state",
  ["pass", "incomplete"].includes(thresholds?.status)
    && thresholds?.thresholds?.missing_trace_rate_threshold === "5%"
    && thresholds?.thresholds?.error_rate_threshold === "5%"
    && thresholds?.thresholds?.p95_latency_threshold_ms === 10000
    && thresholds?.observed?.redaction_failures === 0
    && thresholds?.observed?.raw_payload_storage_violations === 0
    && thresholds?.observed?.secret_logging_findings === 0, {
  status: thresholds?.status,
  threshold_evaluation_complete: thresholds?.threshold_evaluation_complete
});
addCheck(checks, "redaction and secret review passed",
  redaction?.status === "pass"
    && redaction?.redaction_failures === 0
    && redaction?.raw_payload_storage_violations === 0
    && redaction?.secret_logging_findings === 0
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false
    && redaction?.raw_payload_stored === false, {
  status: redaction?.status
});
addCheck(checks, "incident and rollback readiness reviewed without live rollback monitoring claim",
  incident?.status === "pass"
    && incident?.incident_owner === "operator"
    && incident?.escalation_owner === "operator"
    && incident?.rollback_owner === "operator"
    && incident?.rollback_triggers_defined === true
    && incident?.live_rollback_monitoring_tested === false, {
  status: incident?.status,
  live_rollback_monitoring_tested: incident?.live_rollback_monitoring_tested
});
addCheck(checks, "forbidden execution flags remain false",
  report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.evidence_v36_baseline_modified === false, {
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution,
  production_deployment: report?.production_deployment
});
addCheck(checks, "secret and raw payload flags remain false",
  report?.secrets_logged === false
    && report?.raw_payload_stored === false, {
  secrets_logged: report?.secrets_logged,
  raw_payload_stored: report?.raw_payload_stored
});
addCheck(checks, "production, stable, provider, and local-model claims remain blocked",
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
addCheck(checks, "claim boundary records allowed monitoring-window review claims only",
  boundary?.status === "pass"
    && boundary?.monitoring_window_executed === true
    && boundary?.monitoring_window_completed === false
    && Array.isArray(boundary?.allowed_claims)
    && boundary.allowed_claims.includes("post-rc-production-monitoring-window-executed")
    && boundary.allowed_claims.includes("post-rc-monitoring-window-incident-rollback-reviewed")
    && Array.isArray(boundary?.blocked_claims)
    && boundary.blocked_claims.includes("production-monitored"), {
  status: boundary?.status,
  monitoring_window_completed: boundary?.monitoring_window_completed
});
addCheck(checks, "blocker update records completion or final-gate pending state",
  blocker?.status === "updated"
    && blocker?.previous_status === "operator_values_required_before_monitoring_window"
    && blocker?.new_status === "monitoring_window_executed_completion_or_final_gate_pending"
    && blocker?.still_blocks?.includes("production-monitored"), {
  previous_status: blocker?.previous_status,
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items record next monitoring actions when incomplete",
  report?.status === "pass"
    || (unresolved?.status === INCOMPLETE_STATUS
      && Array.isArray(unresolved?.unresolved_items)
      && unresolved.unresolved_items.length >= 1), {
  status: unresolved?.status,
  unresolved_items_count: Array.isArray(unresolved?.unresolved_items) ? unresolved.unresolved_items.length : null
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
const gateStatus = passed ? (report?.status === "pass" ? "pass" : INCOMPLETE_STATUS) : "fail";
const gate = {
  status: gateStatus,
  stage: STAGE,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passed
    ? "Monitoring window execution evidence was recorded, but production-monitored remains blocked until duration/sample requirements and final monitoring gate pass."
    : "Monitoring window gate failed.",
  monitoring_window_executed: report?.monitoring_window_executed === true,
  monitoring_window_completed: report?.monitoring_window_completed === true,
  monitoring_window_duration_met: report?.monitoring_window_duration_met === true,
  required_sample_count_met: report?.required_sample_count_met === true,
  redaction_failures: report?.redaction_failures ?? null,
  raw_payload_storage_violations: report?.raw_payload_storage_violations ?? null,
  secret_logging_findings: report?.secret_logging_findings ?? null,
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
    "post-rc-production-monitoring-window-executed",
    "post-rc-monitoring-window-trace-continuity-reviewed",
    "post-rc-monitoring-window-thresholds-evaluated",
    "post-rc-monitoring-window-redaction-reviewed",
    "post-rc-monitoring-window-incident-rollback-reviewed"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${EVIDENCE_DIR}/monitoring_window_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_window_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_production_monitoring_window_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);
