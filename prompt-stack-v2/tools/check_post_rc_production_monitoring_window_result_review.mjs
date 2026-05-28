#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-result-review";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-result-review";
const BLOCKED_STATUS = "blocked_by_monitoring_window_requirements_not_met";
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
  "release/post_rc_production_monitoring_window_result_review_scope.yaml",
  "release/post_rc_production_monitoring_window_result_claim_boundary.yaml",
  "release/post_rc_production_monitoring_final_gate_preconditions.yaml",
  "release/post_rc_production_monitoring_window_result_blocker_update.yaml",
  "tools/review_post_rc_production_monitoring_window_result.mjs",
  "tools/check_post_rc_production_monitoring_window_result_review.mjs",
  "tools/audit_post_rc_production_monitoring_window_result_claims.mjs",
  "evals/suites/post_rc_production_monitoring_window_result_review.yaml",
  "evals/reports/post_rc_production_monitoring_window_result_review_report.json",
  "evals/reports/post_rc_production_monitoring_window_result_review_report.md",
  `${EVIDENCE_DIR}/monitoring_window_result_review.json`,
  `${EVIDENCE_DIR}/monitoring_window_duration_sample_review.json`,
  `${EVIDENCE_DIR}/monitoring_window_threshold_result_review.json`,
  `${EVIDENCE_DIR}/monitoring_window_redaction_result_review.json`,
  `${EVIDENCE_DIR}/monitoring_window_incident_rollback_result_review.json`,
  `${EVIDENCE_DIR}/production_monitoring_final_gate_preconditions.json`,
  `${EVIDENCE_DIR}/monitoring_window_result_claim_boundary.json`,
  `${EVIDENCE_DIR}/monitoring_window_result_blocker_update.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_monitoring_window_result_review.md",
  "docs/production_monitoring_final_gate_preconditions.md",
  "docs/next_production_monitoring_final_gate_plan.md"
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

function writeJsonOrKeepExisting(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) {
      return;
    }
    throw error;
  }
}

function writeTextOrKeepExisting(file, value) {
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) {
      return;
    }
    throw error;
  }
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runNodeScript(script, label) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
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

function guardrailCleanOrApprovedBaselineRefresh(status) {
  const lines = status.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const baselineLines = lines.filter((line) => line.includes("prompt-stack-v2/evidence/v36-baseline"));
  const forbiddenLines = lines.filter((line) => !line.includes("prompt-stack-v2/evidence/v36-baseline"));
  const refresh = readJsonIfExists("evidence/post-rc-v36-baseline-dependency-repair/v36_baseline_refresh_after_owner_approval.json");
  const approvedBaselineRefresh = refresh?.status === "pass" && refresh?.approval_phrase_verified === true;
  return {
    pass: status.exit_code === 0 && forbiddenLines.length === 0 && (baselineLines.length === 0 || approvedBaselineRefresh),
    detail: {
      ...status,
      approved_baseline_refresh: approvedBaselineRefresh,
      baseline_status_entries: baselineLines,
      forbidden_status_entries: forbiddenLines
    }
  };
}

function gateMarkdown(gate, checks) {
  return `# Production Monitoring Window Result Review Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Can enter production monitoring final gate: ${gate.can_enter_production_monitoring_final_gate}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

const review = runNodeScript("review_post_rc_production_monitoring_window_result.mjs", "review_post_rc_production_monitoring_window_result.mjs pass or blocked");
const audit = runNodeScript("audit_post_rc_production_monitoring_window_result_claims.mjs", "audit_post_rc_production_monitoring_window_result_claims.mjs pass");
const validate = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scan = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baseline = runNodeScript("compare_v36_baseline.mjs", "compare_v36_baseline.mjs pass");
const continuation = runNodeScript("check_post_rc_production_monitoring_window_continuation.mjs", "check_post_rc_production_monitoring_window_continuation.mjs pass");

const checks = [];
addCheck(checks, review.label,
  review.exit_code === 0 && ["pass", BLOCKED_STATUS].includes(review.status), {
  exit_code: review.exit_code,
  status: review.status
});
addCheck(checks, audit.label, audit.exit_code === 0 && audit.status === "pass", {
  exit_code: audit.exit_code,
  status: audit.status
});
for (const result of [validate, scan, baseline]) {
  addCheck(checks, result.label, result.exit_code === 0 && result.status === "pass", {
    exit_code: result.exit_code,
    status: result.status
  });
}
addCheck(checks, continuation.label,
  continuation.exit_code === 0 && ["pass", "ready_for_monitoring_window_result_review"].includes(continuation.status), {
  exit_code: continuation.exit_code,
  status: continuation.status
});

