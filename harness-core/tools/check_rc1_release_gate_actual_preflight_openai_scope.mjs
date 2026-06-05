#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import {
  STAGE,
  buildRc1ActualGatePreflightArtifacts,
  claimsBlocked,
  evidenceRelDir,
  preflightClaimsAllowed,
  resolveRoot
} from "./run_rc1_release_gate_actual_preflight_openai_scope.mjs";

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

const dryRunGate = runJsonTool("check_rc1_release_gate_dry_run_openai_scope.mjs");
addCheck("check_rc1_release_gate_dry_run_openai_scope.mjs pass", dryRunGate.ok, {
  status: dryRunGate.detail.status,
  can_enter_release_gate_actual_preflight_openai_scope: dryRunGate.detail.can_enter_release_gate_actual_preflight_openai_scope
});

const artifacts = buildRc1ActualGatePreflightArtifacts(root);
addCheck("actual preflight artifacts generated", Boolean(artifacts.report), {
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
  "release/rc1_release_gate_actual_openai_scope_preflight_scope.yaml",
  "release/rc1_release_gate_actual_approval_gate.yaml",
  "release/rc1_release_gate_actual_approval_request.md",
  "release/rc1_release_gate_actual_command_plan.yaml",
  "release/rc1_release_gate_actual_preflight_policy.yaml",
  "release/rc1_release_decision_record_preflight.yaml",
  "release/rc1_rollback_readiness.yaml",
  "release/rc1_owner_action_readiness.yaml",
  "release/rc1_local_endpoint_deferred_confirmation.yaml",
  "release/rc1_provider_diversity_deferred_confirmation.yaml",
  "tools/run_rc1_release_gate_actual_preflight_openai_scope.mjs",
  "tools/audit_rc1_actual_gate_readiness.mjs",
  "tools/audit_rc1_rollback_owner_readiness.mjs",
  "tools/check_rc1_release_gate_actual_preflight_openai_scope.mjs",
  "evals/suites/rc1_release_gate_actual_openai_scope_preflight.yaml",
  "evals/reports/rc1_release_gate_actual_preflight_report.json",
  "evals/reports/rc1_release_gate_actual_preflight_report.md",
  "evals/reports/rc1_actual_gate_readiness_report.json",
  "evals/reports/rc1_actual_gate_readiness_report.md",
  "evals/reports/rc1_rollback_owner_readiness_report.json",
  "evals/reports/rc1_rollback_owner_readiness_report.md",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.md",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_readiness.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_claim_boundary.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_evidence_readiness.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_rollback_readiness.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_owner_action_readiness.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_local_endpoint_deferred_confirmation.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_provider_diversity_deferred_confirmation.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_decision_record_preflight.json",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_command_plan_snapshot.yaml",
  "evidence/rc1-release-gate-actual-openai-scope-preflight/unresolved_items.json",
  "docs/rc1_release_gate_actual_openai_scope_preflight.md",
  "docs/rc1_release_gate_actual_approval_request.md",
  "docs/rc1_release_gate_actual_command_plan.md",
  "docs/rc1_rollback_readiness.md",
  "docs/rc1_owner_action_readiness.md",
  "docs/next_rc1_release_gate_actual_execution.md",
  "docs/next_local_canary_after_endpoint_ready.md"
]) {
  addCheck(`${relPath} exists`, exists(relPath), {});
}

const report = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json");
const readiness = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_readiness.json");
const boundary = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_claim_boundary.json");
const evidence = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_evidence_readiness.json");
const rollback = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_rollback_readiness.json");
const owner = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_owner_action_readiness.json");
const local = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_local_endpoint_deferred_confirmation.json");
const provider = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_provider_diversity_deferred_confirmation.json");
const decision = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_decision_record_preflight.json");
const unresolved = readIfExists("evidence/rc1-release-gate-actual-openai-scope-preflight/unresolved_items.json");
const claimScan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

addCheck("preflight report status is ready but approval-blocked", report?.status === "ready_but_blocked_by_missing_explicit_approval", {
  status: report?.status
});
addCheck("new execution flags remain false", report?.new_execution === false
  && report?.openai_provider_call === false
  && report?.local_model_execution === false
  && report?.local_endpoint_probe === false
  && report?.telemetry_connection === false
  && report?.release_gate_actual_execution === false
  && report?.dist_modified === false
  && report?.reference_baseline_source_modified === false, {
  new_execution: report?.new_execution,
  openai_provider_call: report?.openai_provider_call,
  local_model_execution: report?.local_model_execution,
  local_endpoint_probe: report?.local_endpoint_probe,
  telemetry_connection: report?.telemetry_connection,
  release_gate_actual_execution: report?.release_gate_actual_execution,
  dist_modified: report?.dist_modified,
  reference_baseline_source_modified: report?.reference_baseline_source_modified
});
addCheck("evidence readiness pass", evidence?.status === "pass"
  && evidence?.rc1_openai_scope_bundle_pass === true
  && evidence?.rc1_release_gate_dry_run_openai_scope_pass === true
  && evidence?.system_of_record_alignment_pass === true
  && evidence?.containment_verified === true
  && evidence?.storage_redaction_audit_pass === true
  && evidence?.local_endpoint_deferred_record_exists === true
  && evidence?.provider_diversity_deferred_record_exists === true
  && evidence?.not_stable_notice_exists === true
  && Array.isArray(evidence?.missing_required_artifacts)
  && evidence.missing_required_artifacts.length === 0, evidence || {});
