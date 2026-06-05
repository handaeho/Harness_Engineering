#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-combined-openai-local-archive-export";
const EVIDENCE_DIR = "evidence/combined-openai-local-archive-export";
const SCOPE = "openai_only_post_rc_plus_ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified-ollama-qwen3";
const REQUIRED_EVIDENCE_GROUPS = [
  "post-rc-openai-only-stable-final-handoff",
  "post-stable-local-model-verified-final-handoff",
  "post-stable-local-model-verification-final-gate",
  "post-stable-local-ollama-adapter-conformance",
  "post-stable-local-redteam-bounded-smoke",
  "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
  "post-rc-production-monitoring-final-gate",
  "post-rc-telemetry-connection",
  "post-rc-openai-only-production-ready-scope-decision",
  "rc1-openai-scope-bundle",
  "rc1-release-gate-actual-openai-scope",
  "rc1-post-release-gate-review",
  "reference-baseline-owner-approved-refresh"
];
const REQUIRED_FILES = [
  "release/combined_openai_local_archive_export_scope.yaml",
  "release/combined_openai_local_final_claim_state.yaml",
  "release/combined_openai_local_archive_manifest.yaml",
  "release/combined_openai_local_strict_paths.yaml",
  "release/combined_openai_local_next_options.yaml",
  "tools/build_combined_openai_local_archive_export.mjs",
  "tools/generate_combined_openai_local_archive_manifest.mjs",
  "tools/check_combined_openai_local_archive_export.mjs",
  "evals/suites/combined_openai_local_archive_export.yaml",
  "evals/reports/combined_openai_local_archive_export_report.json",
  "evals/reports/combined_openai_local_archive_export_report.md",
  "evals/reports/combined_openai_local_archive_manifest_report.json",
  "evals/reports/combined_openai_local_archive_manifest_report.md",
  "evals/reports/combined_openai_local_archive_export_gate_report.json",
  "evals/reports/combined_openai_local_archive_export_gate_report.md",
  `${EVIDENCE_DIR}/combined_archive_export_report.json`,
  `${EVIDENCE_DIR}/combined_final_claim_state.json`,
  `${EVIDENCE_DIR}/combined_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/combined_archive_manifest.json`,
  `${EVIDENCE_DIR}/combined_archive_checksums.json`,
  `${EVIDENCE_DIR}/combined_strict_paths.json`,
  `${EVIDENCE_DIR}/combined_reference_baseline_status.json`,
  `${EVIDENCE_DIR}/combined_next_options.json`,
  `${EVIDENCE_DIR}/combined_archive_export_gate_report.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/combined_openai_local_archive_export.ko.md",
  "docs/combined_openai_local_final_claim_state.ko.md",
  "docs/combined_openai_local_strict_paths.ko.md",
  "docs/combined_openai_local_next_options.ko.md"
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

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
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

function falseFlags(value, flags) {
  return flags.every((flag) => value?.[flag] === false);
}

function gateMarkdown(gate) {
  return `# Combined OpenAI Local Archive Export Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Archive label: ${gate.archive_label}
- Can claim post-rc-openai-only-stable: ${gate.can_claim_post_rc_openai_only_stable}
- Can claim local-model-verified: ${gate.can_claim_local_model_verified}
- Can claim provider diversity allowance: ${gate.can_claim_provider_diverse}
- Can claim provider verification allowance: ${gate.can_claim_provider_verified}
- Can claim adapter checked allowance: ${gate.can_claim_adapter_checked}
- Can claim general stable: ${gate.can_claim_general_stable}
- Reason: ${gate.reason}
`;
}

function writeGate(gate) {
  writeJson(p(...EVIDENCE_DIR.split("/"), "combined_archive_export_gate_report.json"), gate);
  writeJson(p("evals", "reports", "combined_openai_local_archive_export_gate_report.json"), gate);
  writeText(p("evals", "reports", "combined_openai_local_archive_export_gate_report.md"), gateMarkdown(gate));
}

const preliminaryGate = {
  status: "pending_check",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  can_claim_post_rc_openai_only_stable: false,
  can_claim_local_model_verified: false,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_general_stable: false,
  reason: "Preliminary combined archive export gate report."
};
writeGate(preliminaryGate);

const build = runNode("build_combined_openai_local_archive_export.mjs");
const archive = runNode("generate_combined_openai_local_archive_manifest.mjs");
const compare = runNode("check_reference_baseline_integrity.mjs");
const scan = runNode("scan_prohibited_claims.mjs");
const scanReport = readJsonIfExists("evidence/alpha/prohibited_claim_scan.json");

const archiveExport = readJsonIfExists(`${EVIDENCE_DIR}/combined_archive_export_report.json`);
const finalClaimState = readJsonIfExists(`${EVIDENCE_DIR}/combined_final_claim_state.json`);
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/combined_evidence_pointer_index.json`);
const archiveManifest = readJsonIfExists(`${EVIDENCE_DIR}/combined_archive_manifest.json`);
const archiveChecksums = readJsonIfExists(`${EVIDENCE_DIR}/combined_archive_checksums.json`);
const strictPaths = readJsonIfExists(`${EVIDENCE_DIR}/combined_strict_paths.json`);
const referenceBaselineStatus = readJsonIfExists(`${EVIDENCE_DIR}/combined_reference_baseline_status.json`);
const nextOptions = readJsonIfExists(`${EVIDENCE_DIR}/combined_next_options.json`);
const unresolvedItems = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const protectedStatus = gitStatus(["legacy-reference-source", "dist"]);
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const baselinePaths = statusPaths(baselineStatus);
const baselineOnlyPriorRefresh = baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file));
const checks = [];

