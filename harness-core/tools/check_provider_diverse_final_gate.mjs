#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-final-gate";
const EVIDENCE_DIR = "post-combined-provider-diverse-final-gate";
const ALLOWED_CLAIM = "provider-diverse";
const STILL_BLOCKED = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const REQUIRED_FILES = [
  "provider_diverse_final_gate_report.json",
  "provider_diverse_final_gate_report.md",
  "provider_diverse_final_evidence_summary.json",
  "provider_diverse_final_evidence_completeness.json",
  "provider_lane_independence_final_review.json",
  "provider_diverse_owner_final_decision.json",
  "provider_diverse_final_decision_record.json",
  "provider_diverse_claim_boundary.json",
  "provider_diverse_final_blocker_update.json",
  "provider_diverse_blocker_update.json",
  "provider_diverse_final_gate_check_report.json",
  "unresolved_items.json"
];
const REQUIRED_REL_PATHS = [
  "release/post_combined_provider_diverse_final_gate_scope.yaml",
  "release/post_combined_provider_diverse_final_gate.yaml",
  "release/post_combined_provider_diverse_claim_boundary.yaml",
  "release/post_combined_provider_diverse_blocker_update.yaml",
  "release/post_combined_provider_diverse_owner_final_decision.yaml",
  "release/post_combined_provider_diverse_final_decision_record.yaml",
  "release/post_combined_provider_diverse_final_claim_boundary.yaml",
  "release/post_combined_provider_diverse_final_blocker_update.yaml",
  "evals/suites/post_combined_provider_diverse_final_gate.yaml",
  "evals/reports/provider_diverse_final_gate_report.json",
  "evals/reports/provider_diverse_final_gate_report.md",
  "evals/reports/provider_diverse_claim_boundary_report.json",
  "evals/reports/provider_diverse_claim_boundary_report.md",
  "evals/reports/provider_diverse_final_evidence_report.json",
  "evals/reports/provider_diverse_final_evidence_report.md",
  "docs/provider_diverse_final_gate.ko.md",
  "docs/provider_diverse_final_claim_boundary.ko.md",
  "docs/provider_diverse_final_decision_record.ko.md",
  "docs/next_final_export_execution_plan.ko.md",
  "tools/run_provider_diverse_final_gate.mjs",
  "tools/check_provider_diverse_final_gate.mjs",
  "tools/audit_provider_diverse_final_claims.mjs",
  "tools/summarize_provider_diverse_final_evidence.mjs"
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
  return record?.provider_verified_allowed === false
    && record?.adapter_checked_allowed === false
    && record?.production_ready_allowed === false
    && record?.stable_allowed === false
    && record?.release_gated_allowed === false
    && record?.bare_release_gated_allowed === false;
}

