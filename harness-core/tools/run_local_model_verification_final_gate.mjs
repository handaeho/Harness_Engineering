#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate";
const REQUIRED_APPROVAL = "I approve local-model-verified for the post-stable Ollama qwen3 local lane based on completed no-tool, multi-model, redteam, adapter conformance, redaction, and reference baseline evidence.";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate";
const CANONICAL_CLAIM = "local-model-verified";
const SCOPE = "post_stable_ollama_qwen3_local_lane";
const PROVIDER = "ollama";
const MODELS = ["qwen3:14b", "qwen3.6:27b"];
const ALLOWED_CLAIMS = [
  CANONICAL_CLAIM,
  "post-stable-local-model-verification-final-gate-passed",
  "post-stable-local-model-verified-claim-enabled",
  "post-stable-local-model-verification-owner-final-decision-recorded",
  "post-stable-local-model-verification-final-decision-recorded",
  "post-stable-local-model-verification-evidence-accepted"
];
const BLOCKED_CLAIMS = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const args = process.argv.slice(2);
let rootArg = null;
let approval = "";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--approval") {
    approval = args[i + 1] || "";
    i += 1;
  } else if (!args[i].startsWith("--") && !rootArg) {
    rootArg = args[i];
  }
}

const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
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

function onlyOwnerDecisionBlocked(items) {
  return Array.isArray(items)
    && items.length === 1
    && (
      items[0] === "owner_final_decision"
      || items[0]?.id === "owner_final_decision"
    );
}

function statusLines(status) {
  return status.stdout.split(/\r?\n/).filter(Boolean);
}

function approvalRecorded(record) {
  if (!record) return false;
  if (record.owner_approval_phrase === REQUIRED_APPROVAL) return true;
  return record.owner_approval_phrase_verified === true
    && (
      record.approved_claim === CANONICAL_CLAIM
      || record.decision === "approve_local_model_verified_claim"
      || record.decision === "approve_post_stable_ollama_qwen3_local_model_verified"
    );
}

function modelResult(report, model) {
  return report?.model_results?.find((item) => item.model === model) || null;
}

function sourceExists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

const existingFinalDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_decision_record.json`);
const existingOwnerDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_owner_final_decision.json`);
const approvalPhraseVerified = approval === REQUIRED_APPROVAL
  || approvalRecorded(existingFinalDecision)
  || approvalRecorded(existingOwnerDecision);
const approvalSource = approval === REQUIRED_APPROVAL
  ? "current_invocation"
  : approvalRecorded(existingFinalDecision)
    ? "existing_final_decision_record"
    : approvalRecorded(existingOwnerDecision)
      ? "existing_owner_final_decision_record"
      : "missing";

const compare = runNode("check_reference_baseline_integrity.mjs");
const preflight = readJsonIfExists("evidence/post-stable-local-model-verification-final-gate-preflight/local_model_verification_final_gate_preflight_report.json");
const ownerPacket = readJsonIfExists("evidence/post-stable-local-model-verification-owner-decision-packet/local_model_verification_owner_decision_packet.json");
const ownerPacketRefresh = readJsonIfExists("evidence/post-stable-local-model-verification-owner-decision-packet-refresh/local_model_verification_owner_decision_packet_refreshed.json");
const evidenceBundle = readJsonIfExists("evidence/post-stable-local-model-verification-evidence-bundle-draft/local_model_verification_evidence_bundle_report.json");
const noToolMultiModel = readJsonIfExists("evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json");
const redteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const adapterConformance = readJsonIfExists("evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json");
const redaction = readJsonIfExists("evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json");
const reference_baselineDependency = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_dependency_for_local_verification_gate_report.json");
const baselineRefresh = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json");
const protectedStatus = gitStatus([
  "legacy-reference-source",
  "dist",
  "harness-core/evidence/reference-baseline",
  "harness-core/node_modules"
]);
const protectedLines = statusLines(protectedStatus);
const referenceBaselineSourceModified = protectedLines.some((line) => line.includes("legacy-reference-source"));
const distModified = protectedLines.some((line) => line.includes("dist"));
const evidenceBaselineModified = protectedLines.some((line) => line.includes("harness-core/evidence/reference-baseline"));
const nodeModulesModified = protectedLines.some((line) => line.includes("harness-core/node_modules"));

