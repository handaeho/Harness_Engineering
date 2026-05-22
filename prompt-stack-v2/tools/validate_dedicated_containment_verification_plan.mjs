#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts, resolveRoot, STAGE } from "./build_dedicated_containment_verification_plan.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-dedicated-containment-verification-plan");

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

export function validatePlan(options = {}) {
  const built = buildArtifacts({ root, write: options.write !== false });
  const checks = [];
  const report = readIfExists("evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json");
  const matrix = readIfExists("evidence/beta-dedicated-containment-verification-plan/criteria_satisfaction_matrix.json");
  const methods = readIfExists("evidence/beta-dedicated-containment-verification-plan/dedicated_verification_methods.json");
  const claim = readIfExists("evidence/beta-dedicated-containment-verification-plan/containment_claim_boundary.json");
  const blocker = readIfExists("evidence/beta-dedicated-containment-verification-plan/containment_dedicated_verification_blocker_update.json");

  for (const relPath of [
    "release/beta_dedicated_containment_verification_plan_scope.yaml",
    "release/dedicated_containment_verification_gate.yaml",
    "release/dedicated_containment_verification_approval_gate.yaml",
    "release/dedicated_containment_verification_command_plan.yaml",
    "security/containment/dedicated_containment_verification_plan.yaml",
    "security/containment/dedicated_containment_runner_contract.yaml",
    "security/containment/dedicated_containment_acceptance_criteria.yaml",
    "security/containment/dedicated_containment_failure_policy.yaml",
    "security/containment/dedicated_containment_risk_acceptance_policy.yaml",
    "evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json",
    "evidence/beta-dedicated-containment-verification-plan/criteria_satisfaction_matrix.json",
    "evidence/beta-dedicated-containment-verification-plan/dedicated_verification_methods.json",
    "evidence/beta-dedicated-containment-verification-plan/runner_contract_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/approval_gate_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/command_plan_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/acceptance_criteria_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/failure_policy_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/risk_acceptance_policy_snapshot.yaml",
    "evidence/beta-dedicated-containment-verification-plan/containment_claim_boundary.json",
    "evidence/beta-dedicated-containment-verification-plan/containment_dedicated_verification_blocker_update.json"
  ]) {
    addCheck(checks, `${relPath} exists`, exists(relPath), {});
  }

  addCheck(checks, "plan report pass", report?.status === "pass", { status: report?.status });
  addCheck(checks, "no execution flags remain false", report?.actual_containment_verification_execution === false
    && report?.new_provider_execution === false
    && report?.local_model_execution === false
    && report?.telemetry_connection === false, {
    actual_containment_verification_execution: report?.actual_containment_verification_execution,
    new_provider_execution: report?.new_provider_execution,
    local_model_execution: report?.local_model_execution,
    telemetry_connection: report?.telemetry_connection
  });
  addCheck(checks, "approval gate remains closed", report?.explicit_user_approval_present === false
    && report?.can_execute_dedicated_containment_verification === false, {
    explicit_user_approval_present: report?.explicit_user_approval_present,
    can_execute_dedicated_containment_verification: report?.can_execute_dedicated_containment_verification
  });
  addCheck(checks, "criteria matrix valid", matrix?.status === "partial_ready_for_dedicated_verification_plan"
    && matrix?.criteria?.length === 4
    && matrix?.criteria?.find((item) => item.id === "CVR-002")?.status === "satisfied", {
    status: matrix?.status,
    criteria_count: matrix?.criteria?.length,
    cvr_002_status: matrix?.criteria?.find((item) => item.id === "CVR-002")?.status
  });
  addCheck(checks, "dedicated methods cover all boundaries", methods?.methods?.length === 9
    && methods.methods.every((item) => item.requires_provider_call === false
      && item.requires_local_model === false
      && item.requires_external_side_effect === false), {
    methods_count: methods?.methods?.length
  });
  addCheck(checks, "claim boundary closed", claim?.containment_verified_allowed === false
    && claim?.release_gated_allowed === false
    && claim?.production_ready_allowed === false, {
    containment_verified_allowed: claim?.containment_verified_allowed,
    release_gated_allowed: claim?.release_gated_allowed,
    production_ready_allowed: claim?.production_ready_allowed
  });
  addCheck(checks, "blocker update valid", blocker?.new_status === "dedicated_containment_verification_plan_ready_execution_pending"
    && blocker?.does_not_unblock?.includes("containment-verified"), {
    new_status: blocker?.new_status
  });
  addCheck(checks, "future execution runner not created in plan stage", !exists("tools/run_dedicated_containment_verification.mjs")
    && !exists("tools/check_dedicated_containment_verification.mjs"), {
    run_exists: exists("tools/run_dedicated_containment_verification.mjs"),
    check_exists: exists("tools/check_dedicated_containment_verification.mjs")
  });

  const failed = checks.filter((check) => check.status !== "pass");
  const validation = {
    status: failed.length === 0 ? "pass" : "fail",
    stage: STAGE,
    checks,
    claims_allowed: failed.length === 0 ? built.report.claims_allowed : [],
    claims_blocked: built.report.claims_not_allowed
  };
  if (options.write !== false) {
    writeJson(path.join(evidenceDir, "dedicated_containment_plan_validation_report.json"), validation);
    writeText(path.join(evidenceDir, "dedicated_containment_plan_validation_report.md"), `# Dedicated Containment Plan Validation Report

Status: ${validation.status}

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`);
  }
  return validation;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = validatePlan({ write: true });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "pass" ? 0 : 1;
}
