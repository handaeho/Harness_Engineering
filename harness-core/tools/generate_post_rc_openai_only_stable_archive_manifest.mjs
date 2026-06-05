#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-final-handoff-and-archive";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-stable-final-handoff";
const SCOPE = "openai_only_post_rc";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable";

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
    return {
      path: relPath,
      status: "missing"
    };
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    return {
      path: relPath,
      type: "file",
      sha256: sha256Buffer(fs.readFileSync(abs))
    };
  }
  const files = listFilesRecursive(abs);
  const file_entries = files.map((file) => {
    const rel = toPosix(path.relative(root, file));
    return {
      path: rel,
      sha256: sha256Buffer(fs.readFileSync(file))
    };
  });
  return {
    path: relPath,
    type: "directory",
    file_count: file_entries.length,
    sha256_tree: sha256Buffer(Buffer.from(JSON.stringify(file_entries), "utf8")),
    file_entries
  };
}

function writeJsonSafe(file, value) {
  writeJson(file, value);
}

function writeTextSafe(file, value) {
  writeText(file, value);
}

function markdownManifest(manifest) {
  return `# OpenAI-Only Stable Archive Manifest

Status: ${manifest.status}

- Stage: ${manifest.stage}
- Scope: ${manifest.scope}
- Archive label: ${manifest.archive_label}
- New execution: ${manifest.new_execution}
- Included evidence groups: ${manifest.included_evidence_groups.length}
- OpenAI model API call: ${manifest.openai_model_api_call}
- Telemetry sink write: ${manifest.telemetry_sink_write}
- Local endpoint probe: ${manifest.local_endpoint_probe}
- Local model execution: ${manifest.local_model_execution}
- Additional reference baseline refresh: ${manifest.additional_reference_baseline_refresh}
`;
}

const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/final_evidence_pointer_index.json`) || { entries: [] };
const finalClaimState = readJsonIfExists(`${EVIDENCE_DIR}/final_claim_state.json`) || {};
const finalDeferredPaths = readJsonIfExists(`${EVIDENCE_DIR}/final_deferred_paths.json`) || {};
const includedEvidenceGroups = Array.isArray(pointerIndex.entries)
  ? pointerIndex.entries.map((entry) => entry.group_id)
  : [];

const archiveManifest = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  new_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  included_evidence_groups: includedEvidenceGroups,
  final_claim_state_path: `${EVIDENCE_DIR}/final_claim_state.json`,
  final_evidence_pointer_index_path: `${EVIDENCE_DIR}/final_evidence_pointer_index.json`,
  final_deferred_paths_path: `${EVIDENCE_DIR}/final_deferred_paths.json`
};

writeJsonSafe(e("final_archive_manifest.json"), archiveManifest);

const checksumTargets = [
  `${EVIDENCE_DIR}/final_handoff_report.json`,
  `${EVIDENCE_DIR}/final_claim_state.json`,
  `${EVIDENCE_DIR}/final_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/final_archive_manifest.json`,
  `${EVIDENCE_DIR}/final_deferred_paths.json`,
  `${EVIDENCE_DIR}/final_reference_baseline_refresh_status.json`,
  `${EVIDENCE_DIR}/final_next_options_registry.json`,
  "release/post_rc_openai_only_stable_final_handoff_scope.yaml",
  "release/post_rc_openai_only_stable_final_claim_state.yaml",
  "release/post_rc_openai_only_stable_deferred_paths.yaml",
  "release/post_rc_openai_only_stable_next_options.yaml",
  "docs/openai_only_stable_final_handoff.md",
  "docs/openai_only_stable_final_claim_state.md",
  "docs/openai_only_stable_deferred_paths.md",
  "docs/next_options_after_openai_only_stable.md"
];

const archiveChecksums = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  generated_at: new Date().toISOString(),
  entries: checksumTargets.map(checksumEntry),
  missing_targets: checksumTargets.filter((target) => !exists(target))
};

writeJsonSafe(e("final_archive_checksums.json"), archiveChecksums);

writeTextSafe(p("release", "post_rc_openai_only_stable_archive_manifest.yaml"), `stage: ${STAGE}
status: recorded
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
new_execution: false
openai_model_api_call: false
telemetry_sink_write: false
local_endpoint_probe: false
local_model_execution: false
reference_baseline_source_modified: false
dist_modified: false
additional_reference_baseline_refresh: false
included_evidence_group_count: ${includedEvidenceGroups.length}
`);

writeTextSafe(p("docs", "openai_only_stable_archive_manifest.md"), `# OpenAI-Only Stable Archive Manifest

Archive label: \`${ARCHIVE_LABEL}\`.

This archive manifest records the final OpenAI-only scoped stable handoff. It does not allow bare \`stable\`, bare \`production-ready\`, bare \`release-gated\`, provider-diverse, provider-verified, adapter-checked, or local-model-verified claims.
`);

const archiveReport = {
  status: archiveManifest.status,
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  included_evidence_group_count: includedEvidenceGroups.length,
  checksum_entry_count: archiveChecksums.entries.length,
  checksum_missing_targets: archiveChecksums.missing_targets,
  final_claim_state_status: finalClaimState.status,
  final_deferred_paths_status: finalDeferredPaths.status,
  new_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  additional_reference_baseline_refresh: false
};

writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_archive_report.json"), archiveReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_archive_report.md"), markdownManifest(archiveManifest));

console.log(JSON.stringify(archiveReport, null, 2));
process.exit(archiveReport.status === "recorded" && archiveChecksums.missing_targets.length === 0 ? 0 : 1);
