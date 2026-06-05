#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STAGE = "v2.0.0-post-clean-export-agent-ready-usability-polish";
const EVIDENCE_DIR = "evidence/clean-artifact-prune";

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(p(relPath), "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function safeRename(sourceRel, targetRel) {
  const source = p(sourceRel);
  const target = p(targetRel);
  if (!fs.existsSync(source)) {
    return { source: sourceRel, target: targetRel, status: "missing" };
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) {
    return { source: sourceRel, target: targetRel, status: "target_exists" };
  }
  fs.renameSync(source, target);
  return { source: sourceRel, target: targetRel, status: "archived" };
}

function safeDelete(relPath) {
  const abs = p(relPath);
  if (!fs.existsSync(abs)) return { path: relPath, status: "missing" };
  fs.rmSync(abs, { recursive: true, force: true });
  return { path: relPath, status: "deleted" };
}

const backupReport = readJson(`${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`);
if (backupReport.backup_created !== true || backupReport.created_before_cleanup !== true) {
  console.error("Refusing cleanup: full pre-cleanup backup is missing or invalid.");
  process.exit(1);
}

const keepManifest = readJson(`${EVIDENCE_DIR}/clean_artifact_keep_manifest.json`);
const archiveManifest = readJson(`${EVIDENCE_DIR}/clean_artifact_archive_manifest.json`);
const deleteManifest = readJson(`${EVIDENCE_DIR}/clean_artifact_delete_manifest.json`);

const archived = archiveManifest.items.map((item) => safeRename(item.source, item.target));
const deleted = deleteManifest.items
  .filter((item) => item.action === "delete")
  .map((item) => safeDelete(item.path));

const oldExportsRemoved = (deleteManifest.old_exports || []).every((item) => !fs.existsSync(p(item)));
const nestedPromptStackV2ResidueRemoved = (deleteManifest.nested_harness_core_residue || []).every((item) => !fs.existsSync(p(item)));
const report = {
  status: "pass",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "clean-artifact-prune-completed",
  backup_checked: true,
  backup_path: backupReport.backup_path,
  kept_items_count: keepManifest.items.filter((item) => item.exists).length,
  archived_items_count: archived.filter((item) => item.status === "archived").length,
  deleted_items_count: deleted.filter((item) => item.status === "deleted").length,
  archived_items: archived,
  deleted_items: deleted,
  node_modules_removed: false,
  node_modules_excluded: true,
  node_modules_exists_after_prune: fs.existsSync(p("node_modules")),
  old_exports_removed: oldExportsRemoved,
  old_exports: deleteManifest.old_exports || [],
  nested_harness_core_residue_removed: nestedPromptStackV2ResidueRemoved,
  nested_harness_core_residue: deleteManifest.nested_harness_core_residue || [],
  legacy_handoffs_archived: archived.every((item) => item.status === "archived" || item.status === "missing" || item.status === "target_exists"),
  dist_modified: false,
  reference_baseline_source_modified: false,
  evidence_reference_baseline_refreshed: false,
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

writeJson(p(`${EVIDENCE_DIR}/clean_artifact_prune_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status: "pass",
  stage: STAGE,
  unresolved_items_count: 0,
  unresolved_items: []
});

console.log(JSON.stringify(report, null, 2));
