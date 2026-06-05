#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-dependency-repair-for-monitoring-result-review";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-dependency-repair";
const BLOCKED_STATUS = "blocked_by_v36_baseline_dependency";
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
  "release/post_rc_v36_baseline_dependency_repair_scope.yaml",
  "release/post_rc_monitoring_result_review_blocker_update.yaml",
  "release/post_rc_v36_baseline_repair_decision_request.yaml",
  "tools/triage_post_rc_v36_baseline_dependency.mjs",
  "tools/check_post_rc_v36_baseline_dependency_repair.mjs",
  "evals/suites/post_rc_v36_baseline_dependency_repair.yaml",
  "evals/reports/post_rc_v36_baseline_dependency_repair_report.json",
  "evals/reports/post_rc_v36_baseline_dependency_repair_report.md",
  `${EVIDENCE_DIR}/v36_baseline_dependency_repair_report.json`,
  `${EVIDENCE_DIR}/v36_baseline_dependency_repair_report.md`,
  `${EVIDENCE_DIR}/current_compare_v36_failure_snapshot.json`,
  `${EVIDENCE_DIR}/previous_owner_approved_refresh_comparison.json`,
  `${EVIDENCE_DIR}/v36_baseline_hash_source_comparison.json`,
  `${EVIDENCE_DIR}/v36_git_guardrail_status.json`,
  `${EVIDENCE_DIR}/compare_script_path_cwd_analysis.json`,
  `${EVIDENCE_DIR}/monitoring_result_review_gate_resume_attempt.json`,
  `${EVIDENCE_DIR}/monitoring_result_review_status_correction.json`,
  `${EVIDENCE_DIR}/v36_baseline_repair_decision_request.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/post_rc_v36_baseline_dependency_repair.md",
  "docs/monitoring_result_review_gate_resume_after_v36_repair.md",
  "docs/next_production_monitoring_final_gate_plan.md"
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
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function runNodeScript(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024
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
    stdout_excerpt: (result.stdout || "").trim().slice(0, 4000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 4000)
  };
}

function runGitStatus() {
  const result = spawnSync("git", [
    "status",
    "--short",
    "--",
    "prompt-stack/v36",
    "dist",
    "harness-core/evidence/v36-baseline"
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
  const baselineLines = lines.filter((line) => line.includes("harness-core/evidence/v36-baseline"));
  const forbiddenLines = lines.filter((line) => !line.includes("harness-core/evidence/v36-baseline"));
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function markdown(gate, checks) {
  return `# V36 Baseline Dependency Repair Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Compare status: ${gate.compare_v36_baseline_status}
- Continuation gate status: ${gate.continuation_gate_status}
- Result review gate status: ${gate.result_review_gate_status}
- Owner decision required: ${gate.owner_decision_required}
- Can enter production monitoring final gate: ${gate.can_enter_production_monitoring_final_gate}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Reason: ${gate.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
}

const triage = runNodeScript("triage_post_rc_v36_baseline_dependency.mjs");
const validate = runNodeScript("validate_alpha.mjs");
const scan = runNodeScript("scan_prohibited_claims.mjs");

const checks = [];
addCheck(checks, "triage_post_rc_v36_baseline_dependency.mjs completed",
  triage.exit_code === 0 && ["pass", BLOCKED_STATUS].includes(triage.status), {
  exit_code: triage.exit_code,
  status: triage.status
});
addCheck(checks, "validate_alpha.mjs pass",
  validate.exit_code === 0 && validate.status === "pass", {
  exit_code: validate.exit_code,
  status: validate.status
});
addCheck(checks, "scan_prohibited_claims.mjs pass",
  scan.exit_code === 0 && scan.status === "pass", {
  exit_code: scan.exit_code,
  status: scan.status
});

for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_dependency_repair_report.json`);
const failureSnapshot = readJsonIfExists(`${EVIDENCE_DIR}/current_compare_v36_failure_snapshot.json`);
const previousRefresh = readJsonIfExists(`${EVIDENCE_DIR}/previous_owner_approved_refresh_comparison.json`);
const hashComparison = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_hash_source_comparison.json`);
const guardrail = readJsonIfExists(`${EVIDENCE_DIR}/v36_git_guardrail_status.json`);
const pathCwd = readJsonIfExists(`${EVIDENCE_DIR}/compare_script_path_cwd_analysis.json`);
const statusCorrection = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_result_review_status_correction.json`);
const decision = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_repair_decision_request.json`);
const resume = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_result_review_gate_resume_attempt.json`);
const unresolved = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const refresh = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.json`);
const approvedBaselineRefresh = refresh?.status === "pass" && refresh?.approval_phrase_verified === true;