addCheck("rollback and owner readiness pass", rollback?.status === "pass"
  && rollback?.blocks_actual_release_gate === false
  && owner?.status === "pass"
  && owner?.blocks_actual_release_gate === false, {
  rollback_readiness: rollback?.status,
  owner_action_readiness: owner?.status
});
addCheck("explicit approval remains absent and actual gate cannot execute", report?.explicit_user_approval_present === false
  && report?.can_execute_release_gate_actual === false
  && readiness?.explicit_user_approval_present === false
  && readiness?.can_execute_release_gate_actual === false
  && decision?.can_execute_release_gate_actual === false, {
  explicit_user_approval_present: report?.explicit_user_approval_present,
  can_execute_release_gate_actual: report?.can_execute_release_gate_actual
});
addCheck("claim boundary remains closed", report?.release_gated_allowed === false
  && report?.stable_allowed === false
  && report?.production_ready_allowed === false
  && report?.production_monitored_allowed === false
  && report?.provider_diverse_allowed === false
  && report?.local_model_verified_allowed === false
  && boundary?.release_gated_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.production_monitored_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.local_model_verified_allowed === false, {
  release_gated_allowed: report?.release_gated_allowed,
  stable_allowed: report?.stable_allowed,
  production_ready_allowed: report?.production_ready_allowed,
  provider_diverse_allowed: report?.provider_diverse_allowed
});
addCheck("local endpoint and provider diversity remain deferred", local?.local_endpoint_deferred === true
  && local?.local_endpoint_probe_performed === false
  && local?.local_model_execution === false
  && provider?.provider_diversity_established === false
  && provider?.provider_diverse_allowed === false, {
  local_endpoint_deferred: local?.local_endpoint_deferred,
  provider_diversity_established: provider?.provider_diversity_established
});
addCheck("actual execution stage scripts were not created", !exists("tools/run_rc1_release_gate_actual_openai_scope.mjs")
  && !exists("tools/check_rc1_release_gate_actual_openai_scope.mjs"), {
  run_actual_exists: exists("tools/run_rc1_release_gate_actual_openai_scope.mjs"),
  check_actual_exists: exists("tools/check_rc1_release_gate_actual_openai_scope.mjs")
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
const readinessGap = report?.status !== "ready_but_blocked_by_missing_explicit_approval" || failed.length > 0;
const gateReport = {
  status: readinessGap ? "fail" : "blocked",
  stage: STAGE,
  preflight_status: report?.status || "missing",
  can_enter_release_gate_actual_execution: false,
  can_enter_release_gated_claim: false,
  can_enter_stable_release: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diverse_claim: false,
  local_endpoint_deferred: true,
  reason: readinessGap
    ? "Actual release gate preflight has a readiness gap."
    : "Actual release gate preflight is ready, but explicit user approval is required before release gate execution.",
  checks,
  claims_allowed: readinessGap ? [] : preflightClaimsAllowed,
  claims_blocked: claimsBlocked
};

const md = `# RC1 Release Gate Actual Preflight Gate Report

Status: ${gateReport.status}

Stage: ${STAGE}

- Preflight status: ${gateReport.preflight_status}
- Can enter actual release gate execution: ${gateReport.can_enter_release_gate_actual_execution}
- Can enter release-gated claim: ${gateReport.can_enter_release_gated_claim}
- Can enter stable release: ${gateReport.can_enter_stable_release}
- Can enter production-ready claim: ${gateReport.can_enter_production_ready_claim}
- Can enter provider-diverse claim: ${gateReport.can_enter_provider_diverse_claim}
- Local endpoint deferred: ${gateReport.local_endpoint_deferred}
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "rc1_release_gate_actual_preflight_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "rc1_release_gate_actual_preflight_gate_report.md"), md);
writeJson(p("evals", "reports", "rc1_release_gate_actual_preflight_gate_report.json"), gateReport);
writeText(p("evals", "reports", "rc1_release_gate_actual_preflight_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(gateReport.status === "fail" ? 1 : 0);

