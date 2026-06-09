#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-evidence-bundle-draft";
const EVIDENCE_DIR = "post-stable-local-model-verification-evidence-bundle-draft";
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
  "post-stable-local-model-verification-evidence-bundle-drafted",
  "post-stable-local-model-verification-gap-register-recorded"
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

const evidenceSources = [
  {
    id: "no_tool_multimodel_comparison",
    path: "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"
  },
  {
    id: "gate_design",
    path: "evidence/post-stable-local-model-verification-gate-design/local_model_verification_gate_design_report.json"
  },
  {
    id: "structured_output_smoke",
    path: "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json"
  },
  {
    id: "tool_calling_mock_smoke",
    path: "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json"
  },
  {
    id: "replay_regression_smoke",
    path: "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json"
  },
  {
    id: "redaction_storage_audit",
    path: "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json"
  }
];
const sourceReports = evidenceSources.map((source) => ({
  ...source,
  report: readJsonIfExists(source.path)
}));
const protectedPaths = protectedStatus();

const localGenerationCalls = sourceReports.reduce((sum, source) => {
  const value = source.report?.new_local_generation_calls;
  return sum + (Number.isFinite(value) ? value : 0);
}, 0);

const satisfiedSurfaces = sourceReports
  .filter((source) => source.report?.status === "pass")
  .map((source) => source.id);
const missingEvidence = sourceReports
  .filter((source) => source.report?.status !== "pass")
  .map((source) => source.id);
const remainingGaps = [
  {
    id: "local_redteam_coverage",
    status: "missing",
    blocks_final_claim: true
  },
  {
    id: "adapter_conformance_dependency_backed_validation",
    status: fs.existsSync(p("node_modules", "yaml")) ? "available_not_executed" : "blocked_by_missing_node_modules",
    blocks_final_claim: true
  },
  {
    id: "owner_final_decision",
    status: "required",
    blocks_final_claim: true
  }
];
const finalClaimReady = missingEvidence.length === 0
  && remainingGaps.every((gap) => gap.blocks_final_claim !== true)
  && protectedPaths.reference_baseline_source_modified === false
  && protectedPaths.dist_modified === false
  && protectedPaths.evidence_reference_baseline_modified === false;

const report = {
  status: missingEvidence.length === 0 ? "pass" : "fail",
  stage: STAGE,
  models: ["qwen3:14b", "qwen3.6:27b"],
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  total_autopilot_local_generation_calls: localGenerationCalls,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  raw_request_stored: sourceReports.some((source) => source.report?.raw_request_stored === true),
  raw_response_stored: sourceReports.some((source) => source.report?.raw_response_stored === true),
  secrets_logged: sourceReports.some((source) => source.report?.secrets_logged === true),
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  satisfied_surfaces: satisfiedSurfaces,
  missing_evidence: missingEvidence,
  remaining_gaps: remainingGaps,
  can_enter_local_model_verification_final_gate: finalClaimReady,
  can_enter_local_model_verification_final_gate_preflight: missingEvidence.length === 0,
  owner_decision_required: true,
  claims_allowed: missingEvidence.length === 0 ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const bundleIndex = {
  status: report.status,
  stage: STAGE,
  source_reports: sourceReports.map((source) => ({
    id: source.id,
    path: source.path,
    status: source.report?.status || "missing"
  })),
  total_autopilot_local_generation_calls: localGenerationCalls
};

const claimBoundary = {
  status: report.status,
  stage: STAGE,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: report.claims_allowed,
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Evidence bundle is drafted, but final strong local claim remains blocked by missing coverage and owner decision."
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_redaction_storage_audit_passed_bundle_draft_pending",
  new_status: report.status === "pass"
    ? "local_model_verification_evidence_bundle_drafted_final_preflight_pending"
    : "local_model_verification_evidence_bundle_incomplete",
  unblocks: report.claims_allowed,
  still_blocks: BLOCKED_CLAIMS,
  next_required_actions: [
    "run local model verification final gate preflight",
    "resolve missing local redteam coverage before final strong local claim",
    "resolve adapter conformance dependency-backed validation before final strong local claim",
    "obtain owner final decision before final strong local claim"
  ]
};

const unresolvedItems = remainingGaps.map((gap, index) => ({
  id: `LMVB-${String(index + 1).padStart(3, "0")}`,
  severity: "medium",
  description: `${gap.id} is ${gap.status}`,
  blocks_final_claim: gap.blocks_final_claim,
  recommended_next_action: "Resolve this gap before final strong local verification claim."
}));

const md = `# Local Model Verification Evidence Bundle Draft

Status: ${report.status}

- Stage: ${STAGE}
- Satisfied surfaces: ${satisfiedSurfaces.join(", ")}
- Total autopilot local generation calls: ${localGenerationCalls}
- Can enter final gate: ${report.can_enter_local_model_verification_final_gate}
- Can enter final gate preflight: ${report.can_enter_local_model_verification_final_gate_preflight}
- Owner decision required: true

## Remaining Gaps

${remainingGaps.map((gap) => `- ${gap.id}: ${gap.status}`).join("\n")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_evidence_bundle_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_evidence_bundle_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_evidence_index.json"), bundleIndex);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_gap_register.json"), remainingGaps);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_bundle_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_bundle_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_bundle_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_model_verification_evidence_bundle_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_evidence_bundle_report.md"), md);
writeJson(p("evals", "reports", "local_model_verification_evidence_bundle_gate_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_evidence_bundle_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
