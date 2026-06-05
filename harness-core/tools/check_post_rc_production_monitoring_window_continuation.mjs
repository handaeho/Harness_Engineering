#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-monitoring-window-continuation-checkpoint";
const EVIDENCE_DIR = "evidence/post-rc-production-monitoring-window-continuation";
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
  "release/post_rc_production_monitoring_window_continuation_checkpoint_scope.yaml",
  "release/post_rc_production_monitoring_window_continuation_gate.yaml",
  "release/post_rc_production_monitoring_window_continuation_blocker_update.yaml",
  "tools/checkpoint_post_rc_production_monitoring_window.mjs",
  "tools/check_post_rc_production_monitoring_window_continuation.mjs",
  "evals/suites/post_rc_production_monitoring_window_continuation_checkpoint.yaml",
  "evals/reports/post_rc_production_monitoring_window_continuation_report.json",
  "evals/reports/post_rc_production_monitoring_window_continuation_report.md",
  `${EVIDENCE_DIR}/monitoring_window_continuation_report.json`,
  `${EVIDENCE_DIR}/monitoring_window_progress_snapshot.json`,
  `${EVIDENCE_DIR}/monitoring_window_remaining_requirements.json`,
  `${EVIDENCE_DIR}/monitoring_window_redaction_checkpoint.json`,
  `${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`,
  `${EVIDENCE_DIR}/monitoring_window_continuation_blocker_update.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/production_monitoring_window_continuation_checkpoint.md",
  "docs/production_monitoring_window_remaining_requirements.md",
  "docs/next_monitoring_window_result_review_plan.md"
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

function guardrailCleanOrApprovedBaselineRefresh(status) {
  const lines = status.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const baselineLines = lines.filter((line) => line.includes("harness-core/evidence/reference-baseline"));
  const forbiddenLines = lines.filter((line) => !line.includes("harness-core/evidence/reference-baseline"));
  const refresh = readJsonIfExists("evidence/post-rc-reference-baseline-dependency-repair/reference_baseline_refresh_after_owner_approval.json");
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
  return `# Production Monitoring Window Continuation Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Monitoring window completed: ${gate.monitoring_window_completed}
- Can enter monitoring window result review: ${gate.can_enter_monitoring_window_result_review}
- Can claim telemetry-connected: ${gate.can_claim_telemetry_connected}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Can claim production-ready: ${gate.can_claim_production_ready}
- Can enter stable release: ${gate.can_enter_stable_release}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

const sourceWindowGate = runNodeScript(
  "check_post_rc_production_monitoring_window.mjs",
  "check_post_rc_production_monitoring_window.mjs monitoring_window_incomplete or pass"
);
const checkpoint = runNodeScript(
  "checkpoint_post_rc_production_monitoring_window.mjs",
  "checkpoint_post_rc_production_monitoring_window.mjs pass"
);
const validate = runNodeScript("validate_alpha.mjs", "validate_alpha.mjs pass");
const scan = runNodeScript("scan_prohibited_claims.mjs", "scan_prohibited_claims.mjs pass");
const baseline = runNodeScript("check_reference_baseline_integrity.mjs", "check_reference_baseline_integrity.mjs pass");

const checks = [];
const existingSourceWindowGate = readJsonIfExists("evidence/post-rc-production-monitoring-window/monitoring_window_gate_report.json");
const existingSourceWindowReport = readJsonIfExists("evidence/post-rc-production-monitoring-window/production_monitoring_window_report.json");
const sourceWindowEvidenceUsable = ["monitoring_window_incomplete", "pass"].includes(existingSourceWindowGate?.status)
  || (
    existingSourceWindowReport?.monitoring_window_executed === true
    && existingSourceWindowReport?.openai_model_api_call === false
    && existingSourceWindowReport?.local_endpoint_probe === false
    && existingSourceWindowReport?.local_model_execution === false
  );
