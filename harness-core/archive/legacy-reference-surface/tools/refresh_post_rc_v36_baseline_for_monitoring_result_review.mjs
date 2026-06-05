#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { ensureDir, readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-refresh-for-monitoring-result-review-after-owner-approval";
const REQUIRED_APPROVAL = "I approve refreshing v36 baseline snapshot for post-rc monitoring result-review repair.";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review";
const HISTORICAL_STAGE = "v2.0.0-post-rc-v36-baseline-dependency-repair-for-monitoring-result-review";
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
const EXCLUDED_MUTABLE = [
  "v36/records/assembled_bundle_integrity.json",
  "v36/records/codex_runtime_integrity.json",
  "v36/records/file_checksums.json",
  "v36/validation/current_validation_result.json",
  "v36/verification/current_validation_result.json"
];
const EXCLUDED_SNAPSHOT_BASENAMES = [".DS_Store"];
const SNAPSHOT_EXCLUSION_POLICY_ID = "v36-baseline-os-metadata-exclusion";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
let rootArg = null;
let approval = "";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--approval") {
    approval = args[i + 1] || "";
    i += 1;
  } else if (!args[i].startsWith("--") && !rootArg) {
    rootArg = args[i];
  }
}

const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;
const v36Root = path.join(workspaceRoot, "prompt-stack", "v36");
const baselineDir = path.join(root, "evidence", "v36-baseline");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(...parts) {
  return p(...EVIDENCE_DIR.split("/"), ...parts);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
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

function walkFiles(dir) {
  const files = [];
  const excludedFiles = [];
  function walk(current) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, item.name);
      if (EXCLUDED_SNAPSHOT_BASENAMES.includes(item.name)) {
        excludedFiles.push(abs);
        continue;
      }
      if (item.isDirectory()) walk(abs);
      else files.push(abs);
    }
  }
  walk(dir);
  return {
    files: files.sort((a, b) => toPosix(path.relative(v36Root, a)).localeCompare(toPosix(path.relative(v36Root, b)))),
    excludedFiles: excludedFiles.sort((a, b) => toPosix(path.relative(v36Root, a)).localeCompare(toPosix(path.relative(v36Root, b))))
  };
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
    stdout_excerpt: (result.stdout || "").trim().slice(0, 4000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 4000)
  };
}

