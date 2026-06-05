#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-v36-baseline-dependency-repair-for-local-model-verification";
const EVIDENCE_DIR = "post-stable-v36-baseline-dependency-repair-for-local-verification";
const REQUIRED_EVIDENCE = [
  "current_compare_v36_failure_snapshot.json",
  "v36_mismatch_inventory_for_local_verification.json",
  "v36_hash_source_comparison_for_local_verification.json",
  "previous_owner_approved_refresh_comparison.json",
  "v36_git_guardrail_status.json",
  "compare_script_path_cwd_analysis.json",
  "local_verification_gate_dependency_status.json",
  "local_model_verification_owner_packet_status_after_v36_triage.json",
  "v36_baseline_local_verification_decision_request.json",
  "v36_baseline_dependency_for_local_verification_gate_report.json",
  "unresolved_items.json"
];
const REQUIRED_FILES = [
  "release/post_stable_v36_baseline_dependency_repair_for_local_verification_scope.yaml",
  "release/post_stable_v36_baseline_local_verification_blocker_update.yaml",
  "release/post_stable_v36_baseline_local_verification_decision_request.yaml",
  "tools/triage_v36_baseline_dependency_for_local_verification.mjs",
  "tools/check_v36_baseline_dependency_for_local_verification.mjs",
  "evals/suites/post_stable_v36_baseline_dependency_repair_for_local_verification.yaml",
  "evals/reports/v36_baseline_dependency_for_local_verification_report.json",
  "evals/reports/v36_baseline_dependency_for_local_verification_report.md",
  "evals/reports/v36_baseline_dependency_for_local_verification_gate_report.json",
  "evals/reports/v36_baseline_dependency_for_local_verification_gate_report.md",
  "docs/v36_baseline_dependency_for_local_verification.md",
  "docs/v36_baseline_local_verification_decision_request.md",
  "docs/next_local_model_verification_final_gate_plan.md"
];

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function existsRel(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, status: passed ? "pass" : "fail", detail });
}

function gitStatus() {
  const result = spawnSync("git", ["status", "--short", "--", "prompt-stack/v36", "dist", "harness-core/evidence/v36-baseline"], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const lines = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    exit_code: result.status,
    lines,
    v36_modified: lines.some((line) => line.includes("prompt-stack/v36")),
    dist_modified: lines.some((line) => line.includes("dist")),
    evidence_v36_baseline_modified: lines.some((line) => line.includes("harness-core/evidence/v36-baseline"))
  };
}

const checks = [];
for (const file of REQUIRED_EVIDENCE) {
  addCheck(checks, `evidence ${file} exists`, fs.existsSync(e(file)));
}
for (const relPath of REQUIRED_FILES) {
  addCheck(checks, `${relPath} exists`, existsRel(relPath));
}

const failure = readJsonIfExists(e("current_compare_v36_failure_snapshot.json"));
const mismatch = readJsonIfExists(e("v36_mismatch_inventory_for_local_verification.json"));
const hash = readJsonIfExists(e("v36_hash_source_comparison_for_local_verification.json"));
const previous = readJsonIfExists(e("previous_owner_approved_refresh_comparison.json"));
const guardrail = readJsonIfExists(e("v36_git_guardrail_status.json"));
const pathCwd = readJsonIfExists(e("compare_script_path_cwd_analysis.json"));
const dependency = readJsonIfExists(e("local_verification_gate_dependency_status.json"));
const owner = readJsonIfExists(e("local_model_verification_owner_packet_status_after_v36_triage.json"));
const decision = readJsonIfExists(e("v36_baseline_local_verification_decision_request.json"));
const gate = readJsonIfExists(e("v36_baseline_dependency_for_local_verification_gate_report.json"));
const unresolved = readJsonIfExists(e("unresolved_items.json")) || [];
const refresh = readJsonIfExists(e("v36_baseline_refresh_after_owner_approval_for_local_verification.json"));
const approvedRefresh = refresh?.status === "pass"
  && refresh?.approval_phrase_verified === true
  && refresh?.baseline_refresh_performed === true
  && refresh?.v36_modified === false
  && refresh?.dist_modified === false;
const status = gitStatus();

addCheck(checks, "current compare failure snapshot captured",
  failure?.source_check === "compare_v36_baseline.mjs"
    && failure?.captured_at_stage === STAGE
    && typeof failure?.current_snapshot_mismatch_count === "number"
    && typeof failure?.unapproved_existing_record_mismatches === "number", failure || {});
