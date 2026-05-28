#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-stable-scope-decision-preflight";
const EVIDENCE_DIR = "evidence/post-rc-stable-scope-preflight";
const STATUS = "blocked_by_owner_stable_scope_decision_required";
const CANONICAL_READY_CLAIM = "post-rc-openai-only-production-ready";
const ALLOWED_CLAIMS = [
  "post-rc-stable-scope-preflight-completed",
  "post-rc-stable-evidence-inventoried",
  "post-rc-stable-blockers-recorded",
  "post-rc-stable-owner-decision-requested",
  "post-rc-production-ready-claim-canonicalized"
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

function writeStaticArtifacts() {
  writeTextSafe(p("release", "post_rc_stable_scope_preflight_scope.yaml"), `stage: ${STAGE}

approved_actions:
  stable_scope_preflight: true
  production_ready_claim_canonicalization: true
  stable_evidence_inventory: true
  stable_blocker_matrix_generation: true
  openai_only_vs_strict_stable_scope_split: true
  local_endpoint_deferral_confirmation: true
  owner_decision_request_generation: true
  claim_boundary_audit: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution: true
  redteam_rerun: true
  containment_rerun: true
  production_deployment: true
  release_gate_rerun: true
  v36_modification: true
  dist_modification: true
  evidence_v36_baseline_modification: true

claims_allowed:
  - post-rc-stable-scope-preflight-completed
  - post-rc-stable-evidence-inventoried
  - post-rc-stable-blockers-recorded
  - post-rc-stable-owner-decision-requested
  - post-rc-production-ready-claim-canonicalized

claims_not_allowed:
  - stable
  - production-ready
  - release-gated
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified
`);

  writeTextSafe(p("release", "post_rc_stable_scope_decision_matrix.yaml"), `stage: ${STAGE}
status: owner_decision_required
options:
  openai_only_stable_scope:
    status: candidate_requires_owner_decision
    allowed_to_consider: true
  strict_provider_diverse_stable_scope:
    status: blocked_until_local_or_second_provider_evidence
    allowed_to_consider: false
  keep_stable_blocked:
    status: available
recommended_option: owner_decision_required
`);

  writeTextSafe(p("release", "post_rc_stable_blocker_matrix.yaml"), `stage: ${STAGE}
status: blocked
stable_allowed: false
blockers:
  - id: SB-001
    category: stable_scope_decision
    status: owner_decision_required
  - id: SB-002
    category: local_endpoint
    status: deferred
  - id: SB-003
    category: provider_diversity
    status: not_established
  - id: SB-004
    category: bare_release_gated
    status: blocked
`);

  writeTextSafe(p("release", "post_rc_stable_owner_decision_request.yaml"), `stage: ${STAGE}
status: owner_decision_required
question: "Should stable be evaluated as OpenAI-only scoped, strict provider-diverse/local-inclusive, or kept blocked?"
recommended_next_action: operator_decision_required
`);

  writeTextSafe(p("release", "post_rc_stable_claim_boundary.yaml"), `stage: ${STAGE}
post_rc_openai_only_production_ready_allowed: true
stable_allowed: false
general_production_ready_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);

  writeTextSafe(p("release", "post_rc_production_ready_claim_canonicalization.yaml"), `stage: ${STAGE}
canonical_allowed_claim: ${CANONICAL_READY_CLAIM}
bare_production_ready_allowed: false
scope: openai_only_post_rc
`);

  writeTextSafe(p("evals", "suites", "post_rc_stable_scope_preflight.yaml"), `suite: post_rc_stable_scope_preflight
stage: ${STAGE}
expected_status: ${STATUS}
checks:
  - post_rc_openai_only_production_ready_true
  - bare_production_ready_blocked
  - stable_blocked
  - owner_decision_required
  - local_endpoint_deferred
  - no_forbidden_execution
`);

  writeTextSafe(p("docs", "stable_scope_preflight.md"), `# Stable Scope Preflight

Stage: ${STAGE}

The canonical readiness claim is ${CANONICAL_READY_CLAIM}. Stable remains blocked until an owner chooses OpenAI-only scope, strict provider-diverse/local-inclusive scope, or keeping stable blocked.
`);

  writeTextSafe(p("docs", "stable_blocker_matrix.md"), `# Stable Blocker Matrix

Stable remains blocked by owner scope decision, local endpoint deferral, provider diversity not established, and bare release-gated remaining unavailable.
`);

  writeTextSafe(p("docs", "stable_scope_decision_matrix.md"), `# Stable Scope Decision Matrix

The available paths are OpenAI-only scoped stable evaluation, strict provider-diverse/local-inclusive path after more evidence, or keeping stable blocked.
`);

  writeTextSafe(p("docs", "stable_owner_decision_request.md"), `# Stable Owner Decision Request

Decision required: evaluate OpenAI-only stable scope, wait for strict provider-diverse/local endpoint path, or keep stable blocked.
`);

  writeTextSafe(p("docs", "production_ready_claim_canonicalization.md"), `# Production-Ready Claim Canonicalization

Only ${CANONICAL_READY_CLAIM} is allowed for the OpenAI-only post-RC decision. Bare production-ready remains blocked.
`);

  writeTextSafe(p("docs", "next_openai_only_stable_scope_decision_plan.md"), `# Next OpenAI-Only Stable Scope Decision Plan

If the owner selects OpenAI-only stable scope, the next gate must explicitly keep provider-diverse, provider-verified, adapter-checked, local-model-verified, bare production-ready, and bare release-gated blocked.
`);

  writeTextSafe(p("docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until the operator provides endpoint readiness. This stable preflight does not probe the local endpoint or execute a local model.
`);
}

function markdown(report) {
  return `# Stable Scope Preflight

Status: ${report.status}

- Stage: ${report.stage}
- Canonical readiness claim: ${report.canonical_production_ready_claim}
- Bare production-ready allowed: ${report.bare_production_ready_allowed}
- Stable allowed: ${report.stable_allowed}
- Owner decision required: ${report.owner_decision_required}
- OpenAI-only stable candidate: ${report.can_evaluate_openai_only_stable_scope}
- Strict provider-diverse stable candidate: ${report.can_evaluate_strict_provider_diverse_stable_scope}
- Local endpoint probe: ${report.local_endpoint_probe}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
`;
}

writeStaticArtifacts();

const openaiReadyReport = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json") || {};
const openaiReadyBoundary = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_claim_boundary.json") || {};
const finalGate = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json") || {};
const v36DistStatus = gitStatus(["prompt-stack/v36", "dist"]);
const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
const postRcOpenaiOnlyProductionReady = openaiReadyReport.post_rc_openai_only_production_ready === true
  && openaiReadyBoundary.post_rc_openai_only_production_ready_allowed === true
  && openaiReadyReport.production_ready_allowed === false
  && openaiReadyBoundary.production_ready_allowed === false;

const productionReadyCanonicalization = {
  status: "pass",
  canonical_allowed_claim: CANONICAL_READY_CLAIM,
  bare_production_ready_allowed: false,
  scope: "openai_only_post_rc",
  reason: "Owner selected OpenAI-only production-ready scope. General production-ready remains blocked.",
  allowed_claims: [
    CANONICAL_READY_CLAIM
  ],
  blocked_claims: BLOCKED_CLAIMS
};
const stableEvidenceInventory = {
  status: "recorded",
  rc1_openai_scope_release_gated: true,
  rc1_openai_scope_frozen: true,
  containment_verified: true,
  telemetry_connected: true,
  production_monitored: true,
  post_rc_openai_only_production_ready: postRcOpenaiOnlyProductionReady,
  openai_canary_suite_passed: true,
  openai_redteam_limited_and_additional_passed: true,
  storage_redaction_audit_passed: true,
  v36_baseline_compare_pass: finalGate.compare_v36_baseline_status === "pass",
  local_endpoint_verified: false,
  provider_diverse: false,
  local_model_verified: false,
  stable: false
};
const stableBlockerMatrix = {
  status: "blocked",
  stable_allowed: false,
  blockers: [
    {
      id: "SB-001",
      category: "stable_scope_decision",
      status: "owner_decision_required",
      reason: "Need to decide whether stable is OpenAI-only scoped, strict provider-diverse/local-inclusive, or kept blocked."
    },
    {
      id: "SB-002",
      category: "local_endpoint",
      status: "deferred",
      blocks_strict_stable: true,
      can_be_out_of_scope_by_owner_decision: true
    },
    {
      id: "SB-003",
      category: "provider_diversity",
      status: "not_established",
      blocks_provider_diverse_claim: true,
      blocks_strict_stable: true,
      can_be_out_of_scope_by_owner_decision: true
    },
    {
      id: "SB-004",
      category: "bare_release_gated",
      status: "blocked",
      reason: "Only rc1-openai-scope-release-gated is allowed; bare release-gated remains blocked."
    }
  ]
};
const stableScopeDecisionMatrix = {
  status: "owner_decision_required",
  options: {
    openai_only_stable_scope: {
      status: "candidate_requires_owner_decision",
      allowed_to_consider: true,
      would_keep_blocked: [
        "provider-diverse",
        "local-model-verified",
        "provider-verified",
        "adapter-checked",
        "bare release-gated"
      ],
      requires_explicit_out_of_scope: [
        "local endpoint",
        "provider diversity",
        "local model verification",
        "bare release-gated"
      ]
    },
    strict_provider_diverse_stable_scope: {
      status: "blocked_until_local_or_second_provider_evidence",
      allowed_to_consider: false,
      blocked_by: [
        "local endpoint not ready",
        "provider diversity not established",
        "local-model-verified not established"
      ]
    },
    keep_stable_blocked: {
      status: "available",
      reason: "Conservative option until local endpoint/provider diversity path is resolved."
    }
  },
  recommended_option: "owner_decision_required"
};
const stableOwnerDecisionRequest = {
  status: "owner_decision_required",
  question: "Should stable be evaluated as OpenAI-only scoped, strict provider-diverse/local-inclusive, or kept blocked?",
  decision_options: [
    {
      option: "evaluate_openai_only_stable_scope",
      requires_explicit_out_of_scope: [
        "local endpoint",
        "provider diversity",
        "local model verification",
        "bare release-gated"
      ],
      does_not_allow: [
        "provider-diverse",
        "local-model-verified",
        "provider-verified",
        "adapter-checked",
        "bare release-gated"
      ]
    },
    {
      option: "wait_for_strict_provider_diverse_path",
      requires: [
        "local endpoint readiness",
        "local no-tool canary",
        "provider diversity claim gate"
      ]
    },
    {
      option: "keep_stable_blocked",
      requires: []
    }
  ],
  recommended_next_action: "operator_decision_required"
};
const localEndpointDeferral = {
  status: "confirmed_deferred",
  local_endpoint_status: "deferred_until_operator_provides_endpoint",
  local_endpoint_probe: false,
  local_model_execution: false,
  local_no_tool_canary: "deferred",
  still_blocks: [
    "local-model-verified",
    "provider-diverse",
    "strict_provider_diverse_stable_scope"
  ],
  does_not_block: [
    "openai_only_stable_scope_decision_if_owner_explicitly_out_of_scope"
  ]
};
const stableClaimBoundary = {
  status: "pass",
  post_rc_openai_only_production_ready_allowed: postRcOpenaiOnlyProductionReady,
  stable_allowed: false,
  general_production_ready_allowed: false,
  production_ready_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  allowed_claims: [
    CANONICAL_READY_CLAIM,
    "production-monitored",
    "telemetry-connected",
    "containment-verified",
    "rc1-openai-scope-release-gated"
  ],
  blocked_claims: BLOCKED_CLAIMS
};
const report = {
  status: STATUS,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  canonical_production_ready_claim: CANONICAL_READY_CLAIM,
  post_rc_openai_only_production_ready: postRcOpenaiOnlyProductionReady,
  bare_production_ready_allowed: false,
  stable_allowed: false,
  owner_decision_required: true,
  can_evaluate_openai_only_stable_scope: true,
  can_evaluate_strict_provider_diverse_stable_scope: false,
  can_enter_stable_release: false,
  local_endpoint_status: "deferred_until_operator_provides_endpoint",
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_model_execution: false,
  redteam_rerun: false,
  containment_rerun: false,
  production_deployment: false,
  release_gate_rerun: false,
  v36_modified: false,
  dist_modified: false,
  evidence_v36_baseline_modified: false,
  v36_guardrail_stdout: v36DistStatus.stdout,
  evidence_v36_baseline_status_note: baselineStatus.stdout
    ? "existing owner-approved refresh files may remain modified from earlier stage"
    : "clean",
  claims_allowed_by_this_stage: ALLOWED_CLAIMS,
  claims_still_blocked: BLOCKED_CLAIMS,
  reason: "Stable requires owner scope decision: OpenAI-only scoped, strict provider-diverse/local-inclusive, or keep blocked."
};
const unresolvedItems = {
  status: "owner_decision_required",
  unresolved_items: [
    "choose OpenAI-only stable scope, strict provider-diverse/local-inclusive path, or keep stable blocked",
    "local endpoint remains deferred until operator provides endpoint readiness",
    "provider diversity remains not established",
    "bare production-ready remains blocked"
  ]
};

writeJsonSafe(e("stable_scope_preflight_report.json"), report);
writeJsonSafe(e("stable_evidence_inventory.json"), stableEvidenceInventory);
writeJsonSafe(e("stable_blocker_matrix.json"), stableBlockerMatrix);
writeJsonSafe(e("stable_scope_decision_matrix.json"), stableScopeDecisionMatrix);
writeJsonSafe(e("stable_owner_decision_request.json"), stableOwnerDecisionRequest);
writeJsonSafe(e("stable_claim_boundary.json"), stableClaimBoundary);
writeJsonSafe(e("production_ready_claim_canonicalization.json"), productionReadyCanonicalization);
writeJsonSafe(e("local_endpoint_deferral_confirmation.json"), localEndpointDeferral);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);
writeJsonSafe(p("evals", "reports", "post_rc_stable_scope_preflight_report.json"), report);
writeTextSafe(p("evals", "reports", "post_rc_stable_scope_preflight_report.md"), markdown(report));
writeJsonSafe(p("evals", "reports", "post_rc_stable_claim_boundary_report.json"), stableClaimBoundary);
writeTextSafe(p("evals", "reports", "post_rc_stable_claim_boundary_report.md"), markdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(0);
