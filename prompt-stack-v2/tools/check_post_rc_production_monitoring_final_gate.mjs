#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-final-gate";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-final-gate";
const REQUIRED_FILES = [
  "release/post_rc_production_monitoring_final_gate_scope.yaml",
  "release/post_rc_production_monitoring_final_gate.yaml",
  "release/post_rc_production_monitored_claim_boundary.yaml",
  "release/post_rc_production_monitoring_final_decision_record.yaml",
  "release/post_rc_production_monitoring_final_claim_boundary.yaml",
  "release/post_rc_production_monitoring_final_blocker_update.yaml",
  "tools/run_post_rc_production_monitoring_final_gate.mjs",
  "tools/check_post_rc_production_monitoring_final_gate.mjs",
  "tools/audit_post_rc_production_monitoring_final_gate_claims.mjs",
  "tools/audit_post_rc_production_monitored_claims.mjs",
  "tools/summarize_post_rc_production_monitoring_final_evidence.mjs",
  "evals/suites/post_rc_production_monitoring_final_gate.yaml",
  "evals/reports/post_rc_production_monitoring_final_gate_report.json",
  "evals/reports/post_rc_production_monitoring_final_gate_report.md",
  "evals/reports/post_rc_production_monitored_claim_boundary_report.json",
  "evals/reports/post_rc_production_monitored_claim_boundary_report.md",
  "evals/reports/post_rc_production_monitoring_final_evidence_report.json",
  "evals/reports/post_rc_production_monitoring_final_evidence_report.md",
  "evals/reports/post_rc_production_monitoring_final_claim_boundary_report.json",
  "evals/reports/post_rc_production_monitoring_final_claim_boundary_report.md",
  `${EVIDENCE_DIR}/production_monitoring_final_gate_report.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_gate_report.md`,
  `${EVIDENCE_DIR}/production_monitoring_final_evidence_summary.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_evidence_completeness.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_precondition_review.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_threshold_review.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_redaction_review.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_monitored_claim_boundary.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_decision_record.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_blocker_update.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_monitoring_final_gate.md",
  "docs/production_monitored_claim_boundary.md",
  "docs/production_monitoring_final_decision_record.md",
  "docs/next_production_ready_scope_plan.md",
  "docs/next_stable_scope_decision_plan.md",
  "docs/next_local_canary_after_endpoint_ready.md",
  "docs/next_production_ready_readiness_plan.md"
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
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function markdown(gate) {
  return `# Production Monitoring Final Gate Report

Status: ${gate.status}

- Stage: ${gate.stage}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}
`;
}

const validate = runNode("validate_alpha.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const compare = runNode("compare_v36_baseline.mjs");
const audit = runNode("audit_post_rc_production_monitoring_final_gate_claims.mjs");
const monitoredAudit = runNode("audit_post_rc_production_monitored_claims.mjs");
const evidenceSummaryRun = runNode("summarize_post_rc_production_monitoring_final_evidence.mjs");

const report = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_gate_report.json`);
const evidenceSummary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_evidence_summary.json`);
const evidenceCompleteness = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_evidence_completeness.json`);
const preconditions = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_precondition_review.json`);
const threshold = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_threshold_review.json`);
const redaction = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_redaction_review.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_claim_boundary.json`);
const canonicalBoundary = readJsonIfExists(`${EVIDENCE_DIR}/production_monitored_claim_boundary.json`);
const decisionRecord = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_decision_record.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_blocker_update.json`);
const refreshGate = readJsonIfExists("evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/post_rc_v36_baseline_refresh_gate_report.json");
const resultReviewGate = readJsonIfExists("evidence/post-rc-production-monitoring-window-result-review/monitoring_window_result_gate_report.json");

const checks = [];
for (const result of [validate, scan, compare, audit, monitoredAudit, evidenceSummaryRun]) {
  addCheck(checks, `${result.script} pass`, result.exit_code === 0 && result.status === "pass", {
    exit_code: result.exit_code,
    status: result.status
  });
}
addCheck(checks, "v36 baseline refresh gate report pass",
  refreshGate?.status === "pass"
    && refreshGate?.compare_v36_baseline_status === "pass"
    && refreshGate?.can_enter_production_monitoring_final_gate === true, refreshGate || {});
addCheck(checks, "monitoring result review gate report pass",
  resultReviewGate?.status === "pass"
    && resultReviewGate?.can_enter_production_monitoring_final_gate === true
    && resultReviewGate?.can_claim_production_monitored === false, resultReviewGate || {});
for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "final gate report passed",
  report?.status === "pass"
    && report?.approval_phrase_verified === true
    && report?.production_monitoring_final_gate_passed === true
    && report?.production_monitored_allowed === true
    && report?.can_claim_production_monitored === true, report || {});
