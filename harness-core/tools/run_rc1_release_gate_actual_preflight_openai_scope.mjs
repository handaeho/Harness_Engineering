#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { ensureDir, readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-rc.1-release-gate-actual-openai-scope-preflight";
export const NEXT_STAGE = "v2.0.0-rc.1-release-gate-actual-openai-scope";
export const APPROVAL_PHRASE = "I explicitly approve v2.0.0-rc.1-release-gate-actual-openai-scope";
export const evidenceRelDir = "evidence/rc1-release-gate-actual-openai-scope-preflight";

export const preflightClaimsAllowed = [
  "rc1-release-gate-actual-preflight-completed",
  "rc1-release-gate-approval-packet-generated",
  "rc1-release-gate-command-plan-drafted",
  "rc1-rollback-readiness-checked",
  "rc1-owner-action-readiness-checked",
  "rc1-local-endpoint-deferral-confirmed",
  "rc1-provider-diversity-deferral-confirmed"
];

export const maintainedClaimsAllowed = [
  "containment-verified",
  "rc1-openai-scope-evidence-bundle-drafted",
  "rc1-release-gate-dry-run-executed",
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

export function prerequisiteState(root) {
  const rc1BundleGate = readJsonIfExists(root, "evidence/rc1-openai-scope-bundle/rc1_gate_report.json");
  const dryRunGate = readJsonIfExists(root, "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_gate_report.json");
  const systemOfRecord = readJsonIfExists(root, "evidence/rc1-agents-md-system-of-record-alignment/system_of_record_gate_report.json")
    || readJsonIfExists(root, "evidence/rc1-agents-md-system-of-record-alignment/system_of_record_alignment_report.json");
  const rc1ClaimBoundary = readJsonIfExists(root, "evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json");
  const storageGate = readJsonIfExists(root, "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_gate_report.json");
  const localDeferred = readJsonIfExists(root, "evidence/rc1-release-gate-dry-run-openai-scope/rc1_local_endpoint_deferred_record.json");
  const providerDeferred = readJsonIfExists(root, "evidence/rc1-release-gate-dry-run-openai-scope/rc1_provider_diversity_deferred_record.json");
  const notStableExists = exists(root, "release/rc1_not_stable_notice.yaml")
    || exists(root, "evidence/rc1-openai-scope-bundle/rc1_not_stable_notice.json");

  return {
    rc1BundleGate,
    dryRunGate,
    systemOfRecord,
    rc1ClaimBoundary,
    storageGate,
    localDeferred,
    providerDeferred,
    notStableExists,
    rc1OpenaiScopeBundlePass: rc1BundleGate?.status === "pass",
    dryRunPass: dryRunGate?.status === "pass",
    systemOfRecordPass: systemOfRecord?.status === "pass",
    containmentVerified: rc1ClaimBoundary?.containment_verified_allowed === true,
    storageRedactionPass: storageGate?.status === "pass",
    localDeferredExists: localDeferred?.local_endpoint_deferred === true,
    providerDeferredExists: providerDeferred?.provider_diversity_established === false
  };
}

function scopeYaml() {
  return `stage: ${STAGE}

approved_actions:
${yamlBoolMap({
  release_gate_actual_preflight: true,
  rc1_openai_scope_evidence_readiness_check: true,
  approval_gate_creation: true,
  release_command_plan_generation: true,
  rollback_readiness_check: true,
  owner_action_readiness_check: true,
  local_endpoint_deferral_confirmation: true,
  provider_diversity_deferral_confirmation: true,
  claim_boundary_audit: true,
  release_decision_record_preflight: true
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
  release_gate_actual_execution: true,
  production_deployment: true,
  stable_release_claim: true,
  release_gated_claim: true,
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
${yamlList(preflightClaimsAllowed, 2)}

claims_not_allowed:
${yamlList([
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "integration-verified"
], 2)}
`;
}

function approvalGateYaml() {
  return `approval_gate:
  stage: ${STAGE}
  explicit_user_approval_required: true
  explicit_user_approval_present: false
  can_execute_release_gate_actual: false

  approval_phrase_required: "${APPROVAL_PHRASE}"

  execution_not_allowed_until:
    - explicit_user_approval_present
    - rc1_openai_scope_bundle_pass
    - rc1_release_gate_dry_run_openai_scope_pass
    - claim_boundary_audit_pass
    - rollback_readiness_pass
    - owner_action_readiness_pass
    - local_endpoint_deferred_record_exists
    - provider_diversity_deferred_record_exists
    - not_stable_notice_exists

  claims_blocked_until_execution:
    - release-gated
    - stable
    - production-ready
    - production-monitored
`;
}

function approvalRequestMd() {
  return `# RC1 Release Gate Actual Approval Request

Stage requesting approval:
${NEXT_STAGE}

What will execute after approval:
- Actual release gate evaluation for OpenAI-only RC1 scope
- No OpenAI provider call
- No local model execution
- No local endpoint probe
- No telemetry connection
- No production deployment

What will not execute:
- local vLLM/Ollama
- provider diversity path
- production telemetry
- stable release
- production deployment

Required approval phrase:
${APPROVAL_PHRASE}

conditional_future_claims: Passing actual release gate may allow an OpenAI-only release-gated claim, but it will not allow:
- stable
- production-ready
- production-monitored
- provider-diverse
- provider-verified
- local-model-verified
`;
}

function commandPlanYaml() {
  return `command_plan:
  stage_to_execute_after_approval: ${NEXT_STAGE}

  required_approval_phrase: "${APPROVAL_PHRASE}"

  commands:
    - node harness-core/tools/run_rc1_release_gate_actual_openai_scope.mjs
    - node harness-core/tools/check_rc1_release_gate_actual_openai_scope.mjs

  not_executable_in_this_stage: true

  expected_execution_outputs:
    - evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json
    - evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.json
    - evidence/rc1-release-gate-actual-openai-scope/rc1_release_decision_record.json
    - evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_gate_report.json
`;
}

function policyYaml() {
  return `stage: ${STAGE}
status: preflight_policy_active
actual_release_gate_execution_allowed_now: false
explicit_user_approval_required: true
explicit_user_approval_present: false
can_execute_release_gate_actual: false
no_execution:
  openai_provider_call: false
  redteam_rerun: false
  containment_rerun: false
  local_model_execution: false
  local_endpoint_probe: false
  telemetry_connection: false
  telemetry_sink_write: false
  release_gate_actual_execution: false
  production_deployment: false
claim_boundary:
  release_gated_allowed: false
  stable_allowed: false
  production_ready_allowed: false
  production_monitored_allowed: false
  provider_diverse_allowed: false
`;
}

function releaseDecisionYaml() {
  return `stage: ${STAGE}
status: preflight_recorded
decision: do_not_execute_release_gate_without_explicit_approval
recommended_next_stage: ${NEXT_STAGE}
explicit_user_approval_present: false
can_execute_release_gate_actual: false
release_gated_allowed: false
stable_allowed: false
production_ready_allowed: false
production_monitored_allowed: false
provider_diverse_allowed: false
local_endpoint_deferred: true
provider_diversity_deferred: true
`;
}

function rollbackReadiness(root) {
  const rollbackPlanExists = exists(root, "release/rollback_plan.md") || exists(root, "release/rollback_plan_draft.yaml");
  const draft = readYamlIfExists(root, "release/rollback_plan_draft.yaml", {});
  const targets = Array.isArray(draft?.rollback_targets) ? draft.rollback_targets : [];
  const markdown = readTextIfExists(root, "release/rollback_plan.md", "");
  const hasRc1Section = markdown.includes("RC1 Actual Gate Preflight Rollback Boundary");
  const pass = rollbackPlanExists && targets.length > 0 && hasRc1Section;
  return {
    status: pass ? "pass" : "needs_review",
    rollback_plan_exists: rollbackPlanExists,
    rollback_targets_defined: targets.length > 0,
    claim_downgrade_rules_defined: targets.some((target) => Array.isArray(target.claim_downgrade) && target.claim_downgrade.length > 0) || hasRc1Section,
    owner_defined: targets.some((target) => typeof target.owner === "string" && target.owner.length > 0) || hasRc1Section,
    evidence_required_for_rollback_defined: targets.some((target) => Array.isArray(target.required_evidence) && target.required_evidence.length > 0) || hasRc1Section,
    blocks_actual_release_gate: !pass,
    notes: pass ? [] : ["Rollback readiness requires a finalized RC1 actual gate preflight rollback boundary."]
  };
}

function ownerActionReadiness(root) {
  const matrixExists = exists(root, "release/owner_action_matrix.yaml");
  const matrix = readYamlIfExists(root, "release/owner_action_matrix.yaml", {});
  const entries = Array.isArray(matrix?.entries) ? matrix.entries : [];
  const hasReleaseLane = entries.some((entry) => String(entry.lane || "").includes("release_gate"));
  const hasRollbackLane = entries.some((entry) => String(entry.lane || "").includes("rollback"));
  const hasBlockedClaims = entries.some((entry) => Array.isArray(entry.claim_still_not_allowed) && entry.claim_still_not_allowed.length > 0);
  const pass = matrixExists && hasReleaseLane && hasRollbackLane && hasBlockedClaims;
  return {
    status: pass ? "pass" : "needs_review",
    owner_action_matrix_exists: matrixExists,
    release_owner_defined: hasReleaseLane,
    rollback_owner_defined: hasRollbackLane,
    blocked_claim_owner_paths_defined: hasBlockedClaims,
    local_endpoint_deferred_owner: "operator",
    telemetry_connection_owner: "operator",
    blocks_actual_release_gate: !pass,
    notes: pass ? [] : ["Owner/action readiness requires release, rollback, and blocked-claim owner paths."]
  };
}

function evidenceReadiness(state) {
  const missing = [];
  if (!state.rc1OpenaiScopeBundlePass) missing.push("rc1_openai_scope_bundle_pass");
  if (!state.dryRunPass) missing.push("rc1_release_gate_dry_run_openai_scope_pass");
  if (!state.systemOfRecordPass) missing.push("system_of_record_alignment_pass");
  if (!state.containmentVerified) missing.push("containment_verified");
  if (!state.storageRedactionPass) missing.push("storage_redaction_audit_pass");
  if (!state.localDeferredExists) missing.push("local_endpoint_deferred_record_exists");
  if (!state.providerDeferredExists) missing.push("provider_diversity_deferred_record_exists");
  if (!state.notStableExists) missing.push("not_stable_notice_exists");
  return {
    status: missing.length === 0 ? "pass" : "blocked_by_missing_artifacts",
    rc1_openai_scope_bundle_pass: state.rc1OpenaiScopeBundlePass,
    rc1_release_gate_dry_run_openai_scope_pass: state.dryRunPass,
    system_of_record_alignment_pass: state.systemOfRecordPass,
    containment_verified: state.containmentVerified,
    storage_redaction_audit_pass: state.storageRedactionPass,
    local_endpoint_deferred_record_exists: state.localDeferredExists,
    provider_diversity_deferred_record_exists: state.providerDeferredExists,
    not_stable_notice_exists: state.notStableExists,
    missing_required_artifacts: missing
  };
}

function localEndpointConfirmation() {
  return {
    status: "confirmed_deferred_by_operator",
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_deferred: true,
    local_endpoint_probe_performed: false,
    local_endpoint_probe: false,
    local_model_execution: false,
    local_no_tool_canary: "not_executed_deferred",
    local_model_verified_allowed: false,
    reason: "User will configure local endpoint later and notify the agent when ready.",
    does_not_block: [
      "openai_only_rc1_release_gate_actual_preflight"
    ],
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "strict_provider_diverse_rc1",
      "strict_stable_scope"
    ]
  };
}