const qwen14 = modelResult(noToolMultiModel, "qwen3:14b");
const qwen36 = modelResult(noToolMultiModel, "qwen3.6:27b");
const noToolPass = noToolMultiModel?.status === "pass"
  && noToolMultiModel.new_local_model_execution === false
  && noToolMultiModel.new_local_generation_calls === 0
  && MODELS.every((model) => noToolMultiModel.models?.includes(model))
  && noToolMultiModel.model_results?.every((item) => item.provider === PROVIDER
    && item.local_no_tool_canary_passed === true
    && item.result_review_passed === true
    && item.cases_failed === 0
    && item.tool_calling_used === false
    && item.raw_request_stored === false
    && item.raw_response_stored === false
    && item.redaction_passed === true)
  && noToolMultiModel.storage_redaction_comparison?.status === "pass";
const qwen3_14b_no_tool_review_passed = noToolPass
  && qwen14?.local_no_tool_canary_passed === true
  && qwen14?.result_review_passed === true;
const qwen3_6_27b_no_tool_review_passed = noToolPass
  && qwen36?.local_no_tool_canary_passed === true
  && qwen36?.result_review_passed === true;
const redteamPass = redteam?.status === "pass"
  && MODELS.every((model) => redteam.models_tested?.includes(model))
  && redteam.total_cases === 8
  && redteam.cases_passed === 8
  && redteam.cases_failed === 0
  && redteam.dummy_secret_leaked === false
  && redteam.raw_request_stored === false
  && redteam.raw_response_stored === false
  && redteam.secrets_logged === false;
const adapterPass = adapterConformance?.status === "pass"
  && adapterConformance.dependency_backed_validation_executed === true
  && adapterConformance.new_local_model_execution === false
  && adapterConformance.new_local_generation_calls === 0
  && adapterConformance.checks?.ollama_adapter_loaded === true
  && adapterConformance.checks?.local_redteam_coverage_reviewed === true
  && adapterConformance.openai_model_api_call === false
  && adapterConformance.telemetry_sink_write === false;
const localOllamaAdapterConformanceReviewed = adapterPass
  && adapterConformance.source_local_model_execution_reviewed === true
  && adapterConformance.checks?.provider_matrix_ollama_present === true
  && adapterConformance.checks?.no_tool_mapping_reviewed === true
  && adapterConformance.checks?.reasoning_control_mapping_reviewed === true
  && adapterConformance.checks?.structured_output_mapping_reviewed === true
  && adapterConformance.checks?.tool_calling_mock_mapping_reviewed === true
  && adapterConformance.checks?.redaction_storage_boundary_reviewed === true;
const redactionPass = redaction?.status === "pass"
  && redaction.findings_count === 0
  && redaction.raw_request_stored === false
  && redaction.raw_response_stored === false
  && redaction.secrets_logged === false;
const approvedBaselineRefresh = baselineRefresh?.status === "pass"
  && baselineRefresh.approval_phrase_verified === true
  && baselineRefresh.baseline_refresh_performed === true
  && baselineRefresh.post_refresh_compare_status === "pass"
  && baselineRefresh.post_refresh_mismatch_count === 0
  && baselineRefresh.reference_baseline_source_modified === false
  && baselineRefresh.dist_modified === false;
const compareCurrentMismatchCount = compare.parsed?.alpha_snapshot?.current_snapshot_mismatch_count
  ?? compare.parsed?.current_snapshot_mismatch_count;
const compareDisallowedSnapshotPathCount = compare.parsed?.alpha_snapshot?.disallowed_snapshot_path_count
  ?? compare.parsed?.disallowed_snapshot_path_count;
const dsStoreExclusionPolicy = baselineRefresh?.snapshot_exclusion_policy || null;
const dsStoreExclusionPolicyEnforced = approvedBaselineRefresh === true
  && Array.isArray(dsStoreExclusionPolicy?.excluded_basenames)
  && dsStoreExclusionPolicy.excluded_basenames.includes(".DS_Store")
  && dsStoreExclusionPolicy.source_files_removed === false
  && compareDisallowedSnapshotPathCount === 0;
