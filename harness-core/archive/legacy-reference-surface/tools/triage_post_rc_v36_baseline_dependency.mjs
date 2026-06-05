#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { ensureDir, readJson, writeJson, writeText, walkFiles, relativeTo } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-dependency-repair-for-monitoring-result-review";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-dependency-repair";
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
const v36Root = path.join(workspaceRoot, "prompt-stack", "v36");

function p(...parts) {
  return path.join(root, ...parts);
}

function workspacePath(...parts) {
  return path.join(workspaceRoot, ...parts);
}

function posixRel(file) {
  return relativeTo(root, file);
}

function readJsonIfExists(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function parseGitShort(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findPreviousRefreshEvidence() {
  const needle = "v2.0.0-rc.1-v36-baseline-refresh-after-owner-approval";
  const roots = ["evidence", "release", "docs", "evals"].map((rel) => p(rel)).filter((dir) => fs.existsSync(dir));
  const matches = [];
  for (const searchRoot of roots) {
    for (const file of walkFiles(searchRoot, {
      excludedPaths: [],
      extensions: [".json", ".md", ".yaml", ".yml", ".txt"]
    })) {
      const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
      if (text.includes(needle)) {
        const rel = posixRel(file);
        if (!rel.startsWith(`${EVIDENCE_DIR}/`)
          && !rel.startsWith("release/post_rc_v36_baseline_dependency_repair")
          && !rel.startsWith("docs/post_rc_v36_baseline_dependency_repair")
          && !rel.startsWith("evals/reports/post_rc_v36_baseline_dependency_repair")) {
          matches.push(rel);
        }
      }
    }
  }
  return matches.sort();
}

function latestV36Commit() {
  const result = runGit([
    "log",
    "-1",
    "--format=%H%n%s%n%cI",
    "--name-only",
    "--",
    "prompt-stack/v36"
  ]);
  const lines = result.stdout.split(/\r?\n/).filter((line) => line.length > 0);
  if (result.exit_code !== 0 || lines.length < 3) {
    return {
      status: "unknown",
      exit_code: result.exit_code,
      stderr: result.stderr
    };
  }
  return {
    status: "found",
    commit: lines[0],
    subject: lines[1],
    committed_at: lines[2],
    changed_paths: lines.slice(3)
  };
}

function buildHashComparison(compareReport) {
  const checksums = readJsonIfExists(p("evidence", "v36-baseline", "checksums.json"));
  const baselineByPath = new Map((checksums?.files || []).map((entry) => [
    entry.path.replace(/^prompt-stack\//, "").replace(/\\/g, "/"),
    entry
  ]));
  const unresolved = readJsonIfExists(p("evidence", "alpha", "unresolved_items.json")) || [];
  const mismatchPaths = unresolved
    .filter((item) => item.explanation === "current_hash_differs_from_alpha_snapshot")
    .map((item) => item.path)
    .sort();

  const mismatches = mismatchPaths.map((v36Path) => {
    const rel = v36Path.replace(/^v36\//, "");
    const file = path.join(v36Root, ...rel.split("/"));
    const baseline = baselineByPath.get(v36Path);
    return {
      path: v36Path,
      baseline_sha256: baseline?.sha256 || null,
      current_sha256: fs.existsSync(file) ? sha256(file) : null,
      current_file_exists: fs.existsSync(file)
    };
  });

  return {
    status: mismatches.length > 0 ? "mismatch" : "pass",
    baseline_path: "harness-core/evidence/v36-baseline/checksums.json",
    current_v36_path: "prompt-stack/v36",
    current_snapshot_mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? mismatches.length,
    mismatches,
    latest_v36_commit: latestV36Commit(),
    interpretation: mismatches.length > 0
      ? "current_v36_changed_after_v36_baseline_snapshot_or_baseline_snapshot_not_refreshed"
      : "no_current_v36_hash_mismatch"
  };
}

function writeStaticFiles() {
  writeText(p("release", "post_rc_v36_baseline_dependency_repair_scope.yaml"), `stage: ${STAGE}

approved_actions:
  v36_baseline_dependency_triage: true
  compare_v36_failure_analysis: true
  previous_refresh_evidence_comparison: true
  compare_script_path_cwd_analysis: true
  safe_checker_dependency_repair: true
  monitoring_result_review_gate_resume_attempt: true
  blocker_update: true
  decision_request_generation: true

forbidden_actions:
  v36_modification: true
  dist_modification: true
  evidence_v36_baseline_refresh_without_owner_approval: true
  evidence_v36_baseline_overwrite_without_owner_approval: true
  v36_restore: true
  synthetic_trace_generation: true
  telemetry_sink_write: true
  openai_model_api_call: true
  openai_provider_call: true
  local_endpoint_probe: true
  local_model_execution: true
  production_deployment: true
  production_monitored_claim: true
  production_ready_claim: true
  stable_claim: true
  provider_diverse_claim: true
  local_model_verified_claim: true
  bare_release_gated_claim: true

claims_allowed:
  - post-rc-v36-baseline-dependency-triaged
  - post-rc-v36-baseline-repair-decision-recorded
  - post-rc-monitoring-result-review-resume-attempted

claims_conditionally_allowed_after_gate_pass:
  - post-rc-production-monitoring-window-result-reviewed
  - post-rc-monitoring-window-duration-sample-validated
  - post-rc-monitoring-window-threshold-results-reviewed
  - post-rc-monitoring-window-redaction-results-reviewed
  - post-rc-production-monitoring-final-gate-preconditions-recorded

claims_not_allowed:
  - production-monitored
  - production-ready
  - stable
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - release-gated
`);

  writeText(p("evals", "suites", "post_rc_v36_baseline_dependency_repair.yaml"), `suite: post_rc_v36_baseline_dependency_repair
stage: ${STAGE}
checks:
  - compare_v36_failure_snapshot_exists
  - previous_refresh_evidence_comparison_exists
  - v36_git_guardrail_status_clean
  - compare_script_path_cwd_analysis_exists
  - monitoring_result_review_status_correction_exists
  - owner_decision_request_recorded_when_unrepaired
forbidden:
  - v36_modification
  - dist_modification
  - evidence_v36_baseline_refresh_without_owner_approval
  - telemetry_sink_write
  - openai_model_api_call
  - local_endpoint_probe
  - production_monitored_claim
`);
}

function markdownReport(report) {
  return `# V36 Baseline Dependency Repair

Status: ${report.status}

- Stage: ${report.stage}
- Root cause: ${report.root_cause}
- Repair performed: ${report.repair_performed}
- Owner decision required: ${report.owner_decision_required}
- Compare status before: ${report.compare_v36_baseline_status_before}
- Compare status after: ${report.compare_v36_baseline_status_after}
- Can enter production monitoring final gate: ${report.can_enter_production_monitoring_final_gate}

## Boundary

- v36 modified: ${report.v36_modified}
- dist modified: ${report.dist_modified}
- evidence/v36-baseline modified: ${report.evidence_v36_baseline_modified}
- baseline refresh performed: ${report.baseline_refresh_performed}
- telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- local endpoint probe: ${report.local_endpoint_probe}
`;
}

function writeDocs(report, decisionRequest) {
  writeText(p("docs", "post_rc_v36_baseline_dependency_repair.md"), markdownReport(report));
  writeText(p("docs", "monitoring_result_review_gate_resume_after_v36_repair.md"), `# Monitoring Result Review Gate Resume After V36 Repair

Status: ${report.status}

Monitoring result evidence remains usable, but the overall gate cannot be promoted while the v36 baseline dependency is unresolved.

- Continuation gate status: ${report.continuation_gate_status}
- Result review gate status: ${report.result_review_gate_status}
- Can enter production monitoring final gate: ${report.can_enter_production_monitoring_final_gate}
- Owner decision required: ${report.owner_decision_required}
`);
  writeText(p("docs", "next_production_monitoring_final_gate_plan.md"), `# Next Production Monitoring Final Gate Plan

Current blocker: ${report.status}

The monitoring window result evidence reached the duration and sample thresholds. The next final gate remains blocked until the v36 baseline dependency is resolved.

Required before final gate:
- resolve v36 baseline dependency through owner decision
- rerun compare_v36_baseline.mjs
- rerun monitoring window continuation gate
- rerun monitoring window result review gate

Still not allowed:
- production-monitored
- production-ready
- stable
- provider-diverse
- local-model-verified
`);
  writeText(p("release", "post_rc_v36_baseline_repair_decision_request.yaml"), `status: ${decisionRequest.status}
reason: "${decisionRequest.reason}"
recommended_option: ${decisionRequest.recommended_option}
options:
${decisionRequest.options.map((option) => `  - ${option}`).join("\n")}
`);
}

writeStaticFiles();

const compareBefore = runNodeScript("compare_v36_baseline.mjs");
const compareReport = compareBefore.parsed || readJsonIfExists(p("evidence", "alpha", "baseline_comparison.json"));
const refreshReport = readJsonIfExists(p(...`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.json`.split("/")));
const unresolved = readJsonIfExists(p("evidence", "alpha", "unresolved_items.json")) || [];
const guardrailStatusRaw = runGit([
  "status",
  "--short",
  "--",
  "prompt-stack/v36",
  "dist",
  "harness-core/evidence/v36-baseline"
]);
const guardrailModified = parseGitShort(guardrailStatusRaw.stdout);
const previousRefreshMatches = findPreviousRefreshEvidence();
const hashComparison = buildHashComparison(compareReport);

const pathCwdAnalysis = {
  status: "pass",
  cwd_used: workspaceRoot,
  script_path: "tools/compare_v36_baseline.mjs",
  resolved_v36_path: v36Root,
  resolved_baseline_path: p("evidence", "v36-baseline"),
  path_resolution_consistent: fs.existsSync(v36Root) && fs.existsSync(p("evidence", "v36-baseline", "checksums.json")),
  findings: []
};
if (!pathCwdAnalysis.path_resolution_consistent) {
  pathCwdAnalysis.status = "issue_found";
  pathCwdAnalysis.findings.push("Expected v36 or baseline path does not exist.");
}

const previousRefreshComparison = {
  status: previousRefreshMatches.length > 0 ? "mismatch" : "missing_evidence",
  previous_refresh_stage: "v2.0.0-rc.1-v36-baseline-refresh-after-owner-approval",
  previous_refresh_evidence_exists: previousRefreshMatches.length > 0,
  previous_refresh_evidence_paths: previousRefreshMatches,
  previous_post_refresh_mismatch_count: previousRefreshMatches.length > 0 ? null : null,
  current_compare_mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? unresolved.length,
  interpretation: previousRefreshMatches.length > 0
    ? "requires_owner_decision"
    : "baseline_refresh_evidence_missing_in_current_workspace_or_not_indexed"
};

const currentCompareSnapshot = {
  status: compareBefore.status,
  source_check: "compare_v36_baseline.mjs",
  captured_at_stage: STAGE,
  unresolved_items_count: compareReport?.unresolved_items_count ?? unresolved.length,
  current_snapshot_mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? unresolved.length,
  existing_record_mismatch_count: compareReport?.existing_v36_checksum_record?.mismatch_count ?? null,
  mismatch_paths: unresolved.map((item) => item.path).sort(),
  notes: [
    "compare_v36_baseline.mjs executed without modifying v36 or evidence/v36-baseline.",
    "Mismatch is between current prompt-stack/v36 files and harness-core/evidence/v36-baseline/checksums.json."
  ]
};

const v36Guardrail = {
  prompt_stack_v36_dirty: guardrailModified.some((line) => line.includes("prompt-stack/v36")),
  dist_dirty: guardrailModified.some((line) => line.includes("dist")),
  evidence_v36_baseline_dirty: guardrailModified.some((line) => line.includes("harness-core/evidence/v36-baseline")),
  modified_files: guardrailModified,
  notes: guardrailModified.length === 0
    ? ["Guardrail paths are clean in git status."]
    : ["Guardrail paths have git status entries and must not be changed in this stage."]
};

const rootCause = compareBefore.status === "pass"
  ? "resolved_after_owner_approved_v36_baseline_refresh"
  : hashComparison.status === "mismatch"
  ? "current_v36_hashes_differ_from_v36_baseline_snapshot_after_v36_commit"
  : pathCwdAnalysis.status === "issue_found"
    ? "compare_script_path_or_cwd_issue"
    : "unknown";
const safeRepairPossible = rootCause === "compare_script_path_or_cwd_issue";
const repairPerformed = refreshReport?.status === "pass" && refreshReport?.baseline_refresh_performed === true;

let continuationGate = {
  script: "check_post_rc_production_monitoring_window_continuation.mjs",
  exit_code: null,
  status: "not_run_because_baseline_dependency_unrepaired"
};
let resultReviewGate = {
  script: "check_post_rc_production_monitoring_window_result_review.mjs",
  exit_code: null,
  status: "not_run_because_baseline_dependency_unrepaired"
};
if (compareBefore.status === "pass" || !safeRepairPossible) {
  continuationGate = runNodeScript("check_post_rc_production_monitoring_window_continuation.mjs");
  resultReviewGate = runNodeScript("check_post_rc_production_monitoring_window_result_review.mjs");
}

const repaired = compareBefore.status === "pass"
  && ["pass", "ready_for_monitoring_window_result_review"].includes(continuationGate.status)
  && resultReviewGate.status === "pass";
const compareAfterStatus = repaired ? "pass" : compareBefore.status;
const ownerDecisionRequired = !repaired;
const decisionRequest = {
  status: ownerDecisionRequired ? "owner_decision_required" : "not_required",
  reason: ownerDecisionRequired
    ? "Current v36 files differ from harness-core/evidence/v36-baseline while guardrail paths are clean; refreshing or restoring the baseline requires owner approval."
    : "No owner decision is required because the dependency was repaired without baseline refresh.",
  options: [
    "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval",
    "fix_compare_script_or_hashing_rules",
    "restore_v36_to_accepted_baseline_after_owner_approval",
    "keep_blocked"
  ],
  recommended_option: ownerDecisionRequired
    ? "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval"
    : "not_required"
};

const statusCorrection = repaired
  ? {
    previous_status: "blocked_by_v36_baseline_dependency",
    corrected_status: "pass",
    compare_v36_baseline_status: "pass",
    continuation_gate_status: continuationGate.status,
    result_review_gate_status: resultReviewGate.status,
    can_enter_production_monitoring_final_gate: true,
    production_monitored_allowed: false
  }
  : {
    previous_status: "blocked_by_v36_baseline_dependency",
    corrected_status: "still_blocked_by_v36_baseline_dependency",
    compare_v36_baseline_status: compareAfterStatus,
    continuation_gate_status: continuationGate.status,
    result_review_gate_status: resultReviewGate.status,
    can_enter_production_monitoring_final_gate: false,
    production_monitored_allowed: false,
    owner_decision_required: true
  };

const blockerUpdate = {
  status: "updated",
  previous_status: "monitoring_window_result_evidence_pass_gate_blocked",
  new_status: repaired
    ? "monitoring_result_review_gate_pass_final_gate_pending"
    : "monitoring_result_review_blocked_by_v36_baseline_dependency",
  still_blocks: [
    "production-monitored",
    "production-ready",
    "stable"
  ],
  does_not_block: [
    "telemetry-connected"
  ],
  next_required_actions: repaired
    ? [
      "run production monitoring final gate",
      "keep local endpoint deferred unless operator provides readiness",
      "do not claim production-ready or stable"
    ]
    : [
      "owner chooses v36 baseline resolution option",
      "rerun compare_v36_baseline.mjs",
      "rerun monitoring window continuation gate",
      "rerun monitoring window result review gate"
    ]
};

const resumeAttempt = {
  status: repaired ? "pass" : "blocked_by_v36_baseline_dependency",
  stage: STAGE,
  attempted_after_safe_repair: repairPerformed,
  compare_v36_baseline_status: compareAfterStatus,
  continuation_gate_status: continuationGate.status,
  continuation_gate_exit_code: continuationGate.exit_code,
  result_review_gate_status: resultReviewGate.status,
  result_review_gate_exit_code: resultReviewGate.exit_code,
  can_enter_production_monitoring_final_gate: repaired,
  production_monitored_allowed: false
};

const report = {
  status: repaired ? "pass" : "blocked_by_v36_baseline_dependency",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  compare_v36_baseline_status_before: compareBefore.status,
  compare_v36_baseline_status_after: compareAfterStatus,
  root_cause: rootCause,
  repair_performed: repairPerformed,
  safe_repair_available: safeRepairPossible,
  owner_decision_required: ownerDecisionRequired,
  baseline_refresh_performed: refreshReport?.baseline_refresh_performed === true,
  v36_modified: false,
  dist_modified: false,
  evidence_v36_baseline_modified: refreshReport?.baseline_refresh_performed === true,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  continuation_gate_status: continuationGate.status,
  result_review_gate_status: resultReviewGate.status,
  can_enter_production_monitoring_final_gate: repaired,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  claims_allowed_by_this_stage: [
    "post-rc-v36-baseline-dependency-triaged",
    "post-rc-v36-baseline-repair-decision-recorded",
    "post-rc-monitoring-result-review-resume-attempted"
  ],
  claims_still_blocked: BLOCKED_CLAIMS
};

const unresolvedItems = {
  status: ownerDecisionRequired ? "owner_decision_required" : "none",
  unresolved_items: ownerDecisionRequired
    ? [
      {
        item: "v36 baseline dependency",
        reason: decisionRequest.reason,
        next_action: decisionRequest.recommended_option
      }
    ]
    : []
};

writeJson(p(...`${EVIDENCE_DIR}/current_compare_v36_failure_snapshot.json`.split("/")), currentCompareSnapshot);
writeJson(p(...`${EVIDENCE_DIR}/previous_owner_approved_refresh_comparison.json`.split("/")), previousRefreshComparison);
writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_hash_source_comparison.json`.split("/")), hashComparison);
writeJson(p(...`${EVIDENCE_DIR}/v36_git_guardrail_status.json`.split("/")), v36Guardrail);
writeJson(p(...`${EVIDENCE_DIR}/compare_script_path_cwd_analysis.json`.split("/")), pathCwdAnalysis);
writeJson(p(...`${EVIDENCE_DIR}/monitoring_result_review_gate_resume_attempt.json`.split("/")), resumeAttempt);
writeJson(p(...`${EVIDENCE_DIR}/monitoring_result_review_status_correction.json`.split("/")), statusCorrection);
writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_repair_decision_request.json`.split("/")), decisionRequest);
writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_dependency_repair_report.json`.split("/")), report);
writeText(p(...`${EVIDENCE_DIR}/v36_baseline_dependency_repair_report.md`.split("/")), markdownReport(report));
writeJson(p(...`${EVIDENCE_DIR}/unresolved_items.json`.split("/")), unresolvedItems);
writeText(p("release", "post_rc_monitoring_result_review_blocker_update.yaml"), `status: ${blockerUpdate.status}
previous_status: ${blockerUpdate.previous_status}
new_status: ${blockerUpdate.new_status}
still_blocks:
${blockerUpdate.still_blocks.map((item) => `  - ${item}`).join("\n")}
does_not_block:
${blockerUpdate.does_not_block.map((item) => `  - ${item}`).join("\n")}
next_required_actions:
${blockerUpdate.next_required_actions.map((item) => `  - ${item}`).join("\n")}
`);
writeJson(p("evals", "reports", "post_rc_v36_baseline_dependency_repair_report.json"), report);
writeText(p("evals", "reports", "post_rc_v36_baseline_dependency_repair_report.md"), markdownReport(report));
writeDocs(report, decisionRequest);

console.log(JSON.stringify(report, null, 2));
process.exit(0);