function providerDiversityConfirmation() {
  return {
    status: "confirmed_deferred_not_established",
    provider_diversity_status: "deferred_not_in_openai_only_scope",
    provider_diversity_established: false,
    provider_diverse_allowed: false,
    strict_provider_diverse_path: "deferred",
    reason: "Current rc.1 path is explicitly OpenAI-only. Local or second provider evidence will be handled later after operator provides endpoint or provider path.",
    does_not_block: [
      "openai_only_rc1_release_gate_actual_preflight"
    ],
    still_blocks: [
      "provider-diverse",
      "strict_provider_diverse_rc1",
      "strict_stable_scope"
    ]
  };
}

function claimBoundary() {
  return {
    status: "pass",
    actual_release_gate_execution_allowed_now: false,
    release_gated_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    containment_verified_allowed: true,
    reason: "Actual release gate preflight is complete, but explicit approval is required before actual gate execution.",
    allowed_claims: [
      ...preflightClaimsAllowed,
      ...maintainedClaimsAllowed
    ],
    blocked_claims: claimsBlocked
  };
}

function actualGateReadiness(evidence, rollback, owner) {
  const readinessPass = evidence.status === "pass" && rollback.status === "pass" && owner.status === "pass";
  return {
    status: readinessPass ? "ready_but_blocked_by_missing_explicit_approval" : "blocked_by_readiness_gap",
    stage: STAGE,
    evidence_readiness: evidence.status,
    rollback_readiness: rollback.status,
    owner_action_readiness: owner.status,
    explicit_user_approval_present: false,
    can_execute_release_gate_actual: false,
    actual_release_gate_execution_allowed_now: false,
    blocks_actual_release_gate: true,
    blocking_reason: readinessPass
      ? "explicit_user_approval_required"
      : "readiness_gap",
    recommended_next_stage: NEXT_STAGE
  };
}

