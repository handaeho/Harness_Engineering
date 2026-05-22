#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { scanClaims } from "./lib/claim_scanner.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-beta-release-gate-thresholds-and-dry-run";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-release-gate-dry-run");

const claimsAllowed = [
  "release-gate-thresholds-drafted",
  "release-gate-dry-run-executed",
  "release-blockers-prioritized",
  "owner-action-matrix-drafted",
  "rollback-plan-drafted",
  "release-decision-record-drafted"
];
const claimsBlocked = [
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "containment-verified",
  "telemetry-connected",
  "benchmark-backed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const bundleGate = readIfExists("evidence/beta-release-evidence-bundle/beta_release_evidence_bundle_gate_report.json");
const thresholds = readIfExists("evidence/beta-release-gate-dry-run/release_gate_thresholds.json");
const dryRun = readIfExists("evidence/beta-release-gate-dry-run/release_gate_dry_run_report.json");
const blockerAudit = readIfExists("evidence/beta-release-gate-dry-run/release_blocker_audit.json");
const coverage = readIfExists("evidence/beta-release-gate-dry-run/release_threshold_coverage.json");
const ownerAction = readIfExists("evidence/beta-release-gate-dry-run/owner_action_matrix.json");
const rollback = readIfExists("evidence/beta-release-gate-dry-run/rollback_plan_draft.json");
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "compare_v36_baseline.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_beta_release_evidence_bundle.mjs pass", bundleGate?.status === "pass", {
  status: bundleGate?.status || "missing"
});
for (const relPath of [
  "release/release_gate_thresholds.yaml",
  "evidence/beta-release-gate-dry-run/release_gate_dry_run_report.json",
  "evidence/beta-release-gate-dry-run/release_blocker_audit.json",
  "evidence/beta-release-gate-dry-run/release_threshold_coverage.json",
  "evidence/beta-release-gate-dry-run/owner_action_matrix.json",
  "evidence/beta-release-gate-dry-run/rollback_plan_draft.json",
  "evidence/beta-release-gate-dry-run/release_decision_record_draft.md"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}
addCheck(checks, "thresholds report pass", thresholds?.status === "pass", { status: thresholds?.status || "missing" });
addCheck(checks, "dry-run status is blocked_not_release_gated", dryRun?.status === "blocked_not_release_gated", {
  status: dryRun?.status || "missing",
  release_gate_dry_run_status: dryRun?.release_gate_dry_run_status
});
addCheck(checks, "no new provider execution", dryRun?.new_provider_execution === false, {
  new_provider_execution: dryRun?.new_provider_execution
});
addCheck(checks, "local_model_execution is false", dryRun?.local_model_execution === false, {
  local_model_execution: dryRun?.local_model_execution
});
addCheck(checks, "local_endpoint_probe is false", dryRun?.local_endpoint_probe === false, {
  local_endpoint_probe: dryRun?.local_endpoint_probe
});
addCheck(checks, "dist_modified is false", dryRun?.dist_modified === false && distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: dryRun?.dist_modified,
  dist_files: distFiles
});
addCheck(checks, "release_gate_passed is false", dryRun?.release_gate_passed === false, {
  release_gate_passed: dryRun?.release_gate_passed
});
addCheck(checks, "production_ready is false", dryRun?.production_ready === false, {
  production_ready: dryRun?.production_ready
});
addCheck(checks, "provider_diversity_established is false", dryRun?.provider_diversity_established === false, {
  provider_diversity_established: dryRun?.provider_diversity_established
});
addCheck(checks, "local_model_execution_verified is false", dryRun?.local_model_execution_verified === false, {
  local_model_execution_verified: dryRun?.local_model_execution_verified
});
addCheck(checks, "expected gate statuses", dryRun?.gates?.beta_evidence_integrity === "pass"
  && dryRun?.gates?.openai_canary_suite === "pass"
  && dryRun?.gates?.release_gate_eligibility === "blocked"
  && dryRun?.gates?.production_readiness === "blocked"
  && dryRun?.gates?.local_runtime_readiness === "blocked", dryRun?.gates || {});
addCheck(checks, "blockers prioritized", blockerAudit?.status === "pass"
  && blockerAudit?.p0_blocker_count === 3
  && blockerAudit?.p1_blocker_count === 2, {
  status: blockerAudit?.status || "missing",
  blocker_count: blockerAudit?.blocker_count,
  p0_blocker_count: blockerAudit?.p0_blocker_count,
  p1_blocker_count: blockerAudit?.p1_blocker_count
});
addCheck(checks, "threshold coverage partial", coverage?.status === "partial"
  && coverage?.overall_release_gate === "blocked_not_release_gated", {
  status: coverage?.status || "missing",
  overall_release_gate: coverage?.overall_release_gate
});
addCheck(checks, "owner action and rollback draft", ownerAction?.status === "draft" && rollback?.status === "draft", {
  owner_action_matrix_status: ownerAction?.status,
  rollback_plan_draft_status: rollback?.status
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "v36 modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_v36_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : "pass";
const report = {
  status,
  stage: STAGE,
  release_gate_dry_run_status: dryRun?.release_gate_dry_run_status || "missing",
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_provider_diversity_claim: false,
  can_enter_replay_verified_claim: false,
  reason: status === "pass"
    ? "Release gate dry-run completed, but required release blockers remain open."
    : "One or more release gate dry-run checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# Release Gate Dry-run Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Release gate dry-run status: ${report.release_gate_dry_run_status}
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider diversity claim: false
- Can enter replay-verified claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "release_gate_dry_run_gate_report.json"), report);
writeJson(p("evals", "reports", "release_gate_dry_run_gate_report.json"), report);
writeText(p("evals", "reports", "release_gate_dry_run_gate_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "RGD-001",
    severity: "high",
    description: "One or more required release gate dry-run artifacts are missing.",
    blocks_release_gate_dry_run: true,
    owner: "agent",
    recommended_next_action: "Regenerate release gate dry-run artifacts and rerun check_release_gate_dry_run.mjs."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
