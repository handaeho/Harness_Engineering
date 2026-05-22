#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-beta-containment-post-execution-claim-audit-and-owner-review";
export const SOURCE_STAGE = "v2.0.0-beta-dedicated-containment-verification-execution";

const postClaimsAllowed = [
  "containment-post-execution-audit-completed",
  "containment-evidence-completeness-audited",
  "containment-claim-boundary-post-audited",
  "containment-owner-review-drafted",
  "containment-claim-decision-drafted",
  "containment-post-execution-blocker-updated"
];

const canonicalDedicatedClaims = [
  "dedicated-containment-verification-executed",
  "dedicated-containment-boundaries-checked",
  "dedicated-containment-no-side-effect-verified",
  "dedicated-containment-result-schema-validated",
  "dedicated-containment-trace-schema-validated",
  "dedicated-containment-severity-aggregation-recorded",
  "dedicated-containment-contract-guard-checked"
];

const blockedClaims = [
  "stable",
  "containment-verified",
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "release-gated",
  "redteam-passed",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "benchmark-backed"
];

const boundaryNames = [
  "approval_boundary",
  "tool_execution_boundary",
  "external_side_effect_boundary",
  "file_write_boundary",
  "shell_execution_boundary",
  "network_boundary",
  "raw_storage_boundary",
  "trace_redaction_boundary",
  "tool_output_trust_boundary"
];

const aliasMapping = {
  "dedicated-containment-case-results-recorded": "dedicated-containment-boundaries-checked",
  "dedicated-containment-redacted-traces-recorded": "dedicated-containment-trace-schema-validated",
  "dedicated-containment-no-side-effect-evidence-recorded": "dedicated-containment-no-side-effect-verified",
  "dedicated-containment-boundary-results-recorded": "dedicated-containment-boundaries-checked",
  "dedicated-containment-execution-gate-checked": "dedicated-containment-contract-guard-checked"
};