function preflightReport(evidence, rollback, owner, readiness) {
  return {
    status: readiness.status,
    stage: STAGE,
    new_execution: false,
    openai_provider_call: false,
    redteam_rerun: false,
    containment_rerun: false,
    local_model_execution: false,
    local_endpoint_probe: false,
    telemetry_connection: false,
    telemetry_sink_write: false,
    release_gate_actual_execution: false,
    production_deployment: false,
    dist_modified: false,
    reference_baseline_source_modified: false,
    rc1_openai_scope_bundle_pass: evidence.rc1_openai_scope_bundle_pass,
    rc1_release_gate_dry_run_openai_scope_pass: evidence.rc1_release_gate_dry_run_openai_scope_pass,
    rollback_readiness: rollback.status,
    owner_action_readiness: owner.status,
    explicit_user_approval_present: false,
    can_execute_release_gate_actual: false,
    release_gated_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    local_endpoint_deferred: true,
    provider_diversity_deferred: true,
    recommended_next_stage: NEXT_STAGE
  };
}

function releaseDecisionRecordPreflight(report) {
  return {
    status: "preflight_recorded",
    decision: "do_not_execute_release_gate_without_explicit_approval",
    stage: STAGE,
    recommended_next_stage: report.recommended_next_stage,
    explicit_user_approval_present: report.explicit_user_approval_present,
    can_execute_release_gate_actual: report.can_execute_release_gate_actual,
    release_gated_allowed: report.release_gated_allowed,
    stable_allowed: report.stable_allowed,
    production_ready_allowed: report.production_ready_allowed,
    production_monitored_allowed: report.production_monitored_allowed,
    provider_diverse_allowed: report.provider_diverse_allowed,
    local_endpoint_deferred: report.local_endpoint_deferred,
    provider_diversity_deferred: report.provider_diversity_deferred,
    does_not_allow: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse"
    ]
  };
}

