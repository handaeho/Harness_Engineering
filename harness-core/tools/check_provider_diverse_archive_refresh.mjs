#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-archive-refresh-and-next-gates-preflight";
const EVIDENCE_DIR = "post-combined-provider-diverse-archive-refresh";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
const REQUIRED_EVIDENCE_FILES = [
  "provider_diverse_archive_refresh_report.json",
  "provider_diverse_final_claim_state.json",
  "provider_diverse_evidence_pointer_index_update.json",
  "provider_diverse_archive_manifest_refresh.json",
  "provider_diverse_archive_checksums_refresh.json",
  "provider_diverse_strict_paths_refresh.json",
  "provider_diverse_next_gates_registry.json",
  "provider_diverse_final_export_draft_refresh.json",
  "provider_diverse_archive_refresh_gate_report.json",
  "unresolved_items.json"
];
const REQUIRED_REL_PATHS = [
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
  "evals/reports/provider_diverse_archive_refresh_gate_report.json",
  "evals/reports/provider_diverse_archive_refresh_gate_report.md",
  "docs/provider_diverse_archive_refresh.ko.md",
  "docs/provider_diverse_final_claim_state.ko.md",
  "docs/provider_diverse_next_gates.ko.md",
  "docs/next_provider_verified_gate_preflight_plan.ko.md",
  "docs/next_adapter_checked_gate_preflight_plan.ko.md",
  "docs/next_final_export_execution_plan.ko.md",
  "tools/refresh_combined_archive_after_provider_diverse.mjs",
  "tools/refresh_final_export_draft_after_provider_diverse.mjs",
  "tools/check_provider_diverse_archive_refresh.mjs"
];
const REQUIRED_POINTER_GROUPS = [
  "post-combined-provider-diverse-final-gate",
  "post-combined-provider-diverse-path-design",
  "post-combined-provider-diverse-evidence-inventory",
  "post-combined-strict-paths-owner-decision-packet",
  "combined-openai-local-archive-export",
  "post-stable-local-model-verified-final-handoff",
  "post-rc-openai-only-stable-final-handoff"
];
const BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const PRIOR_BASELINE_REFRESH_FILES = [
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

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

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
}

function blockedFlagsFalse(record) {
  return record?.provider_verified_allowed === false
    && record?.adapter_checked_allowed === false
    && record?.production_ready_allowed === false
    && record?.stable_allowed === false
    && record?.release_gated_allowed === false
    && (record?.bare_release_gated_allowed === false || record?.bare_release_gated_allowed === undefined);
}

function forbiddenExecutionFalse(record) {
  return record?.new_local_model_execution === false
    && record?.openai_model_api_call === false
    && record?.telemetry_sink_write === false
    && record?.actual_export_write === false
    && record?.reference_baseline_source_modified === false
    && record?.dist_modified === false
    && (record?.additional_reference_baseline_refresh === false || record?.evidence_reference_baseline_refreshed_in_this_stage === false);
}

function gateMarkdown(gate) {
  return `# Provider-Diverse Archive Refresh Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Archive label: ${gate.archive_label}
- Provider-diverse: ${gate.provider_diverse}
- Can claim provider-verified: ${gate.can_claim_provider_verified}
- Can claim adapter-checked: ${gate.can_claim_adapter_checked}
- Can enter stable release: ${gate.can_enter_stable_release}
- Actual export write: ${gate.actual_export_write}
- New local model execution: ${gate.new_local_model_execution}
- OpenAI model API call: ${gate.openai_model_api_call}
- Telemetry sink write: ${gate.telemetry_sink_write}
- reference baseline source modified: ${gate.reference_baseline_source_modified}
- dist modified: ${gate.dist_modified}
- Additional evidence/reference-baseline refresh: ${gate.additional_reference_baseline_refresh}
- Reason: ${gate.reason}
`;
}