addCheck(checks, "current compare v36 failure snapshot is captured",
  failureSnapshot?.source_check === "compare_v36_baseline.mjs"
    && failureSnapshot?.captured_at_stage === STAGE
    && typeof failureSnapshot?.unresolved_items_count === "number"
    && typeof failureSnapshot?.current_snapshot_mismatch_count === "number", {
  status: failureSnapshot?.status,
  unresolved_items_count: failureSnapshot?.unresolved_items_count,
  current_snapshot_mismatch_count: failureSnapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "previous owner-approved refresh comparison is recorded",
  ["pass", "mismatch", "missing_evidence"].includes(previousRefresh?.status)
    && previousRefresh?.previous_refresh_stage === "v2.0.0-rc.1-v36-baseline-refresh-after-owner-approval"
    && typeof previousRefresh?.previous_refresh_evidence_exists === "boolean", {
  status: previousRefresh?.status,
  previous_refresh_evidence_exists: previousRefresh?.previous_refresh_evidence_exists
});
addCheck(checks, "v36 baseline hash source comparison is recorded",
  ["pass", "mismatch"].includes(hashComparison?.status)
    && Array.isArray(hashComparison?.mismatches), {
  status: hashComparison?.status,
  mismatch_count: Array.isArray(hashComparison?.mismatches) ? hashComparison.mismatches.length : null
});
addCheck(checks, "v36 git guardrail status is clean",
  guardrail?.prompt_stack_v36_dirty === false
    && guardrail?.dist_dirty === false
    && (guardrail?.evidence_v36_baseline_dirty === false || approvedBaselineRefresh)
    && Array.isArray(guardrail?.modified_files)
    && guardrail.modified_files.every((line) => line.includes("harness-core/evidence/v36-baseline")), {
  prompt_stack_v36_dirty: guardrail?.prompt_stack_v36_dirty,
  dist_dirty: guardrail?.dist_dirty,
  evidence_v36_baseline_dirty: guardrail?.evidence_v36_baseline_dirty,
  approved_baseline_refresh: approvedBaselineRefresh
});
addCheck(checks, "compare script path and cwd analysis is clean",
  pathCwd?.status === "pass"
    && pathCwd?.script_path === "tools/compare_v36_baseline.mjs"
    && pathCwd?.path_resolution_consistent === true, {
  status: pathCwd?.status,
  cwd_used: pathCwd?.cwd_used
});
addCheck(checks, "monitoring result review status correction is recorded",
  ["pass", "still_blocked_by_v36_baseline_dependency"].includes(statusCorrection?.corrected_status)
    && statusCorrection?.production_monitored_allowed === false, {
  corrected_status: statusCorrection?.corrected_status,
  compare_v36_baseline_status: statusCorrection?.compare_v36_baseline_status
});
addCheck(checks, "decision request is recorded when unrepaired",
  report?.status === "pass"
    ? decision?.status === "not_required"
    : decision?.status === "owner_decision_required"
      && decision?.recommended_option === "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval", {
  status: decision?.status,
  recommended_option: decision?.recommended_option
});
addCheck(checks, "resume attempt records gate dependency state",
  ["pass", BLOCKED_STATUS].includes(resume?.status)
    && resume?.production_monitored_allowed === false, {
  status: resume?.status,
  continuation_gate_status: resume?.continuation_gate_status,
  result_review_gate_status: resume?.result_review_gate_status
});
addCheck(checks, "unresolved items match owner-decision state",
  report?.owner_decision_required === true
    ? unresolved?.status === "owner_decision_required"
    : unresolved?.status === "none", {
  status: unresolved?.status
});
addCheck(checks, "forbidden execution and stronger claim flags remain false",
  report?.v36_modified === false
    && report?.dist_modified === false
    && (report?.baseline_refresh_performed === false || approvedBaselineRefresh)
    && report?.telemetry_sink_write === false
    && report?.openai_model_api_call === false
    && report?.local_endpoint_probe === false
    && report?.local_model_execution === false
    && report?.production_monitored_allowed === false
    && report?.production_ready_allowed === false
    && report?.stable_allowed === false
    && report?.provider_diverse_allowed === false, {
  v36_modified: report?.v36_modified,
  evidence_v36_baseline_modified: report?.evidence_v36_baseline_modified,
  telemetry_sink_write: report?.telemetry_sink_write
});

const forbiddenStatus = runGitStatus();
const guardrailCheck = guardrailCleanOrApprovedBaselineRefresh(forbiddenStatus);
addCheck(checks, "guardrail paths remain clean",
  guardrailCheck.pass, guardrailCheck.detail);

const failures = checks.filter((check) => check.status !== "pass");
const repaired = failures.length === 0 && report?.status === "pass";
const blocked = failures.length === 0 && report?.status === BLOCKED_STATUS;
const gateStatus = repaired ? "pass" : blocked ? BLOCKED_STATUS : "fail";
const gate = {
  status: gateStatus,
  stage: STAGE,
  compare_v36_baseline_status: report?.compare_v36_baseline_status_after || "unknown",
  continuation_gate_status: report?.continuation_gate_status || "unknown",
  result_review_gate_status: report?.result_review_gate_status || "unknown",
  can_enter_production_monitoring_final_gate: repaired,
  owner_decision_required: report?.owner_decision_required === true,
  can_claim_production_monitored: false,
  can_claim_production_ready: false,
  can_enter_stable_release: false,
  reason: repaired
    ? "v36 baseline dependency was repaired without modifying v36. Monitoring result review gate now passes."
    : blocked
      ? "v36 baseline dependency still blocks monitoring result review."
      : "v36 baseline dependency repair gate failed.",
  root_cause: report?.root_cause || null,
  repair_performed: report?.repair_performed === true,
  v36_modified: false,
  dist_modified: false,
  evidence_v36_baseline_modified: report?.evidence_v36_baseline_modified === true,
  baseline_refresh_performed: report?.baseline_refresh_performed === true,
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
  claims_allowed_by_this_gate: gateStatus !== "fail" ? [
    "post-rc-v36-baseline-dependency-triaged",
    "post-rc-v36-baseline-repair-decision-recorded",
    "post-rc-monitoring-result-review-resume-attempted"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_dependency_repair_gate_report.json`.split("/")), gate);
writeJson(p("evals", "reports", "post_rc_v36_baseline_dependency_repair_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_v36_baseline_dependency_repair_gate_report.md"), markdown(gate, checks));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "fail" ? 1 : 0);