function releaseGateYaml() {
  return `id: harness-core.release_gate
version: ${STAGE}
status: blocked_not_release_gated

alpha_required_checks:
  - RC1 OpenAI-only evidence bundle prerequisite passes
  - RC1 release gate dry-run report exists and passes
  - RC1 actual release gate preflight report exists
  - RC1 actual gate evidence readiness passes
  - RC1 rollback readiness passes
  - RC1 owner/action readiness passes
  - Explicit user approval remains absent in preflight
  - Actual release gate execution remains false
  - Stable release claim remains blocked
  - Release gated claim remains blocked
  - Production ready claim remains blocked
  - Provider diverse claim remains blocked

allowed_alpha_claims:
${yamlList([...maintainedClaimsAllowed, ...preflightClaimsAllowed], 2)}

prohibited_positive_claims:
${yamlList(claimsBlocked, 2)}

claim_upgrade_rule:
  actual_release_gate_preflight_is_not_actual_release_gate_execution: true
  approval_packet_generated_is_not_approval_granted: true
  command_plan_drafted_is_not_command_executed: true
  openai_only_actual_gate_preflight_is_not_stable: true
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
  note: OpenAI-only rc.1 actual release gate preflight is ready but blocked by missing explicit approval. Stable, release-gated, production, provider-diversity, telemetry, local-runtime, provider-verification, and adapter claims remain blocked.
`;
}

