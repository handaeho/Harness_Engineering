#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verified-final-handoff-and-archive";
const EVIDENCE_DIR = "evidence/post-stable-local-model-verified-final-handoff";
const SCOPE = "ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-post-stable+local-model-verified-ollama-qwen3-lane";
const BLOCKED_CLAIMS = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const REQUIRED_FILES = [
  "release/scopes/post-stable/post_stable_local_model_verified_final_handoff_scope.yaml",
  "release/claims/post-stable/post_stable_local_model_verified_final_claim_state.yaml",
  "release/manifests/post-stable/post_stable_local_model_verified_archive_manifest.yaml",
  "release/decisions/post-stable/post_stable_local_model_verified_next_options.yaml",
  "release/paths/post-stable/post_stable_local_provider_strict_paths.yaml",
  "tools/builders/local/build_local_model_verified_final_handoff.mjs",
  "tools/generators/local/generate_local_model_verified_archive_manifest.mjs",
  "tools/checks/local/check_local_model_verified_final_handoff.mjs",
  "evals/suites/post_stable_local_model_verified_final_handoff.yaml",
  "evals/reports/local_model_verified_final_handoff_report.json",
  "evals/reports/local_model_verified_final_handoff_report.md",
  "evals/reports/local_model_verified_archive_report.json",
  "evals/reports/local_model_verified_archive_report.md",
  "evals/reports/local_model_verified_final_handoff_gate_report.json",
  "evals/reports/local_model_verified_final_handoff_gate_report.md",
  `${EVIDENCE_DIR}/local_model_verified_final_handoff_report.json`,
  `${EVIDENCE_DIR}/local_model_verified_final_claim_state.json`,
  `${EVIDENCE_DIR}/local_model_verified_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/local_model_verified_archive_manifest.json`,
  `${EVIDENCE_DIR}/local_model_verified_archive_checksums.json`,
  `${EVIDENCE_DIR}/local_model_verified_strict_paths.json`,
  `${EVIDENCE_DIR}/local_model_verified_reference_baseline_status.json`,
  `${EVIDENCE_DIR}/local_model_verified_next_options.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/handoffs/local_model_verified_final_handoff.ko.md",
  "docs/claims/local_model_verified_final_claim_state.ko.md",
  "docs/local/local_model_verified_archive_manifest.ko.md",
  "docs/local/local_model_verified_strict_paths.ko.md",
  "docs/plans/next_provider_diverse_path_plan.ko.md",
  "docs/plans/next_provider_verified_path_plan.ko.md",
  "docs/plans/next_adapter_checked_path_plan.ko.md"
];
const REQUIRED_EVIDENCE_GROUPS = [
  "post-stable-local-no-tool-canary-qwen3-14b-result-review",
  "post-stable-local-no-tool-canary-qwen3-6-27b-result-review",
  "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
  "post-stable-local-redteam-bounded-smoke",
  "post-stable-adapter-conformance-dependency-install",
  "post-stable-local-ollama-adapter-conformance",
  "post-stable-local-model-verification-owner-decision-packet-refresh",
  "post-stable-reference-baseline-refresh-for-local-model-verification",
  "post-stable-local-model-verification-final-gate"
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
}

function falseFlags(record, flags) {
  return flags.every((flag) => record?.[flag] === false);
}

function writePreliminaryGate() {
  const preliminary = {
    status: "pending_check",
    stage: STAGE,
    scope: SCOPE,
    archive_label: ARCHIVE_LABEL,
    can_claim_local_model_verified: false,
    can_claim_provider_diverse: false,
    can_claim_provider_verified: false,
    can_claim_adapter_checked: false,
    can_enter_stable_release: false,
    reason: "Preliminary local-model-verified final handoff gate report. Final verdict is written after checks complete."
  };
  writeJson(p(...EVIDENCE_DIR.split("/"), "local_model_verified_final_handoff_gate_report.json"), preliminary);
  writeJson(p("evals", "reports", "local_model_verified_final_handoff_gate_report.json"), preliminary);
  writeText(p("evals", "reports", "local_model_verified_final_handoff_gate_report.md"), `# Local Model Verified Final Handoff Gate

Status: ${preliminary.status}

- Stage: ${STAGE}
- Scope: ${SCOPE}
- Archive label: ${ARCHIVE_LABEL}
- Can claim local-model-verified: false
- Can claim provider-diverse: false
- Can claim provider-verified: false
- Can claim adapter-checked: false
- Can enter stable release: false
`);
}

const build = runNode("build_local_model_verified_final_handoff.mjs");
const archive = runNode("generate_local_model_verified_archive_manifest.mjs");
writePreliminaryGate();
const compare = runNode("check_reference_baseline_integrity.mjs");
const scanCli = runNode("scan_prohibited_claims.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verified_final_handoff_gate_report.json",
    "evals/reports/local_model_verified_final_handoff_gate_report.md"
  ]
});

const handoff = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_final_handoff_report.json`);
const claimState = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_final_claim_state.json`);
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_evidence_pointer_index.json`);
const archiveManifest = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_archive_manifest.json`);
const archiveChecksums = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_archive_checksums.json`);
const strictPaths = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_strict_paths.json`);
const reference_baselineStatus = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_reference_baseline_status.json`);
const nextOptions = readJsonIfExists(`${EVIDENCE_DIR}/local_model_verified_next_options.json`);
const unresolvedItems = readJsonIfExists(`${EVIDENCE_DIR}/unresolved_items.json`);
const protectedStatus = gitStatus(["legacy-reference-source", "dist"]);
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const blockedPositiveMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));