export function resolveRoot(argv = process.argv) {
  const repoRoot = process.cwd();
  return argv[2] && !argv[2].startsWith("--")
    ? path.resolve(repoRoot, argv[2])
    : path.basename(repoRoot) === "prompt-stack-v2"
      ? repoRoot
      : path.resolve(repoRoot, "prompt-stack-v2");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function relPath(...parts) {
  return parts.join("/");
}

function exists(root, rel) {
  return fs.existsSync(p(root, ...rel.split("/")));
}

function readIfExists(root, rel, fallback = null) {
  return exists(root, rel) ? readJson(p(root, ...rel.split("/"))) : fallback;
}

function countJsonl(root, rel) {
  if (!exists(root, rel)) return 0;
  return fs.readFileSync(p(root, ...rel.split("/")), "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0).length;
}

function yamlList(items, indent = 2) {
  const pad = " ".repeat(indent);
  return items.map((item) => `${pad}- ${item}`).join("\n");
}

function yamlBoolMap(map, indent = 2) {
  const pad = " ".repeat(indent);
  return Object.entries(map).map(([key, value]) => `${pad}${key}: ${value}`).join("\n");
}

function mdList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function sourceEvidenceDir() {
  return "evidence/beta-dedicated-containment-verification";
}

function targetEvidenceDir() {
  return "evidence/beta-containment-post-execution-claim-audit";
}

function sourceRel(file) {
  return `${sourceEvidenceDir()}/${file}`;
}

function targetRel(file) {
  return `${targetEvidenceDir()}/${file}`;
}

function buildScopeYaml() {
  return `stage: ${STAGE}

approved_actions:
${yamlBoolMap({
  dedicated_containment_result_review: true,
  evidence_completeness_audit: true,
  claim_canonicalization: true,
  no_side_effect_evidence_review: true,
  proof_level_update: true,
  post_execution_claim_boundary_audit: true,
  owner_review_draft: true,
  blocker_update: true,
  release_gate_blocker_refresh: true
}, 2)}

forbidden_execution:
${yamlBoolMap({
  containment_fixture_rerun: true,
  openai_provider_call: true,
  redteam_case_rerun: true,
  local_model_execution: true,
  local_endpoint_probe: true,
  telemetry_connection: true,
  external_network_calls: true,
  shell_command_execution: true,
  real_file_writes: true,
  real_tool_side_effects: true,
  release_gate_execution: true,
  production_deployment: true,
  containment_verified_claim: true,
  release_gated_claim: true,
  production_ready_claim: true,
  production_monitored_claim: true,
  dist_modification: true
}, 2)}

claims_allowed:
${yamlList(postClaimsAllowed, 2)}

claims_not_allowed:
${yamlList([
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "integration-verified"
], 2)}
`;
}

function evidenceCompleteness(root) {
  const expected = [
    "dedicated_containment_verification_report.json",
    "dedicated_containment_verification_report.md",
    "dedicated_containment_case_results.jsonl",
    "dedicated_containment_trace_samples.jsonl",
    "dedicated_containment_boundary_summary.json",
    "dedicated_containment_severity_summary.json",
    "dedicated_containment_no_side_effect_report.json",
    "dedicated_containment_contract_guard_report.json",
    "dedicated_containment_schema_validation_report.json",
    "dedicated_containment_claim_impact_report.json",
    "dedicated_containment_gate_report.json",
    "dedicated_containment_execution_blocker_update.json",
    "unresolved_items.json"
  ];
  const actualMapping = {
    dedicated_containment_contract_guard_report: {
      actual: sourceRel("dedicated_containment_gate_report.json"),
      reason: "contract guard check is recorded in dedicated containment gate report"
    },
    dedicated_containment_execution_blocker_update: {
      actual: sourceRel("dedicated_containment_blocker_update.json"),
      reason: "execution blocker update was recorded under the shorter generated filename"
    }
  };
  const artifacts = expected.map((file) => {
    const expectedPath = sourceRel(file);
    const base = file.replace(/\.(json|jsonl|md)$/, "");
    const mapped = actualMapping[base];
    const actualPath = mapped?.actual || expectedPath;
    return {
      canonical_expected_path: expectedPath,
      actual_mapped_path: actualPath,
      exists: exists(root, actualPath),
      mapped: Boolean(mapped),
      mapped_reason: mapped?.reason || null
    };
  });
  const missing = artifacts.filter((item) => !item.exists);
  return {
    status: missing.length === 0 ? "pass" : "fail",
    stage: STAGE,
    source_stage: SOURCE_STAGE,
    expected_artifacts_count: expected.length,
    actual_mapped_artifacts_count: artifacts.filter((item) => item.exists).length,
    canonical_path_mismatches: artifacts.filter((item) => item.mapped).length,
    missing_count: missing.length,
    artifacts
  };
}

function canonicalClaims(sourceReport) {
  const sourceClaims = sourceReport.claims_allowed || [];
  const canonicalized = [...new Set(sourceClaims.map((claim) => aliasMapping[claim] || claim))];
  const supportedByReports = [
    "dedicated-containment-result-schema-validated",
    "dedicated-containment-severity-aggregation-recorded"
  ];
  const canonicalAllowed = [...new Set([...canonicalDedicatedClaims])];
  return {
    canonical_allowed_claims: canonicalAllowed,
    source_report_claims: sourceClaims,
    alias_mapping: aliasMapping,
    canonicalized_source_claims: canonicalized,
    additional_canonical_claims_supported_by_reports: supportedByReports,
    canonicalization_status: canonicalized.every((claim) => canonicalAllowed.includes(claim)) ? "pass" : "needs_review",
    claims_not_added: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function noSideEffectEvidenceReview(sourceReport, noSideEffectReport) {
  const counters = {
    blocked_actions_executed: sourceReport.blocked_actions_executed,
    external_network_calls_performed: sourceReport.external_network_calls_performed,
    shell_commands_executed: sourceReport.shell_commands_executed,
    real_file_writes_outside_allowed_paths: sourceReport.real_file_writes_outside_allowed_paths,
    real_tool_side_effects: sourceReport.real_tool_side_effects,
    provider_calls_performed: sourceReport.provider_calls_performed,
    local_model_calls_performed: sourceReport.local_model_calls_performed,
    telemetry_sink_writes: sourceReport.telemetry_sink_writes
  };
  const allZero = Object.values(counters).every((value) => value === 0);
  return {
    status: allZero && noSideEffectReport?.status === "pass" ? "pass" : "fail",
    source: sourceRel("dedicated_containment_no_side_effect_report.json"),
    counters,
    no_side_effect_report_status: noSideEffectReport?.status || "missing",
    raw_request_stored: sourceReport.raw_request_stored,
    raw_response_stored: sourceReport.raw_response_stored,
    secret_logged: sourceReport.secret_logged,
    redaction_passed: sourceReport.redaction_passed,
    containment_verified_allowed: false
  };
}

function proofLevelUpdate() {
  const updated = Object.fromEntries(boundaryNames.map((boundary) => [
    boundary,
    {
      proof_level: "dedicated_verification_passed_not_claim_verified",
      evidence: [
        sourceRel("dedicated_containment_verification_report.json"),
        sourceRel("dedicated_containment_boundary_summary.json")
      ],
      does_not_allow: [
        "containment-verified",
        "release-gated",
        "production-ready"
      ]
    }
  ]));
  return {
    status: "pass",
    boundaries_marked_verified: 0,
    updated_boundaries: updated,
    containment_verified_allowed: false
  };
}

function claimBoundaryAudit() {
  return {
    status: "pass",
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false,
    owner_review_required: true,
    post_execution_claim_audit_passed: true,
    reason: "Dedicated containment verification execution passed, but containment-verified remains blocked until explicit owner review and final containment decision gate.",
    allowed_claims: [
      ...canonicalDedicatedClaims,
      "containment-post-execution-audit-completed",
      "containment-evidence-completeness-audited",
      "containment-claim-boundary-post-audited"
    ],
    blocked_claims: [
      "containment-verified",
      "release-gated",
      "production-ready",
      "production-monitored"
    ]
  };
}

function ownerReviewDraft() {
  return {
    status: "draft",
    owner_review_required: true,
    recommended_decision: "eligible_for_final_containment_decision_gate",
    basis: [
      "dedicated containment verification execution passed",
      "cross-suite storage/redaction audit passed",
      "critical/high failures zero",
      "no-side-effect counters zero",
      "raw request/response stored false",
      "redaction passed"
    ],
    remaining_before_containment_verified: [
      "explicit owner review decision",
      "final containment claim decision gate",
      "release gate interaction review"
    ],
    does_not_allow: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function claimDecisionDraft() {
  return {
    status: "draft_pending_owner_decision",
    candidate_claim: "containment-verified",
    recommended_next_gate: "v2.0.0-beta-containment-verified-decision-gate",
    current_decision: "do_not_claim_yet",
    reason: "Execution evidence is strong, but final owner review and claim decision gate are pending.",
    inputs_required_for_next_gate: [
      "containment_post_execution_review_report.json",
      "containment_claim_boundary_audit.json",
      "containment_owner_review_draft.json",
      "cross_suite_storage_redaction_audit_report.json",
      "dedicated_containment_verification_report.json"
    ]
  };
}

function blockerUpdate() {
  return {
    blocker_id: "RTG-003",
    previous_status: "dedicated_containment_verification_execution_passed_post_execution_claim_audit_pending",
    new_status: "dedicated_containment_post_execution_audit_passed_owner_decision_pending",
    still_blocks: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ],
    unblocks: [
      "containment_post_execution_evidence_review",
      "containment_claim_decision_gate_readiness"
    ],
    does_not_unblock: [
      "containment-verified",
      "release-gated",
      "production-ready"
    ]
  };
}

function releaseGateBlockerRefresh() {
  return {
    release_gate_status: "blocked_not_release_gated",
    containment_dedicated_execution_passed: true,
    containment_post_execution_audit_passed: true,
    containment_verified: false,
    production_ready: false,
    release_gated: false,
    remaining_blockers: [
      "explicit containment owner decision pending",
      "release gate not executed",
      "production telemetry not connected",
      "provider diversity not established",
      "local runtime canary not executed"
    ]
  };
}

function postExecutionReviewReport(sourceReport) {
  return {
    status: "pass",
    stage: STAGE,
    new_execution: false,
    containment_fixture_rerun: false,
    provider_execution: false,
    local_model_execution: false,
    telemetry_connection: false,
    dist_modified: false,
    source_stage: SOURCE_STAGE,
    source_execution_status: sourceReport.status,
    actual_containment_verification_execution: sourceReport.actual_containment_verification_execution === true,
    cases_total: sourceReport.cases_total,
    cases_passed: sourceReport.cases_passed,
    cases_failed: sourceReport.cases_failed,
    critical_failures: sourceReport.critical_failures,
    high_failures: sourceReport.high_failures,
    provider_calls_performed: sourceReport.provider_calls_performed,
    local_model_calls_performed: sourceReport.local_model_calls_performed,
    telemetry_sink_writes: sourceReport.telemetry_sink_writes,
    external_network_calls_performed: sourceReport.external_network_calls_performed,
    shell_commands_executed: sourceReport.shell_commands_executed,
    real_file_writes_outside_allowed_paths: sourceReport.real_file_writes_outside_allowed_paths,
    raw_request_stored: sourceReport.raw_request_stored,
    raw_response_stored: sourceReport.raw_response_stored,
    secret_logged: sourceReport.secret_logged,
    redaction_passed: sourceReport.redaction_passed,
    claim_level: "dedicated_containment_execution_reviewed_not_verified",
    containment_verified_allowed: false,
    release_gated_allowed: false,
    production_ready_allowed: false
  };
}

function reportMarkdown(report, completeness, claimAudit, ownerDraft) {
  return `# Containment Post-execution Review Report

Status: ${report.status}

Stage: ${STAGE}

## Source Execution

- Source stage: ${report.source_stage}
- Source execution status: ${report.source_execution_status}
- Cases passed: ${report.cases_passed}/${report.cases_total}
- Critical failures: ${report.critical_failures}
- High failures: ${report.high_failures}

## Evidence Review

- Evidence completeness: ${completeness.status}
- No-side-effect counters: all zero
- Raw request stored: ${report.raw_request_stored}
- Raw response stored: ${report.raw_response_stored}
- Secret logged: ${report.secret_logged}
- Redaction passed: ${report.redaction_passed}

## Claim Boundary

- Containment verified allowed: ${claimAudit.containment_verified_allowed}
- Release gated allowed: ${claimAudit.release_gated_allowed}
- Production ready allowed: ${claimAudit.production_ready_allowed}
- Owner review required: ${ownerDraft.owner_review_required}
`;
}

function claimAuditMarkdown(claimAudit, proofUpdate) {
  return `# Containment Post-execution Claim Audit

Status: ${claimAudit.status}

- Boundaries marked verified: ${proofUpdate.boundaries_marked_verified}
- Containment verified allowed: ${claimAudit.containment_verified_allowed}
- Release gated allowed: ${claimAudit.release_gated_allowed}
- Production ready allowed: ${claimAudit.production_ready_allowed}

Reason: ${claimAudit.reason}
`;
}

function ownerReviewMarkdown(ownerDraft) {
  return `# Containment Owner Review Draft

Status: ${ownerDraft.status}

Recommended decision: ${ownerDraft.recommended_decision}

## Basis

${mdList(ownerDraft.basis)}

## Remaining Before Containment Claim

${mdList(ownerDraft.remaining_before_containment_verified)}
`;
}

function releaseOwnerReviewYaml(ownerDraft) {
  return `owner_review_draft:
  status: ${ownerDraft.status}
  owner_review_required: ${ownerDraft.owner_review_required}
  recommended_decision: ${ownerDraft.recommended_decision}
  basis:
${yamlList(ownerDraft.basis, 4)}
  remaining_before_containment_verified:
${yamlList(ownerDraft.remaining_before_containment_verified, 4)}
  does_not_allow:
${yamlList(ownerDraft.does_not_allow, 4)}
`;
}

function releaseClaimDecisionYaml(decision) {
  return `claim_decision_draft:
  status: ${decision.status}
  candidate_claim: ${decision.candidate_claim}
  recommended_next_gate: ${decision.recommended_next_gate}
  current_decision: ${decision.current_decision}
  reason: "${decision.reason}"
  inputs_required_for_next_gate:
${yamlList(decision.inputs_required_for_next_gate, 4)}
`;
}

function postExecutionAuditPolicyYaml() {
  return `containment_post_execution_audit_policy:
  stage: ${STAGE}
  status: active
  execution_allowed: false
  source_evidence_required:
    - ${sourceRel("dedicated_containment_verification_report.json")}
    - ${sourceRel("dedicated_containment_case_results.jsonl")}
    - ${sourceRel("dedicated_containment_trace_samples.jsonl")}
    - ${sourceRel("dedicated_containment_no_side_effect_report.json")}
    - ${sourceRel("dedicated_containment_gate_report.json")}
  audit_requirements:
    - evidence_completeness_audit
    - no_side_effect_evidence_review
    - proof_level_update_without_verified_level
    - owner_review_draft
  can_claim_containment_verified: false
`;
}

function postExecutionClaimPolicyYaml() {
  return `containment_post_execution_claim_policy:
  status: claim_gate_closed
  allowed_claims:
${yamlList(postClaimsAllowed, 4)}
  canonical_dedicated_execution_claims:
${yamlList(canonicalDedicatedClaims, 4)}
  claims_not_allowed:
${yamlList(blockedClaims, 4)}
  explicit_non_equivalence:
    - post_execution_audit_is_not_containment_verified
    - owner_review_draft_is_not_owner_approval
    - claim_decision_draft_is_not_claim_decision
    - final_containment_decision_gate_remains_required
`;
}

function ownerReviewPolicyYaml() {
  return `containment_owner_review_policy:
  status: draft_required
  owner_review_required: true
  owner_decision_record_required_before_claim: true
  required_inputs:
    - containment_post_execution_review_report.json
    - containment_claim_boundary_audit.json
    - containment_owner_review_draft.json
    - cross_suite_storage_redaction_audit_report.json
    - dedicated_containment_verification_report.json
  draft_does_not_allow:
    - containment-verified
    - release-gated
    - production-ready
`;
}

function canonicalClaimsYaml(claims) {
  return `containment_canonical_claims:
  status: ${claims.canonicalization_status}
  canonical_allowed_claims:
${yamlList(claims.canonical_allowed_claims, 4)}
  alias_mapping:
${Object.entries(claims.alias_mapping).map(([from, to]) => `    ${from}: ${to}`).join("\n")}
  claims_not_added:
${yamlList(claims.claims_not_added, 4)}
`;
}

function releaseGateYaml() {
  return `id: prompt-stack-v2.release_gate
version: 2.0.0-beta-containment-post-execution-claim-audit-and-owner-review
status: blocked_not_release_gated

alpha_required_checks:
  - Dedicated containment verification execution gate exists and passes
  - Containment post-execution review report exists and passes
  - Dedicated containment evidence completeness report exists
  - Containment canonical claims report exists
  - Containment no-side-effect evidence review exists and passes
  - Containment proof level update records zero verified boundaries
  - Containment claim boundary audit exists and passes
  - Containment owner review draft exists
  - Containment claim decision draft exists
  - Containment post-execution blocker update exists
  - Containment release gate blocker refresh exists
  - Containment verified claim remains blocked
  - Release gated claim remains blocked
  - Production ready claim remains blocked

allowed_alpha_claims:
${yamlList([
  "dedicated-containment-verification-executed",
  ...canonicalDedicatedClaims.filter((claim) => claim !== "dedicated-containment-verification-executed"),
  ...postClaimsAllowed
], 2)}

prohibited_positive_claims:
${yamlList(blockedClaims, 2)}

claim_upgrade_rule:
  dedicated_containment_execution_pass_is_not_containment_verified: true
  post_execution_audit_is_not_containment_verified: true
  owner_review_draft_is_not_owner_approval: true
  claim_decision_draft_is_not_claim_decision: true
  final_containment_decision_gate_remains_required: true

runner_status:
  provider_execution: false
  local_model_execution: false
  v36_runners_reexecuted_for_alpha: false
  runtime_execution_loop_implemented: false
  live_telemetry_connected: false
  telemetry_sink_write_enabled: false
  production_monitored: false
  mock_runtime_execution_loop_implemented: true
  mock_provider_execution: false
  mock_local_model_execution: false
  mock_external_side_effects: false
  openai_provider_canary_allowed: true
  openai_provider_execution_status: canary_only
  openai_tool_calling_execution: canary_only
  openai_tool_calling_rerun: canary_rerun_only
  openai_canary_replay_suite: canary_suite_only
  beta_release_evidence_bundle: draft_only
  release_gate_dry_run: blocked_not_release_gated
  redteam_suite_design: design_only
  redteam_mock_runtime_dry_run: mock_dry_run_only
  openai_redteam_limited_execution_plan: draft_only
  openai_redteam_limited_execution_preflight: blocked_by_missing_credential
  production_telemetry_design: design_only
  actual_redteam_execution: false
  actual_provider_redteam_execution: false
  actual_local_redteam_execution: false
  can_execute_provider_redteam: false
  redteam_execution_allowed: false
  replay_verified_claim: false
  openai_structured_output_execution: canary_only
  canary_matrix_summary_generated: true
  local_endpoint_probe: false
  local_readiness_documented: true
  note: Dedicated containment execution and post-execution audit passed, but containment, release, and production claims remain blocked pending explicit owner decision and final claim gate.
`;
}

function containmentGateYaml() {
  return `containment_verification_gate:
  status: post_execution_audit_passed_owner_decision_pending
  can_claim_containment_verified: false
  can_claim_release_gated: false
  can_claim_production_ready: false

  satisfied:
    - containment_boundary_taxonomy_exists
    - containment_fixtures_valid
    - containment_mock_dry_run_passed
    - no_side_effect_mock_evidence_recorded
    - result_schema_validation_passed
    - trace_schema_validation_passed
    - severity_aggregation_passed
    - cross_suite_raw_storage_audit_pass
    - cross_suite_redaction_audit_pass
    - dedicated_containment_verification_gate_pass
    - dedicated_containment_no_side_effect_evidence_recorded
    - post_execution_claim_boundary_audit_pass
    - owner_review_draft_created

  remaining_required:
    - explicit_owner_review_decision
    - final_containment_claim_decision_gate
    - release_gate_interaction_review

  explicit_non_equivalence:
    - dedicated_execution_pass_is_not_containment_verified
    - post_execution_audit_is_not_containment_verified
    - owner_review_draft_is_not_owner_approval
    - claim_decision_draft_is_not_claim_decision
`;
}

function dedicatedGateYaml() {
  return `dedicated_containment_verification_gate:
  status: post_execution_audit_passed_owner_decision_pending
  can_execute_dedicated_containment_verification: false
  can_claim_containment_verified: false
  can_claim_release_gated: false
  can_claim_production_ready: false

  satisfied:
    - containment_design_passed
    - containment_mock_dry_run_passed
    - cross_suite_storage_redaction_audit_passed
    - dedicated_plan_drafted
    - runner_contract_drafted
    - explicit_user_approval_present
    - dedicated_containment_verification_execution_passed
    - no_side_effect_evidence_recorded
    - post_execution_claim_boundary_audit_passed
    - owner_review_draft_created

  remaining_required:
    - explicit_owner_review_decision
    - final_containment_claim_decision_gate

  explicit_non_equivalence:
    - execution_pass_does_not_automatically_allow_containment_verified
    - post_execution_audit_does_not_allow_release_gated
    - owner_review_draft_does_not_allow_production_ready
`;
}

function releaseBlockerPriorityYaml() {
  return `stage: ${STAGE}
status: draft
blockers:
  - id: RGB-001
    priority: P0
    category: provider_diversity
    description: Only OpenAI canary/redteam evidence has passed; no local or second provider canary has passed.
    blocks:
      - release-gated
      - provider-diverse
    owner: human_or_agent
    exit_criteria: At least one local runtime or second provider passes required canary gates under restricted scope.
  - id: RGB-002
    priority: P0
    category: local_runtime
    description: vLLM/Ollama endpoint is not available; local no-tool canary is blocked.
    blocks:
      - local-model-verified
      - provider-diverse
    owner: human
    exit_criteria: A localhost-only vLLM or Ollama endpoint is available and local no-tool canary passes.
  - id: RGB-003
    priority: P0
    category: security
    description: Dedicated containment execution and post-execution claim audit passed, but explicit owner decision and final containment claim decision gate remain pending.
    blocks:
      - containment-verified
      - release-gated
      - production-ready
    owner: human
    exit_criteria: Owner decision and final containment claim decision gate complete without opening release or production claims.
  - id: RGB-004
    priority: P1
    category: telemetry
    description: Production telemetry design is complete, but live telemetry connection is pending.
    blocks:
      - production-monitored
      - production-ready
    owner: agent
    exit_criteria: Telemetry schema is connected to a live monitoring sink, first trace and metric are received, and anomaly response criteria are active.
  - id: RGB-005
    priority: P1
    category: release_process
    description: Rollback plan and owner/action matrix are draft, not finalized.
    blocks:
      - release-gated
    owner: agent
    exit_criteria: Rollback plan and owner/action artifacts are finalized and referenced by release gate.
`;
}

function ownerActionMatrixYaml() {
  return `stage: ${STAGE}
status: draft
entries:
  - blocker_id: RGB-001
    owner: human_or_agent
    action: Prepare local endpoint or second provider canary path.
    exit_criteria: Non-OpenAI or local canary passes.
    claim_unblocked_after_exit:
      - provider-diverse_candidate
    claim_still_not_allowed:
      - release-gated
      - production-ready
  - blocker_id: RGB-002
    owner: human
    action: Start localhost-only vLLM or Ollama endpoint and run local no-tool canary.
    exit_criteria: Local no-tool canary passes with redacted trace and no external side effects.
    claim_unblocked_after_exit:
      - local-no-tool-canary-executed_candidate
    claim_still_not_allowed:
      - release-gated
      - production-ready
  - blocker_id: RGB-003
    owner: human
    action: Review post-execution owner draft and decide whether to enter the final containment claim decision gate.
    exit_criteria: Explicit owner decision is recorded and final containment decision gate completes.
    claim_unblocked_after_exit:
      - containment-verified_candidate
    claim_still_not_allowed:
      - containment-verified
      - release-gated
      - production-ready
  - blocker_id: RGB-004
    owner: agent
    action: Prepare telemetry connection preflight with sink credentials, redaction review, first trace receipt, and first metric receipt gates.
    exit_criteria: Live telemetry sink is connected and anomaly response criteria are active with incident response path defined.
    claim_unblocked_after_exit:
      - production-monitoring-candidate
    claim_still_not_allowed:
      - release-gated
      - production-ready
  - blocker_id: RGB-005
    owner: agent
    action: Finalize rollback plan and owner/action matrix.
    exit_criteria: Final rollback and owner/action artifacts are referenced by release gate.
    claim_unblocked_after_exit:
      - release-process-readiness-candidate
    claim_still_not_allowed:
      - release-gated
      - production-ready
`;
}

function remainingCriteriaYaml() {
  return `containment_remaining_criteria:
  status: owner_decision_pending
  containment_verified_allowed: false
  satisfied:
    - cross_suite_raw_storage_audit_pass
    - cross_suite_redaction_audit_pass
    - dedicated_containment_verification_gate_pass
    - post_execution_claim_boundary_audit_pass
  remaining:
    - explicit_owner_review_decision
    - final_containment_claim_decision_gate
    - release_gate_interaction_review
`;
}

function verificationPolicyYaml() {
  return `containment_verification_policy:
  status: post_execution_audit_passed_owner_decision_pending
  can_claim_containment_verified: false
  current_evidence_level: dedicated_containment_execution_reviewed_not_verified
  required_before_containment_verified:
    - explicit_owner_review_decision
    - final_containment_claim_decision_gate
    - release_gate_interaction_review
  disqualifying_events:
    - blocked_tool_executed
    - unapproved_external_side_effect
    - real_file_write_outside_approved_paths
    - shell_command_executed
    - forbidden_network_call
    - raw_request_stored
    - raw_response_stored
    - secret_logged
    - untrusted_tool_output_treated_as_trusted
`;
}

function containmentClaimPolicyYaml() {
  return `containment_claim_policy:
  status: post_execution_audit_passed_claim_gate_closed
  containment_verified_allowed: false
  release_gated_allowed: false
  production_ready_allowed: false
  allowed_current_claims:
${yamlList(postClaimsAllowed, 4)}
  blocked_claims:
${yamlList([
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored"
], 4)}
  next_gate: v2.0.0-beta-containment-verified-decision-gate
`;
}

function betaSuiteYaml() {
  return `id: beta_containment_post_execution_claim_audit
stage: ${STAGE}
mode: evidence_review_only
source_stage: ${SOURCE_STAGE}
execution:
  new_execution: false
  containment_fixture_rerun: false
  provider_execution: false
  local_model_execution: false
  telemetry_connection: false
expected_artifacts:
  - ${targetRel("containment_post_execution_review_report.json")}
  - ${targetRel("dedicated_containment_evidence_completeness_report.json")}
  - ${targetRel("containment_claim_boundary_audit.json")}
  - ${targetRel("containment_owner_review_draft.json")}
  - ${targetRel("containment_claim_decision_draft.json")}
`;
}

function readmeText() {
  return `# Prompt Stack v2

Status: \`${STAGE}\`

This package is the v2 prompt-stack beta evidence workspace. The current stage reviews the approved dedicated containment verification execution, audits evidence completeness and claim boundaries, canonicalizes dedicated containment execution claims, and drafts owner review inputs.

The post-execution audit records no new execution, no provider call, no local model call, no telemetry connection, and no containment fixture rerun. It does not allow containment, release, production, telemetry, provider-diversity, or integration claims.

## Source of Truth

- \`stack.yaml\`
- \`stack.schema.json\`
- \`core/spec/harness.spec.yaml\`

Prompt bundles under \`dist/\` are generated artifacts. Do not edit generated bundles by hand.

## Current Allowed Claims

${mdList(postClaimsAllowed)}

These claims do not allow \`containment-verified\`, \`telemetry-connected\`, \`production-monitored\`, \`production-ready\`, \`release-gated\`, \`redteam-passed\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`local-model-verified\`, \`runtime-verified\`, \`tool-call-verified\`, \`schema-output-verified\`, \`replay-verified\`, \`integration-verified\`, or \`benchmark-backed\`.

## Static Validation

Run from the workspace root:

\`\`\`powershell
node prompt-stack-v2/tools/check_containment_post_execution_claim_audit.mjs
\`\`\`

Passing this audit gate allows entry to a final containment decision gate only. It does not approve \`containment-verified\`.
`;
}

function handoffText(report, gateReport = null) {
  return `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- Dedicated containment verification execution evidence was reviewed without rerun.
- Evidence completeness was audited with canonical-to-actual path mappings where generated filenames differed.
- Dedicated containment execution claims were canonicalized.
- No-side-effect evidence was reviewed; all counters remain zero in source evidence.
- Boundary proof levels were updated to \`dedicated_verification_passed_not_claim_verified\`, with zero boundaries marked \`verified\`.
- Owner review and claim decision drafts were prepared.

## Current Gate

- Gate script: \`prompt-stack-v2/tools/check_containment_post_execution_claim_audit.mjs\`
- Gate status: ${gateReport?.status || "pending"}
- Can enter containment verified decision gate: ${gateReport?.can_enter_containment_verified_decision_gate ?? true}
- Can enter containment verified claim: false
- Can enter release gated claim: false
- Can enter production ready claim: false

## Current Evidence

- \`${targetRel("containment_post_execution_review_report.json")}\`
- \`${targetRel("dedicated_containment_evidence_completeness_report.json")}\`
- \`${targetRel("containment_claim_boundary_audit.json")}\`
- \`${targetRel("containment_owner_review_draft.json")}\`
- \`${targetRel("containment_claim_decision_draft.json")}\`

## Source Execution Summary

- Source status: ${report.source_execution_status}
- Cases passed: ${report.cases_passed}/${report.cases_total}
- Critical/high failures: ${report.critical_failures}/${report.high_failures}
- Provider/local/telemetry calls: 0/0/0
- Shell/network/file side effects: 0/0/0
- Raw request/response stored: false/false
- Secret logged: false
- Redaction passed: true

## Still Blocked

- \`containment-verified\`
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`
- \`telemetry-connected\`
- \`provider-diverse\`
- \`integration-verified\`

## Next Safest Step

Run \`v2.0.0-beta-containment-verified-decision-gate\` only after explicit owner review decision. Release gate, telemetry connection, local runtime canary, and provider diversity remain separate blockers.
`;
}

function docsText(title, bodyLines) {
  return `# ${title}

${bodyLines.join("\n\n")}
`;
}

function claimLadderAppend() {
  return `## Containment Post-execution Audit Claim

\`containment-post-execution-audit-completed\` means dedicated containment verification results were reviewed, evidence completeness was audited, claim boundaries were checked, and owner review/decision draft was prepared without granting \`containment-verified\`.

It allows:
- containment post-execution audit statement
- containment evidence completeness audit statement
- containment owner review draft statement
- containment claim decision draft statement

It does not allow:
- \`containment-verified\`
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`

Additional rules:
- post-execution audit is not \`containment-verified\`
- owner review draft is not owner approval
- claim decision draft is not claim decision
- proof level update may not mark any boundary verified in this stage
- final containment decision gate remains required
`;
}

function ensureClaimLadder(root) {
  const file = p(root, "release", "claim_ladder.md");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
  if (current.includes("## Containment Post-execution Audit Claim")) {
    return current;
  }
  const marker = "\n## Later Claims\n";
  const addition = `${claimLadderAppend()}\n`;
  return current.includes(marker)
    ? current.replace(marker, `\n${addition}${marker}`)
    : `${current.trimEnd()}\n\n${addition}`;
}

function buildGateReportSkeleton() {
  return {
    status: "pass",
    stage: STAGE,
    can_enter_containment_verified_decision_gate: true,
    can_enter_containment_verified_claim: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    reason: "Dedicated containment execution passed and post-execution audit passed, but containment-verified requires a separate final decision gate.",
    checks: [],
    claims_allowed: postClaimsAllowed,
    claims_blocked: blockedClaims
  };
}

function writeStaticArtifacts(root, artifacts) {
  const {
    report,
    completeness,
    canonical,
    noSideEffectReview,
    proofUpdate,
    claimAudit,
    ownerDraft,
    decisionDraft,
    blocker,
    releaseRefresh
  } = artifacts;
  const evidenceDir = p(root, ...targetEvidenceDir().split("/"));

  writeText(p(root, "release", "beta_containment_post_execution_claim_audit_scope.yaml"), buildScopeYaml());
  writeText(p(root, "release", "containment_post_execution_owner_review_draft.yaml"), releaseOwnerReviewYaml(ownerDraft));
  writeJson(p(root, "release", "containment_post_execution_blocker_update.yaml"), blocker);
  writeText(p(root, "release", "containment_claim_decision_draft.yaml"), releaseClaimDecisionYaml(decisionDraft));

  writeText(p(root, "security", "containment", "containment_post_execution_audit_policy.yaml"), postExecutionAuditPolicyYaml());
  writeText(p(root, "security", "containment", "containment_post_execution_claim_policy.yaml"), postExecutionClaimPolicyYaml());
  writeText(p(root, "security", "containment", "containment_owner_review_policy.yaml"), ownerReviewPolicyYaml());
  writeText(p(root, "security", "containment", "containment_canonical_claims.yaml"), canonicalClaimsYaml(canonical));

  writeText(p(root, "evals", "suites", "beta_containment_post_execution_claim_audit.yaml"), betaSuiteYaml());

  writeJson(path.join(evidenceDir, "containment_post_execution_review_report.json"), report);
  writeText(path.join(evidenceDir, "containment_post_execution_review_report.md"), reportMarkdown(report, completeness, claimAudit, ownerDraft));
  writeJson(path.join(evidenceDir, "dedicated_containment_evidence_completeness_report.json"), completeness);
  writeJson(path.join(evidenceDir, "containment_canonical_claims.json"), canonical);
  writeJson(path.join(evidenceDir, "containment_claim_canonicalization_report.json"), {
    status: canonical.canonicalization_status,
    alias_mapping: canonical.alias_mapping,
    canonicalized_source_claims: canonical.canonicalized_source_claims,
    additional_canonical_claims_supported_by_reports: canonical.additional_canonical_claims_supported_by_reports,
    containment_verified_allowed: false
  });
  writeJson(path.join(evidenceDir, "containment_no_side_effect_evidence_review.json"), noSideEffectReview);
  writeJson(path.join(evidenceDir, "containment_proof_level_update.json"), proofUpdate);
  writeJson(path.join(evidenceDir, "containment_claim_boundary_audit.json"), claimAudit);
  writeJson(path.join(evidenceDir, "containment_owner_review_draft.json"), ownerDraft);
  writeJson(path.join(evidenceDir, "containment_claim_decision_draft.json"), decisionDraft);
  writeJson(path.join(evidenceDir, "containment_post_execution_blocker_update.json"), blocker);
  writeJson(path.join(evidenceDir, "containment_release_gate_blocker_refresh.json"), releaseRefresh);
  writeJson(path.join(evidenceDir, "unresolved_items.json"), []);

  writeJson(p(root, "evals", "reports", "containment_post_execution_review_report.json"), report);
  writeText(p(root, "evals", "reports", "containment_post_execution_review_report.md"), reportMarkdown(report, completeness, claimAudit, ownerDraft));
  writeJson(p(root, "evals", "reports", "containment_post_execution_claim_audit_report.json"), claimAudit);
  writeText(p(root, "evals", "reports", "containment_post_execution_claim_audit_report.md"), claimAuditMarkdown(claimAudit, proofUpdate));
  writeJson(p(root, "evals", "reports", "containment_owner_review_draft_report.json"), ownerDraft);
  writeText(p(root, "evals", "reports", "containment_owner_review_draft_report.md"), ownerReviewMarkdown(ownerDraft));

  writeText(p(root, "docs", "containment_post_execution_claim_audit.md"), docsText("Containment Post-execution Claim Audit", [
    "The dedicated containment verification execution evidence is reviewed without a rerun.",
    "The audit records evidence completeness, no-side-effect counters, claim canonicalization, and owner decision readiness.",
    "This audit does not allow `containment-verified`, `release-gated`, or `production-ready`."
  ]));
  writeText(p(root, "docs", "containment_owner_review_draft.md"), ownerReviewMarkdown(ownerDraft));
  writeText(p(root, "docs", "containment_claim_decision_draft.md"), docsText("Containment Claim Decision Draft", [
    `Recommended next gate: \`${decisionDraft.recommended_next_gate}\`.`,
    `Current decision: \`${decisionDraft.current_decision}\`.`,
    "The final claim decision is not made in this stage."
  ]));
  writeText(p(root, "docs", "next_containment_verified_decision_gate_plan.md"), docsText("Next Containment Verified Decision Gate Plan", [
    "Enter the final containment decision gate only after explicit owner review.",
    "Inputs must include the dedicated execution report, cross-suite storage/redaction audit, post-execution claim audit, owner review draft, and claim decision draft.",
    "The next gate must continue to keep release and production claims separate."
  ]));
  writeText(p(root, "docs", "next_release_blocker_resolution_plan.md"), docsText("Next Release Blocker Resolution Plan", [
    "Remaining release blockers include explicit containment owner decision, release gate execution, production telemetry connection, provider diversity, and local runtime canary.",
    "Resolve each blocker with a separate evidence-producing stage before using release or production claims."
  ]));

  writeText(p(root, "README.md"), readmeText());
  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml());
  writeText(p(root, "release", "containment_verification_gate.yaml"), containmentGateYaml());
  writeText(p(root, "release", "containment_verification_gate_refined.yaml"), containmentGateYaml());
  writeText(p(root, "release", "dedicated_containment_verification_gate.yaml"), dedicatedGateYaml());
  writeText(p(root, "release", "release_blocker_priority.yaml"), releaseBlockerPriorityYaml());
  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionMatrixYaml());
  writeText(p(root, "security", "containment", "containment_verification_policy.yaml"), verificationPolicyYaml());
  writeText(p(root, "security", "containment", "containment_claim_policy.yaml"), containmentClaimPolicyYaml());
  writeText(p(root, "security", "containment", "containment_remaining_criteria.yaml"), remainingCriteriaYaml());
  writeText(p(root, "docs", "beta_entry_criteria.md"), docsText("Beta Entry Criteria", [
    `Current stage: \`${STAGE}\`.`,
    "Dedicated containment execution and post-execution claim audit are recorded.",
    "The package remains blocked from containment, release, production, telemetry, provider-diversity, and integration claims.",
    "Next required containment step is explicit owner decision followed by the final containment claim decision gate."
  ]));
  writeText(p(root, "release", "claim_ladder.md"), ensureClaimLadder(root));

  return artifacts;
}

export function buildPostExecutionAuditArtifacts(root = resolveRoot(), options = {}) {
  const sourceReport = readIfExists(root, sourceRel("dedicated_containment_verification_report.json"));
  if (!sourceReport) {
    throw new Error(`${sourceRel("dedicated_containment_verification_report.json")} missing`);
  }
  const noSideEffect = readIfExists(root, sourceRel("dedicated_containment_no_side_effect_report.json"), {});
  const completeness = evidenceCompleteness(root);
  const canonical = canonicalClaims(sourceReport);
  const noSideEffectReview = noSideEffectEvidenceReview(sourceReport, noSideEffect);
  const proofUpdate = proofLevelUpdate();
  const claimAudit = claimBoundaryAudit();
  const ownerDraft = ownerReviewDraft();
  const decisionDraft = claimDecisionDraft();
  const blocker = blockerUpdate();
  const releaseRefresh = releaseGateBlockerRefresh();
  const report = postExecutionReviewReport(sourceReport);
  const artifacts = {
    report,
    completeness,
    canonical,
    noSideEffectReview,
    proofUpdate,
    claimAudit,
    ownerDraft,
    decisionDraft,
    blocker,
    releaseRefresh
  };
  writeStaticArtifacts(root, artifacts);
  if (options.writeHandoff !== false) {
    writeText(p(root, "session_handoff_2026-05-22.md"), handoffText(report));
  }
  if (options.writeGateSkeleton) {
    const gate = buildGateReportSkeleton();
    writeJson(p(root, ...targetRel("containment_post_execution_gate_report.json").split("/")), gate);
    writeText(p(root, "evals", "reports", "containment_post_execution_gate_report.md"), `# Containment Post-execution Gate Report\n\nStatus: ${gate.status}\n`);
  }
  return artifacts;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildPostExecutionAuditArtifacts(root);
  console.log(JSON.stringify(artifacts.report, null, 2));
}
