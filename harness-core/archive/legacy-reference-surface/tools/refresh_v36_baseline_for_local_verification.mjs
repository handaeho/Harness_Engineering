#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { ensureDir, readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-v36-baseline-refresh-for-local-model-verification-after-owner-approval";
const TRIAGE_STAGE = "v2.0.0-post-stable-v36-baseline-dependency-repair-for-local-model-verification";
const REQUIRED_APPROVAL = "I approve refreshing v36 baseline snapshot for post-stable local model verification repair.";
const EVIDENCE_DIR = "post-stable-v36-baseline-dependency-repair-for-local-verification";
const EXCLUDED_MUTABLE = [
  "v36/records/assembled_bundle_integrity.json",
  "v36/records/codex_runtime_integrity.json",
  "v36/records/file_checksums.json",
  "v36/validation/current_validation_result.json",
  "v36/verification/current_validation_result.json"
];
const EXCLUDED_SNAPSHOT_BASENAMES = [".DS_Store"];
const SNAPSHOT_EXCLUSION_POLICY_ID = "v36-baseline-os-metadata-exclusion";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const args = process.argv.slice(2);
let rootArg = null;
let approval = "";
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--approval") {
    approval = args[index + 1] || "";
    index += 1;
  } else if (!arg.startsWith("--") && !rootArg) {
    rootArg = arg;
  }
}