function runGit(argsForGit) {
  const result = spawnSync("git", argsForGit, {
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

function parseGitStatus(stdout) {
  return stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function normalizeV36Path(value) {
  return value.replace(/^prompt-stack\//, "").replace(/\\/g, "/");
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
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  return {
    status: result.exit_code === 0 && lines.length >= 3 ? "found" : "unknown",
    commit: lines[0] || null,
    short_commit: lines[0] ? lines[0].slice(0, 7) : null,
    subject: lines[1] || null,
    committed_at: lines[2] || null,
    changed_paths: lines.slice(3)
  };
}

function writeStaticFiles() {
  writeText(p("release", "post_rc_v36_baseline_refresh_for_monitoring_scope.yaml"), `stage: ${STAGE}

approved_actions:
  owner_approval_validation: true
  v36_baseline_snapshot_refresh: true
  file_inventory_refresh: true
  checksum_refresh: true
  refresh_delta_recording: true
  compare_v36_baseline_rerun: true
  monitoring_continuation_gate_rerun: true
  monitoring_result_review_gate_rerun: true
  status_repair: true
  blocker_update: true

forbidden_actions:
  v36_modification: true
  v36_restore: true
  dist_modification: true
  openai_model_api_call: true
  openai_provider_call: true
  local_endpoint_probe: true
  local_model_execution: true
  telemetry_sink_write: true
  synthetic_trace_generation: true
  manual_sample_count_increment: true
  manual_duration_increment: true
  production_deployment: true
  release_gate_rerun: true
  production_monitored_claim: true
  production_ready_claim: true
  stable_claim: true
  provider_diverse_claim: true
  local_model_verified_claim: true
  bare_release_gated_claim: true

claims_allowed:
  - post-rc-v36-baseline-snapshot-refreshed
  - post-rc-v36-baseline-refresh-owner-approved
  - post-rc-v36-baseline-refresh-delta-recorded
  - post-rc-v36-baseline-compare-restored
  - post-rc-monitoring-result-review-resumed

claims_conditionally_allowed_after_result_review_gate_pass:
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
  writeText(p("release", "post_rc_v36_baseline_refresh_owner_approval.yaml"), `stage: ${STAGE}
approval_phrase_required: "${REQUIRED_APPROVAL}"
approval_phrase_matched: true
selected_option: reapply_or_refresh_v36_baseline_snapshot_after_owner_approval
owner_decision: approve_refresh_v36_baseline_snapshot_for_monitoring_result_review
v36_modification_allowed: false
baseline_refresh_allowed: true
`);
  writeText(p("release", "post_rc_monitoring_result_review_resume_after_v36_refresh.yaml"), `stage: ${STAGE}
previous_status: blocked_by_v36_baseline_dependency
target_status: pass
requires:
  - compare_v36_baseline_pass
  - monitoring_continuation_gate_rerun
  - monitoring_result_review_gate_rerun
production_monitored_allowed: false
production_ready_allowed: false
stable_allowed: false
`);
  writeText(p("evals", "suites", "post_rc_v36_baseline_refresh_for_monitoring_result_review.yaml"), `suite: post_rc_v36_baseline_refresh_for_monitoring_result_review
stage: ${STAGE}
checks:
  - owner_approval_recorded
  - baseline_snapshot_refreshed
  - refresh_delta_recorded
  - compare_v36_baseline_pass
  - monitoring_continuation_gate_rerun
  - monitoring_result_review_gate_rerun
  - final_gate_preconditions_available
forbidden:
  - v36_modification
  - dist_modification
  - telemetry_sink_write
  - openai_model_api_call
  - local_endpoint_probe
  - production_monitored_claim
`);
}

function markdownReport(title, report) {
  return `# ${title}

Status: ${report.status}

- Stage: ${report.stage}
- Baseline refresh performed: ${report.baseline_refresh_performed}
- v36 modified: ${report.v36_modified}
- dist modified: ${report.dist_modified}
- OpenAI model API call: ${report.openai_model_api_call}
- local endpoint probe: ${report.local_endpoint_probe}
- telemetry sink write: ${report.telemetry_sink_write}
`;
}

function writeDocs(refreshReport, resumeReport, delta) {
  writeText(p("docs", "post_rc_v36_baseline_refresh_for_monitoring_result_review.md"), markdownReport("Post-RC V36 Baseline Refresh For Monitoring Result Review", refreshReport));
  writeText(p("docs", "post_rc_v36_baseline_refresh_delta.md"), `# Post-RC V36 Baseline Refresh Delta

Status: ${delta.status}

- Previous mismatch count: ${delta.previous_mismatch_count}
- Post refresh mismatch count: ${delta.post_refresh_mismatch_count}
- Files with hash changes: ${delta.files_with_hash_changes}
- Files added to baseline in this reapply: ${delta.files_added_to_baseline}
- Files removed from baseline in this reapply: ${delta.files_removed_from_baseline}
`);
  writeText(p("docs", "monitoring_result_review_resume_after_v36_refresh.md"), `# Monitoring Result Review Resume After V36 Refresh

Status: ${resumeReport.status}

- Previous status: ${resumeReport.previous_status}
- Corrected status: ${resumeReport.corrected_status}
- Compare status: ${resumeReport.compare_v36_baseline_status}
- Continuation gate status: ${resumeReport.continuation_gate_status}
- Result review gate status: ${resumeReport.result_review_gate_status}
- Can enter production monitoring final gate: ${resumeReport.can_enter_production_monitoring_final_gate}
- Production-monitored allowed: ${resumeReport.production_monitored_allowed}
`);
  writeText(p("docs", "next_production_monitoring_final_gate_plan.md"), `# Next Production Monitoring Final Gate Plan

Next stage:
v2.0.0-post-rc-production-monitoring-final-gate

Current state:
- monitoring window result review gate is pass
- can enter production monitoring final gate: ${resumeReport.can_enter_production_monitoring_final_gate}
- production-monitored remains blocked until final gate passes

Still not allowed:
- production-ready
- stable
- provider-diverse
- local-model-verified
`);
}

ensureDir(e());

if (approval !== REQUIRED_APPROVAL) {
  const blocked = {
    status: "blocked_by_missing_owner_approval",
    stage: STAGE,
    approval_phrase_required: REQUIRED_APPROVAL,
    approval_phrase_matched: false,
    baseline_refresh_performed: false,
    telemetry_sink_write: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    production_monitored_allowed: false
  };
  writeJson(e("v36_baseline_refresh_report.json"), blocked);
  writeJson(e("unresolved_items.json"), {
    status: "blocked_by_missing_owner_approval",
    unresolved_items: ["owner approval phrase required before baseline refresh"]
  });
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(0);
}

writeStaticFiles();

const now = new Date().toISOString();
const beforeCompare = runNode("compare_v36_baseline.mjs");
const beforeParsed = beforeCompare.parsed || {};
const beforeChecksum = readJsonIfExists(path.join(baselineDir, "checksums.json"));
const beforeInventory = readJsonIfExists(path.join(baselineDir, "file_inventory.json"));
const beforeByPath = new Map((beforeChecksum?.files || []).map((entry) => [normalizeV36Path(entry.path), entry]));

const beforeStatus = runGit([
  "status",
  "--short",
  "--",
  "prompt-stack/v36",
  "dist",
  "harness-core/evidence/v36-baseline"
]);
const dirtyEntries = parseGitStatus(beforeStatus.stdout);
const forbiddenDirty = dirtyEntries.filter((entry) => entry.includes("prompt-stack/v36") || entry.includes("dist"));
if (forbiddenDirty.length > 0) {
  const blocked = {
    status: "fail",
    stage: STAGE,
    approval_phrase_matched: true,
    baseline_refresh_performed: false,
    reason: "Forbidden guardrail path dirty before refresh.",
    dirty_entries: dirtyEntries,
    v36_modified: dirtyEntries.some((entry) => entry.includes("prompt-stack/v36")),
    dist_modified: dirtyEntries.some((entry) => entry.includes("dist")),
    telemetry_sink_write: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  };
  writeJson(e("v36_baseline_refresh_report.json"), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const existingRecord = readJson(path.join(v36Root, "records", "file_checksums.json"));
const existingByPath = new Map(existingRecord.files.map((entry) => [normalizeV36Path(entry.path), entry]));
const { files, excludedFiles } = walkFiles(v36Root);
const excludedCurrentPaths = excludedFiles.map((file) => `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`);
const inventoryFiles = files.map((file) => {
  const stat = fs.statSync(file);
  return {
    path: `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`,
    size_bytes: stat.size,
    last_write_time_utc: stat.mtime.toISOString()
  };
});
const checksumFiles = files.map((file) => {
  const stat = fs.statSync(file);
  return {
    path: `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`,
    size_bytes: stat.size,
    sha256: sha256(file)
  };
});

const approvedChangedPaths = [];
const approvedNewPaths = [];
for (const entry of checksumFiles) {
  const v36Path = normalizeV36Path(entry.path);
  const existing = existingByPath.get(v36Path);
  if (!existing) {
    if (!EXCLUDED_MUTABLE.includes(v36Path)) approvedNewPaths.push(v36Path);
  } else if (existing.checksum !== entry.sha256) {
    approvedChangedPaths.push(v36Path);
  }
}

const latestCommit = latestV36Commit();
const metadata = {
  stage: STAGE,
  approval_phrase_verified: true,
  approval_source: "operator_message",
  approved_at: now,
  selected_option: "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval",
  snapshot_exclusion_policy: {
    id: SNAPSHOT_EXCLUSION_POLICY_ID,
    excluded_basenames: EXCLUDED_SNAPSHOT_BASENAMES,
    excluded_current_paths: excludedCurrentPaths,
    source_files_removed: false,
    reason: "macOS Finder metadata is not part of the v36 source baseline contract and is excluded from snapshot inventory/checksums only."
  },
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  latest_v36_commit: latestCommit,
  runner_reexecution: {
    v36_runners_reexecuted: false,
    note: "Baseline snapshot was refreshed from current accepted v36 files; v36 runners were not re-executed."
  }
};

ensureDir(baselineDir);
writeJson(path.join(baselineDir, "file_inventory.json"), {
  generated_at: now,
  source_package: "prompt-stack/v36",
  mutation_policy: "read_only",
  refresh_metadata: metadata,
  file_count: inventoryFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  files: inventoryFiles
});
writeJson(path.join(baselineDir, "checksums.json"), {
  generated_at: now,
  source_package: "prompt-stack/v36",
  algorithm: "SHA256",
  mutation_policy: "read_only",
  refresh_metadata: metadata,
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  file_count: checksumFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  files: checksumFiles
});

const postCompare = runNode("compare_v36_baseline.mjs");
const continuationGate = runNode("check_post_rc_production_monitoring_window_continuation.mjs");
const resultReviewGate = runNode("check_post_rc_production_monitoring_window_result_review.mjs");
const postParsed = postCompare.parsed || {};
const currentMismatchCount = postParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null;
const unapprovedMismatchCount = postParsed?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null;
const unresolvedCount = postParsed?.unresolved_items_count ?? null;
const postRefreshMismatchCount = (currentMismatchCount || 0) + (unapprovedMismatchCount || 0) + (unresolvedCount || 0);

const postByPath = new Map(checksumFiles.map((entry) => [normalizeV36Path(entry.path), entry]));
const changedInThisReapply = [];
for (const [filePath, entry] of postByPath.entries()) {
  const before = beforeByPath.get(filePath);
  if (before && before.sha256 !== entry.sha256) changedInThisReapply.push(filePath);
}
const addedInThisReapply = [...postByPath.keys()].filter((filePath) => !beforeByPath.has(filePath));
const removedInThisReapply = [...beforeByPath.keys()].filter((filePath) => !postByPath.has(filePath));
const relatedCommit = latestCommit.short_commit || "unknown";

const ownerApproval = {
  status: "pass",
  stage: STAGE,
  approval_phrase_required: REQUIRED_APPROVAL,
  approval_phrase_matched: true,
  selected_option: "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval",
  owner_decision: "approve_refresh_v36_baseline_snapshot_for_monitoring_result_review",
  v36_modification_allowed: false,
  baseline_refresh_allowed: true
};
const preSnapshot = {
  status: beforeCompare.status,
  stage: STAGE,
  source_check: "compare_v36_baseline.mjs",
  captured_at_stage: STAGE,
  unresolved_items_count: beforeParsed?.unresolved_items_count ?? null,
  current_snapshot_mismatch_count: beforeParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  existing_record_mismatch_count: beforeParsed?.existing_v36_checksum_record?.mismatch_count ?? approvedChangedPaths.length,
  unapproved_existing_record_mismatch_count: beforeParsed?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null,
  notes: [
    `Historical dependency repair stage: ${HISTORICAL_STAGE}`,
    "Raw existing-record mismatch count is preserved for delta accounting; owner-approved refresh metadata resolves it for current compare."
  ]
};
const postSnapshot = {
  status: postCompare.status,
  stage: STAGE,
  source_check: "compare_v36_baseline.mjs",
  unresolved_items_count: unresolvedCount,
  current_snapshot_mismatch_count: currentMismatchCount,
  raw_existing_record_mismatch_count: postParsed?.existing_v36_checksum_record?.mismatch_count ?? null,
  approved_existing_record_mismatch_count: postParsed?.existing_v36_checksum_record?.approved_mismatch_count ?? null,
  unapproved_existing_record_mismatch_count: unapprovedMismatchCount,
  post_refresh_mismatch_count: postRefreshMismatchCount
};
const refreshReport = {
  status: postCompare.status === "pass" && postRefreshMismatchCount === 0 ? "pass" : "fail",
  stage: STAGE,
  selected_option: "reapply_or_refresh_v36_baseline_snapshot_after_owner_approval",
  owner_approval_present: true,
  approval_phrase_matched: true,
  baseline_refresh_performed: true,
  v36_modified: false,
  dist_modified: false,
  openai_model_api_call: false,
  local_endpoint_probe: false,
  telemetry_sink_write: false,
  pre_refresh_mismatch_count: preSnapshot.existing_record_mismatch_count,
  post_refresh_mismatch_count: postRefreshMismatchCount,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  file_inventory_refreshed: true,
  checksums_refreshed: true,
  current_v36_accepted_as_baseline: true,
  related_v36_commit: relatedCommit,
  reason: `Owner approved refreshing v36 baseline snapshot after accepted v36 commit ${relatedCommit}.`
};
const delta = {
  status: "recorded",
  previous_mismatch_count: preSnapshot.existing_record_mismatch_count,
  post_refresh_mismatch_count: postRefreshMismatchCount,
  files_with_hash_changes: approvedChangedPaths.length,
  files_added_to_baseline: addedInThisReapply.length,
  files_removed_from_baseline: removedInThisReapply.length,
  paths_excluded_by_snapshot_policy: excludedCurrentPaths.map(normalizeV36Path),
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  changed_paths_against_existing_record: approvedChangedPaths.sort(),
  changed_paths_in_this_reapply: changedInThisReapply.sort(),
  reason: "Owner approved accepting current v36 state as refreshed baseline for post-RC monitoring result-review dependency."
};
const inventoryDelta = {
  status: "recorded",
  previous_file_count: beforeInventory?.file_count ?? null,
  refreshed_file_count: inventoryFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  files_added_in_this_reapply: addedInThisReapply.sort(),
  files_removed_in_this_reapply: removedInThisReapply.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort()
};
const compareAfter = {
  status: postCompare.status,
  unresolved_items_count: unresolvedCount,
  current_snapshot_mismatch_count: currentMismatchCount,
  existing_record_mismatch_count: unapprovedMismatchCount,
  raw_existing_record_mismatch_count: postParsed?.existing_v36_checksum_record?.mismatch_count ?? null,
  approved_existing_record_mismatch_count: postParsed?.existing_v36_checksum_record?.approved_mismatch_count ?? null,
  disallowed_snapshot_path_count: postParsed?.alpha_snapshot?.disallowed_snapshot_path_count ?? null,
  snapshot_exclusion_policy: postParsed?.snapshot_exclusion_policy || metadata.snapshot_exclusion_policy,
  post_refresh_mismatch_count: postRefreshMismatchCount,
  baseline_refresh_effective: postCompare.status === "pass" && postRefreshMismatchCount === 0
};
const continuationAfter = {
  status: ["pass", "ready_for_monitoring_window_result_review"].includes(continuationGate.status) ? "pass" : continuationGate.status,
  raw_status: continuationGate.status,
  gate: "check_post_rc_production_monitoring_window_continuation.mjs",
  baseline_dependency_resolved: compareAfter.status === "pass",
  monitoring_window_completed: continuationGate.parsed?.monitoring_window_completed === true,
  duration_met: continuationGate.parsed?.duration_met === true,
  sample_count_met: continuationGate.parsed?.sample_count_met === true,
  elapsed_duration_hours: continuationGate.parsed?.elapsed_duration_hours ?? null,
  sample_count: continuationGate.parsed?.sample_count ?? null
};
const resultReviewAfter = {
  status: resultReviewGate.status,
  gate: "check_post_rc_production_monitoring_window_result_review.mjs",
  baseline_dependency_resolved: compareAfter.status === "pass",
  can_enter_production_monitoring_final_gate: resultReviewGate.parsed?.can_enter_production_monitoring_final_gate === true,
  production_monitored_allowed: false
};
const resumeReport = {
  status: compareAfter.status === "pass" && continuationAfter.status === "pass" && resultReviewAfter.status === "pass" ? "pass" : "fail",
  previous_status: "blocked_by_v36_baseline_dependency",
  corrected_status: "pass",
  compare_v36_baseline_status: compareAfter.status,
  continuation_gate_status: continuationAfter.status,
  continuation_gate_raw_status: continuationAfter.raw_status,
  result_review_gate_status: resultReviewAfter.status,
  can_enter_production_monitoring_final_gate: resultReviewAfter.can_enter_production_monitoring_final_gate,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false
};
const gateReport = {
  status: refreshReport.status === "pass" && resumeReport.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  baseline_refresh_performed: true,
  v36_modified: false,
  dist_modified: false,
  compare_v36_baseline_status: compareAfter.status,
  post_refresh_mismatch_count: postRefreshMismatchCount,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: metadata.snapshot_exclusion_policy,
  monitoring_result_review_gate_status: resultReviewAfter.status,
  can_enter_production_monitoring_final_gate: resumeReport.can_enter_production_monitoring_final_gate,
  can_claim_production_monitored: false,
  reason: "Owner-approved v36 baseline refresh resolved monitoring result-review dependency without modifying v36.",
  claims_allowed_by_this_gate: [
    "post-rc-v36-baseline-snapshot-refreshed",
    "post-rc-v36-baseline-refresh-owner-approved",
    "post-rc-v36-baseline-refresh-delta-recorded",
    "post-rc-v36-baseline-compare-restored",
    "post-rc-monitoring-result-review-resumed"
  ],
  claims_conditionally_allowed_after_result_review_gate_pass: resumeReport.status === "pass" ? [
    "post-rc-production-monitoring-window-result-reviewed",
    "post-rc-monitoring-window-duration-sample-validated",
    "post-rc-monitoring-window-threshold-results-reviewed",
    "post-rc-monitoring-window-redaction-results-reviewed",
    "post-rc-production-monitoring-final-gate-preconditions-recorded"
  ] : [],
  claims_still_blocked: BLOCKED_CLAIMS
};

writeJson(e("owner_approval_record.json"), ownerApproval);
writeJson(e("pre_refresh_compare_snapshot.json"), preSnapshot);
writeJson(e("post_refresh_compare_snapshot.json"), postSnapshot);
writeJson(e("v36_baseline_refresh_report.json"), refreshReport);
writeJson(e("v36_baseline_refresh_delta.json"), delta);
writeJson(e("v36_baseline_refresh_file_inventory_delta.json"), inventoryDelta);
writeJson(e("compare_v36_baseline_after_refresh.json"), compareAfter);
writeJson(e("monitoring_continuation_gate_after_refresh.json"), continuationAfter);
writeJson(e("monitoring_result_review_gate_after_refresh.json"), resultReviewAfter);
writeJson(e("monitoring_result_review_resume_report.json"), resumeReport);
writeJson(e("post_rc_v36_baseline_refresh_gate_report.json"), gateReport);
writeJson(e("unresolved_items.json"), {
  status: gateReport.status === "pass" ? "none" : "unresolved",
  unresolved_items: gateReport.status === "pass" ? [] : ["v36 baseline refresh gate failed"]
});

writeJson(p("evals", "reports", "post_rc_v36_baseline_refresh_report.json"), refreshReport);
writeText(p("evals", "reports", "post_rc_v36_baseline_refresh_report.md"), markdownReport("Post-RC V36 Baseline Refresh", refreshReport));
writeJson(p("evals", "reports", "post_rc_v36_baseline_refresh_delta_report.json"), delta);
writeText(p("evals", "reports", "post_rc_v36_baseline_refresh_delta_report.md"), markdownReport("Post-RC V36 Baseline Refresh Delta", { ...refreshReport, status: delta.status }));
writeJson(p("evals", "reports", "post_rc_monitoring_result_review_resume_report.json"), resumeReport);
writeText(p("evals", "reports", "post_rc_monitoring_result_review_resume_report.md"), markdownReport("Post-RC Monitoring Result Review Resume", { ...refreshReport, status: resumeReport.status }));
writeJson(p("evals", "reports", "post_rc_v36_baseline_refresh_gate_report.json"), gateReport);
writeText(p("evals", "reports", "post_rc_v36_baseline_refresh_gate_report.md"), markdownReport("Post-RC V36 Baseline Refresh Gate", { ...refreshReport, status: gateReport.status }));
writeDocs(refreshReport, resumeReport, delta);

console.log(JSON.stringify(refreshReport, null, 2));
process.exit(refreshReport.status === "pass" ? 0 : 1);