const checks = [];
addCheck(checks, "build_local_model_verified_final_handoff.mjs pass",
  build.exit_code === 0 && build.status === "pass",
  { exit_code: build.exit_code, status: build.status, stderr_excerpt: build.stderr_excerpt });
addCheck(checks, "generate_local_model_verified_archive_manifest.mjs recorded",
  archive.exit_code === 0 && archive.status === "recorded",
  { exit_code: archive.exit_code, status: archive.status, stderr_excerpt: archive.stderr_excerpt });
addCheck(checks, "check_reference_baseline_integrity.mjs pass",
  compare.exit_code === 0 && compare.status === "pass",
  { exit_code: compare.exit_code, status: compare.status, stderr_excerpt: compare.stderr_excerpt });
addCheck(checks, "scan_prohibited_claims.mjs pass",
  scanCli.exit_code === 0 && scan.status === "pass",
  { exit_code: scanCli.exit_code, status: scanCli.status, direct_status: scan.status, matches: scan.matches.length });

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "handoff report records local model verified only", handoff?.status === "pass"
  && handoff?.stage === STAGE
  && handoff?.scope === SCOPE
  && handoff?.archive_label === ARCHIVE_LABEL
  && handoff?.local_model_verified === true
  && handoff?.provider_diverse_allowed === false
  && handoff?.provider_verified_allowed === false
  && handoff?.adapter_checked_allowed === false
  && handoff?.production_ready_allowed === false
  && handoff?.stable_allowed === false
  && handoff?.can_enter_stable_release === false
  && falseFlags(handoff, [
    "new_local_model_execution",
    "new_local_model_generation",
    "openai_model_api_call",
    "openai_provider_call",
    "telemetry_sink_write",
    "local_endpoint_probe",
    "reference_baseline_source_modified",
    "dist_modified",
    "additional_reference_baseline_refresh",
    "evidence_reference_baseline_refreshed_in_this_stage",
    "ds_store_deletion_from_reference_baseline"
  ]), handoff || {});

addCheck(checks, "final claim state preserves allowed and blocked claims", claimState?.status === "recorded"
  && claimState?.scope === SCOPE
  && claimState?.local_model_verified === true
  && includesAll(claimState?.allowed_claims || [], ["local-model-verified"])
  && includesAll(claimState?.blocked_claims || [], BLOCKED_CLAIMS)
  && claimState?.provider_diverse_allowed === false
  && claimState?.provider_verified_allowed === false
  && claimState?.adapter_checked_allowed === false
  && claimState?.production_ready_allowed === false
  && claimState?.stable_allowed === false, claimState || {});

addCheck(checks, "evidence pointer index includes required groups", pointerIndex?.status === "recorded"
  && Array.isArray(pointerIndex?.entries)
  && includesAll(pointerIndex.entries.map((entry) => entry.group_id), REQUIRED_EVIDENCE_GROUPS)
  && pointerIndex.entries.every((entry) => entry.status === "pass"), pointerIndex || {});

