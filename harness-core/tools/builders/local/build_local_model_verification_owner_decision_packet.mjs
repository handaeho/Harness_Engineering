#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-owner-decision-packet";
const EVIDENCE_DIR = "post-stable-local-model-verification-owner-decision-packet";
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
  "post-stable-local-model-verification-owner-decision-packet-drafted",
  "post-stable-local-model-verification-blocker-resolution-summarized"
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
    "harness-core/evidence/reference-baseline",
    "harness-core/node_modules"
  ]);
  const lines = status.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline")),
    node_modules_modified: lines.some((line) => line.includes("harness-core/node_modules"))
  };
}

const evidenceBundle = readJsonIfExists("evidence/post-stable-local-model-verification-evidence-bundle-draft/local_model_verification_evidence_bundle_report.json");
const finalGatePreflight = readJsonIfExists("evidence/post-stable-local-model-verification-final-gate-preflight/local_model_verification_final_gate_preflight_report.json");
const redteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const dependency = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-preflight/adapter_conformance_dependency_preflight_report.json");
const adapterConformance = readJsonIfExists("evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json");
const baselineRefresh = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json");
const protectedPaths = protectedStatus();

const redteamPassed = redteam?.status === "pass"
  && redteam?.dummy_secret_leaked === false
  && redteam?.raw_request_stored === false
  && redteam?.raw_response_stored === false;
const adapterDependencyReady = dependency?.can_run_dependency_backed_adapter_conformance === true;
const adapterConformancePassed = adapterConformance?.status === "pass"
  && adapterConformance?.dependency_backed_validation_executed === true;
const approvedBaselineRefresh = baselineRefresh?.status === "pass"
  && baselineRefresh?.approval_phrase_verified === true
  && baselineRefresh?.baseline_refresh_performed === true
  && baselineRefresh?.reference_baseline_source_modified === false
  && baselineRefresh?.dist_modified === false;
const stageKStatus = adapterConformancePassed
  ? "pass"
  : adapterDependencyReady
    ? "not_executed_in_owner_packet_stage"
    : "skipped_blocked_by_missing_dependency";

let status = "blocked_by_incomplete_coverage";
if (!redteam) {
  status = "blocked_by_missing_local_redteam_coverage";
} else if (!redteamPassed) {
  status = "blocked_by_failed_local_redteam";
} else if (!adapterDependencyReady || dependency?.status === "blocked_by_missing_node_modules") {
  status = "blocked_by_missing_adapter_conformance_dependency";
} else if (!adapterConformancePassed) {
  status = "blocked_by_incomplete_coverage";
} else {
  status = "ready_for_owner_decision_to_claim_local_model_verified";
}

const remainingBlockers = [];
if (!redteamPassed) {
  remainingBlockers.push({
    id: redteam ? "local_redteam_failed" : "local_redteam_coverage",
    status: redteam ? redteam.status : "missing",
    blocks_final_gate: true
  });
}
if (!adapterDependencyReady) {
  remainingBlockers.push({
    id: "adapter_conformance_dependency_backed_validation",
    status: dependency?.status || "missing",
    blocks_final_gate: true
  });
}
if (!adapterConformancePassed) {
  remainingBlockers.push({
    id: "adapter_conformance_local_ollama_execution",
    status: stageKStatus,
    blocks_final_gate: true
  });
}
remainingBlockers.push({
  id: "owner_final_decision",
  status: status === "ready_for_owner_decision_to_claim_local_model_verified" ? "required" : "blocked_until_required_evidence_present",
  blocks_final_gate: true
});

const evidenceSummary = {
  status,
  stage: STAGE,
  evidence_sources: [
    {
      id: "local_model_verification_evidence_bundle",
      path: "evidence/post-stable-local-model-verification-evidence-bundle-draft/local_model_verification_evidence_bundle_report.json",
      status: evidenceBundle?.status || "missing"
    },
    {
      id: "final_gate_preflight",
      path: "evidence/post-stable-local-model-verification-final-gate-preflight/local_model_verification_final_gate_preflight_report.json",
      status: finalGatePreflight?.status || "missing"
    },
    {
      id: "local_redteam_bounded_smoke",
      path: "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json",
      status: redteam?.status || "missing"
    },
    {
      id: "adapter_conformance_dependency_preflight",
      path: "evidence/post-stable-adapter-conformance-dependency-preflight/adapter_conformance_dependency_preflight_report.json",
      status: dependency?.status || "missing"
    },
    {
      id: "adapter_conformance_local_ollama_execution",
      path: "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
      status: adapterConformance?.status || "missing"
    }
  ],
  local_redteam_coverage_recorded: redteamPassed,
  adapter_dependency_status_recorded: Boolean(dependency),
  adapter_conformance_execution_recorded: adapterConformancePassed,
  stage_k_status: stageKStatus
};

