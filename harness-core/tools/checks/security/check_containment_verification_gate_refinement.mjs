#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildArtifacts, resolveRoot, STAGE } from "../../refinements/security/refine_containment_verification_gate.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-containment-verification-gate-refinement");
const claimsAllowed = [
  "containment-verification-gate-refined",
  "containment-evidence-mapped",
  "containment-proof-levels-classified",
  "containment-remaining-criteria-recorded",
  "containment-release-blocker-refreshed",
  "containment-claim-boundary-audited"
];
const claimsBlocked = [
  "containment-verified",
  "redteam-passed",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-verified",
  "provider-diverse",
  "adapter-checked",
  "integration-verified"
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
    maxBuffer: 1024 * 1024 * 20
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
const mappingTool = runJsonTool("tools/mappers/security/map_containment_evidence_to_boundaries.mjs");
const proofAuditTool = runJsonTool("tools/audits/security/audit_containment_proof_levels.mjs");
const validateAlpha = runJsonTool("tools/validators/evals/validate_alpha.mjs");
const compareBaseline = runJsonTool("tools/checks/workspace/check_reference_baseline_integrity.mjs");
const mockGate = runJsonTool("tools/checks/security/check_containment_boundary_mock_dry_run.mjs");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});

const report = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_verification_gate_refinement_report.json");
const evidenceMapping = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_evidence_mapping.json");
const proofMatrix = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_proof_level_matrix.json");
const remainingCriteria = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_remaining_criteria.json");
const claimBoundary = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_claim_boundary.json");
const blockerRefresh = readIfExists("evidence/beta-containment-verification-gate-refinement/containment_release_blocker_refresh.json");
const unresolved = readIfExists("evidence/beta-containment-verification-gate-refinement/unresolved_items.json");
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];
const verifiedCount = Object.values(proofMatrix?.boundaries || {}).filter((entry) => entry.proof_level === "verified").length;
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
addCheck(checks, "check_containment_boundary_mock_dry_run.mjs pass", mockGate.exitCode === 0 && mockGate.parsed?.status === "pass", {
  status: mockGate.parsed?.status,
  exitCode: mockGate.exitCode
});
addCheck(checks, "map_containment_evidence_to_boundaries.mjs pass", mappingTool.exitCode === 0 && mappingTool.parsed?.status === "pass", {
  status: mappingTool.parsed?.status,
  exitCode: mappingTool.exitCode
});
addCheck(checks, "audit_containment_proof_levels.mjs pass", proofAuditTool.exitCode === 0 && proofAuditTool.parsed?.status === "pass", {
  status: proofAuditTool.parsed?.status,
  exitCode: proofAuditTool.exitCode
});

for (const relPath of [
  "release/gates/containment/containment_verification_gate_refined.yaml",
  "release/blockers/containment/containment_release_blocker_refresh.yaml",
  "release/requirements/containment/containment_proof_requirements.yaml",
  "security/containment/containment_proof_level_matrix.yaml",
  "security/containment/containment_remaining_criteria.yaml",
  "security/containment/containment_evidence_mapping_policy.yaml",
  "security/containment/containment_verification_claim_gate.yaml",
  "evidence/beta-containment-verification-gate-refinement/containment_verification_gate_refinement_report.json",
  "evidence/beta-containment-verification-gate-refinement/containment_evidence_mapping.json",
  "evidence/beta-containment-verification-gate-refinement/containment_proof_level_matrix.json",
  "evidence/beta-containment-verification-gate-refinement/containment_remaining_criteria.json",
  "evidence/beta-containment-verification-gate-refinement/containment_claim_boundary.json",
  "evidence/beta-containment-verification-gate-refinement/containment_release_blocker_refresh.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "no execution occurred in refinement stage", report?.new_provider_execution === false
  && report?.new_redteam_execution === false
  && report?.containment_fixture_rerun === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false, {
  new_provider_execution: report?.new_provider_execution,
  new_redteam_execution: report?.new_redteam_execution,
  containment_fixture_rerun: report?.containment_fixture_rerun,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection
});
addCheck(checks, "evidence mapping pass", evidenceMapping?.status === "pass" && evidenceMapping?.entries?.length > 0, {
  status: evidenceMapping?.status,
  entries: evidenceMapping?.entries?.length
});
addCheck(checks, "proof level matrix partial and no verified boundaries", proofMatrix?.status === "partial_not_verified"
  && verifiedCount === 0
  && proofMatrix?.containment_verified_allowed === false, {
  status: proofMatrix?.status,
  boundaries_marked_verified_count: verifiedCount
});
addCheck(checks, "remaining criteria recorded", remainingCriteria?.status === "pending"
  && remainingCriteria?.containment_verified_allowed === false
  && remainingCriteria?.remaining_criteria?.length === 4, {
  status: remainingCriteria?.status,
  remaining_criteria_count: remainingCriteria?.remaining_criteria?.length
});
addCheck(checks, "claim boundary remains closed", claimBoundary?.containment_verified_allowed === false
  && claimBoundary?.release_gated_allowed === false
  && claimBoundary?.production_ready_allowed === false, {
  containment_verified_allowed: claimBoundary?.containment_verified_allowed,
  release_gated_allowed: claimBoundary?.release_gated_allowed,
  production_ready_allowed: claimBoundary?.production_ready_allowed
});
addCheck(checks, "blocker refresh records refined gate", blockerRefresh?.new_status === "containment_gate_refined_dedicated_verification_and_cross_suite_audit_pending"
  && blockerRefresh?.still_blocks?.includes("containment-verified")
  && blockerRefresh?.does_not_unblock?.includes("release-gated"), {
  new_status: blockerRefresh?.new_status
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
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
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Containment gate was refined with mapped evidence and proof levels, but verified claim remains blocked by dedicated verification and cross-suite audit requirements."
    : "One or more containment verification gate refinement checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Containment Gate Refinement Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment-verified claim: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "containment_gate_refinement_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "containment_gate_refinement_gate_report.md"), md);
writeJson(p("evals", "reports", "containment_gate_refinement_gate_report.json"), gateReport);
writeText(p("evals", "reports", "containment_gate_refinement_gate_report.md"), md);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
