#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-refresh-for-monitoring-result-review-after-owner-approval";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review";
const REQUIRED_FILES = [
  "release/post_rc_v36_baseline_refresh_for_monitoring_scope.yaml",
  "release/post_rc_v36_baseline_refresh_owner_approval.yaml",
  "release/post_rc_monitoring_result_review_resume_after_v36_refresh.yaml",
  "tools/refresh_post_rc_v36_baseline_for_monitoring_result_review.mjs",
  "tools/audit_post_rc_v36_baseline_refresh_delta.mjs",
  "tools/check_post_rc_v36_baseline_refresh_for_monitoring_result_review.mjs",
  "evals/suites/post_rc_v36_baseline_refresh_for_monitoring_result_review.yaml",
  "evals/reports/post_rc_v36_baseline_refresh_report.json",
  "evals/reports/post_rc_v36_baseline_refresh_report.md",
  "evals/reports/post_rc_v36_baseline_refresh_delta_report.json",
  "evals/reports/post_rc_v36_baseline_refresh_delta_report.md",
  "evals/reports/post_rc_monitoring_result_review_resume_report.json",
  "evals/reports/post_rc_monitoring_result_review_resume_report.md",
  "evals/reports/post_rc_v36_baseline_refresh_gate_report.json",
  "evals/reports/post_rc_v36_baseline_refresh_gate_report.md",
  `${EVIDENCE_DIR}/owner_approval_record.json`,
  `${EVIDENCE_DIR}/pre_refresh_compare_snapshot.json`,
  `${EVIDENCE_DIR}/post_refresh_compare_snapshot.json`,
  `${EVIDENCE_DIR}/v36_baseline_refresh_report.json`,
  `${EVIDENCE_DIR}/v36_baseline_refresh_delta.json`,
  `${EVIDENCE_DIR}/v36_baseline_refresh_file_inventory_delta.json`,
  `${EVIDENCE_DIR}/compare_v36_baseline_after_refresh.json`,
  `${EVIDENCE_DIR}/monitoring_continuation_gate_after_refresh.json`,
  `${EVIDENCE_DIR}/monitoring_result_review_gate_after_refresh.json`,
  `${EVIDENCE_DIR}/monitoring_result_review_resume_report.json`,
  `${EVIDENCE_DIR}/post_rc_v36_baseline_refresh_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/post_rc_v36_baseline_refresh_for_monitoring_result_review.md",
  "docs/post_rc_v36_baseline_refresh_delta.md",
  "docs/monitoring_result_review_resume_after_v36_refresh.md",
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
  return `# Post-RC V36 Baseline Refresh Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Baseline refresh performed: ${gate.baseline_refresh_performed}
- v36 modified: ${gate.v36_modified}
- dist modified: ${gate.dist_modified}
- Compare status: ${gate.compare_v36_baseline_status}
- Post refresh mismatch count: ${gate.post_refresh_mismatch_count}
- Monitoring result review gate status: ${gate.monitoring_result_review_gate_status}
- Can enter production monitoring final gate: ${gate.can_enter_production_monitoring_final_gate}
- Can claim production-monitored: ${gate.can_claim_production_monitored}
- Reason: ${gate.reason}
`;
}

const validate = runNode("validate_alpha.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const compare = runNode("compare_v36_baseline.mjs");
const continuation = runNode("check_post_rc_production_monitoring_window_continuation.mjs");
const resultReview = runNode("check_post_rc_production_monitoring_window_result_review.mjs");
const audit = runNode("audit_post_rc_v36_baseline_refresh_delta.mjs");

const approval = readJsonIfExists(`${EVIDENCE_DIR}/owner_approval_record.json`);
const refresh = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_refresh_report.json`);
const delta = readJsonIfExists(`${EVIDENCE_DIR}/v36_baseline_refresh_delta.json`);
const compareAfter = readJsonIfExists(`${EVIDENCE_DIR}/compare_v36_baseline_after_refresh.json`);
const continuationAfter = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_continuation_gate_after_refresh.json`);
const resultReviewAfter = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_result_review_gate_after_refresh.json`);
const resume = readJsonIfExists(`${EVIDENCE_DIR}/monitoring_result_review_resume_report.json`);
const stageGate = readJsonIfExists(`${EVIDENCE_DIR}/post_rc_v36_baseline_refresh_gate_report.json`);