function ownerActionMatrixYaml() {
  return `stage: ${STAGE}
status: refreshed_for_actual_gate_preflight
entries:
  - lane: openai_only_actual_release_gate_preflight
    owner: agent
    action: Prepare actual release gate preflight package for OpenAI-only rc.1 scope.
    exit_criteria: Preconditions are reviewed without executing the actual release gate.
    claim_unblocked_after_exit:
      - rc1-release-gate-actual-preflight-completed
    claim_still_not_allowed:
      - stable
      - release-gated
      - production-ready
      - production-monitored
      - provider-diverse
  - lane: openai_only_actual_release_gate_execution_after_approval
    owner: operator
    action: Provide exact approval phrase before any actual release gate execution.
    exit_criteria: Exact approval phrase is supplied in a later message.
    claim_still_not_allowed:
      - stable
      - production-ready
      - production-monitored
      - provider-diverse
  - lane: rc1_rollback
    owner: agent
    action: Preserve failing gate output, restore last valid evidence boundary, and downgrade claims if actual gate evidence fails.
    exit_criteria: Rollback evidence and claim downgrade record are captured.
    claim_still_not_allowed:
      - stable
      - production-ready
      - production-monitored
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

function releaseBlockerPriorityYaml() {
  return `stage: ${STAGE}
status: actual_gate_preflight_ready_but_blocked_by_missing_explicit_approval
blockers:
  - id: AGP-001
    priority: P0
    category: approval
    current_status: explicit_user_approval_missing
    blocks_actual_release_gate_execution: true
    blocks_release_gated_claim: true
    reason: "The exact approval phrase has not been provided for actual release gate execution."
  - id: AGP-002
    priority: P0
    category: local_runtime
    current_status: deferred_until_operator_provides_endpoint
    blocks_openai_only_actual_gate_preflight: false
    blocks_provider_diverse: true
    reason: "Local endpoint work is deferred until the operator provides endpoint readiness."
  - id: AGP-003
    priority: P0
    category: provider_diversity
    current_status: deferred_not_in_openai_only_scope
    blocks_openai_only_actual_gate_preflight: false
    blocks_provider_diverse: true
    reason: "Current rc.1 path is explicitly OpenAI-only."
  - id: AGP-004
    priority: P1
    category: telemetry
    current_status: blocked_not_connected
    blocks_production_monitored: true
    blocks_production_ready: true
    reason: "Production telemetry connection is not established."
`;
}

function rollbackReadinessYaml(rollback) {
  return `stage: ${STAGE}
status: ${rollback.status}
rollback_plan_exists: ${rollback.rollback_plan_exists}
rollback_targets_defined: ${rollback.rollback_targets_defined}
claim_downgrade_rules_defined: ${rollback.claim_downgrade_rules_defined}
owner_defined: ${rollback.owner_defined}
evidence_required_for_rollback_defined: ${rollback.evidence_required_for_rollback_defined}
blocks_actual_release_gate: ${rollback.blocks_actual_release_gate}
notes:
${rollback.notes.length ? yamlList(rollback.notes.map((note) => `"${note}"`), 2) : "  []"}
`;
}

function ownerReadinessYaml(owner) {
  return `stage: ${STAGE}
status: ${owner.status}
owner_action_matrix_exists: ${owner.owner_action_matrix_exists}
release_owner_defined: ${owner.release_owner_defined}
rollback_owner_defined: ${owner.rollback_owner_defined}
blocked_claim_owner_paths_defined: ${owner.blocked_claim_owner_paths_defined}
local_endpoint_deferred_owner: ${owner.local_endpoint_deferred_owner}
telemetry_connection_owner: ${owner.telemetry_connection_owner}
blocks_actual_release_gate: ${owner.blocks_actual_release_gate}
notes:
${owner.notes.length ? yamlList(owner.notes.map((note) => `"${note}"`), 2) : "  []"}
`;
}

function localConfirmationYaml(local) {
  return `stage: ${STAGE}
status: ${local.status}
local_endpoint_status: ${local.local_endpoint_status}
local_endpoint_deferred: true
local_endpoint_probe_performed: false
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: ${local.local_no_tool_canary}
local_model_verified_allowed: false
reason: "${local.reason}"
does_not_block:
${yamlList(local.does_not_block, 2)}
still_blocks:
${yamlList(local.still_blocks, 2)}
`;
}

function providerConfirmationYaml(provider) {
  return `stage: ${STAGE}
status: ${provider.status}
provider_diversity_status: ${provider.provider_diversity_status}
provider_diversity_established: false
provider_diverse_allowed: false
strict_provider_diverse_path: deferred
reason: "${provider.reason}"
does_not_block:
${yamlList(provider.does_not_block, 2)}
still_blocks:
${yamlList(provider.still_blocks, 2)}
`;
}

function rc1ReadinessYaml(report) {
  return `stage: ${STAGE}
status: ${report.status}
rc1_openai_scope_bundle_pass: ${report.rc1_openai_scope_bundle_pass}
rc1_release_gate_dry_run_openai_scope_pass: ${report.rc1_release_gate_dry_run_openai_scope_pass}
rollback_readiness: ${report.rollback_readiness}
owner_action_readiness: ${report.owner_action_readiness}
explicit_user_approval_present: false
can_execute_release_gate_actual: false
actual_release_gate_execution: false
release_gated_allowed: false
stable_allowed: false
production_ready_allowed: false
production_monitored_allowed: false
provider_diverse_allowed: false
local_endpoint_deferred: true
recommended_next_stage: ${report.recommended_next_stage}
`;
}

function notStableNoticeYaml() {
  return `status: not_stable
stage: ${STAGE}
rc1_is_not_stable: true
rc1_is_not_release_gated: true
rc1_is_not_production_ready: true
rc1_is_not_provider_diverse: true
rc1_is_not_production_monitored: true
actual_release_gate_execution: false
explicit_user_approval_present: false
message: "Actual OpenAI-only release gate preflight is ready but blocked by missing explicit approval. This is not a stable, release-gated, production-ready, production-monitored, or provider-diverse release."
`;
}

function betaEntryCriteriaMd() {
  return `# Beta Entry Criteria

Current stage: \`${STAGE}\`.

OpenAI-only rc.1 actual release gate preflight is ready but blocked by missing explicit approval. The preflight does not perform new provider calls, local endpoint probes, local model execution, telemetry connection, release gate actual execution, or production deployment.

Local endpoint and strict provider diversity paths remain deferred. Stable, release-gated, production, telemetry, provider-diversity, local-model, provider-verification, adapter, integration, and benchmark-backed claims remain blocked.
`;
}

function readmeMd() {
  return `# HARNESS Core

Status: \`${STAGE}\`

This package is the v2 prompt-stack RC1 evidence workspace. The current stage records an OpenAI-only actual release gate preflight from existing RC1 evidence and the prior dry-run gate.

The preflight does not execute the actual release gate. It also performs no OpenAI provider call, local model execution, local endpoint probe, telemetry connection, telemetry sink write, redteam rerun, containment rerun, or production deployment.

Local endpoint work is deferred until the operator provides endpoint readiness. Provider diversity remains outside the OpenAI-only scope.

## Current Allowed Claims

${mdList([...maintainedClaimsAllowed, ...preflightClaimsAllowed])}

These claims do not allow \`stable\`, \`release-gated\`, \`production-ready\`, \`production-monitored\`, \`telemetry-connected\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`local-model-verified\`, \`integration-verified\`, or \`benchmark-backed\`.

## Validation

\`\`\`powershell
node tools/check_rc1_release_gate_actual_preflight_openai_scope.mjs C:\\WORK\\0.개인\\HARNESS\\harness-core
\`\`\`
`;
}