const report = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_gate_report.json`);
const summary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_evidence_summary.json`);
const completeness = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_evidence_completeness.json`);
const independence = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_lane_independence_final_review.json`);
const ownerDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_owner_final_decision.json`);
const finalDecision = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_final_decision_record.json`);
const boundary = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_claim_boundary.json`);
const blocker = readJsonIfExists(`evidence/${EVIDENCE_DIR}/provider_diverse_blocker_update.json`);
const unresolved = readJsonIfExists(`evidence/${EVIDENCE_DIR}/unresolved_items.json`);
const inventoryGate = readJsonIfExists("evidence/post-combined-provider-diverse-evidence-inventory/provider_diverse_evidence_inventory_gate_report.json");
const compare = runNode("check_reference_baseline_integrity.mjs");
const scanCli = runNode("scan_prohibited_claims.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/provider_diverse_final_gate_check_report.json",
    "evals/reports/provider_diverse_final_gate_check_report.md"
  ]
});
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/node_modules"]);

const checks = [];
for (const file of REQUIRED_FILES) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
for (const file of REQUIRED_REL_PATHS) {
  addCheck(checks, `${file} exists`, exists(file), {});
}
addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "final gate report passed and opens only provider-diverse", report?.status === "pass"
  && report?.provider_diverse_final_gate_passed === true
  && report?.final_gate_executed === true
  && report?.approval_phrase_verified === true
  && report?.can_claim_provider_diverse === true
  && report?.provider_diverse_allowed === true
  && blockedFlagsFalse(report)
  && report?.openai_model_api_call === false
  && report?.openai_provider_rerun === false
  && report?.new_local_model_execution === false
  && report?.telemetry_sink_write === false, report || {});
addCheck(checks, "decision record approves only provider-diverse", finalDecision?.status === "recorded"
  && finalDecision?.decision === "approve_provider_diverse_claim"
  && finalDecision?.approved_claim === ALLOWED_CLAIM
  && finalDecision?.scope === "openai_api_lane_plus_ollama_qwen3_local_lane"
  && finalDecision?.provider_diverse === true
  && finalDecision?.provider_diverse_allowed === true
  && blockedFlagsFalse(finalDecision)
  && finalDecision?.is_provider_verified === false
  && finalDecision?.is_adapter_checked === false
  && finalDecision?.is_general_production_ready === false
  && finalDecision?.is_general_stable === false
  && finalDecision?.owner_approval_phrase_verified === true, finalDecision || {});
addCheck(checks, "owner decision recorded", ownerDecision?.status === "recorded"
  && ownerDecision?.decision === "approve_provider_diverse_claim"
  && ownerDecision?.approved_claim === ALLOWED_CLAIM
  && ownerDecision?.owner_approval_phrase_verified === true
  && ownerDecision?.is_provider_verified === false
  && ownerDecision?.is_adapter_checked === false
  && ownerDecision?.is_production_ready === false
  && ownerDecision?.is_stable === false
  && ownerDecision?.is_release_gated === false, ownerDecision || {});
addCheck(checks, "claim boundary opens only provider-diverse", boundary?.status === "pass"
  && boundary?.provider_diverse_allowed === true
  && blockedFlagsFalse(boundary)
  && Array.isArray(boundary?.allowed_claims)
  && boundary.allowed_claims.includes(ALLOWED_CLAIM)
  && Array.isArray(boundary?.blocked_claims)
  && STILL_BLOCKED.every((claim) => boundary.blocked_claims.includes(claim)), boundary || {});
addCheck(checks, "evidence summary passed required surfaces", summary?.status === "pass"
  && Array.isArray(summary?.provider_lanes)
  && summary.provider_lanes.includes("openai_api_lane")
  && summary.provider_lanes.includes("ollama_qwen3_local_lane")
  && summary?.openai_lane_evidence_complete === true
  && summary?.ollama_qwen3_lane_evidence_complete === true
  && summary?.openai_api_lane_passed === true
  && summary?.ollama_qwen3_local_lane_passed === true
  && summary?.distinct_provider_lanes === true
  && summary?.independent_execution_evidence_per_lane === true
  && summary?.capability_matrix_per_lane === true
  && summary?.redaction_storage_evidence_per_lane === true
  && summary?.claim_boundary_per_lane === true
  && summary?.local_model_verified === true
  && summary?.post_rc_openai_only_stable === true
  && summary?.provider_diverse_criteria_met === true
  && summary?.combined_archive_passed === true
  && summary?.inventory_preflight_passed === true
  && summary?.source_archives_passed === true
  && summary?.owner_final_decision_present === true
  && summary?.protected_paths_passed === true
  && summary?.no_new_execution === true
  && summary?.openai_model_api_call === false
  && summary?.openai_provider_rerun === false
  && summary?.telemetry_sink_write === false
  && summary?.evidence_reference_baseline_refreshed_in_this_stage === false, summary || {});
addCheck(checks, "evidence completeness passed with no missing evidence", completeness?.status === "pass"
  && completeness?.required_evidence?.combined_archive_export === true
  && completeness?.required_evidence?.provider_diverse_path_design === true
  && completeness?.required_evidence?.provider_diverse_evidence_inventory === true
  && completeness?.required_evidence?.openai_lane_evidence_summary === true
  && completeness?.required_evidence?.ollama_qwen3_lane_evidence_summary === true
  && completeness?.required_evidence?.local_model_verified_final_handoff === true
  && completeness?.required_evidence?.provider_lane_independence_review === true
  && completeness?.required_evidence?.owner_final_decision === true
  && Array.isArray(completeness?.missing_evidence)
  && completeness.missing_evidence.length === 0
  && completeness?.no_new_execution === true
  && completeness?.openai_model_api_call === false
  && completeness?.telemetry_sink_write === false
  && completeness?.reference_baseline_source_modified === false
  && completeness?.dist_modified === false, completeness || {});
addCheck(checks, "provider lane independence final review passed", independence?.status === "pass"
  && independence?.lanes?.openai_api_lane?.type === "remote_provider_api"
  && independence?.lanes?.openai_api_lane?.execution_evidence_exists === true
  && independence?.lanes?.openai_api_lane?.scoped_stable_evidence_exists === true
  && independence?.lanes?.openai_api_lane?.redaction_storage_evidence_exists === true
  && independence?.lanes?.ollama_qwen3_local_lane?.type === "local_provider_runtime"
  && independence?.lanes?.ollama_qwen3_local_lane?.execution_evidence_exists === true
  && independence?.lanes?.ollama_qwen3_local_lane?.local_model_verified === true
  && independence?.lanes?.ollama_qwen3_local_lane?.redaction_storage_evidence_exists === true
  && Array.isArray(independence?.independence_basis)
  && independence.independence_basis.length >= 4
  && independence?.does_not_establish_provider_verified === true
  && independence?.does_not_establish_adapter_checked === true, independence || {});
addCheck(checks, "inventory gate was ready before final decision", inventoryGate?.status === "pass"
  && inventoryGate?.ready_for_owner_decision_to_claim_provider_diverse === true, inventoryGate || {});
addCheck(checks, "blocker update resolves provider diversity blockers only", blocker?.status === "updated"
  && blocker?.previous_status === "ready_for_owner_decision_to_claim_provider_diverse"
  && blocker?.new_status === "provider_diverse_allowed_provider_verified_and_adapter_checked_still_blocked"
  && blocker?.provider_diverse_allowed === true
  && Array.isArray(blocker?.unblocks)
  && blocker.unblocks.includes(ALLOWED_CLAIM)
  && Array.isArray(blocker?.still_blocks)
  && STILL_BLOCKED.every((claim) => blocker.still_blocks.includes(claim))
  && Array.isArray(blocker?.resolved_blockers)
  && blocker.resolved_blockers.includes("owner_final_decision_required")
  && blocker.resolved_blockers.includes("final_gate_not_executed")
  && Array.isArray(blocker?.still_blocked_claims)
  && STILL_BLOCKED.every((claim) => blocker.still_blocked_claims.includes(claim)), blocker || {});
addCheck(checks, "unresolved items empty", unresolved?.status === "pass"
  && unresolved?.unresolved_items_count === 0
  && Array.isArray(unresolved?.unresolved_items)
  && unresolved.unresolved_items.length === 0, unresolved || {});
addCheck(checks, "claim scan passes with conditional provider-diverse allowance", scan.status === "pass"
  && scanCli.exit_code === 0
  && scanCli.status === "pass"
  && scan.allowed_mentions.some((mention) => mention.claim === ALLOWED_CLAIM
    && mention.reason === "conditionally_allowed_after_post_combined_provider_diverse_final_gate"), {
  scan_status: scan.status,
  scan_cli_status: scanCli.status,
  conditional_mentions: scan.allowed_mentions.filter((mention) => mention.claim === ALLOWED_CLAIM
    && mention.reason === "conditionally_allowed_after_post_combined_provider_diverse_final_gate").length
});
addCheck(checks, "protected paths remain clean", protectedStatus.exit_code === 0
  && protectedStatus.stdout.split(/\r?\n/).filter(Boolean).length === 0, protectedStatus);
addCheck(checks, "reference baseline compare passes", compare.exit_code === 0 && compare.status === "pass", {
  exit_code: compare.exit_code,
  status: compare.status,
  stderr_excerpt: compare.stderr_excerpt
});

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  can_claim_provider_diverse: failures.length === 0,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_production_ready: false,
  can_claim_stable: false,
  can_claim_release_gated: false,
  can_enter_stable_release: false,
  provider_diverse_allowed: failures.length === 0,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  openai_model_api_call: false,
  local_model_execution: false,
  new_local_model_execution: false,
  telemetry_sink_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  unresolved_items_count: failures.length,
  reason: failures.length === 0
    ? "Provider-diverse final gate passed for OpenAI API lane plus Ollama qwen3 local lane. Provider verification and adapter-checked remain separate gates."
    : "Provider-diverse final gate check failed.",
  checks,
  failures
};

writeJson(e("provider_diverse_final_gate_gate_report.json"), gate);
writeJson(e("provider_diverse_final_gate_check_report.json"), gate);
writeJson(p("evals", "reports", "provider_diverse_final_gate_check_report.json"), gate);
writeText(p("evals", "reports", "provider_diverse_final_gate_check_report.md"), `# Provider Diverse Final Gate Check\n\nStatus: ${gate.status}\n\n- Can claim provider-diverse: ${gate.can_claim_provider_diverse}\n- Can claim provider-verified: ${gate.can_claim_provider_verified}\n- Can claim adapter-checked: ${gate.can_claim_adapter_checked}\n- Unresolved items: ${gate.unresolved_items_count}\n`);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
