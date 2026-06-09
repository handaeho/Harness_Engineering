#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate-preflight";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate-preflight";
const BUNDLE_DIR = "post-stable-local-model-verification-evidence-bundle-draft";
const EXPECTED_BLOCKED_STATUS = "blocked_by_missing_local_verification_coverage";
const READY_FOR_OWNER_DECISION_STATUS = "ready_for_owner_decision_to_claim_local_model_verified";
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
  "post-stable-local-model-verification-final-gate-preflight-completed",
  "post-stable-local-model-verification-final-gate-blockers-recorded",
  "post-stable-local-model-verification-ready-for-owner-decision"
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

function precondition(id, status, required, detail = {}) {
  return { id, status, required, blocks_final_gate: required && status !== "pass", detail };
}

const bundleReport = readJsonIfExists(`evidence/${BUNDLE_DIR}/local_model_verification_evidence_bundle_report.json`);
const bundleIndex = readJsonIfExists(`evidence/${BUNDLE_DIR}/local_model_verification_evidence_index.json`);
const gapRegister = readJsonIfExists(`evidence/${BUNDLE_DIR}/local_model_verification_gap_register.json`) || [];
const localRedteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const adapterConformance = readJsonIfExists("evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json");
const reference_baselineDependency = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_dependency_for_local_verification_gate_report.json");
const baselineRefresh = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json");
const protectedPaths = protectedStatus();

const sourceStatuses = Array.isArray(bundleIndex?.source_reports)
  ? bundleIndex.source_reports
  : [];
const gapById = new Map(gapRegister.map((gap) => [gap.id, gap]));
const ownerGap = gapById.get("owner_final_decision");
const localRedteamPass = localRedteam?.status === "pass"
  && localRedteam?.dummy_secret_leaked === false
  && localRedteam?.raw_request_stored === false
  && localRedteam?.raw_response_stored === false
  && localRedteam?.secrets_logged === false;
const adapterConformancePass = adapterConformance?.status === "pass"
  && adapterConformance?.dependency_backed_validation_executed === true
  && adapterConformance?.openai_model_api_call === false
  && adapterConformance?.telemetry_sink_write === false;
const reference_baselineDependencyPass = reference_baselineDependency?.status === "ready_after_repair"
  && reference_baselineDependency?.check_reference_baseline_integrity_status === "pass"
  && reference_baselineDependency?.can_claim_local_model_verified === false;
const approvedBaselineRefresh = baselineRefresh?.status === "pass"
  && baselineRefresh?.approval_phrase_verified === true
  && baselineRefresh?.baseline_refresh_performed === true
  && baselineRefresh?.reference_baseline_source_modified === false
  && baselineRefresh?.dist_modified === false;
const baselineGuardrailPass = !protectedPaths.evidence_reference_baseline_modified || approvedBaselineRefresh;

const preconditions = [
  precondition("evidence_bundle_draft_passed", bundleReport?.status === "pass" ? "pass" : "fail", true, {
    bundle_status: bundleReport?.status || "missing"
  }),
  ...sourceStatuses.map((source) => precondition(`source_${source.id}`, source.status === "pass" ? "pass" : "fail", true, {
    path: source.path,
    source_status: source.status
  })),
  precondition("local_redteam_coverage", localRedteamPass ? "pass" : "missing", true, {
    observed_status: localRedteam?.status || "missing",
    models_tested: localRedteam?.models_tested || [],
    total_cases: localRedteam?.total_cases,
    cases_passed: localRedteam?.cases_passed,
    raw_request_stored: localRedteam?.raw_request_stored,
    raw_response_stored: localRedteam?.raw_response_stored
  }),
  precondition(
    "adapter_conformance_dependency_backed_validation",
    adapterConformancePass ? "pass" : (adapterConformance?.status || "missing"),
    true,
    {
      observed_status: adapterConformance?.status || "missing",
      dependency_backed_validation_executed: adapterConformance?.dependency_backed_validation_executed,
      node_modules_yaml_present: fs.existsSync(p("node_modules", "yaml"))
    }
  ),
  precondition("reference_baseline_dependency_restored", reference_baselineDependencyPass ? "pass" : (reference_baselineDependency?.status || "missing"), true, {
    observed_status: reference_baselineDependency?.status || "missing",
    check_reference_baseline_integrity_status: reference_baselineDependency?.check_reference_baseline_integrity_status
  }),
  precondition("owner_final_decision", ownerGap?.status === "pass" ? "pass" : "required", true, {
    observed_status: ownerGap?.status || "required"
  }),
  precondition("protected_paths_unmodified", (
    protectedPaths.reference_baseline_source_modified === false
      && protectedPaths.dist_modified === false
      && baselineGuardrailPass
  ) ? "pass" : "fail", true, protectedPaths),
  precondition("raw_storage_absent", (
    bundleReport?.raw_request_stored === false
      && bundleReport?.raw_response_stored === false
      && bundleReport?.secrets_logged === false
  ) ? "pass" : "fail", true, {
    raw_request_stored: bundleReport?.raw_request_stored,
    raw_response_stored: bundleReport?.raw_response_stored,
    secrets_logged: bundleReport?.secrets_logged
  })
];