addCheck(checks, "build_combined_openai_local_archive_export.mjs pass",
  build.exit_code === 0 && build.status === "pass",
  { exit_code: build.exit_code, status: build.status, stderr_excerpt: build.stderr_excerpt });
addCheck(checks, "generate_combined_openai_local_archive_manifest.mjs recorded",
  archive.exit_code === 0 && archive.status === "recorded",
  { exit_code: archive.exit_code, status: archive.status, stderr_excerpt: archive.stderr_excerpt });
addCheck(checks, "check_reference_baseline_integrity.mjs pass",
  compare.exit_code === 0 && compare.status === "pass",
  { exit_code: compare.exit_code, status: compare.status, stderr_excerpt: compare.stderr_excerpt });
addCheck(checks, "scan_prohibited_claims.mjs pass",
  scan.exit_code === 0
    && scan.status === "pass"
    && scanReport?.status === "pass"
    && Array.isArray(scanReport?.matches)
    && scanReport.matches.length === 0,
  {
    exit_code: scan.exit_code,
    status: scan.status,
    report_status: scanReport?.status || null,
    matches: Array.isArray(scanReport?.matches) ? scanReport.matches.length : null,
    stderr_excerpt: scan.stderr_excerpt
  });

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "combined archive export report preserves scoped claims only",
  archiveExport?.status === "pass"
    && archiveExport?.stage === STAGE
    && archiveExport?.archive_label === ARCHIVE_LABEL
    && archiveExport?.scope === SCOPE
    && archiveExport?.post_rc_openai_only_stable === true
    && archiveExport?.local_model_verified === true
    && falseFlags(archiveExport, [
      "provider_diverse_allowed",
      "provider_verified_allowed",
      "adapter_checked_allowed",
      "production_ready_allowed",
      "stable_allowed",
      "release_gated_allowed",
      "bare_release_gated_allowed",
      "new_local_model_execution",
      "openai_model_api_call",
      "telemetry_sink_write",
      "local_endpoint_probe",
      "reference_baseline_source_modified",
      "dist_modified",
      "additional_reference_baseline_refresh"
    ]),
  archiveExport || {});

addCheck(checks, "combined final claim state records allowed and blocked claims",
  finalClaimState?.status === "recorded"
    && finalClaimState?.archive_scope === SCOPE
    && includesAll(finalClaimState?.allowed_claims || [], [
      "post-rc-openai-only-stable",
      "post-rc-openai-only-production-ready",
      "production-monitored",
      "telemetry-connected",
      "containment-verified",
      "rc1-openai-scope-release-gated",
      "local-model-verified"
    ])
    && includesAll(finalClaimState?.blocked_claims || [], [
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "production-ready",
      "stable",
      "release-gated"
    ])
    && finalClaimState?.post_rc_openai_only_stable === true
    && finalClaimState?.local_model_verified === true
    && falseFlags(finalClaimState, [
      "provider_diverse_allowed",
      "provider_verified_allowed",
      "adapter_checked_allowed",
      "production_ready_allowed",
      "stable_allowed",
      "release_gated_allowed",
      "bare_release_gated_allowed"
    ]),
  finalClaimState || {});

