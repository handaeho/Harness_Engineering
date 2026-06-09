#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-final-export-execution";
const PACKAGE_PATH = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-export.zip";
const EVIDENCE_DIR = "evidence/final-export-execution";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function sha256(relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(relPath))).digest("hex");
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) ? readJson(file) : null;
}

function packageEntries() {
  const result = spawnSync("zipinfo", ["-1", p(PACKAGE_PATH)], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/final_export_execution_report.json`) || {};
const claimState = readJsonIfExists(`${EVIDENCE_DIR}/final_export_claim_state.json`) || {};
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/final_export_claim_boundary.json`) || {};
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`) || {};
const entries = packageEntries();
const packageSha = fs.existsSync(p(PACKAGE_PATH)) ? sha256(PACKAGE_PATH) : null;
const manifest = {
  status: packageSha ? "exported" : "blocked",
  stage: STAGE,
  archive_label: report.archive_label || "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse",
  scope: report.scope || "openai_api_lane_plus_ollama_qwen3_local_lane",
  package_path: PACKAGE_PATH,
  package_sha256: packageSha,
  package_entry_count: entries.length,
  package_entries: entries,
  final_claim_state_path: `${EVIDENCE_DIR}/final_export_claim_state.json`,
  final_claim_boundary_path: `${EVIDENCE_DIR}/final_export_claim_boundary.json`,
  final_evidence_pointer_index_path: `${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`,
  allowed_claims: claimState.allowed_claims || [],
  blocked_claims: boundary.blocked_claims || claimState.blocked_claims || []
};
const packageRecord = readJsonIfExists(`${EVIDENCE_DIR}/final_export_package_record.json`) || {};
packageRecord.package_sha256 = packageSha;
packageRecord.package_entry_count = entries.length;
packageRecord.package_checksum_recorded = packageSha !== null;

writeJson(p(`${EVIDENCE_DIR}/final_export_manifest.json`), manifest);
writeJson(p(`${EVIDENCE_DIR}/final_export_package_record.json`), packageRecord);
writeJson(p(`${EVIDENCE_DIR}/final_export_checksums.json`), {
  status: "recorded",
  stage: STAGE,
  checksum_algorithm: "sha256",
  entries: [
    { path: PACKAGE_PATH, sha256: packageSha },
    { path: `${EVIDENCE_DIR}/final_export_execution_report.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_execution_report.json`) },
    { path: `${EVIDENCE_DIR}/final_export_manifest.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_manifest.json`) },
    { path: `${EVIDENCE_DIR}/final_export_claim_state.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_claim_state.json`) },
    { path: `${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`) },
    { path: `${EVIDENCE_DIR}/final_export_claim_boundary.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_claim_boundary.json`) },
    { path: `${EVIDENCE_DIR}/final_export_package_record.json`, sha256: sha256(`${EVIDENCE_DIR}/final_export_package_record.json`) }
  ],
  missing_targets: packageSha ? [] : [PACKAGE_PATH]
});

console.log(JSON.stringify(manifest, null, 2));
process.exit(manifest.status === "exported" ? 0 : 1);
