#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate";
const ALLOWED_CLAIM = "local-model-verified";
const STILL_BLOCKED = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const REQUIRED_FILES = [
  "local_model_verification_final_gate_report.json",
  "local_model_verification_final_evidence_summary.json",
  "local_model_verification_final_evidence_completeness.json",
  "local_model_verification_owner_final_decision.json",
  "local_model_verification_final_decision_record.json",
  "local_model_verified_claim_boundary.json",
  "local_model_verification_final_gate_gate_report.json",
  "local_model_verification_final_blocker_update.json",
  "local_model_verification_blocker_update.json",
  "unresolved_items.json"
];
const REQUIRED_REL_PATHS = [
  "release/post_stable_local_model_verification_final_gate_scope.yaml",
  "release/post_stable_local_model_verification_final_gate.yaml",
  "release/post_stable_local_model_verification_owner_final_decision.yaml",
  "release/post_stable_local_model_verification_final_decision_record.yaml",
  "release/post_stable_local_model_verified_claim_boundary.yaml",
  "release/post_stable_local_model_verification_final_blocker_update.yaml",
  "release/post_stable_local_model_verification_blocker_update.yaml",
  "evals/suites/post_stable_local_model_verification_final_gate.yaml",
  "evals/reports/local_model_verification_final_gate_report.json",
  "evals/reports/local_model_verification_final_gate_report.md",
  "evals/reports/local_model_verified_claim_boundary_report.json",
  "evals/reports/local_model_verified_claim_boundary_report.md",
  "evals/reports/local_model_verification_final_evidence_report.json",
  "evals/reports/local_model_verification_final_evidence_report.md",
  "docs/local_model_verification_final_gate.ko.md",
  "docs/local_model_verified_claim_boundary.ko.md",
  "docs/local_model_verification_final_decision_record.ko.md",
  "docs/next_provider_diverse_path_plan.ko.md",
  "docs/next_adapter_checked_path_plan.ko.md",
  "tools/run_local_model_verification_final_gate.mjs",
  "tools/check_local_model_verification_final_gate.mjs",
  "tools/audit_local_model_verified_claims.mjs",
  "tools/summarize_local_model_verification_final_evidence.mjs"
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

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function blockedFlagsFalse(record) {
  return record?.provider_diverse_allowed === false
    && record?.provider_verified_allowed === false
    && record?.adapter_checked_allowed === false
    && record?.production_ready_allowed === false
    && record?.stable_allowed === false
    && record?.release_gated_allowed === false
    && record?.bare_release_gated_allowed === false;
}

const report = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_gate_report.json`);
const summary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_evidence_summary.json`);
const completeness = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_evidence_completeness.json`);
const ownerDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_owner_final_decision.json`);
const finalDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_decision_record.json`);
const boundary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verified_claim_boundary.json`);
const gate = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_gate_gate_report.json`);
const blocker = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_blocker_update.json`);
const legacyBlocker = readJsonIfExists(`evidence/${EVIDENCE_DIR}/local_model_verification_final_blocker_update.json`);
const unresolved = readJsonIfExists(`evidence/${EVIDENCE_DIR}/unresolved_items.json`);
const preflight = readJsonIfExists("evidence/post-stable-local-model-verification-final-gate-preflight/local_model_verification_final_gate_preflight_report.json");
const ownerPacket = readJsonIfExists("evidence/post-stable-local-model-verification-owner-decision-packet/local_model_verification_owner_decision_packet.json");

const compare = runNode("check_reference_baseline_integrity.mjs");
const scanCli = runNode("scan_prohibited_claims.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verification_final_gate_check_report.json",
    "evals/reports/local_model_verification_final_gate_check_report.md"
  ]
});
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/node_modules"]);
const baselineStatus = gitStatus(["harness-core/evidence/reference-baseline"]);
const compareCurrentMismatchCount = compare.parsed?.alpha_snapshot?.current_snapshot_mismatch_count
  ?? compare.parsed?.current_snapshot_mismatch_count;
const compareDisallowedSnapshotPathCount = compare.parsed?.alpha_snapshot?.disallowed_snapshot_path_count
  ?? compare.parsed?.disallowed_snapshot_path_count;

const checks = [];
for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
for (const file of REQUIRED_REL_PATHS) {
  addCheck(checks, `${file} exists`, exists(file), {});
}
addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "final gate report passed", report?.status === "pass"
  && report?.local_model_verification_final_gate_passed === true
  && report?.final_gate_executed === true
  && report?.approval_phrase_verified === true
  && report?.can_claim_local_model_verified === true
  && report?.local_model_verified_allowed === true
  && blockedFlagsFalse(report)
  && report?.can_enter_stable_release === false, report || {});
