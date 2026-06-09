#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-combined-openai-local-archive-export";
const EVIDENCE_DIR = "evidence/combined-openai-local-archive-export";
const SCOPE = "openai_only_post_rc_plus_ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified-ollama-qwen3";

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

const archiveExportReport = readJsonIfExists(`${EVIDENCE_DIR}/combined_archive_export_report.json`) || {};
const finalClaimState = readJsonIfExists(`${EVIDENCE_DIR}/combined_final_claim_state.json`) || {};
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/combined_evidence_pointer_index.json`) || { entries: [] };
const strictPaths = readJsonIfExists(`${EVIDENCE_DIR}/combined_strict_paths.json`) || {};
const nextOptions = readJsonIfExists(`${EVIDENCE_DIR}/combined_next_options.json`) || {};
const includedEvidenceGroups = Array.isArray(pointerIndex.entries)
  ? pointerIndex.entries.map((entry) => entry.group_id)
  : [];

const archiveManifest = {
  status: "recorded",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  included_evidence_groups: includedEvidenceGroups,
  source_archives: [
    "evidence/post-rc-openai-only-stable-final-handoff/final_archive_manifest.json",
    "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_archive_manifest.json"
  ],
  combined_archive_export_report_path: `${EVIDENCE_DIR}/combined_archive_export_report.json`,
  combined_final_claim_state_path: `${EVIDENCE_DIR}/combined_final_claim_state.json`,
  combined_evidence_pointer_index_path: `${EVIDENCE_DIR}/combined_evidence_pointer_index.json`,
  combined_strict_paths_path: `${EVIDENCE_DIR}/combined_strict_paths.json`,
  combined_next_options_path: `${EVIDENCE_DIR}/combined_next_options.json`
};

writeJson(e("combined_archive_manifest.json"), archiveManifest);

const checksumTargets = [
  `${EVIDENCE_DIR}/combined_archive_export_report.json`,
  `${EVIDENCE_DIR}/combined_final_claim_state.json`,
  `${EVIDENCE_DIR}/combined_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/combined_archive_manifest.json`,
  `${EVIDENCE_DIR}/combined_strict_paths.json`,
  `${EVIDENCE_DIR}/combined_reference_baseline_status.json`,
  `${EVIDENCE_DIR}/combined_next_options.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "release/scopes/combined/combined_openai_local_archive_export_scope.yaml",
  "release/claims/combined/combined_openai_local_final_claim_state.yaml",
  "release/manifests/combined/combined_openai_local_archive_manifest.yaml",
  "release/paths/combined/combined_openai_local_strict_paths.yaml",
  "release/decisions/combined/combined_openai_local_next_options.yaml",
  "tools/builders/openai/build_combined_openai_local_archive_export.mjs",
  "tools/generators/openai/generate_combined_openai_local_archive_manifest.mjs",
  "tools/checks/openai/check_combined_openai_local_archive_export.mjs",
  "evals/suites/combined_openai_local_archive_export.yaml",
  "evals/reports/combined_openai_local_archive_export_report.json",
  "evals/reports/combined_openai_local_archive_export_report.md",
  "docs/local/combined_openai_local_archive_export.ko.md",
  "docs/claims/combined_openai_local_final_claim_state.ko.md",
  "docs/local/combined_openai_local_strict_paths.ko.md",
  "docs/local/combined_openai_local_next_options.ko.md"
];

const archiveChecksums = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  generated_at: new Date().toISOString(),
  entries: checksumTargets.map(checksumEntry),
  missing_targets: checksumTargets.filter((target) => !exists(target))
};

writeJson(e("combined_archive_checksums.json"), archiveChecksums);

const archiveReport = {
  status: archiveManifest.status,
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  included_evidence_group_count: includedEvidenceGroups.length,
  checksum_entry_count: archiveChecksums.entries.length,
  checksum_missing_targets: archiveChecksums.missing_targets,
  archive_export_status: archiveExportReport.status,
  final_claim_state_status: finalClaimState.status,
  strict_paths_status: strictPaths.status,
  next_options_status: nextOptions.status,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  additional_reference_baseline_refresh: false
};

writeJson(p("evals", "reports", "combined_openai_local_archive_manifest_report.json"), archiveReport);
writeText(p("evals", "reports", "combined_openai_local_archive_manifest_report.md"), `# Combined OpenAI Local Archive Manifest Report

Status: ${archiveReport.status}

- Stage: ${STAGE}
- Scope: ${SCOPE}
- Archive label: ${ARCHIVE_LABEL}
- Included evidence groups: ${includedEvidenceGroups.length}
- Checksum entries: ${archiveChecksums.entries.length}
- Missing checksum targets: ${archiveChecksums.missing_targets.length}
- New local model execution: false
- OpenAI model API call: false
- Telemetry sink write: false
- Local endpoint probe: false
- Additional evidence/reference-baseline refresh: false
`);

console.log(JSON.stringify(archiveReport, null, 2));
process.exit(archiveReport.status === "recorded" && archiveChecksums.missing_targets.length === 0 ? 0 : 1);
