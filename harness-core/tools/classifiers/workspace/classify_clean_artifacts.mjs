#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-post-clean-export-agent-ready-usability-polish";
const EVIDENCE_DIR = "evidence/clean-artifact-prune";
const BACKUP_PATH = "exports/harness-core-full-pre-cleanup-backup.zip";
const CLEAN_EXPORT_PATH = "exports/harness-core-final-agent-ready.zip";
const LATEST_FINAL_DOSSIER_EXPORT = "exports/v2.0.0-rc.1-postrc-final-dossier-export.zip";

const KEEP_PATHS = [
  "CURRENT_STATE.yaml",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "MANIFEST.asset_classes.yaml",
  "stack.yaml",
  "stack.schema.json",
  "package.json",
  "package-lock.json",
  ".gitignore",
  "adapters",
  "core",
  "docs",
  "observability",
  "profiles",
  "release",
  "runtime",
  "schemas",
  "security",
  "tools",
  "evidence/current-state",
  "evidence/post-active-scoped-final-release-dossier",
  "evidence/final-export-refresh-after-final-dossier",
  "evidence/post-active-scoped-final-new-conversation-handoff",
  "evidence/reference-baseline",
  LATEST_FINAL_DOSSIER_EXPORT
];

const LEGACY_HANDOFF_CANDIDATES = [
  "NEW_CONVERSATION_HANDOFF.ko.md",
  "NEW_CONVERSATION_PROMPT.ko.md",
  "NEW_CONVERSATION_HANDOFF_AFTER_ACTIVE_SCOPED.ko.md",
  "NEW_CONVERSATION_PROMPT_AFTER_ACTIVE_SCOPED.ko.md",
  "POST_RC_WORK_SEQUENCE_TEMP.ko.md",
  "session_handoff_2026-05-22.md",
  "session_handoff_2026-05-27_post_rc_production_monitoring_window.ko.md"
];

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function toRel(absPath) {
  return path.relative(root, absPath).split(path.sep).join("/");
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function zipEntries(zipPath) {
  const result = spawnSync("zipinfo", ["-1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

function shouldSkipBackup(absPath) {
  const relPath = toRel(absPath);
  if (!relPath || relPath === ".") return false;
  if (relPath === "node_modules" || relPath.startsWith("node_modules/") || relPath.includes("/node_modules/")) return true;
  if (relPath === "dist" || relPath.startsWith("dist/") || relPath.includes("/dist/")) return true;
  if (relPath === ".git" || relPath.startsWith(".git/") || relPath.includes("/.git/")) return true;
  if (relPath === BACKUP_PATH || relPath === CLEAN_EXPORT_PATH) return true;
  if (path.basename(absPath) === ".DS_Store") return true;
  return false;
}

function copyWorkspaceForBackup(stageRoot) {
  for (const entry of fs.readdirSync(root)) {
    const source = p(entry);
    if (shouldSkipBackup(source)) continue;
    const destination = path.join(stageRoot, entry);
    fs.cpSync(source, destination, {
      recursive: true,
      filter: (item) => !shouldSkipBackup(item)
    });
  }
}

function createBackup() {
  const stageRoot = path.join(os.tmpdir(), `harness-core-full-pre-cleanup-backup-${process.pid}`);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  copyWorkspaceForBackup(stageRoot);

  const backupAbs = p(BACKUP_PATH);
  fs.mkdirSync(path.dirname(backupAbs), { recursive: true });
  fs.rmSync(backupAbs, { force: true });
  const zip = spawnSync("zip", ["-qr", backupAbs, "."], {
    cwd: stageRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  fs.rmSync(stageRoot, { recursive: true, force: true });

  const exists = zip.status === 0 && fs.existsSync(backupAbs);
  const entries = exists ? zipEntries(backupAbs) : [];
  const report = {
    status: exists ? "pass" : "fail",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    backup_created: exists,
    backup_path: BACKUP_PATH,
    backup_sha256: exists ? sha256File(backupAbs) : null,
    backup_entry_count: entries.length,
    node_modules_included: entries.some((entry) => entry === "node_modules/" || entry.startsWith("node_modules/") || entry.includes("/node_modules/")),
    dist_included: entries.some((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata_included: entries.some((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store_included: entries.some((entry) => path.basename(entry) === ".DS_Store"),
    created_before_cleanup: true,
    zip_exit_code: zip.status,
    zip_stderr: zip.stderr.trim()
  };
  return report;
}

function existsInfo(relPath, reason) {
  const abs = p(relPath);
  return {
    path: relPath,
    exists: fs.existsSync(abs),
    type: fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? "directory" : "file",
    reason
  };
}

function findRootPatternFiles() {
  const patterns = [/^harness-core_계획_.*\.txt$/, /^harness-core_구조_.*\.txt$/];
  return fs.readdirSync(root)
    .filter((entry) => patterns.some((pattern) => pattern.test(entry)));
}

function findDsStoreFiles() {
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const relPath = toRel(abs);
      if (relPath.startsWith("evidence/reference-baseline/")) continue;
      if (entry.name === ".DS_Store") {
        results.push(relPath);
        continue;
      }
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
        walk(abs);
      }
    }
  };
  walk(root);
  return results.sort();
}

function findOldExports() {
  const exportDir = p("exports");
  if (!fs.existsSync(exportDir)) return [];
  const keep = new Set([BACKUP_PATH, CLEAN_EXPORT_PATH, LATEST_FINAL_DOSSIER_EXPORT]);
  return fs.readdirSync(exportDir)
    .filter((entry) => entry.endsWith(".zip"))
    .map((entry) => `exports/${entry}`)
    .filter((relPath) => !keep.has(relPath))
    .sort();
}

function findNestedPromptStackV2Residue() {
  return fs.existsSync(p("harness-core")) ? ["harness-core"] : [];
}

const backupReport = createBackup();
writeJson(p(`${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`), backupReport);

const keepManifest = {
  status: "recorded",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  items: KEEP_PATHS.map((item) => existsInfo(item, "required clean artifact")),
  item_count: KEEP_PATHS.length
};

const archiveCandidates = [
  ...LEGACY_HANDOFF_CANDIDATES,
  ...findRootPatternFiles()
];
const archiveItems = archiveCandidates
  .filter((item, index, all) => all.indexOf(item) === index)
  .map((item) => ({
    source: item,
    target: `archive/legacy-handoffs/${path.basename(item)}`,
    exists: fs.existsSync(p(item)),
    reason: "legacy handoff or temporary planning artifact"
  }));

const oldExports = findOldExports();
const dsStoreFiles = findDsStoreFiles();
const nestedPromptStackV2Residue = findNestedPromptStackV2Residue();
const deleteItems = [
  ...oldExports.map((item) => ({ path: item, exists: fs.existsSync(p(item)), action: "delete", reason: "old export superseded by final dossier export and clean export" })),
  ...dsStoreFiles.map((item) => ({ path: item, exists: fs.existsSync(p(item)), action: "delete", reason: "macOS metadata" })),
  ...nestedPromptStackV2Residue.map((item) => ({ path: item, exists: fs.existsSync(p(item)), action: "delete", reason: "nested harness-core residue under harness-core root" }))
];

const deleteManifest = {
  status: "recorded",
  stage: STAGE,
  generated_at: keepManifest.generated_at,
  items: deleteItems,
  item_count: deleteItems.length,
  generated_dependency_exclusions: [
    {
      path: "node_modules",
      exists: fs.existsSync(p("node_modules")),
      action: "exclude_from_backup_and_exports",
      physically_deleted: false,
      reason: "npm install/ci is forbidden and local validation still depends on installed packages"
    },
    {
      path: "dist",
      exists: fs.existsSync(p("dist")),
      action: "exclude_from_backup_and_exports",
      physically_deleted: false,
      reason: "generated output is protected from modification"
    }
  ],
  old_exports: oldExports,
  nested_harness_core_residue: nestedPromptStackV2Residue
};

const archiveManifest = {
  status: "recorded",
  stage: STAGE,
  generated_at: keepManifest.generated_at,
  archive_root: "archive/legacy-handoffs",
  items: archiveItems,
  item_count: archiveItems.length
};

const classificationReport = {
  status: backupReport.backup_created ? "pass" : "fail",
  stage: STAGE,
  generated_at: keepManifest.generated_at,
  weak_claim_recorded: "clean-artifact-classification-recorded",
  backup_report_path: `${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`,
  keep_manifest_path: `${EVIDENCE_DIR}/clean_artifact_keep_manifest.json`,
  archive_manifest_path: `${EVIDENCE_DIR}/clean_artifact_archive_manifest.json`,
  delete_manifest_path: `${EVIDENCE_DIR}/clean_artifact_delete_manifest.json`,
  kept_items_count: keepManifest.item_count,
  archive_items_count: archiveItems.filter((item) => item.exists).length,
  delete_items_count: deleteItems.filter((item) => item.exists).length,
  node_modules_removed: false,
  node_modules_excluded: true,
  old_exports_to_delete_count: oldExports.length,
  nested_harness_core_residue_to_delete_count: nestedPromptStackV2Residue.length,
  legacy_handoffs_to_archive_count: archiveItems.filter((item) => item.exists).length,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(p(`${EVIDENCE_DIR}/clean_artifact_keep_manifest.json`), keepManifest);
writeJson(p(`${EVIDENCE_DIR}/clean_artifact_archive_manifest.json`), archiveManifest);
writeJson(p(`${EVIDENCE_DIR}/clean_artifact_delete_manifest.json`), deleteManifest);
writeJson(p(`${EVIDENCE_DIR}/clean_artifact_classification_report.json`), classificationReport);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status: classificationReport.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  unresolved_items_count: classificationReport.status === "pass" ? 0 : 1,
  unresolved_items: classificationReport.status === "pass" ? [] : [
    {
      id: "pre_cleanup_backup_failed",
      status: "blocked",
      reason: "Backup archive was not created before cleanup."
    }
  ]
});

console.log(JSON.stringify(classificationReport, null, 2));
process.exit(classificationReport.status === "pass" ? 0 : 1);
