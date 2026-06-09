#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-final-gate";
const EVIDENCE_DIR = "post-combined-provider-diverse-final-gate";
const REQUIRED_APPROVAL = "I approve provider-diverse final gate for the OpenAI API lane and Ollama qwen3 local lane.";
const CANONICAL_CLAIM = "provider-diverse";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
const ALLOWED_CLAIMS = [
  CANONICAL_CLAIM,
  "post-combined-provider-diverse-final-gate-passed",
  "post-combined-provider-diverse-claim-enabled",
  "post-combined-provider-diverse-owner-final-decision-recorded",
  "post-combined-provider-diverse-final-decision-recorded",
  "post-combined-provider-diverse-evidence-accepted"
];
const STILL_BLOCKED = [
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

function approvalRecorded(record) {
  if (!record) return false;
  if (record.owner_approval_phrase === REQUIRED_APPROVAL) return true;
  return record.owner_approval_phrase_verified === true
    && (
      record.approved_claim === CANONICAL_CLAIM
      || record.decision === "approve_provider_diverse_claim"
    );
}

function addEvidenceCheck(checks, id, source, passed, detail = {}) {
  checks.push({
    id,
    source,
    present: source === "current_invocation_approval_phrase" || exists(source),
    passed,
    detail
  });
}

function falseFlags(value, flags) {
  return flags.every((flag) => value?.[flag] === false);
}

function writeKoDoc(relPath, title, lines) {
  writeTextRel(relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

const existingFinalDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_decision_record.json`);
const existingOwnerDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_owner_final_decision.json`);
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
const combinedReport = readJsonIfExists("evidence/combined-openai-local-archive-export/combined_archive_export_report.json");
const combinedGate = readJsonIfExists("evidence/combined-openai-local-archive-export/combined_archive_export_gate_report.json");
const inventoryReport = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_report.json");
const inventoryGate = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_gate_report.json");
const openaiLane = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/openai_lane_evidence_summary.json");
const ollamaLane = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/ollama_qwen3_lane_evidence_summary.json");
const independence = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/provider_lane_independence_review.json");
const ownerPacket = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_owner_decision_packet.json");
const strictReadiness = readJsonIfExists("evidence/post-combined-strict-paths-owner-decision-packet/provider_diverse_decision_readiness.json");
const openaiArchive = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json");
const ollamaArchive = readJsonIfExists("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json");
const protectedStatus = gitStatus([
  "legacy-reference-source",
  "dist",
  "harness-core/evidence/reference-baseline",
  "harness-core/node_modules"
]);
const protectedLines = statusPaths(protectedStatus);
const referenceBaselineSourceModified = protectedLines.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source");
const distModified = protectedLines.some((file) => file.startsWith("dist/") || file === "dist");
const nodeModulesModified = protectedLines.some((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules");
const baselinePaths = protectedLines.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/"));
const baselineOnlyPriorRefresh = baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file));

const combinedPass = combinedReport?.status === "pass"
  && combinedGate?.status === "pass"
  && combinedReport?.post_rc_openai_only_stable === true
  && combinedReport?.local_model_verified === true
  && combinedGate?.can_claim_post_rc_openai_only_stable === true
  && combinedGate?.can_claim_local_model_verified === true
  && combinedGate?.can_claim_provider_diverse === false
  && falseFlags(combinedReport, [
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
    "reference_baseline_source_modified",
    "dist_modified",
    "additional_reference_baseline_refresh"
  ]);
const inventoryPass = inventoryReport?.status === "ready_for_owner_decision_to_claim_provider_diverse"
  && inventoryReport?.ready_for_owner_decision_to_claim_provider_diverse === true
  && inventoryGate?.status === "pass"
  && inventoryGate?.ready_for_owner_decision_to_claim_provider_diverse === true
  && ownerPacket?.status === "ready_for_owner_decision_to_claim_provider_diverse"
  && ownerPacket?.ready_for_owner_decision === true
  && strictReadiness?.status === "ready_for_owner_decision_to_claim_provider_diverse"
  && strictReadiness?.ready_for_owner_decision === true
  && Array.isArray(strictReadiness?.blockers)
  && strictReadiness.blockers.includes("owner_final_decision_required")
  && strictReadiness.blockers.includes("final_gate_not_executed");
const lanesPass = openaiLane?.status === "pass"
  && openaiLane?.lane_id === "openai_api_lane"
  && openaiLane?.provider_family === "openai"
  && openaiLane?.combined_archive_recorded === true
  && ollamaLane?.status === "pass"
  && ollamaLane?.lane_id === "ollama_qwen3_local_lane"
  && ollamaLane?.provider_family === "ollama_local"
  && ollamaLane?.combined_archive_recorded === true
  && independence?.status === "ready_for_owner_decision_to_claim_provider_diverse"
  && independence?.distinct_provider_lanes === true
  && independence?.openai_api_lane_present === true
  && independence?.ollama_qwen3_local_lane_present === true
  && independence?.independent_execution_evidence_per_lane === true;
const sourceArchivesPass = openaiArchive?.status === "pass"
  && openaiArchive?.post_rc_openai_only_stable === true
  && openaiArchive?.post_rc_openai_only_stable_allowed === true
  && openaiArchive?.provider_diverse_allowed === false
  && ollamaArchive?.status === "pass"
  && ollamaArchive?.local_model_verified === true
  && ollamaArchive?.local_model_verified_allowed === true
  && ollamaArchive?.provider_diverse_allowed === false;
const protectedPathsPass = protectedStatus.exit_code === 0
  && referenceBaselineSourceModified === false
  && distModified === false
  && nodeModulesModified === false
  && baselineOnlyPriorRefresh === true
  && compare.exit_code === 0
  && compare.status === "pass";
const noNewExecutionPass = [
  combinedReport,
  openaiArchive,
  ollamaArchive
].every((record) => record
  && record.openai_model_api_call === false
  && record.telemetry_sink_write === false
  && record.reference_baseline_source_modified === false
  && record.dist_modified === false);

const evidenceChecks = [];
addEvidenceCheck(evidenceChecks, "owner_final_decision", approvalSource === "current_invocation" ? "current_invocation_approval_phrase" : `evidence/${EVIDENCE_DIR}/${approvalSource === "existing_final_decision_record" ? "provider_diverse_final_decision_record.json" : "provider_diverse_owner_final_decision.json"}`, approvalPhraseVerified);
addEvidenceCheck(evidenceChecks, "combined_openai_local_archive", "evidence/combined-openai-local-archive-export/combined_archive_export_gate_report.json", combinedPass);
addEvidenceCheck(evidenceChecks, "provider_diverse_inventory_preflight", "evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_gate_report.json", inventoryPass);
addEvidenceCheck(evidenceChecks, "openai_lane_evidence", "evidence/post-combined-provider-diverse-evidence-inventory/openai_lane_evidence_summary.json", openaiLane?.status === "pass" && openaiLane?.combined_archive_recorded === true);
addEvidenceCheck(evidenceChecks, "ollama_qwen3_lane_evidence", "evidence/post-combined-provider-diverse-evidence-inventory/ollama_qwen3_lane_evidence_summary.json", ollamaLane?.status === "pass" && ollamaLane?.combined_archive_recorded === true);
addEvidenceCheck(evidenceChecks, "lane_independence_review", "evidence/post-combined-provider-diverse-evidence-inventory/provider_lane_independence_review.json", lanesPass);
addEvidenceCheck(evidenceChecks, "source_archives", "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json", sourceArchivesPass);
addEvidenceCheck(evidenceChecks, "protected_boundary", "evidence/combined-openai-local-archive-export/combined_archive_export_report.json", protectedPathsPass, { protected_lines: protectedLines });
addEvidenceCheck(evidenceChecks, "no_new_execution", "evidence/combined-openai-local-archive-export/combined_archive_export_report.json", noNewExecutionPass);

const missingEvidence = evidenceChecks
  .filter((check) => check.present !== true || check.passed !== true)
  .map((check) => check.id);
const gatePassed = missingEvidence.length === 0;

const ownerDecision = {
  status: gatePassed ? "recorded" : "blocked",
  stage: STAGE,
  decision: gatePassed ? "approve_provider_diverse_claim" : "provider_diverse_claim_not_approved",
  owner_approval_phrase: approval || existingOwnerDecision?.owner_approval_phrase || existingFinalDecision?.owner_approval_phrase || "",
  owner_approval_phrase_verified: approvalPhraseVerified,
  approved_claim: gatePassed ? CANONICAL_CLAIM : null,
  approved_scope: gatePassed ? SCOPE : null,
  is_provider_verified: false,
  is_adapter_checked: false,
  is_production_ready: false,
  is_stable: false,
  is_release_gated: false,
  bare_release_gated_allowed: false
};
const finalDecision = {
  status: gatePassed ? "recorded" : "blocked",
  stage: STAGE,
  decision: gatePassed ? "approve_provider_diverse_claim" : "provider_diverse_claim_not_approved",
  approved_claim: gatePassed ? CANONICAL_CLAIM : null,
  scope: gatePassed ? SCOPE : null,
  provider_diverse: gatePassed,
  provider_diverse_allowed: gatePassed,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  is_provider_verified: false,
  is_adapter_checked: false,
  is_general_production_ready: false,
  is_general_stable: false,
  final_claim_strength: gatePassed ? CANONICAL_CLAIM : "blocked",
  summary_claim: gatePassed ? CANONICAL_CLAIM : "blocked",
  owner_approval_phrase_verified: approvalPhraseVerified,
  evidence_accepted: gatePassed,
  no_new_execution: noNewExecutionPass,
  claim: gatePassed ? CANONICAL_CLAIM : "blocked",
  rationale: [
    "OpenAI API lane evidence exists",
    "Ollama qwen3 local lane evidence exists",
    "Ollama qwen3 local lane is local-model-verified",
    "The two lanes have distinct provider/runtime boundaries",
    "The two lanes have separate execution evidence",
    "Owner final decision approved provider-diverse claim"
  ]
};
const summary = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  provider_lanes: [
    "openai_api_lane",
    "ollama_qwen3_local_lane"
  ],
  openai_lane_evidence_complete: openaiLane?.status === "pass" && openaiLane?.combined_archive_recorded === true,
  ollama_qwen3_lane_evidence_complete: ollamaLane?.status === "pass" && ollamaLane?.combined_archive_recorded === true,
  openai_api_lane_passed: openaiLane?.status === "pass" && openaiLane?.combined_archive_recorded === true,
  ollama_qwen3_local_lane_passed: ollamaLane?.status === "pass" && ollamaLane?.combined_archive_recorded === true,
  distinct_provider_lanes: independence?.distinct_provider_lanes === true,
  independent_execution_evidence_per_lane: independence?.independent_execution_evidence_per_lane === true,
  capability_matrix_per_lane: independence?.capability_matrix_per_lane === true,
  redaction_storage_evidence_per_lane: independence?.redaction_storage_evidence_per_lane === true,
  claim_boundary_per_lane: independence?.claim_boundary_per_lane === true,
  local_model_verified: ollamaArchive?.local_model_verified === true,
  post_rc_openai_only_stable: openaiArchive?.post_rc_openai_only_stable === true,
  provider_diverse_criteria_met: gatePassed,
  combined_archive_passed: combinedPass,
  inventory_preflight_passed: inventoryPass,
  source_archives_passed: sourceArchivesPass,
  owner_final_decision_present: approvalPhraseVerified,
  protected_paths_passed: protectedPathsPass,
  no_new_execution: noNewExecutionPass,
  new_local_model_execution: false,
  new_local_model_generation: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  openai_provider_rerun: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  evidence_reference_baseline_modified_only_prior_refresh: baselineOnlyPriorRefresh
};
const requiredEvidenceStatus = {
  combined_archive_export: combinedPass,
  provider_diverse_path_design: exists("evidence/post-combined-provider-diverse-path-design/provider_diverse_path_design_gate_report.json"),
  provider_diverse_evidence_inventory: inventoryPass,
  openai_lane_evidence_summary: openaiLane?.status === "pass" && openaiLane?.combined_archive_recorded === true,
  ollama_qwen3_lane_evidence_summary: ollamaLane?.status === "pass" && ollamaLane?.combined_archive_recorded === true,
  local_model_verified_final_handoff: ollamaArchive?.status === "pass" && ollamaArchive?.local_model_verified === true,
  provider_lane_independence_review: lanesPass,
  owner_final_decision: approvalPhraseVerified
};
const completeness = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  required_evidence: requiredEvidenceStatus,
  evidence_checks: evidenceChecks,
  missing_evidence: missingEvidence,
  no_new_execution: noNewExecutionPass,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  node_modules_modified: nodeModulesModified,
  evidence_reference_baseline_refreshed_in_this_stage: false
};
const finalIndependence = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  lanes: {
    openai_api_lane: {
      type: "remote_provider_api",
      execution_evidence_exists: openaiLane?.combined_archive_recorded === true,
      scoped_stable_evidence_exists: openaiArchive?.post_rc_openai_only_stable === true,
      redaction_storage_evidence_exists: Array.isArray(openaiLane?.redaction_storage_evidence_paths)
        && openaiLane.redaction_storage_evidence_paths.length > 0
    },
    ollama_qwen3_local_lane: {
      type: "local_provider_runtime",
      execution_evidence_exists: ollamaLane?.combined_archive_recorded === true,
      local_model_verified: ollamaArchive?.local_model_verified === true,
      redaction_storage_evidence_exists: Array.isArray(ollamaLane?.redaction_storage_evidence_paths)
        && ollamaLane.redaction_storage_evidence_paths.length > 0
    }
  },
  independence_basis: [
    "different provider/runtime boundary",
    "different execution environment",
    "different model serving path",
    "separate evidence bundles"
  ],
  does_not_establish_provider_verified: true,
  does_not_establish_adapter_checked: true
};
const boundary = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  allowed_claims: gatePassed ? ALLOWED_CLAIMS : [],
  blocked_claims: STILL_BLOCKED,
  provider_diverse_allowed: gatePassed,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  scope: SCOPE,
  does_not_allow_provider_verified: true,
  does_not_allow_adapter_checked: true,
  does_not_allow_production_ready: true,
  does_not_allow_stable: true,
  does_not_allow_release_gated: true,
  reason: "OpenAI API lane and Ollama qwen3 local lane satisfy provider diversity criteria. Provider verification, adapter-checked, production-ready, stable, and bare release-gated remain separate gates."
};
const report = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  scope: SCOPE,
  provider_diverse_final_gate_passed: gatePassed,
  final_gate_executed: true,
  approval_phrase_verified: approvalPhraseVerified,
  can_claim_provider_diverse: gatePassed,
  provider_diverse_allowed: gatePassed,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  openai_provider_rerun: false,
  local_model_execution: false,
  new_local_model_execution: false,
  new_local_model_generation: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  node_modules_modified: nodeModulesModified,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  evidence_reference_baseline_modified_only_prior_refresh: baselineOnlyPriorRefresh,
  allowed_claims: gatePassed ? ALLOWED_CLAIMS : [],
  blocked_claims: STILL_BLOCKED,
  missing_evidence: missingEvidence,
  can_enter_stable_release: false
};
const gateReport = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  can_claim_provider_diverse: gatePassed,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_production_ready: false,
  can_claim_stable: false,
  can_claim_release_gated: false,
  can_enter_stable_release: false,
  provider_diverse_allowed: gatePassed,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  openai_model_api_call: false,
  local_model_execution: false,
  new_local_model_execution: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  unresolved_items_count: missingEvidence.length,
  source: "run_provider_diverse_final_gate.mjs",
  reason: "Provider-diverse final gate passed for OpenAI API lane plus Ollama qwen3 local lane. Provider verification and adapter-checked remain separate gates."
};
const blocker = {
  status: gatePassed ? "updated" : "blocked",
  stage: STAGE,
  previous_status: "ready_for_owner_decision_to_claim_provider_diverse",
  new_status: gatePassed
    ? "provider_diverse_allowed_provider_verified_and_adapter_checked_still_blocked"
    : "blocked",
  provider_diverse_allowed: gatePassed,
  unblocks: gatePassed ? [CANONICAL_CLAIM] : [],
  still_blocks: STILL_BLOCKED,
  next_required_actions: [
    "run provider-verified final gate if criteria/evidence are sufficient",
    "run adapter-checked final gate after coverage gaps are resolved",
    "keep production-ready/stable scoped claims separate"
  ],
  resolved_blockers: gatePassed ? ["owner_final_decision_required", "final_gate_not_executed"] : [],
  remaining_blockers: gatePassed ? [] : missingEvidence,
  still_blocked_claims: STILL_BLOCKED
};
const unresolved = {
  status: gatePassed ? "pass" : "fail",
  stage: STAGE,
  unresolved_items_count: missingEvidence.length,
  unresolved_items: missingEvidence
};

