#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verified-final-handoff-and-archive";
const EVIDENCE_DIR = "evidence/post-stable-local-model-verified-final-handoff";
const SCOPE = "ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-post-stable+local-model-verified-ollama-qwen3-lane";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(...parts) {
  return p(...EVIDENCE_DIR.split("/"), ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function listFilesRecursive(absPath) {
  if (!fs.existsSync(absPath)) return [];
  const stat = fs.statSync(absPath);
  if (stat.isFile()) return [absPath];
  const files = [];
  for (const item of fs.readdirSync(absPath, { withFileTypes: true })) {
    const child = path.join(absPath, item.name);
    if (item.isDirectory()) files.push(...listFilesRecursive(child));
    if (item.isFile()) files.push(child);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function checksumEntry(relPath) {
  const abs = p(...relPath.split("/"));
  if (!fs.existsSync(abs)) {
    return { path: relPath, status: "missing" };
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    return {
      path: relPath,
      type: "file",
      sha256: sha256Buffer(fs.readFileSync(abs))
    };
  }
  const fileEntries = listFilesRecursive(abs).map((file) => {
    const rel = toPosix(path.relative(root, file));
    return {
      path: rel,
      sha256: sha256Buffer(fs.readFileSync(file))
    };
  });
  return {
    path: relPath,
    type: "directory",
    file_count: fileEntries.length,
    sha256_tree: sha256Buffer(Buffer.from(JSON.stringify(fileEntries), "utf8")),
    file_entries: fileEntries
  };
}

const handoffReport = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_final_handoff_report.json`) || {};
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_evidence_pointer_index.json`) || { entries: [] };
const finalClaimState = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_final_claim_state.json`) || {};
const strictPaths = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_strict_paths.json`) || {};
const includedEvidenceGroups = Array.isArray(pointerIndex.entries)
  ? pointerIndex.entries.map((entry) => entry.group_id)
  : [];

const archiveManifest = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  new_local_model_execution: false,
  new_local_model_generation: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  included_evidence_groups: includedEvidenceGroups,
  final_handoff_report_path: `${EVIDENCE_DIR}/local_model_verified_final_handoff_report.json`,
  final_claim_state_path: `${EVIDENCE_DIR}/local_model_verified_final_claim_state.json`,
  evidence_pointer_index_path: `${EVIDENCE_DIR}/local_model_verified_evidence_pointer_index.json`,
  strict_paths_path: `${EVIDENCE_DIR}/local_model_verified_strict_paths.json`,
  next_options_path: `${EVIDENCE_DIR}/local_model_verified_next_options.json`
};

writeJson(e("local_model_verified_archive_manifest.json"), archiveManifest);
writeText(p("release", "post_stable_local_model_verified_archive_manifest.yaml"), `stage: ${STAGE}
status: recorded
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
reference_baseline_source_modified: false
dist_modified: false
additional_reference_baseline_refresh: false
included_evidence_group_count: ${includedEvidenceGroups.length}
`);
writeText(p("docs", "local_model_verified_archive_manifest.ko.md"), `# Local-model-verified archive manifest

Archive label: \`${ARCHIVE_LABEL}\`.

이 archive manifest는 ${SCOPE}의 local-model-verified final handoff를 기록한다.
provider-diverse, provider-verified, adapter-checked, production-ready, stable, release-gated claim은 계속 차단한다.
`);

const checksumTargets = [
  `${EVIDENCE_DIR}/local_model_verified_final_handoff_report.json`,
  `${EVIDENCE_DIR}/local_model_verified_final_claim_state.json`,
  `${EVIDENCE_DIR}/local_model_verified_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/local_model_verified_archive_manifest.json`,
  `${EVIDENCE_DIR}/local_model_verified_strict_paths.json`,
  `${EVIDENCE_DIR}/local_model_verified_reference_baseline_status.json`,
  `${EVIDENCE_DIR}/local_model_verified_next_options.json`,
  "release/post_stable_local_model_verified_final_handoff_scope.yaml",
  "release/post_stable_local_model_verified_final_claim_state.yaml",
  "release/post_stable_local_model_verified_archive_manifest.yaml",
  "release/post_stable_local_model_verified_next_options.yaml",
  "release/post_stable_local_provider_strict_paths.yaml",
  "docs/local_model_verified_final_handoff.ko.md",
  "docs/local_model_verified_final_claim_state.ko.md",
  "docs/local_model_verified_archive_manifest.ko.md",
  "docs/local_model_verified_strict_paths.ko.md",
  "docs/next_provider_diverse_path_plan.ko.md",
  "docs/next_provider_verified_path_plan.ko.md",
  "docs/next_adapter_checked_path_plan.ko.md"
];
const archiveChecksums = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  generated_at: new Date().toISOString(),
  entries: checksumTargets.map(checksumEntry),
  missing_targets: checksumTargets.filter((target) => !exists(target))
};

writeJson(e("local_model_verified_archive_checksums.json"), archiveChecksums);

const archiveReport = {
  status: archiveManifest.status,
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  included_evidence_group_count: includedEvidenceGroups.length,
  checksum_entry_count: archiveChecksums.entries.length,
  checksum_missing_targets: archiveChecksums.missing_targets,
  final_handoff_status: handoffReport.status,
  final_claim_state_status: finalClaimState.status,
  strict_paths_status: strictPaths.status,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  additional_reference_baseline_refresh: false
};

writeJson(p("evals", "reports", "local_model_verified_archive_report.json"), archiveReport);
writeText(p("evals", "reports", "local_model_verified_archive_report.md"), `# Local Model Verified Archive Report

Status: ${archiveReport.status}

- Stage: ${STAGE}
- Scope: ${SCOPE}
- Archive label: ${ARCHIVE_LABEL}
- Included evidence groups: ${includedEvidenceGroups.length}
- Checksum entries: ${archiveChecksums.entries.length}
- Missing checksum targets: ${archiveChecksums.missing_targets.length}
- New local model execution: false
- Additional reference baseline refresh: false
`);

console.log(JSON.stringify(archiveReport, null, 2));
process.exit(archiveReport.status === "recorded" && archiveChecksums.missing_targets.length === 0 ? 0 : 1);