function writeGate(gate) {
  writeJson(e("provider_diverse_archive_refresh_gate_report.json"), gate);
  writeJson(p("evals", "reports", "provider_diverse_archive_refresh_gate_report.json"), gate);
  writeText(p("evals", "reports", "provider_diverse_archive_refresh_gate_report.md"), gateMarkdown(gate));
}

const preliminaryGate = {
  status: "pending_check",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  provider_diverse: true,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_enter_stable_release: false,
  actual_export_write: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  reason: "Preliminary provider-diverse archive refresh gate report."
};
writeGate(preliminaryGate);

const report = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_archive_refresh_report.json`);
const claimState = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_claim_state.json`);
const pointerIndex = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_evidence_pointer_index_update.json`);
const manifest = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_archive_manifest_refresh.json`);
const checksums = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_archive_checksums_refresh.json`);
const strictPaths = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_strict_paths_refresh.json`);
const nextGates = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_next_gates_registry.json`);
const exportDraft = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_export_draft_refresh.json`);
const unresolved = readJsonIfExists(`evidence/${EVIDENCE_DIR}/unresolved_items.json`);
const finalGate = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json");
const compare = runNode("check_reference_baseline_integrity.mjs");
const scanCli = runNode("scan_prohibited_claims.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/provider_diverse_archive_refresh_gate_report.json",
    "evals/reports/provider_diverse_archive_refresh_gate_report.md"
  ]
});
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline", "harness-core/node_modules"]);
const protectedPaths = statusPaths(protectedStatus);
const baselinePaths = protectedPaths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/"));
const baselineOnlyPriorRefresh = baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file));

const checks = [];
for (const file of REQUIRED_EVIDENCE_FILES) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
for (const file of REQUIRED_REL_PATHS) {
  addCheck(checks, `${file} exists`, exists(file), {});
}
addCheck(checks, "archive refresh report pass", report?.status === "pass"
  && report?.stage === STAGE
  && report?.archive_label === ARCHIVE_LABEL
  && report?.scope === SCOPE
  && report?.provider_diverse === true
  && report?.provider_diverse_allowed === true
  && blockedFlagsFalse(report)
  && forbiddenExecutionFalse(report)
  && report?.new_local_model_generation === false
  && report?.openai_provider_call === false
  && report?.telemetry_sink_write === false
  && report?.actual_export_write === false
  && report?.evidence_reference_baseline_refreshed_in_this_stage === false,
report || {});
addCheck(checks, "final claim state records provider-diverse only", claimState?.status === "recorded"
  && claimState?.archive_scope === SCOPE
  && Array.isArray(claimState?.allowed_claims)
  && claimState.allowed_claims.includes("provider-diverse")
  && claimState.allowed_claims.includes("local-model-verified")
  && Array.isArray(claimState?.blocked_claims)
  && includesAll(claimState.blocked_claims, BLOCKED_CLAIMS)
  && claimState?.provider_diverse === true
  && claimState?.provider_diverse_allowed === true
  && blockedFlagsFalse(claimState),
claimState || {});
const pointerGroups = Array.isArray(pointerIndex?.entries)
  ? pointerIndex.entries.map((entry) => entry.group_id)
  : [];
