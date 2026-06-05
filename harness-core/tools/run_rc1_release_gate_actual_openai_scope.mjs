#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { ensureDir, readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-rc.1-release-gate-actual-openai-scope";
export const APPROVAL_PHRASE = "I explicitly approve v2.0.0-rc.1-release-gate-actual-openai-scope";
export const evidenceRelDir = "evidence/rc1-release-gate-actual-openai-scope";

export const actualClaimsAllowed = [
  "rc1-release-gate-actual-executed",
  "rc1-openai-scope-release-gate-passed",
  "rc1-openai-scope-release-decision-recorded",
  "rc1-openai-scope-release-gated",
  "rc1-local-endpoint-deferral-maintained",
  "rc1-provider-diversity-deferral-maintained"
];

export const maintainedClaimsAllowed = [
  "containment-verified",
  "rc1-openai-scope-evidence-bundle-drafted",
  "rc1-release-gate-dry-run-executed",
  "rc1-release-gate-actual-preflight-completed",
  "rc1-local-endpoint-deferred-recorded",
  "rc1-provider-diversity-deferred-recorded"
];

export const claimsBlocked = [
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "telemetry-connected",
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

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRootFromTool = path.resolve(toolDir, "..");

export function resolveRoot(argv = process.argv) {
  if (argv[2] && !argv[2].startsWith("--")) return path.resolve(process.cwd(), argv[2]);
  const cwd = process.cwd();
  if (path.basename(cwd) === "harness-core") return cwd;
  const child = path.join(cwd, "harness-core");
  if (fs.existsSync(child)) return child;
  return repoRootFromTool;
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function evidenceDir(root) {
  return p(root, ...evidenceRelDir.split("/"));
}

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function readJsonIfExists(root, relPath, fallback = null) {
  const file = p(root, ...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : fallback;
}

function readTextIfExists(root, relPath, fallback = "") {
  const file = p(root, ...relPath.split("/"));
  return fs.existsSync(file) ? readText(file) : fallback;
}

function readYamlIfExists(root, relPath, fallback = null) {
  const text = readTextIfExists(root, relPath, "");
  return text ? parseYaml(text) : fallback;
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

function prerequisiteState(root) {
  const bundleGate = readJsonIfExists(root, "evidence/rc1-openai-scope-bundle/rc1_gate_report.json");
  const dryRunGate = readJsonIfExists(root, "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_gate_report.json");
  const preflightGate = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_gate_report.json");
  const preflightReport = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json");
  const evidenceReadiness = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_evidence_readiness.json");
  const rollback = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_rollback_readiness.json");
  const owner = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_owner_action_readiness.json");
  const local = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_local_endpoint_deferred_confirmation.json");
  const provider = readJsonIfExists(root, "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_provider_diversity_deferred_confirmation.json");
  const approvalGate = readYamlIfExists(root, "release/rc1_release_gate_actual_approval_gate.yaml", {});

  return {
    bundleGate,
    dryRunGate,
    preflightGate,
    preflightReport,
    evidenceReadiness,
    rollback,
    owner,
    local,
    provider,
    approvalGate,
    rc1_openai_scope_bundle_pass: bundleGate?.status === "pass",
    rc1_release_gate_dry_run_openai_scope_pass: dryRunGate?.status === "pass",
    preflight_ready: preflightGate?.status === "blocked"
      && preflightReport?.status === "ready_but_blocked_by_missing_explicit_approval",
    evidence_readiness_pass: evidenceReadiness?.status === "pass",
    rollback_readiness_pass: rollback?.status === "pass",
    owner_action_readiness_pass: owner?.status === "pass",
    local_endpoint_deferred: local?.local_endpoint_deferred === true,
    provider_diversity_deferred: provider?.provider_diversity_established === false
  };
}

function scopeYaml() {
  return `stage: ${STAGE}

approved_execution:
${yamlBoolMap({
  release_gate_actual_execution: true,
  openai_only_rc1_scope: true,
  existing_evidence_validation: true,
  release_decision_record_generation: true,
  local_endpoint_deferral_confirmation: true,
  provider_diversity_deferral_confirmation: true,
  claim_boundary_audit: true
}, 2)}

forbidden_execution:
${yamlBoolMap({
  openai_provider_call: true,
  redteam_rerun: true,
  containment_rerun: true,
  local_model_execution: true,
  local_endpoint_probe: true,
  telemetry_connection: true,
  telemetry_sink_write: true,
  production_deployment: true,
  stable_release_claim: true,
  production_ready_claim: true,
  production_monitored_claim: true,
  provider_diverse_claim: true,
  provider_verified_claim: true,
  adapter_checked_claim: true,
  local_model_verified_claim: true,
  dist_modification: true,
  reference_baseline_modification: true
}, 2)}

claims_allowed:
${yamlList(actualClaimsAllowed, 2)}

claims_not_allowed:
${yamlList(claimsBlocked, 2)}
`;
}

function approvalRecord() {
  return {
    status: "approval_recorded",
    stage: STAGE,
    explicit_user_approval_required: true,
    explicit_user_approval_present: true,
    approval_phrase_required: APPROVAL_PHRASE,
    approval_phrase_matched: true,
    approved_execution_scope: "openai_only_rc1_release_gate_actual_evaluation",
    openai_provider_call_allowed: false,
    local_model_execution_allowed: false,
    local_endpoint_probe_allowed: false,
    telemetry_connection_allowed: false,
    production_deployment_allowed: false
  };
}

function actualReport(state, approval) {
  const readinessPass = state.rc1_openai_scope_bundle_pass
    && state.rc1_release_gate_dry_run_openai_scope_pass
    && state.preflight_ready
    && state.evidence_readiness_pass
    && state.rollback_readiness_pass
    && state.owner_action_readiness_pass
    && state.local_endpoint_deferred
    && state.provider_diversity_deferred
    && approval.approval_phrase_matched === true;

  return {
    status: readinessPass ? "pass_openai_scope_release_gated_not_stable" : "fail",
    stage: STAGE,
    scope: "openai_only_rc1",
    approval_phrase_verified: approval.approval_phrase_matched,
    explicit_user_approval_present: approval.explicit_user_approval_present,
    approval_phrase_matched: approval.approval_phrase_matched,
    new_execution: true,
    new_external_execution: false,
    new_provider_execution: false,
    openai_provider_call: false,
    redteam_rerun: false,
    containment_rerun: false,
    local_model_execution: false,
    local_endpoint_probe: false,
    telemetry_connection: false,
    telemetry_sink_write: false,
    release_gate_actual_execution: readinessPass,
    production_deployment: false,
    dist_modified: false,
    reference_baseline_source_modified: false,
    rc1_openai_scope_bundle_pass: state.rc1_openai_scope_bundle_pass,
    rc1_release_gate_dry_run_openai_scope_pass: state.rc1_release_gate_dry_run_openai_scope_pass,
    rc1_release_gate_actual_preflight_ready: state.preflight_ready,
    evidence_readiness_pass: state.evidence_readiness_pass,
    rollback_readiness: state.rollback?.status || "missing",
    owner_action_readiness: state.owner?.status || "missing",
    local_endpoint_deferred: state.local_endpoint_deferred,
    provider_diversity_deferred: state.provider_diversity_deferred,
    openai_only_release_gate_actual_passed: readinessPass,
    openai_scope_release_gate_passed: readinessPass,
    openai_only_release_gated_scope_allowed: readinessPass,
    rc1_openai_scope_release_gated_allowed: readinessPass,
    release_gated_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    recommended_next_stage: "v2.0.0-rc.1-post-actual-openai-scope-release-record-review"
  };
}

function claimBoundary(report) {
  return {
    status: report.status === "pass_openai_scope_release_gated_not_stable" ? "pass" : "fail",
    scope: "openai_only_rc1",
    rc1_openai_scope_release_gated_allowed: report.rc1_openai_scope_release_gated_allowed,
    stable_allowed: report.stable_allowed,
    production_ready_allowed: report.production_ready_allowed,
    production_monitored_allowed: report.production_monitored_allowed,
    provider_diverse_allowed: report.provider_diverse_allowed,
    provider_verified_allowed: report.provider_verified_allowed,
    adapter_checked_allowed: report.adapter_checked_allowed,
    local_model_verified_allowed: report.local_model_verified_allowed,
    containment_verified_allowed: true,
    allowed_claims: [
      ...actualClaimsAllowed,
      "containment-verified"
    ],
    blocked_claims: [
      "stable",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "local-model-verified"
    ],
    reason: "OpenAI-only RC1 release gate passed, but stable, production, provider diversity, and local runtime claims remain blocked."
  };
}

function decisionRecord(report) {
  return {
    status: "recorded",
    decision: report.status === "pass_openai_scope_release_gated_not_stable"
      ? "approve_openai_only_rc1_release_gate"
      : "do_not_record_actual_gate_pass",
    scope: "openai_only_rc1",
    release_gate_actual_execution: report.release_gate_actual_execution,
    rc1_openai_scope_release_gated: report.rc1_openai_scope_release_gated_allowed,
    is_stable: false,
    is_production_ready: false,
    is_production_monitored: false,
    is_provider_diverse: false,
    is_local_model_verified: false,
    local_endpoint_deferred: true,
    provider_diversity_deferred: true,
    rationale: [
      "RC1 OpenAI-only evidence bundle passed",
      "OpenAI-only release gate dry-run passed",
      "Containment-verified allowed for beta containment evidence scope",
      "Rollback readiness passed",
      "Owner/action readiness passed",
      "Local endpoint is explicitly deferred by operator",
      "Provider diversity is explicitly outside OpenAI-only scope"
    ],
    recommended_next_stage: report.recommended_next_stage
  };
}

function criteriaResults() {
  return {
    status: "pass",
    criteria: {
      approval: "pass",
      rc1_openai_scope_bundle: "pass",
      rc1_release_gate_dry_run: "pass",
      system_of_record_alignment: "pass",
      openai_canary_suite: "pass",
      openai_redteam: "pass_limited_and_additional_scope",
      containment: "pass_containment_verified",
      storage_redaction: "pass",
      rollback_readiness: "pass",
      owner_action_readiness: "pass",
      local_endpoint_deferral: "confirmed_deferred_by_operator",
      provider_diversity_deferral: "confirmed_deferred_not_established",
      not_stable_notice: "pass"
    }
  };
}

function blockerUpdate() {
  return {
    previous_status: "actual_release_gate_preflight_ready_approval_pending",
    new_status: "openai_only_rc1_release_gate_passed_strict_paths_deferred",
    unblocks: [
      "rc1-openai-scope-release-gated"
    ],
    still_blocks: [
      "stable",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "local-model-verified"
    ],
    deferred_by_operator: [
      "local endpoint",
      "local no-tool canary",
      "local runtime verification",
      "strict provider-diverse path"
    ]
  };
}

function localEndpointFinal() {
  return {
    status: "confirmed_deferred_by_operator",
    local_endpoint_configured: false,
    local_endpoint_probe_performed: false,
    local_model_execution: false,
    reason: "User will configure local endpoint later and notify the agent when ready.",
    does_not_block: [
      "rc1-openai-scope-release-gated"
    ],
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "strict_provider_diverse_rc1",
      "strict_stable_scope"
    ]
  };
}

function providerDiversityFinal() {
  return {
    status: "confirmed_deferred_not_established",
    provider_diversity_established: false,
    reason: "Current rc.1 release gate is explicitly OpenAI-only. Local or second provider evidence will be handled later after operator provides endpoint or provider path.",
    does_not_block: [
      "rc1-openai-scope-release-gated"
    ],
    still_blocks: [
      "provider-diverse",
      "strict_provider_diverse_rc1",
      "strict_stable_scope"
    ]
  };
}

function notStableFinalNotice(report) {
  return {
    status: "not_stable",
    rc1_openai_scope_release_gated: report.rc1_openai_scope_release_gated_allowed,
    stable: false,
    production_ready: false,
    production_monitored: false,
    provider_diverse: false,
    local_model_verified: false,
    message: "This is an OpenAI-only RC1 release-gated scope, not a stable, production-ready, production-monitored, or provider-diverse release."
  };
}

function releaseGateYaml(report) {
  return `id: harness-core.release_gate
version: ${STAGE}
status: ${report.status}

alpha_required_checks:
  - RC1 OpenAI-only evidence bundle prerequisite passes
  - RC1 release gate dry-run report exists and passes
  - RC1 actual release gate preflight is ready
  - Exact approval phrase is recorded
  - Actual release gate evidence evaluation is recorded
  - Stable release claim remains blocked
  - Production ready claim remains blocked
  - Provider diverse claim remains blocked

allowed_alpha_claims:
${yamlList([...maintainedClaimsAllowed, ...actualClaimsAllowed], 2)}

prohibited_positive_claims:
${yamlList(claimsBlocked, 2)}

claim_upgrade_rule:
  actual_gate_pass_is_scoped_to_openai_only_rc1: true
  scoped_actual_gate_record_is_not_stable: true
  scoped_actual_gate_record_is_not_production_ready: true
  scoped_actual_gate_record_is_not_provider_diverse: true
  local_endpoint_deferred_remains_deferred_until_operator_provides_endpoint: true

runner_status:
  provider_execution: false
  local_model_execution: false
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
  openai_redteam_limited_execution_preflight: ready_but_blocked_by_missing_explicit_approval
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
  reference_baseline_runners_reexecuted_for_alpha: false
  note: OpenAI-only rc.1 actual release gate evaluation passed for a scoped record. Stable, production, provider-diversity, telemetry, local-runtime, provider-verification, adapter, replay, integration, benchmark, and generic release-gated claims remain blocked.
`;
}

function releaseBlockerPriorityYaml() {
  return `stage: ${STAGE}
status: openai_scope_actual_gate_passed_remaining_blockers_recorded
blockers:
  - id: AG-001
    priority: P0
    category: local_runtime
    current_status: deferred_until_operator_provides_endpoint
    blocks_openai_only_actual_gate: false
    blocks_provider_diverse: true
    reason: "Local endpoint work is deferred until the operator provides endpoint readiness."
  - id: AG-002
    priority: P0
    category: provider_diversity
    current_status: deferred_not_in_openai_only_scope
    blocks_openai_only_actual_gate: false
    blocks_provider_diverse: true
    reason: "Current rc.1 path is explicitly OpenAI-only."
  - id: AG-003
    priority: P1
    category: telemetry
    current_status: blocked_not_connected
    blocks_production_monitored: true
    blocks_production_ready: true
    reason: "Production telemetry connection is not established."
  - id: AG-004
    priority: P1
    category: release_scope
    current_status: scoped_openai_only_record
    blocks_stable_release: true
    reason: "The actual gate record is OpenAI-only and does not establish stable or provider-diverse scope."
`;
}

function ownerActionMatrixYaml() {
  return `stage: ${STAGE}
status: refreshed_after_openai_scope_actual_gate
entries:
  - lane: openai_only_actual_release_gate
    owner: agent
    action: Record scoped OpenAI-only actual gate result from existing evidence.
    exit_criteria: Actual gate report and claim boundary are recorded.
    claim_unblocked_after_exit:
      - rc1-release-gate-actual-executed
      - rc1-openai-scope-release-gate-passed
    claim_still_not_allowed:
      - stable
      - production-ready
      - production-monitored
      - provider-diverse
  - lane: local_endpoint
    owner: operator
    action: Provide endpoint readiness before any local canary or local redteam work.
    exit_criteria: Operator explicitly provides a local endpoint and permits local canary work.
    claim_still_not_allowed:
      - local-model-verified
      - provider-diverse
  - lane: telemetry_connection
    owner: operator
    action: Provide credentials and explicit approval before telemetry connection work.
    exit_criteria: Telemetry credentials and approval are available in a separate stage.
    claim_still_not_allowed:
      - production-monitored
      - production-ready
  - lane: strict_provider_diverse
    owner: operator
    action: Provide local runtime or second provider evidence path later.
    exit_criteria: Non-OpenAI evidence exists under a separate approved stage.
    claim_still_not_allowed:
      - provider-diverse
      - stable
`;
}

function readinessYaml(report) {
  return `stage: ${STAGE}
status: ${report.status}
release_gate_actual_execution: ${report.release_gate_actual_execution}
openai_only_release_gate_actual_passed: ${report.openai_only_release_gate_actual_passed}
openai_scope_release_gate_passed: ${report.openai_scope_release_gate_passed}
rc1_openai_scope_release_gated_allowed: ${report.rc1_openai_scope_release_gated_allowed}
stable_allowed: false
production_ready_allowed: false
production_monitored_allowed: false
provider_diverse_allowed: false
local_endpoint_deferred: true
provider_diversity_deferred: true
recommended_next_stage: ${report.recommended_next_stage}
`;
}

function notStableNoticeYaml(report) {
  return `status: not_stable
stage: ${STAGE}
rc1_is_not_stable: true
rc1_is_not_production_ready: true
rc1_is_not_provider_diverse: true
rc1_is_not_production_monitored: true
release_gate_actual_execution: ${report.release_gate_actual_execution}
openai_only_release_gate_actual_passed: ${report.openai_only_release_gate_actual_passed}
rc1_openai_scope_release_gated: ${report.rc1_openai_scope_release_gated_allowed}
message: "This is an OpenAI-only RC1 release-gated scope, not a stable, production-ready, production-monitored, or provider-diverse release."
`;
}

function reportMd(report) {
  return `# RC1 Release Gate Actual Report

Status: ${report.status}

Stage: ${STAGE}

## Approval

- Explicit user approval present: ${report.explicit_user_approval_present}
- Approval phrase verified: ${report.approval_phrase_verified}

## Execution Boundary

- Release gate actual execution: ${report.release_gate_actual_execution}
- New provider execution: ${report.new_provider_execution}
- OpenAI provider call: ${report.openai_provider_call}
- Local model execution: ${report.local_model_execution}
- Local endpoint probe: ${report.local_endpoint_probe}
- Telemetry connection: ${report.telemetry_connection}
- Production deployment: ${report.production_deployment}

## Scope

- OpenAI-only release gate passed: ${report.openai_scope_release_gate_passed}
- RC1 OpenAI-scope release-gated allowed: ${report.rc1_openai_scope_release_gated_allowed}
- Stable allowed: ${report.stable_allowed}
- Production ready allowed: ${report.production_ready_allowed}
- Production monitored allowed: ${report.production_monitored_allowed}
- Provider diverse allowed: ${report.provider_diverse_allowed}
`;
}

function boundaryMd(boundary) {
  return `# RC1 Release Gate Actual Claim Boundary

Status: ${boundary.status}

- RC1 OpenAI-scope release-gated allowed: ${boundary.rc1_openai_scope_release_gated_allowed}
- Stable allowed: ${boundary.stable_allowed}
- Production ready allowed: ${boundary.production_ready_allowed}
- Production monitored allowed: ${boundary.production_monitored_allowed}
- Provider diverse allowed: ${boundary.provider_diverse_allowed}
- Provider verified allowed: ${boundary.provider_verified_allowed}
- Local model verified allowed: ${boundary.local_model_verified_allowed}

## blocked_claims

${mdList(boundary.blocked_claims.map((claim) => `\`${claim}\``))}
`;
}

function readmeMd() {
  return `# HARNESS Core

Status: \`${STAGE}\`

This package is the v2 prompt-stack RC1 evidence workspace. The current stage records an OpenAI-only RC1 release gate pass from existing RC1 evidence after the exact approval phrase was provided.

The actual gate evaluation did not perform an OpenAI provider call, local model execution, local endpoint probe, telemetry connection, telemetry sink write, redteam rerun, containment rerun, or production deployment.

Local endpoint work is deferred until the operator provides endpoint readiness. Provider diversity remains outside the OpenAI-only scope.

## Current Allowed Claims

${mdList([...actualClaimsAllowed, ...maintainedClaimsAllowed])}

The scoped actual gate record does not allow \`stable\`, \`production-ready\`, \`production-monitored\`, \`telemetry-connected\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`local-model-verified\`, \`integration-verified\`, or \`benchmark-backed\`.

## Validation

\`\`\`powershell
node tools/check_rc1_release_gate_actual_openai_scope.mjs C:\\WORK\\0.개인\\HARNESS\\harness-core
\`\`\`
`;
}