addCheck(checks, "mismatch inventory recorded",
  mismatch?.stage === STAGE
    && typeof mismatch?.mismatch_count === "number"
    && Array.isArray(mismatch?.mismatch_paths), {
  mismatch_count: mismatch?.mismatch_count
});
addCheck(checks, "hash source comparison recorded",
  hash?.stage === STAGE
    && hash?.status === "recorded"
    && [
      "requires_owner_decision",
      "compare_script_path_issue",
      "baseline_snapshot_stale_candidate",
      "baseline_dependency_restored_after_owner_approved_refresh"
    ].includes(hash?.interpretation), {
  interpretation: hash?.interpretation
});
addCheck(checks, "previous owner approved refresh comparison recorded",
  ["pass", "mismatch", "missing_evidence"].includes(previous?.status)
    && typeof previous?.previous_refresh_evidence_exists === "boolean", {
  status: previous?.status
});
addCheck(checks, "guardrail status clean",
  guardrail?.prompt_stack_v36_dirty === false
    && guardrail?.dist_dirty === false
    && (guardrail?.new_refresh_performed_in_this_stage === false || approvedRefresh)
    && status.v36_modified === false
    && status.dist_modified === false
    && (status.evidence_v36_baseline_modified === false || approvedRefresh), {
  git_status_lines: status.lines
});
addCheck(checks, "compare script path/cwd analysis clean",
  pathCwd?.stage === STAGE
    && pathCwd?.path_resolution_consistent === true
    && pathCwd?.script_side_effect_free === true
    && pathCwd?.protected_baseline_write_detected === false, pathCwd || {});
addCheck(checks, "local verification dependency status recorded",
  ["blocked_by_v36_baseline_dependency", "ready_after_repair"].includes(dependency?.status)
    && dependency?.local_model_verified_allowed === false
    && dependency?.provider_diverse_allowed === false
    && dependency?.provider_verified_allowed === false
    && dependency?.adapter_checked_allowed === false, dependency || {});
addCheck(checks, "owner packet status after triage recorded",
  ["blocked_by_v36_baseline_dependency", "ready_after_repair"].includes(owner?.status)
    && owner?.local_model_verified_allowed === false, owner || {});
const baselineDependencyResolved = ["pass", "ready_after_repair"].includes(gate?.status);
addCheck(checks, "decision request recorded when blocked",
  baselineDependencyResolved
    ? decision?.status === "not_required"
    : decision?.status === "owner_decision_required", {
  gate_status: gate?.status,
  decision_status: decision?.status
});
addCheck(checks, "forbidden execution and strong claims remain false",
  gate?.can_claim_local_model_verified === false
    && gate?.local_model_generation !== true
    && gate?.telemetry_sink_write !== true
    && gate?.openai_model_api_call !== true
    && dependency?.local_model_verified_allowed === false
    && dependency?.provider_diverse_allowed === false
    && dependency?.provider_verified_allowed === false
    && dependency?.adapter_checked_allowed === false, {
  gate: gate || {},
  dependency: dependency || {}
});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/v36_baseline_dependency_for_local_verification_gate_report.json",
    "evals/reports/v36_baseline_dependency_for_local_verification_gate_report.md"
  ]
});
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });

const failed = checks.filter((check) => check.status !== "pass");
const gateStatus = failed.length === 0
  ? dependency?.status || gate?.status || "blocked_by_v36_baseline_dependency"
  : "fail";
const gateReport = {
  status: gateStatus,
  stage: STAGE,
  compare_v36_baseline_status: dependency?.compare_v36_baseline_status || failure?.status || "missing",
  owner_decision_required: decision?.status === "owner_decision_required",
  ready_for_owner_decision_to_claim_local_model_verified: dependency?.ready_for_owner_decision_to_claim_local_model_verified === true,
  can_claim_local_model_verified: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  reason: gate?.reason || "Local verification evidence is ready except for v36 baseline dependency.",
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  failures: failed
};

writeJson(e("v36_baseline_dependency_for_local_verification_gate_report.json"), gateReport);
writeJson(p("evals", "reports", "v36_baseline_dependency_for_local_verification_gate_report.json"), gateReport);
writeText(p("evals", "reports", "v36_baseline_dependency_for_local_verification_gate_report.md"), `# V36 Baseline Dependency Gate For Local Verification

Status: ${gateReport.status}

- Compare status: ${gateReport.compare_v36_baseline_status}
- Owner decision required: ${gateReport.owner_decision_required}
- Ready for owner decision: ${gateReport.ready_for_owner_decision_to_claim_local_model_verified}
- Can claim local model verified: false
- Unresolved items: ${gateReport.unresolved_items_count}

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