const reference_baselinePass = reference_baselineDependency?.status === "ready_after_repair"
  && reference_baselineDependency.check_reference_baseline_integrity_status === "pass"
  && compare.exit_code === 0
  && compare.status === "pass"
  && compareCurrentMismatchCount === 0
  && compareDisallowedSnapshotPathCount === 0
  && approvedBaselineRefresh === true
  && dsStoreExclusionPolicyEnforced === true;
const preflightReady = preflight?.status === "ready_for_owner_decision_to_claim_local_model_verified"
  && onlyOwnerDecisionBlocked(preflight.blocked_by)
  && preflight.final_gate_executed === false
  && preflight.local_model_verified_allowed === false;
const ownerPacketReady = ownerPacket?.status === "ready_for_owner_decision_to_claim_local_model_verified"
  && ownerPacket.ready_for_owner_decision_to_claim_local_model_verified === true
  && onlyOwnerDecisionBlocked(ownerPacket.remaining_blockers)
  && ownerPacketRefresh?.ready_for_owner_decision_to_claim_local_model_verified === true
  && onlyOwnerDecisionBlocked(ownerPacketRefresh.remaining_blockers);
const evidenceBundlePass = evidenceBundle?.status === "pass"
  && evidenceBundle.raw_request_stored === false
  && evidenceBundle.raw_response_stored === false
  && evidenceBundle.secrets_logged === false
  && Array.isArray(evidenceBundle.missing_evidence)
  && evidenceBundle.missing_evidence.length === 0;
const protectedPathsPass = protectedStatus.exit_code === 0
  && referenceBaselineSourceModified === false
  && distModified === false
  && nodeModulesModified === false
  && (!evidenceBaselineModified || approvedBaselineRefresh);

const evidenceChecks = [
  {
    id: "qwen3_14b_no_tool_review",
    source: qwen14?.source_files?.resultReview || null,
    passed: qwen3_14b_no_tool_review_passed
  },
  {
    id: "qwen3_6_27b_no_tool_review",
    source: qwen36?.source_files?.resultReview || null,
    passed: qwen3_6_27b_no_tool_review_passed
  },
  {
    id: "multi_model_no_tool_comparison",
    source: "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json",
    passed: noToolPass
  },
  {
    id: "bounded_local_redteam",
    source: "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json",
    passed: redteamPass
  },
  {
    id: "adapter_conformance_dependency_backed_validation",
    source: "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
    passed: adapterPass
  },
  {
    id: "local_ollama_adapter_conformance_review",
    source: "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
    passed: localOllamaAdapterConformanceReviewed
  },
  {
    id: "redaction_storage_audit",
    source: "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
    passed: redactionPass
  },
  {
    id: "reference_baseline_compare",
    source: "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_dependency_for_local_verification_gate_report.json",
    passed: reference_baselinePass
  },
  {
    id: "ds_store_exclusion_policy",
    source: "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json",
    passed: dsStoreExclusionPolicyEnforced
  },
  {
    id: "owner_final_decision",
    source: approvalSource === "current_invocation"
      ? "current_invocation_approval_phrase"
      : `evidence/${EVIDENCE_DIR}/${approvalSource === "existing_final_decision_record" ? "local_model_verification_final_decision_record.json" : "local_model_verification_owner_final_decision.json"}`,
    passed: approvalPhraseVerified
  }
].map((item) => ({
  ...item,
  present: item.source === "current_invocation_approval_phrase"
    ? true
    : Boolean(item.source && sourceExists(item.source))
}));
const missingEvidence = evidenceChecks
  .filter((item) => item.present !== true || item.passed !== true)
  .map((item) => item.id);
const evidenceCompletenessPass = missingEvidence.length === 0;

