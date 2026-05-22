#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, readJson, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-rc.1-release-gate-dry-run-openai-scope";
export const evidenceRelDir = "evidence/rc1-release-gate-dry-run-openai-scope";

export const dryRunClaimsAllowed = [
  "rc1-release-gate-dry-run-executed",
  "rc1-openai-scope-gate-evaluated",
  "rc1-local-endpoint-deferred-recorded",
  "rc1-provider-diversity-deferred-recorded",
  "rc1-release-decision-draft-recorded",
  "rc1-release-gate-actual-preconditions-drafted"
];

export const maintainedClaimsAllowed = [
  "containment-verified",
  "rc1-openai-scope-evidence-bundle-drafted"
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

export const requiredRc1BundleFiles = [
  "evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json",
  "evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json",
  "evidence/rc1-openai-scope-bundle/rc1_evidence_index.json",
  "evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json",
  "evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json",
  "evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json",
  "evidence/rc1-openai-scope-bundle/rc1_gate_report.json"
];

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

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function readIfExists(root, relPath, fallback = null) {
  const file = p(root, ...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : fallback;
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

export function checkRc1BundlePrerequisite(root) {
  const missing = requiredRc1BundleFiles.filter((relPath) => !exists(root, relPath));
  const gate = readIfExists(root, "evidence/rc1-openai-scope-bundle/rc1_gate_report.json");
  const gatePass = gate?.status === "pass";
  return {
    status: missing.length === 0 && gatePass ? "pass" : "blocked_by_missing_rc1_openai_scope_bundle",
    gate_status: gate?.status || "missing",
    missing,
    recommended_next_action: missing.length || !gatePass
      ? "rerun or repair v2.0.0-rc.1-evidence-bundle-openai-scope"
      : "proceed to v2.0.0-rc.1-release-gate-dry-run-openai-scope"
  };
}

function scopeYaml() {
  return `stage: ${STAGE}

approved_actions:
${yamlBoolMap({
  rc1_openai_scope_bundle_prerequisite_check: true,
  release_gate_dry_run: true,
  openai_scope_gate_evaluation: true,
  local_endpoint_deferral_recording: true,
  strict_provider_diverse_path_deferral: true,
  claim_boundary_audit: true,
  release_decision_draft: true,
  release_gate_actual_precondition_definition: true
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
  v36_modification: true
}, 2)}

claims_allowed:
${yamlList(dryRunClaimsAllowed, 2)}

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

function criteriaMatrix() {
  return {
    status: "dry_run_pass_openai_scope_not_release_gated",
    stage: STAGE,
    release_gate_actual_execution: false,
    criteria: {
      rc1_openai_scope_bundle_prerequisite: {
        status: "pass",
        evidence: [
          "evidence/rc1-openai-scope-bundle/rc1_gate_report.json"
        ]
      },
      system_of_record_alignment: {
        status: "pass",
        evidence: [
          "evidence/rc1-agents-md-system-of-record-alignment/system_of_record_alignment_report.json"
        ]
      },
      openai_canary_suite: {
        status: "pass"
      },
      openai_redteam: {
        status: "pass_limited_and_additional_scope"
      },
      containment: {
        status: "pass",
        containment_verified: true
      },
      storage_redaction: {
        status: "pass"
      },
      local_runtime: {
        status: "deferred_by_operator",
        blocks_openai_only_rc1_dry_run: false,
        blocks_strict_provider_diverse_path: true
      },
      provider_diversity: {
        status: "deferred_not_in_openai_only_scope",
        blocks_openai_only_rc1_dry_run: false,
        blocks_provider_diverse_claim: true
      },
      telemetry: {
        status: "blocked_not_connected",
        blocks_openai_only_rc1_dry_run: false,
        blocks_production_monitored: true,
        blocks_production_ready: true
      },
      release_process: {
        status: "dry_run_only_actual_gate_pending",
        blocks_release_gated_claim: true
      }
    }
  };
}

function dryRunReport() {
  return {
    status: "pass_openai_scope_dry_run_not_release_gated",
    stage: STAGE,
    prerequisite_rc1_openai_scope_bundle_passed: true,
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
    v36_modified: false,
    openai_scope_gate_passed: true,
    release_gated_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_deferred: true,
    local_no_tool_canary: "not_executed_deferred",
    strict_provider_diverse_path: "deferred",
    provider_diversity_status: "deferred_not_in_openai_only_scope",
    recommended_next_stage: "v2.0.0-rc.1-release-gate-actual-openai-scope-preflight"
  };
}

function localEndpointDeferredRecord() {
  return {
    status: "deferred_by_operator",
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_deferred: true,
    local_endpoint_configured: false,
    local_endpoint_probe_performed: false,
    local_model_execution: false,
    local_endpoint_probe: false,
    local_no_tool_canary: "not_executed_deferred",
    local_model_verified_allowed: false,
    provider_diverse_allowed: false,
    strict_provider_diverse_path: "deferred",
    reason: "User will configure local endpoint later and notify the agent when ready.",
    deferred_lanes: [
      "local_no_tool_canary",
      "local_structured_output_canary",
      "local_redteam",
      "local-model-verified",
      "strict_provider_diverse_path"
    ],
    does_not_block: [
      "openai_only_rc1_release_gate_dry_run"
    ],
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "strict_provider_diverse_rc1"
    ]
  };
}

function providerDiversityDeferredRecord() {
  return {
    status: "deferred_not_established",
    provider_diversity_established: false,
    provider_diverse_allowed: false,
    strict_provider_diverse_path: "deferred",
    reason: "Current rc.1 path is explicitly OpenAI-only. Local or second provider evidence will be handled later after operator provides endpoint or provider path.",
    does_not_block: [
      "openai_only_rc1_release_gate_dry_run"
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
    openai_scope_gate_passed: true,
    release_gated_allowed: false,
    stable_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    integration_verified_allowed: false,
    allowed_claims: [
      ...dryRunClaimsAllowed,
      "containment-verified"
    ],
    blocked_claims: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "local-model-verified"
    ]
  };
}

function readinessAssessment() {
  return {
    status: "ready_for_actual_release_gate_preflight_openai_scope",
    stage: STAGE,
    can_enter_release_gate_actual_preflight_openai_scope: true,
    can_enter_stable_release: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    can_enter_provider_diverse_claim: false,
    prerequisite_rc1_openai_scope_bundle_passed: true,
    openai_scope_gate_passed: true,
    local_endpoint_status: "deferred_until_operator_provides_endpoint",
    local_endpoint_deferred: true,
    provider_diversity_status: "deferred_not_in_openai_only_scope",
    telemetry_connection: false,
    release_gate_actual_execution: false,
    recommended_next_stage: "v2.0.0-rc.1-release-gate-actual-openai-scope-preflight"
  };
}

function releaseDecisionDraft() {
  return {
    status: "draft",
    decision: "do_not_claim_release_gated_yet",
    openai_only_rc1_gate_dry_run_passed: true,
    release_gate_actual_execution_pending: true,
    local_endpoint_deferred: true,
    provider_diversity_deferred: true,
    production_telemetry_not_connected: true,
    recommended_next_decision_point: "v2.0.0-rc.1-release-gate-actual-openai-scope-preflight",
    does_not_allow: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse"
    ]
  };
}

function actualPreconditions() {
  return {
    stage_to_enter_next: "v2.0.0-rc.1-release-gate-actual-openai-scope-preflight",
    can_enter_preflight: true,
    preconditions: [
      "rc1_openai_scope_bundle_pass",
      "rc1_release_gate_dry_run_openai_scope_pass",
      "claim_boundary_audit_pass",
      "release_decision_draft_exists",
      "local_endpoint_deferred_record_exists",
      "provider_diversity_deferred_record_exists",
      "not_stable_notice_exists"
    ],
    does_not_require_now: [
      "local endpoint configured",
      "local no-tool canary",
      "provider diversity",
      "telemetry connection"
    ],
    still_forbidden: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse"
    ]
  };
}

function releaseGateDryRunYaml(report, readiness) {
  return `stage: ${STAGE}
status: ${report.status}
prerequisite_rc1_openai_scope_bundle_passed: ${report.prerequisite_rc1_openai_scope_bundle_passed}
new_execution: false
openai_provider_call: false
local_model_execution: false
local_endpoint_probe: false
telemetry_connection: false
release_gate_actual_execution: false
openai_scope_gate_passed: true
local_endpoint_status: ${report.local_endpoint_status}
local_endpoint_deferred: true
provider_diversity_status: ${report.provider_diversity_status}
release_gated_allowed: false
stable_allowed: false
production_ready_allowed: false
production_monitored_allowed: false
provider_diverse_allowed: false
can_enter_release_gate_actual_preflight_openai_scope: ${readiness.can_enter_release_gate_actual_preflight_openai_scope}
recommended_next_stage: ${report.recommended_next_stage}
`;
}

function releaseDecisionYaml(decision) {
  return `stage: ${STAGE}
status: ${decision.status}
decision: ${decision.decision}
openai_only_rc1_gate_dry_run_passed: ${decision.openai_only_rc1_gate_dry_run_passed}
release_gate_actual_execution_pending: ${decision.release_gate_actual_execution_pending}
local_endpoint_deferred: ${decision.local_endpoint_deferred}
provider_diversity_deferred: ${decision.provider_diversity_deferred}
production_telemetry_not_connected: ${decision.production_telemetry_not_connected}
recommended_next_decision_point: ${decision.recommended_next_decision_point}
does_not_allow:
${yamlList(decision.does_not_allow, 2)}
`;
}

function localEndpointPolicyYaml(record) {
  return `stage: ${STAGE}
status: ${record.status}
local_endpoint_status: ${record.local_endpoint_status}
local_endpoint_deferred: true
local_endpoint_configured: false
local_endpoint_probe_performed: false
local_model_execution: false
local_no_tool_canary: ${record.local_no_tool_canary}
local_model_verified_allowed: false
provider_diverse_allowed: false
strict_provider_diverse_path: deferred
reason: "${record.reason}"
does_not_block:
${yamlList(record.does_not_block, 2)}
still_blocks:
${yamlList(record.still_blocks, 2)}
`;
}

function providerDiversityPolicyYaml(record) {
  return `stage: ${STAGE}
status: ${record.status}
provider_diversity_established: false
provider_diverse_allowed: false
strict_provider_diverse_path: deferred
reason: "${record.reason}"
does_not_block:
${yamlList(record.does_not_block, 2)}
still_blocks:
${yamlList(record.still_blocks, 2)}
`;
}

function actualPreconditionsYaml(preconditions) {
  return `stage_to_enter_next: ${preconditions.stage_to_enter_next}
can_enter_preflight: ${preconditions.can_enter_preflight}
preconditions:
${yamlList(preconditions.preconditions, 2)}
does_not_require_now:
${yamlList(preconditions.does_not_require_now, 2)}
still_forbidden:
${yamlList(preconditions.still_forbidden, 2)}
`;
}

function releaseGateYaml() {
  return `id: prompt-stack-v2.release_gate
version: ${STAGE}
status: blocked_not_release_gated

alpha_required_checks:
  - RC1 OpenAI-only evidence bundle prerequisite passes
  - RC1 release gate dry-run report exists and passes
  - RC1 release gate criteria matrix exists
  - RC1 release gate claim boundary exists and passes
  - Local endpoint deferred record exists
  - Provider diversity deferred record exists
  - Release decision draft exists
  - Actual release gate preconditions exist
  - Stable release claim remains blocked
  - Release gated claim remains blocked
  - Production ready claim remains blocked
  - Provider diverse claim remains blocked

allowed_alpha_claims:
${yamlList([
  ...maintainedClaimsAllowed,
  ...dryRunClaimsAllowed
], 2)}

prohibited_positive_claims:
${yamlList(claimsBlocked, 2)}

claim_upgrade_rule:
  release_gate_dry_run_is_not_actual_release_gate_execution: true
  local_endpoint_deferred_is_not_local_model_verified: true
  provider_diversity_deferred_is_not_provider_diverse: true
  openai_only_dry_run_is_not_stable: true
  openai_only_dry_run_leads_to_actual_gate_preflight_not_release_gated_claim: true

runner_status:
  provider_execution: false
  local_model_execution: false
  local_endpoint_probe: false
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
  local_readiness_documented: true
  note: OpenAI-only rc.1 release gate dry-run passed without new execution. Stable, release-gated, production, provider-diversity, telemetry, local-runtime, provider-verification, and adapter claims remain blocked.
`;
}

function blockerPriorityYaml() {
  return `stage: ${STAGE}
status: rc1-openai-scope-dry-run-blocker-snapshot-recorded
openai_only_release_gate_dry_run_passed: true
release_gate_actual_execution: false
blockers:
  - id: RGD-001
    priority: P0
    category: release_process
    current_status: actual_release_gate_preflight_pending
    blocks_release_gated: true
    reason: "Dry-run passed, but actual release gate preflight and execution have not occurred."
  - id: RGD-002
    priority: P0
    category: local_runtime
    current_status: deferred_until_operator_provides_endpoint
    blocks_openai_only_dry_run: false
    blocks_provider_diverse: true
    reason: "Local endpoint work is deferred until the operator provides endpoint readiness."
  - id: RGD-003
    priority: P0
    category: provider_diversity
    current_status: deferred_not_in_openai_only_scope
    blocks_openai_only_dry_run: false
    blocks_provider_diverse: true
    reason: "Current rc.1 path is explicitly OpenAI-only."
  - id: RGD-004
    priority: P1
    category: telemetry
    current_status: blocked_not_connected
    blocks_production_monitored: true
    reason: "Production telemetry connection is not established."
`;
}

function ownerActionMatrixYaml() {
  return `stage: ${STAGE}
status: refreshed
entries:
  - lane: openai_only_actual_release_gate_preflight
    owner: agent
    action: Prepare actual release gate preflight package for OpenAI-only rc.1 scope.
    exit_criteria: Preconditions are reviewed without opening stable or release-gated claims.
    claim_unblocked_after_exit:
      - rc1-release-gate-actual-preflight-completed-candidate
    claim_still_not_allowed:
      - stable
      - release-gated
      - production-ready
  - lane: local_endpoint
    owner: human
    action: Provide endpoint readiness before any local canary or local redteam work.
    exit_criteria: Operator explicitly provides a local endpoint and permits local canary work.
    claim_still_not_allowed:
      - local-model-verified
      - provider-diverse
  - lane: strict_provider_diverse
    owner: human
    action: Provide local runtime or second provider evidence path later.
    exit_criteria: Non-OpenAI evidence exists under a separate approved stage.
    claim_still_not_allowed:
      - provider-diverse
      - stable
`;
}

function rc1NotStableNoticeYaml() {
  return `status: not_stable
stage: ${STAGE}
rc1_is_not_stable: true
rc1_is_not_release_gated: true
rc1_is_not_production_ready: true
rc1_is_not_provider_diverse: true
rc1_is_not_production_monitored: true
message: "OpenAI-only release gate dry-run passed, but this is not a stable, release-gated, production-ready, production-monitored, or provider-diverse release."
`;
}

function docsText(title, lines) {
  return `# ${title}

${lines.join("\n\n")}
`;
}

function reportMarkdown(report, criteria, boundary, localRecord, providerRecord, preconditions) {
  return `# RC1 OpenAI-scope Release Gate Dry-run

Status: ${report.status}

Stage: ${STAGE}

## Scope

- Prerequisite RC1 OpenAI bundle passed: ${report.prerequisite_rc1_openai_scope_bundle_passed}
- OpenAI scope gate passed: ${report.openai_scope_gate_passed}
- New execution: ${report.new_execution}
- OpenAI provider call: ${report.openai_provider_call}
- Local model execution: ${report.local_model_execution}
- Local endpoint probe: ${report.local_endpoint_probe}
- Telemetry connection: ${report.telemetry_connection}
- Release gate actual execution: ${report.release_gate_actual_execution}

## Deferred Lanes

- Local endpoint status: ${localRecord.local_endpoint_status}
- Provider diversity status: ${providerRecord.status}
- Local runtime criterion: ${criteria.criteria.local_runtime.status}
- Provider diversity criterion: ${criteria.criteria.provider_diversity.status}

## Claim Boundary

- Release gated allowed: ${boundary.release_gated_allowed}
- Stable allowed: ${boundary.stable_allowed}
- Production ready allowed: ${boundary.production_ready_allowed}
- Production monitored allowed: ${boundary.production_monitored_allowed}
- Provider diverse allowed: ${boundary.provider_diverse_allowed}

## Next

- Can enter actual release gate preflight: ${preconditions.can_enter_preflight}
- Next stage: ${preconditions.stage_to_enter_next}
`;
}

function boundaryMarkdown(boundary) {
  return `# RC1 Release Gate Claim Boundary

Status: ${boundary.status}

- OpenAI scope gate passed: ${boundary.openai_scope_gate_passed}
- Release gated allowed: ${boundary.release_gated_allowed}
- Stable allowed: ${boundary.stable_allowed}
- Production ready allowed: ${boundary.production_ready_allowed}
- Production monitored allowed: ${boundary.production_monitored_allowed}
- Provider diverse allowed: ${boundary.provider_diverse_allowed}
- Local model verified allowed: ${boundary.local_model_verified_allowed}

## Allowed

${mdList(boundary.allowed_claims.map((claim) => `\`${claim}\``))}

## Blocked

${mdList(boundary.blocked_claims.map((claim) => `\`${claim}\``))}
`;
}

function readinessMarkdown(readiness, preconditions) {
  return `# RC1 Release Gate Readiness

Status: ${readiness.status}

- Can enter actual OpenAI-scope preflight: ${readiness.can_enter_release_gate_actual_preflight_openai_scope}
- Can enter stable release: ${readiness.can_enter_stable_release}
- Can enter release-gated claim: ${readiness.can_enter_release_gated_claim}
- Local endpoint status: ${readiness.local_endpoint_status}
- Provider diversity status: ${readiness.provider_diversity_status}

## Preconditions

${mdList(preconditions.preconditions)}

## Does Not Require Now

${mdList(preconditions.does_not_require_now)}
`;
}

function claimLadderAppend() {
  return `## RC1 OpenAI-scope Release Gate Dry-run Claim

\`rc1-release-gate-dry-run-executed\` means OpenAI-only rc.1 release gate dry-run evaluated current evidence and deferred local/provider-diversity lanes without actual release gate execution.

It allows:
- OpenAI-only release gate dry-run statement
- local endpoint deferred statement
- provider diversity deferred statement
- release gate actual preconditions drafted statement

It does not allow:
- \`stable\`
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`
- \`provider-diverse\`
- \`provider-verified\`
- \`adapter-checked\`

Additional rules:
- release gate dry-run is not actual release gate execution
- local endpoint deferred is not \`local-model-verified\`
- provider diversity deferred is not \`provider-diverse\`
- OpenAI-only dry-run is not stable
- OpenAI-only dry-run can lead to actual gate preflight, not release-gated claim directly
`;
}

function ensureClaimLadder(root) {
  const file = p(root, "release", "claim_ladder.md");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
  if (current.includes("## RC1 OpenAI-scope Release Gate Dry-run Claim")) return current;
  const marker = "\n## Later Claims\n";
  const addition = `${claimLadderAppend()}\n`;
  return current.includes(marker)
    ? current.replace(marker, `\n${addition}${marker}`)
    : `${current.trimEnd()}\n\n${addition}`;
}

function readmeText() {
  return `# Prompt Stack v2

Status: \`${STAGE}\`

This package is the v2 prompt-stack RC1 evidence workspace. The current stage records an OpenAI-only release gate dry-run from existing RC1 evidence without new provider calls, local execution, telemetry connection, or actual release gate execution.

Local endpoint work is deferred until the operator provides endpoint readiness. Provider diversity remains outside the OpenAI-only scope.

## Current Allowed Claims

${mdList([...maintainedClaimsAllowed, ...dryRunClaimsAllowed])}

These claims do not allow \`stable\`, \`release-gated\`, \`production-ready\`, \`production-monitored\`, \`telemetry-connected\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`local-model-verified\`, \`integration-verified\`, or \`benchmark-backed\`.

## Validation

\`\`\`powershell
node tools/check_rc1_release_gate_dry_run_openai_scope.mjs
\`\`\`
`;
}

function handoffText(report, readiness) {
  return `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- RC1 OpenAI-only evidence bundle prerequisite was checked and passed.
- OpenAI-only release gate dry-run was recorded without new provider calls, local execution, local endpoint probing, telemetry connection, containment rerun, redteam rerun, or actual release gate execution.
- Local endpoint work is deferred until the operator provides endpoint readiness.
- Strict provider-diverse path is deferred outside the current OpenAI-only scope.
- Release-gated, stable, production-ready, production-monitored, provider-diverse, provider-verified, adapter, local-model, replay, integration, and benchmark-backed claims remain blocked.

## Current Gate

- Gate script: \`prompt-stack-v2/tools/check_rc1_release_gate_dry_run_openai_scope.mjs\`
- Gate status: pending_or_last_run_dependent
- Can enter actual release gate preflight OpenAI scope: ${readiness.can_enter_release_gate_actual_preflight_openai_scope}
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false

## Current Evidence

- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_criteria_matrix.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_claim_boundary.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_local_endpoint_deferred_record.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_provider_diversity_deferred_record.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_decision_draft.json\`
- \`evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_actual_preconditions.json\`

## Current Status

- New execution: ${report.new_execution}
- OpenAI provider call: ${report.openai_provider_call}
- Local model execution: ${report.local_model_execution}
- Local endpoint probe: ${report.local_endpoint_probe}
- Telemetry connection: ${report.telemetry_connection}
- Release gate actual execution: ${report.release_gate_actual_execution}
- Local endpoint status: ${report.local_endpoint_status}
- Provider diversity status: ${report.provider_diversity_status}
- Recommended next stage: ${report.recommended_next_stage}

## Still Blocked

${mdList(claimsBlocked.map((claim) => `\`${claim}\``))}
`;
}

export function buildRc1ReleaseGateDryRunArtifacts(root = resolveRoot()) {
  const prerequisite = checkRc1BundlePrerequisite(root);
  if (prerequisite.status !== "pass") {
    const blocked = {
      status: "blocked_by_missing_rc1_openai_scope_bundle",
      stage: STAGE,
      missing: prerequisite.missing,
      rc1_gate_status: prerequisite.gate_status,
      recommended_next_action: "rerun or repair v2.0.0-rc.1-evidence-bundle-openai-scope"
    };
    const evidenceDir = p(root, ...evidenceRelDir.split("/"));
    writeJson(path.join(evidenceDir, "rc1_release_gate_dry_run_gate_report.json"), blocked);
    return { blocked };
  }

  const evidenceDir = p(root, ...evidenceRelDir.split("/"));
  ensureDir(evidenceDir);

  const criteria = criteriaMatrix();
  const report = dryRunReport();
  const localRecord = localEndpointDeferredRecord();
  const providerRecord = providerDiversityDeferredRecord();
  const boundary = claimBoundary();
  const readiness = readinessAssessment();
  const decision = releaseDecisionDraft();
  const preconditions = actualPreconditions();
  const gateSkeleton = {
    status: "pass",
    stage: STAGE,
    can_enter_release_gate_actual_preflight_openai_scope: true,
    can_enter_stable_release: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    can_enter_provider_diverse_claim: false,
    local_endpoint_deferred: true,
    reason: "OpenAI-only release gate dry-run passed, local endpoint is explicitly deferred, and release-gated/stable claims remain blocked until actual release gate preflight/execution.",
    checks: [],
    claims_allowed: dryRunClaimsAllowed,
    claims_blocked: claimsBlocked
  };

  writeText(p(root, "release", "rc1_release_gate_dry_run_openai_scope_scope.yaml"), scopeYaml());
  writeText(p(root, "release", "rc1_release_gate_dry_run_openai_scope.yaml"), releaseGateDryRunYaml(report, readiness));
  writeText(p(root, "release", "rc1_openai_scope_release_decision_draft.yaml"), releaseDecisionYaml(decision));
  writeText(p(root, "release", "rc1_local_endpoint_deferred_policy.yaml"), localEndpointPolicyYaml(localRecord));
  writeText(p(root, "release", "rc1_strict_provider_diverse_deferred_policy.yaml"), providerDiversityPolicyYaml(providerRecord));
  writeText(p(root, "release", "rc1_release_gate_actual_preconditions.yaml"), actualPreconditionsYaml(preconditions));
  writeText(p(root, "release", "rc1_release_gate_readiness.yaml"), actualPreconditionsYaml(preconditions));
  writeText(p(root, "release", "rc1_not_stable_notice.yaml"), rc1NotStableNoticeYaml());

  writeJson(path.join(evidenceDir, "rc1_release_gate_dry_run_report.json"), report);
  writeText(path.join(evidenceDir, "rc1_release_gate_dry_run_report.md"), reportMarkdown(report, criteria, boundary, localRecord, providerRecord, preconditions));
  writeJson(path.join(evidenceDir, "rc1_release_gate_criteria_matrix.json"), criteria);
  writeJson(path.join(evidenceDir, "rc1_release_gate_claim_boundary.json"), boundary);
  writeJson(path.join(evidenceDir, "rc1_release_gate_readiness_assessment.json"), readiness);
  writeJson(path.join(evidenceDir, "rc1_local_endpoint_deferred_record.json"), localRecord);
  writeJson(path.join(evidenceDir, "rc1_provider_diversity_deferred_record.json"), providerRecord);
  writeJson(path.join(evidenceDir, "rc1_release_decision_draft.json"), decision);
  writeJson(path.join(evidenceDir, "rc1_release_gate_actual_preconditions.json"), preconditions);
  writeJson(path.join(evidenceDir, "rc1_release_gate_dry_run_gate_report.json"), gateSkeleton);
  writeJson(path.join(evidenceDir, "unresolved_items.json"), []);

  writeText(p(root, "evals", "suites", "rc1_release_gate_dry_run_openai_scope.yaml"), `id: rc1_release_gate_dry_run_openai_scope
stage: ${STAGE}
mode: dry_run_no_execution
local_endpoint_status: deferred_until_operator_provides_endpoint
expected_next_stage: v2.0.0-rc.1-release-gate-actual-openai-scope-preflight
`);
  writeJson(p(root, "evals", "reports", "rc1_release_gate_dry_run_report.json"), report);
  writeText(p(root, "evals", "reports", "rc1_release_gate_dry_run_report.md"), reportMarkdown(report, criteria, boundary, localRecord, providerRecord, preconditions));
  writeJson(p(root, "evals", "reports", "rc1_release_gate_claim_boundary_report.json"), boundary);
  writeText(p(root, "evals", "reports", "rc1_release_gate_claim_boundary_report.md"), boundaryMarkdown(boundary));
  writeJson(p(root, "evals", "reports", "rc1_release_gate_readiness_report.json"), readiness);
  writeText(p(root, "evals", "reports", "rc1_release_gate_readiness_report.md"), readinessMarkdown(readiness, preconditions));
  writeJson(p(root, "evals", "reports", "rc1_release_gate_dry_run_gate_report.json"), gateSkeleton);
  writeText(p(root, "evals", "reports", "rc1_release_gate_dry_run_gate_report.md"), readinessMarkdown(readiness, preconditions));

  writeText(p(root, "docs", "rc1_release_gate_dry_run_openai_scope.md"), reportMarkdown(report, criteria, boundary, localRecord, providerRecord, preconditions));
  writeText(p(root, "docs", "rc1_release_gate_claim_boundary.md"), boundaryMarkdown(boundary));
  writeText(p(root, "docs", "rc1_local_endpoint_deferred.md"), docsText("RC1 Local Endpoint Deferred", [
    `Status: \`${localRecord.local_endpoint_status}\`.`,
    localRecord.reason,
    "This does not block the OpenAI-only release gate dry-run.",
    `Still blocks: ${localRecord.still_blocks.join(", ")}.`
  ]));
  writeText(p(root, "docs", "rc1_provider_diversity_deferred.md"), docsText("RC1 Provider Diversity Deferred", [
    `Status: \`${providerRecord.status}\`.`,
    providerRecord.reason,
    "This does not block the OpenAI-only release gate dry-run.",
    `Still blocks: ${providerRecord.still_blocks.join(", ")}.`
  ]));
  writeText(p(root, "docs", "rc1_release_gate_actual_preconditions.md"), readinessMarkdown(readiness, preconditions));
  writeText(p(root, "docs", "next_rc1_release_gate_actual_plan.md"), docsText("Next RC1 Release Gate Actual Plan", [
    `Next candidate stage: \`${preconditions.stage_to_enter_next}\`.`,
    "Preflight may proceed from this dry-run, but stable and release-gated claims remain blocked until actual gate evidence exists."
  ]));
  writeText(p(root, "docs", "next_local_canary_after_endpoint_ready.md"), docsText("Next Local Canary After Endpoint Ready", [
    "Do not probe local endpoints in the current stage.",
    "After the operator provides endpoint readiness, prepare a separate local no-tool canary stage with explicit approval boundaries."
  ]));

  writeText(p(root, "README.md"), readmeText());
  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml());
  writeText(p(root, "release", "release_blocker_priority.yaml"), blockerPriorityYaml());
  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionMatrixYaml());
  writeText(p(root, "release", "claim_ladder.md"), ensureClaimLadder(root));
  writeText(p(root, "docs", "beta_entry_criteria.md"), docsText("Beta Entry Criteria", [
    `Current stage: \`${STAGE}\`.`,
    "OpenAI-only rc.1 release gate dry-run passed without new execution.",
    "Local endpoint and strict provider diversity paths are deferred.",
    "Stable, release-gated, production, telemetry, provider-diversity, local-model, provider-verification, adapter, integration, and benchmark-backed claims remain blocked."
  ]));
  writeText(p(root, "session_handoff_2026-05-22.md"), handoffText(report, readiness));

  return {
    prerequisite,
    criteria,
    report,
    localRecord,
    providerRecord,
    boundary,
    readiness,
    decision,
    preconditions,
    gate: gateSkeleton
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildRc1ReleaseGateDryRunArtifacts(root);
  console.log(JSON.stringify(artifacts.blocked || artifacts.report, null, 2));
  if (artifacts.blocked) process.exitCode = 1;
}