for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_result_review.json`);
const durationSample = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_duration_sample_review.json`);
const thresholdReview = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_threshold_result_review.json`);
const redactionReview = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_redaction_result_review.json`);
const incidentReview = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_incident_rollback_result_review.json`);
const finalPreconditions = readJsonIfExists(`${EVIDENCE_DIR}/production_monitoring_final_gate_preconditions.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_result_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_result_blocker_update.json`);
const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];

const requirementsMet = report?.duration_met === true && report?.sample_count_met === true;
addCheck(checks, "result review status follows duration/sample requirements",
  requirementsMet
    ? report?.status === "pass"
    : report?.status === BLOCKED_STATUS, {
  status: report?.status,
  duration_met: report?.duration_met,
  sample_count_met: report?.sample_count_met
});
addCheck(checks, "duration and sample review is accurate",
  durationSample?.duration_met === report?.duration_met
    && durationSample?.sample_count_met === report?.sample_count_met
    && durationSample?.manual_duration_increment === false
    && durationSample?.manual_sample_count_increment === false
    && durationSample?.synthetic_trace_generation === false, {
  elapsed_duration_hours: durationSample?.elapsed_duration_hours,
  sample_count: durationSample?.sample_count
});
addCheck(checks, "threshold result review passed when complete",
  requirementsMet
    ? thresholdReview?.status === "pass"
      && thresholdReview?.threshold_evaluation_complete === true
      && thresholdReview?.thresholds_passed === true
    : thresholdReview?.status === "incomplete", {
  status: thresholdReview?.status,
  thresholds_passed: thresholdReview?.thresholds_passed
});
addCheck(checks, "redaction result review passed",
  redactionReview?.status === "pass"
    && redactionReview?.redaction_failures === 0
    && redactionReview?.raw_payload_storage_violations === 0
    && redactionReview?.secret_logging_findings === 0
    && redactionReview?.auth_header_logged === false
    && redactionReview?.api_key_logged === false
    && redactionReview?.raw_payload_stored === false, {
  status: redactionReview?.status
});
addCheck(checks, "incident rollback review does not block final gate",
  incidentReview?.status === "pass"
    && incidentReview?.blocks_final_gate === false, {
  status: incidentReview?.status,
  blocks_final_gate: incidentReview?.blocks_final_gate
});
addCheck(checks, "final gate preconditions are ready only after complete window",
  requirementsMet
    ? finalPreconditions?.status === "ready_for_final_gate"
      && finalPreconditions?.can_enter_production_monitoring_final_gate === true
      && finalPreconditions?.can_claim_production_monitored === false
    : finalPreconditions?.status === "blocked"
      && finalPreconditions?.can_enter_production_monitoring_final_gate === false, {
  status: finalPreconditions?.status,
  can_enter_production_monitoring_final_gate: finalPreconditions?.can_enter_production_monitoring_final_gate
});
addCheck(checks, "forbidden execution flags remain false",
  report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.v36_modified === false
    && report?.dist_modified === false
    && report?.evidence_v36_baseline_modified === false, {
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution
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
addCheck(checks, "blocker update records final gate pending only when complete",
  requirementsMet
    ? blocker?.new_status === "monitoring_window_result_reviewed_final_gate_pending"
    : blocker?.new_status === "monitoring_window_requirements_still_pending", {
  new_status: blocker?.new_status
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
const guardrail = guardrailCleanOrApprovedBaselineRefresh(forbiddenStatus);
addCheck(checks, "guardrail paths remain clean",
  guardrail.pass, guardrail.detail);

const failures = checks.filter((check) => check.status !== "pass");
const passed = failures.length === 0;
const gateStatus = passed ? (requirementsMet ? "pass" : BLOCKED_STATUS) : "fail";
const gate = {
  status: gateStatus,
  stage: STAGE,
  can_enter_production_monitoring_final_gate: passed && finalPreconditions?.can_enter_production_monitoring_final_gate === true,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passed
    ? requirementsMet
      ? "Monitoring window result review passed. Final production monitoring gate remains required; production-monitored remains blocked."
      : "Monitoring window duration/sample requirements are not met."
    : "Monitoring window result review gate failed.",
  monitoring_window_completed: report?.monitoring_window_completed === true,
  duration_met: report?.duration_met === true,
  sample_count_met: report?.sample_count_met === true,
  thresholds_passed: report?.thresholds_passed === true,
  redaction_failures: report?.redaction_failures ?? null,
  raw_payload_storage_violations: report?.raw_payload_storage_violations ?? null,
  secret_logging_findings: report?.secret_logging_findings ?? null,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  checks,
  failures,
  claims_allowed_by_this_gate: passed && requirementsMet ? [
    "telemetry-connected",
    "post-rc-production-monitoring-window-result-reviewed",
    "post-rc-monitoring-window-duration-sample-validated",
    "post-rc-monitoring-window-threshold-results-reviewed",
    "post-rc-monitoring-window-redaction-results-reviewed",
    "post-rc-production-monitoring-final-gate-preconditions-recorded"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJsonOrKeepExisting(p(...`${EVIDENCE_DIR}/monitoring_window_result_gate_report.json`.split("/")), gate);
writeJsonOrKeepExisting(p("evals", "reports", "post_rc_production_monitoring_window_result_gate_report.json"), gate);
writeTextOrKeepExisting(p("evals", "reports", "post_rc_production_monitoring_window_result_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);