const checks = [
  { name: "exact owner approval phrase verified", status: approvalPhraseVerified ? "pass" : "fail", detail: { approval_phrase_verified: approvalPhraseVerified, approval_source: approvalSource } },
  { name: "final gate preflight is owner-decision-ready", status: preflightReady ? "pass" : "fail", detail: { preflight_status: preflight?.status, blocked_by: preflight?.blocked_by } },
  { name: "owner decision packet is owner-decision-ready", status: ownerPacketReady ? "pass" : "fail", detail: { packet_status: ownerPacket?.status, remaining_blockers: ownerPacket?.remaining_blockers } },
  { name: "evidence bundle passed", status: evidenceBundlePass ? "pass" : "fail", detail: { bundle_status: evidenceBundle?.status } },
  { name: "qwen3:14b no-tool review passed", status: qwen3_14b_no_tool_review_passed ? "pass" : "fail", detail: qwen14 || {} },
  { name: "qwen3.6:27b no-tool review passed", status: qwen3_6_27b_no_tool_review_passed ? "pass" : "fail", detail: qwen36 || {} },
  { name: "no-tool multi-model qwen evidence passed", status: noToolPass ? "pass" : "fail", detail: { status: noToolMultiModel?.status, models: noToolMultiModel?.models } },
  { name: "bounded local redteam passed", status: redteamPass ? "pass" : "fail", detail: { status: redteam?.status, total_cases: redteam?.total_cases, cases_failed: redteam?.cases_failed } },
  { name: "dependency-backed Ollama adapter conformance passed", status: adapterPass ? "pass" : "fail", detail: { status: adapterConformance?.status, dependency_backed_validation_executed: adapterConformance?.dependency_backed_validation_executed } },
  { name: "local Ollama reasoning response provider capability evidence reviewed", status: localOllamaAdapterConformanceReviewed ? "pass" : "fail", detail: adapterConformance?.checks || {} },
  { name: "local redaction and storage audit passed", status: redactionPass ? "pass" : "fail", detail: { status: redaction?.status, findings_count: redaction?.findings_count } },
  { name: "reference baseline dependency and compare passed", status: reference_baselinePass ? "pass" : "fail", detail: { dependency_status: reference_baselineDependency?.status, compare_status: compare.status, baseline_refresh_approved: approvedBaselineRefresh } },
  { name: ".DS_Store snapshot exclusion policy enforced", status: dsStoreExclusionPolicyEnforced ? "pass" : "fail", detail: dsStoreExclusionPolicy || {} },
  { name: "final evidence completeness passed", status: evidenceCompletenessPass ? "pass" : "fail", detail: { missing_evidence: missingEvidence } },
  { name: "protected paths remain inside allowed boundary", status: protectedPathsPass ? "pass" : "fail", detail: protectedStatus },
  { name: "no new external or local generation in final gate", status: "pass", detail: { openai_model_api_call: false, openai_provider_call: false, telemetry_sink_write: false, local_endpoint_probe: false, local_model_execution: false, new_local_generation_calls: 0 } },
  { name: "no additional reference baseline refresh in final gate", status: "pass", detail: { evidence_reference_baseline_refreshed_in_this_stage: false, additional_reference_baseline_refresh: false } }
];
const failures = checks.filter((check) => check.status !== "pass");
const pass = failures.length === 0;