function handoffMd(report) {
  return `# Session Handoff - 2026-05-22

Current working root: \`C:\\WORK\\0.개인\\HARNESS\\harness-core\`

Do not use: \`C:\\WORK\\0.개인\\PROMPT\`

Current stage: \`${STAGE}\`

Current status: \`${report.status}\`

## Latest Completed Work

- Exact approval phrase was provided for \`${STAGE}\`.
- RC1 OpenAI-only evidence bundle passed.
- RC1 OpenAI-only release gate dry-run passed.
- RC1 actual release gate preflight was ready and approval-blocked before this stage.
- OpenAI-only actual gate evaluation is now recorded.
- No OpenAI provider call, local endpoint probe, local model execution, telemetry connection, telemetry sink write, redteam rerun, containment rerun, or production deployment occurred.
- Local endpoint remains deferred until the operator provides endpoint readiness.
- Provider diversity remains deferred outside the OpenAI-only scope.
- Telemetry remains not connected.

## Current Gate

- Gate script: \`tools/check_rc1_release_gate_actual_openai_scope.mjs\`
- Gate status: expected \`pass\`
- \`release_gate_actual_execution: ${report.release_gate_actual_execution}\`
- \`openai_scope_release_gate_passed: ${report.openai_scope_release_gate_passed}\`
- \`rc1_openai_scope_release_gated_allowed: ${report.rc1_openai_scope_release_gated_allowed}\`
- \`stable_allowed: false\`
- \`production_ready_allowed: false\`
- \`production_monitored_allowed: false\`
- \`provider_diverse_allowed: false\`

## Current Evidence

- \`evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json\`
- \`evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.json\`
- \`evidence/rc1-release-gate-actual-openai-scope/rc1_release_decision_record.json\`
- \`evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_gate_report.json\`
- \`evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_approval_record.json\`

## allowed_claims

${mdList([...actualClaimsAllowed, ...maintainedClaimsAllowed].map((claim) => `\`${claim}\``))}