addCheck(checks, "archive manifest and checksums recorded", archiveManifest?.status === "recorded"
  && archiveManifest?.stage === STAGE
  && archiveManifest?.scope === SCOPE
  && archiveManifest?.archive_label === ARCHIVE_LABEL
  && archiveManifest?.new_local_model_execution === false
  && archiveManifest?.openai_model_api_call === false
  && archiveManifest?.telemetry_sink_write === false
  && archiveManifest?.reference_baseline_source_modified === false
  && archiveManifest?.dist_modified === false
  && archiveManifest?.additional_reference_baseline_refresh === false
  && archiveChecksums?.status === "recorded"
  && Array.isArray(archiveChecksums?.missing_targets)
  && archiveChecksums.missing_targets.length === 0, {
  archive_manifest: archiveManifest,
  archive_checksums: archiveChecksums
});

addCheck(checks, "strict paths keep provider and adapter lanes blocked", strictPaths?.status === "recorded"
  && strictPaths?.provider_diversity?.status === "blocked"
  && strictPaths?.provider_verification?.status === "blocked"
  && strictPaths?.adapter_checked?.status === "blocked"
  && strictPaths?.general_production_ready_and_stable?.status === "blocked", strictPaths || {});

addCheck(checks, "reference baseline status records pass without refresh", reference_baselineStatus?.status === "recorded"
  && reference_baselineStatus?.check_reference_baseline_integrity_status === "pass"
  && reference_baselineStatus?.ds_store_exclusion_policy_enforced === true
  && reference_baselineStatus?.reference_baseline_source_modified === false
  && reference_baselineStatus?.dist_modified === false
  && reference_baselineStatus?.additional_refresh_in_this_stage === false
  && reference_baselineStatus?.evidence_reference_baseline_refreshed_in_this_stage === false, reference_baselineStatus || {});

addCheck(checks, "next options registry recorded", nextOptions?.status === "recorded"
  && Array.isArray(nextOptions?.options)
  && nextOptions.options.length === 4
  && nextOptions.options.some((option) => option.name === "provider_diverse_path_design")
  && nextOptions.options.some((option) => option.name === "provider_verified_gate_design")
  && nextOptions.options.some((option) => option.name === "adapter_checked_gate_design")
  && nextOptions.options.some((option) => option.name === "combined_archive_export"), nextOptions || {});

addCheck(checks, "no unresolved handoff items remain", Array.isArray(unresolvedItems)
  && unresolvedItems.length === 0, { unresolved_items_count: Array.isArray(unresolvedItems) ? unresolvedItems.length : null });

addCheck(checks, "provider-diverse/provider-verified/adapter-checked/production-ready/stable/release-gated positive claims absent",
  blockedPositiveMatches.length === 0, { matches: blockedPositiveMatches });

addCheck(checks, "protected referenceBaseline and dist paths clean", protectedStatus.exit_code === 0
  && protectedStatus.stdout === "", protectedStatus);
addCheck(checks, "baseline state is prior owner-approved refresh only", baselineStatus.exit_code === 0
  && (
    baselineStatus.stdout === ""
    || baselineStatus.stdout.split(/\r?\n/).every((line) => line.includes("harness-core/evidence/reference-baseline/checksums.json")
      || line.includes("harness-core/evidence/reference-baseline/file_inventory.json"))
  ), baselineStatus);

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  can_claim_local_model_verified: failures.length === 0,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_enter_stable_release: false,
  local_model_verified: failures.length === 0,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  reason: "Local-model-verified state is archived for Ollama qwen3 local lane. Provider-diverse, provider-verified, adapter-checked, production-ready, and stable remain blocked.",
  checks,
  failures
};

writeJson(p(...EVIDENCE_DIR.split("/"), "local_model_verified_final_handoff_gate_report.json"), gate);
writeJson(p("evals", "reports", "local_model_verified_final_handoff_gate_report.json"), gate);
writeText(p("evals", "reports", "local_model_verified_final_handoff_gate_report.md"), `# Local Model Verified Final Handoff Gate

Status: ${gate.status}

- Stage: ${STAGE}
- Scope: ${SCOPE}
- Archive label: ${ARCHIVE_LABEL}
- Can claim local-model-verified: ${gate.can_claim_local_model_verified}
- Can claim provider-diverse: false
- Can claim provider-verified: false
- Can claim adapter-checked: false
- Can enter stable release: false

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
