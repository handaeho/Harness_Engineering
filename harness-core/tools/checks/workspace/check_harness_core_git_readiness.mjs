#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const PROJECT_SLUG = "harness-core";
const OLD_PROJECT_NAME = ["prompt", "stack", "v2"].join("-");
const APPROVAL_PHRASE = "I approve committing the HARNESS Core rename and final surface cleanup.";
const EVIDENCE_DIR = "evidence/harness-core-final-surface-git-readiness";

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, PROJECT_SLUG);
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());

function resolveGitMetadata(projectRoot) {
  const candidates = [
    path.resolve(projectRoot, ".."),
    projectRoot
  ];
  for (const candidate of candidates) {
    const metadataPath = path.join(candidate, ".git");
    if (fs.existsSync(metadataPath)) {
      return {
        git_metadata_present: true,
        git_root: candidate,
        git_metadata_path: metadataPath
      };
    }
  }
  return {
    git_metadata_present: false,
    git_root: path.resolve(projectRoot, ".."),
    git_metadata_path: null
  };
}

const gitMetadata = resolveGitMetadata(root);
const gitRoot = gitMetadata.git_root;

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function runGit(args) {
  const result = spawnSync("git", ["-C", gitRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const actualDirectoryExists = fs.existsSync(root) && path.basename(root) === PROJECT_SLUG;
const claimBoundary = readJsonIfExists("evidence/current-state/current_state_claim_boundary.json") || {};

if (!gitMetadata.git_metadata_present) {
  addCheck(checks, "git metadata absent", true, {
    project_root: root,
    checked_git_roots: [path.resolve(root, ".."), root]
  });
  addCheck(checks, "git readiness not applicable without git metadata", true, {
    status: "not_applicable_no_git_metadata"
  });
  const report = {
    status: "not_applicable_no_git_metadata",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    checker: "check_harness_core_git_readiness.mjs",
    mode: "no_git_metadata",
    applicability: "clean_export_or_uploaded_zip_context",
    actual_project_directory: path.basename(root),
    git_metadata_present: false,
    git_root: null,
    git_ls_files_executed: false,
    git_status_executed: false,
    git_tracked_files_use_harness_core_path: null,
    git_ls_files_old_path_count: null,
    git_status_old_rename_source_visibility_count: null,
    git_status_may_show_rename_source_until_commit: null,
    commit_needed_to_remove_old_path_from_status_diff_display: null,
    commit_approval_required: false,
    required_approval_phrase: APPROVAL_PHRASE,
    commit_approval_present: false,
    commit_performed: false,
    reason: "No .git metadata is present; git readiness is only applicable in the source workspace.",
    checks,
    failures: [],
    unresolved_items_count: 0,
    provider_verified_allowed: claimBoundary.provider_verified_allowed === true,
    adapter_checked_allowed: claimBoundary.adapter_checked_allowed === true,
    production_ready_allowed: claimBoundary.production_ready_allowed === true,
    stable_allowed: claimBoundary.stable_allowed === true,
    release_gated_allowed: claimBoundary.release_gated_allowed === true
  };
  writeJson(`${EVIDENCE_DIR}/git_readiness_report.json`, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const lsFiles = runGit(["ls-files"]);
const trackedFiles = lsFiles.stdout.split(/\r?\n/).filter(Boolean);
const trackedOldPathCount = trackedFiles.filter((file) => file === OLD_PROJECT_NAME || file.startsWith(`${OLD_PROJECT_NAME}/`)).length;
const trackedHarnessCoreCount = trackedFiles.filter((file) => file === PROJECT_SLUG || file.startsWith(`${PROJECT_SLUG}/`)).length;
const status = runGit(["status", "--porcelain=v1"]);
const statusLines = status.stdout.split(/\r?\n/).filter(Boolean);
const statusOldRenameSourceCount = statusLines.filter((line) => line.includes(OLD_PROJECT_NAME)).length;
const approvalProvided = process.argv.includes("--approve-commit")
  || process.env.HARNESS_CORE_COMMIT_APPROVAL === APPROVAL_PHRASE;

addCheck(checks, "actual project directory is harness-core", actualDirectoryExists, { project_root: root });
addCheck(checks, "git ls-files command succeeded", lsFiles.exit_code === 0, { exit_code: lsFiles.exit_code });
addCheck(checks, "git tracked files use harness-core path", trackedHarnessCoreCount > 0, { tracked_harness_core_count: trackedHarnessCoreCount });
addCheck(checks, "git ls-files contains no old project path", trackedOldPathCount === 0, { tracked_old_path_count: trackedOldPathCount });
addCheck(checks, "commit approval request exists", fs.existsSync(p("release/approvals/harness-core/harness_core_git_commit_approval_request.md")), {
  path: "release/approvals/harness-core/harness_core_git_commit_approval_request.md"
});

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? (approvalProvided ? "ready_for_owner_commit" : "ready_for_owner_commit_approval") : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checker: "check_harness_core_git_readiness.mjs",
  mode: "git_metadata_present",
  actual_project_directory: PROJECT_SLUG,
  git_metadata_present: true,
  git_root: gitRoot,
  git_tracked_files_use_harness_core_path: trackedHarnessCoreCount > 0,
  git_ls_files_old_path_count: trackedOldPathCount,
  git_status_old_rename_source_visibility_count: statusOldRenameSourceCount,
  git_status_may_show_rename_source_until_commit: statusOldRenameSourceCount > 0,
  commit_needed_to_remove_old_path_from_status_diff_display: statusOldRenameSourceCount > 0,
  commit_approval_required: true,
  required_approval_phrase: APPROVAL_PHRASE,
  commit_approval_present: approvalProvided,
  commit_performed: false,
  reason: approvalProvided
    ? "Commit approval phrase is present, but this checker records readiness only; commit execution is owner-controlled."
    : "Git status may show old rename source paths until commit.",
  checks,
  failures,
  unresolved_items_count: failures.length,
  provider_verified_allowed: claimBoundary.provider_verified_allowed === true,
  adapter_checked_allowed: claimBoundary.adapter_checked_allowed === true,
  production_ready_allowed: claimBoundary.production_ready_allowed === true,
  stable_allowed: claimBoundary.stable_allowed === true,
  release_gated_allowed: claimBoundary.release_gated_allowed === true
};

writeJson(`${EVIDENCE_DIR}/git_readiness_report.json`, report);
console.log(JSON.stringify(report, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
