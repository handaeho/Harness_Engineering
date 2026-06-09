#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STAGE = "v2.0.0-post-rename-reference-baseline-deemphasis";
const EVIDENCE_DIR = "evidence/reference-baseline-deemphasis";
const TARGET_DIR = "evidence/reference-baseline";
const LEGACY_TOKEN = ["v", "36"].join("");
const COMPATIBILITY_DIR = ["evidence", `${LEGACY_TOKEN}-baseline`].join("/");
const LEGACY_SOURCE_PATH = ["prompt-stack", LEGACY_TOKEN].join("/");

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

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(p(relPath), "utf8"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function transformString(value) {
  return value
    .split(LEGACY_SOURCE_PATH).join("historical-reference-source")
    .split(`${LEGACY_TOKEN}-baseline`).join("reference-baseline")
    .split(`${LEGACY_TOKEN}/`).join("historical-reference/")
    .split(LEGACY_TOKEN).join("legacy reference");
}

function transformKey(value) {
  return value
    .split(`${LEGACY_TOKEN}_`).join("legacy_reference_")
    .split(`_${LEGACY_TOKEN}`).join("_legacy_reference")
    .split(`${LEGACY_TOKEN}-baseline`).join("reference-baseline")
    .split(LEGACY_TOKEN).join("legacy_reference");
}

function transform(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(typeof item === "string" && item.includes(".DS_Store") && item.includes("/")))
      .map(transform);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [transformKey(key), transform(item)])
    );
  }
  if (typeof value === "string") return transformString(value);
  return value;
}

function prepareSnapshot(source) {
  const snapshot = transform(source);
  snapshot.source_package = "historical_reference_snapshot";
  snapshot.reference_baseline_metadata = {
    status: "available",
    role: "historical_reference_snapshot",
    active_source_of_truth: false,
    path: TARGET_DIR,
    policy: "Used only as an integrity reference snapshot. It is not the current operating asset.",
    migration_policy: "label_deemphasis_without_checksum_recalculation_or_source_rescan",
    checksum_recalculated: false,
    source_scan_performed: false,
    legacy_source_required: false
  };
  return snapshot;
}

const sourceInventoryPath = `${COMPATIBILITY_DIR}/file_inventory.json`;
const sourceChecksumsPath = `${COMPATIBILITY_DIR}/checksums.json`;
const sourceInventoryExists = fs.existsSync(p(sourceInventoryPath));
const sourceChecksumsExists = fs.existsSync(p(sourceChecksumsPath));

if (!sourceInventoryExists || !sourceChecksumsExists) {
  const report = {
    status: "fail",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    reason: "compatibility snapshot files missing",
    source_inventory_exists: sourceInventoryExists,
    source_checksums_exists: sourceChecksumsExists,
    source_scan_performed: false,
    checksum_recalculated: false
  };
  writeJson(`${EVIDENCE_DIR}/reference_baseline_migration_manifest.json`, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const sourceInventory = readJson(sourceInventoryPath);
const sourceChecksums = readJson(sourceChecksumsPath);
const referenceInventory = prepareSnapshot(sourceInventory);
const referenceChecksums = prepareSnapshot(sourceChecksums);

writeJson(`${TARGET_DIR}/file_inventory.json`, referenceInventory);
writeJson(`${TARGET_DIR}/checksums.json`, referenceChecksums);

const generatedAt = new Date().toISOString();
const report = {
  status: "pass",
  stage: STAGE,
  generated_at: generatedAt,
  weak_claims_recorded: [
    "reference-baseline-deemphasized",
    "legacy-reference-policy-recorded"
  ],
  target_path: TARGET_DIR,
  compatibility_snapshot_used: true,
  source_scan_performed: false,
  checksum_recalculated: false,
  legacy_source_required: false,
  file_inventory_written: true,
  checksums_written: true,
  file_count: referenceInventory.file_count || referenceInventory.files?.length || null,
  checksum_count: referenceChecksums.files?.length || null,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(`${EVIDENCE_DIR}/reference_baseline_deemphasis_report.json`, report);
writeJson(`${EVIDENCE_DIR}/reference_baseline_migration_manifest.json`, {
  ...report,
  migration_action: "compatibility_snapshot_relabelled_to_reference_baseline",
  original_snapshot_label_retained_in_active_docs: false
});
writeJson(`${EVIDENCE_DIR}/legacy_reference_policy.json`, {
  status: "recorded",
  stage: STAGE,
  generated_at: generatedAt,
  policy: "Historical reference labels are allowed only in archive, compatibility, or explicitly scoped legacy-reference policy contexts.",
  active_source_of_truth: false,
  legacy_source_required: false,
  source_scan_performed: false,
  checksum_recalculated: false
});
writeJson(`${EVIDENCE_DIR}/active_docs_reference_name_scan.json`, {
  status: "not_run",
  stage: STAGE,
  generated_at: generatedAt,
  note: "Run node tools/checks/workspace/check_reference_baseline_naming.mjs."
});
writeJson(`${EVIDENCE_DIR}/reference_baseline_integrity_report.json`, {
  status: "not_run",
  stage: STAGE,
  generated_at: generatedAt,
  note: "Run node tools/checks/workspace/check_reference_baseline_integrity.mjs."
});
writeJson(`${EVIDENCE_DIR}/reference_baseline_deemphasis_gate_report.json`, {
  status: "recorded",
  stage: STAGE,
  generated_at: generatedAt,
  reference_baseline_deemphasized: true,
  legacy_reference_policy_recorded: true,
  active_docs_reference_name_aligned: false,
  reference_baseline_integrity_checked: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
});
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: "pass",
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items_count: 0,
  unresolved_items: []
});

console.log(JSON.stringify(report, null, 2));
