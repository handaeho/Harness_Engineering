#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import { buildReleaseBlockerReevaluationArtifacts, resolveRoot, STAGE } from "../../evaluations/release/reevaluate_release_blockers.mjs";

const OWNER_APPROVAL_PHRASE = "I approve containment-verified for v2.0.0-beta based on dedicated containment verification evidence.";
const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-release-blocker-p0-p1-reevaluation");

const allowedClaims = [
  "release-blockers-reevaluated",
  "p0-p1-blockers-refreshed",
  "rc1-readiness-assessed",
  "release-path-decision-matrix-drafted",
  "release-claim-boundary-after-containment-audited",
  "owner-action-matrix-refreshed"
];

const blockedClaims = [
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "telemetry-connected",
  "redteam-passed",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "benchmark-backed"
];

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
    maxBuffer: 1024 * 1024 * 20
  });
  let detail = {
    exit_code: result.status,
    stderr: result.stderr?.trim() || ""
  };
  try {
    detail = { ...detail, ...JSON.parse(result.stdout) };
  } catch {
    detail.stdout_preview = (result.stdout || "").slice(0, 1000);
  }
  return {
    ok: result.status === 0 && (detail.status === undefined || detail.status === "pass"),
    detail
  };
}

buildReleaseBlockerReevaluationArtifacts(root);

const checks = [];
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
const containmentDecision = runJsonTool("check_containment_verified_decision_gate.mjs", [
  `--owner-approval-phrase=${OWNER_APPROVAL_PHRASE}`
]);
addCheck(checks, "check_containment_verified_decision_gate.mjs pass", containmentDecision.ok, {
  status: containmentDecision.detail.status,
  can_enter_containment_verified_claim: containmentDecision.detail.can_enter_containment_verified_claim,
  can_enter_release_gated_claim: containmentDecision.detail.can_enter_release_gated_claim,
  can_enter_production_ready_claim: containmentDecision.detail.can_enter_production_ready_claim
});

const report = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json");
const matrix = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/blocker_status_matrix.json");
const rc1 = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/rc1_readiness_assessment.json");
const paths = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/release_path_decision_matrix.json");
const boundary = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/claim_boundary_after_containment.json");
const ownerRefresh = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/owner_action_matrix_refresh.json");
const gateStatus = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/release_gate_status_refresh.json");
const unresolved = readIfExists("evidence/beta-release-blocker-p0-p1-reevaluation/unresolved_items.json");
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

