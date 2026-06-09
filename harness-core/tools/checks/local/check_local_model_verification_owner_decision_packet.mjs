#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-owner-decision-packet";
const EVIDENCE_DIR = "post-stable-local-model-verification-owner-decision-packet";
const EXPECTED_STATUS = "ready_for_owner_decision_to_claim_local_model_verified";
const REQUIRED = [
  "local_model_verification_owner_decision_packet.json",
  "local_model_verification_evidence_summary.json",
  "local_model_verification_remaining_blockers.json",
  "local_model_verification_claim_boundary.json",
  "local_model_verification_owner_decision_gate_report.json",
  "unresolved_items.json"
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
for (const rel of [
  "release/scopes/post-stable/post_stable_local_model_verification_owner_decision_packet_scope.yaml",
  "release/gates/post-stable/post_stable_local_model_verification_owner_decision_gate.yaml",
  "release/claims/post-stable/post_stable_local_model_verification_claim_boundary.yaml",
  "docs/approvals/local_model_verification_owner_decision_packet.ko.md",
  "docs/plans/next_local_model_verification_final_gate_plan.ko.md"
]) {
  addCheck(checks, `${rel} exists`, fs.existsSync(p(...rel.split("/"))), {});
}

const packet = fs.existsSync(e("local_model_verification_owner_decision_packet.json"))
  ? readJson(e("local_model_verification_owner_decision_packet.json"))
  : null;
const summary = fs.existsSync(e("local_model_verification_evidence_summary.json"))
  ? readJson(e("local_model_verification_evidence_summary.json"))
  : null;
const blockers = fs.existsSync(e("local_model_verification_remaining_blockers.json"))
  ? readJson(e("local_model_verification_remaining_blockers.json"))
  : [];
const boundary = fs.existsSync(e("local_model_verification_claim_boundary.json"))
  ? readJson(e("local_model_verification_claim_boundary.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

const blockerIds = new Set(Array.isArray(blockers) ? blockers.map((item) => item.id) : []);

addCheck(checks, "stage matches", packet?.stage === STAGE, { stage: packet?.stage });
addCheck(checks, "expected ready-for-owner-decision status recorded", packet?.status === EXPECTED_STATUS, { status: packet?.status });
addCheck(checks, "redteam coverage recorded", packet?.local_redteam_result?.status === "pass"
  && packet?.local_redteam_result?.total_cases === 8
  && packet?.local_redteam_result?.cases_failed === 0
  && packet?.local_redteam_result?.dummy_secret_leaked === false, packet?.local_redteam_result || {});
addCheck(checks, "adapter dependency resolved", packet?.adapter_dependency_result?.status === "ready_for_dependency_backed_adapter_conformance"
  && packet?.adapter_dependency_result?.yaml_import_available === true
  && packet?.adapter_dependency_result?.dependency_install_approved === true
  && packet?.adapter_dependency_result?.can_run_dependency_backed_adapter_conformance === true
  && packet?.adapter_dependency_result?.owner_approval_required === false, packet?.adapter_dependency_result || {});
addCheck(checks, "stage K adapter conformance recorded", packet?.stage_k_adapter_conformance_result?.status === "pass"
  && packet?.stage_k_adapter_conformance_result?.executed === true, packet?.stage_k_adapter_conformance_result || {});
addCheck(checks, "ready for owner final wording decision", packet?.ready_for_owner_decision_to_claim_local_model_verified === true, {});
addCheck(checks, "only owner final decision remains", blockerIds.size === 1
  && blockerIds.has("owner_final_decision"), { blockers });
addCheck(checks, "evidence summary reflects available surfaces", summary?.local_redteam_coverage_recorded === true
  && summary?.adapter_dependency_status_recorded === true
  && summary?.adapter_conformance_execution_recorded === true
  && summary?.stage_k_status === "pass", summary || {});
addCheck(checks, "no external side-effect surfaces", packet?.openai_model_api_call === false
  && packet?.telemetry_sink_write === false, {});
addCheck(checks, "protected paths and node_modules unmodified or owner-approved baseline refresh recorded", packet?.reference_baseline_source_modified === false
  && packet?.dist_modified === false
  && (
    packet?.evidence_reference_baseline_modified === false
      || packet?.evidence_reference_baseline_modified_by_owner_approved_refresh === true
  )
  && packet?.node_modules_modified === false, {});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false, boundary || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verification_owner_decision_packet_check_report.json",
    "evals/reports/local_model_verification_owner_decision_packet_check_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, { matches: blockedMatches });

const failed = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  observed_packet_status: packet?.status,
  expected_packet_status: EXPECTED_STATUS,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  ready_for_owner_decision_to_claim_local_model_verified: true,
  claims_allowed: packet?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};
const md = `# Local Model Verification Owner Decision Packet Check

Status: ${gate.status}

- Stage: ${STAGE}
- Observed packet status: ${gate.observed_packet_status}
- Ready for owner decision to claim strong local verification wording: true
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_owner_decision_packet_check_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_owner_decision_packet_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
