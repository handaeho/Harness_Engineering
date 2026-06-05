#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verification-final-gate-preflight";
const EVIDENCE_DIR = "post-stable-local-model-verification-final-gate-preflight";
const EXPECTED_STATUS = "ready_for_owner_decision_to_claim_local_model_verified";
const REQUIRED = [
  "local_model_verification_final_gate_preflight_report.json",
  "local_model_verification_final_gate_preconditions.json",
  "local_model_verification_final_gate_claim_boundary.json",
  "local_model_verification_final_gate_blocker_update.json",
  "local_model_verification_final_gate_gate_report.json",
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
addCheck(
  checks,
  "release scope exists",
  fs.existsSync(p("release", "post_stable_local_model_verification_final_gate_preflight_scope.yaml")),
  {}
);
addCheck(
  checks,
  "eval suite exists",
  fs.existsSync(p("evals", "suites", "post_stable_local_model_verification_final_gate_preflight.yaml")),
  {}
);

const report = fs.existsSync(e("local_model_verification_final_gate_preflight_report.json"))
  ? readJson(e("local_model_verification_final_gate_preflight_report.json"))
  : null;
const preconditions = fs.existsSync(e("local_model_verification_final_gate_preconditions.json"))
  ? readJson(e("local_model_verification_final_gate_preconditions.json"))
  : [];
const boundary = fs.existsSync(e("local_model_verification_final_gate_claim_boundary.json"))
  ? readJson(e("local_model_verification_final_gate_claim_boundary.json"))
  : null;
const blocker = fs.existsSync(e("local_model_verification_final_gate_blocker_update.json"))
  ? readJson(e("local_model_verification_final_gate_blocker_update.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

const preconditionIds = new Set(Array.isArray(preconditions) ? preconditions.map((item) => item.id) : []);
const blockedBy = new Set(report?.blocked_by || []);

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "expected owner-decision-ready status recorded", report?.status === EXPECTED_STATUS, { status: report?.status });
addCheck(checks, "no new local generation", report?.new_local_model_execution === false
  && report?.new_local_generation_calls === 0
  && report?.total_autopilot_local_generation_calls === 6, {
  calls: report?.new_local_generation_calls,
  total_calls: report?.total_autopilot_local_generation_calls
});
addCheck(checks, "no external side-effect surfaces", report?.openai_model_api_call === false
  && report?.telemetry_sink_write === false
  && report?.final_gate_executed === false, {});
addCheck(checks, "source bundle passed", report?.source_evidence_bundle_status === "pass", {});
addCheck(checks, "only owner decision blocker remains", blockedBy.has("owner_final_decision")
  && !blockedBy.has("local_redteam_coverage")
  && !blockedBy.has("adapter_conformance_dependency_backed_validation")
  && !blockedBy.has("reference_baseline_dependency_restored"), { blocked_by: report?.blocked_by });
addCheck(checks, "preconditions recorded", preconditionIds.has("evidence_bundle_draft_passed")
  && preconditionIds.has("local_redteam_coverage")
  && preconditionIds.has("adapter_conformance_dependency_backed_validation")
  && preconditionIds.has("reference_baseline_dependency_restored")
  && preconditionIds.has("owner_final_decision")
  && preconditionIds.has("raw_storage_absent")
  && preconditionIds.has("protected_paths_unmodified"), { preconditions: [...preconditionIds] });
addCheck(checks, "local redteam and adapter preconditions passed", Array.isArray(preconditions)
  && preconditions.find((item) => item.id === "local_redteam_coverage")?.status === "pass"
  && preconditions.find((item) => item.id === "adapter_conformance_dependency_backed_validation")?.status === "pass"
  && preconditions.find((item) => item.id === "reference_baseline_dependency_restored")?.status === "pass", {
  preconditions
});
addCheck(checks, "final gate remains closed", report?.can_enter_local_model_verification_final_gate === false, {});
addCheck(checks, "owner decision still required", report?.owner_decision_required === true, {});
addCheck(checks, "raw request/response not stored", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && report?.secrets_logged === false, {});
addCheck(checks, "protected paths unmodified or owner-approved baseline refresh recorded", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && (
    report?.evidence_reference_baseline_modified === false
      || report?.evidence_reference_baseline_modified_by_owner_approved_refresh === true
  ), {
  evidence_reference_baseline_modified: report?.evidence_reference_baseline_modified,
  evidence_reference_baseline_modified_by_owner_approved_refresh: report?.evidence_reference_baseline_modified_by_owner_approved_refresh
});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false, boundary || {});
addCheck(checks, "blocker update preserves owner-decision-ready state", blocker?.new_status === EXPECTED_STATUS
  && Array.isArray(blocker?.blocked_by)
  && blocker.blocked_by.includes("owner_final_decision")
  && !blocker.blocked_by.includes("local_redteam_coverage")
  && !blocker.blocked_by.includes("adapter_conformance_dependency_backed_validation")
  && !blocker.blocked_by.includes("reference_baseline_dependency_restored"), blocker || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/local_model_verification_final_gate_preflight_check_report.json",
    "evals/reports/local_model_verification_final_gate_preflight_check_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, { matches: blockedMatches });

const failed = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  expected_preflight_status: EXPECTED_STATUS,
  observed_preflight_status: report?.status,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  can_enter_final_gate: false,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};

const md = `# Local Model Verification Final Gate Preflight Check

Status: ${gate.status}

- Stage: ${STAGE}
- Expected preflight status: ${gate.expected_preflight_status}
- Observed preflight status: ${gate.observed_preflight_status}
- Can enter final gate: false
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "local_model_verification_final_gate_preflight_check_report.json"), gate);
writeText(p("evals", "reports", "local_model_verification_final_gate_preflight_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
