#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { buildContainmentVerifiedDecisionGateArtifacts, resolveRoot, STAGE } from "./run_containment_verified_decision_gate.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-containment-verified-decision-gate");

const claimsAllowed = [
  "containment-verified-decision-gate-executed",
  "containment-evidence-sufficiency-audited",
  "containment-owner-final-decision-recorded",
  "containment-verified-claim-boundary-audited",
  "containment-release-blocker-updated"
];

const claimsBlockedBase = [
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

function runJsonTool(script) {
  const result = spawnSync(process.execPath, [p("tools", script)], {
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

buildContainmentVerifiedDecisionGateArtifacts(root, process.argv);

const checks = [];
const validate = runJsonTool("validate_alpha.mjs");
addCheck(checks, "validate_alpha.mjs pass", validate.ok, validate.detail);
const scanTool = runJsonTool("scan_prohibited_claims.mjs");
addCheck(checks, "scan_prohibited_claims.mjs pass", scanTool.ok, {
  status: scanTool.detail.status,
  matches: Array.isArray(scanTool.detail.matches) ? scanTool.detail.matches.length : null
});
const baseline = runJsonTool("check_reference_baseline_integrity.mjs");
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline.ok, {
  status: baseline.detail.status,
  unresolved_items_count: baseline.detail.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.detail.current_snapshot_mismatch_count
});
const postExecution = runJsonTool("check_containment_post_execution_claim_audit.mjs");
addCheck(checks, "check_containment_post_execution_claim_audit.mjs pass", postExecution.ok, {
  status: postExecution.detail.status,
  can_enter_containment_verified_decision_gate: postExecution.detail.can_enter_containment_verified_decision_gate,
  can_enter_containment_verified_claim: postExecution.detail.can_enter_containment_verified_claim
});

const decision = readIfExists("evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json");
const audit = readIfExists("evidence/beta-containment-verified-decision-gate/containment_evidence_sufficiency_audit.json");
const boundary = readIfExists("evidence/beta-containment-verified-decision-gate/containment_verified_claim_boundary_audit.json");
const owner = readIfExists("evidence/beta-containment-verified-decision-gate/containment_owner_final_decision.json");
const impact = readIfExists("evidence/beta-containment-verified-decision-gate/release_gate_impact_report.json");
const blocker = readIfExists("evidence/beta-containment-verified-decision-gate/containment_verified_blocker_update.json");
const unresolved = readIfExists("evidence/beta-containment-verified-decision-gate/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

for (const relPath of [
  "release/beta_containment_verified_decision_gate_scope.yaml",
  "release/containment_verified_decision_gate.yaml",
  "release/containment_owner_final_decision.yaml",
  "release/containment_verified_blocker_update.yaml",
  "security/containment/containment_verified_decision_policy.yaml",
  "security/containment/containment_verified_evidence_sufficiency_policy.yaml",
  "security/containment/containment_verified_claim_rules.yaml",
  "tools/run_containment_verified_decision_gate.mjs",
  "tools/audit_containment_verified_evidence_sufficiency.mjs",
  "tools/audit_containment_verified_claim_boundary.mjs",
  "tools/check_containment_verified_decision_gate.mjs",
  "evals/suites/beta_containment_verified_decision_gate.yaml",
  "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json",
  "evidence/beta-containment-verified-decision-gate/containment_evidence_sufficiency_audit.json",
  "evidence/beta-containment-verified-decision-gate/containment_verified_claim_boundary_audit.json",
  "evidence/beta-containment-verified-decision-gate/containment_owner_final_decision.json",
  "evidence/beta-containment-verified-decision-gate/release_gate_impact_report.json",
  "evidence/beta-containment-verified-decision-gate/containment_verified_blocker_update.json",
  "evidence/beta-containment-verified-decision-gate/containment_verified_decision_gate_report.json",
  "evidence/beta-containment-verified-decision-gate/unresolved_items.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "decision report has no new execution", decision?.new_execution === false
  && decision?.containment_fixture_rerun === false
  && decision?.provider_execution === false
  && decision?.local_model_execution === false
  && decision?.telemetry_connection === false
  && decision?.dist_modified === false, {
  new_execution: decision?.new_execution,
  containment_fixture_rerun: decision?.containment_fixture_rerun,
  provider_execution: decision?.provider_execution,
  local_model_execution: decision?.local_model_execution,
  telemetry_connection: decision?.telemetry_connection
});
addCheck(checks, "evidence sufficiency audit pass", audit?.status === "pass"
  && decision?.evidence_sufficiency_audit_passed === true
  && audit?.dedicated_containment_verification_passed === true
  && audit?.cross_suite_storage_redaction_audit_passed === true
  && audit?.post_execution_claim_audit_passed === true
  && audit?.critical_failures_zero === true
  && audit?.high_failures_zero === true
  && audit?.no_side_effect_counters_zero === true
  && audit?.raw_request_response_stored_false === true
  && audit?.secret_logged_false === true
  && audit?.redaction_passed === true, {
  status: audit?.status,
  evidence_sufficiency_audit_passed: decision?.evidence_sufficiency_audit_passed
});
addCheck(checks, "owner decision state is consistent", owner?.owner_final_decision_present === decision?.owner_final_decision_present
  && owner?.owner_final_decision === decision?.owner_final_decision
  && owner?.can_claim_containment_verified === decision?.containment_verified_allowed, {
  owner_final_decision_present: owner?.owner_final_decision_present,
  owner_final_decision: owner?.owner_final_decision
});
addCheck(checks, "release and production claims remain blocked", decision?.release_gated_allowed === false
  && decision?.production_ready_allowed === false
  && decision?.production_monitored_allowed === false
  && boundary?.release_gated_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.production_monitored_allowed === false
  && impact?.release_gate_passed === false
  && impact?.production_ready === false
  && impact?.production_monitored === false, {
  release_gated_allowed: decision?.release_gated_allowed,
  production_ready_allowed: decision?.production_ready_allowed,
  production_monitored_allowed: decision?.production_monitored_allowed
});
addCheck(checks, "blocked-without-owner decision is honest", decision?.owner_final_decision_present === true
  ? decision?.status === "containment_verified_decision_approved" && decision?.containment_verified_allowed === true
  : decision?.status === "ready_but_blocked_by_missing_owner_decision" && decision?.containment_verified_allowed === false, {
  status: decision?.status,
  owner_final_decision_present: decision?.owner_final_decision_present,
  containment_verified_allowed: decision?.containment_verified_allowed
});
addCheck(checks, "blocker update matches decision", decision?.containment_verified_allowed === true
  ? blocker?.new_status === "containment_verified_allowed_release_gate_still_blocked"
  : blocker?.new_status === "containment_decision_gate_ready_owner_decision_pending", {
  blocker_new_status: blocker?.new_status
});
addCheck(checks, "unresolved items match owner decision state", decision?.owner_final_decision_present === true
  ? Array.isArray(unresolved) && unresolved.length === 0
  : Array.isArray(unresolved) && unresolved.length === 1 && unresolved[0]?.id === "CVDG-001", {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
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
const reportStatus = decision?.containment_verified_allowed === true ? "pass" : "blocked";
const status = failed.length === 0 ? reportStatus : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_containment_verified_claim: failed.length === 0 && decision?.containment_verified_allowed === true,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: failed.length === 0
    ? decision?.containment_verified_allowed === true
      ? "Containment-verified is allowed for beta scope after owner decision; release and production claims remain blocked."
      : "Evidence is sufficient for decision review, but owner final decision is pending."
    : "One or more containment verified decision gate checks failed.",
  checks,
  claims_allowed: failed.length === 0 ? claimsAllowed : [],
  claims_blocked: decision?.containment_verified_allowed === true
    ? claimsBlockedBase
    : ["containment-verified", ...claimsBlockedBase]
};
const md = `# Containment Verified Decision Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment verified claim: ${gateReport.can_enter_containment_verified_claim}
- Can enter release gated claim: false
- Can enter production ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "containment_verified_decision_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "containment_verified_decision_gate_report.md"), md);
writeJson(p("evals", "reports", "containment_verified_decision_gate_report.json"), gateReport);
writeText(p("evals", "reports", "containment_verified_decision_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "fail" ? 1 : 0;