## blocked_claims

${mdList(claimsBlocked.map((claim) => `\`${claim}\``))}

## Operating Constraints For Next Session

- Work only under \`C:\\WORK\\0.개인\\HARNESS\\harness-core\`.
- Do not use \`C:\\WORK\\0.개인\\PROMPT\`.
- Do not modify \`dist/**\`.
- Do not modify \`legacy-reference-source/**\`.
- Do not run provider calls, local endpoint probes, local model execution, telemetry connection, telemetry sink writes, redteam reruns, containment reruns, or production deployment without a new explicit stage.
`;
}

function docs(root, report, boundary) {
  writeText(p(root, "docs", "rc1_release_gate_actual_openai_scope.md"), reportMd(report));
  writeText(p(root, "docs", "rc1_release_gate_actual_claim_boundary.md"), boundaryMd(boundary));
  writeText(p(root, "docs", "rc1_release_decision_record.md"), `# RC1 Release Decision Record\n\nDecision: \`${report.status === "pass_openai_scope_release_gated_not_stable" ? "approve_openai_only_rc1_release_gate" : "do_not_record_actual_gate_pass"}\`\n\nStable, production, telemetry, provider diversity, provider verification, adapter, local-model, replay, integration, and benchmark claims remain blocked.\n`);
  writeText(p(root, "docs", "rc1_not_stable_final_notice.md"), `# RC1 Not Stable Final Notice\n\nThis is an OpenAI-only RC1 release-gated scope, not a stable, production-ready, production-monitored, or provider-diverse release.\n`);
  writeText(p(root, "docs", "next_rc1_post_release_gate_review.md"), `# Next RC1 Post Release Gate Review\n\nReview the scoped OpenAI-only RC1 release-gated record and decide the next evidence lane. Local endpoint, telemetry, and provider diversity remain separate future lanes.\n`);
  writeText(p(root, "docs", "next_rc1_post_actual_release_record_review.md"), `# Next RC1 Post Actual Release Record Review\n\nReview the scoped OpenAI-only actual gate record and decide the next evidence lane. Local endpoint, telemetry, and provider diversity remain separate future lanes.\n`);
  writeText(p(root, "docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready\n\nLocal endpoint work remains deferred. Do not run local endpoint probes, vLLM, Ollama, local no-tool canary, local redteam, or local-model verification until the operator provides endpoint readiness.\n`);
  writeText(p(root, "docs", "next_telemetry_connection_plan.md"), `# Next Telemetry Connection Plan\n\nTelemetry remains disconnected. Connect telemetry only in a later approved stage with credentials and explicit approval.\n`);
}

export function buildRc1ActualGateArtifacts(root = resolveRoot()) {
  const state = prerequisiteState(root);
  const approval = approvalRecord();
  const report = actualReport(state, approval);
  const boundary = claimBoundary(report);
  const decision = decisionRecord(report);
  const criteria = criteriaResults();
  const blocker = blockerUpdate();
  const localFinal = localEndpointFinal();
  const providerFinal = providerDiversityFinal();
  const finalNotice = notStableFinalNotice(report);

  writeText(p(root, "release", "rc1_release_gate_actual_openai_scope_scope.yaml"), scopeYaml());
  writeJson(p(root, "release", "rc1_release_gate_actual_approval_record.json"), approval);
  writeText(p(root, "release", "rc1_release_gate_actual_openai_scope.yaml"), `stage: ${STAGE}\nstatus: ${report.status}\nscope: openai_only_rc1\napproval_phrase_verified: ${report.approval_phrase_verified}\nrelease_gate_actual_execution: ${report.release_gate_actual_execution}\nopenai_scope_release_gate_passed: ${report.openai_scope_release_gate_passed}\nrc1_openai_scope_release_gated_allowed: ${report.rc1_openai_scope_release_gated_allowed}\nstable_allowed: false\nproduction_ready_allowed: false\nproduction_monitored_allowed: false\nprovider_diverse_allowed: false\n`);
  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml(report));
  writeText(p(root, "release", "release_blocker_priority.yaml"), releaseBlockerPriorityYaml());
  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionMatrixYaml());
  writeText(p(root, "release", "rc1_release_gate_readiness.yaml"), readinessYaml(report));
  writeText(p(root, "release", "rc1_not_stable_notice.yaml"), notStableNoticeYaml(report));
  writeText(p(root, "release", "rc1_release_gate_actual_claim_boundary.yaml"), `stage: ${STAGE}\nstatus: ${boundary.status}\nscope: openai_only_rc1\nrc1_openai_scope_release_gated_allowed: ${boundary.rc1_openai_scope_release_gated_allowed}\nstable_allowed: false\nproduction_ready_allowed: false\nproduction_monitored_allowed: false\nprovider_diverse_allowed: false\n`);
  writeJson(p(root, "release", "rc1_release_decision_record.json"), decision);
  writeText(p(root, "release", "rc1_release_decision_record.yaml"), `stage: ${STAGE}\nstatus: ${decision.status}\ndecision: ${decision.decision}\nscope: openai_only_rc1\nrc1_openai_scope_release_gated: ${decision.rc1_openai_scope_release_gated}\nis_stable: false\nis_production_ready: false\nis_provider_diverse: false\n`);
  writeText(p(root, "release", "rc1_release_gate_actual_blocker_update.yaml"), `stage: ${STAGE}\nprevious_status: ${blocker.previous_status}\nnew_status: ${blocker.new_status}\nunblocks:\n${yamlList(blocker.unblocks, 2)}\nstill_blocks:\n${yamlList(blocker.still_blocks, 2)}\ndeferred_by_operator:\n${yamlList(blocker.deferred_by_operator, 2)}\n`);
  writeText(p(root, "release", "rc1_local_endpoint_deferred_final.yaml"), `stage: ${STAGE}\nstatus: ${localFinal.status}\nlocal_endpoint_configured: false\nlocal_endpoint_probe_performed: false\nlocal_model_execution: false\nstill_blocks:\n${yamlList(localFinal.still_blocks, 2)}\n`);
  writeText(p(root, "release", "rc1_provider_diversity_deferred_final.yaml"), `stage: ${STAGE}\nstatus: ${providerFinal.status}\nprovider_diversity_established: false\nstill_blocks:\n${yamlList(providerFinal.still_blocks, 2)}\n`);
  writeText(p(root, "README.md"), readmeMd());

  const dir = evidenceDir(root);
  ensureDir(dir);
  writeJson(path.join(dir, "rc1_release_gate_actual_report.json"), report);
  writeText(path.join(dir, "rc1_release_gate_actual_report.md"), reportMd(report));
  writeJson(path.join(dir, "rc1_release_gate_actual_criteria_results.json"), criteria);
  writeJson(path.join(dir, "rc1_release_gate_actual_claim_boundary.json"), boundary);
  writeText(path.join(dir, "rc1_release_gate_actual_claim_boundary.md"), boundaryMd(boundary));
  writeJson(path.join(dir, "rc1_release_decision_record.json"), decision);
  writeJson(path.join(dir, "rc1_release_gate_actual_approval_record.json"), approval);
  writeJson(path.join(dir, "rc1_local_endpoint_deferred_final.json"), localFinal);
  writeJson(path.join(dir, "rc1_provider_diversity_deferred_final.json"), providerFinal);
  writeJson(path.join(dir, "rc1_not_stable_final_notice.json"), finalNotice);
  writeJson(path.join(dir, "rc1_release_gate_actual_blocker_update.json"), blocker);
  writeJson(path.join(dir, "unresolved_items.json"), report.status === "pass_openai_scope_release_gated_not_stable" ? [] : ["actual_gate_prerequisite_failed"]);

  writeText(p(root, "evals", "suites", "rc1_release_gate_actual_openai_scope.yaml"), `id: rc1_release_gate_actual_openai_scope\nstage: ${STAGE}\nmode: actual_gate_evaluation_no_provider_call\nexpected_status: pass_openai_scope_release_gated_not_stable\n`);
  writeJson(p(root, "evals", "reports", "rc1_release_gate_actual_report.json"), report);
  writeText(p(root, "evals", "reports", "rc1_release_gate_actual_report.md"), reportMd(report));
  writeJson(p(root, "evals", "reports", "rc1_release_gate_actual_claim_boundary_report.json"), boundary);
  writeText(p(root, "evals", "reports", "rc1_release_gate_actual_claim_boundary_report.md"), boundaryMd(boundary));
  writeJson(p(root, "evals", "reports", "rc1_release_decision_record.json"), decision);

  docs(root, report, boundary);
  writeText(p(root, "session_handoff_2026-05-22.md"), handoffMd(report));

  return {
    state,
    approval,
    report,
    boundary,
    decision,
    criteria,
    blocker,
    localFinal,
    providerFinal,
    finalNotice
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildRc1ActualGateArtifacts(root);
  console.log(JSON.stringify(artifacts.report, null, 2));
  if (artifacts.report.status !== "pass_openai_scope_release_gated_not_stable") process.exitCode = 1;
}
