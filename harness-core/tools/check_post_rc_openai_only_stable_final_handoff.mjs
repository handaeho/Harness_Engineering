#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-final-handoff-and-archive";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-stable-final-handoff";
const SCOPE = "openai_only_post_rc";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable";
const ALLOWED_CLAIMS = [
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
const BLOCKED_CLAIMS = [
  "stable",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
];
const FINAL_STAGE_CLAIMS = [
  "post-rc-openai-only-stable-final-handoff-recorded",
  "post-rc-openai-only-stable-archive-manifest-recorded",
  "post-rc-openai-only-stable-final-claim-state-recorded",
  "post-rc-openai-only-stable-deferred-paths-recorded"
];
const REQUIRED_EVIDENCE_GROUPS = [
  "rc1-agents-md-system-of-record-alignment",
  "rc1-openai-scope-bundle",
  "rc1-release-gate-dry-run-openai-scope",
  "rc1-release-gate-actual-openai-scope",
  "rc1-post-release-gate-review",
  "rc1-final-handoff",
  "post-rc-operator-sequence-record",
  "post-rc-local-endpoint-future-integration",
  "post-rc-telemetry-connection-preflight-refresh",
  "post-rc-telemetry-connection",
  "post-rc-telemetry-connection-result-review",
  "post-rc-production-monitoring-controls",
  "post-rc-production-monitoring-operator-values-completion",
  "post-rc-production-monitoring-window",
  "post-rc-production-monitoring-window-result-review",
  "post-rc-production-monitoring-final-gate",
  "post-rc-openai-only-production-ready-scope-decision",
  "post-rc-stable-scope-preflight",
  "post-rc-openai-only-stable-scope-decision",
  "reference-baseline-owner-approved-refresh"
];
const REQUIRED_FILES = [
  "release/post_rc_openai_only_stable_final_handoff_scope.yaml",
  "release/post_rc_openai_only_stable_final_claim_state.yaml",
  "release/post_rc_openai_only_stable_archive_manifest.yaml",
  "release/post_rc_openai_only_stable_deferred_paths.yaml",
  "release/post_rc_openai_only_stable_next_options.yaml",
  "tools/build_post_rc_openai_only_stable_final_handoff.mjs",
  "tools/generate_post_rc_openai_only_stable_archive_manifest.mjs",
  "tools/check_post_rc_openai_only_stable_final_handoff.mjs",
  "evals/suites/post_rc_openai_only_stable_final_handoff.yaml",
  "evals/reports/post_rc_openai_only_stable_final_handoff_report.json",
  "evals/reports/post_rc_openai_only_stable_final_handoff_report.md",
  "evals/reports/post_rc_openai_only_stable_archive_report.json",
  "evals/reports/post_rc_openai_only_stable_archive_report.md",
  `${EVIDENCE_DIR}/final_handoff_report.json`,
  `${EVIDENCE_DIR}/final_claim_state.json`,
  `${EVIDENCE_DIR}/final_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/final_archive_manifest.json`,
  `${EVIDENCE_DIR}/final_archive_checksums.json`,
  `${EVIDENCE_DIR}/final_deferred_paths.json`,
  `${EVIDENCE_DIR}/final_reference_baseline_refresh_status.json`,
  `${EVIDENCE_DIR}/final_next_options_registry.json`,
  `${EVIDENCE_DIR}/unresolved_items.json`,
  "docs/openai_only_stable_final_handoff.md",
  "docs/openai_only_stable_final_claim_state.md",
  "docs/openai_only_stable_archive_manifest.md",
  "docs/openai_only_stable_deferred_paths.md",
  "docs/next_options_after_openai_only_stable.md",
  "docs/next_local_canary_after_endpoint_ready.md"
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

function writeJsonSafe(file, value) {
  writeJson(file, value);
}

function writeTextSafe(file, value) {
  writeText(file, value);
}

function runNode(script) {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync("node", [path.join("tools", script)], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024
    });
    let parsed = null;
    try {
      parsed = JSON.parse((result.stdout || "").trim());
    } catch {
      parsed = null;
    }
    last = {
      script,
      exit_code: result.status,
      status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
      parsed,
      attempts: attempt,
      stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
      stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
    };
    if (result.status === 0) return last;
    sleep(500);
  }
  return last;
}

function sleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
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
    .map((line) => line.replace(/^..?\s+/, ""));
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

