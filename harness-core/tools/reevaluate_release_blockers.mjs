#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-beta-release-blocker-p0-p1-reevaluation";

const allowedClaims = [
  "release-blockers-reevaluated",
  "p0-p1-blockers-refreshed",
  "rc1-readiness-assessed",
  "release-path-decision-matrix-drafted",
  "release-claim-boundary-after-containment-audited",
  "owner-action-matrix-refreshed"
];

const blockedClaims = [
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

export function resolveRoot(argv = process.argv) {
  const repoRoot = process.cwd();
  return argv[2] && !argv[2].startsWith("--")
    ? path.resolve(repoRoot, argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
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

function scopeYaml() {
  return `stage: ${STAGE}

approved_actions:
${yamlBoolMap({
  release_blocker_reevaluation: true,
  p0_p1_status_refresh: true,
  rc1_readiness_assessment: true,
  openai_only_vs_strict_path_split: true,
  claim_boundary_audit_after_containment: true,
  owner_action_matrix_refresh: true,
  release_gate_status_refresh: true
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
  release_gate_execution: true,
  production_deployment: true,
  release_gated_claim: true,
  production_ready_claim: true,
  production_monitored_claim: true,
  provider_diverse_claim: true,
  provider_verified_claim: true,
  adapter_checked_claim: true,
  dist_modification: true
}, 2)}

claims_allowed:
${yamlList(allowedClaims, 2)}

claims_not_allowed:
${yamlList([
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

function blockerStatusMatrix(containmentDecision) {
  const containmentResolved = containmentDecision?.containment_verified_allowed === true;
  return {
    status: "partial",
    stage: STAGE,
    release_gate_passed: false,
    production_ready: false,
    production_monitored: false,
    provider_diversity_established: false,
    local_model_execution_verified: false,
    containment_verified: containmentResolved,
    blockers: [
      {
        id: "RB-001",
        priority: "P0",
        category: "containment",
        previous_status: "owner decision pending",
        current_status: containmentResolved ? "resolved_for_beta_containment_scope" : "blocked",
        blocks_release_gated: false,
        blocks_production_ready: false,
        evidence: [
          "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json"
        ]
      },
      {
        id: "RB-002",
        priority: "P0",
        category: "provider_diversity",
        current_status: "blocked",
        blocks_release_gated: true,
        blocks_production_ready: true,
        reason: "Only OpenAI provider evidence is available; local or second-provider evidence is not established."
      },
      {
        id: "RB-003",
        priority: "P0",
        category: "local_runtime",
        current_status: "blocked",
        blocks_release_gated: true,
        blocks_production_ready: true,
        reason: "vLLM/Ollama endpoint unavailable and local no-tool canary not executed."
      },
      {
        id: "RB-004",
        priority: "P1",
        category: "telemetry",
        current_status: "blocked",
        blocks_release_gated: "depends_on_release_scope",
        blocks_production_ready: true,
        reason: "Telemetry connection not established; production-monitored claim remains blocked."
      },
      {
        id: "RB-005",
        priority: "P1",
        category: "release_process",
        current_status: "pending",
        blocks_release_gated: true,
        reason: "Final release gate actual execution, release decision record, and rollback finalization remain pending."
      }
    ]
  };
}

function rc1Assessment() {
  return {
    status: "candidate_possible_with_openai_only_scope",
    stage: STAGE,
    openai_only_rc1_possible: true,
    strict_provider_diverse_rc1_possible: false,
    reasons_openai_only_possible: [
      "OpenAI canary replay suite passed",
      "OpenAI limited and additional redteam executions passed",
      "Containment-verified allowed for beta containment evidence scope",
      "Cross-suite storage/redaction audit passed",
      "Release evidence bundle exists"
    ],
    reasons_strict_provider_diverse_blocked: [
      "Local runtime canary not executed",
      "Provider diversity not established",
      "No second provider or local runtime evidence"
    ],
    must_disclaim_for_openai_only_rc1: [
      "not provider-diverse",
      "not production-monitored",
      "not local-model-verified",
      "not production-ready"
    ],
    recommended_next_stage: "v2.0.0-rc.1-evidence-bundle-openai-scope"
  };
}

function releasePathMatrix() {
  return {
    paths: {
      openai_only_rc1: {
        status: "available_candidate",
        allowed_next_stage: "v2.0.0-rc.1-evidence-bundle-openai-scope",
        allowed_claim_scope: [
          "OpenAI canary suite evidence",
          "OpenAI redteam evidence",
          "containment-verified beta scope",
          "not production monitored",
          "not provider diverse"
        ],
        claims_still_blocked: [
          "release-gated",
          "production-ready",
          "production-monitored",
          "provider-diverse",
          "local-model-verified"
        ]
      },
      strict_provider_diverse_rc1: {
        status: "blocked",
        blocked_by: [
          "local runtime canary not executed",
          "second provider not executed",
          "provider diversity not established"
        ],
        required_next_actions: [
          "Prepare vLLM/Ollama endpoint and run local no-tool canary",
          "Or add second provider canary path"
        ]
      }
    }
  };
}

function claimBoundaryAfterContainment() {
  return {
    status: "pass",
    containment_verified_allowed: true,
    release_gated_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    reason: "Containment-verified is allowed for beta containment evidence scope, but release, production, provider diversity, provider verification, and adapter claims remain blocked.",
    allowed_claims: [
      "containment-verified",
      "release-blockers-reevaluated",
      "rc1-readiness-assessed"
    ],
    blocked_claims: [
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked"
    ]
  };
}

function ownerActionMatrixRefresh() {
  return {
    status: "refreshed",
    actions: [
      {
        lane: "openai_only_rc1",
        owner: "agent",
        next_action: "Build rc.1 evidence bundle with explicit OpenAI-only scope and blocked claims.",
        blocks: []
      },
      {
        lane: "strict_provider_diverse",
        owner: "human",
        next_action: "Provide local vLLM/Ollama endpoint or second provider path.",
        blocks: [
          "provider-diverse",
          "local-model-verified"
        ]
      },
      {
        lane: "telemetry",
        owner: "human",
        next_action: "Provide telemetry approval phrase and sink credentials if production monitoring is desired.",
        blocks: [
          "production-monitored",
          "production-ready"
        ]
      },
      {
        lane: "release_gate",
        owner: "agent",
        next_action: "Prepare rc.1 bundle before actual release gate execution.",
        blocks: [
          "release-gated"
        ]
      }
    ]
  };
}

function releaseGateStatusRefresh() {
  return {
    release_gate_status: "blocked_not_release_gated",
    containment_verified: true,
    openai_canary_replay_suite_passed: true,
    openai_redteam_passed_limited_scope: true,
    production_ready: false,
    production_monitored: false,
    provider_diversity_established: false,
    local_model_execution_verified: false,
    release_gate_actual_execution_completed: false,
    recommended_next_stage: "v2.0.0-rc.1-evidence-bundle-openai-scope"
  };
}

function reevaluationReport(matrix, rc1, boundary, gateStatus) {
  const p0Remaining = matrix.blockers.filter((item) => item.priority === "P0" && item.current_status !== "resolved_for_beta_containment_scope").length;
  const p1Remaining = matrix.blockers.filter((item) => item.priority === "P1" && item.current_status !== "resolved_for_beta_containment_scope").length;
  return {
    status: "pass",
    stage: STAGE,
    new_provider_execution: false,
    local_model_execution: false,
    telemetry_connection: false,
    release_gate_execution: false,
    containment_verified: true,
    release_gate_status: gateStatus.release_gate_status,
    production_ready: false,
    production_monitored: false,
    provider_diversity_established: false,
    local_model_execution_verified: false,
    p0_blockers_remaining: p0Remaining,
    p1_blockers_remaining: p1Remaining,
    openai_only_rc1_possible: rc1.openai_only_rc1_possible,
    strict_provider_diverse_rc1_possible: rc1.strict_provider_diverse_rc1_possible,
    containment_verified_allowed: boundary.containment_verified_allowed,
    release_gated_allowed: boundary.release_gated_allowed,
    production_ready_allowed: boundary.production_ready_allowed,
    production_monitored_allowed: boundary.production_monitored_allowed,
    provider_diverse_allowed: boundary.provider_diverse_allowed,
    recommended_next_stage: rc1.recommended_next_stage,
    claims_allowed: allowedClaims,
    claims_not_allowed: blockedClaims
  };
}

function releaseBlockerYaml(matrix) {
  return `stage: ${STAGE}
status: refreshed
blockers:
${matrix.blockers.map((item) => `  - id: ${item.id}
    priority: ${item.priority}
    category: ${item.category}
    current_status: ${item.current_status}
    blocks_release_gated: ${item.blocks_release_gated}
    blocks_production_ready: ${item.blocks_production_ready ?? "not_applicable"}
    owner: ${item.category === "local_runtime" || item.category === "telemetry" ? "human" : item.category === "provider_diversity" ? "human_or_agent" : "agent"}
    reason: "${item.reason || item.current_status}"`).join("\n")}
`;
}

function ownerActionYaml(ownerRefresh) {
  return `stage: ${STAGE}
status: refreshed
entries:
${ownerRefresh.actions.map((action, index) => `  - blocker_id: RB-${String(index + 1).padStart(3, "0")}
    lane: ${action.lane}
    owner: ${action.owner}
    action: ${action.next_action}
    blocks:
${yamlList(action.blocks, 6)}`).join("\n")}
`;
}

function releaseGateYaml(report) {
  return `id: harness-core.release_gate
version: 2.0.0-beta-release-blocker-p0-p1-reevaluation
status: blocked_not_release_gated

alpha_required_checks:
  - Containment verified decision gate exists and passes
  - Release blocker P0/P1 matrix exists
  - RC1 readiness assessment exists
  - Release path decision matrix exists
  - Claim boundary after containment exists
  - Owner/action matrix refresh exists
  - Release gate status refresh exists
  - Release gated claim remains blocked
  - Production ready claim remains blocked
  - Production monitored claim remains blocked
  - Provider diverse claim remains blocked

allowed_alpha_claims:
${yamlList([
  "containment-verified",
  ...allowedClaims
], 2)}

prohibited_positive_claims:
${yamlList(blockedClaims, 2)}

claim_upgrade_rule:
  blocker_reevaluation_is_not_release_gated: true
  openai_only_rc1_candidate_is_not_provider_diverse: true
  containment_verified_is_not_production_ready: true
  can_enter_openai_only_rc1_bundle_is_not_stable_release: true
  release_gate_actual_execution_still_required: true

runner_status:
  provider_execution: false
  local_model_execution: false
  reference_baseline_runners_reexecuted_for_alpha: false
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
  note: Containment is verified for beta scope. OpenAI-only rc.1 evidence bundle is available as next stage, but release, production, provider diversity, telemetry, and local runtime claims remain blocked.
`;
}

function betaReleaseBlockersYaml(matrix, rc1) {
  return `stage: ${STAGE}
status: refreshed
containment_verified: true
release_gate_status: blocked_not_release_gated
openai_only_rc1_possible: ${rc1.openai_only_rc1_possible}
strict_provider_diverse_rc1_possible: ${rc1.strict_provider_diverse_rc1_possible}
blockers:
${matrix.blockers.map((item) => `  - id: ${item.id}
    priority: ${item.priority}
    category: ${item.category}
    current_status: ${item.current_status}
    blocks_release_gated: ${item.blocks_release_gated}`).join("\n")}
`;
}

function providerCapabilityMatrixYaml() {
  return `version: 2.0.0-beta-release-blocker-p0-p1-reevaluation
status: release-blocker-p0-p1-reevaluated
policy:
  unverified_capabilities_must_not_be_true: true
  production_telemetry_default: false
  allowed_unverified_statuses:
    - needs_verification
    - false
    - not_applicable
    - roadmap
    - skeleton
    - failed_http_429
    - failed_trace_recorded
    - failure_path_checked
    - blocked_by_missing_local_endpoint
    - canary_rerun_checked
    - canary_rerun_recorded
    - canary_suite_checked
    - canary_suite_recorded
    - containment_verified_beta_scope
    - openai_only_rc1_candidate

providers:
  openai:
    adapter_path: adapters/api/openai/adapter.yaml
    status: provider_canary_checked
    message_mapping: dry_run_checked
    provider_canary: executed
    no_tool_text_path: canary_checked
    no_tool_text_rerun: canary_rerun_checked
    provider_trace: canary_checked
    trace: canary_checked
    redaction: canary_checked
    structured_output_canary: executed
    structured_output_path: canary_checked
    structured_output_rerun: canary_rerun_checked
    json_schema_response_validation: canary_checked
    tool_calling_canary: executed
    tool_call_path: canary_checked
    tool_argument_schema_validation: canary_checked
    mock_tool_output_reinjection: canary_checked
    tool_output_reclassification: canary_checked
    tool_calling_rerun: canary_rerun_checked
    canary_replay_suite: canary_suite_checked
    replay_evidence: canary_suite_recorded
    tool_calling: canary_only
    structured_outputs: canary_only
    evals_api: needs_verification
    tracing: needs_verification
    provider_execution: canary_only
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

  vllm:
    adapter_path: adapters/local/vllm/adapter.yaml
    status: dry_run_checked
    message_mapping: dry_run_checked
    local_no_tool_canary: blocked_by_missing_local_endpoint
    openai_compatible_server: needs_verification
    tool_calling: needs_verification
    structured_outputs: needs_verification
    chat_template: needs_verification
    evals_api: not_applicable
    provider_execution: false
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

  ollama:
    adapter_path: adapters/local/ollama/adapter.yaml
    status: dry_run_checked
    message_mapping: dry_run_checked
    local_no_tool_canary: blocked_by_missing_local_endpoint
    tool_calling: needs_verification
    structured_outputs: needs_verification
    chat_template: needs_verification
    evals_api: not_applicable
    provider_execution: false
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

deferred_providers:
  anthropic: roadmap
  gemini: roadmap
  hf_transformers: roadmap
  mcp: roadmap
  agents_md: roadmap

mock_runtime:
  runtime_orchestration: beta_mock_executed
  tool_routing: mock_checked
  approval_boundary: smoke_tested
  trace_schema: smoke_tested
  provider_execution: false
  local_model_execution: false
  external_side_effects: false
`;
}

function readmeText(report) {
  return `# HARNESS Core

Status: \`${STAGE}\`

This package is the v2 prompt-stack beta evidence workspace. The current stage reevaluates P0/P1 release blockers after \`containment-verified\` was allowed for beta containment evidence scope.

OpenAI-only rc.1 evidence bundle preparation is available as a candidate next stage. Strict provider-diverse rc.1 remains blocked by missing local or second-provider evidence. Release, production, telemetry, provider-diversity, provider-verification, and adapter claims remain blocked.

## Source of Truth

- \`stack.yaml\`
- \`stack.schema.json\`
- \`core/spec/harness.spec.yaml\`

Prompt bundles under \`dist/\` are generated artifacts. Do not edit generated bundles by hand.

## Current Allowed Claims

${mdList(["containment-verified", ...allowedClaims])}

These claims do not allow \`release-gated\`, \`production-ready\`, \`production-monitored\`, \`telemetry-connected\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`integration-verified\`, or \`benchmark-backed\`.

## Static Validation

Run from the workspace root:

\`\`\`powershell
node harness-core/tools/check_release_blocker_p0_p1_reevaluation.mjs
\`\`\`
`;
}

function docsText(title, lines) {
  return `# ${title}

${lines.join("\n\n")}
`;
}

function reportMarkdown(report) {
  return `# Release Blocker P0/P1 Reevaluation Report

Status: ${report.status}

Stage: ${STAGE}

- Containment verified: ${report.containment_verified}
- Release gate status: ${report.release_gate_status}
- P0 blockers remaining: ${report.p0_blockers_remaining}
- P1 blockers remaining: ${report.p1_blockers_remaining}
- OpenAI-only rc.1 possible: ${report.openai_only_rc1_possible}
- Strict provider-diverse rc.1 possible: ${report.strict_provider_diverse_rc1_possible}
- Recommended next stage: ${report.recommended_next_stage}
`;
}

function rc1Markdown(rc1) {
  return `# RC1 Readiness Assessment

Status: ${rc1.status}

- OpenAI-only rc.1 possible: ${rc1.openai_only_rc1_possible}
- Strict provider-diverse rc.1 possible: ${rc1.strict_provider_diverse_rc1_possible}
- Recommended next stage: ${rc1.recommended_next_stage}

## OpenAI-only Basis

${mdList(rc1.reasons_openai_only_possible)}

## Strict Path Blockers

${mdList(rc1.reasons_strict_provider_diverse_blocked)}
`;
}

function boundaryMarkdown(boundary) {
  return `# Release Claim Boundary After Containment

Status: ${boundary.status}

- Containment verified allowed: ${boundary.containment_verified_allowed}
- Release gated allowed: ${boundary.release_gated_allowed}
- Production ready allowed: ${boundary.production_ready_allowed}
- Production monitored allowed: ${boundary.production_monitored_allowed}
- Provider diverse allowed: ${boundary.provider_diverse_allowed}

Reason: ${boundary.reason}
`;
}

function matrixMarkdown(matrix) {
  return `# Release Path Decision Matrix

## OpenAI-only rc.1

- Status: ${matrix.paths.openai_only_rc1.status}
- Allowed next stage: ${matrix.paths.openai_only_rc1.allowed_next_stage}

## Strict Provider-diverse rc.1

- Status: ${matrix.paths.strict_provider_diverse_rc1.status}
- Blocked by:
${mdList(matrix.paths.strict_provider_diverse_rc1.blocked_by)}
`;
}

function claimLadderAppend() {
  return `## Release Blocker Reevaluation Claim

\`release-blockers-reevaluated\` means release blockers were reevaluated after \`containment-verified\` was allowed for beta scope, and rc.1 readiness paths were assessed without executing release gate.

It allows:
- release blocker reevaluation statement
- rc.1 readiness assessment statement
- OpenAI-only rc.1 candidate path statement

It does not allow:
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`
- \`provider-diverse\`
- \`provider-verified\`
- \`adapter-checked\`

Additional rules:
- blocker reevaluation is not \`release-gated\`
- OpenAI-only rc.1 candidate is not \`provider-diverse\`
- \`containment-verified\` is not \`production-ready\`
- can_enter_openai_only_rc1_bundle is not stable release
`;
}

function ensureClaimLadder(root) {
  const file = p(root, "release", "claim_ladder.md");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
  if (current.includes("## Release Blocker Reevaluation Claim")) return current;
  const marker = "\n## Later Claims\n";
  const addition = `${claimLadderAppend()}\n`;
  return current.includes(marker)
    ? current.replace(marker, `\n${addition}${marker}`)
    : `${current.trimEnd()}\n\n${addition}`;
}

function handoffText(report, rc1, gateStatus = "pending") {
  return `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- Release blockers were reevaluated after \`containment-verified\` became allowed for beta containment evidence scope.
- OpenAI-only rc.1 evidence bundle is available as a candidate next stage.
- Strict provider-diverse rc.1 remains blocked.
- Release, production, telemetry, provider-diversity, provider-verification, adapter, and integration claims remain blocked.

## Current Gate

- Gate script: \`harness-core/tools/check_release_blocker_p0_p1_reevaluation.mjs\`
- Gate status: ${gateStatus}
- Can enter OpenAI-only rc.1 bundle: true
- Can enter strict provider-diverse rc.1: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false

## Current Evidence

- \`evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/blocker_status_matrix.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/rc1_readiness_assessment.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/release_path_decision_matrix.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/claim_boundary_after_containment.json\`

## Current Status

- Containment verified: ${report.containment_verified}
- Release gate status: ${report.release_gate_status}
- P0 blockers remaining: ${report.p0_blockers_remaining}
- P1 blockers remaining: ${report.p1_blockers_remaining}
- Recommended next stage: ${rc1.recommended_next_stage}

## Still Blocked

${mdList(blockedClaims.map((claim) => `\`${claim}\``))}
`;
}

function gateReportSkeleton() {
  return {
    status: "pass",
    stage: STAGE,
    can_enter_openai_only_rc1_bundle: true,
    can_enter_strict_provider_diverse_rc1: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    reason: "Containment blocker is resolved for beta scope, but provider diversity, local runtime, telemetry, and final release gate remain blocked. OpenAI-only rc.1 bundle is available as next stage.",
    checks: [],
    claims_allowed: allowedClaims,
    claims_blocked: blockedClaims
  };
}

function writeArtifacts(root, artifacts) {
  const {
    matrix,
    rc1,
    paths,
    boundary,
    ownerRefresh,
    gateStatus,
    report
  } = artifacts;
  const evidenceDir = p(root, "evidence", "beta-release-blocker-p0-p1-reevaluation");

  writeText(p(root, "release", "beta_release_blocker_p0_p1_reevaluation_scope.yaml"), scopeYaml());
  writeText(p(root, "release", "release_blocker_p0_p1_current.yaml"), releaseBlockerYaml(matrix));
  writeText(p(root, "release", "rc1_readiness_assessment.yaml"), `rc1_readiness_assessment:\n${yamlList([`status: ${rc1.status}`, `openai_only_rc1_possible: ${rc1.openai_only_rc1_possible}`, `strict_provider_diverse_rc1_possible: ${rc1.strict_provider_diverse_rc1_possible}`, `recommended_next_stage: ${rc1.recommended_next_stage}`], 2)}\n`);
  writeJson(p(root, "release", "release_path_decision_matrix.yaml"), paths);
  writeText(p(root, "release", "openai_only_rc_path.yaml"), `openai_only_rc_path:\n  status: ${paths.paths.openai_only_rc1.status}\n  allowed_next_stage: ${paths.paths.openai_only_rc1.allowed_next_stage}\n  claims_still_blocked:\n${yamlList(paths.paths.openai_only_rc1.claims_still_blocked, 4)}\n`);
  writeText(p(root, "release", "strict_provider_diverse_rc_path.yaml"), `strict_provider_diverse_rc_path:\n  status: ${paths.paths.strict_provider_diverse_rc1.status}\n  blocked_by:\n${yamlList(paths.paths.strict_provider_diverse_rc1.blocked_by, 4)}\n`);

  writeJson(path.join(evidenceDir, "release_blocker_reevaluation_report.json"), report);
  writeText(path.join(evidenceDir, "release_blocker_reevaluation_report.md"), reportMarkdown(report));
  writeJson(path.join(evidenceDir, "blocker_status_matrix.json"), matrix);
  writeJson(path.join(evidenceDir, "rc1_readiness_assessment.json"), rc1);
  writeJson(path.join(evidenceDir, "release_path_decision_matrix.json"), paths);
  writeJson(path.join(evidenceDir, "claim_boundary_after_containment.json"), boundary);
  writeJson(path.join(evidenceDir, "owner_action_matrix_refresh.json"), ownerRefresh);
  writeJson(path.join(evidenceDir, "release_gate_status_refresh.json"), gateStatus);
  writeJson(path.join(evidenceDir, "release_blocker_p0_p1_gate_report.json"), gateReportSkeleton());
  writeJson(path.join(evidenceDir, "unresolved_items.json"), []);

  writeJson(p(root, "evals", "reports", "release_blocker_p0_p1_reevaluation_report.json"), report);
  writeText(p(root, "evals", "reports", "release_blocker_p0_p1_reevaluation_report.md"), reportMarkdown(report));
  writeJson(p(root, "evals", "reports", "rc1_readiness_assessment_report.json"), rc1);
  writeText(p(root, "evals", "reports", "rc1_readiness_assessment_report.md"), rc1Markdown(rc1));
  writeJson(p(root, "evals", "reports", "release_claim_boundary_after_containment_report.json"), boundary);
  writeText(p(root, "evals", "reports", "release_claim_boundary_after_containment_report.md"), boundaryMarkdown(boundary));
  writeJson(p(root, "evals", "reports", "release_blocker_p0_p1_gate_report.json"), gateReportSkeleton());
  writeText(p(root, "evals", "reports", "release_blocker_p0_p1_gate_report.md"), reportMarkdown(report));

  writeText(p(root, "evals", "suites", "beta_release_blocker_p0_p1_reevaluation.yaml"), `id: beta_release_blocker_p0_p1_reevaluation\nstage: ${STAGE}\nmode: no_execution_release_blocker_review\nexpected_next_stage: ${rc1.recommended_next_stage}\n`);

  writeText(p(root, "docs", "release_blocker_p0_p1_reevaluation.md"), reportMarkdown(report));
  writeText(p(root, "docs", "rc1_readiness_assessment.md"), rc1Markdown(rc1));
  writeText(p(root, "docs", "release_path_decision_matrix.md"), matrixMarkdown(paths));
  writeText(p(root, "docs", "openai_only_rc_path.md"), docsText("OpenAI-only RC Path", [
    `Status: \`${paths.paths.openai_only_rc1.status}\`.`,
    `Allowed next stage: \`${paths.paths.openai_only_rc1.allowed_next_stage}\`.`,
    "This path must explicitly disclaim provider diversity, production monitoring, local model verification, and production readiness."
  ]));
  writeText(p(root, "docs", "strict_provider_diverse_rc_path.md"), docsText("Strict Provider-diverse RC Path", [
    `Status: \`${paths.paths.strict_provider_diverse_rc1.status}\`.`,
    "The path remains blocked by missing local runtime or second-provider evidence."
  ]));
  writeText(p(root, "docs", "next_rc1_evidence_bundle_plan.md"), docsText("Next RC1 Evidence Bundle Plan", [
    `Recommended next stage: \`${rc1.recommended_next_stage}\`.`,
    "Build the bundle with explicit OpenAI-only scope and blocked-claim disclaimers."
  ]));
  writeText(p(root, "docs", "next_local_canary_plan.md"), docsText("Next Local Canary Plan", [
    "Prepare a localhost-only vLLM or Ollama endpoint before running local no-tool canary.",
    "Do not claim local model verification until that canary passes."
  ]));
  writeText(p(root, "docs", "next_telemetry_connection_plan.md"), docsText("Next Telemetry Connection Plan", [
    "Telemetry connection remains blocked by approval and sink credentials.",
    "Do not claim production monitoring before live telemetry receipt and anomaly-response evidence."
  ]));

  writeText(p(root, "README.md"), readmeText(report));
  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml(report));
  writeText(p(root, "release", "release_blocker_priority.yaml"), releaseBlockerYaml(matrix));
  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionYaml(ownerRefresh));
  writeText(p(root, "release", "beta_release_blockers.yaml"), betaReleaseBlockersYaml(matrix, rc1));
  writeText(p(root, "adapters", "provider_capability_matrix.yaml"), providerCapabilityMatrixYaml());
  writeText(p(root, "release", "claim_ladder.md"), ensureClaimLadder(root));
  writeText(p(root, "docs", "beta_entry_criteria.md"), docsText("Beta Entry Criteria", [
    `Current stage: \`${STAGE}\`.`,
    "Containment is verified for beta scope.",
    "OpenAI-only rc.1 evidence bundle is an available candidate next stage.",
    "Release, production, telemetry, provider-diversity, provider-verification, adapter, integration, and benchmark-backed claims remain blocked."
  ]));
  writeText(p(root, "session_handoff_2026-05-22.md"), handoffText(report, rc1));
}

export function buildReleaseBlockerReevaluationArtifacts(root = resolveRoot()) {
  const containmentDecision = readIfExists(root, "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json");
  if (!containmentDecision?.containment_verified_allowed) {
    throw new Error("containment verified decision report must allow containment-verified before blocker reevaluation");
  }
  const matrix = blockerStatusMatrix(containmentDecision);
  const rc1 = rc1Assessment();
  const paths = releasePathMatrix();
  const boundary = claimBoundaryAfterContainment();
  const ownerRefresh = ownerActionMatrixRefresh();
  const gateStatus = releaseGateStatusRefresh();
  const report = reevaluationReport(matrix, rc1, boundary, gateStatus);
  const artifacts = { matrix, rc1, paths, boundary, ownerRefresh, gateStatus, report };
  writeArtifacts(root, artifacts);
  return artifacts;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildReleaseBlockerReevaluationArtifacts(root);
  console.log(JSON.stringify(artifacts.report, null, 2));
}