addCheck(checks, "decision record approves only local-model-verified", finalDecision?.status === "recorded"
  && finalDecision?.decision === "approve_local_model_verified_claim"
  && finalDecision?.approved_claim === ALLOWED_CLAIM
  && finalDecision?.local_model_verified === true
  && finalDecision?.is_provider_diverse === false
  && finalDecision?.is_provider_verified === false
  && finalDecision?.is_adapter_checked === false
  && finalDecision?.is_production_ready === false
  && finalDecision?.is_stable === false
  && finalDecision?.is_release_gated === false
  && finalDecision?.bare_release_gated_allowed === false
  && finalDecision?.can_enter_stable_release === false, finalDecision || {});
addCheck(checks, "legacy owner decision remains compatible", ownerDecision?.status === "recorded"
  && ownerDecision?.decision === "approve_post_stable_ollama_qwen3_local_model_verified"
  && ownerDecision?.local_model_verified === true
  && ownerDecision?.is_provider_diverse === false
  && ownerDecision?.is_provider_verified === false
  && ownerDecision?.is_adapter_checked === false
  && ownerDecision?.is_production_ready === false
  && ownerDecision?.is_stable === false
  && ownerDecision?.is_release_gated === false, ownerDecision || {});
addCheck(checks, "claim boundary opens only local-model-verified", boundary?.status === "pass"
  && boundary?.local_model_verified_allowed === true
  && blockedFlagsFalse(boundary)
  && boundary?.can_enter_stable_release === false
  && Array.isArray(boundary?.allowed_claims)
  && boundary.allowed_claims.includes(ALLOWED_CLAIM)
  && Array.isArray(boundary?.blocked_claims)
  && STILL_BLOCKED.every((claim) => boundary.blocked_claims.includes(claim)), boundary || {});
addCheck(checks, "gate report matches allowed local claim", gate?.status === "pass"
  && gate?.can_claim_local_model_verified === true
  && gate?.can_claim_provider_diverse === false
  && gate?.can_claim_provider_verified === false
  && gate?.can_claim_adapter_checked === false
  && gate?.can_claim_production_ready === false
  && gate?.can_claim_stable === false
  && gate?.can_claim_release_gated === false
  && gate?.bare_release_gated_allowed === false
  && gate?.can_enter_stable_release === false, gate || {});
addCheck(checks, "evidence summary passed required surfaces", summary?.status === "pass"
  && summary?.qwen3_14b_no_tool_review_passed === true
  && summary?.qwen3_6_27b_no_tool_review_passed === true
  && summary?.multimodel_no_tool_comparison_passed === true
  && summary?.local_redteam_bounded_smoke_passed === true
  && summary?.adapter_conformance_dependency_backed_validation_passed === true
  && summary?.local_ollama_adapter_conformance_reviewed === true
  && summary?.storage_redaction_audit_passed === true
  && summary?.reference_baseline_compare_passed === true
  && summary?.ds_store_exclusion_policy_enforced === true
  && summary?.owner_final_decision_present === true
  && summary?.raw_request_stored === false
  && summary?.raw_response_stored === false
  && summary?.secrets_logged === false
  && summary?.new_local_model_execution === false
  && summary?.evidence_reference_baseline_refreshed_in_this_stage === false, summary || {});
addCheck(checks, "evidence completeness passed with no missing evidence", completeness?.status === "pass"
  && Array.isArray(completeness?.required_evidence)
  && completeness.required_evidence.length >= 10
  && Array.isArray(completeness?.missing_evidence)
  && completeness.missing_evidence.length === 0
  && completeness?.ds_store_exclusion_policy_enforced === true
  && completeness?.new_local_model_execution === false
  && completeness?.openai_model_api_call === false
  && completeness?.telemetry_sink_write === false, completeness || {});
