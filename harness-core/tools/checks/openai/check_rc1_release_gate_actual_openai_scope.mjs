#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import {
  STAGE,
  actualClaimsAllowed,
  buildRc1ActualGateArtifacts,
  claimsBlocked,
  evidenceRelDir,
  resolveRoot
} from "../../runners/openai/run_rc1_release_gate_actual_openai_scope.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, ...evidenceRelDir.split("/"));
const checks = [];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function addCheck(name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runJsonTool(script, args = []) {
  const result = spawnSync(process.execPath, [p("tools", script), root, ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80
  });
  let detail = {
    exit_code: result.status,
    stderr: result.stderr?.trim() || ""
  };
  try {
    detail = { ...detail, ...JSON.parse(result.stdout) };
  } catch {
    detail.stdout_preview = (result.stdout || "").slice(0, 1600);
  }
  return {
    ok: result.status === 0 && (detail.status === undefined || detail.status === "pass"),
    detail
  };
}

const artifacts = buildRc1ActualGateArtifacts(root);
addCheck("actual gate artifacts generated", artifacts.report.status === "pass_openai_scope_release_gated_not_stable", {
  status: artifacts.report.status,
  stage: artifacts.report.stage
});

const validate = runJsonTool("validate_alpha.mjs");
addCheck("validate_alpha.mjs pass", validate.ok, {
  status: validate.detail.status,
  errors: validate.detail.errors,
  warnings: validate.detail.warnings
});

const claimScanTool = runJsonTool("scan_prohibited_claims.mjs");
addCheck("scan_prohibited_claims.mjs pass", claimScanTool.ok, {
  status: claimScanTool.detail.status,
  matches: Array.isArray(claimScanTool.detail.matches) ? claimScanTool.detail.matches.length : null
});

const baseline = runJsonTool("check_reference_baseline_integrity.mjs");
addCheck("check_reference_baseline_integrity.mjs pass", baseline.ok, {
  status: baseline.detail.status,
  unresolved_items_count: baseline.detail.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.detail.current_snapshot_mismatch_count
});

for (const relPath of [
  "release/gates/rc1/rc1_release_gate_actual_openai_scope_scope.yaml",
  "release/approvals/rc1/rc1_release_gate_actual_approval_record.json",
  "release/gates/rc1/rc1_release_gate_actual_openai_scope.yaml",
  "release/blockers/rc1/rc1_release_gate_actual_blocker_update.yaml",
  "release/claims/rc1/rc1_release_gate_actual_claim_boundary.yaml",
  "release/records/rc1/rc1_local_endpoint_deferred_final.yaml",
  "release/records/rc1/rc1_provider_diversity_deferred_final.yaml",
  "release/decisions/rc1/rc1_release_decision_record.yaml",
  "release/decisions/rc1/rc1_release_decision_record.json",
  "tools/runners/openai/run_rc1_release_gate_actual_openai_scope.mjs",
  "tools/checks/openai/check_rc1_release_gate_actual_openai_scope.mjs",
  "tools/audits/release/audit_rc1_release_gate_actual_claims.mjs",
  "tools/summaries/release/summarize_rc1_release_gate_actual_result.mjs",
  "evals/suites/rc1_release_gate_actual_openai_scope.yaml",
  "evals/reports/rc1_release_gate_actual_report.json",
  "evals/reports/rc1_release_gate_actual_report.md",
  "evals/reports/rc1_release_gate_actual_claim_boundary_report.json",
  "evals/reports/rc1_release_gate_actual_claim_boundary_report.md",
  "evals/reports/rc1_release_decision_record.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.md",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_criteria_results.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.md",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_decision_record.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_local_endpoint_deferred_final.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_provider_diversity_deferred_final.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_not_stable_final_notice.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_blocker_update.json",
  "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_approval_record.json",
  "evidence/rc1-release-gate-actual-openai-scope/unresolved_items.json",
  "docs/local/rc1_release_gate_actual_openai_scope.md",
  "docs/claims/rc1_release_gate_actual_claim_boundary.md",
  "docs/release/rc1_release_decision_record.md",
  "docs/release/rc1_not_stable_final_notice.md",
  "docs/plans/next_rc1_post_release_gate_review.md",
  "docs/plans/next_local_canary_after_endpoint_ready.md",
  "docs/plans/next_telemetry_connection_plan.md"
]) {
  addCheck(`${relPath} exists`, exists(relPath), {});
}

const report = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json");
const criteria = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_criteria_results.json");
const boundary = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.json");
const decision = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_decision_record.json");
const approval = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_approval_record.json");
const localFinal = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_local_endpoint_deferred_final.json");
const providerFinal = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_provider_diversity_deferred_final.json");
const finalNotice = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_not_stable_final_notice.json");
const blocker = readIfExists("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_blocker_update.json");
const unresolved = readIfExists("evidence/rc1-release-gate-actual-openai-scope/unresolved_items.json");
const preflightGate = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_gate_report.json");
const preflightReport = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json");
const claimScan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

addCheck("preflight was ready before approval", preflightGate?.status === "blocked"
  && preflightReport?.status === "ready_but_blocked_by_missing_explicit_approval", {
  preflight_gate_status: preflightGate?.status,
  preflight_status: preflightReport?.status
});
addCheck("exact approval phrase present", approval?.explicit_user_approval_present === true
  && approval?.approval_phrase_matched === true
  && approval?.openai_provider_call_allowed === false
  && approval?.local_endpoint_probe_allowed === false, {
  explicit_user_approval_present: approval?.explicit_user_approval_present,
  approval_phrase_matched: approval?.approval_phrase_matched
});
addCheck("actual gate report passed scoped OpenAI-only evaluation", report?.status === "pass_openai_scope_release_gated_not_stable"
  && report?.scope === "openai_only_rc1"
  && report?.approval_phrase_verified === true
  && report?.release_gate_actual_execution === true
  && report?.openai_scope_release_gate_passed === true
  && report?.rc1_openai_scope_release_gated_allowed === true, {
  status: report?.status,
  scope: report?.scope,
  approval_phrase_verified: report?.approval_phrase_verified,
  release_gate_actual_execution: report?.release_gate_actual_execution,
  openai_scope_release_gate_passed: report?.openai_scope_release_gate_passed,
  rc1_openai_scope_release_gated_allowed: report?.rc1_openai_scope_release_gated_allowed
});
addCheck("criteria results pass", criteria?.status === "pass"
  && criteria?.criteria?.approval === "pass"
  && criteria?.criteria?.rc1_openai_scope_bundle === "pass"
  && criteria?.criteria?.rc1_release_gate_dry_run === "pass"
  && criteria?.criteria?.rollback_readiness === "pass"
  && criteria?.criteria?.owner_action_readiness === "pass", criteria || {});
addCheck("no provider/local/telemetry/production execution occurred", report?.new_provider_execution === false
  && report?.openai_provider_call === false
  && report?.local_model_execution === false
  && report?.local_endpoint_probe === false
  && report?.telemetry_connection === false
  && report?.production_deployment === false
  && report?.dist_modified === false
  && report?.reference_baseline_source_modified === false, {
  new_provider_execution: report?.new_provider_execution,
  openai_provider_call: report?.openai_provider_call,
  local_model_execution: report?.local_model_execution,
  local_endpoint_probe: report?.local_endpoint_probe,
  telemetry_connection: report?.telemetry_connection,
  production_deployment: report?.production_deployment,
  dist_modified: report?.dist_modified,
  reference_baseline_source_modified: report?.reference_baseline_source_modified
});
addCheck("required prerequisite evidence passed", report?.rc1_openai_scope_bundle_pass === true
  && report?.rc1_release_gate_dry_run_openai_scope_pass === true
  && report?.rc1_release_gate_actual_preflight_ready === true
  && report?.evidence_readiness_pass === true
  && report?.rollback_readiness === "pass"
  && report?.owner_action_readiness === "pass", {
  rc1_openai_scope_bundle_pass: report?.rc1_openai_scope_bundle_pass,
  rc1_release_gate_dry_run_openai_scope_pass: report?.rc1_release_gate_dry_run_openai_scope_pass,
  rc1_release_gate_actual_preflight_ready: report?.rc1_release_gate_actual_preflight_ready,
  rollback_readiness: report?.rollback_readiness,
  owner_action_readiness: report?.owner_action_readiness
});
addCheck("claim boundary records scoped release gate and blocks stronger claims", boundary?.status === "pass"
  && boundary?.scope === "openai_only_rc1"
  && boundary?.rc1_openai_scope_release_gated_allowed === true
  && boundary?.stable_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.production_monitored_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.local_model_verified_allowed === false, {
  rc1_openai_scope_release_gated_allowed: boundary?.rc1_openai_scope_release_gated_allowed,
  stable_allowed: boundary?.stable_allowed,
  production_ready_allowed: boundary?.production_ready_allowed,
  provider_diverse_allowed: boundary?.provider_diverse_allowed,
  release_gated_allowed: boundary?.release_gated_allowed
});
addCheck("release decision record matches actual gate report", decision?.status === "recorded"
  && decision?.decision === "approve_openai_only_rc1_release_gate"
  && decision?.scope === "openai_only_rc1"
  && decision?.release_gate_actual_execution === true
  && decision?.rc1_openai_scope_release_gated === true
  && decision?.is_stable === false
  && decision?.is_provider_diverse === false, {
  decision: decision?.decision,
  status: decision?.status
});
addCheck("local and provider deferral final records pass", localFinal?.status === "confirmed_deferred_by_operator"
  && localFinal?.local_endpoint_probe_performed === false
  && localFinal?.local_model_execution === false
  && providerFinal?.status === "confirmed_deferred_not_established"
  && providerFinal?.provider_diversity_established === false, {
  local_endpoint_status: localFinal?.status,
  provider_diversity_status: providerFinal?.status
});
addCheck("not-stable final notice and blocker update pass", finalNotice?.status === "not_stable"
  && finalNotice?.rc1_openai_scope_release_gated === true
  && finalNotice?.stable === false
  && blocker?.new_status === "openai_only_rc1_release_gate_passed_strict_paths_deferred"
  && Array.isArray(blocker?.unblocks)
  && blocker.unblocks.includes("rc1-openai-scope-release-gated"), {
  not_stable_status: finalNotice?.status,
  blocker_status: blocker?.new_status
});
addCheck("unresolved items empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck("forbidden positive claims absent", claimScan.matches.length === 0, {
  matches: claimScan.matches.length
});
addCheck("reference baseline source modified false", baseline.ok, {
  status: baseline.detail.status,
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_rc1_openai_scope_release_gated_claim: status === "pass",
  can_enter_stable_release: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diverse_claim: false,
  local_endpoint_deferred: true,
  reason: status === "pass"
    ? "OpenAI-only RC1 release gate passed; stable, production, provider-diverse, and local-model claims remain blocked."
    : "One or more OpenAI-only actual release gate checks failed.",
  checks,
  claims_allowed: status === "pass" ? [
    "rc1-openai-scope-release-gated"
  ] : [],
  claims_blocked: [
    "stable",
    "production-ready",
    "production-monitored",
    "provider-diverse",
    "local-model-verified"
  ]
};

const md = `# RC1 Release Gate Actual Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter RC1 OpenAI-scope release-gated claim: ${gateReport.can_enter_rc1_openai_scope_release_gated_claim}
- Can enter stable release: ${gateReport.can_enter_stable_release}
- Can enter production-ready claim: ${gateReport.can_enter_production_ready_claim}
- Can enter provider-diverse claim: ${gateReport.can_enter_provider_diverse_claim}
- Local endpoint deferred: ${gateReport.local_endpoint_deferred}
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "rc1_release_gate_actual_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "rc1_release_gate_actual_gate_report.md"), md);
writeJson(p("evals", "reports", "rc1_release_gate_actual_gate_report.json"), gateReport);
writeText(p("evals", "reports", "rc1_release_gate_actual_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "pass" ? 0 : 1);