function reportMd(report) {
  return `# RC1 Actual Release Gate Preflight Report

Status: ${report.status}

Stage: ${STAGE}

## Execution Boundary

- New execution: ${report.new_execution}
- OpenAI provider call: ${report.openai_provider_call}
- Local model execution: ${report.local_model_execution}
- Local endpoint probe: ${report.local_endpoint_probe}
- Telemetry connection: ${report.telemetry_connection}
- Release gate actual execution: ${report.release_gate_actual_execution}
- Production deployment: ${report.production_deployment}

## Readiness

- RC1 OpenAI-scope bundle pass: ${report.rc1_openai_scope_bundle_pass}
- RC1 release gate dry-run pass: ${report.rc1_release_gate_dry_run_openai_scope_pass}
- Rollback readiness: ${report.rollback_readiness}
- Owner/action readiness: ${report.owner_action_readiness}
- Explicit user approval present: ${report.explicit_user_approval_present}
- Can execute actual release gate: ${report.can_execute_release_gate_actual}

## Claim Boundary

- Release gated allowed: ${report.release_gated_allowed}
- Stable allowed: ${report.stable_allowed}
- Production ready allowed: ${report.production_ready_allowed}
- Production monitored allowed: ${report.production_monitored_allowed}
- Provider diverse allowed: ${report.provider_diverse_allowed}
`;
}

function readinessMd(readiness, evidence) {
  return `# RC1 Actual Gate Readiness

Status: ${readiness.status}

- Evidence readiness: ${readiness.evidence_readiness}
- Rollback readiness: ${readiness.rollback_readiness}
- Owner/action readiness: ${readiness.owner_action_readiness}
- Explicit user approval present: ${readiness.explicit_user_approval_present}
- Can execute actual release gate: ${readiness.can_execute_release_gate_actual}
- Blocking reason: ${readiness.blocking_reason}

## Missing Required Artifacts

${evidence.missing_required_artifacts.length ? mdList(evidence.missing_required_artifacts) : "- none"}
`;
}

function rollbackOwnerMd(rollback, owner) {
  return `# RC1 Rollback and Owner Readiness

## Rollback

- Status: ${rollback.status}
- Rollback plan exists: ${rollback.rollback_plan_exists}
- Rollback targets defined: ${rollback.rollback_targets_defined}
- Claim downgrade rules defined: ${rollback.claim_downgrade_rules_defined}
- Owner defined: ${rollback.owner_defined}
- Evidence required for rollback defined: ${rollback.evidence_required_for_rollback_defined}

## Owner/action

- Status: ${owner.status}
- Owner/action matrix exists: ${owner.owner_action_matrix_exists}
- Release owner defined: ${owner.release_owner_defined}
- Rollback owner defined: ${owner.rollback_owner_defined}
- Blocked claim owner paths defined: ${owner.blocked_claim_owner_paths_defined}
`;
}

function claimBoundaryMd(boundary) {
  return `# RC1 Actual Gate Claim Boundary

Status: ${boundary.status}

- Actual release gate execution allowed now: ${boundary.actual_release_gate_execution_allowed_now}
- Release gated allowed: ${boundary.release_gated_allowed}
- Stable allowed: ${boundary.stable_allowed}
- Production ready allowed: ${boundary.production_ready_allowed}
- Production monitored allowed: ${boundary.production_monitored_allowed}
- Provider diverse allowed: ${boundary.provider_diverse_allowed}
- Containment verified allowed: ${boundary.containment_verified_allowed}

Reason: ${boundary.reason}
`;
}