addCheck(checks, "preflight and owner packet were ready before final decision", preflight?.status === "ready_for_owner_decision_to_claim_local_model_verified"
  && ownerPacket?.status === "ready_for_owner_decision_to_claim_local_model_verified"
  && Array.isArray(preflight?.blocked_by)
  && preflight.blocked_by.length === 1
  && preflight.blocked_by[0] === "owner_final_decision"
  && Array.isArray(ownerPacket?.remaining_blockers)
  && ownerPacket.remaining_blockers.length === 1
  && ownerPacket.remaining_blockers[0]?.id === "owner_final_decision", {
  preflight_status: preflight?.status,
  owner_packet_status: ownerPacket?.status
});
addCheck(checks, "no new execution in final gate", report?.openai_model_api_call === false
  && report?.openai_provider_call === false
  && report?.telemetry_sink_write === false
  && report?.local_endpoint_probe === false
  && report?.local_model_execution === false
  && report?.new_local_model_execution === false
  && report?.new_local_generation_calls === 0
  && report?.local_redteam_rerun === false
  && report?.adapter_conformance_rerun_with_generation === false
  && report?.production_deployment === false
  && report?.release_gate_rerun === false, report || {});
addCheck(checks, "no additional referenceBaseline refresh or .DS_Store deletion in final gate", report?.evidence_reference_baseline_refreshed_in_this_stage === false
  && report?.additional_reference_baseline_refresh === false
  && report?.ds_store_deletion_from_reference_baseline === false, report || {});
addCheck(checks, "referenceBaseline compare still passes", compare.exit_code === 0
  && compare.status === "pass"
  && compareCurrentMismatchCount === 0
  && compareDisallowedSnapshotPathCount === 0, {
  exit_code: compare.exit_code,
  status: compare.status,
  current_snapshot_mismatch_count: compareCurrentMismatchCount,
  disallowed_snapshot_path_count: compareDisallowedSnapshotPathCount
});
addCheck(checks, "protected referenceBaseline dist node_modules paths clean", protectedStatus.exit_code === 0
  && protectedStatus.stdout === "", protectedStatus);
addCheck(checks, "baseline modifications are prior owner-approved refresh only", baselineStatus.exit_code === 0
  && (
    baselineStatus.stdout === ""
    || report?.evidence_reference_baseline_modified_by_owner_approved_refresh === true
  ), baselineStatus);
addCheck(checks, "blocker update keeps non-local strong claims blocked", Array.isArray(blocker?.still_blocks)
  && STILL_BLOCKED.every((claim) => blocker.still_blocks.includes(claim))
  && Array.isArray(legacyBlocker?.still_blocks)
  && STILL_BLOCKED.every((claim) => legacyBlocker.still_blocks.includes(claim))
  && Array.isArray(blocker?.unblocks)
  && blocker.unblocks.length === 1
  && blocker.unblocks[0] === ALLOWED_CLAIM
  && blocker?.new_status === "local_model_verified_allowed_provider_diverse_still_blocked"
  && Array.isArray(blocker?.next_required_actions)
  && blocker.next_required_actions.includes("define provider-diverse path")
  && blocker.next_required_actions.includes("define provider-verified gate")
  && blocker.next_required_actions.includes("define adapter-checked gate")
  && blocker.next_required_actions.includes("keep production-ready/stable scoped claims separate"), blocker || {});
addCheck(checks, "no unresolved final gate items remain", Array.isArray(unresolved)
  && unresolved.length === 0, { unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null });
addCheck(checks, "prohibited claim scan pass", scanCli.exit_code === 0
  && scan.status === "pass", { cli_status: scanCli.status, direct_status: scan.status, matches: scan.matches.length });
addCheck(checks, "still-blocked claim positive matches absent", scan.matches.filter((match) => STILL_BLOCKED.includes(match.claim)).length === 0, {
  matches: scan.matches.filter((match) => STILL_BLOCKED.includes(match.claim))
});

const failures = checks.filter((check) => check.status !== "pass");
const result = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_claim_local_model_verified: failures.length === 0,
  local_model_verified_allowed: failures.length === 0,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  openai_model_api_call: false,
  telemetry_sink_write: false,
  local_model_execution: false,
  new_local_generation_calls: 0,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  claims_allowed_by_this_gate: failures.length === 0 ? [ALLOWED_CLAIM] : [],
  claims_still_blocked: STILL_BLOCKED,
  checks,
  failures
};
const md = `# Local Model Verification Final Gate Check

Status: ${result.status}

- Stage: ${STAGE}
- Can claim local-model-verified: ${result.can_claim_local_model_verified}
- Claims still blocked: ${STILL_BLOCKED.join(", ")}
- Additional reference baseline refresh in this stage: false

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_final_gate_check_report.json"), result);
writeText(p("evals", "reports", "local_model_verification_final_gate_check_report.md"), md);
writeJson(e("local_model_verification_final_gate_check_report.json"), result);

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);