addCheck(checks, "evidence pointer index includes provider-diverse groups", pointerIndex?.status === "recorded"
  && includesAll(pointerGroups, REQUIRED_POINTER_GROUPS)
  && pointerIndex.entries.every((entry) => entry.status === "pass")
  && pointerIndex.entries.every((entry) => Array.isArray(entry.supports_claims))
  && pointerIndex.entries.every((entry) => Array.isArray(entry.does_not_support_claims)),
{ pointerGroups, required: REQUIRED_POINTER_GROUPS });
addCheck(checks, "archive manifest reflects provider-diverse without strong claim escalation", manifest?.status === "recorded"
  && manifest?.stage === STAGE
  && manifest?.archive_label === ARCHIVE_LABEL
  && manifest?.scope === SCOPE
  && manifest?.provider_diverse === true
  && blockedFlagsFalse(manifest)
  && forbiddenExecutionFalse(manifest)
  && manifest?.additional_reference_baseline_refresh === false,
manifest || {});
addCheck(checks, "archive checksums recorded without missing targets", checksums?.status === "recorded"
  && Array.isArray(checksums?.missing_targets)
  && checksums.missing_targets.length === 0,
checksums || {});
addCheck(checks, "strict paths refreshed with provider-diverse allowed only", strictPaths?.status === "recorded"
  && strictPaths?.provider_diverse?.status === "allowed"
  && strictPaths?.provider_verified?.status === "blocked"
  && strictPaths?.adapter_checked?.status === "blocked"
  && strictPaths?.general_production_ready_and_stable?.status === "blocked",
strictPaths || {});
addCheck(checks, "next gates registry recorded", nextGates?.status === "recorded"
  && Array.isArray(nextGates?.next_gates)
  && nextGates.next_gates.length === 3
  && nextGates.next_gates.some((gate) => gate.claim_target === "provider-verified")
  && nextGates.next_gates.some((gate) => gate.claim_target === "adapter-checked")
  && nextGates.next_gates.some((gate) => gate.stage === "v2.0.0-final-export-execution"),
nextGates || {});
addCheck(checks, "final export draft refresh recorded without actual export write", exportDraft?.status === "recorded"
  && exportDraft?.previous_export_draft_status === "pass"
  && exportDraft?.provider_diverse_reflected === true
  && exportDraft?.actual_export_write === false
  && exportDraft?.dist_modified === false
  && exportDraft?.next_export_stage === "v2.0.0-final-export-execution"
  && exportDraft?.requires_operator_signal === true
  && blockedFlagsFalse(exportDraft),
exportDraft || {});
addCheck(checks, "final provider-diverse gate remains pass", finalGate?.status === "pass"
  && finalGate?.provider_diverse_allowed === true
  && finalGate?.provider_verified_allowed === false
  && finalGate?.adapter_checked_allowed === false,
finalGate || {});
addCheck(checks, "unresolved items empty", unresolved?.status === "pass"
  && unresolved?.unresolved_items_count === 0
  && Array.isArray(unresolved?.unresolved_items)
  && unresolved.unresolved_items.length === 0,
unresolved || {});
addCheck(checks, "claim scan has no forbidden positive strong claims", scan.status === "pass"
  && scanCli.exit_code === 0
  && scanCli.status === "pass"
  && !scan.matches.some((match) => ["provider-verified", "adapter-checked", "production-ready", "stable", "release-gated"].includes(match.claim)),
{
  scan_status: scan.status,
  scan_cli_status: scanCli.status,
  matches: scan.matches.length,
  provider_diverse_conditional_mentions: scan.allowed_mentions.filter((mention) => mention.claim === "provider-diverse").length
});
addCheck(checks, "protected paths are not modified by this stage", protectedStatus.exit_code === 0
  && !protectedPaths.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source")
  && !protectedPaths.some((file) => file.startsWith("dist/") || file === "dist")
  && !protectedPaths.some((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules")
  && baselineOnlyPriorRefresh,
{ ...protectedStatus, protectedPaths, baselineOnlyPriorRefresh });
addCheck(checks, "reference baseline compare passes", compare.exit_code === 0 && compare.status === "pass", {
  exit_code: compare.exit_code,
  status: compare.status,
  stderr_excerpt: compare.stderr_excerpt
});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  provider_diverse: failures.length === 0,
  provider_diverse_allowed: failures.length === 0,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_production_ready: false,
  can_claim_stable: false,
  can_claim_release_gated: false,
  can_enter_stable_release: false,
  actual_export_write: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  node_modules_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  unresolved_items_count: unresolved?.unresolved_items_count ?? failures.length,
  reason: failures.length === 0
    ? "Provider-diverse claim is reflected in combined archive. Provider-verified and adapter-checked remain separate gates."
    : "Provider-diverse archive refresh checks failed.",
  checks,
  failures
};

writeGate(gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