const checks = [];
for (const result of [validate, scan, compare, audit]) {
  addCheck(checks, `${result.script} pass`, result.exit_code === 0 && result.status === "pass", {
    exit_code: result.exit_code,
    status: result.status
  });
}
addCheck(checks, "check_post_rc_production_monitoring_window_continuation.mjs rerun",
  continuation.exit_code === 0 && ["pass", "ready_for_monitoring_window_result_review"].includes(continuation.status), {
  exit_code: continuation.exit_code,
  status: continuation.status
});
addCheck(checks, "check_post_rc_production_monitoring_window_result_review.mjs pass",
  resultReview.exit_code === 0 && resultReview.status === "pass", {
  exit_code: resultReview.exit_code,
  status: resultReview.status
});

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "owner approval record matches required phrase",
  approval?.status === "pass" && approval?.approval_phrase_matched === true, {
  status: approval?.status,
  approval_phrase_matched: approval?.approval_phrase_matched
});
addCheck(checks, "baseline refresh report passed",
  refresh?.status === "pass"
    && refresh?.baseline_refresh_performed === true
    && refresh?.v36_modified === false
    && refresh?.dist_modified === false
    && refresh?.openai_model_api_call === false
    && refresh?.local_endpoint_probe === false
    && refresh?.telemetry_sink_write === false
    && refresh?.file_inventory_refreshed === true
    && refresh?.checksums_refreshed === true, refresh || {});
addCheck(checks, "refresh delta records restored compare",
  delta?.status === "recorded"
    && delta?.previous_mismatch_count === 10
    && delta?.post_refresh_mismatch_count === 0
    && delta?.files_with_hash_changes === 10, delta || {});
addCheck(checks, "compare after refresh passed",
  compareAfter?.status === "pass"
    && compareAfter?.post_refresh_mismatch_count === 0
    && compareAfter?.unresolved_items_count === 0
    && compareAfter?.baseline_refresh_effective === true, compareAfter || {});
addCheck(checks, "monitoring continuation gate after refresh passed",
  continuationAfter?.status === "pass"
    && continuationAfter?.baseline_dependency_resolved === true
    && continuationAfter?.monitoring_window_completed === true
    && continuationAfter?.duration_met === true
    && continuationAfter?.sample_count_met === true, continuationAfter || {});
addCheck(checks, "monitoring result review gate after refresh passed",
  resultReviewAfter?.status === "pass"
    && resultReviewAfter?.baseline_dependency_resolved === true
    && resultReviewAfter?.can_enter_production_monitoring_final_gate === true
    && resultReviewAfter?.production_monitored_allowed === false, resultReviewAfter || {});
addCheck(checks, "monitoring result review resume report passed",
  resume?.status === "pass"
    && resume?.corrected_status === "pass"
    && resume?.compare_v36_baseline_status === "pass"
    && resume?.continuation_gate_status === "pass"
    && resume?.result_review_gate_status === "pass"
    && resume?.can_enter_production_monitoring_final_gate === true
    && resume?.production_monitored_allowed === false
    && resume?.production_ready_allowed === false
    && resume?.stable_allowed === false
    && resume?.provider_diverse_allowed === false, resume || {});
addCheck(checks, "stage gate report passed",
  stageGate?.status === "pass"
    && stageGate?.baseline_refresh_performed === true
    && stageGate?.can_enter_production_monitoring_final_gate === true
    && stageGate?.can_claim_production_monitored === false, stageGate || {});

const forbiddenStatus = gitStatus(["prompt-stack/v36", "dist"]);
addCheck(checks, "prompt-stack/v36 and dist remain clean",
  forbiddenStatus.exit_code === 0 && forbiddenStatus.stdout === "", forbiddenStatus);

const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
addCheck(checks, "evidence/v36-baseline changed under owner-approved refresh",
  baselineStatus.exit_code === 0 && baselineStatus.stdout.includes("prompt-stack-v2/evidence/v36-baseline"), baselineStatus);

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
addCheck(checks, "stable / production-ready / production-monitored / provider-diverse positive claims absent",
  scanMatches.filter((match) => [
    "stable",
    "production-ready",
    "production-monitored",
    "provider-diverse"
  ].includes(match.claim)).length === 0, {
  match_count: scanMatches.length
});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  baseline_refresh_performed: refresh?.baseline_refresh_performed === true,
  v36_modified: false,
  dist_modified: false,
  compare_v36_baseline_status: compare.status,
  post_refresh_mismatch_count: compareAfter?.post_refresh_mismatch_count ?? null,
  monitoring_result_review_gate_status: resultReviewAfter?.status || resultReview.status,
  can_enter_production_monitoring_final_gate: resume?.can_enter_production_monitoring_final_gate === true,
  can_claim_production_monitored: false,
  reason: failures.length === 0
    ? "Owner-approved v36 baseline refresh resolved monitoring result-review dependency without modifying v36."
    : "Owner-approved v36 baseline refresh gate failed.",
  checks,
  failures
};

writeJson(p(...EVIDENCE_DIR.split("/"), "post_rc_v36_baseline_refresh_gate_report.json"), gate);
writeJson(p("evals", "reports", "post_rc_v36_baseline_refresh_gate_report.json"), gate);
writeText(p("evals", "reports", "post_rc_v36_baseline_refresh_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