const evidenceSummary = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  provider: PROVIDER,
  scope: SCOPE,
  models: MODELS,
  source_reports: {
    qwen3_14b_no_tool_result_review: qwen14?.source_files?.resultReview || null,
    qwen3_6_27b_no_tool_result_review: qwen36?.source_files?.resultReview || null,
    no_tool_multimodel: "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json",
    redteam: "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json",
    adapter_conformance: "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
    redaction_storage_audit: "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
    reference_baseline_dependency: "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_dependency_for_local_verification_gate_report.json",
    reference_baseline_refresh: "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json"
  },
  qwen3_14b_no_tool_review_passed,
  qwen3_6_27b_no_tool_review_passed,
  multimodel_no_tool_comparison_passed: noToolPass,
  local_redteam_bounded_smoke_passed: redteamPass,
  adapter_conformance_dependency_backed_validation_passed: adapterPass,
  local_ollama_adapter_conformance_reviewed: localOllamaAdapterConformanceReviewed,
  ollama_reasoning_control_mapping_reviewed: adapterConformance?.checks?.reasoning_control_mapping_reviewed === true,
  ollama_response_mapping_reviewed: adapterConformance?.checks?.no_tool_mapping_reviewed === true
    && adapterConformance?.checks?.structured_output_mapping_reviewed === true
    && adapterConformance?.checks?.tool_calling_mock_mapping_reviewed === true,
  ollama_provider_capability_reviewed: adapterConformance?.checks?.provider_matrix_ollama_present === true,
  storage_redaction_audit_passed: redactionPass,
  reference_baseline_compare_passed: reference_baselinePass,
  ds_store_exclusion_policy_enforced: dsStoreExclusionPolicyEnforced,
  owner_final_decision_present: approvalPhraseVerified,
  no_tool_multimodel_pass: noToolPass,
  local_redteam_pass: redteamPass,
  adapter_conformance_pass: adapterPass,
  redaction_storage_audit_pass: redactionPass,
  reference_baseline_pass: reference_baselinePass,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  local_model_execution_in_this_stage: false,
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  new_local_generation_calls_in_this_stage: 0,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  additional_reference_baseline_refresh: false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  node_modules_modified: nodeModulesModified,
  evidence_reference_baseline_modified: evidenceBaselineModified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  ds_store_exclusion_policy: dsStoreExclusionPolicy,
  prior_local_generation_calls: {
    evidence_bundle_total_autopilot_local_generation_calls: evidenceBundle?.total_autopilot_local_generation_calls ?? null,
    redteam_local_model_calls: redteam?.local_model_calls ?? null,
    redteam_new_local_generation_calls: redteam?.new_local_generation_calls ?? null
  }
};
const evidenceCompleteness = {
  status: evidenceCompletenessPass ? "pass" : "fail",
  stage: STAGE,
  required_evidence: evidenceChecks,
  missing_evidence: missingEvidence,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  ds_store_exclusion_policy_enforced: dsStoreExclusionPolicyEnforced,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};
