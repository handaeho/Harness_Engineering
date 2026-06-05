#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-archive-refresh-and-next-gates-preflight";
const EVIDENCE_DIR = "post-combined-provider-diverse-archive-refresh";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function writeTextRel(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function sha256File(relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(...relPath.split("/")))).digest("hex");
}

function checksumEntry(relPath) {
  return exists(relPath)
    ? { path: relPath, type: "file", sha256: sha256File(relPath) }
    : { path: relPath, status: "missing" };
}

const previousDraft = readJsonIfExists("evidence/final-export-package-draft/final_export_package_draft_report.json") || {};
const previousDraftGate = readJsonIfExists("evidence/final-export-package-draft/final_export_package_draft_gate_report.json") || {};
const archiveRefresh = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_archive_refresh_report.json`) || {};
const previousExportDraftStatus = previousDraft.status === "pass" && previousDraftGate.status === "pass" ? "pass" : "not_pass";

const finalExportDraftRefresh = {
  status: archiveRefresh.status === "pass" && previousExportDraftStatus === "pass" ? "recorded" : "blocked",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  previous_export_draft_status: previousExportDraftStatus,
  previous_export_draft_stage: previousDraft.stage || null,
  provider_diverse_reflected: archiveRefresh.provider_diverse === true,
  actual_export_write: false,
  dist_modified: false,
  reference_baseline_source_modified: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  additional_reference_baseline_refresh: false,
  next_export_stage: "v2.0.0-final-export-execution",
  requires_operator_signal: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(e("provider_diverse_final_export_draft_refresh.json"), finalExportDraftRefresh);
writeTextRel("release/post_combined_provider_diverse_final_export_draft_refresh.yaml", `stage: ${STAGE}
status: ${finalExportDraftRefresh.status}
archive_label: ${ARCHIVE_LABEL}
scope: ${SCOPE}
previous_export_draft_status: ${previousExportDraftStatus}
provider_diverse_reflected: ${finalExportDraftRefresh.provider_diverse_reflected}
actual_export_write: false
dist_modified: false
reference_baseline_source_modified: false
next_export_stage: v2.0.0-final-export-execution
requires_operator_signal: true
`);
writeJsonRel("evals/reports/provider_diverse_final_export_draft_refresh_report.json", finalExportDraftRefresh);
writeTextRel("evals/reports/provider_diverse_final_export_draft_refresh_report.md", `# Provider-Diverse Final Export Draft Refresh

Status: ${finalExportDraftRefresh.status}

- Stage: ${STAGE}
- Archive label: ${ARCHIVE_LABEL}
- Scope: ${SCOPE}
- Previous export draft status: ${previousExportDraftStatus}
- Provider-diverse reflected: ${finalExportDraftRefresh.provider_diverse_reflected}
- Actual export write: false
- dist modified: false
- Next export stage: v2.0.0-final-export-execution
- Requires operator signal: true
`);

const checksumTargets = [
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_refresh_report.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_final_claim_state.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_evidence_pointer_index_update.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_manifest_refresh.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_strict_paths_refresh.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_next_gates_registry.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_final_export_draft_refresh.json",
  "evidence/post-combined-provider-diverse-archive-refresh/unresolved_items.json",
  "release/post_combined_provider_diverse_archive_refresh_scope.yaml",
  "release/post_combined_provider_diverse_final_claim_state.yaml",
  "release/post_combined_provider_diverse_archive_manifest.yaml",
  "release/post_combined_provider_diverse_next_gates.yaml",
  "release/post_combined_provider_diverse_final_export_draft_refresh.yaml",
  "evals/suites/post_combined_provider_diverse_archive_refresh.yaml",
  "evals/reports/provider_diverse_archive_refresh_report.json",
  "evals/reports/provider_diverse_archive_refresh_report.md",
  "evals/reports/provider_diverse_final_export_draft_refresh_report.json",
  "evals/reports/provider_diverse_final_export_draft_refresh_report.md",
  "docs/provider_diverse_archive_refresh.ko.md",
  "docs/provider_diverse_final_claim_state.ko.md",
  "docs/provider_diverse_next_gates.ko.md",
  "docs/next_provider_verified_gate_preflight_plan.ko.md",
  "docs/next_adapter_checked_gate_preflight_plan.ko.md",
  "docs/next_final_export_execution_plan.ko.md"
];
const archiveChecksumsRefresh = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  generated_at: new Date().toISOString(),
  entries: checksumTargets.map(checksumEntry),
  missing_targets: checksumTargets.filter((target) => !exists(target))
};
writeJson(e("provider_diverse_archive_checksums_refresh.json"), archiveChecksumsRefresh);

console.log(JSON.stringify(finalExportDraftRefresh, null, 2));
process.exit(finalExportDraftRefresh.status === "recorded" ? 0 : 1);
