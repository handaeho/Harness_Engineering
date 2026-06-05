#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-post-clean-export-agent-ready-usability-polish";
const EVIDENCE_DIR = "evidence/clean-artifact-prune";
const LATEST_FINAL_DOSSIER_EXPORT = "exports/v2.0.0-rc.1-postrc-final-dossier-export.zip";

const EXPECTED_DIRTY_BASELINE_PATHS = new Set([
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
]);

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");
const gitRoot = path.resolve(root, "..");

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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function gitStatusProtected() {
  const result = spawnSync("git", [
    "-C",
    gitRoot,
    "status",
    "--short",
    "--",
    "legacy-reference-source",
    "dist",
    "harness-core/dist",
    "harness-core/evidence/reference-baseline"
  ], { encoding: "utf8" });
  const paths = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, ""));
  const reference_baselineDirty = paths.filter((item) => item.startsWith("legacy-reference-source/"));
  const distDirty = paths.filter((item) => item === "dist" || item.startsWith("dist/") || item.startsWith("harness-core/dist/"));
  const baselineDirty = paths.filter((item) => item.startsWith("harness-core/evidence/reference-baseline/"));
  const unexpectedBaselineDirty = baselineDirty.filter((item) => !EXPECTED_DIRTY_BASELINE_PATHS.has(item));
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    observed_dirty_paths: paths,
    reference_baseline_source_dirty_paths: reference_baselineDirty,
    dist_dirty_paths: distDirty,
    evidence_reference_baseline_dirty_paths: baselineDirty,
    unexpected_evidence_reference_baseline_dirty_paths: unexpectedBaselineDirty,
    reference_baseline_source_modified: reference_baselineDirty.length > 0,
    dist_modified: distDirty.length > 0,
    evidence_reference_baseline_refreshed: unexpectedBaselineDirty.length > 0
  };
}

function oldExportsPresent() {
  const exportDir = p("exports");
  if (!fs.existsSync(exportDir)) return [];
  const keep = new Set([
    "exports/harness-core-full-pre-cleanup-backup.zip",
    "exports/harness-core-final-agent-ready.zip",
    LATEST_FINAL_DOSSIER_EXPORT
  ]);
  return fs.readdirSync(exportDir)
    .filter((entry) => entry.endsWith(".zip"))
    .map((entry) => `exports/${entry}`)
    .filter((item) => !keep.has(item))
    .sort();
}

const checks = [];
const requiredReports = [
  `${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`,
  `${EVIDENCE_DIR}/clean_artifact_keep_manifest.json`,
  `${EVIDENCE_DIR}/clean_artifact_archive_manifest.json`,
  `${EVIDENCE_DIR}/clean_artifact_delete_manifest.json`,
  `${EVIDENCE_DIR}/clean_artifact_prune_report.json`
];
for (const file of requiredReports) addCheck(checks, `${file} exists`, fs.existsSync(p(file)), { file });

const backupReport = fs.existsSync(p(`${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`))
  ? readJson(`${EVIDENCE_DIR}/full_pre_cleanup_backup_report.json`)
  : {};
const pruneReport = fs.existsSync(p(`${EVIDENCE_DIR}/clean_artifact_prune_report.json`))
  ? readJson(`${EVIDENCE_DIR}/clean_artifact_prune_report.json`)
  : {};
const claimBoundary = fs.existsSync(p("evidence/current-state/current_state_claim_boundary.json"))
  ? readJson("evidence/current-state/current_state_claim_boundary.json")
  : {};

addCheck(checks, "backup archive exists", backupReport.backup_created === true && fs.existsSync(p(backupReport.backup_path || "__missing__")), backupReport);
addCheck(checks, "CURRENT_STATE.yaml exists", fs.existsSync(p("CURRENT_STATE.yaml")));
addCheck(checks, "START_HERE_FOR_AGENTS.ko.md exists", fs.existsSync(p("START_HERE_FOR_AGENTS.ko.md")));
addCheck(checks, "AGENT_BOOTSTRAP.ko.md exists", fs.existsSync(p("AGENT_BOOTSTRAP.ko.md")));
addCheck(checks, "FINAL_HANDOFF.ko.md exists", fs.existsSync(p("FINAL_HANDOFF.ko.md")));
addCheck(checks, "node_modules removed or excluded", !fs.existsSync(p("node_modules")) || pruneReport.node_modules_excluded === true, {
  node_modules_exists: fs.existsSync(p("node_modules")),
  node_modules_excluded: pruneReport.node_modules_excluded
});
const oldExports = oldExportsPresent();
addCheck(checks, "old exports removed or archived", oldExports.length === 0, { old_exports_present: oldExports });
addCheck(checks, "nested harness-core residue removed", !fs.existsSync(p("harness-core")), {
  path: "harness-core"
});
addCheck(checks, "latest final dossier export exists", fs.existsSync(p(LATEST_FINAL_DOSSIER_EXPORT)));
addCheck(checks, "evidence/current-state exists", fs.existsSync(p("evidence/current-state")));
addCheck(checks, "final dossier evidence exists", fs.existsSync(p("evidence/post-active-scoped-final-release-dossier"))
  && fs.existsSync(p("evidence/final-export-refresh-after-final-dossier")));
addCheck(checks, "provider-verified remains false", claimBoundary.provider_verified_allowed === false);
addCheck(checks, "adapter-checked remains false", claimBoundary.adapter_checked_allowed === false);
addCheck(checks, "production-ready remains false", claimBoundary.production_ready_allowed === false);
addCheck(checks, "stable remains false", claimBoundary.stable_allowed === false);
addCheck(checks, "release-gated remains false", claimBoundary.release_gated_allowed === false);

const protectedStatus = gitStatusProtected();
addCheck(checks, "referenceBaseline not modified", protectedStatus.reference_baseline_source_modified === false, protectedStatus);
addCheck(checks, "dist not modified", protectedStatus.dist_modified === false, protectedStatus);
addCheck(checks, "evidence/reference-baseline not refreshed", protectedStatus.evidence_reference_baseline_refreshed === false, protectedStatus);

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "clean-artifact-gate-checked",
  checks,
  failures,
  unresolved_items_count: failures.length,
  unresolved_items: failures.map((failure) => ({
    id: failure.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    status: "blocked",
    reason: failure.name,
    detail: failure.detail
  })),
  protected_path_status: protectedStatus,
  backup_created: backupReport.backup_created === true,
  kept_items_count: pruneReport.kept_items_count || 0,
  archived_items_count: pruneReport.archived_items_count || 0,
  deleted_items_count: pruneReport.deleted_items_count || 0,
  node_modules_removed: pruneReport.node_modules_removed === true,
  node_modules_excluded: pruneReport.node_modules_excluded === true,
  old_exports_removed: oldExports.length === 0,
  nested_harness_core_residue_removed: !fs.existsSync(p("harness-core")),
  legacy_handoffs_archived: pruneReport.legacy_handoffs_archived === true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  reference_baseline_source_modified: protectedStatus.reference_baseline_source_modified,
  dist_modified: protectedStatus.dist_modified,
  evidence_reference_baseline_refreshed: protectedStatus.evidence_reference_baseline_refreshed
};

writeJson(p(`${EVIDENCE_DIR}/clean_artifact_gate_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  unresolved_items_count: report.unresolved_items_count,
  unresolved_items: report.unresolved_items
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
