#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { ensureDir, readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-v36-baseline-refresh-for-monitoring-result-review-repair";
const REQUIRED_APPROVAL = "I approve refreshing v36 baseline snapshot for post-rc monitoring result-review repair.";
const EVIDENCE_DIR = "evidence/post-rc-v36-baseline-dependency-repair";
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
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--approval") {
    approval = args[index + 1] || "";
    index += 1;
  } else if (!arg.startsWith("--") && !rootArg) {
    rootArg = arg;
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

function toPosix(value) {
  return value.split(path.sep).join("/");
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
      if (item.isDirectory()) {
        walk(abs);
      } else {
        files.push(abs);
      }
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
  const lines = result.stdout.split(/\r?\n/).filter((line) => line.length > 0);
  return {
    status: result.exit_code === 0 && lines.length >= 3 ? "found" : "unknown",
    commit: lines[0] || null,
    subject: lines[1] || null,
    committed_at: lines[2] || null,
    changed_paths: lines.slice(3)
  };
}

function markdown(report) {
  return `# V36 Baseline Refresh After Owner Approval

Status: ${report.status}

- Stage: ${report.stage}
- Approval phrase verified: ${report.approval_phrase_verified}
- Source package: ${report.source_package}
- File count: ${report.file_count}
- Approved changed paths: ${report.approved_changed_paths_against_existing_record.length}
- Approved new paths: ${report.approved_new_paths_not_in_existing_record.length}
- v36 modified: ${report.v36_modified}
- dist modified: ${report.dist_modified}
- telemetry sink write: ${report.telemetry_sink_write}
- OpenAI model API call: ${report.openai_model_api_call}
- local endpoint probe: ${report.local_endpoint_probe}
`;
}

if (approval !== REQUIRED_APPROVAL) {
  const blocked = {
    status: "blocked_by_missing_refresh_approval",
    stage: STAGE,
    approval_phrase_verified: false,
    required_approval_phrase: REQUIRED_APPROVAL,
    baseline_refresh_performed: false,
    v36_modified: false,
    dist_modified: false,
    telemetry_sink_write: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  };
  writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.json`.split("/")), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const beforeStatus = runGit([
  "status",
  "--short",
  "--",
  "prompt-stack/v36",
  "dist",
  "harness-core/evidence/v36-baseline"
]);
const beforeEntries = parseGitStatus(beforeStatus.stdout);
const forbiddenDirtyBefore = beforeEntries.some((entry) => entry.includes("prompt-stack/v36") || entry.includes("dist"));
if (forbiddenDirtyBefore) {
  const blocked = {
    status: "blocked_by_dirty_forbidden_paths",
    stage: STAGE,
    approval_phrase_verified: true,
    baseline_refresh_performed: false,
    dirty_entries: beforeEntries,
    v36_modified: beforeEntries.some((entry) => entry.includes("prompt-stack/v36")),
    dist_modified: beforeEntries.some((entry) => entry.includes("dist")),
    telemetry_sink_write: false,
    openai_model_api_call: false,
    local_endpoint_probe: false,
    local_model_execution: false
  };
  writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.json`.split("/")), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const existingRecord = readJson(path.join(v36Root, "records", "file_checksums.json"));
const existingByPath = new Map(existingRecord.files.map((entry) => [normalizeV36Path(entry.path), entry]));
const now = new Date().toISOString();
const { files, excludedFiles } = walkFiles(v36Root);
const excludedCurrentPaths = excludedFiles.map((file) => `prompt-stack/v36/${toPosix(path.relative(v36Root, file))}`);
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
    if (!EXCLUDED_MUTABLE.includes(v36Path)) {
      approvedNewPaths.push(v36Path);
    }
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
    note: "Baseline snapshot was refreshed from current accepted v36 files; v36 runners were not re-executed."
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
  note: "Owner-approved post-RC refresh for monitoring result-review repair. Existing records/reports were inspected, but v36 runners were not re-executed in this step.",
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
  note: "Owner-approved post-RC refresh for monitoring result-review repair. Existing records/reports were inspected, but v36 runners were not re-executed in this step.",
  files: checksumFiles
};

ensureDir(baselineDir);
writeJson(path.join(baselineDir, "file_inventory.json"), inventory);
writeJson(path.join(baselineDir, "checksums.json"), checksums);

const afterForbiddenStatus = runGit([
  "status",
  "--short",
  "--",
  "prompt-stack/v36",
  "dist"
]);
const afterBaselineStatus = runGit([
  "status",
  "--short",
  "--",
  "harness-core/evidence/v36-baseline"
]);
const report = {
  status: "pass",
  stage: STAGE,
  generated_at: now,
  approval_phrase_verified: true,
  source_package: "prompt-stack/v36",
  baseline_refresh_performed: true,
  refreshed_files: [
    "harness-core/evidence/v36-baseline/file_inventory.json",
    "harness-core/evidence/v36-baseline/checksums.json"
  ],
  file_count: checksumFiles.length,
  excluded_file_count: excludedCurrentPaths.length,
  snapshot_exclusion_policy: refreshMetadata.snapshot_exclusion_policy,
  approved_changed_paths_against_existing_record: approvedChangedPaths.sort(),
  approved_new_paths_not_in_existing_record: approvedNewPaths.sort(),
  latest_v36_commit: refreshMetadata.latest_v36_commit,
  v36_modified: false,
  dist_modified: false,
  evidence_v36_baseline_modified: parseGitStatus(afterBaselineStatus.stdout).length > 0,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  production_deployment: false,
  production_monitored_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  forbidden_path_status_after_refresh: {
    exit_code: afterForbiddenStatus.exit_code,
    stdout: afterForbiddenStatus.stdout,
    stderr: afterForbiddenStatus.stderr
  }
};

writeJson(p(...`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.json`.split("/")), report);
writeText(p(...`${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval.md`.split("/")), markdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(0);
