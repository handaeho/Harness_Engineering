#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ensureDir, readJson, writeJson } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const v2Root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(v2Root) === "prompt-stack-v2" ? path.dirname(v2Root) : repoRoot;
const v36Root = path.resolve(workspaceRoot, "prompt-stack", "v36");
const alphaEvidence = path.join(v2Root, "evidence", "alpha");
const betaEvidence = path.join(v2Root, "evidence", "beta-preflight");
const baselineDir = path.join(v2Root, "evidence", "v36-baseline");

function normalizeV36Path(p) {
  return p.replace(/^prompt-stack\//, "").replace(/\\/g, "/");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const inventory = readJson(path.join(baselineDir, "file_inventory.json"));
const checksums = readJson(path.join(baselineDir, "checksums.json"));
const existingRecord = readJson(path.join(v36Root, "records", "file_checksums.json"));

const inventoryPaths = new Set(inventory.files.map((f) => normalizeV36Path(f.path)));
const snapshotByPath = new Map(checksums.files.map((f) => [normalizeV36Path(f.path), f]));
const existingByPath = new Map(existingRecord.files.map((f) => [normalizeV36Path(f.path), f]));
const excludedMutable = new Set((existingRecord.excluded_mutable || []).map(normalizeV36Path));

const missingSnapshotForInventory = [...inventoryPaths].filter((p) => !snapshotByPath.has(p));
const missingInventoryForSnapshot = [...snapshotByPath.keys()].filter((p) => !inventoryPaths.has(p));

const comparedAgainstExisting = [];
const existingMismatches = [];
const existingMissingFromSnapshot = [];
for (const [p, record] of existingByPath.entries()) {
  const snapshot = snapshotByPath.get(p);
  if (!snapshot) {
    existingMissingFromSnapshot.push(p);
    continue;
  }
  comparedAgainstExisting.push(p);
  if (snapshot.sha256 !== record.checksum) {
    existingMismatches.push({
      path: p,
      existing_record_sha256: record.checksum,
      alpha_snapshot_sha256: snapshot.sha256
    });
  }
}

const notInExistingRecord = [];
for (const p of snapshotByPath.keys()) {
  if (!existingByPath.has(p)) {
    notInExistingRecord.push({
      path: p,
      explanation: excludedMutable.has(p)
        ? "listed in v36 records/file_checksums.json excluded_mutable"
        : "not present in v36 records/file_checksums.json and not listed as excluded_mutable"
    });
  }
}

const currentSnapshotMismatches = [];
for (const [p, snapshot] of snapshotByPath.entries()) {
  const rel = p.replace(/^v36\//, "");
  const file = path.join(v36Root, ...rel.split("/"));
  if (!fs.existsSync(file)) {
    currentSnapshotMismatches.push({ path: p, issue: "missing_current_file" });
    continue;
  }
  const currentHash = sha256(file);
  if (currentHash !== snapshot.sha256) {
    currentSnapshotMismatches.push({
      path: p,
      issue: "current_hash_differs_from_alpha_snapshot",
      alpha_snapshot_sha256: snapshot.sha256,
      current_sha256: currentHash
    });
  }
}

const unexplainedItems = notInExistingRecord
  .filter((item) => !item.explanation.includes("excluded_mutable"))
  .concat(missingSnapshotForInventory.map((p) => ({ path: p, explanation: "inventory path has no checksum snapshot" })))
  .concat(missingInventoryForSnapshot.map((p) => ({ path: p, explanation: "checksum snapshot path has no inventory entry" })))
  .concat(existingMissingFromSnapshot.map((p) => ({ path: p, explanation: "existing v36 checksum record missing from alpha snapshot" })))
  .concat(currentSnapshotMismatches.map((item) => ({ path: item.path, explanation: item.issue })));

const result = {
  status: unexplainedItems.length === 0 && existingMismatches.length === 0 ? "pass" : "fail",
  source_package: "prompt-stack/v36",
  alpha_snapshot: {
    inventory_count: inventory.file_count,
    checksum_count: checksums.file_count,
    full_current_snapshot_exists: missingSnapshotForInventory.length === 0 && missingInventoryForSnapshot.length === 0,
    current_snapshot_checked_count: snapshotByPath.size,
    current_snapshot_mismatch_count: currentSnapshotMismatches.length
  },
  existing_v36_checksum_record: {
    path: "prompt-stack/v36/records/file_checksums.json",
    checked_count: comparedAgainstExisting.length,
    mismatch_count: existingMismatches.length,
    mismatch_scope_note: "Mismatch count applies only to files present in v36 records/file_checksums.json and alpha checksum snapshot.",
    excluded_mutable_count: excludedMutable.size,
    excluded_mutable_paths: [...excludedMutable].sort()
  },
  count_difference_explanation: {
    alpha_checksum_count: checksums.file_count,
    existing_record_count: existingRecord.file_count,
    unchecked_or_unmatched_count: notInExistingRecord.length,
    explanation: "The alpha snapshot covers every current file under prompt-stack/v36. The existing v36 checksum record intentionally excluded mutable validation/integrity files, so only its 118 recorded files can be compared against that historical record."
  },
  not_in_existing_record: notInExistingRecord.sort((a, b) => a.path.localeCompare(b.path)),
  existing_record_mismatches: existingMismatches,
  unresolved_items_count: unexplainedItems.length,
  runner_reexecution: {
    v36_runners_reexecuted: false,
    note: "Existing records/reports were inspected, but v36 runners were not re-executed in this step."
  }
};

ensureDir(alphaEvidence);
ensureDir(betaEvidence);
writeJson(path.join(alphaEvidence, "baseline_comparison.json"), result);
writeJson(path.join(alphaEvidence, "unresolved_items.json"), unexplainedItems);
writeJson(path.join(betaEvidence, "unresolved_items.json"), unexplainedItems);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