addCheck(checks, "final evidence summary passed",
  evidenceSummary?.status === "pass"
    && evidenceSummary?.telemetry_connected === true
    && evidenceSummary?.monitoring_controls_drafted === true
    && evidenceSummary?.operator_values_complete === true
    && evidenceSummary?.monitoring_window_completed === true
    && evidenceSummary?.duration_met === true
    && evidenceSummary?.sample_count_met === true
    && evidenceSummary?.thresholds_passed === true
    && evidenceSummary?.redaction_failures === 0
    && evidenceSummary?.raw_payload_storage_violations === 0
    && evidenceSummary?.secret_logging_findings === 0
    && evidenceSummary?.incident_rollback_review_pass === true
    && evidenceSummary?.compare_v36_baseline_status === "pass"
    && evidenceSummary?.v36_owner_approved_refresh_effective === true
    && evidenceSummary?.openai_model_api_call === false
    && evidenceSummary?.local_endpoint_probe === false
    && evidenceSummary?.local_model_execution === false
    && evidenceSummary?.telemetry_sink_write === false, evidenceSummary || {});
addCheck(checks, "final evidence completeness passed",
  evidenceCompleteness?.status === "pass"
    && Array.isArray(evidenceCompleteness?.missing_evidence)
    && evidenceCompleteness.missing_evidence.length === 0, evidenceCompleteness || {});
addCheck(checks, "monitoring evidence accepted",
  report?.monitoring_window_completed === true
    && report?.duration_met === true
    && report?.sample_count_met === true
    && report?.thresholds_passed === true
    && preconditions?.final_gate_preconditions_ready === true, preconditions || {});
addCheck(checks, "redaction and threshold reviews passed",
  threshold?.status === "pass"
    && threshold?.thresholds_passed === true
    && redaction?.status === "pass"
    && redaction?.redaction_failures === 0
    && redaction?.raw_payload_storage_violations === 0
    && redaction?.secret_logging_findings === 0
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false
    && redaction?.raw_payload_stored === false, {
  threshold_status: threshold?.status,
  redaction_status: redaction?.status
});
addCheck(checks, "claim boundary only opens production-monitored",
  boundary?.status === "pass"
    && canonicalBoundary?.status === "pass"
    && boundary?.production_monitored_allowed === true
    && canonicalBoundary?.production_monitored_allowed === true
    && canonicalBoundary?.bare_release_gated_allowed === false
    && boundary?.production_ready_allowed === false
    && boundary?.stable_allowed === false
    && boundary?.provider_diverse_allowed === false
    && boundary?.local_model_verified_allowed === false, boundary || {});
addCheck(checks, "final decision record approves only production-monitored",
  decisionRecord?.status === "recorded"
    && decisionRecord?.decision === "approve_production_monitored_claim"
    && decisionRecord?.production_monitored === true
    && decisionRecord?.is_production_ready === false
    && decisionRecord?.is_stable === false
    && decisionRecord?.is_provider_diverse === false
    && decisionRecord?.is_local_model_verified === false, decisionRecord || {});
addCheck(checks, "blocker update keeps stronger claims blocked",
  blocker?.new_status === "production_monitored_allowed_production_ready_still_blocked"
    && Array.isArray(blocker?.still_blocks)
    && blocker.still_blocks.includes("production-ready")
    && blocker.still_blocks.includes("stable"), blocker || {});
addCheck(checks, "forbidden execution flags remain false",
  report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_deployment === false
    && report?.release_gate_rerun === false, {
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call
});

const forbiddenStatus = gitStatus(["prompt-stack/v36", "dist"]);
addCheck(checks, "prompt-stack/v36 and dist remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);
const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
addCheck(checks, "evidence/v36-baseline only has prior owner-approved refresh changes",
  baselineStatus.exit_code === 0 && (
    baselineStatus.stdout === ""
    || report?.evidence_v36_baseline_modified_by_prior_owner_approved_refresh === true
  ), baselineStatus);

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
addCheck(checks, "production-ready / stable / provider-diverse positive claims absent",
  scanMatches.filter((match) => [
    "production-ready",
    "stable",
    "provider-diverse"
  ].includes(match.claim)).length === 0, {
  match_count: scanMatches.length
});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_claim_telemetry_connected: true,
  can_claim_production_monitored: failures.length === 0,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  can_claim_provider_diverse: false,
  production_monitored_allowed: failures.length === 0,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  reason: failures.length === 0
    ? "Production monitoring final gate passed. Production-monitored is allowed; stronger claims remain blocked."
    : "Production monitoring final gate failed.",
  checks,
  failures,
  claims_allowed_by_this_gate: failures.length === 0 ? [
    "telemetry-connected",
    "production-monitored",
    "post-rc-production-monitoring-final-gate-passed",
    "post-rc-production-monitored-claim-enabled",
    "post-rc-production-monitoring-final-decision-recorded",
    "post-rc-production-monitoring-controls-verified",
    "post-rc-production-monitoring-window-evidence-accepted",
    "post-rc-production-monitoring-claim-boundary-finalized"
  ] : [],
  claims_still_blocked: [
    "production-ready",
    "stable",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "release-gated"
  ]
};

writeJson(p(...EVIDENCE_DIR.split("/"), "production_monitoring_final_gate_gate_report.json"), gate);
writeJson(p(...EVIDENCE_DIR.split("/"), "production_monitoring_final_gate_check_report.json"), gate);
writeJson(p("evals", "reports", "post_rc_production_monitoring_final_gate_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_production_monitoring_final_gate_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
