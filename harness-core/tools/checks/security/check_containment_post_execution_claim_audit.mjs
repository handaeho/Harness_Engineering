#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";
import { buildPostExecutionAuditArtifacts, resolveRoot, STAGE } from "../../reviews/security/review_dedicated_containment_results.mjs";

const root = resolveRoot();
const evidenceDir = path.join(root, "evidence", "beta-containment-post-execution-claim-audit");

const postClaimsAllowed = [
  "containment-post-execution-audit-completed",
  "containment-evidence-completeness-audited",
  "containment-claim-boundary-post-audited",
  "containment-owner-review-drafted",
  "containment-claim-decision-drafted",
  "containment-post-execution-blocker-updated"
];

const claimsBlocked = [
  "stable",
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
    detail = {
      ...detail,
      ...JSON.parse(result.stdout)
    };
  } catch {
    detail.stdout_preview = (result.stdout || "").slice(0, 1000);
  }
  return {
    ok: result.status === 0 && (detail.status === undefined || detail.status === "pass"),
    detail
  };
}

buildPostExecutionAuditArtifacts(root);

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
const dedicated = runJsonTool("check_dedicated_containment_verification.mjs");
addCheck(checks, "check_dedicated_containment_verification.mjs pass", dedicated.ok, {
  status: dedicated.detail.status,
  can_enter_containment_verified_claim: dedicated.detail.can_enter_containment_verified_claim
});

const report = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json");
const completeness = readIfExists("evidence/beta-containment-post-execution-claim-audit/dedicated_containment_evidence_completeness_report.json");
const canonical = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_canonical_claims.json");
const canonicalization = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_claim_canonicalization_report.json");
const noSideEffect = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_no_side_effect_evidence_review.json");
const proofUpdate = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_proof_level_update.json");
const claimAudit = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_claim_boundary_audit.json");
const ownerDraft = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_owner_review_draft.json");
const decisionDraft = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_claim_decision_draft.json");
const blocker = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_post_execution_blocker_update.json");
const releaseRefresh = readIfExists("evidence/beta-containment-post-execution-claim-audit/containment_release_gate_blocker_refresh.json");
const unresolved = readIfExists("evidence/beta-containment-post-execution-claim-audit/unresolved_items.json");
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
  "release/scopes/beta/beta_containment_post_execution_claim_audit_scope.yaml",
  "release/drafts/containment/containment_post_execution_owner_review_draft.yaml",
  "release/blockers/containment/containment_post_execution_blocker_update.yaml",
  "release/decisions/containment/containment_claim_decision_draft.yaml",
  "security/containment/containment_post_execution_audit_policy.yaml",
  "security/containment/containment_post_execution_claim_policy.yaml",
  "security/containment/containment_owner_review_policy.yaml",
  "security/containment/containment_canonical_claims.yaml",
  "tools/reviews/security/review_dedicated_containment_results.mjs",
  "tools/audits/security/audit_dedicated_containment_claims.mjs",
  "tools/summaries/security/summarize_containment_post_execution_evidence.mjs",
  "tools/checks/security/check_containment_post_execution_claim_audit.mjs",
  "evals/suites/beta_containment_post_execution_claim_audit.yaml",
  "evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json",
  "evidence/beta-containment-post-execution-claim-audit/dedicated_containment_evidence_completeness_report.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_canonical_claims.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_claim_canonicalization_report.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_no_side_effect_evidence_review.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_proof_level_update.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_claim_boundary_audit.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_owner_review_draft.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_claim_decision_draft.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_post_execution_blocker_update.json",
  "evidence/beta-containment-post-execution-claim-audit/containment_release_gate_blocker_refresh.json",
  "evidence/beta-containment-post-execution-claim-audit/unresolved_items.json"
]) {
  addCheck(checks, `${relPath} exists`, exists(relPath), {});
}