const packet = {
  status,
  stage: STAGE,
  ready_for_owner_decision_to_claim_local_model_verified: status === "ready_for_owner_decision_to_claim_local_model_verified",
  local_redteam_result: {
    status: redteam?.status || "missing",
    models_tested: redteam?.models_tested || [],
    total_cases: redteam?.total_cases || 0,
    cases_passed: redteam?.cases_passed || 0,
    cases_failed: redteam?.cases_failed || 0,
    dummy_secret_leaked: redteam?.dummy_secret_leaked ?? null,
    raw_request_stored: redteam?.raw_request_stored ?? null,
    raw_response_stored: redteam?.raw_response_stored ?? null
  },
  adapter_dependency_result: {
    status: dependency?.status || "missing",
    yaml_import_available: dependency?.yaml_import_available ?? false,
    dependency_install_approved: dependency?.dependency_install_approved ?? false,
    can_run_dependency_backed_adapter_conformance: dependency?.can_run_dependency_backed_adapter_conformance ?? false,
    owner_approval_required: dependency?.owner_approval_required ?? true,
    required_approval_phrase: dependency?.required_approval_phrase || null
  },
  stage_k_adapter_conformance_result: {
    status: stageKStatus,
    executed: adapterConformancePassed,
    reason: adapterDependencyReady
      ? adapterConformancePassed
        ? "dependency-backed adapter conformance local Ollama evidence is recorded"
        : "dependency ready but execution is outside owner packet builder"
      : "dependency-backed adapter conformance is blocked by missing local dependency"
  },
  remaining_blockers: remainingBlockers,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  node_modules_modified: protectedPaths.node_modules_modified,
  claims_allowed: ALLOWED_CLAIMS,
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  reason: status === "ready_for_owner_decision_to_claim_local_model_verified"
    ? "Owner decision packet is ready for owner final decision; final strong local wording remains unavailable until owner decision is recorded."
    : "Owner decision packet is drafted, but final strong local wording remains unavailable until remaining evidence blockers are resolved."
};

const gate = {
  status,
  stage: STAGE,
  ready_for_owner_decision_to_claim_local_model_verified: packet.ready_for_owner_decision_to_claim_local_model_verified,
  local_redteam_coverage_recorded: redteamPassed,
  adapter_dependency_status_recorded: Boolean(dependency),
  adapter_conformance_execution_recorded: adapterConformancePassed,
  remaining_blockers_count: remainingBlockers.length,
  remaining_blockers: remainingBlockers,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  claims_allowed: ALLOWED_CLAIMS,
  claims_blocked: BLOCKED_CLAIMS
};

const unresolvedItems = remainingBlockers.map((item, index) => ({
  id: `LMVOD-${String(index + 1).padStart(3, "0")}`,
  severity: item.id.includes("adapter") ? "medium" : "medium",
  description: `${item.id} is ${item.status}`,
  blocks_final_gate: true,
  recommended_next_action: item.id.includes("adapter")
    ? "Resolve dependency-backed adapter conformance before final owner decision."
    : "Record owner decision only after required evidence is present."
}));

const md = `# Local Model Verification Owner Decision Packet

Status: ${packet.status}

- Stage: ${STAGE}
- Ready for owner decision to claim strong local verification wording: ${packet.ready_for_owner_decision_to_claim_local_model_verified}
- Local redteam coverage recorded: ${redteamPassed}
- Adapter dependency status: ${packet.adapter_dependency_result.status}
- Stage K adapter conformance: ${stageKStatus}
- Remaining blockers: ${remainingBlockers.length}
`;

const docsKo = `# Local model verification owner decision packet

상태: ${packet.status}

- bounded local redteam: ${redteam?.status || "missing"}
- adapter dependency preflight: ${dependency?.status || "missing"}
- Stage K adapter conformance: ${stageKStatus}
- owner final decision 준비 여부: ${packet.ready_for_owner_decision_to_claim_local_model_verified}
- final strong local verification wording 허용 여부: false

현재는 required evidence가 정리되어 owner final decision 대기 상태다. 그래도 owner final decision 없이는 final strong local verification wording을 열지 않는다.
`;

const nextPlanKo = `# Next local model verification final gate plan

다음 안전 단계:

1. owner가 local verification evidence packet을 검토한다.
2. 별도 owner final decision record를 남긴다.
3. final gate는 그 decision record가 있을 때만 실행한다.
4. final gate 전까지 \`local-model-verified\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`production-ready\`, \`stable\`, \`release-gated\` wording은 계속 차단한다.
`;

const scopeYaml = `stage: ${STAGE}

approved_actions:
  owner_decision_packet_draft: true
  evidence_summary: true
  remaining_blocker_summary: true
  claim_boundary_update: true

forbidden_execution:
  local_model_verified_final_claim: true
  provider_diverse_claim: true
  provider_verified_claim: true
  adapter_checked_claim: true
  openai_model_api_call: true
  telemetry_sink_write: true
  npm_install_without_approval: true
  npm_ci_without_approval: true
`;

writeText(p("release", "post_stable_local_model_verification_owner_decision_packet_scope.yaml"), scopeYaml);
writeText(p("release", "post_stable_local_model_verification_owner_decision_gate.yaml"), `stage: ${STAGE}
status: ${status}
ready_for_owner_decision_to_claim_local_model_verified: ${packet.ready_for_owner_decision_to_claim_local_model_verified}
remaining_blockers_count: ${remainingBlockers.length}
`);
writeText(p("release", "post_stable_local_model_verification_claim_boundary.yaml"), `stage: ${STAGE}
status: ${status}
local_model_verified_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
`);

writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_owner_decision_packet.json"), packet);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_evidence_summary.json"), evidenceSummary);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_remaining_blockers.json"), remainingBlockers);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_owner_decision_gate_report.json"), gate);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_model_verification_owner_decision_packet_report.json"), packet);
writeText(p("evals", "reports", "local_model_verification_owner_decision_packet_report.md"), md);
writeJson(p("evals", "reports", "local_model_verification_owner_decision_gate_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_owner_decision_gate_report.md"), md);

writeText(p("docs", "local_model_verification_owner_decision_packet.ko.md"), docsKo);
writeText(p("docs", "next_local_model_verification_final_gate_plan.ko.md"), nextPlanKo);

console.log(JSON.stringify(packet, null, 2));
process.exit(0);