function writePreliminaryGate() {
  const preliminary = {
    status: "pending_check",
    stage: STAGE,
    scope: SCOPE,
    archive_label: ARCHIVE_LABEL,
    can_claim_post_rc_openai_only_stable: false,
    can_claim_general_stable: false,
    can_claim_general_production_ready: false,
    can_claim_bare_release_gated: false,
    can_claim_provider_diverse: false,
    local_endpoint_deferred: true,
    reason: "Preliminary final handoff gate report. The final gate must preserve only the scoped claim post-rc-openai-only-stable."
  };
  writeJsonSafe(p(...EVIDENCE_DIR.split("/"), "final_handoff_gate_report.json"), preliminary);
  writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_gate_report.json"), preliminary);
  writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_gate_report.md"), markdown(preliminary));
}

function markdown(gate) {
  return `# OpenAI-Only Stable Final Handoff Gate

Status: ${gate.status}

- Stage: ${gate.stage}
- Scope: ${gate.scope}
- Archive label: ${gate.archive_label}
- Can claim post-rc-openai-only-stable: ${gate.can_claim_post_rc_openai_only_stable}
- Can claim general stable: ${gate.can_claim_general_stable}
- Can claim general production-ready: ${gate.can_claim_general_production_ready}
- Can claim bare release-gated: ${gate.can_claim_bare_release_gated}
- Can claim provider-diverse: ${gate.can_claim_provider_diverse}
- Local endpoint deferred: ${gate.local_endpoint_deferred}
- Reason: ${gate.reason}
`;
}

const validate = runNode("validate_alpha.mjs");
const compare = runNode("check_reference_baseline_integrity.mjs");
const stableScopeGate = runNode("check_post_rc_openai_only_stable_scope_decision.mjs");
const build = runNode("build_post_rc_openai_only_stable_final_handoff.mjs");
const archive = runNode("generate_post_rc_openai_only_stable_archive_manifest.mjs");
writePreliminaryGate();
const scan = runNode("scan_prohibited_claims.mjs");

