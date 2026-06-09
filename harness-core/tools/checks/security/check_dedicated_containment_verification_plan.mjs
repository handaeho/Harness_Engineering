#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildArtifacts, resolveRoot, STAGE } from "../../builders/security/build_dedicated_containment_verification_plan.mjs";
import { validatePlan } from "../../validators/security/validate_dedicated_containment_verification_plan.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-dedicated-containment-verification-plan");
const claimsAllowed = [
  "dedicated-containment-verification-plan-drafted",
  "dedicated-containment-runner-contract-drafted",
  "dedicated-containment-acceptance-criteria-drafted",
  "containment-risk-acceptance-policy-drafted",
  "containment-dedicated-verification-gate-designed",
  "containment-dedicated-verification-blocker-updated"
];
const claimsBlocked = [
  "containment-verified",
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "release-gated",
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

function runJsonTool(relPath) {
  const result = spawnSync(process.execPath, [p(...relPath.split("/"))], {
    cwd: path.dirname(root),
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 40
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = { status: "unparseable", stdout: result.stdout.slice(0, 500), stderr: result.stderr.slice(0, 500) };
  }
  return { exitCode: result.status, parsed };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

buildArtifacts({ root, write: true });
const validation = validatePlan({ write: true });
const validateAlpha = runJsonTool("tools/validators/evals/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/checks/workspace/check_reference_baseline_integrity.mjs");
const storageGate = runJsonTool("tools/checks/security/check_cross_suite_storage_redaction_audit.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const report = readIfExists("evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json");
const matrix = readIfExists("evidence/beta-dedicated-containment-verification-plan/criteria_satisfaction_matrix.json");
const methods = readIfExists("evidence/beta-dedicated-containment-verification-plan/dedicated_verification_methods.json");
const claim = readIfExists("evidence/beta-dedicated-containment-verification-plan/containment_claim_boundary.json");
const blocker = readIfExists("evidence/beta-dedicated-containment-verification-plan/containment_dedicated_verification_blocker_update.json");
const unresolved = readIfExists("evidence/beta-dedicated-containment-verification-plan/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const checks = [];

addCheck(checks, "validate_alpha.mjs pass", validateAlpha.exitCode === 0 && validateAlpha.parsed?.status === "pass", {
  status: validateAlpha.parsed?.status,
  exitCode: validateAlpha.exitCode
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", compareBaseline.exitCode === 0 && compareBaseline.parsed?.status === "pass", {
  status: compareBaseline.parsed?.status,
  exitCode: compareBaseline.exitCode
});
addCheck(checks, "check_cross_suite_storage_redaction_audit.mjs pass", storageGate.exitCode === 0 && storageGate.parsed?.status === "pass", {
  status: storageGate.parsed?.status,
  exitCode: storageGate.exitCode
});
addCheck(checks, "validate_dedicated_containment_verification_plan.mjs pass", validation.status === "pass", {
  status: validation.status
});

for (const relPath of [
  "security/containment/dedicated_containment_verification_plan.yaml",
  "security/containment/dedicated_containment_runner_contract.yaml",
  "release/gates/containment/dedicated_containment_verification_approval_gate.yaml",
  "release/commands/containment/dedicated_containment_verification_command_plan.yaml",
  "security/containment/dedicated_containment_acceptance_criteria.yaml",
  "security/containment/dedicated_containment_failure_policy.yaml",
  "security/containment/dedicated_containment_risk_acceptance_policy.yaml",
  "evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json",
  "evidence/beta-dedicated-containment-verification-plan/criteria_satisfaction_matrix.json",
  "evidence/beta-dedicated-containment-verification-plan/dedicated_verification_methods.json",
  "evidence/beta-dedicated-containment-verification-plan/containment_claim_boundary.json",
  "evidence/beta-dedicated-containment-verification-plan/containment_dedicated_verification_blocker_update.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no execution occurred in plan stage", report?.actual_containment_verification_execution === false
  && report?.new_provider_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false
  && report?.containment_fixture_rerun === false, {
  actual_containment_verification_execution: report?.actual_containment_verification_execution,
  new_provider_execution: report?.new_provider_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection,
  containment_fixture_rerun: report?.containment_fixture_rerun
});
addCheck(checks, "dist modified false", report?.dist_modified === false && distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: report?.dist_modified,
  dist_files: distFiles
});
addCheck(checks, "approval gate remains closed", report?.explicit_user_approval_present === false
  && report?.can_execute_dedicated_containment_verification === false, {
  explicit_user_approval_present: report?.explicit_user_approval_present,
  can_execute_dedicated_containment_verification: report?.can_execute_dedicated_containment_verification
});
addCheck(checks, "criteria satisfaction matrix ready", matrix?.status === "partial_ready_for_dedicated_verification_plan"
  && matrix?.criteria?.find((item) => item.id === "CVR-002")?.status === "satisfied", {
  status: matrix?.status,
  cvr_002_status: matrix?.criteria?.find((item) => item.id === "CVR-002")?.status
});
addCheck(checks, "dedicated verification methods drafted", methods?.methods?.length === 9, {
  methods_count: methods?.methods?.length
});
addCheck(checks, "claim boundary remains closed", claim?.containment_verified_allowed === false
  && claim?.release_gated_allowed === false
  && claim?.production_ready_allowed === false, {
  containment_verified_allowed: claim?.containment_verified_allowed,
  release_gated_allowed: claim?.release_gated_allowed,
  production_ready_allowed: claim?.production_ready_allowed
});
addCheck(checks, "blocker update records execution pending", blocker?.new_status === "dedicated_containment_verification_plan_ready_execution_pending", {
  new_status: blocker?.new_status
});
addCheck(checks, "future execution runner absent", !exists("tools/runners/security/run_dedicated_containment_verification.mjs")
  && !exists("tools/checks/security/check_dedicated_containment_verification.mjs"), {
  run_exists: exists("tools/runners/security/run_dedicated_containment_verification.mjs"),
  check_exists: exists("tools/checks/security/check_dedicated_containment_verification.mjs")
});
addCheck(checks, "unresolved items empty on pass", report?.status !== "pass" || (Array.isArray(unresolved) && unresolved.length === 0), {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "reference baseline source modified false by checksum comparison", compareBaseline.parsed?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && compareBaseline.parsed?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((check) => check.status !== "pass");
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_dedicated_containment_verification_execution: false,
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Dedicated containment verification plan is ready, but explicit approval and execution are required before any verification claim can be considered."
    : "One or more dedicated containment verification plan checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Dedicated Containment Plan Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter dedicated containment verification execution: false
- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "dedicated_containment_plan_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "dedicated_containment_plan_gate_report.md"), md);
writeJson(p("evals", "reports", "dedicated_containment_plan_gate_report.json"), gateReport);
writeText(p("evals", "reports", "dedicated_containment_plan_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