const indexedGroups = Array.isArray(pointerIndex?.entries)
  ? pointerIndex.entries.map((entry) => entry.group_id)
  : [];
addCheck(checks, "combined evidence pointer index includes required groups",
  pointerIndex?.status === "recorded"
    && includesAll(indexedGroups, REQUIRED_EVIDENCE_GROUPS)
    && pointerIndex.entries.every((entry) => entry.status === "pass"),
  { indexedGroups, required: REQUIRED_EVIDENCE_GROUPS });

addCheck(checks, "combined archive manifest records no new execution",
  archiveManifest?.status === "recorded"
    && archiveManifest?.stage === STAGE
    && archiveManifest?.archive_label === ARCHIVE_LABEL
    && archiveManifest?.scope === SCOPE
    && includesAll(archiveManifest?.included_evidence_groups || [], REQUIRED_EVIDENCE_GROUPS)
    && falseFlags(archiveManifest, [
      "new_local_model_execution",
      "openai_model_api_call",
      "telemetry_sink_write",
      "local_endpoint_probe",
      "reference_baseline_source_modified",
      "dist_modified",
      "additional_reference_baseline_refresh"
    ]),
  archiveManifest || {});

addCheck(checks, "combined archive checksums recorded without missing targets",
  archiveChecksums?.status === "recorded"
    && Array.isArray(archiveChecksums?.missing_targets)
    && archiveChecksums.missing_targets.length === 0,
  archiveChecksums || {});

addCheck(checks, "combined strict paths remain blocked",
  strictPaths?.status === "recorded"
    && strictPaths?.provider_diverse?.status === "blocked"
    && strictPaths?.provider_verified?.status === "blocked"
    && strictPaths?.adapter_checked?.status === "blocked"
    && strictPaths?.general_stable_and_production_ready?.status === "blocked",
  strictPaths || {});

addCheck(checks, "combined reference baseline status records pass without refresh",
  referenceBaselineStatus?.status === "recorded"
    && referenceBaselineStatus?.check_reference_baseline_integrity_status === "pass"
    && referenceBaselineStatus?.ds_store_exclusion_policy_enforced === true
    && referenceBaselineStatus?.reference_baseline_source_modified === false
    && referenceBaselineStatus?.dist_modified === false
    && referenceBaselineStatus?.additional_refresh_in_this_stage === false
    && referenceBaselineStatus?.evidence_reference_baseline_refreshed_in_this_stage === false,
  referenceBaselineStatus || {});

addCheck(checks, "combined next options recorded",
  nextOptions?.status === "recorded"
    && Array.isArray(nextOptions.options)
    && nextOptions.options.length === 4,
  nextOptions || {});

addCheck(checks, "no unresolved combined export items remain",
  unresolvedItems?.status === "pass"
    && unresolvedItems?.unresolved_items_count === 0,
  unresolvedItems || {});

addCheck(checks, "protected referenceBaseline and dist paths clean",
  protectedStatus.exit_code === 0 && protectedStatus.stdout === "",
  protectedStatus);
addCheck(checks, "baseline state is prior owner-approved refresh only",
  baselineStatus.exit_code === 0 && baselineOnlyPriorRefresh,
  baselineStatus);

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  can_claim_post_rc_openai_only_stable: failures.length === 0,
  can_claim_local_model_verified: failures.length === 0,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_general_stable: false,
  can_claim_general_production_ready: false,
  can_claim_bare_release_gated: false,
  post_rc_openai_only_stable: archiveExport?.post_rc_openai_only_stable === true,
  local_model_verified: archiveExport?.local_model_verified === true,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  reason: failures.length === 0
    ? "Combined OpenAI-only scoped stable and Ollama qwen3 local-model-verified archive is recorded. Strict/provider/general claims remain blocked."
    : "Combined archive export checks failed.",
  checks,
  failures
};

writeGate(gate);
console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