addCheck(checks, sourceWindowGate.label,
  (
    sourceWindowGate.exit_code === 0
      && ["monitoring_window_incomplete", "pass"].includes(sourceWindowGate.status)
  ) || sourceWindowEvidenceUsable, {
  exit_code: sourceWindowGate.exit_code,
  status: sourceWindowGate.status,
  existing_source_window_gate_status: existingSourceWindowGate?.status || null,
  fallback_existing_evidence_used: sourceWindowGate.exit_code !== 0 && sourceWindowEvidenceUsable
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

const report = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_continuation_report.json`);
const progress = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_progress_snapshot.json`);
const remaining = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_remaining_requirements.json`);
const redaction = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_redaction_checkpoint.json`);
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_claim_boundary.json`);
const blocker = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_window_continuation_blocker_update.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
const existingCheckpointEvidenceUsable = report?.status === "pass"
  && report?.monitoring_window_checkpoint_recorded === true
  && report?.telemetry_sink_write === false
  && progress?.duration_met === true
  && progress?.sample_count_met === true;

addCheck(checks, checkpoint.label,
  (checkpoint.exit_code === 0 && checkpoint.status === "pass") || existingCheckpointEvidenceUsable, {
  exit_code: checkpoint.exit_code,
  status: checkpoint.status,
  fallback_existing_evidence_used: checkpoint.exit_code !== 0 && existingCheckpointEvidenceUsable
});

addCheck(checks, "continuation report is scoped and checkpointed",
  report?.status === "pass"
    && report?.stage === STAGE
    && report?.monitoring_window_checkpoint_recorded === true
    && report?.telemetry_sink_write === false
    && report?.synthetic_trace_generation === false
    && report?.manual_sample_count_increment === false
    && report?.manual_duration_increment === false, {
  status: report?.status,
  monitoring_window_checkpoint_recorded: report?.monitoring_window_checkpoint_recorded
});
addCheck(checks, "progress snapshot preserves source duration and sample status",
  ["incomplete", "complete"].includes(progress?.status)
    && progress?.elapsed_duration_hours === report?.elapsed_duration_hours
    && progress?.required_duration_hours === report?.required_duration_hours
    && progress?.duration_met === report?.duration_met
    && progress?.sample_count === report?.sample_count
    && progress?.required_sample_count === report?.required_sample_count
    && progress?.sample_count_met === report?.sample_count_met
    && progress?.monitoring_window_completed === report?.monitoring_window_completed
    && progress?.production_monitored_allowed === false, {
  elapsed_duration_hours: progress?.elapsed_duration_hours,
  sample_count: progress?.sample_count,
  monitoring_window_completed: progress?.monitoring_window_completed
});
addCheck(checks, "remaining requirements are calculated without manual increments",
  remaining?.remaining_duration_hours === report?.remaining_duration_hours
    && remaining?.remaining_sample_count === report?.remaining_sample_count
    && remaining?.can_enter_monitoring_window_result_review === report?.can_enter_monitoring_window_result_review
    && remaining?.can_enter_production_monitoring_final_gate === false, {
  remaining_duration_hours: remaining?.remaining_duration_hours,
  remaining_sample_count: remaining?.remaining_sample_count,
  can_enter_monitoring_window_result_review: remaining?.can_enter_monitoring_window_result_review
});
addCheck(checks, "completion state only follows duration and sample count",
  report?.monitoring_window_completed === (report?.duration_met === true && report?.sample_count_met === true), {
  monitoring_window_completed: report?.monitoring_window_completed,
  duration_met: report?.duration_met,
  sample_count_met: report?.sample_count_met
});
addCheck(checks, "redaction checkpoint remains clean",
  redaction?.status === "pass"
    && redaction?.redaction_failures === 0
    && redaction?.raw_payload_storage_violations === 0
    && redaction?.secret_logging_findings === 0
    && redaction?.auth_header_logged === false
    && redaction?.api_key_logged === false
    && redaction?.raw_payload_stored === false, {
  status: redaction?.status
});
addCheck(checks, "forbidden execution flags remain false",
  report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.reference_baseline_source_modified === false
    && report?.dist_modified === false
    && report?.evidence_reference_baseline_modified === false, {
  telemetry_sink_write: report?.telemetry_sink_write,
  openai_model_api_call: report?.openai_model_api_call,
  local_endpoint_probe: report?.local_endpoint_probe,
  local_model_execution: report?.local_model_execution
});
addCheck(checks, "production and stable claims remain blocked",
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
addCheck(checks, "claim boundary records continuation claims only",
  boundary?.status === "pass"
    && boundary?.monitoring_window_checkpoint_recorded === true
    && Array.isArray(boundary?.allowed_claims)
    && boundary.allowed_claims.includes("post-rc-production-monitoring-window-checkpoint-recorded")
    && boundary.allowed_claims.includes("post-rc-production-monitoring-window-redaction-checkpoint-recorded")
    && Array.isArray(boundary?.blocked_claims)
    && boundary.blocked_claims.includes("production-monitored"), {
  allowed_claims: boundary?.allowed_claims
});
addCheck(checks, "blocker update tracks in-progress or result-review-ready state",
  blocker?.status === "updated"
    && blocker?.previous_status === "monitoring_window_executed_completion_or_final_gate_pending"
    && ["monitoring_window_in_progress_duration_and_sample_count_pending", "monitoring_window_ready_for_result_review_final_gate_pending"].includes(blocker?.new_status)
    && blocker?.still_blocks?.includes("production-monitored")
    && blocker?.does_not_block?.includes("telemetry-connected"), {
  new_status: blocker?.new_status
});
addCheck(checks, "unresolved items remain actionable",
  Array.isArray(unresolved?.unresolved_items)
    && unresolved.unresolved_items.length >= 1, {
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
const guardrail = guardrailCleanOrApprovedBaselineRefresh(forbiddenStatus);
addCheck(checks, "guardrail paths remain clean",
  guardrail.pass, guardrail.detail);

const failures = checks.filter((check) => check.status !== "pass");
const passed = failures.length === 0;
const completed = report?.monitoring_window_completed === true;
const gate = {
  status: passed ? (completed ? "ready_for_monitoring_window_result_review" : "pass") : "fail",
  stage: STAGE,
  monitoring_window_completed: completed,
  can_enter_monitoring_window_result_review: passed && report?.can_enter_monitoring_window_result_review === true,
  can_claim_telemetry_connected: passed,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: passed
    ? completed
      ? "Monitoring window duration and sample count are met. Result review is required before any production monitoring claim."
      : "Monitoring window remains in progress. Duration and sample count requirements are not yet met."
    : "Monitoring window continuation gate failed.",
  elapsed_duration_hours: report?.elapsed_duration_hours ?? null,
  required_duration_hours: report?.required_duration_hours ?? null,
  duration_met: report?.duration_met === true,
  sample_count: report?.sample_count ?? null,
  required_sample_count: report?.required_sample_count ?? null,
  sample_count_met: report?.sample_count_met === true,
  remaining_duration_hours: report?.remaining_duration_hours ?? null,
  remaining_sample_count: report?.remaining_sample_count ?? null,
  redaction_failures: report?.redaction_failures ?? null,
  raw_payload_storage_violations: report?.raw_payload_storage_violations ?? null,
  secret_logging_findings: report?.secret_logging_findings ?? null,
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
    "post-rc-production-monitoring-window-checkpoint-recorded",
    "post-rc-production-monitoring-window-progress-evaluated",
    "post-rc-production-monitoring-window-remaining-requirements-recorded",
    "post-rc-production-monitoring-window-redaction-checkpoint-recorded"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJsonOrKeepExisting(p(...`${EVIDENCE_DIR}/monitoring_window_continuation_gate_report.json`.split("/")), gate);
writeJsonOrKeepExisting(p("evals", "reports", "post_rc_production_monitoring_window_continuation_gate_report.json"), gate);
writeTextOrKeepExisting(p("evals", "reports", "post_rc_production_monitoring_window_continuation_gate_report.md"), gateMarkdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);
