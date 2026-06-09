#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-evidence-bundle-draft";
const EVIDENCE_DIR = "post-stable-local-model-verification-evidence-bundle-draft";
const REQUIRED = [
  "local_model_verification_evidence_bundle_report.json",
  "local_model_verification_evidence_index.json",
  "local_model_verification_gap_register.json",
  "local_model_verification_claim_boundary.json",
  "local_model_verification_bundle_blocker_update.json",
  "local_model_verification_bundle_gate_report.json",
  "unresolved_items.json"
];
const REQUIRED_SURFACES = [
  "no_tool_multimodel_comparison",
  "gate_design",
  "structured_output_smoke",
  "tool_calling_mock_smoke",
  "replay_regression_smoke",
  "redaction_storage_audit"
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

function gapStatus(gaps, id) {
  return Array.isArray(gaps) ? gaps.find((gap) => gap.id === id)?.status : undefined;
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
addCheck(
  checks,
  "release scope exists",
  fs.existsSync(p("release", "post_stable_local_model_verification_evidence_bundle_draft_scope.yaml")),
  {}
);
addCheck(
  checks,
  "eval suite exists",
  fs.existsSync(p("evals", "suites", "post_stable_local_model_verification_evidence_bundle_draft.yaml")),
  {}
);

const report = fs.existsSync(e("local_model_verification_evidence_bundle_report.json"))
  ? readJson(e("local_model_verification_evidence_bundle_report.json"))
  : null;
const index = fs.existsSync(e("local_model_verification_evidence_index.json"))
  ? readJson(e("local_model_verification_evidence_index.json"))
  : null;
const gaps = fs.existsSync(e("local_model_verification_gap_register.json"))
  ? readJson(e("local_model_verification_gap_register.json"))
  : [];
const boundary = fs.existsSync(e("local_model_verification_claim_boundary.json"))
  ? readJson(e("local_model_verification_claim_boundary.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

const satisfied = new Set(report?.satisfied_surfaces || []);
const sourceStatuses = Array.isArray(index?.source_reports)
  ? index.source_reports.map((source) => source.status)
  : [];

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "status pass", report?.status === "pass", { status: report?.status });
addCheck(checks, "no new local generation", report?.new_local_model_execution === false
  && report?.new_local_generation_calls === 0, {});
addCheck(checks, "total autopilot call count bounded", report?.total_autopilot_local_generation_calls === 6
  && index?.total_autopilot_local_generation_calls === 6, {
  report_calls: report?.total_autopilot_local_generation_calls,
  index_calls: index?.total_autopilot_local_generation_calls
});
addCheck(checks, "required source surfaces satisfied", REQUIRED_SURFACES.every((surface) => satisfied.has(surface))
  && sourceStatuses.length === REQUIRED_SURFACES.length
  && sourceStatuses.every((status) => status === "pass"), {
  satisfied_surfaces: report?.satisfied_surfaces,
  source_statuses: sourceStatuses
});
addCheck(checks, "raw request/response not stored", report?.raw_request_stored === false
  && report?.raw_response_stored === false, {});
addCheck(checks, "secrets not logged", report?.secrets_logged === false, {});
addCheck(checks, "protected paths unmodified", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, {});
addCheck(checks, "remaining gaps recorded", gapStatus(gaps, "local_redteam_coverage") === "missing"
  && ["blocked_by_missing_node_modules", "available_not_executed"].includes(gapStatus(gaps, "adapter_conformance_dependency_backed_validation"))
  && gapStatus(gaps, "owner_final_decision") === "required", { gaps });
addCheck(checks, "final gate not open", report?.can_enter_local_model_verification_final_gate === false, {});
addCheck(checks, "final gate preflight open", report?.can_enter_local_model_verification_final_gate_preflight === true, {});
addCheck(checks, "owner decision still required", report?.owner_decision_required === true, {});
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
    "evals/reports/local_model_verification_evidence_bundle_check_report.json",
    "evals/reports/local_model_verification_evidence_bundle_check_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, { matches: blockedMatches });

const failed = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  can_proceed_to_final_gate_preflight: failed.length === 0
    && report?.can_enter_local_model_verification_final_gate_preflight === true,
  can_enter_final_gate: report?.can_enter_local_model_verification_final_gate === true,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# Local Model Verification Evidence Bundle Check

Status: ${gate.status}

- Stage: ${STAGE}
- Can proceed to final gate preflight: ${gate.can_proceed_to_final_gate_preflight}
- Can enter final gate: ${gate.can_enter_final_gate}
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_evidence_bundle_check_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_evidence_bundle_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
