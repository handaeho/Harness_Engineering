#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import {
  STAGE,
  buildRc1ReleaseGateDryRunArtifacts,
  checkRc1BundlePrerequisite,
  claimsBlocked,
  dryRunClaimsAllowed,
  evidenceRelDir,
  requiredRc1BundleFiles,
  resolveRoot
} from "../../runners/openai/run_rc1_release_gate_dry_run_openai_scope.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, ...evidenceRelDir.split("/"));

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(...relPath.split("/"))) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function runJsonTool(script, args = []) {
  const result = spawnSync(process.execPath, [p("tools", script), ...args], {
    cwd: path.dirname(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50
  });
  let detail = {
    exit_code: result.status,
    stderr: result.stderr?.trim() || ""
  };
  try {
    detail = { ...detail, ...JSON.parse(result.stdout) };
  } catch {
    detail.stdout_preview = (result.stdout || "").slice(0, 1200);
  }
  return {
    ok: result.status === 0 && (detail.status === undefined || detail.status === "pass"),
    detail
  };
}

const checks = [];

const prerequisiteBeforeCheck = checkRc1BundlePrerequisite(root);
addCheck(checks, "rc1 OpenAI bundle prerequisite files exist before checker", prerequisiteBeforeCheck.status === "pass", {
  status: prerequisiteBeforeCheck.status,
  gate_status: prerequisiteBeforeCheck.gate_status,
  missing: prerequisiteBeforeCheck.missing
});

if (prerequisiteBeforeCheck.status !== "pass") {
  const blocked = {
    status: "blocked_by_missing_rc1_openai_scope_bundle",
    stage: STAGE,
    can_enter_release_gate_actual_preflight_openai_scope: false,
    can_enter_stable_release: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    can_enter_provider_diverse_claim: false,
    local_endpoint_deferred: true,
    recommended_next_action: "rerun or repair v2.0.0-rc.1-evidence-bundle-openai-scope",
    checks,
    claims_allowed: [],
    claims_blocked: claimsBlocked
  };
  writeJson(path.join(evidenceDir, "rc1_release_gate_dry_run_gate_report.json"), blocked);
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const rc1Bundle = runJsonTool("check_rc1_openai_scope_bundle.mjs");
addCheck(checks, "check_rc1_openai_scope_bundle.mjs pass", rc1Bundle.ok, {
  status: rc1Bundle.detail.status,
  can_enter_openai_scope_release_gate_dry_run: rc1Bundle.detail.can_enter_openai_scope_release_gate_dry_run
});

const artifacts = buildRc1ReleaseGateDryRunArtifacts(root);
addCheck(checks, "dry-run artifacts generated", !artifacts.blocked, artifacts.blocked || {
  stage: artifacts.report?.stage,
  status: artifacts.report?.status
});

const validate = runJsonTool("validate_alpha.mjs");
addCheck(checks, "validate_alpha.mjs pass", validate.ok, validate.detail);
const claimScanTool = runJsonTool("scan_prohibited_claims.mjs");
addCheck(checks, "scan_prohibited_claims.mjs pass", claimScanTool.ok, {
  status: claimScanTool.detail.status,
  matches: Array.isArray(claimScanTool.detail.matches) ? claimScanTool.detail.matches.length : null
});
const baseline = runJsonTool("check_reference_baseline_integrity.mjs");
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.ok, {
  status: baseline.detail.status,
  unresolved_items_count: baseline.detail.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.detail.current_snapshot_mismatch_count
});

for (const relPath of [
  ...requiredRc1BundleFiles,
  "release/gates/rc1/rc1_release_gate_dry_run_openai_scope_scope.yaml",
  "release/gates/rc1/rc1_release_gate_dry_run_openai_scope.yaml",
  "release/scopes/rc1/rc1_openai_scope_release_decision_draft.yaml",
  "release/policies/rc1/rc1_local_endpoint_deferred_policy.yaml",
  "release/policies/rc1/rc1_strict_provider_diverse_deferred_policy.yaml",
  "release/gates/rc1/rc1_release_gate_actual_preconditions.yaml",
  "tools/runners/openai/run_rc1_release_gate_dry_run_openai_scope.mjs",
  "tools/audits/release/audit_rc1_release_gate_claim_boundaries.mjs",
  "tools/summaries/release/summarize_rc1_release_gate_readiness.mjs",
  "tools/checks/openai/check_rc1_release_gate_dry_run_openai_scope.mjs",
  "evals/suites/rc1_release_gate_dry_run_openai_scope.yaml",
  "evals/reports/rc1_release_gate_dry_run_report.json",
  "evals/reports/rc1_release_gate_dry_run_report.md",
  "evals/reports/rc1_release_gate_claim_boundary_report.json",
  "evals/reports/rc1_release_gate_claim_boundary_report.md",
  "evals/reports/rc1_release_gate_readiness_report.json",
  "evals/reports/rc1_release_gate_readiness_report.md",
  "evals/reports/rc1_release_gate_dry_run_gate_report.json",
  "evals/reports/rc1_release_gate_dry_run_gate_report.md",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.md",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_criteria_matrix.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_claim_boundary.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_readiness_assessment.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_local_endpoint_deferred_record.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_provider_diversity_deferred_record.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_decision_draft.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_actual_preconditions.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_gate_report.json",
  "evidence/rc1-release-gate-dry-run-openai-scope/unresolved_items.json",
  "docs/local/rc1_release_gate_dry_run_openai_scope.md",
  "docs/claims/rc1_release_gate_claim_boundary.md",
  "docs/local/rc1_local_endpoint_deferred.md",
  "docs/providers/rc1_provider_diversity_deferred.md",
  "docs/release/rc1_release_gate_actual_preconditions.md",
  "docs/plans/next_rc1_release_gate_actual_plan.md",
  "docs/plans/next_local_canary_after_endpoint_ready.md"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

const report = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.json");
const criteria = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_criteria_matrix.json");
const boundary = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_claim_boundary.json");
const local = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_local_endpoint_deferred_record.json");
const provider = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_provider_diversity_deferred_record.json");
const decision = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_decision_draft.json");
const preconditions = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_actual_preconditions.json");
const readiness = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_readiness_assessment.json");
const unresolved = readIfExists("evidence/rc1-release-gate-dry-run-openai-scope/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const claimScan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

addCheck(checks, "dry-run report flags are non-execution", report?.new_execution === false
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
addCheck(checks, "OpenAI scope gate passed and local endpoint deferred", report?.prerequisite_rc1_openai_scope_bundle_passed === true
  && report?.openai_scope_gate_passed === true
  && report?.local_endpoint_status === "deferred_until_operator_provides_endpoint"
  && local?.local_endpoint_deferred === true
  && local?.local_no_tool_canary === "not_executed_deferred"
  && local?.local_model_execution === false
  && local?.local_endpoint_probe === false, {
  prerequisite_rc1_openai_scope_bundle_passed: report?.prerequisite_rc1_openai_scope_bundle_passed,
  openai_scope_gate_passed: report?.openai_scope_gate_passed,
  local_endpoint_status: report?.local_endpoint_status
});
addCheck(checks, "provider diversity and strict path deferred", provider?.provider_diversity_established === false
  && provider?.provider_diverse_allowed === false
  && provider?.strict_provider_diverse_path === "deferred"
  && criteria?.criteria?.provider_diversity?.status === "deferred_not_in_openai_only_scope", {
  provider_diversity_established: provider?.provider_diversity_established,
  provider_status: criteria?.criteria?.provider_diversity?.status
});
addCheck(checks, "release and production claims remain blocked", report?.release_gated_allowed === false
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
addCheck(checks, "release decision draft and actual preconditions are ready", decision?.decision === "do_not_claim_release_gated_yet"
  && decision?.release_gate_actual_execution_pending === true
  && preconditions?.can_enter_preflight === true
  && readiness?.can_enter_release_gate_actual_preflight_openai_scope === true, {
  decision: decision?.decision,
  can_enter_preflight: preconditions?.can_enter_preflight
});
addCheck(checks, "unresolved items empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", claimScan.matches.length === 0, {
  matches: claimScan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "reference baseline source modified false", baseline.ok, {
  status: baseline.detail.status,
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_release_gate_actual_preflight_openai_scope: status === "pass",
  can_enter_stable_release: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diverse_claim: false,
  local_endpoint_deferred: true,
  reason: status === "pass"
    ? "OpenAI-only release gate dry-run passed, local endpoint is explicitly deferred, and release-gated/stable claims remain blocked until actual release gate preflight/execution."
    : "One or more RC1 OpenAI-scope release gate dry-run checks failed.",
  checks,
  claims_allowed: status === "pass" ? dryRunClaimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# RC1 Release Gate Dry-run Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter actual OpenAI-scope release gate preflight: ${gateReport.can_enter_release_gate_actual_preflight_openai_scope}
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false
- Local endpoint deferred: true
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "rc1_release_gate_dry_run_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "rc1_release_gate_dry_run_gate_report.md"), md);
writeJson(p("evals", "reports", "rc1_release_gate_dry_run_gate_report.json"), gateReport);
writeText(p("evals", "reports", "rc1_release_gate_dry_run_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "pass" ? 0 : 1);