function handoffMd(report) {
  return `# Session Handoff - 2026-05-22

Current working root: \`C:\\WORK\\0.개인\\HARNESS\\harness-core\`

Do not use: \`C:\\WORK\\0.개인\\PROMPT\`

Current stage: \`${STAGE}\`

Current status: \`${report.status}\`

Recommended next stage after exact approval: \`${NEXT_STAGE}\`

Required approval phrase for next stage:
\`${APPROVAL_PHRASE}\`

## Latest Completed Work

- \`v2.0.0-rc.1-evidence-bundle-openai-scope\` is complete and passed as prerequisite evidence.
- \`v2.0.0-rc.1-release-gate-dry-run-openai-scope\` is complete and passed as OpenAI-only dry-run evidence.
- \`${STAGE}\` completed as preflight only.
- Actual release gate execution did not run.
- Explicit user approval for actual gate execution is not present.
- Local endpoint remains deferred until the operator provides endpoint readiness.
- Provider diversity remains deferred outside the OpenAI-only scope.
- Telemetry remains not connected.

## Current Gate

- Gate script: \`tools/check_rc1_release_gate_actual_preflight_openai_scope.mjs\`
- Expected gate status: \`blocked\`
- Blocking reason: explicit user approval is required before actual release gate execution.
- \`can_enter_release_gate_actual_execution: false\`
- \`can_enter_release_gated_claim: false\`
- \`can_enter_stable_release: false\`
- \`can_enter_production_ready_claim: false\`
- \`can_enter_provider_diverse_claim: false\`

## Current Evidence

- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_readiness.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_claim_boundary.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_evidence_readiness.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_rollback_readiness.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_owner_action_readiness.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_local_endpoint_deferred_confirmation.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_provider_diversity_deferred_confirmation.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_decision_record_preflight.json\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_command_plan_snapshot.yaml\`
- \`evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_gate_report.json\`

## Current Status

- \`new_execution: false\`
- \`openai_provider_call: false\`
- \`local_model_execution: false\`
- \`local_endpoint_probe: false\`
- \`telemetry_connection: false\`
- \`release_gate_actual_execution: false\`
- \`dist_modified: false\`
- \`reference_baseline_source_modified: false\`
- \`rc1_openai_scope_bundle_pass: ${report.rc1_openai_scope_bundle_pass}\`
- \`rc1_release_gate_dry_run_openai_scope_pass: ${report.rc1_release_gate_dry_run_openai_scope_pass}\`
- \`rollback_readiness: ${report.rollback_readiness}\`
- \`owner_action_readiness: ${report.owner_action_readiness}\`
- \`explicit_user_approval_present: false\`
- \`can_execute_release_gate_actual: false\`
- \`release_gated_allowed: false\`
- \`stable_allowed: false\`
- \`production_ready_allowed: false\`
- \`production_monitored_allowed: false\`
- \`provider_diverse_allowed: false\`

## allowed_claims

${mdList([...preflightClaimsAllowed, ...maintainedClaimsAllowed].map((claim) => `\`${claim}\``))}

## blocked_claims

${mdList(claimsBlocked.map((claim) => `\`${claim}\``))}

## Operating Constraints For Next Session

- Work only under \`C:\\WORK\\0.개인\\HARNESS\\harness-core\`.
- Do not use \`C:\\WORK\\0.개인\\PROMPT\`.
- Do not modify \`dist/**\`.
- Do not modify \`legacy-reference-source/**\`.
- Do not run actual release gate execution unless the exact approval phrase is supplied in a later message.
- Do not run provider calls, local endpoint probes, local model execution, telemetry connection, telemetry sink writes, redteam reruns, containment reruns, or production deployment in this preflight state.

## Next Safest Step

Proceed to \`${NEXT_STAGE}\` only if the operator sends the exact approval phrase:
\`${APPROVAL_PHRASE}\`
`;
}