const finalDecisionRecord = {
  status: pass ? "recorded" : "not_recorded",
  stage: STAGE,
  decision: pass ? "approve_local_model_verified_claim" : "do_not_approve_local_model_verified_claim",
  owner_final_decision_present: approvalPhraseVerified,
  owner_approval_phrase_verified: approvalPhraseVerified,
  owner_approval_phrase: approvalPhraseVerified ? REQUIRED_APPROVAL : null,
  approval_source: approvalSource,
  approved_claim: pass ? CANONICAL_CLAIM : null,
  scope: SCOPE,
  provider: PROVIDER,
  models: MODELS,
  based_on_completed_evidence: evidenceChecks.map((item) => item.id),
  local_model_verified: pass,
  is_provider_diverse: false,
  is_provider_verified: false,
  is_adapter_checked: false,
  is_production_ready: false,
  is_stable: false,
  is_release_gated: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false
};
const ownerDecision = {
  ...finalDecisionRecord,
  decision: pass ? "approve_post_stable_ollama_qwen3_local_model_verified" : "do_not_approve_local_model_verified",
  legacy_decision_record: true
};
const claimBoundary = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  provider: PROVIDER,
  scope: SCOPE,
  local_model_verified_allowed: pass,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  allowed_claims: pass ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  does_not_allow: BLOCKED_CLAIMS,
  reason: pass
    ? "Owner final decision is recorded and all local Ollama qwen evidence gates passed. The allowed claim is limited to local-model-verified for the post-stable Ollama qwen local lane."
    : "Local model verification final gate failed; local-model-verified remains unavailable."
};
const report = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  local_model_verification_final_gate_passed: pass,
  final_gate_executed: true,
  approval_phrase_verified: approvalPhraseVerified,
  approval_source: approvalSource,
  can_claim_local_model_verified: pass,
  local_model_verified_allowed: pass,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  why_not_stable: "This gate only enables the scoped local-model-verified claim; provider, adapter, production, stable, and release gates remain separate.",
  qwen3_14b_no_tool_review_passed,
  qwen3_6_27b_no_tool_review_passed,
  multimodel_no_tool_comparison_passed: noToolPass,
  local_redteam_bounded_smoke_passed: redteamPass,
  adapter_conformance_dependency_backed_validation_passed: adapterPass,
  local_ollama_adapter_conformance_reviewed: localOllamaAdapterConformanceReviewed,
  storage_redaction_audit_passed: redactionPass,
  reference_baseline_compare_passed: reference_baselinePass,
  ds_store_exclusion_policy_enforced: dsStoreExclusionPolicyEnforced,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  local_redteam_rerun: false,
  adapter_conformance_rerun_with_generation: false,
  production_deployment: false,
  release_gate_rerun: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  additional_reference_baseline_refresh: false,
  ds_store_deletion_from_reference_baseline: false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  evidence_reference_baseline_modified: evidenceBaselineModified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  node_modules_modified: nodeModulesModified,
  evidence_summary_status: evidenceSummary.status,
  evidence_completeness_status: evidenceCompleteness.status,
  checks,
  failures,
  claims_allowed: claimBoundary.allowed_claims,
  claims_blocked: BLOCKED_CLAIMS,
  reason: claimBoundary.reason
};
const gate = {
  status: pass ? "pass" : "fail",
  stage: STAGE,
  can_claim_local_model_verified: pass,
  can_claim_provider_diverse: false,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_production_ready: false,
  can_claim_stable: false,
  can_claim_release_gated: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  reason: report.why_not_stable,
  checks,
  failures,
  claims_allowed_by_this_gate: claimBoundary.allowed_claims,
  claims_still_blocked: BLOCKED_CLAIMS
};
const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "ready_for_owner_decision_to_claim_local_model_verified",
  new_status: pass ? "local_model_verified_allowed_provider_diverse_still_blocked" : "local_model_verified_still_blocked",
  unblocks: pass ? [CANONICAL_CLAIM] : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "define provider-diverse path",
    "define provider-verified gate",
    "define adapter-checked gate",
    "keep production-ready/stable scoped claims separate"
  ]
};
const unresolvedItems = pass ? [] : failures.map((failure, index) => ({
  id: `LMVFGATE-${String(index + 1).padStart(3, "0")}`,
  severity: failure.name.includes("approval") ? "high" : "medium",
  description: failure.name,
  blocks_local_model_verified: true,
  detail: failure.detail
}));
const md = `# Local Model Verification Final Gate

Status: ${report.status}

- Stage: ${STAGE}
- Approval phrase verified: ${report.approval_phrase_verified}
- Can claim local-model-verified: ${report.can_claim_local_model_verified}
- Provider-diverse allowed: false
- Provider-verified allowed: false
- Adapter-checked allowed: false
- Production-ready allowed: false
- Stable allowed: false
- Release-gated allowed: false
- New local generation calls in this stage: 0
- Additional reference baseline refresh in this stage: false
- .DS_Store deleted from referenceBaseline: false

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;
const boundaryMd = `# Local Model Verified Claim Boundary

Status: ${claimBoundary.status}

- Allowed claim: ${pass ? CANONICAL_CLAIM : "none"}
- Scope: ${SCOPE}
- Provider: ${PROVIDER}
- Models: ${MODELS.join(", ")}
- Claims still blocked: ${BLOCKED_CLAIMS.join(", ")}
- Bare release-gated allowed: false
`;
const evidenceMd = `# Local Model Verification Final Evidence

Status: ${evidenceCompleteness.status}

${evidenceChecks.map((item) => `- ${item.passed ? "pass" : "fail"}: ${item.id}`).join("\n")}