const finalHandoff = readJsonIfExists(`${EVIDENCE_DIR}/final_handoff_report.json`);
const finalClaimState = readJsonIfExists(`${EVIDENCE_DIR}/final_claim_state.json`);
const finalEvidencePointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/final_evidence_pointer_index.json`);
const finalArchiveManifest = readJsonIfExists(`${EVIDENCE_DIR}/final_archive_manifest.json`);
const finalArchiveChecksums = readJsonIfExists(`${EVIDENCE_DIR}/final_archive_checksums.json`);
const finalDeferredPaths = readJsonIfExists(`${EVIDENCE_DIR}/final_deferred_paths.json`);
const finalReference BaselineBaselineRefreshStatus = readJsonIfExists(`${EVIDENCE_DIR}/final_reference_baseline_refresh_status.json`);
const finalNextOptionsRegistry = readJsonIfExists(`${EVIDENCE_DIR}/final_next_options_registry.json`);
const stableBoundary = readJsonIfExists("evidence/post-rc-openai-only-stable-scope-decision/openai_only_stable_claim_boundary.json");
const checks = [];

addCheck(checks, "build_post_rc_openai_only_stable_final_handoff.mjs pass",
  build.exit_code === 0 && build.status === "pass",
  { exit_code: build.exit_code, status: build.status, stderr_excerpt: build.stderr_excerpt });
addCheck(checks, "generate_post_rc_openai_only_stable_archive_manifest.mjs recorded",
  archive.exit_code === 0 && archive.status === "recorded",
  { exit_code: archive.exit_code, status: archive.status, stderr_excerpt: archive.stderr_excerpt });
addCheck(checks, "validate_alpha.mjs pass",
  validate.exit_code === 0 && validate.status === "pass",
  { exit_code: validate.exit_code, status: validate.status, stderr_excerpt: validate.stderr_excerpt });
addCheck(checks, "check_reference_baseline_integrity.mjs pass",
  compare.exit_code === 0 && compare.status === "pass",
  { exit_code: compare.exit_code, status: compare.status, stderr_excerpt: compare.stderr_excerpt });
addCheck(checks, "check_post_rc_openai_only_stable_scope_decision.mjs pass",
  stableScopeGate.exit_code === 0 && stableScopeGate.status === "pass",
  {
    exit_code: stableScopeGate.exit_code,
    status: stableScopeGate.status,
    stderr_excerpt: stableScopeGate.stderr_excerpt,
    failure_names: Array.isArray(stableScopeGate.parsed?.failures)
      ? stableScopeGate.parsed.failures.map((failure) => failure.name)
      : []
  });
addCheck(checks, "scan_prohibited_claims.mjs pass",
  scan.exit_code === 0 && scan.status === "pass",
  { exit_code: scan.exit_code, status: scan.status, stderr_excerpt: scan.stderr_excerpt });

for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, exists(file), {});
}

addCheck(checks, "final handoff report preserves scoped archive boundary",
  finalHandoff?.status === "pass"
    && finalHandoff?.stage === STAGE
    && finalHandoff?.scope === SCOPE
    && finalHandoff?.archive_label === ARCHIVE_LABEL
    && finalHandoff?.post_rc_openai_only_stable === true
    && finalHandoff?.post_rc_openai_only_stable_allowed === true
    && finalHandoff?.general_stable_allowed === false
    && finalHandoff?.general_production_ready_allowed === false
    && finalHandoff?.provider_diverse_allowed === false
    && finalHandoff?.provider_verified_allowed === false
    && finalHandoff?.adapter_checked_allowed === false
    && finalHandoff?.local_model_verified_allowed === false
    && finalHandoff?.bare_release_gated_allowed === false
    && includesAll(finalHandoff?.allowed_claims || [], ALLOWED_CLAIMS)
    && includesAll(finalHandoff?.blocked_claims || [], BLOCKED_CLAIMS)
    && includesAll(finalHandoff?.claims_allowed_by_this_stage || [], FINAL_STAGE_CLAIMS),
  finalHandoff || {});

addCheck(checks, "final claim state records allowed scoped and blocked bare/general claims",
  finalClaimState?.status === "recorded"
    && finalClaimState?.scope === SCOPE
    && includesAll(finalClaimState?.allowed_claims || [], ALLOWED_CLAIMS)
    && includesAll(finalClaimState?.blocked_claims || [], BLOCKED_CLAIMS)
    && finalClaimState?.post_rc_openai_only_stable_allowed === true
    && finalClaimState?.stable_allowed === false
    && finalClaimState?.production_ready_allowed === false
    && finalClaimState?.release_gated_allowed === false
    && finalClaimState?.provider_diverse_allowed === false
    && finalClaimState?.provider_verified_allowed === false
    && finalClaimState?.adapter_checked_allowed === false
    && finalClaimState?.local_model_verified_allowed === false,
  finalClaimState || {});

const indexedGroups = Array.isArray(finalEvidencePointerIndex?.entries)
  ? finalEvidencePointerIndex.entries.map((entry) => entry.group_id)
  : [];
addCheck(checks, "final evidence pointer index includes required groups",
  finalEvidencePointerIndex?.status === "recorded"
    && includesAll(indexedGroups, REQUIRED_EVIDENCE_GROUPS),
  { indexedGroups, required: REQUIRED_EVIDENCE_GROUPS });

addCheck(checks, "archive manifest records no new execution",
  finalArchiveManifest?.status === "recorded"
    && finalArchiveManifest?.stage === STAGE
    && finalArchiveManifest?.scope === SCOPE
    && finalArchiveManifest?.archive_label === ARCHIVE_LABEL
    && finalArchiveManifest?.new_execution === false
    && falseFlags(finalArchiveManifest, [
      "openai_model_api_call",
      "telemetry_sink_write",
      "local_endpoint_probe",
      "local_model_execution",
      "reference_baseline_source_modified",
      "dist_modified",
      "additional_reference_baseline_refresh"
    ])
    && includesAll(finalArchiveManifest?.included_evidence_groups || [], REQUIRED_EVIDENCE_GROUPS),
  finalArchiveManifest || {});

addCheck(checks, "archive checksums have no missing targets",
  finalArchiveChecksums?.status === "recorded"
    && Array.isArray(finalArchiveChecksums?.entries)
    && finalArchiveChecksums.entries.length > 0
    && Array.isArray(finalArchiveChecksums?.missing_targets)
    && finalArchiveChecksums.missing_targets.length === 0,
  finalArchiveChecksums || {});

addCheck(checks, "deferred paths keep local and provider lanes deferred",
  finalDeferredPaths?.status === "recorded"
    && finalDeferredPaths?.local_endpoint?.status === "deferred_until_operator_provides_endpoint"
    && finalDeferredPaths?.local_endpoint?.local_endpoint_probe === false
    && finalDeferredPaths?.local_endpoint?.local_model_execution === false
    && finalDeferredPaths?.provider_diversity?.status === "deferred_not_established"
    && finalDeferredPaths?.bare_claims?.stable === "blocked"
    && finalDeferredPaths?.bare_claims?.["production-ready"] === "blocked"
    && finalDeferredPaths?.bare_claims?.["release-gated"] === "blocked",
  finalDeferredPaths || {});

const baselineRefreshFiles = finalReference BaselineBaselineRefreshStatus?.owner_approved_refresh_files_still_modified_in_worktree || [];
addCheck(checks, "reference baseline refresh status records prior owner-approved files only",
  finalReference BaselineBaselineRefreshStatus?.status === "recorded"
    && finalReference BaselineBaselineRefreshStatus?.check_reference_baseline_integrity_status === "pass"
    && finalReference BaselineBaselineRefreshStatus?.reference_baseline_source_modified === false
    && finalReference BaselineBaselineRefreshStatus?.dist_modified === false
    && finalReference BaselineBaselineRefreshStatus?.additional_refresh_in_this_stage === false
    && includesAll(baselineRefreshFiles, PRIOR_BASELINE_REFRESH_FILES),
  finalReference BaselineBaselineRefreshStatus || {});

const nextOptionIds = Array.isArray(finalNextOptionsRegistry?.options)
  ? finalNextOptionsRegistry.options.map((option) => option.id)
  : [];
addCheck(checks, "next options registry records local/provider/archive lanes",
  finalNextOptionsRegistry?.status === "recorded"
    && includesAll(nextOptionIds, ["NEXT-001", "NEXT-002", "NEXT-003"]),
  finalNextOptionsRegistry || {});

addCheck(checks, "stable scope decision boundary remains scoped",
  stableBoundary?.status === "pass"
    && stableBoundary?.post_rc_openai_only_stable_allowed === true
    && stableBoundary?.stable_allowed === false
    && stableBoundary?.production_ready_allowed === false
    && stableBoundary?.provider_diverse_allowed === false
    && stableBoundary?.local_model_verified_allowed === false
    && stableBoundary?.bare_release_gated_allowed === false,
  stableBoundary || {});

addCheck(checks, "forbidden execution flags remain false",
  falseFlags(finalHandoff, [
    "openai_model_api_call",
    "openai_provider_call",
    "telemetry_sink_write",
    "production_deployment",
    "release_gate_rerun",
    "redteam_rerun",
    "containment_rerun",
    "local_endpoint_probe",
    "local_model_execution",
    "reference_baseline_source_modified",
    "dist_modified",
    "additional_reference_baseline_refresh",
    "evidence_reference_baseline_modified_in_this_stage"
  ]),
  finalHandoff || {});

const scanMatches = Array.isArray(scan.parsed?.matches) ? scan.parsed.matches : [];
const forbiddenPositiveMatches = scanMatches.filter((match) => [
  "stable",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
].includes(match.claim));
const conditionalStableMentions = (scan.parsed?.allowed_mentions || []).filter((mention) => mention.claim === "stable"
  && mention.reason === "conditionally_allowed_after_post_rc_openai_only_stable_scope_decision");
const unscopedConditionalStableMentions = conditionalStableMentions.filter((mention) => !(
  mention.context.includes("post-rc-openai-only-stable")
  || mention.context.includes("openai_only_stable")
  || mention.context.includes("OpenAI-Only Stable")
));
addCheck(checks, "forbidden positive claims absent and stable positives remain scoped",
  forbiddenPositiveMatches.length === 0 && unscopedConditionalStableMentions.length === 0,
  {
    forbidden_positive_match_count: forbiddenPositiveMatches.length,
    conditional_stable_mention_count: conditionalStableMentions.length,
    unscoped_conditional_stable_mention_count: unscopedConditionalStableMentions.length
  });

const forbiddenGitStatus = gitStatus(["legacy-reference-source", "dist"]);
addCheck(checks, "legacy-reference-source and dist remain unmodified",
  forbiddenGitStatus.exit_code === 0 && forbiddenGitStatus.stdout === "",
  forbiddenGitStatus);

const baselineGitStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const baselineStatusPaths = statusPaths(baselineGitStatus);
addCheck(checks, "no additional evidence/reference-baseline refresh occurred",
  baselineGitStatus.exit_code === 0
    && baselineStatusPaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file)),
  {
    ...baselineGitStatus,
    status_paths: baselineStatusPaths,
    allowed_prior_owner_approved_files: PRIOR_BASELINE_REFRESH_FILES
  });

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  can_claim_post_rc_openai_only_stable: failures.length === 0,
  can_claim_general_stable: false,
  can_claim_general_production_ready: false,
  can_claim_bare_release_gated: false,
  can_claim_provider_diverse: false,
  can_claim_local_model_verified: false,
  local_endpoint_deferred: true,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  claims_maintained: ALLOWED_CLAIMS,
  claims_allowed_by_this_stage: failures.length === 0 ? FINAL_STAGE_CLAIMS : [],
  claims_still_blocked: BLOCKED_CLAIMS,
  reason: failures.length === 0
    ? "OpenAI-only post-RC stable scope is archived. General stable, general production-ready, bare release-gated, provider-diverse, and local-model claims remain blocked."
    : "OpenAI-only post-RC final handoff/archive gate failed.",
  checks,
  failures
};

writeJsonSafe(p(...EVIDENCE_DIR.split("/"), "final_handoff_gate_report.json"), gate);
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_gate_report.json"), gate);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_gate_report.md"), markdown(gate));

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