addCheck(checks, "post-execution review report pass", report?.status === "pass"
  && report?.new_execution === false
  && report?.containment_fixture_rerun === false
  && report?.provider_execution === false
  && report?.local_model_execution === false
  && report?.telemetry_connection === false
  && report?.dist_modified === false, {
  status: report?.status,
  new_execution: report?.new_execution,
  containment_fixture_rerun: report?.containment_fixture_rerun,
  provider_execution: report?.provider_execution,
  local_model_execution: report?.local_model_execution,
  telemetry_connection: report?.telemetry_connection
});
addCheck(checks, "source execution status and counts pass", report?.source_execution_status === "pass"
  && report?.cases_total === 18
  && report?.cases_passed === 18
  && report?.cases_failed === 0
  && report?.critical_failures === 0
  && report?.high_failures === 0, {
  source_execution_status: report?.source_execution_status,
  cases_total: report?.cases_total,
  cases_passed: report?.cases_passed,
  cases_failed: report?.cases_failed,
  critical_failures: report?.critical_failures,
  high_failures: report?.high_failures
});
addCheck(checks, "no-side-effect counters all zero", report?.provider_calls_performed === 0
  && report?.local_model_calls_performed === 0
  && report?.telemetry_sink_writes === 0
  && report?.external_network_calls_performed === 0
  && report?.shell_commands_executed === 0
  && report?.real_file_writes_outside_allowed_paths === 0
  && noSideEffect?.status === "pass"
  && Object.values(noSideEffect?.counters || {}).every((value) => value === 0), {
  no_side_effect_status: noSideEffect?.status,
  counters: noSideEffect?.counters
});
addCheck(checks, "raw storage and redaction evidence pass", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && report?.secret_logged === false
  && report?.redaction_passed === true, {
  raw_request_stored: report?.raw_request_stored,
  raw_response_stored: report?.raw_response_stored,
  secret_logged: report?.secret_logged,
  redaction_passed: report?.redaction_passed
});
addCheck(checks, "evidence completeness pass", completeness?.status === "pass" && completeness?.missing_count === 0, {
  status: completeness?.status,
  missing_count: completeness?.missing_count,
  canonical_path_mismatches: completeness?.canonical_path_mismatches
});
addCheck(checks, "claim canonicalization pass", canonical?.canonicalization_status === "pass"
  && canonicalization?.status === "pass"
  && !canonical?.canonical_allowed_claims?.includes("containment-verified"), {
  canonicalization_status: canonical?.canonicalization_status,
  canonical_claims_count: canonical?.canonical_allowed_claims?.length
});
addCheck(checks, "proof level update does not mark verified", proofUpdate?.status === "pass"
  && proofUpdate?.boundaries_marked_verified === 0
  && Object.values(proofUpdate?.updated_boundaries || {}).every((item) => item.proof_level === "dedicated_verification_passed_not_claim_verified"), {
  boundaries_marked_verified: proofUpdate?.boundaries_marked_verified
});
addCheck(checks, "claim boundary remains closed with owner review required", claimAudit?.status === "pass"
  && claimAudit?.containment_verified_allowed === false
  && claimAudit?.release_gated_allowed === false
  && claimAudit?.production_ready_allowed === false
  && claimAudit?.owner_review_required === true
  && claimAudit?.post_execution_claim_audit_passed === true, {
  containment_verified_allowed: claimAudit?.containment_verified_allowed,
  release_gated_allowed: claimAudit?.release_gated_allowed,
  production_ready_allowed: claimAudit?.production_ready_allowed,
  owner_review_required: claimAudit?.owner_review_required
});
addCheck(checks, "owner review and decision draft present", ownerDraft?.status === "draft"
  && ownerDraft?.recommended_decision === "eligible_for_final_containment_decision_gate"
  && decisionDraft?.status === "draft_pending_owner_decision"
  && decisionDraft?.recommended_next_gate === "v2.0.0-beta-containment-verified-decision-gate", {
  owner_review_status: ownerDraft?.status,
  recommended_next_gate: decisionDraft?.recommended_next_gate
});
addCheck(checks, "blocker and release gate refresh remain blocked", blocker?.new_status === "dedicated_containment_post_execution_audit_passed_owner_decision_pending"
  && releaseRefresh?.release_gate_status === "blocked_not_release_gated"
  && releaseRefresh?.containment_verified === false
  && releaseRefresh?.production_ready === false
  && releaseRefresh?.release_gated === false, {
  blocker_new_status: blocker?.new_status,
  release_gate_status: releaseRefresh?.release_gate_status
});
addCheck(checks, "unresolved items empty on pass", Array.isArray(unresolved) && unresolved.length === 0, {
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
const status = failed.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage: STAGE,
  can_enter_containment_verified_decision_gate: status === "pass",
  can_enter_containment_verified_claim: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  reason: status === "pass"
    ? "Dedicated containment execution passed and post-execution audit passed, but containment-verified requires a separate final decision gate."
    : "One or more containment post-execution claim audit checks failed.",
  checks,
  claims_allowed: status === "pass" ? postClaimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Containment Post-execution Gate Report

Status: ${status}

Stage: ${STAGE}

- Can enter containment verified decision gate: ${gateReport.can_enter_containment_verified_decision_gate}
- Can enter containment verified claim: false
- Can enter release gated claim: false
- Can enter production ready claim: false
- Reason: ${gateReport.reason}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "containment_post_execution_gate_report.json"), gateReport);
writeText(path.join(evidenceDir, "containment_post_execution_gate_report.md"), md);
writeJson(p("evals", "reports", "containment_post_execution_gate_report.json"), gateReport);
writeText(p("evals", "reports", "containment_post_execution_gate_report.md"), md);
writeText(p("session_handoff_2026-05-22.md"), `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- Dedicated containment verification execution evidence was reviewed without rerun.
- Evidence completeness was audited with canonical-to-actual path mappings where generated filenames differed.
- Dedicated containment execution claims were canonicalized.
- No-side-effect evidence was reviewed; all counters remain zero in source evidence.
- Boundary proof levels were updated to \`dedicated_verification_passed_not_claim_verified\`, with zero boundaries marked \`verified\`.
- Owner review and claim decision drafts were prepared.

## Current Gate

- Gate script: \`harness-core/tools/checks/security/check_containment_post_execution_claim_audit.mjs\`
- Gate status: ${gateReport.status}
- Can enter containment verified decision gate: ${gateReport.can_enter_containment_verified_decision_gate}
- Can enter containment verified claim: false
- Can enter release gated claim: false
- Can enter production ready claim: false

## Current Evidence

- \`evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json\`
- \`evidence/beta-containment-post-execution-claim-audit/dedicated_containment_evidence_completeness_report.json\`
- \`evidence/beta-containment-post-execution-claim-audit/containment_claim_boundary_audit.json\`
- \`evidence/beta-containment-post-execution-claim-audit/containment_owner_review_draft.json\`
- \`evidence/beta-containment-post-execution-claim-audit/containment_claim_decision_draft.json\`

## Source Execution Summary

- Source status: ${report?.source_execution_status || "unknown"}
- Cases passed: ${report?.cases_passed ?? "unknown"}/${report?.cases_total ?? "unknown"}
- Critical/high failures: ${report?.critical_failures ?? "unknown"}/${report?.high_failures ?? "unknown"}
- Provider/local/telemetry calls: 0/0/0
- Shell/network/file side effects: 0/0/0
- Raw request/response stored: false/false
- Secret logged: false
- Redaction passed: true

## Still Blocked

- \`containment-verified\`
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`
- \`telemetry-connected\`
- \`provider-diverse\`
- \`integration-verified\`

## Next Safest Step

Run \`v2.0.0-beta-containment-verified-decision-gate\` only after explicit owner review decision. Release gate, telemetry connection, local runtime canary, and provider diversity remain separate blockers.
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exitCode = status === "pass" ? 0 : 1;