const repoRoot = process.cwd();
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function normalizeV36Path(value) {
  return value.replace(/^prompt-stack\//, "").replace(/\\/g, "/");
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

function readJsonIfExists(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function writeStaticFiles() {
  writeText(p("release", "post_stable_v36_baseline_refresh_for_local_verification_owner_approval.yaml"), `stage: ${STAGE}
approval_phrase_required: ${JSON.stringify(REQUIRED_APPROVAL)}
approval_phrase_matched: true
selected_option: refresh_v36_baseline_snapshot_after_owner_approval
owner_decision: approve_refresh_v36_baseline_snapshot_for_post_stable_local_model_verification_repair
v36_modification_allowed: false
dist_modification_allowed: false
baseline_refresh_allowed: true
local_model_verified_allowed: false
`);
  writeText(p("release", "post_stable_v36_baseline_refresh_for_local_verification_scope.yaml"), `stage: ${STAGE}
approved_actions:
  owner_approval_validation: true
  v36_baseline_snapshot_refresh: true
  file_inventory_refresh: true
  checksum_refresh: true
  compare_v36_baseline_rerun: true
  local_verification_dependency_gate_rerun: true
forbidden_actions:
  v36_modification: true
  dist_modification: true
  openai_model_api_call: true
  telemetry_sink_write: true
  local_model_generation: true
  local_model_verified_claim: true
  provider_diverse_claim: true
  provider_verified_claim: true
  adapter_checked_claim: true
  production_ready_claim: true
  stable_claim: true
  bare_release_gated_claim: true
`);
}

function markdown(report) {
  return `# V36 Baseline Refresh For Local Verification

Status: ${report.status}

- Stage: ${STAGE}
- Approval phrase verified: ${report.approval_phrase_verified}
- Baseline refresh performed: ${report.baseline_refresh_performed}
- File count: ${report.file_count}
- Excluded by snapshot policy: ${report.excluded_file_count}
- Pre-refresh mismatch count: ${report.pre_refresh_mismatch_count}
- Post-refresh mismatch count: ${report.post_refresh_mismatch_count}
- v36 modified: ${report.v36_modified}
- dist modified: ${report.dist_modified}
- Strong local verification wording allowed: false
`;
}

ensureDir(p("evidence", EVIDENCE_DIR));

if (approval !== REQUIRED_APPROVAL) {
  const blocked = {
    status: "blocked_by_missing_refresh_approval",
    stage: STAGE,
    approval_phrase_verified: false,
    required_approval_phrase: REQUIRED_APPROVAL,
    baseline_refresh_performed: false,
    v36_modified: false,
    dist_modified: false,
    openai_model_api_call: false,
    telemetry_sink_write: false,
    local_model_generation: false,
    local_model_verified_allowed: false
  };
  writeJson(e("v36_baseline_refresh_after_owner_approval_for_local_verification.json"), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

writeStaticFiles();

const beforeStatus = runGit(["status", "--short", "--", "prompt-stack/v36", "dist"]);
const beforeEntries = parseGitStatus(beforeStatus.stdout);
if (beforeEntries.length > 0) {
  const blocked = {
    status: "blocked_by_dirty_forbidden_paths",
    stage: STAGE,
    approval_phrase_verified: true,
    baseline_refresh_performed: false,
    dirty_entries: beforeEntries,
    v36_modified: beforeEntries.some((entry) => entry.includes("prompt-stack/v36")),
    dist_modified: beforeEntries.some((entry) => entry.includes("dist")),
    openai_model_api_call: false,
    telemetry_sink_write: false,
    local_model_generation: false,
    local_model_verified_allowed: false
  };
  writeJson(e("v36_baseline_refresh_after_owner_approval_for_local_verification.json"), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const preCompare = runNode("compare_v36_baseline.mjs");
const preCompareParsed = preCompare.parsed || {};
const beforeChecksum = readJsonIfExists(path.join(baselineDir, "checksums.json"));
const beforeInventory = readJsonIfExists(path.join(baselineDir, "file_inventory.json"));
const beforeByPath = new Map((beforeChecksum?.files || []).map((entry) => [normalizeV36Path(entry.path), entry]));
const existingRecord = readJson(path.join(v36Root, "records", "file_checksums.json"));
const existingByPath = new Map(existingRecord.files.map((entry) => [normalizeV36Path(entry.path), entry]));
const now = new Date().toISOString();
const { files, excludedFiles } = walkFiles(v36Root);
const excludedCurrentPaths = excludedFiles.map((file) => `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`);
const excludedV36Paths = excludedCurrentPaths.map(normalizeV36Path);
const inventoryFiles = files.map((file) => {
  const rel = `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`;
  const stat = fs.statSync(file);
  return {
    path: rel,
    size_bytes: stat.size,
    last_write_time_utc: stat.mtime.toISOString()
  };
});
const checksumFiles = files.map((file) => {
  const rel = `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`;
  const stat = fs.statSync(file);
  return {
    path: rel,
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
const refreshMetadata = {
  stage: STAGE,
  approval_phrase_verified: true,
  approval_source: "operator_message",
  approved_at: now,
  snapshot_exclusion_policy: {
    id: SNAPSHOT_EXCLUSION_POLICY_ID,
    excluded_basenames: EXCLUDED_SNAPSHOT_BASENAMES,
    excluded_current_paths: excludedCurrentPaths,
    source_files_removed: false,
    reason: "macOS Finder metadata is not part of the v36 source baseline contract and is excluded from snapshot inventory/checksums only."
  },
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  latest_v36_commit: latestV36Commit(),
  runner_reexecution: {
    v36_runners_reexecuted: false,
    note: "Baseline snapshot was refreshed from current accepted v36 files; v36 runners were not re-executed in this step."
  }
};
const inventory = {
  generated_at: now,
  source_package: "prompt-stack/v36",
  mutation_policy: "read_only",
  refresh_metadata: refreshMetadata,
  file_count: inventoryFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  note: "Owner-approved post-stable refresh for local model verification repair. Existing records/reports were inspected, but v36 runners were not re-executed in this step.",
  files: inventoryFiles
};
const checksums = {
  generated_at: now,
  source_package: "prompt-stack/v36",
  algorithm: "SHA256",
  mutation_policy: "read_only",
  refresh_metadata: refreshMetadata,
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  file_count: checksumFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  note: "Owner-approved post-stable refresh for local model verification repair. Existing records/reports were inspected, but v36 runners were not re-executed in this step.",
  files: checksumFiles
};

ensureDir(baselineDir);
writeJson(path.join(baselineDir, "file_inventory.json"), inventory);
writeJson(path.join(baselineDir, "checksums.json"), checksums);

const postCompare = runNode("compare_v36_baseline.mjs");
const postCompareParsed = postCompare.parsed || {};
const afterForbiddenStatus = runGit(["status", "--short", "--", "prompt-stack/v36", "dist"]);
const afterBaselineStatus = runGit(["status", "--short", "--", "harness-core/evidence/v36-baseline"]);
const afterByPath = new Map(checksumFiles.map((entry) => [normalizeV36Path(entry.path), entry]));
const changedPathsInBaseline = [];
for (const [v36Path, after] of afterByPath.entries()) {
  const before = beforeByPath.get(v36Path);
  if (!before || before.sha256 !== after.sha256) changedPathsInBaseline.push(v36Path);
}
const removedPathsInBaseline = [...beforeByPath.keys()].filter((v36Path) => !afterByPath.has(v36Path));
const delta = {
  status: "recorded",
  stage: STAGE,
  previous_mismatch_count: preCompareParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  post_refresh_mismatch_count: postCompareParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  files_with_hash_changes: changedPathsInBaseline.length,
  files_added_to_baseline: changedPathsInBaseline.filter((v36Path) => !beforeByPath.has(v36Path)).length,
  files_removed_from_baseline: removedPathsInBaseline.length,
  changed_paths_in_this_refresh: changedPathsInBaseline.sort(),
  removed_paths_in_this_refresh: removedPathsInBaseline.sort(),
  paths_excluded_by_snapshot_policy: excludedV36Paths,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  previous_file_count: beforeInventory?.file_count ?? null,
  refreshed_file_count: checksumFiles.length
};
const report = {
  status: postCompare.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  generated_at: now,
  approval_phrase_verified: true,
  required_approval_phrase: REQUIRED_APPROVAL,
  baseline_refresh_performed: true,
  refreshed_files: [
    "harness-core/evidence/v36-baseline/file_inventory.json",
    "harness-core/evidence/v36-baseline/checksums.json"
  ],
  file_count: checksumFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  pre_refresh_compare_status: preCompare.status,
  pre_refresh_mismatch_count: preCompareParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  post_refresh_compare_status: postCompare.status,
  post_refresh_mismatch_count: postCompareParsed?.alpha_snapshot?.current_snapshot_mismatch_count ?? null,
  unapproved_existing_record_mismatches_after_refresh: postCompareParsed?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null,
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  latest_v36_commit: refreshMetadata.latest_v36_commit,
  v36_modified: parseGitStatus(afterForbiddenStatus.stdout).some((entry) => entry.includes("prompt-stack/v36")),
  dist_modified: parseGitStatus(afterForbiddenStatus.stdout).some((entry) => entry.includes("dist")),
  evidence_v36_baseline_modified: parseGitStatus(afterBaselineStatus.stdout).length > 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_model_generation: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  claims_not_allowed: BLOCKED_CLAIMS
};
const gate = {
  status: report.status,
  stage: STAGE,
  baseline_refresh_performed: true,
  compare_v36_baseline_status: postCompare.status,
  post_refresh_mismatch_count: report.post_refresh_mismatch_count,
  ready_for_local_verification_dependency_recheck: postCompare.status === "pass",
  can_claim_local_model_verified: false,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  v36_modified: report.v36_modified,
  dist_modified: report.dist_modified,
  evidence_v36_baseline_modified: report.evidence_v36_baseline_modified,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};

writeJson(e("owner_approval_record_for_local_verification_refresh.json"), {
  status: "pass",
  stage: STAGE,
  approval_phrase_required: REQUIRED_APPROVAL,
  approval_phrase_verified: true,
  selected_option: "refresh_v36_baseline_snapshot_after_owner_approval",
  v36_modification_allowed: false,
  dist_modification_allowed: false,
  baseline_refresh_allowed: true
});
writeJson(e("pre_refresh_compare_snapshot_for_local_verification.json"), preCompareParsed);
writeJson(e("post_refresh_compare_snapshot_for_local_verification.json"), postCompareParsed);
writeJson(e("v36_baseline_refresh_after_owner_approval_for_local_verification.json"), report);
writeJson(e("v36_baseline_refresh_delta_for_local_verification.json"), delta);
writeJson(e("v36_baseline_refresh_for_local_verification_gate_report.json"), gate);
writeText(e("v36_baseline_refresh_after_owner_approval_for_local_verification.md"), markdown(report));
writeJson(p("evals", "reports", "v36_baseline_refresh_for_local_verification_report.json"), report);
writeText(p("evals", "reports", "v36_baseline_refresh_for_local_verification_report.md"), markdown(report));
writeJson(p("evals", "reports", "v36_baseline_refresh_for_local_verification_gate_report.json"), gate);
writeText(p("evals", "reports", "v36_baseline_refresh_for_local_verification_gate_report.md"), `# V36 Baseline Refresh Gate For Local Verification

Status: ${gate.status}

- Compare status: ${gate.compare_v36_baseline_status}
- Post-refresh mismatch count: ${gate.post_refresh_mismatch_count}
- Can claim local model verified: false
`);
writeText(p("docs", "v36_baseline_refresh_for_local_verification.md"), markdown(report));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