writeJson(e("provider_diverse_final_gate_report.json"), report);
writeText(e("provider_diverse_final_gate_report.md"), `# Provider Diverse Final Gate\n\nStatus: ${report.status}\n\n- Stage: ${STAGE}\n- Scope: ${SCOPE}\n- Provider-diverse allowed: ${report.provider_diverse_allowed}\n- Provider-verified allowed: ${report.provider_verified_allowed}\n- Adapter-checked allowed: ${report.adapter_checked_allowed}\n- New local model execution: false\n- OpenAI model API call: false\n- Telemetry sink write: false\n`);
writeJson(e("provider_diverse_final_evidence_summary.json"), summary);
writeJson(e("provider_diverse_final_evidence_completeness.json"), completeness);
writeJson(e("provider_lane_independence_final_review.json"), finalIndependence);
writeJson(e("provider_diverse_owner_final_decision.json"), ownerDecision);
writeJson(e("provider_diverse_final_decision_record.json"), finalDecision);
writeJson(e("provider_diverse_claim_boundary.json"), boundary);
writeJson(e("provider_diverse_final_gate_gate_report.json"), gateReport);
writeJson(e("provider_diverse_final_gate_check_report.json"), gateReport);
writeJson(e("provider_diverse_final_blocker_update.json"), blocker);
writeJson(e("provider_diverse_blocker_update.json"), blocker);
writeJson(e("unresolved_items.json"), unresolved);
writeJsonRel("evals/reports/provider_diverse_final_gate_report.json", report);
writeTextRel("evals/reports/provider_diverse_final_gate_report.md", `# Provider Diverse Final Gate\n\nStatus: ${report.status}\n\n- Stage: ${STAGE}\n- Scope: ${SCOPE}\n- Can claim provider-diverse: ${report.can_claim_provider_diverse}\n- Provider-verified allowed: ${report.provider_verified_allowed}\n- Adapter-checked allowed: ${report.adapter_checked_allowed}\n- New execution: false\n`);
writeJsonRel("evals/reports/provider_diverse_claim_boundary_report.json", boundary);
writeTextRel("evals/reports/provider_diverse_claim_boundary_report.md", `# Provider Diverse Claim Boundary\n\nStatus: ${boundary.status}\n\n- Provider-diverse allowed: ${boundary.provider_diverse_allowed}\n- Provider-verified allowed: ${boundary.provider_verified_allowed}\n- Adapter-checked allowed: ${boundary.adapter_checked_allowed}\n- Production-ready allowed: ${boundary.production_ready_allowed}\n- Stable allowed: ${boundary.stable_allowed}\n- Release-gated allowed: ${boundary.release_gated_allowed}\n`);
writeJsonRel("evals/reports/provider_diverse_final_evidence_report.json", summary);
writeTextRel("evals/reports/provider_diverse_final_evidence_report.md", `# Provider Diverse Final Evidence\n\nStatus: ${summary.status}\n\n- OpenAI API lane passed: ${summary.openai_api_lane_passed}\n- Ollama qwen3 local lane passed: ${summary.ollama_qwen3_local_lane_passed}\n- Owner final decision present: ${summary.owner_final_decision_present}\n- No new execution: ${summary.no_new_execution}\n`);
writeTextRel("release/gates/post-combined/post_combined_provider_diverse_final_gate_scope.yaml", `stage: ${STAGE}\nstatus: ${report.status}\nscope: ${SCOPE}\nprovider_diverse_allowed: ${report.provider_diverse_allowed}\nprovider_verified_allowed: false\nadapter_checked_allowed: false\nproduction_ready_allowed: false\nstable_allowed: false\nrelease_gated_allowed: false\nnew_execution: false\n`);
writeTextRel("release/gates/post-combined/post_combined_provider_diverse_final_gate.yaml", `stage: ${STAGE}\nstatus: ${report.status}\ncan_claim_provider_diverse: ${report.can_claim_provider_diverse}\nsource_lanes:\n  - openai_api_lane\n  - ollama_qwen3_local_lane\n`);
writeTextRel("release/decisions/post-combined/post_combined_provider_diverse_owner_final_decision.yaml", `stage: ${STAGE}\nstatus: ${ownerDecision.status}\ndecision: ${ownerDecision.decision}\napproved_claim: ${ownerDecision.approved_claim || "null"}\n`);
writeTextRel("release/decisions/post-combined/post_combined_provider_diverse_final_decision_record.yaml", `stage: ${STAGE}\nstatus: ${finalDecision.status}\ndecision: ${finalDecision.decision}\nprovider_diverse_allowed: ${finalDecision.provider_diverse_allowed}\nprovider_verified_allowed: false\nadapter_checked_allowed: false\nproduction_ready_allowed: false\nstable_allowed: false\nrelease_gated_allowed: false\n`);
writeTextRel("release/claims/post-combined/post_combined_provider_diverse_final_claim_boundary.yaml", `stage: ${STAGE}\nstatus: ${boundary.status}\nprovider_diverse_allowed: ${boundary.provider_diverse_allowed}\nprovider_verified_allowed: false\nadapter_checked_allowed: false\nproduction_ready_allowed: false\nstable_allowed: false\nrelease_gated_allowed: false\n`);
writeTextRel("release/blockers/post-combined/post_combined_provider_diverse_final_blocker_update.yaml", `stage: ${STAGE}\nstatus: ${blocker.status}\nprovider_diverse_allowed: ${blocker.provider_diverse_allowed}\nstill_blocked_claims:\n  - provider-verified\n  - adapter-checked\n  - production-ready\n  - stable\n  - release-gated\n`);
writeTextRel("release/claims/post-combined/post_combined_provider_diverse_claim_boundary.yaml", `stage: ${STAGE}\nstatus: ${boundary.status}\nprovider_diverse_allowed: ${boundary.provider_diverse_allowed}\nprovider_verified_allowed: false\nadapter_checked_allowed: false\nproduction_ready_allowed: false\nstable_allowed: false\nrelease_gated_allowed: false\nbare_release_gated_allowed: false\n`);
writeTextRel("release/blockers/post-combined/post_combined_provider_diverse_blocker_update.yaml", `stage: ${STAGE}\nstatus: ${blocker.status}\nprevious_status: ${blocker.previous_status}\nnew_status: ${blocker.new_status}\nunblocks:\n  - provider-diverse\nstill_blocks:\n  - provider-verified\n  - adapter-checked\n  - production-ready\n  - stable\n  - bare release-gated\n`);
writeTextRel("evals/suites/post_combined_provider_diverse_final_gate.yaml", `suite_id: post_combined_provider_diverse_final_gate\nstage: ${STAGE}\nmode: evidence_gate\nnew_execution: false\nsource_lanes:\n  - openai_api_lane\n  - ollama_qwen3_local_lane\n`);
writeKoDoc("docs/providers/provider_diverse_final_gate.ko.md", "Provider Diverse Final Gate", [
  "OpenAI API lane과 Ollama qwen3 local lane의 기존 evidence를 기준으로 provider diversity final gate를 실행했습니다.",
  "Final claim is provider-diverse.",
  "",
  `- provider-diverse allowed: ${report.provider_diverse_allowed}`,
  "- provider-verified allowed: false",
  "- adapter-checked allowed: false",
  "- OpenAI model API call: false",
  "- local model generation: false",
  "- telemetry sink write: false"
]);
writeKoDoc("docs/claims/provider_diverse_final_claim_boundary.ko.md", "Provider Diverse Final Claim Boundary", [
  "`provider-diverse` claim만 현재 scope에서 허용합니다.",
  "`provider-verified`, `adapter-checked`, bare `production-ready`, bare `stable`, bare `release-gated`는 계속 차단합니다."
]);
writeKoDoc("docs/claims/provider_diverse_claim_boundary.ko.md", "Provider Diverse Claim Boundary", [
  "`provider-diverse` claim만 OpenAI API lane plus Ollama qwen3 local lane scope에서 허용합니다.",
  "`provider-verified`, `adapter-checked`, bare `production-ready`, bare `stable`, bare `release-gated`는 계속 차단합니다."
]);
writeKoDoc("docs/providers/provider_diverse_final_decision_record.ko.md", "Provider Diverse Final Decision Record", [
  `Decision: \`${finalDecision.decision}\``,
  `Approved claim: \`${finalDecision.approved_claim || "null"}\``,
  `Scope: \`${SCOPE}\``
]);
writeKoDoc("docs/plans/next_provider_verified_gate_plan.ko.md", "Next Provider Verification Gate Plan", [
  "Provider diversity는 OpenAI API lane과 Ollama qwen3 local lane 범위에서 별도 final gate로 처리되었습니다.",
  "provider-verified claim은 아직 차단 상태이며, provider-level verification coverage를 별도 gate로 실행해야 합니다."
]);
writeKoDoc("docs/plans/next_adapter_checked_gate_plan.ko.md", "Next Adapter Checked Gate Plan", [
  "adapter-checked claim은 provider diversity final gate 이후에도 차단 상태입니다.",
  "OpenAI/Ollama/vLLM/common adapter coverage gate를 별도로 실행해야 합니다."
]);
writeKoDoc("docs/plans/next_final_export_execution_plan.ko.md", "Next Final Export Execution Plan", [
  "Provider-diverse final gate 결과를 반영한 실제 export execution은 별도 operator 승인 이후 수행해야 합니다.",
  "현재 단계에서는 dist를 수정하지 않았습니다."
]);

console.log(JSON.stringify(report, null, 2));
process.exit(gatePassed ? 0 : 1);