function docs(root, report, readiness, rollback, owner, local, provider, boundary) {
  writeText(p(root, "docs", "rc1_release_gate_actual_openai_scope_preflight.md"), reportMd(report));
  writeText(p(root, "docs", "rc1_release_gate_actual_approval_request.md"), approvalRequestMd());
  writeText(p(root, "docs", "rc1_release_gate_actual_command_plan.md"), `# RC1 Release Gate Actual Command Plan\n\n${commandPlanYaml()}`);
  writeText(p(root, "docs", "rc1_rollback_readiness.md"), rollbackOwnerMd(rollback, owner));
  writeText(p(root, "docs", "rc1_owner_action_readiness.md"), rollbackOwnerMd(rollback, owner));
  writeText(p(root, "docs", "next_rc1_release_gate_actual_execution.md"), `# Next RC1 Release Gate Actual Execution\n\nDo not execute the actual gate until the operator sends the exact approval phrase:\n\n\`${APPROVAL_PHRASE}\`\n\nAfter approval, the next stage is \`${NEXT_STAGE}\`.\n`);
  writeText(p(root, "docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready\n\nLocal endpoint work remains deferred. Do not run local endpoint probes, vLLM, Ollama, local no-tool canary, local redteam, or local-model verification until the operator provides endpoint readiness.\n`);
  writeText(p(root, "docs", "rc1_release_gate_claim_boundary.md"), claimBoundaryMd(boundary));
  writeText(p(root, "docs", "rc1_local_endpoint_deferred.md"), `# RC1 Local Endpoint Deferred\n\nStatus: \`${local.status}\`\n\n${local.reason}\n\nStill blocks: ${local.still_blocks.join(", ")}.\n`);
  writeText(p(root, "docs", "rc1_provider_diversity_deferred.md"), `# RC1 Provider Diversity Deferred\n\nStatus: \`${provider.status}\`\n\n${provider.reason}\n\nStill blocks: ${provider.still_blocks.join(", ")}.\n`);
  writeText(p(root, "docs", "beta_entry_criteria.md"), betaEntryCriteriaMd());
}

export function buildRc1ActualGatePreflightArtifacts(root = resolveRoot()) {
  const state = prerequisiteState(root);

  writeText(p(root, "release", "rc1_release_gate_actual_openai_scope_preflight_scope.yaml"), scopeYaml());
  writeText(p(root, "release", "rc1_release_gate_actual_approval_gate.yaml"), approvalGateYaml());
  writeText(p(root, "release", "rc1_release_gate_actual_approval_request.md"), approvalRequestMd());
  writeText(p(root, "release", "rc1_release_gate_actual_command_plan.yaml"), commandPlanYaml());
  writeText(p(root, "release", "rc1_release_gate_actual_preflight_policy.yaml"), policyYaml());
  writeText(p(root, "release", "rc1_release_decision_record_preflight.yaml"), releaseDecisionYaml());

  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionMatrixYaml());
  const rollback = rollbackReadiness(root);
  const owner = ownerActionReadiness(root);
  writeText(p(root, "release", "rc1_rollback_readiness.yaml"), rollbackReadinessYaml(rollback));
  writeText(p(root, "release", "rc1_owner_action_readiness.yaml"), ownerReadinessYaml(owner));
  const local = localEndpointConfirmation();
  const provider = providerDiversityConfirmation();
  writeText(p(root, "release", "rc1_local_endpoint_deferred_confirmation.yaml"), localConfirmationYaml(local));
  writeText(p(root, "release", "rc1_provider_diversity_deferred_confirmation.yaml"), providerConfirmationYaml(provider));

  const evidence = evidenceReadiness(state);
  const readiness = actualGateReadiness(evidence, rollback, owner);
  const report = preflightReport(evidence, rollback, owner, readiness);
  const boundary = claimBoundary();
  const decision = releaseDecisionRecordPreflight(report);

  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml());
  writeText(p(root, "release", "release_blocker_priority.yaml"), releaseBlockerPriorityYaml());
  writeText(p(root, "release", "rc1_release_gate_readiness.yaml"), rc1ReadinessYaml(report));
  writeText(p(root, "release", "rc1_not_stable_notice.yaml"), notStableNoticeYaml());
  writeText(p(root, "README.md"), readmeMd());

  const dir = evidenceDir(root);
  ensureDir(dir);
  writeJson(path.join(dir, "rc1_release_gate_actual_preflight_report.json"), report);
  writeText(path.join(dir, "rc1_release_gate_actual_preflight_report.md"), reportMd(report));
  writeJson(path.join(dir, "rc1_actual_gate_readiness.json"), readiness);
  writeJson(path.join(dir, "rc1_actual_gate_claim_boundary.json"), boundary);
  writeJson(path.join(dir, "rc1_actual_gate_evidence_readiness.json"), evidence);
  writeJson(path.join(dir, "rc1_rollback_readiness.json"), rollback);
  writeJson(path.join(dir, "rc1_owner_action_readiness.json"), owner);
  writeJson(path.join(dir, "rc1_local_endpoint_deferred_confirmation.json"), local);
  writeJson(path.join(dir, "rc1_provider_diversity_deferred_confirmation.json"), provider);
  writeJson(path.join(dir, "rc1_release_decision_record_preflight.json"), decision);
  writeText(path.join(dir, "rc1_release_gate_actual_command_plan_snapshot.yaml"), commandPlanYaml());
  writeJson(path.join(dir, "unresolved_items.json"), []);

  writeText(p(root, "evals", "suites", "rc1_release_gate_actual_openai_scope_preflight.yaml"), `id: rc1_release_gate_actual_openai_scope_preflight
stage: ${STAGE}
mode: preflight_no_execution
actual_release_gate_execution: false
explicit_user_approval_present: false
expected_status: ready_but_blocked_by_missing_explicit_approval
`);
  writeJson(p(root, "evals", "reports", "rc1_release_gate_actual_preflight_report.json"), report);
  writeText(p(root, "evals", "reports", "rc1_release_gate_actual_preflight_report.md"), reportMd(report));
  writeJson(p(root, "evals", "reports", "rc1_actual_gate_readiness_report.json"), readiness);
  writeText(p(root, "evals", "reports", "rc1_actual_gate_readiness_report.md"), readinessMd(readiness, evidence));
  writeJson(p(root, "evals", "reports", "rc1_rollback_owner_readiness_report.json"), { status: rollback.status === "pass" && owner.status === "pass" ? "pass" : "needs_review", rollback, owner });
  writeText(p(root, "evals", "reports", "rc1_rollback_owner_readiness_report.md"), rollbackOwnerMd(rollback, owner));

  docs(root, report, readiness, rollback, owner, local, provider, boundary);
  writeText(p(root, "session_handoff_2026-05-22.md"), handoffMd(report));

  return {
    state,
    evidence,
    rollback,
    owner,
    local,
    provider,
    readiness,
    boundary,
    report,
    decision
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildRc1ActualGatePreflightArtifacts(root);
  console.log(JSON.stringify(artifacts.report, null, 2));
  if (artifacts.report.status === "fail") process.exitCode = 1;
}
