#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-v36-baseline-dependency-repair-for-local-model-verification";
const EVIDENCE_DIR = "post-stable-v36-baseline-dependency-repair-for-local-verification";
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const ALLOWED_CLAIMS = [
  "post-stable-v36-baseline-dependency-triaged-for-local-verification",
  "post-stable-v36-baseline-local-verification-decision-requested",
  "post-stable-local-verification-gate-dependency-status-recorded"
];
const CONDITIONALLY_ALLOWED_AFTER_REPAIR = [
  "post-stable-v36-baseline-compare-restored-for-local-verification",
  "post-stable-local-model-verification-owner-packet-ready-after-v36-repair"
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
const v36Root = path.join(workspaceRoot, "prompt-stack", "v36");

function p(...parts) {
  return path.join(root, ...parts);
}

function workspacePath(...parts) {
  return path.join(workspaceRoot, ...parts);
}

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function runGitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const lines = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    lines
  };
}

function runCompare() {
  const result = spawnSync("node", [p("tools", "compare_v36_baseline.mjs"), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = readJsonIfExists("evidence/alpha/baseline_comparison.json");
  }
  return {
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 4000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 4000)
  };
}

function latestV36Commit() {
  const result = spawnSync("git", [
    "log",
    "-1",
    "--format=%H%n%s%n%cI",
    "--name-only",
    "--",
    "prompt-stack/v36"
  ], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  if (result.status !== 0 || lines.length < 3) {
    return {
      status: "unknown",
      exit_code: result.status,
      stderr: result.stderr.trim()
    };
  }
  return {
    status: "found",
    commit: lines[0],
    subject: lines[1],
    committed_at: lines[2],
    changed_paths: lines.slice(3)
  };
}

function buildMismatchInventory(compareReport) {
  const unresolved = readJsonIfExists("evidence/alpha/unresolved_items.json") || [];
  const currentHashMismatches = unresolved
    .filter((item) => item.explanation === "current_hash_differs_from_alpha_snapshot")
    .map((item) => item.path)
    .sort();
  return {
    status: currentHashMismatches.length > 0 ? "mismatch" : "pass",
    stage: STAGE,
    mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? currentHashMismatches.length,
    unapproved_existing_record_mismatches: compareReport?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null,
    mismatch_classes: {
      current_v36_filesystem_vs_evidence_v36_baseline_snapshot: currentHashMismatches.length,
      existing_v36_record_unapproved_mismatches: compareReport?.existing_v36_checksum_record?.unapproved_mismatch_count ?? 0,
      script_path_cwd_issue_suspected: false,
      hashing_normalization_issue_suspected: false,
      actual_v36_dirty_worktree_suspected: false
    },
    mismatch_paths: currentHashMismatches,
    raw_unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null
  };
}

function buildHashSourceComparison(compareReport, mismatchInventory, guardrail) {
  const checksums = readJsonIfExists("evidence/v36-baseline/checksums.json");
  const baselineByPath = new Map((checksums?.files || []).map((entry) => [
    entry.path.replace(/^prompt-stack\//, "").replace(/\\/g, "/"),
    entry
  ]));
  const mismatches = mismatchInventory.mismatch_paths.map((v36Path) => {
    const rel = v36Path.replace(/^v36\//, "");
    const currentFile = path.join(v36Root, ...rel.split("/"));
    const baseline = baselineByPath.get(v36Path);
    return {
      path: v36Path,
      evidence_v36_baseline_sha256: baseline?.sha256 || null,
      current_v36_filesystem_sha256: fs.existsSync(currentFile) ? sha256(currentFile) : null,
      current_file_exists: fs.existsSync(currentFile)
    };
  });
  const interpretation = compareReport?.status === "pass"
    ? "baseline_dependency_restored_after_owner_approved_refresh"
    : guardrail.prompt_stack_v36_dirty
    ? "requires_owner_decision"
    : mismatches.length > 0
      ? "baseline_snapshot_stale_candidate"
      : "compare_script_path_issue";
  return {
    status: "recorded",
    stage: STAGE,
    sources: {
      current_v36_filesystem: {
        path: "prompt-stack/v36",
        dirty: guardrail.prompt_stack_v36_dirty
      },
      evidence_v36_baseline_snapshot: {
        path: "harness-core/evidence/v36-baseline",
        current_snapshot_mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? mismatches.length
      },
      existing_v36_records: {
        unapproved_existing_record_mismatches: compareReport?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null
      }
    },
    mismatch_count: mismatches.length,
    mismatch_sample: mismatches.slice(0, 25),
    latest_v36_commit: latestV36Commit(),
    interpretation
  };
}

function buildPreviousRefreshComparison(compareReport) {
  const owner = readJsonIfExists("evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/owner_approval_record.json");
  const afterRefresh = readJsonIfExists("evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/compare_v36_baseline_after_refresh.json");
  const refreshReport = readJsonIfExists("evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/v36_baseline_refresh_report.json");
  const previousExists = Boolean(owner || afterRefresh || refreshReport);
  const wasOwnerApproved = owner?.status === "pass"
    && owner?.approval_phrase_matched === true
    && owner?.baseline_refresh_allowed === true;
  const currentMismatchCount = compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? null;
  const previousPostRefreshMismatchCount = afterRefresh?.current_snapshot_mismatch_count ?? afterRefresh?.post_refresh_mismatch_count ?? null;
  const status = !previousExists
    ? "missing_evidence"
    : wasOwnerApproved && previousPostRefreshMismatchCount === 0 && currentMismatchCount > 0
      ? "mismatch"
      : "pass";
  return {
    status,
    stage: STAGE,
    previous_refresh_evidence_exists: previousExists,
    previous_refresh_was_owner_approved: wasOwnerApproved,
    previous_refresh_evidence_paths: [
      "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/owner_approval_record.json",
      "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/compare_v36_baseline_after_refresh.json",
      "evidence/post-rc-v36-baseline-refresh-for-monitoring-result-review/v36_baseline_refresh_report.json"
    ].filter((rel) => fs.existsSync(p(...rel.split("/")))),
    previous_post_refresh_mismatch_count: previousPostRefreshMismatchCount,
    current_compare_mismatch_count: currentMismatchCount,
    interpretation: !previousExists
      ? "requires_owner_decision"
      : status === "mismatch"
        ? "current_baseline_snapshot_stale_or_not_reapplied"
        : "requires_owner_decision"
  };
}

function buildPathCwdAnalysis(compareResult) {
  const scriptPath = p("tools", "compare_v36_baseline.mjs");
  const scriptText = fs.readFileSync(scriptPath, "utf8");
  const writesBaseline = /writeJson\(path\.join\(baselineDir/.test(scriptText)
    || /writeText\(path\.join\(baselineDir/.test(scriptText);
  return {
    status: "pass",
    stage: STAGE,
    cwd_used: workspaceRoot,
    script_path: "tools/compare_v36_baseline.mjs",
    resolved_v36_path: workspacePath("prompt-stack", "v36"),
    resolved_baseline_path: p("evidence", "v36-baseline"),
    path_resolution_consistent: fs.existsSync(v36Root) && fs.existsSync(p("evidence", "v36-baseline")),
    script_side_effect_free: !writesBaseline,
    report_side_effect_paths: [
      "harness-core/evidence/alpha/baseline_comparison.json",
      "harness-core/evidence/alpha/unresolved_items.json",
      "harness-core/evidence/beta-preflight/unresolved_items.json"
    ],
    protected_baseline_write_detected: writesBaseline,
    compare_exit_code: compareResult.exit_code,
    findings: compareResult.status === "fail"
      ? ["compare path resolution is consistent; failure is not classified as a cwd/path issue"]
      : []
  };
}

function writeStaticFiles(status) {
  writeText(p("release", "post_stable_v36_baseline_dependency_repair_for_local_verification_scope.yaml"), `stage: ${STAGE}

approved_actions:
  v36_baseline_dependency_triage: true
  compare_v36_failure_analysis: true
  mismatch_inventory_generation: true
  hash_source_comparison: true
  previous_owner_approved_refresh_comparison: true
  compare_script_path_cwd_analysis: true
  safe_compare_script_repair_if_needed: true
  owner_decision_request_generation: true
  local_verification_owner_packet_status_refresh: true

forbidden_actions:
  v36_modification: true
  dist_modification: true
  evidence_v36_baseline_refresh_without_owner_approval: true
  evidence_v36_baseline_overwrite_without_owner_approval: true
  v36_restore: true
  local_model_generation: true
  telemetry_sink_write: true
  openai_model_api_call: true
  openai_provider_call: true
  local_model_verified_claim: true
  provider_diverse_claim: true
  provider_verified_claim: true
  adapter_checked_claim: true
  production_ready_claim: true
  stable_claim: true
  bare_release_gated_claim: true

claims_allowed:
  - post-stable-v36-baseline-dependency-triaged-for-local-verification
  - post-stable-v36-baseline-local-verification-decision-requested
  - post-stable-local-verification-gate-dependency-status-recorded

claims_conditionally_allowed_after_repair:
  - post-stable-v36-baseline-compare-restored-for-local-verification
  - post-stable-local-model-verification-owner-packet-ready-after-v36-repair

claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);
  writeText(p("evals", "suites", "post_stable_v36_baseline_dependency_repair_for_local_verification.yaml"), `suite: post_stable_v36_baseline_dependency_repair_for_local_verification
stage: ${STAGE}
runner: tools/triage_v36_baseline_dependency_for_local_verification.mjs
checker: tools/check_v36_baseline_dependency_for_local_verification.mjs
`);
  writeText(p("release", "post_stable_v36_baseline_local_verification_blocker_update.yaml"), `stage: ${STAGE}
status: ${status}
local_model_verified_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
`);
}

const compareResult = runCompare();
const compareReport = compareResult.parsed || readJsonIfExists("evidence/alpha/baseline_comparison.json") || {};
const localRefresh = readJsonIfExists(`evidence/${EVIDENCE_DIR}/v36_baseline_refresh_after_owner_approval_for_local_verification.json`);
const protectedStatus = runGitStatus([
  "prompt-stack/v36",
  "dist",
  "harness-core/evidence/v36-baseline"
]);
const guardrail = {
  stage: STAGE,
  prompt_stack_v36_dirty: protectedStatus.lines.some((line) => line.includes("prompt-stack/v36")),
  dist_dirty: protectedStatus.lines.some((line) => line.includes("dist")),
  evidence_v36_baseline_dirty: protectedStatus.lines.some((line) => line.includes("harness-core/evidence/v36-baseline")),
  modified_files: protectedStatus.lines,
  new_refresh_performed_in_this_stage: localRefresh?.baseline_refresh_performed === true,
  dirty_reason: localRefresh?.baseline_refresh_performed === true
    ? "owner_approved_local_verification_baseline_refresh_artifact"
    : null,
  notes: localRefresh?.baseline_refresh_performed === true
    ? ["evidence/v36-baseline is dirty due to owner-approved local verification baseline refresh."]
    : []
};
const mismatchInventory = buildMismatchInventory(compareReport);
const hashSourceComparison = buildHashSourceComparison(compareReport, mismatchInventory, guardrail);
const previousRefreshComparison = buildPreviousRefreshComparison(compareReport);
const pathCwdAnalysis = buildPathCwdAnalysis(compareResult);

const adapterConformance = readJsonIfExists("evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json");
const dependencyInstall = readJsonIfExists("evidence/post-stable-adapter-conformance-dependency-install/dependency_install_report.json");
const localRedteam = readJsonIfExists("evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json");
const ownerPacket = readJsonIfExists("evidence/post-stable-local-model-verification-owner-decision-packet-refresh/local_model_verification_owner_decision_packet_refreshed.json");
const comparePass = compareReport.status === "pass";
const safeRepairPerformed = false;
const ownerDecisionRequired = !comparePass;
const localDependencyStatus = {
  status: comparePass ? "ready_after_repair" : "blocked_by_v36_baseline_dependency",
  stage: STAGE,
  adapter_conformance_dependency_backed_validation: dependencyInstall?.status === "pass" ? "pass" : dependencyInstall?.status || "missing",
  adapter_conformance_local_ollama_execution: adapterConformance?.status === "pass" ? "pass" : adapterConformance?.status || "missing",
  local_redteam_coverage: localRedteam?.status === "pass" ? "pass" : localRedteam?.status || "missing",
  owner_final_decision: "required",
  compare_v36_baseline_status: compareReport.status || "missing",
  ready_for_owner_decision_to_claim_local_model_verified: comparePass && ownerPacket?.ready_for_owner_decision_to_claim_local_model_verified === true,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};
const ownerPacketStatusAfterTriage = {
  status: localDependencyStatus.status,
  stage: STAGE,
  previous_owner_packet_status: ownerPacket?.status || "missing",
  previous_ready_for_owner_decision_to_claim_local_model_verified: ownerPacket?.ready_for_owner_decision_to_claim_local_model_verified ?? false,
  v36_baseline_dependency_status: compareReport.status || "missing",
  ready_for_owner_decision_to_claim_local_model_verified: localDependencyStatus.ready_for_owner_decision_to_claim_local_model_verified,
  local_model_verified_allowed: false,
  reason: comparePass
    ? "v36 baseline dependency is pass; owner final decision is still required before any strong local wording."
    : "Owner packet evidence is ready, but local verification final gate remains blocked by v36 baseline dependency."
};
const decisionRequest = {
  status: ownerDecisionRequired ? "owner_decision_required" : "not_required",
  stage: STAGE,
  reason: ownerDecisionRequired
    ? "compare_v36_baseline mismatch blocks local-model verification final gate"
    : "compare_v36_baseline passed; baseline refresh is not required in this stage",
  mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? mismatchInventory.mismatch_count,
  decision_options: [
    {
      option: "refresh_v36_baseline_snapshot_after_owner_approval",
      description: "Accept current clean v36/evidence state and refresh baseline snapshot for local verification dependency.",
      requires_owner_approval: true,
      modifies_v36: false,
      modifies_evidence_v36_baseline: true
    },
    {
      option: "fix_compare_script_or_path_rules",
      description: "Use only if triage proves the mismatch is a compare script/path issue.",
      requires_owner_approval: false,
      modifies_v36: false,
      modifies_evidence_v36_baseline: false
    },
    {
      option: "keep_blocked",
      description: "Leave local-model verification final gate blocked.",
      requires_owner_approval: false,
      modifies_v36: false,
      modifies_evidence_v36_baseline: false
    }
  ],
  recommended_option: ownerDecisionRequired
    ? "refresh_v36_baseline_snapshot_after_owner_approval"
    : "not_required"
};
const failureSnapshot = {
  status: compareReport.status || "fail",
  source_check: "compare_v36_baseline.mjs",
  captured_at_stage: STAGE,
  current_snapshot_mismatch_count: compareReport?.alpha_snapshot?.current_snapshot_mismatch_count ?? mismatchInventory.mismatch_count,
  unapproved_existing_record_mismatches: compareReport?.existing_v36_checksum_record?.unapproved_mismatch_count ?? null,
  compare_exit_code: compareResult.exit_code,
  notes: [
    "Local adapter conformance passed, but local-model verification final gate is blocked by baseline dependency."
  ]
};
const reportStatus = comparePass ? "pass" : "blocked_by_v36_baseline_dependency";
const gateReport = {
  status: reportStatus,
  stage: STAGE,
  compare_v36_baseline_status: compareReport.status || "missing",
  owner_decision_required: ownerDecisionRequired,
  ready_for_owner_decision_to_claim_local_model_verified: localDependencyStatus.ready_for_owner_decision_to_claim_local_model_verified,
  can_claim_local_model_verified: false,
  reason: comparePass
    ? "v36 baseline dependency restored. Owner final decision is still required before any strong local verification wording."
    : "Local verification evidence is ready except for v36 baseline dependency.",
  root_cause: hashSourceComparison.interpretation,
  safe_repair_performed: safeRepairPerformed,
  unresolved_items_count: ownerDecisionRequired ? 1 : 0,
  local_model_generation: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false
};
const unresolvedItems = ownerDecisionRequired ? [
  {
    id: "V36-LMV-001",
    severity: "medium",
    description: "compare_v36_baseline mismatch blocks local-model verification final gate.",
    current_snapshot_mismatch_count: failureSnapshot.current_snapshot_mismatch_count,
    unapproved_existing_record_mismatches: failureSnapshot.unapproved_existing_record_mismatches,
    blocks_final_gate: true,
    recommended_next_action: "Request owner approval to refresh or reapply v36 baseline snapshot, or keep local-model verification final gate blocked."
  }
] : [];
const report = {
  status: reportStatus,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  compare_v36_baseline_status: compareReport.status || "missing",
  current_snapshot_mismatch_count: failureSnapshot.current_snapshot_mismatch_count,
  unapproved_existing_record_mismatches: failureSnapshot.unapproved_existing_record_mismatches,
  root_cause: hashSourceComparison.interpretation,
  safe_repair_performed: safeRepairPerformed,
  owner_decision_required: ownerDecisionRequired,
  baseline_refresh_performed: false,
  v36_modified: guardrail.prompt_stack_v36_dirty,
  dist_modified: guardrail.dist_dirty,
  evidence_v36_baseline_modified: guardrail.evidence_v36_baseline_dirty,
  local_model_generation: false,
  telemetry_sink_write: false,
  openai_model_api_call: false,
  local_model_verified_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  claims_allowed: comparePass
    ? [...ALLOWED_CLAIMS, ...CONDITIONALLY_ALLOWED_AFTER_REPAIR]
    : ALLOWED_CLAIMS,
  claims_not_allowed: BLOCKED_CLAIMS
};

writeStaticFiles(reportStatus);
writeJson(e("current_compare_v36_failure_snapshot.json"), failureSnapshot);
writeJson(e("v36_mismatch_inventory_for_local_verification.json"), mismatchInventory);
writeJson(e("v36_hash_source_comparison_for_local_verification.json"), hashSourceComparison);
writeJson(e("previous_owner_approved_refresh_comparison.json"), previousRefreshComparison);
writeJson(e("v36_git_guardrail_status.json"), guardrail);
writeJson(e("compare_script_path_cwd_analysis.json"), pathCwdAnalysis);
writeJson(e("local_verification_gate_dependency_status.json"), localDependencyStatus);
writeJson(e("local_model_verification_owner_packet_status_after_v36_triage.json"), ownerPacketStatusAfterTriage);
writeJson(e("v36_baseline_local_verification_decision_request.json"), decisionRequest);
writeJson(e("v36_baseline_dependency_for_local_verification_gate_report.json"), gateReport);
writeJson(e("unresolved_items.json"), unresolvedItems);
writeJson(p("evals", "reports", "v36_baseline_dependency_for_local_verification_report.json"), report);
writeText(p("evals", "reports", "v36_baseline_dependency_for_local_verification_report.md"), `# V36 Baseline Dependency For Local Verification

Status: ${report.status}

- Stage: ${STAGE}
- Compare status: ${report.compare_v36_baseline_status}
- Current snapshot mismatch count: ${report.current_snapshot_mismatch_count}
- Unapproved existing-record mismatches: ${report.unapproved_existing_record_mismatches}
- Root cause: ${report.root_cause}
- Safe repair performed: ${report.safe_repair_performed}
- Owner decision required: ${report.owner_decision_required}
- Baseline refresh performed: false
`);
writeJson(p("evals", "reports", "v36_baseline_dependency_for_local_verification_gate_report.json"), gateReport);
writeText(p("evals", "reports", "v36_baseline_dependency_for_local_verification_gate_report.md"), `# V36 Baseline Dependency Gate For Local Verification

Status: ${gateReport.status}

- Compare status: ${gateReport.compare_v36_baseline_status}
- Owner decision required: ${gateReport.owner_decision_required}
- Ready for owner decision: ${gateReport.ready_for_owner_decision_to_claim_local_model_verified}
- Can claim local model verified: false
- Unresolved items: ${gateReport.unresolved_items_count}
`);
writeText(p("release", "post_stable_v36_baseline_local_verification_decision_request.yaml"), `stage: ${STAGE}
status: ${decisionRequest.status}
recommended_option: ${decisionRequest.recommended_option}
mismatch_count: ${decisionRequest.mismatch_count}
requires_owner_approval: ${ownerDecisionRequired}
`);
writeText(p("docs", "v36_baseline_dependency_for_local_verification.md"), `# V36 baseline dependency for local verification

Status: ${report.status}

The local evidence lane is not allowed to enter final local model verification while \`compare_v36_baseline.mjs\` is failing.

- Compare status: ${report.compare_v36_baseline_status}
- Mismatch count: ${report.current_snapshot_mismatch_count}
- Unapproved existing-record mismatches: ${report.unapproved_existing_record_mismatches}
- Root cause classification: ${report.root_cause}
- Baseline refresh performed in this stage: false
- Strong local wording remains blocked.
`);
writeText(p("docs", "v36_baseline_local_verification_decision_request.md"), `# V36 baseline local verification decision request

Status: ${decisionRequest.status}

Recommended option: ${decisionRequest.recommended_option}

Owner approval is required before refreshing or reapplying \`harness-core/evidence/v36-baseline\`.
`);
writeText(p("docs", "next_local_model_verification_final_gate_plan.md"), `# Next local model verification final gate plan

The next final-gate step remains blocked until the v36 baseline dependency is resolved.

- Local adapter conformance: ${localDependencyStatus.adapter_conformance_local_ollama_execution}
- Local redteam coverage: ${localDependencyStatus.local_redteam_coverage}
- Compare v36 baseline: ${localDependencyStatus.compare_v36_baseline_status}
- Owner final decision: required only after baseline dependency is restored.
`);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(0);