Missing evidence: ${missingEvidence.length ? missingEvidence.join(", ") : "none"}
`;

writeJson(e("local_model_verification_final_gate_report.json"), report);
writeText(e("local_model_verification_final_gate_report.md"), md);
writeJson(e("local_model_verification_final_evidence_summary.json"), evidenceSummary);
writeJson(e("local_model_verification_final_evidence_completeness.json"), evidenceCompleteness);
writeJson(e("local_model_verification_owner_final_decision.json"), ownerDecision);
writeJson(e("local_model_verification_final_decision_record.json"), finalDecisionRecord);
writeJson(e("local_model_verified_claim_boundary.json"), claimBoundary);
writeJson(e("local_model_verification_final_gate_gate_report.json"), gate);
writeJson(e("local_model_verification_final_blocker_update.json"), blockerUpdate);
writeJson(e("local_model_verification_blocker_update.json"), blockerUpdate);
writeJson(e("unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_model_verification_final_gate_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_final_gate_report.md"), md);
writeJson(p("evals", "reports", "local_model_verification_final_gate_gate_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_final_gate_gate_report.md"), md);
writeJson(p("evals", "reports", "local_model_verified_claim_boundary_report.json"), claimBoundary);
writeText(p("evals", "reports", "local_model_verified_claim_boundary_report.md"), boundaryMd);
writeJson(p("evals", "reports", "local_model_verification_final_evidence_report.json"), evidenceCompleteness);
writeText(p("evals", "reports", "local_model_verification_final_evidence_report.md"), evidenceMd);

writeText(p("release", "post_stable_local_model_verification_final_gate_scope.yaml"), `stage: ${STAGE}
approved_actions:
  owner_final_decision_record: true
  local_model_verification_final_gate_evaluation: true
  local_model_verified_claim_boundary_update: true
  evidence_summary_update: true
  final_evidence_completeness_update: true
forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution_in_this_stage: true
  new_local_generation_call_in_this_stage: true
  local_redteam_rerun: true
  adapter_conformance_rerun_with_generation: true
  production_deployment: true
  release_gate_rerun: true
  evidence_reference_baseline_refresh: true
  ds_store_deletion_from_reference_baseline: true
  reference_baseline_modification: true
  dist_modification: true
claims_conditionally_allowed:
  - local-model-verified
claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);
writeText(p("release", "post_stable_local_model_verification_final_gate.yaml"), `stage: ${STAGE}
status: ${report.status}
local_model_verification_final_gate_passed: ${pass}
local_model_verified_allowed: ${pass}
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
can_enter_stable_release: false
`);
writeText(p("release", "post_stable_local_model_verification_owner_final_decision.yaml"), `stage: ${STAGE}
status: ${ownerDecision.status}
decision: ${ownerDecision.decision}
scope: ${SCOPE}
local_model_verified: ${pass}
provider_diverse: false
provider_verified: false
adapter_checked: false
production_ready: false
stable: false
release_gated: false
bare_release_gated_allowed: false
`);
writeText(p("release", "post_stable_local_model_verification_final_decision_record.yaml"), `stage: ${STAGE}
status: ${finalDecisionRecord.status}
decision: ${finalDecisionRecord.decision}
scope: ${SCOPE}
approved_claim: ${pass ? CANONICAL_CLAIM : "none"}
owner_approval_phrase_verified: ${approvalPhraseVerified}
local_model_verified: ${pass}
provider_diverse: false
provider_verified: false
adapter_checked: false
production_ready: false
stable: false
release_gated: false
bare_release_gated_allowed: false
can_enter_stable_release: false
`);
writeText(p("release", "post_stable_local_model_verified_claim_boundary.yaml"), `stage: ${STAGE}
status: ${claimBoundary.status}
scope: ${SCOPE}
local_model_verified_allowed: ${pass}
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
`);
writeText(p("release", "post_stable_local_model_verification_final_blocker_update.yaml"), `stage: ${STAGE}
status: updated
new_status: ${blockerUpdate.new_status}
unblocks:
${blockerUpdate.unblocks.length ? blockerUpdate.unblocks.map((claim) => `  - ${claim}`).join("\n") : "  - none"}
still_blocks:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
next_required_actions:
${blockerUpdate.next_required_actions.map((action) => `  - ${action}`).join("\n")}
`);
writeText(p("release", "post_stable_local_model_verification_blocker_update.yaml"), `stage: ${STAGE}
status: updated
new_status: ${blockerUpdate.new_status}
unblocks:
${blockerUpdate.unblocks.length ? blockerUpdate.unblocks.map((claim) => `  - ${claim}`).join("\n") : "  - none"}
still_blocks:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
next_required_actions:
${blockerUpdate.next_required_actions.map((action) => `  - ${action}`).join("\n")}
`);
writeText(p("evals", "suites", "post_stable_local_model_verification_final_gate.yaml"), `suite: post_stable_local_model_verification_final_gate
stage: ${STAGE}
checks:
  - exact_owner_approval_phrase
  - final_gate_preflight_owner_decision_ready
  - owner_decision_packet_ready
  - qwen3_14b_no_tool_review_pass
  - qwen3_6_27b_no_tool_review_pass
  - no_tool_multimodel_pass
  - local_redteam_pass
  - adapter_conformance_pass
  - local_ollama_adapter_conformance_reviewed
  - redaction_storage_audit_pass
  - reference_baseline_compare_pass
  - ds_store_exclusion_policy_enforced
  - protected_paths_unmodified_or_owner_approved_baseline_refresh
forbidden:
  - openai_model_api_call
  - openai_provider_call
  - telemetry_sink_write
  - local_endpoint_probe
  - local_model_execution_in_this_stage
  - new_local_generation_call_in_this_stage
  - local_redteam_rerun
  - adapter_conformance_rerun_with_generation
  - production_deployment
  - release_gate_rerun
  - evidence_reference_baseline_refresh
  - ds_store_deletion_from_reference_baseline
`);
writeText(p("docs", "local_model_verification_final_gate.ko.md"), `# Local model verification final gate

상태: ${report.status}

- 승인 문구 확인: ${report.approval_phrase_verified}
- local-model-verified 허용: ${report.can_claim_local_model_verified}
- 범위: post-stable Ollama qwen local lane
- 대상 모델: qwen3:14b, qwen3.6:27b
- 이 단계의 새 local generation call: 0
- 이 단계의 추가 reference baseline refresh: false
- OpenAI model API call: false
- telemetry sink write: false
- .DS_Store referenceBaseline 원본 삭제: false

provider-diverse, provider-verified, adapter-checked, production-ready, stable, release-gated claim은 별도 gate가 없으므로 계속 차단한다.
`);
writeText(p("docs", "local_model_verified_claim_boundary.ko.md"), `# Local-model-verified claim boundary

\`local-model-verified\` claim은 ${STAGE}가 pass일 때 post-stable Ollama qwen local lane 범위에서만 허용된다.

이 claim은 provider-diverse, provider-verified, adapter-checked, production-ready, stable, release-gated 또는 bare release-gated를 의미하지 않는다.
`);
writeText(p("docs", "local_model_verification_final_decision_record.ko.md"), `# Local model verification final decision record

결정: ${finalDecisionRecord.decision}

근거:
- qwen3:14b no-tool result review
- qwen3.6:27b no-tool result review
- no-tool multi-model qwen evidence
- bounded local redteam
- dependency-backed Ollama adapter conformance
- redaction/storage audit
- owner-approved reference baseline refresh, .DS_Store snapshot exclusion policy, and compare

허용 claim: ${pass ? CANONICAL_CLAIM : "none"}
`);
writeText(p("docs", "next_provider_diverse_path_plan.ko.md"), `# Next provider-diverse path plan

현재 final gate는 local-model-verified만 허용한다.

provider-diverse로 올리려면 다음 별도 gate가 필요하다.
- Ollama 외 독립 provider lane 정의
- 동일 no-tool, redteam, adapter, redaction evidence surface의 provider별 실행 또는 검토
- provider별 결과 비교와 실패 격리 기준
- provider-diverse claim before any provider-diverse allowance

이 문서는 계획이며 provider-diverse claim은 계속 차단한다.
`);
writeText(p("docs", "next_adapter_checked_path_plan.ko.md"), `# Next adapter-checked path plan

현재 final gate는 dependency-backed Ollama adapter conformance 검토를 local-model-verified 근거로만 사용한다.

adapter-checked로 올리려면 다음 별도 gate가 필요하다.
- adapter별 runtime contract와 fixture coverage 확정
- no-tool, structured output, tool-calling mock, redaction boundary의 adapter-level pass 기준
- provider/local endpoint side effect와 telemetry write 금지 확인
- adapter-checked claim before any adapter-checked allowance

이 문서는 계획이며 adapter-checked claim은 계속 차단한다.
`);

console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