const blockingPreconditions = preconditions.filter((item) => item.blocks_final_gate);
const nonOwnerBlockingPreconditions = blockingPreconditions.filter((item) => item.id !== "owner_final_decision");
const status = nonOwnerBlockingPreconditions.length === 0 ? READY_FOR_OWNER_DECISION_STATUS : EXPECTED_BLOCKED_STATUS;
const blockedBy = blockingPreconditions.map((item) => item.id);

const report = {
  status,
  stage: STAGE,
  models: ["qwen3:14b", "qwen3.6:27b"],
  source_evidence_bundle_status: bundleReport?.status || "missing",
  new_local_model_execution: false,
  new_local_generation_calls: 0,
  total_autopilot_local_generation_calls: bundleReport?.total_autopilot_local_generation_calls || 0,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: protectedPaths.reference_baseline_source_modified,
  dist_modified: protectedPaths.dist_modified,
  evidence_reference_baseline_modified: protectedPaths.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: approvedBaselineRefresh,
  raw_request_stored: bundleReport?.raw_request_stored === true,
  raw_response_stored: bundleReport?.raw_response_stored === true,
  secrets_logged: bundleReport?.secrets_logged === true,
  final_gate_preflight_executed: true,
  final_gate_executed: false,
  can_enter_local_model_verification_final_gate: false,
  owner_decision_required: true,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  preconditions_total: preconditions.length,
  preconditions_passed: preconditions.filter((item) => item.status === "pass").length,
  preconditions_blocking: blockingPreconditions.length,
  blocked_by: blockedBy,
  preconditions,
  claims_allowed: ALLOWED_CLAIMS,
  claims_blocked: BLOCKED_CLAIMS
};

const claimBoundary = {
  status,
  stage: STAGE,
  final_gate_preflight_executed: true,
  final_gate_executed: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: report.claims_allowed,
  blocked_claims: BLOCKED_CLAIMS,
  reason: "Final gate preflight records that owner final decision remains unresolved; final strong local wording remains unavailable."
};

const blockerUpdate = {
  status: "updated",
  stage: STAGE,
  previous_status: "local_model_verification_evidence_bundle_drafted_final_preflight_pending",
  new_status: status,
  unblocks: report.claims_allowed,
  still_blocks: BLOCKED_CLAIMS,
  blocked_by: blockedBy,
  next_required_actions: nonOwnerBlockingPreconditions.length === 0
    ? ["record owner final decision after reviewing the local verification evidence packet"]
    : [
        "execute local redteam coverage with bounded cases",
        "restore dependency-backed adapter conformance validation without installing during this run",
        "restore reference baseline dependency after owner-approved refresh",
        "record owner final decision after required evidence is present"
      ]
};

const unresolvedItems = blockingPreconditions.map((item, index) => ({
  id: `LMVFG-${String(index + 1).padStart(3, "0")}`,
  severity: item.id === "owner_final_decision" ? "low" : (item.id === "protected_paths_unmodified" || item.id === "raw_storage_absent" ? "high" : "medium"),
  description: `${item.id} is ${item.status}`,
  blocks_final_gate: true,
  recommended_next_action: item.id === "owner_final_decision"
    ? "Record owner final decision before enabling strong local verification wording."
    : "Resolve this blocker before running the final owner gate."
}));

const md = `# Local Model Verification Final Gate Preflight

Status: ${report.status}

- Stage: ${STAGE}
- Final gate executed: false
- Can enter final gate: ${report.can_enter_local_model_verification_final_gate}
- Preconditions passed: ${report.preconditions_passed}/${report.preconditions_total}
- Blocking preconditions: ${report.preconditions_blocking}
- Total autopilot local generation calls: ${report.total_autopilot_local_generation_calls}

## Blocking Preconditions

${blockedBy.map((item) => `- ${item}`).join("\n") || "- none"}
`;

writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_preflight_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_preflight_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_preconditions.json"), preconditions);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_claim_boundary.json"), claimBoundary);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_blocker_update.json"), blockerUpdate);
writeJson(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "local_model_verification_final_gate_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), unresolvedItems);

writeJson(p("evals", "reports", "local_model_verification_final_gate_preflight_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_final_gate_preflight_report.md"), md);
writeJson(p("evals", "reports", "local_model_verification_final_gate_preflight_gate_report.json"), report);
writeText(p("evals", "reports", "local_model_verification_final_gate_preflight_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit([EXPECTED_BLOCKED_STATUS, READY_FOR_OWNER_DECISION_STATUS].includes(status) ? 0 : 1);
