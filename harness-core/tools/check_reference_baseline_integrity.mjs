#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const EVIDENCE_DIR = "evidence/reference-baseline-deemphasis";
const FINAL_SURFACE_EVIDENCE_DIR = "evidence/harness-core-final-surface-git-readiness";
const BASELINE_DIR = "evidence/reference-baseline";
const INVENTORY_PATH = `${BASELINE_DIR}/file_inventory.json`;
const CHECKSUMS_PATH = `${BASELINE_DIR}/checksums.json`;

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, "harness-core");
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(p(relPath), "utf8"));
  } catch {
    return null;
  }
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function collectFileEntries(doc) {
  return Array.isArray(doc?.files) ? doc.files : [];
}

function collectPathLikeStrings(value, results = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectPathLikeStrings(item, results);
    return results;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectPathLikeStrings(item, results);
    return results;
  }
  if (typeof value === "string" && value.includes("/")) results.push(value);
  return results;
}

const checks = [];
const inventory = readJson(INVENTORY_PATH);
const checksums = readJson(CHECKSUMS_PATH);
const inventoryEntries = collectFileEntries(inventory);
const checksumEntries = collectFileEntries(checksums);
const pathLikeStrings = [
  ...collectPathLikeStrings(inventory),
  ...collectPathLikeStrings(checksums)
];
const dsStorePaths = pathLikeStrings.filter((item) => item.split("/").includes(".DS_Store") || item.endsWith("/.DS_Store"));
const checksumValues = checksumEntries.filter((entry) => typeof entry?.sha256 === "string" && /^[a-f0-9]{64}$/i.test(entry.sha256));
const inventoryMetadata = inventory?.reference_baseline_metadata || {};
const checksumMetadata = checksums?.reference_baseline_metadata || {};

addCheck(checks, "reference baseline inventory exists", inventory !== null, { path: INVENTORY_PATH });
addCheck(checks, "reference baseline checksums exists", checksums !== null, { path: CHECKSUMS_PATH });
addCheck(checks, "reference baseline inventory has files", inventoryEntries.length > 0, { count: inventoryEntries.length });
addCheck(checks, "reference baseline checksums has files", checksumEntries.length > 0, { count: checksumEntries.length });
addCheck(checks, "reference baseline checksum values preserved", checksumValues.length === checksumEntries.length && checksumEntries.length > 0, {
  checksum_values: checksumValues.length,
  checksum_entries: checksumEntries.length
});
addCheck(checks, "reference baseline metadata exists", inventoryMetadata.path === BASELINE_DIR
  && checksumMetadata.path === BASELINE_DIR
  && inventoryMetadata.role === "historical_reference_snapshot"
  && checksumMetadata.role === "historical_reference_snapshot", {
  inventory_metadata: inventoryMetadata,
  checksum_metadata: checksumMetadata
});
addCheck(checks, "reference baseline is not active source of truth", inventoryMetadata.active_source_of_truth === false
  && checksumMetadata.active_source_of_truth === false, {
  inventory_active_source_of_truth: inventoryMetadata.active_source_of_truth,
  checksum_active_source_of_truth: checksumMetadata.active_source_of_truth
});
addCheck(checks, "legacy reference source is not required", inventoryMetadata.legacy_source_required === false
  && checksumMetadata.legacy_source_required === false, {
  inventory_legacy_source_required: inventoryMetadata.legacy_source_required,
  checksum_legacy_source_required: checksumMetadata.legacy_source_required
});
addCheck(checks, "no source scan or checksum recalculation recorded", inventoryMetadata.source_scan_performed === false
  && checksumMetadata.source_scan_performed === false
  && inventoryMetadata.checksum_recalculated === false
  && checksumMetadata.checksum_recalculated === false, {
  inventory_metadata: inventoryMetadata,
  checksum_metadata: checksumMetadata
});
addCheck(checks, ".DS_Store paths absent from reference baseline", dsStorePaths.length === 0, { ds_store_paths: dsStorePaths });

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "reference-baseline-integrity-checked",
  checker: "check_reference_baseline_integrity.mjs",
  reference_baseline_path: BASELINE_DIR,
  requires_legacy_reference_source: false,
  legacy_source_required: false,
  source_scan_performed: false,
  checksum_recalculated: false,
  refresh_performed: false,
  ds_store_excluded: dsStorePaths.length === 0,
  reference_baseline_check_passed: failures.length === 0,
  inventory_entries: inventoryEntries.length,
  checksum_entries: checksumEntries.length,
  ds_store_paths: dsStorePaths,
  checks,
  failures,
  unresolved_items_count: failures.length,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(`${EVIDENCE_DIR}/reference_baseline_integrity_report.json`, report);
writeJson(`${FINAL_SURFACE_EVIDENCE_DIR}/reference_baseline_integrity_report.json`, report);
writeJson(`${EVIDENCE_DIR}/reference_baseline_deemphasis_gate_report.json`, {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  reference_baseline_deemphasized: true,
  reference_baseline_integrity_checked: report.status === "pass",
  reference_baseline_check_passed: report.reference_baseline_check_passed,
  active_docs_reference_name_aligned: null,
  legacy_reference_policy_recorded: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: failures.length
});
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
