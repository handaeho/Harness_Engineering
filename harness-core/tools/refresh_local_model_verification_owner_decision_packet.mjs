#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-dependency-install-and-local-ollama-validation";
const EVIDENCE_DIR = "post-stable-local-model-verification-owner-decision-packet-refresh";
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
  "post-stable-local-model-verification-owner-decision-packet-ready"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function protectedStatus() {
  const result = spawnSync("git", ["status", "--short", "--", "legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  return {
    reference_baseline_source_modified: lines.some((line) => line.includes("legacy-reference-source")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_reference_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/reference-baseline"))
  };
}

const redteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const dependency = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-install/dependency_install_report.json");
const localOllama = readJsonIfExists("evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json");
const evidenceBundle = readJsonIfExists("evidence/post-stable-local-model-verification-evidence-bundle-draft/local_model_verification_evidence_bundle_report.json");
const baselineRefresh = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json");
const protectedPaths = protectedStatus();

const localRedteamPass = redteam?.status === "pass"
  && redteam?.dummy_secret_leaked === false
  && redteam?.raw_request_stored === false
  && redteam?.raw_response_stored === false;
const dependencyPass = dependency?.status === "pass"
  && dependency?.yaml_import_available === true
  && dependency?.openai_model_api_call === false
  && dependency?.telemetry_sink_write === false;
const localOllamaPass = localOllama?.status === "pass"
  && localOllama?.dependency_backed_validation === true
  && localOllama?.local_model_verified_allowed === false
  && localOllama?.adapter_checked_allowed === false;
const evidenceBundlePass = evidenceBundle?.status === "pass";
const approvedBaselineRefresh = baselineRefresh?.status === "pass"
  && baselineRefresh?.approval_phrase_verified === true
  && baselineRefresh?.baseline_refresh_performed === true
  && baselineRefresh?.reference_baseline_source_modified === false
  && baselineRefresh?.dist_modified === false;
const baselineGuardrailPass = !protectedPaths.evidence_reference_baseline_modified || approvedBaselineRefresh;
const ready = localRedteamPass
  && dependencyPass
  && localOllamaPass
  && evidenceBundlePass
  && !protectedPaths.reference_baseline_source_modified
  && !protectedPaths.dist_modified
  && baselineGuardrailPass;
const remainingBlockers = ready
  ? ["owner_final_decision"]
  : [
      ...(!localRedteamPass ? ["local_redteam_coverage"] : []),
      ...(!dependencyPass ? ["adapter_conformance_dependency_backed_validation"] : []),
      ...(!localOllamaPass ? ["adapter_conformance_local_ollama_execution"] : []),
      ...(!evidenceBundlePass ? ["local_model_verification_evidence_bundle"] : []),
      ...(!baselineGuardrailPass ? ["reference_baseline_owner_approved_refresh_record"] : []),
      "owner_final_decision"
    ];
const status = ready
  ? "ready_for_owner_decision_to_claim_local_model_verified"
  : "blocked";

const packet = {
  status,
  stage: STAGE,
  local_redteam_coverage: localRedteamPass ? "pass" : redteam?.status || "missing",
  adapter_conformance_dependency_backed_validation: dependencyPass ? "pass" : dependency?.status || "missing",
  adapter_conformance_local_ollama_execution: localOllamaPass ? "pass" : localOllama?.status || "missing",
  owner_final_decision: "required",
  ready_for_owner_decision_to_claim_local_model_verified: ready,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  adapter_checked_allowed: false,
  provider_verified_allowed: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  baseline_refresh_approval_recorded: approvedBaselineRefresh,
  remaining_blockers: remainingBlockers,
  claims_allowed: ready ? ALLOWED_CLAIMS : [],
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  ready_for_owner_decision_to_claim_local_model_verified: ready,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  allowed_claims: packet.claims_allowed,
  blocked_claims: BLOCKED_CLAIMS,
  reason: ready
    ? "All local evidence and adapter conformance review prerequisites are present; final strong local model wording still requires owner final decision."
    : "Owner decision packet refresh is blocked by missing or failed prerequisite evidence."
};

const blockerRecord = {
  status: ready ? "owner_final_decision_required" : "blocked",
  stage: STAGE,
  remaining_blockers: remainingBlockers,
  unresolved_items_count: remainingBlockers.length
};
const unresolvedItems = remainingBlockers.map((blocker, index) => ({
  id: `LMVREF-${String(index + 1).padStart(3, "0")}`,
  severity: blocker === "owner_final_decision" ? "low" : "medium",
  description: blocker,
  blocks_final_gate: true,
  recommended_next_action: blocker === "owner_final_decision"
    ? "Record owner final decision before enabling local-model-verified."
    : "Resolve prerequisite before owner final decision."
}));
const gateReport = {
  status: ready ? "pass" : "fail",
  stage: STAGE,
  local_redteam_coverage_pass: localRedteamPass,
  adapter_conformance_dependency_backed_validation_pass: dependencyPass,
  adapter_conformance_local_ollama_execution_pass: localOllamaPass,
  reference_baseline_guardrail_pass: baselineGuardrailPass,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  ready_for_owner_decision_to_claim_local_model_verified: ready,
  local_model_verified_allowed: false,
  owner_final_decision: "required",
  unresolved_items_count: unresolvedItems.length,
  remaining_blockers: remainingBlockers,
  claims_allowed: packet.claims_allowed,
  claims_blocked: BLOCKED_CLAIMS
};

writeJson(e("local_model_verification_owner_decision_packet_refreshed.json"), packet);
writeJson(e("local_model_verification_remaining_blockers_after_adapter.json"), blockerRecord);
writeJson(e("local_model_verification_claim_boundary_after_adapter.json"), claimBoundary);
writeJson(e("local_model_verification_owner_packet_refresh_gate_report.json"), gateReport);
writeJson(e("unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", "local_model_verification_owner_packet_refresh_report.json"), packet);
writeText(p("evals", "reports", "local_model_verification_owner_packet_refresh_report.md"), `# Local Model Verification Owner Packet Refresh

Status: ${status}

- Ready for owner decision: ${ready}
- Remaining blockers: ${remainingBlockers.join(", ")}
- Local model verified allowed: false
- Provider diverse allowed: false
- Adapter checked allowed: false
`);
writeJson(p("evals", "reports", "local_model_verification_owner_decision_gate_report.json"), gateReport);
writeText(p("release", "post_stable_local_model_verification_owner_packet_refresh.yaml"), `stage: ${STAGE}
status: ${status}
ready_for_owner_decision_to_claim_local_model_verified: ${ready}
owner_final_decision: required
local_model_verified_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
remaining_blockers:
${remainingBlockers.map((blocker) => `  - ${blocker}`).join("\n")}
`);
writeText(p("docs", "local_model_verification_owner_decision_packet_after_adapter.ko.md"), `# Local model verification owner decision packet after adapter

상태: ${status}

- local redteam coverage: ${packet.local_redteam_coverage}
- dependency-backed adapter validation: ${packet.adapter_conformance_dependency_backed_validation}
- local Ollama adapter conformance: ${packet.adapter_conformance_local_ollama_execution}
- owner final decision: required
- local-model-verified wording: false
`);
writeText(p("docs", "next_local_model_verification_final_gate_plan.ko.md"), `# Next local model verification final gate plan

다음 단계는 owner final decision 기록입니다.

- 현재 상태: ${status}
- strong local verification wording은 아직 차단
- owner가 최종 결정을 기록한 뒤에만 final gate를 별도 실행
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(gateReport.status === "pass" ? 0 : 1);
