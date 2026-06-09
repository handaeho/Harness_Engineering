#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-gate-design";
const EVIDENCE_DIR = "post-stable-local-model-verification-gate-design";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-local-model-verification-gate-designed",
  "post-stable-local-model-verification-criteria-matrix-recorded",
  "post-stable-local-model-verification-execution-plan-drafted"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function gitStatusFor(paths) {
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

function protectedStatus() {
  const status = gitStatusFor([
    "legacy-reference-source",
    "dist",
    "harness-core/evidence/reference-baseline"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

const noToolComparison = readJsonIfExists(
  "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"
);
const protectedPaths = protectedStatus();

const criteriaMatrix = {
  status: "drafted",
  stage: STAGE,
  models_in_scope: [
    "qwen3:14b",
    "qwen3.6:27b"
  ],
  criteria: [
    {
      id: "local_no_tool_multimodel",
      required_for_final_gate: true,
      current_status: noToolComparison?.status === "pass" ? "satisfied" : "missing",
      evidence: "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"
    },
    {
      id: "structured_output_smoke",
      required_for_final_gate: true,
      current_status: "pending",
      next_stage: "v2.0.0-post-stable-local-structured-output-smoke-canary"
    },
    {
      id: "tool_calling_mock_smoke",
      required_for_final_gate: true,
      current_status: "pending",
      next_stage: "v2.0.0-post-stable-local-tool-calling-mock-smoke-canary"
    },
    {
      id: "replay_regression_smoke",
      required_for_final_gate: true,
      current_status: "pending",
      next_stage: "v2.0.0-post-stable-local-replay-regression-smoke"
    },
    {
      id: "redaction_storage_cross_suite_audit",
      required_for_final_gate: true,
      current_status: "pending",
      next_stage: "v2.0.0-post-stable-local-redaction-storage-cross-suite-audit"
    },
    {
      id: "local_redteam_coverage",
      required_for_final_gate: true,
      current_status: "not_scheduled_in_autopilot_sequence",
      blocker_if_missing: true
    },
    {
      id: "adapter_conformance_dependency_backed_validation",
      required_for_final_gate: true,
      current_status: fs.existsSync(p("node_modules", "yaml")) ? "available_not_executed_in_design_stage" : "blocked_by_missing_node_modules",
      blocker_if_missing: true
    },
    {
      id: "owner_final_decision",
      required_for_final_gate: true,
      current_status: "required_after_preflight",
      blocker_if_missing: true
    }
  ]
};

const gateDefinition = {
  stage: STAGE,
  gate_type: "local_model_verification_gate_design",
  models_in_scope: criteriaMatrix.models_in_scope,
  required_surfaces: criteriaMatrix.criteria
    .filter((item) => item.required_for_final_gate)
    .map((item) => item.id),
  automatic_claim_enablement: false,
  final_gate_requires_owner_decision: true,
  local_model_verified_allowed_in_design_stage: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};

const claimBoundary = {
  status: noToolComparison?.status === "pass" ? "pass" : "fail",
  stage: STAGE,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: noToolComparison?.status === "pass" ? ALLOWED_CLAIMS : [],
  blocked_claims: BLOCKED_CLAIMS,
  reason: "This stage designs criteria only; it does not execute the final local verification gate."
};

const executionPlanMd = `# Local Model Verification Execution Plan

Stage: ${STAGE}

## Required Surfaces

- Multi-model no-tool comparison
- Structured-output smoke canary
- Tool-calling mock smoke canary
- Replay/regression smoke
- Redaction/storage cross-suite audit
- Local redteam coverage
- Adapter conformance dependency-backed validation
- Owner final decision before any strong local verification claim

## Autopilot Boundary

Autopilot may run structured-output smoke, tool-calling mock smoke, replay/regression smoke, and redaction/storage audit for \`qwen3:14b\` and \`qwen3.6:27b\`.

Autopilot must stop before enabling any strong local verification claim.
`;

const gateYaml = `stage: ${STAGE}
gate_type: local_model_verification_gate_design
models_in_scope:
  - qwen3:14b
  - qwen3.6:27b
required_surfaces:
${gateDefinition.required_surfaces.map((item) => `  - ${item}`).join("\n")}
automatic_claim_enablement: false
final_gate_requires_owner_decision: true
local_model_verified_allowed_in_design_stage: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
`;

const designPass = noToolComparison?.status === "pass"
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false;

const report = {
  status: designPass ? "pass" : "fail",
  stage: STAGE,
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: false,
  raw_response_stored: false,
  secrets_logged: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  no_tool_multimodel_comparison_passed: noToolComparison?.status === "pass",
  structured_output_smoke_required: true,
  tool_calling_mock_smoke_required: true,
  replay_regression_smoke_required: true,
  redaction_storage_cross_suite_audit_required: true,
  local_redteam_coverage_required_for_final_gate: true,
  adapter_conformance_required_for_final_gate: true,
  owner_decision_required_for_final_gate: true,
  dependency_backed_validation_status: fs.existsSync(p("node_modules", "yaml")) ? "available_not_executed_in_design_stage" : "blocked_by_missing_node_modules",
  criteria_matrix_status: criteriaMatrix.status,
  claims_allowed: claimBoundary.allowed_claims,
  claims_blocked: BLOCKED_CLAIMS,
  unresolved_items_count: designPass ? 0 : 1
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_no_tool_multimodel_comparison_passed_local_model_verification_gate_design_pending",
  new_status: designPass
    ? "local_model_verification_gate_designed_smoke_execution_pending"
    : "local_model_verification_gate_design_failed",
  unblocks: designPass ? ALLOWED_CLAIMS : [],
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "run structured-output smoke canary",
    "run tool-calling mock smoke canary",
    "run replay/regression smoke",
    "run redaction/storage cross-suite audit"
  ]
};

const unresolvedItems = designPass ? [] : [{
  id: "LMVGD-001",
  severity: "high",
  description: "Local model verification gate design preconditions were not met.",
  recommended_next_action: "Review the no-tool multi-model comparison and protected path status."
}];

const md = `# Local Model Verification Gate Design

Status: ${report.status}

- Stage: ${STAGE}
- New local model execution: false
- Structured-output smoke required: true
- Tool-calling mock smoke required: true
- Replay/regression smoke required: true
- Redaction/storage audit required: true
- Dependency-backed validation: ${report.dependency_backed_validation_status}

## Claim Boundary

- local_model_verified_allowed: false
- provider_diverse_allowed: false
- provider_verified_allowed: false
- adapter_checked_allowed: false
`;

writeText(p("release", "local_model_verification_gate.yaml"), gateYaml);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_gate_design_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_gate_design_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_criteria_matrix.json"), criteriaMatrix);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_gate_definition.json"), gateDefinition);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_gate_design_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_gate_design_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeText(p("docs", "local_model_verification_execution_plan.md"), executionPlanMd);
writeText(p("docs", "local_model_verification_gate_design.ko.md"), md);
writeJson(p("evals", "reports", "local_model_verification_gate_design_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_gate_design_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
