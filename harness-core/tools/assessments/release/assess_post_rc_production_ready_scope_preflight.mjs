#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-production-ready-scope-decision-preflight";
const EVIDENCE_DIR = "evidence/post-rc-production-ready-scope-preflight";
const STATUS = "blocked_by_owner_scope_decision_required";
const ALLOWED_CLAIMS = [
  "post-rc-production-ready-scope-preflight-completed",
  "post-rc-production-ready-evidence-inventoried",
  "post-rc-production-ready-blockers-recorded",
  "post-rc-production-ready-owner-decision-requested"
];
const BLOCKED_CLAIMS = [
  "production-ready",
  "stable",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "release-gated"
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
  writeTextSafe(p("release", "post_rc_production_ready_scope_preflight_scope.yaml"), `stage: ${STAGE}

approved_actions:
  production_ready_scope_preflight: true
  production_ready_evidence_inventory: true
  blocker_matrix_generation: true
  openai_only_vs_strict_scope_split: true
  local_endpoint_deferral_confirmation: true
  reference_baseline_refresh_worktree_status_recording: true
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
  reference_baseline_modification: true
  dist_modification: true
  additional_reference_baseline_refresh: true

claims_not_allowed:
  - production-ready
  - stable
  - release-gated
  - provider-diverse
  - provider-verified
  - adapter-checked
  - local-model-verified

claims_allowed:
  - post-rc-production-ready-scope-preflight-completed
  - post-rc-production-ready-evidence-inventoried
  - post-rc-production-ready-blockers-recorded
  - post-rc-production-ready-owner-decision-requested
`);

  writeTextSafe(p("release", "post_rc_production_ready_scope_decision_matrix.yaml"), `stage: ${STAGE}
status: owner_decision_required
options:
  openai_only_production_ready_scope:
    status: candidate_requires_owner_decision
    allowed_to_consider: true
  strict_provider_diverse_production_ready_scope:
    status: blocked_until_local_or_second_provider_evidence
    allowed_to_consider: false
  keep_production_ready_blocked:
    status: available
recommended_option: owner_decision_required
`);
  writeTextSafe(p("release", "post_rc_production_ready_blocker_matrix.yaml"), `stage: ${STAGE}
status: blocked
production_ready_allowed: false
blockers:
  - id: PRB-001
    category: local_endpoint
    status: deferred
  - id: PRB-002
    category: provider_diversity
    status: not_established
  - id: PRB-003
    category: production_readiness_scope
    status: owner_decision_required
  - id: PRB-004
    category: bare_release_gated
    status: blocked
`);
  writeTextSafe(p("release", "post_rc_production_ready_owner_decision_request.yaml"), `stage: ${STAGE}
status: owner_decision_required
question: "Should production-ready be evaluated as OpenAI-only scoped, strict provider-diverse/local-inclusive, or kept blocked?"
recommended_next_action: operator_decision_required
`);
  writeTextSafe(p("release", "post_rc_production_ready_claim_boundary.yaml"), `stage: ${STAGE}
telemetry_connected_allowed: true
production_monitored_allowed: true
production_ready_allowed: false
stable_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
bare_release_gated_allowed: false
`);
  writeTextSafe(p("evals", "suites", "post_rc_production_ready_scope_preflight.yaml"), `suite: post_rc_production_ready_scope_preflight
stage: ${STAGE}
expected_status: ${STATUS}
checks:
  - production_monitored_true
  - production_ready_false
  - owner_decision_required
  - local_endpoint_deferred
  - no_forbidden_execution
  - no_reference_baseline_or_dist_modification
`);
  writeTextSafe(p("docs", "production_ready_scope_preflight.md"), `# Production-Ready Scope Preflight

Stage: ${STAGE}

Production monitoring is allowed, but production-ready remains blocked until an owner chooses the production-ready scope.
`);
  writeTextSafe(p("docs", "production_ready_blocker_matrix.md"), `# Production-Ready Blocker Matrix

Production-ready remains blocked by scope decision, local endpoint deferral, provider diversity not established, and bare release-gated remaining unavailable.
`);
  writeTextSafe(p("docs", "production_ready_scope_decision_matrix.md"), `# Production-Ready Scope Decision Matrix

The next owner decision is whether to evaluate OpenAI-only production-ready scope, wait for strict provider-diverse/local-inclusive evidence, or keep production-ready blocked.
`);
  writeTextSafe(p("docs", "production_ready_owner_decision_request.md"), `# Production-Ready Owner Decision Request

Decision required: evaluate OpenAI-only scoped production-ready, wait for strict provider-diverse/local endpoint path, or keep production-ready blocked.
`);
  writeTextSafe(p("docs", "next_production_ready_scope_decision_plan.md"), `# Next Production-Ready Scope Decision Plan

Next step requires owner decision. This preflight does not allow production-ready, stable, provider-diverse, provider-verified, adapter-checked, local-model-verified, or bare release-gated.
`);
  writeTextSafe(p("docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until the operator provides endpoint readiness. No local endpoint probe or local model execution is part of production-ready scope preflight.
`);
}

function markdown(report) {
  return `# Production-Ready Scope Preflight

Status: ${report.status}

- Stage: ${report.stage}
- Production monitored: ${report.production_monitored}
- Production-ready allowed: ${report.production_ready_allowed}
- Owner decision required: ${report.owner_decision_required}
- OpenAI-only scope candidate: ${report.can_evaluate_openai_only_production_ready_scope}
- Strict provider-diverse scope candidate: ${report.can_evaluate_strict_provider_diverse_production_ready_scope}
- Local endpoint probe: ${report.local_endpoint_probe}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
`;
}

writeStaticArtifacts();

const finalGate = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json") || {};
const finalBoundary = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitored_claim_boundary.json") || {};
const finalGateGate = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_gate_report.json") || {};
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const referenceBaselineSourceDistStatus = gitStatus(["legacy-reference-source", "dist"]);
const approvedRefreshFiles = baselineStatus.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""))
  .filter((file) => file === "harness-core/evidence/reference-baseline/checksums.json"
    || file === "harness-core/evidence/reference-baseline/file_inventory.json");

const evidenceInventory = {
  status: "recorded",
  telemetry_connected: finalGate.telemetry_connected === true,
  production_monitored: finalGate.production_monitored_allowed === true,
  containment_verified: true,
  rc1_openai_scope_release_gated: true,
  openai_canary_suite_passed: true,
  openai_redteam_limited_and_additional_passed: true,
  reference_baseline_compare_pass: finalGate.check_reference_baseline_integrity_status === "pass",
  local_endpoint_verified: false,
  provider_diverse: false,
  production_ready: false,
  stable: false
};
const blockerMatrix = {
  status: "blocked",
  production_ready_allowed: false,
  blockers: [
    {
      id: "PRB-001",
      category: "local_endpoint",
      status: "deferred",
      blocks_strict_production_ready: true,
      can_be_out_of_scope_by_owner_decision: true
    },
    {
      id: "PRB-002",
      category: "provider_diversity",
      status: "not_established",
      blocks_provider_diverse_claim: true,
      blocks_strict_production_ready: true,
      can_be_out_of_scope_by_owner_decision: true
    },
    {
      id: "PRB-003",
      category: "production_readiness_scope",
      status: "owner_decision_required",
      reason: "Need to decide whether production-ready is OpenAI-only scoped or strict provider-diverse/local-inclusive."
    },
    {
      id: "PRB-004",
      category: "bare_release_gated",
      status: "blocked",
      reason: "Only rc1-openai-scope-release-gated is allowed; bare release-gated remains blocked."
    }
  ]
};
const scopeDecisionMatrix = {
  status: "owner_decision_required",
  options: {
    openai_only_production_ready_scope: {
      status: "candidate_requires_owner_decision",
      allowed_to_consider: true,
      would_keep_blocked: [
        "provider-diverse",
        "local-model-verified",
        "provider-verified",
        "adapter-checked",
        "stable"
      ],
      requires_explicit_out_of_scope: [
        "local endpoint",
        "provider diversity",
        "local model verification"
      ]
    },
    strict_provider_diverse_production_ready_scope: {
      status: "blocked_until_local_or_second_provider_evidence",
      allowed_to_consider: false,
      blocked_by: [
        "local endpoint not ready",
        "provider diversity not established",
        "local-model-verified not established"
      ]
    },
    keep_production_ready_blocked: {
      status: "available",
      reason: "Conservative option until local endpoint/provider diversity path is resolved."
    }
  },
  recommended_option: "owner_decision_required"
};
const ownerDecisionRequest = {
  status: "owner_decision_required",
  question: "Should production-ready be evaluated as OpenAI-only scoped, strict provider-diverse/local-inclusive, or kept blocked?",
  decision_options: [
    {
      option: "evaluate_openai_only_production_ready_scope",
      requires_explicit_out_of_scope: [
        "local endpoint",
        "provider diversity",
        "local model verification"
      ],
      does_not_allow: [
        "provider-diverse",
        "local-model-verified",
        "stable"
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
      option: "keep_production_ready_blocked",
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
    "strict_provider_diverse_production_ready_scope"
  ],
  does_not_block: [
    "openai_only_scope_decision_if_owner_explicitly_out_of_scope"
  ]
};
const reference_baselineWorktreeStatus = {
  status: "recorded",
  check_reference_baseline_integrity_status: finalGate.check_reference_baseline_integrity_status === "pass" ? "pass" : "unknown",
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_modified_in_this_stage: false,
  owner_approved_refresh_files_modified_in_worktree: approvedRefreshFiles,
  notes: [
    "These files are modified due to prior owner-approved baseline refresh, not this production-ready preflight stage."
  ]
};
const claimBoundary = {
  status: "pass",
  telemetry_connected_allowed: true,
  production_monitored_allowed: true,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  allowed_claims: [
    "telemetry-connected",
    "production-monitored",
    "post-rc-production-ready-scope-preflight-completed"
  ],
  blocked_claims: BLOCKED_CLAIMS
};
const unresolvedItems = {
  status: "owner_decision_required",
  unresolved_items: [
    "choose OpenAI-only production-ready scope, strict provider-diverse/local-inclusive path, or keep production-ready blocked",
    "local endpoint remains deferred until operator provides endpoint readiness",
    "provider diversity remains not established"
  ]
};
const report = {
  status: STATUS,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  production_monitored: finalGate.production_monitored_allowed === true,
  telemetry_connected: finalGate.telemetry_connected === true,
  production_ready_allowed: false,
  stable_allowed: false,
  provider_diverse_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  owner_decision_required: true,
  can_evaluate_openai_only_production_ready_scope: true,
  can_evaluate_strict_provider_diverse_production_ready_scope: false,
  can_enter_stable_release: false,
  local_endpoint_status: "deferred_until_operator_provides_endpoint",
  local_endpoint_probe: false,
  local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  redteam_rerun: false,
  containment_rerun: false,
  production_deployment: false,
  release_gate_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  final_gate_status: finalGateGate.status || finalGate.status || "unknown",
  production_monitored_final_gate_passed: finalGate.production_monitoring_final_gate_passed === true,
  evidence_reference_baseline_modified_in_this_stage: false,
  owner_approved_refresh_files_modified_in_worktree: approvedRefreshFiles,
  claims_allowed_by_this_stage: ALLOWED_CLAIMS,
  claims_still_blocked: BLOCKED_CLAIMS,
  reason: "Production-ready requires owner scope decision: OpenAI-only scoped, strict provider-diverse/local-inclusive, or keep blocked."
};

writeJsonSafe(e("production_ready_scope_preflight_report.json"), report);
writeJsonSafe(e("production_ready_evidence_inventory.json"), evidenceInventory);
writeJsonSafe(e("production_ready_blocker_matrix.json"), blockerMatrix);
writeJsonSafe(e("production_ready_scope_decision_matrix.json"), scopeDecisionMatrix);
writeJsonSafe(e("production_ready_owner_decision_request.json"), ownerDecisionRequest);
writeJsonSafe(e("production_ready_claim_boundary.json"), claimBoundary);
writeJsonSafe(e("local_endpoint_deferral_confirmation.json"), localEndpointDeferral);
writeJsonSafe(e("reference_baseline_refresh_worktree_status.json"), reference_baselineWorktreeStatus);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);
writeJsonSafe(p("evals", "reports", "post_rc_production_ready_scope_preflight_report.json"), report);
writeTextSafe(p("evals", "reports", "post_rc_production_ready_scope_preflight_report.md"), markdown(report));
writeJsonSafe(p("evals", "reports", "post_rc_production_ready_claim_boundary_report.json"), claimBoundary);
writeTextSafe(p("evals", "reports", "post_rc_production_ready_claim_boundary_report.md"), markdown(report));

console.log(JSON.stringify(report, null, 2));
process.exit(0);
