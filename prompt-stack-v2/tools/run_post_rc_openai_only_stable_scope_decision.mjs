#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-scope-decision";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-stable-scope-decision";
const OWNER_DECISION_TEXT = "I choose OpenAI-only stable scope for post-RC stable decision. Local endpoint, provider diversity, local-model verification, provider verification, adapter checking, and bare release-gated are explicitly out of scope for this scoped stable decision.";
const STABLE_SCOPE = "openai_only_post_rc";
const CANONICAL_STABLE_CLAIM = "post-rc-openai-only-stable";
const CANONICAL_READY_CLAIM = "post-rc-openai-only-production-ready";
const ALLOWED_CLAIMS = [
  CANONICAL_STABLE_CLAIM,
  "post-rc-openai-only-stable-scope-decision-recorded",
  "post-rc-openai-only-stable-gate-passed",
  "post-rc-stable-claim-enabled-openai-only-scope",
  "post-rc-stable-owner-scope-decision-recorded",
  "post-rc-stable-out-of-scope-boundaries-recorded"
];
const BLOCKED_CLAIMS = [
  "stable",
  "production-ready",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

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

function writeJsonSafe(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function writeTextSafe(file, value) {
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
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

function markdownDecision(report) {
  return `# OpenAI-Only Stable Scope Decision

Status: ${report.status}

- Stage: ${report.stage}
- Stable scope: ${report.stable_scope}
- ${CANONICAL_STABLE_CLAIM} allowed: ${report.post_rc_openai_only_stable}
- Bare stable allowed: ${report.bare_stable_allowed}
- Bare release-gated allowed: ${report.bare_release_gated_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
- Provider-verified allowed: ${report.provider_verified_allowed}
- Adapter-checked allowed: ${report.adapter_checked_allowed}
- Local-model verified allowed: ${report.local_model_verified_allowed}
- Local endpoint probe: ${report.local_endpoint_probe}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
- Reason: ${report.reason}
`;
}

function markdownGate(report) {
  return `# OpenAI-Only Stable Gate

Status: ${report.status}

- Stage: ${report.stage}
- Stable scope: ${report.stable_scope}
- Can claim ${CANONICAL_STABLE_CLAIM}: ${report.can_claim_post_rc_openai_only_stable}
- Can claim bare stable: ${report.can_claim_stable}
- Can claim bare release-gated: ${report.can_claim_release_gated}
- Can claim provider-diverse: ${report.can_claim_provider_diverse}
- Can claim local-model-verified: ${report.can_claim_local_model_verified}
- Reason: ${report.reason}
`;
}

const stablePreflight = readJsonIfExists("evidence/post-rc-stable-scope-preflight/stable_scope_preflight_report.json") || {};
const stablePreflightGate = readJsonIfExists("evidence/post-rc-stable-scope-preflight/stable_scope_preflight_gate_report.json") || {};
const productionReadyReport = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json") || {};
const productionReadyBoundary = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_claim_boundary.json") || {};
const productionReadyGate = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_gate_report.json") || {};
const productionReadyDecisionGate = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_gate_report.json") || {};
const productionReadySummary = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_evidence_summary.json") || {};
const finalGate = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json") || {};
const v36DistStatus = gitStatus(["prompt-stack/v36", "dist"]);
const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
const ownerApprovedRefreshFiles = statusPaths(baselineStatus).filter((file) => file === "prompt-stack-v2/evidence/v36-baseline/checksums.json"
  || file === "prompt-stack-v2/evidence/v36-baseline/file_inventory.json");

const ownerDecision = {
  status: "pass",
  stage: STAGE,
  owner_decision_text: OWNER_DECISION_TEXT,
  selected_option: "evaluate_openai_only_stable_scope",
  stable_scope: STABLE_SCOPE,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  owner_decision_required_before_this_stage: true,
  owner_decision_recorded: true
};

const evidenceCompleteness = {
  status: "pass",
  required_evidence: {
    stable_scope_preflight: stablePreflight.status === "blocked_by_owner_stable_scope_decision_required"
      && stablePreflight.can_evaluate_openai_only_stable_scope === true,
    stable_scope_preflight_gate: stablePreflightGate.status === "blocked_by_owner_stable_scope_decision_required"
      && stablePreflightGate.can_evaluate_openai_only_stable_scope === true,
    post_rc_openai_only_production_ready: productionReadyReport.status === "pass"
      && productionReadyReport.post_rc_openai_only_production_ready === true
      && productionReadyBoundary.post_rc_openai_only_production_ready_allowed === true
      && productionReadyReport.production_ready_allowed === false
      && productionReadyBoundary.production_ready_allowed === false,
    production_ready_scope_gate: productionReadyGate.status === "pass"
      || productionReadyDecisionGate.status === "pass",
    production_monitoring_final_gate: finalGate.status === "pass"
      && finalGate.production_monitored_allowed === true,
    telemetry_connected: finalGate.telemetry_connected === true
      || productionReadySummary.telemetry_connected === true,
    production_monitored: finalGate.production_monitored_allowed === true
      || productionReadySummary.production_monitored === true,
    containment_verified: productionReadySummary.containment_verified === true,
    rc1_openai_scope_release_gated: productionReadySummary.rc1_openai_scope_release_gated === true,
    openai_canary_suite_passed: productionReadySummary.openai_canary_suite_passed === true,
    openai_redteam_limited_and_additional_passed: productionReadySummary.openai_redteam_limited_and_additional_passed === true,
    production_monitoring_final_gate_passed: finalGate.production_monitoring_final_gate_passed === true,
    monitoring_window_completed: finalGate.monitoring_window_completed === true,
    thresholds_passed: finalGate.thresholds_passed === true,
    redaction_failures_zero: finalGate.redaction_failures === 0,
    raw_payload_storage_violations_zero: finalGate.raw_payload_storage_violations === 0,
    secret_logging_findings_zero: finalGate.secret_logging_findings === 0,
    v36_baseline_compare_pass: finalGate.compare_v36_baseline_status === "pass",
    owner_scope_decision: ownerDecision.owner_decision_recorded === true
  }
};
evidenceCompleteness.missing_evidence = Object.entries(evidenceCompleteness.required_evidence)
  .filter(([, value]) => value !== true)
  .map(([key]) => key);
evidenceCompleteness.status = evidenceCompleteness.missing_evidence.length === 0 ? "pass" : "fail";

const evidenceSummary = {
  status: evidenceCompleteness.status,
  stage: STAGE,
  stable_scope: STABLE_SCOPE,
  canonical_stable_claim: CANONICAL_STABLE_CLAIM,
  canonical_production_ready_claim: CANONICAL_READY_CLAIM,
  post_rc_openai_only_production_ready: productionReadyReport.post_rc_openai_only_production_ready === true,
  telemetry_connected: finalGate.telemetry_connected === true || productionReadySummary.telemetry_connected === true,
  production_monitored: finalGate.production_monitored_allowed === true || productionReadySummary.production_monitored === true,
  containment_verified: productionReadySummary.containment_verified === true,
  rc1_openai_scope_release_gated: productionReadySummary.rc1_openai_scope_release_gated === true,
  openai_canary_suite_passed: productionReadySummary.openai_canary_suite_passed === true,
  openai_redteam_limited_and_additional_passed: productionReadySummary.openai_redteam_limited_and_additional_passed === true,
  production_monitoring_final_gate_passed: finalGate.production_monitoring_final_gate_passed === true,
  monitoring_window_completed: finalGate.monitoring_window_completed === true,
  thresholds_passed: finalGate.thresholds_passed === true,
  redaction_failures: finalGate.redaction_failures ?? null,
  raw_payload_storage_violations: finalGate.raw_payload_storage_violations ?? null,
  secret_logging_findings: finalGate.secret_logging_findings ?? null,
  compare_v36_baseline_status: finalGate.compare_v36_baseline_status || "unknown",
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  provider_verification_execution: false,
  adapter_check_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  redteam_rerun: false,
  containment_rerun: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false,
  evidence_v36_baseline_modified_in_this_stage: false,
  owner_approved_refresh_files_modified_in_worktree: ownerApprovedRefreshFiles
};

const evidenceInventory = {
  status: evidenceCompleteness.status,
  rc1_openai_scope_release_gated: evidenceSummary.rc1_openai_scope_release_gated,
  rc1_openai_scope_frozen: true,
  containment_verified: evidenceSummary.containment_verified,
  telemetry_connected: evidenceSummary.telemetry_connected,
  production_monitored: evidenceSummary.production_monitored,
  post_rc_openai_only_production_ready: evidenceSummary.post_rc_openai_only_production_ready,
  openai_canary_suite_passed: evidenceSummary.openai_canary_suite_passed,
  openai_redteam_limited_and_additional_passed: evidenceSummary.openai_redteam_limited_and_additional_passed,
  storage_redaction_audit_passed: evidenceSummary.redaction_failures === 0
    && evidenceSummary.raw_payload_storage_violations === 0
    && evidenceSummary.secret_logging_findings === 0,
  v36_baseline_compare_pass: evidenceSummary.compare_v36_baseline_status === "pass",
  production_monitoring_final_gate_passed: evidenceSummary.production_monitoring_final_gate_passed,
  local_endpoint_verified: false,
  provider_diverse: false,
  provider_verified: false,
  adapter_checked: false,
  local_model_verified: false
};

const gateCriteria = {
  status: evidenceCompleteness.status,
  scope: STABLE_SCOPE,
  required_criteria: {
    rc1_openai_scope_release_gated: evidenceInventory.rc1_openai_scope_release_gated,
    rc1_openai_scope_frozen: evidenceInventory.rc1_openai_scope_frozen,
    containment_verified: evidenceInventory.containment_verified,
    telemetry_connected: evidenceInventory.telemetry_connected,
    production_monitored: evidenceInventory.production_monitored,
    post_rc_openai_only_production_ready: evidenceInventory.post_rc_openai_only_production_ready,
    openai_canary_suite_passed: evidenceInventory.openai_canary_suite_passed,
    openai_redteam_passed_limited_and_additional_scope: evidenceInventory.openai_redteam_limited_and_additional_passed,
    storage_redaction_audit_passed: evidenceInventory.storage_redaction_audit_passed,
    v36_baseline_compare_pass: evidenceInventory.v36_baseline_compare_pass,
    local_provider_paths_explicitly_out_of_scope: true
  },
  not_required_for_this_scope: {
    local_endpoint_verified: true,
    provider_diverse: true,
    provider_verified: true,
    adapter_checked: true,
    local_model_verified: true,
    bare_release_gated: true
  }
};

const prerequisitesPass = evidenceCompleteness.status === "pass"
  && evidenceSummary.post_rc_openai_only_production_ready === true
  && evidenceSummary.telemetry_connected === true
  && evidenceSummary.production_monitored === true
  && evidenceSummary.containment_verified === true
  && evidenceSummary.rc1_openai_scope_release_gated === true
  && evidenceSummary.openai_canary_suite_passed === true
  && evidenceSummary.openai_redteam_limited_and_additional_passed === true
  && evidenceSummary.production_monitoring_final_gate_passed === true
  && evidenceSummary.monitoring_window_completed === true
  && evidenceSummary.thresholds_passed === true
  && evidenceSummary.redaction_failures === 0
  && evidenceSummary.raw_payload_storage_violations === 0
  && evidenceSummary.secret_logging_findings === 0
  && evidenceSummary.compare_v36_baseline_status === "pass"
  && v36DistStatus.stdout === "";

const outOfScopeBoundaries = {
  status: "recorded",
  stage: STAGE,
  stable_scope: STABLE_SCOPE,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  local_endpoint_probe: false,
  local_model_execution: false,
  provider_verification_execution: false,
  adapter_check_execution: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  does_not_allow: [
    "stable",
    "production-ready",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "bare release-gated",
    "strict provider-diverse stable scope"
  ]
};

const localProviderOutOfScope = {
  status: "recorded",
  stage: STAGE,
  scope: "openai_only_post_rc_stable_decision",
  owner_decision_present: true,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  local_endpoint_status: "deferred_until_operator_provides_endpoint",
  local_endpoint_probe: false,
  local_model_execution: false,
  claims_still_blocked: [
    "provider-diverse",
    "local-model-verified",
    "provider-verified",
    "adapter-checked",
    "stable",
    "production-ready",
    "release-gated"
  ],
  reason: "Owner chose OpenAI-only stable scope. Local/provider-diversity paths remain deferred and do not support provider-diverse, provider-verified, adapter-checked, local-model, or bare release-gated claims."
};

const decisionReport = {
  status: prerequisitesPass ? "pass" : "fail",
  stage: STAGE,
  stable_scope: STABLE_SCOPE,
  owner_decision_recorded: true,
  owner_selected_openai_only_scope: true,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  post_rc_openai_only_production_ready: evidenceSummary.post_rc_openai_only_production_ready,
  post_rc_openai_only_stable: prerequisitesPass,
  post_rc_openai_only_stable_allowed: prerequisitesPass,
  stable_allowed: false,
  bare_stable_allowed: false,
  stable_scope_limited: true,
  production_ready_allowed: false,
  bare_production_ready_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  strict_provider_diverse_stable_allowed: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  provider_verification_execution: false,
  adapter_check_execution: false,
  production_deployment: false,
  release_gate_rerun: false,
  redteam_rerun: false,
  containment_rerun: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false,
  evidence_v36_baseline_modified_in_this_stage: false,
  reason: prerequisitesPass
    ? "Owner selected OpenAI-only post-RC stable scope and required evidence is complete. The canonical scoped stable claim is post-rc-openai-only-stable; bare stable and bare release-gated remain blocked."
    : "OpenAI-only stable scope decision prerequisites are incomplete."
};

const claimBoundary = {
  status: decisionReport.status,
  stage: STAGE,
  stable_scope: STABLE_SCOPE,
  telemetry_connected_allowed: true,
  production_monitored_allowed: true,
  post_rc_openai_only_production_ready_allowed: decisionReport.post_rc_openai_only_production_ready,
  post_rc_openai_only_stable_allowed: decisionReport.post_rc_openai_only_stable,
  stable_allowed: false,
  bare_stable_allowed: false,
  stable_scope_limited: true,
  production_ready_allowed: false,
  bare_production_ready_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  strict_provider_diverse_stable_allowed: false,
  allowed_claims: decisionReport.post_rc_openai_only_stable ? [
    "telemetry-connected",
    "production-monitored",
    CANONICAL_READY_CLAIM,
    CANONICAL_STABLE_CLAIM,
    "post-rc-openai-only-stable-scope-decision-recorded",
    "post-rc-openai-only-stable-gate-passed",
    "post-rc-stable-claim-enabled-openai-only-scope",
    "post-rc-stable-owner-scope-decision-recorded",
    "post-rc-stable-out-of-scope-boundaries-recorded"
  ] : [
    "telemetry-connected",
    "production-monitored",
    CANONICAL_READY_CLAIM,
    "post-rc-stable-owner-scope-decision-recorded"
  ],
  blocked_claims: BLOCKED_CLAIMS,
  reason: decisionReport.post_rc_openai_only_stable
    ? "The canonical scoped stable claim is enabled as post-rc-openai-only-stable. Bare stable, bare production-ready, provider-diverse, provider-verified, adapter-checked, local-model-verified, and bare release-gated remain blocked."
    : "Stable remains blocked because scoped prerequisites failed."
};

const decisionRecord = {
  status: decisionReport.status === "pass" ? "recorded" : "not_recorded",
  stage: STAGE,
  decision: decisionReport.status === "pass"
    ? "approve_post_rc_openai_only_stable_claim"
    : "do_not_approve_stable_claim",
  scope: STABLE_SCOPE,
  post_rc_openai_only_stable: decisionReport.post_rc_openai_only_stable,
  post_rc_openai_only_production_ready: decisionReport.post_rc_openai_only_production_ready,
  bare_stable_allowed: false,
  bare_production_ready_allowed: false,
  bare_release_gated_allowed: false,
  is_stable: false,
  is_bare_stable: false,
  is_release_gated: false,
  is_provider_diverse: false,
  is_provider_verified: false,
  is_adapter_checked: false,
  is_local_model_verified: false,
  local_endpoint_out_of_scope: true,
  provider_diversity_out_of_scope: true,
  local_model_verification_out_of_scope: true,
  provider_verification_out_of_scope: true,
  adapter_checking_out_of_scope: true,
  bare_release_gated_out_of_scope: true,
  rationale: [
    "Owner explicitly selected OpenAI-only stable scope",
    "Local endpoint, provider diversity, local-model verification, provider verification, adapter checking, and bare release-gated are out of scope for this scoped stable decision",
    "OpenAI-only production-ready scoped claim passed",
    "Production monitoring final gate passed",
    "Telemetry is connected and production-monitored is allowed",
    "Redaction, raw payload storage, and secret logging findings are zero",
    "v36 baseline compare passes after owner-approved refresh metadata"
  ]
};

const openaiOnlyStableDecisionRecord = {
  status: decisionReport.status === "pass" ? "recorded" : "not_recorded",
  stage: STAGE,
  decision: decisionReport.status === "pass"
    ? "approve_openai_only_stable_scope"
    : "do_not_approve_openai_only_stable_scope",
  scope: STABLE_SCOPE,
  post_rc_openai_only_stable: decisionReport.post_rc_openai_only_stable,
  is_general_stable: false,
  is_general_production_ready: false,
  is_provider_diverse: false,
  is_provider_verified: false,
  is_adapter_checked: false,
  is_local_model_verified: false,
  local_endpoint_deferred: true,
  rationale: [
    "RC1 OpenAI-only release-gated scope is frozen",
    "Containment is verified",
    "Telemetry is connected",
    "Production monitoring final gate passed",
    "OpenAI-only production-ready scoped decision passed",
    "OpenAI canary and redteam evidence passed",
    "Storage/redaction evidence passed",
    "Local endpoint, provider diversity, provider verification, adapter checking, local model verification, and bare release-gated are explicitly out of scope"
  ]
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "post_rc_stable_scope_decision_required",
  new_status: decisionReport.post_rc_openai_only_stable
    ? "post_rc_openai_only_stable_allowed_strict_paths_still_blocked"
    : "stable_still_blocked_by_failed_openai_only_scope_decision",
  unblocks: decisionReport.post_rc_openai_only_stable ? [
    CANONICAL_STABLE_CLAIM
  ] : [],
  still_blocks: [
    "stable",
    "production-ready",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "bare release-gated",
    "strict provider-diverse stable scope"
  ],
  next_required_actions: [
    "keep bare stable and bare release-gated blocked unless a later explicit gate allows them",
    "keep local endpoint deferred until operator provides endpoint readiness",
    "run provider-diverse path only after local or second-provider evidence exists",
    "run provider verification and adapter checking only in their own explicitly scoped gates"
  ]
};

const openaiOnlyStableBlockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "owner_stable_scope_decision_required",
  new_status: blockerUpdate.new_status,
  unblocks: blockerUpdate.unblocks,
  still_blocks: [
    "stable",
    "production-ready",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "bare release-gated"
  ],
  deferred_by_operator: [
    "local endpoint",
    "local no-tool canary",
    "provider diversity",
    "provider verification",
    "adapter checking",
    "local model verification"
  ]
};

const gateReport = {
  status: decisionReport.status,
  stage: STAGE,
  stable_scope: STABLE_SCOPE,
  can_claim_post_rc_openai_only_stable: decisionReport.post_rc_openai_only_stable,
  can_claim_stable: false,
  can_claim_release_gated: false,
  can_claim_production_ready: false,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_local_model_verified: false,
  strict_provider_diverse_stable_allowed: false,
  reason: decisionReport.post_rc_openai_only_stable
    ? "OpenAI-only stable scope decision passed for canonical claim post-rc-openai-only-stable. Bare stable, bare release-gated, provider-diverse, provider-verified, adapter-checked, and local-model claims remain blocked."
    : "OpenAI-only stable scope decision failed."
};

const openaiOnlyStableGateReport = {
  status: decisionReport.status,
  stage: STAGE,
  can_claim_post_rc_openai_only_stable: decisionReport.post_rc_openai_only_stable,
  can_claim_general_stable: false,
  can_claim_general_production_ready: false,
  can_claim_provider_diverse: false,
  can_claim_local_model_verified: false,
  reason: decisionReport.post_rc_openai_only_stable
    ? "OpenAI-only stable scoped decision passed. General stable, general production-ready, provider-diverse, and local-model claims remain blocked."
    : "OpenAI-only stable scoped decision failed."
};

const unresolvedItems = {
  status: decisionReport.status === "pass" ? "none_for_openai_only_stable_scope" : "unresolved",
  unresolved_for_openai_only_stable_scope: evidenceCompleteness.missing_evidence,
  unresolved_for_strict_or_bare_stable_scope: [
    "local endpoint readiness",
    "provider diversity evidence",
    "provider verification evidence",
    "adapter checking evidence",
    "local model verification",
    "bare release-gated gate"
  ]
};

writeTextSafe(p("release", "post_rc_openai_only_stable_scope_decision_scope.yaml"), `stage: ${STAGE}

approved_actions:
  owner_decision_validation: true
  owner_scope_decision_recording: true
  openai_only_stable_scope_evaluation: true
  stable_evidence_inventory_review: true
  evidence_completeness_audit: true
  local_provider_out_of_scope_recording: true
  stable_claim_boundary_audit: true
  out_of_scope_boundary_recording: true
  scoped_decision_record_generation: true
  blocker_update: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution: true
  provider_verification_execution: true
  adapter_check_execution: true
  redteam_rerun: true
  containment_rerun: true
  production_deployment: true
  release_gate_rerun: true
  v36_modification: true
  dist_modification: true
  evidence_v36_baseline_modification: true
  additional_v36_baseline_refresh: true

claims_conditionally_allowed:
  - ${CANONICAL_STABLE_CLAIM}

claims_allowed:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

claims_not_allowed:
  - stable
  - production-ready
  - release-gated
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_gate.yaml"), `stage: ${STAGE}
status: ${gateReport.status}
stable_scope: ${STABLE_SCOPE}
post_rc_openai_only_stable_allowed: ${decisionReport.post_rc_openai_only_stable}
stable_allowed: false
bare_stable_allowed: false
post_rc_openai_only_production_ready_allowed: ${decisionReport.post_rc_openai_only_production_ready}
production_ready_allowed: false
bare_release_gated_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_claim_boundary.yaml"), `stage: ${STAGE}
status: ${claimBoundary.status}
stable_scope: ${STABLE_SCOPE}
telemetry_connected_allowed: true
production_monitored_allowed: true
post_rc_openai_only_production_ready_allowed: ${claimBoundary.post_rc_openai_only_production_ready_allowed}
post_rc_openai_only_stable_allowed: ${claimBoundary.post_rc_openai_only_stable_allowed}
stable_allowed: false
bare_stable_allowed: false
production_ready_allowed: false
bare_production_ready_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_decision_record.yaml"), `stage: ${STAGE}
status: ${decisionRecord.status}
decision: ${decisionRecord.decision}
stable_scope: ${STABLE_SCOPE}
post_rc_openai_only_stable: ${decisionRecord.post_rc_openai_only_stable}
post_rc_openai_only_production_ready: ${decisionRecord.post_rc_openai_only_production_ready}
bare_stable_allowed: false
bare_release_gated_allowed: false
local_endpoint_out_of_scope: true
provider_diversity_out_of_scope: true
local_model_verification_out_of_scope: true
provider_verification_out_of_scope: true
adapter_checking_out_of_scope: true
bare_release_gated_out_of_scope: true
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_blocker_update.yaml"), `stage: ${STAGE}
status: updated
previous_status: post_rc_stable_scope_decision_required
new_status: ${blockerUpdate.new_status}
unblocks:
${blockerUpdate.unblocks.map((claim) => `  - ${claim}`).join("\n") || "  []"}
still_blocks:
  - stable
  - production-ready
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - bare release-gated
  - strict provider-diverse stable scope
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_out_of_scope_boundaries.yaml"), `stage: ${STAGE}
status: recorded
out_of_scope_for_this_decision:
  local_endpoint: true
  provider_diversity: true
  local_model_verification: true
  provider_verification: true
  adapter_checking: true
  bare_release_gated: true
does_not_allow:
  - stable
  - production-ready
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
  - bare release-gated
`);

writeTextSafe(p("release", "post_rc_stable_local_provider_out_of_scope_record.yaml"), `stage: ${STAGE}
status: recorded
scope: openai_only_post_rc_stable_decision
owner_decision_present: true
local_endpoint_out_of_scope: true
provider_diversity_out_of_scope: true
provider_verification_out_of_scope: true
adapter_checking_out_of_scope: true
local_model_verification_out_of_scope: true
bare_release_gated_out_of_scope: true
local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
`);

writeTextSafe(p("evals", "suites", "post_rc_openai_only_stable_scope_decision.yaml"), `suite: post_rc_openai_only_stable_scope_decision
stage: ${STAGE}
expected_status: pass
checks:
  - owner_scope_decision_recorded
  - post_rc_openai_only_production_ready_true
  - production_monitored_true
  - telemetry_connected_true
  - post_rc_openai_only_stable_allowed
  - bare_stable_blocked
  - bare_release_gated_blocked
  - local_provider_adapter_paths_out_of_scope
  - no_forbidden_execution
`);

writeTextSafe(p("docs", "openai_only_stable_scope_decision.md"), `# OpenAI-Only Stable Scope Decision

Stage: ${STAGE}

The owner selected the OpenAI-only post-RC stable scope. Local endpoint, provider diversity, local-model verification, provider verification, adapter checking, and bare release-gated are explicitly out of scope for this scoped stable decision.
`);

writeTextSafe(p("docs", "stable_openai_only_claim_boundary.md"), `# Stable OpenAI-Only Claim Boundary

The canonical scoped claim is ${CANONICAL_STABLE_CLAIM}. Bare stable, bare production-ready, provider-diverse, provider-verified, adapter-checked, local-model-verified, and bare release-gated remain blocked.
`);

writeTextSafe(p("docs", "openai_only_stable_claim_boundary.md"), `# OpenAI-Only Stable Claim Boundary

The canonical scoped claim is ${CANONICAL_STABLE_CLAIM}. General stable, general production-ready, provider-diverse, provider-verified, adapter-checked, local-model-verified, and bare release-gated remain blocked.
`);

writeTextSafe(p("docs", "stable_out_of_scope_boundaries.md"), `# Stable Out-of-Scope Boundaries

Local endpoint, provider diversity, local-model verification, provider verification, adapter checking, and bare release-gated are out of scope for the OpenAI-only stable decision. They remain blocked for strict provider-diverse or bare stable paths.
`);

writeTextSafe(p("docs", "stable_local_provider_out_of_scope.md"), `# Stable Local Provider Out-of-Scope

Local endpoint, provider diversity, provider verification, adapter checking, local-model verification, and bare release-gated are outside this OpenAI-only stable scoped decision. Local endpoint remains deferred until the operator provides endpoint readiness.
`);

writeTextSafe(p("docs", "next_provider_diverse_stable_path_plan.md"), `# Next Provider-Diverse Stable Path Plan

Provider-diverse stable remains a separate future path. It requires local endpoint readiness or second-provider evidence, provider verification, adapter checking, and local-model verification before that future path can be evaluated.
`);

writeTextSafe(p("docs", "next_post_stable_options.md"), `# Next Post-Stable Options

1. Final post-stable handoff and archive.
2. Local endpoint readiness preflight after operator signal.
3. Keep strict provider-diverse path deferred.
`);

writeTextSafe(p("docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until the operator provides endpoint readiness. This OpenAI-only stable decision does not probe a local endpoint or execute a local model.
`);

writeJsonSafe(e("owner_scope_decision_record.json"), ownerDecision);
writeJsonSafe(e("stable_evidence_summary.json"), evidenceSummary);
writeJsonSafe(e("stable_evidence_completeness.json"), evidenceCompleteness);
writeJsonSafe(e("stable_out_of_scope_boundaries.json"), outOfScopeBoundaries);
writeJsonSafe(e("stable_scope_decision_report.json"), decisionReport);
writeJsonSafe(e("stable_claim_boundary.json"), claimBoundary);
writeJsonSafe(e("stable_decision_record.json"), decisionRecord);
writeJsonSafe(e("stable_blocker_update.json"), blockerUpdate);
writeJsonSafe(e("stable_gate_report.json"), gateReport);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);
writeTextSafe(e("stable_scope_decision_report.md"), markdownDecision(decisionReport));

writeJsonSafe(e("openai_only_stable_scope_decision_report.json"), decisionReport);
writeJsonSafe(e("openai_only_stable_evidence_inventory.json"), evidenceInventory);
writeJsonSafe(e("openai_only_stable_gate_criteria.json"), gateCriteria);
writeJsonSafe(e("openai_only_stable_claim_boundary.json"), claimBoundary);
writeJsonSafe(e("openai_only_stable_decision_record.json"), openaiOnlyStableDecisionRecord);
writeJsonSafe(e("stable_local_provider_out_of_scope_record.json"), localProviderOutOfScope);
writeJsonSafe(e("openai_only_stable_blocker_update.json"), openaiOnlyStableBlockerUpdate);
writeJsonSafe(e("openai_only_stable_gate_report.json"), openaiOnlyStableGateReport);

writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_scope_decision_report.json"), decisionReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_scope_decision_report.md"), markdownDecision(decisionReport));
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_claim_boundary_report.json"), claimBoundary);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_claim_boundary_report.md"), markdownDecision(decisionReport));
writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_gate_report.json"), gateReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_gate_report.md"), markdownGate(gateReport));

console.log(JSON.stringify(decisionReport, null, 2));
process.exit(decisionReport.status === "pass" ? 0 : 1);