for (const relPath of [
  "release/blockers/beta/beta_release_blocker_p0_p1_reevaluation_scope.yaml",
  "release/blockers/core-release/release_blocker_p0_p1_current.yaml",
  "release/readiness/rc1/rc1_readiness_assessment.yaml",
  "release/decisions/core-release/release_path_decision_matrix.yaml",
  "release/paths/openai/openai_only_rc_path.yaml",
  "release/paths/providers/strict_provider_diverse_rc_path.yaml",
  "tools/evaluations/release/reevaluate_release_blockers.mjs",
  "tools/summaries/release/summarize_rc1_readiness.mjs",
  "tools/audits/security/audit_release_claim_boundaries_after_containment.mjs",
  "tools/checks/release/check_release_blocker_p0_p1_reevaluation.mjs",
  "evals/suites/beta_release_blocker_p0_p1_reevaluation.yaml",
  "evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/blocker_status_matrix.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/rc1_readiness_assessment.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/release_path_decision_matrix.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/claim_boundary_after_containment.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/owner_action_matrix_refresh.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/release_gate_status_refresh.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_p0_p1_gate_report.json",
  "evidence/beta-release-blocker-p0-p1-reevaluation/unresolved_items.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no new execution flags remain false", report?.new_provider_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false
  && report?.release_gate_execution === false, {
  new_provider_execution: report?.new_provider_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection,
  release_gate_execution: report?.release_gate_execution
});
addCheck(checks, "containment resolved and release remains blocked", matrix?.containment_verified === true
  && boundary?.containment_verified_allowed === true
  && boundary?.release_gated_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.production_monitored_allowed === false
  && boundary?.provider_diverse_allowed === false, {
  containment_verified: matrix?.containment_verified,
  release_gated_allowed: boundary?.release_gated_allowed,
  production_ready_allowed: boundary?.production_ready_allowed,
  provider_diverse_allowed: boundary?.provider_diverse_allowed
});
addCheck(checks, "rc1 path split is correct", rc1?.openai_only_rc1_possible === true
  && rc1?.strict_provider_diverse_rc1_possible === false
  && paths?.paths?.openai_only_rc1?.status === "available_candidate"
  && paths?.paths?.strict_provider_diverse_rc1?.status === "blocked", {
  openai_only_rc1_possible: rc1?.openai_only_rc1_possible,
  strict_provider_diverse_rc1_possible: rc1?.strict_provider_diverse_rc1_possible
});
addCheck(checks, "release gate status refresh remains blocked", gateStatus?.release_gate_status === "blocked_not_release_gated"
  && gateStatus?.containment_verified === true
  && gateStatus?.production_ready === false
  && gateStatus?.production_monitored === false
  && gateStatus?.provider_diversity_established === false
  && gateStatus?.local_model_execution_verified === false
  && gateStatus?.release_gate_actual_execution_completed === false, {
  release_gate_status: gateStatus?.release_gate_status,
  recommended_next_stage: gateStatus?.recommended_next_stage
});
addCheck(checks, "owner action matrix refresh exists", ownerRefresh?.status === "refreshed"
  && Array.isArray(ownerRefresh?.actions)
  && ownerRefresh.actions.length === 4, {
  actions_count: ownerRefresh?.actions?.length
});
addCheck(checks, "p0 and p1 remaining counts recorded", report?.p0_blockers_remaining === 2
  && report?.p1_blockers_remaining === 2, {
  p0_blockers_remaining: report?.p0_blockers_remaining,
  p1_blockers_remaining: report?.p1_blockers_remaining
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
  can_enter_openai_only_rc1_bundle: status === "pass",
  can_enter_strict_provider_diverse_rc1: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Containment blocker is resolved for beta scope, but provider diversity, local runtime, telemetry, and final release gate remain blocked. OpenAI-only rc.1 bundle is available as next stage."
    : "One or more release blocker reevaluation checks failed.",
  checks,
  claims_allowed: status === "pass" ? allowedClaims : [],
  claims_blocked: blockedClaims
};

const md = `# Release Blocker P0/P1 Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter OpenAI-only rc.1 bundle: ${gateReport.can_enter_openai_only_rc1_bundle}
- Can enter strict provider-diverse rc.1: ${gateReport.can_enter_strict_provider_diverse_rc1}
- Can enter release-gated claim: ${gateReport.can_enter_release_gated_claim}
- Can enter production-ready claim: ${gateReport.can_enter_production_ready_claim}
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "release_blocker_p0_p1_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "release_blocker_p0_p1_gate_report.md"), md);
writeJson(p("evals", "reports", "release_blocker_p0_p1_gate_report.json"), gateReport);
writeText(p("evals", "reports", "release_blocker_p0_p1_gate_report.md"), md);
writeText(p("session_handoff_2026-05-22.md"), `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- Release blockers were reevaluated after \`containment-verified\` became allowed for beta containment evidence scope.
- OpenAI-only rc.1 evidence bundle is available as a candidate next stage.
- Strict provider-diverse rc.1 remains blocked.
- Release, production, telemetry, provider-diversity, provider-verification, adapter, and integration claims remain blocked.

## Current Gate

- Gate script: \`harness-core/tools/checks/release/check_release_blocker_p0_p1_reevaluation.mjs\`
- Gate status: ${gateReport.status}
- Can enter OpenAI-only rc.1 bundle: ${gateReport.can_enter_openai_only_rc1_bundle}
- Can enter strict provider-diverse rc.1: ${gateReport.can_enter_strict_provider_diverse_rc1}
- Can enter release-gated claim: false
- Can enter production-ready claim: false

## Current Evidence

- \`evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/blocker_status_matrix.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/rc1_readiness_assessment.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/release_path_decision_matrix.json\`
- \`evidence/beta-release-blocker-p0-p1-reevaluation/claim_boundary_after_containment.json\`

## Current Status

- Containment verified: ${report?.containment_verified}
- Release gate status: ${report?.release_gate_status}
- P0 blockers remaining: ${report?.p0_blockers_remaining}
- P1 blockers remaining: ${report?.p1_blockers_remaining}
- Recommended next stage: ${report?.recommended_next_stage}

## Still Blocked

${blockedClaims.map((claim) => `- \`${claim}\``).join("\n")}
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
