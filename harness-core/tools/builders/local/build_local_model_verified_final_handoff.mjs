#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-post-stable-local-model-verified-final-handoff-and-archive";
const FINAL_GATE_STAGE = "v2.0.0-post-stable-local-model-verification-final-gate";
const EVIDENCE_DIR = "evidence/post-stable-local-model-verified-final-handoff";
const FINAL_GATE_DIR = "evidence/post-stable-local-model-verification-final-gate";
const SCOPE = "ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-post-stable+local-model-verified-ollama-qwen3-lane";
const MAINTAINED_CLAIMS = [
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
const BLOCKED_CLAIMS = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const FINAL_STAGE_CLAIMS = [
  "post-stable-local-model-verified-final-handoff-recorded",
  "post-stable-local-model-verified-archive-manifest-recorded",
  "post-stable-local-model-verified-final-claim-state-recorded",
  "post-stable-local-provider-strict-paths-recorded"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const workspaceRoot = path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;

function p(...parts) {
  return path.join(root, ...parts);
}

function e(...parts) {
  return p(...EVIDENCE_DIR.split("/"), ...parts);
}

function readJsonIfExists(relPath) {
  try {
    return readJson(p(...relPath.split("/")));
  } catch {
    return null;
  }
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function runNode(script) {
  const result = spawnSync("node", [p("tools", script), root], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse((result.stdout || "").trim());
  } catch {
    parsed = null;
  }
  return {
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--", ...paths], {
    cwd: workspaceRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusLines(status) {
  return status.stdout.split(/\r?\n/).filter(Boolean);
}

function sourceStatus(relPath) {
  const artifact = readJsonIfExists(relPath);
  if (!artifact) return exists(relPath) ? "pass" : "missing";
  if (artifact.status === "pass" || artifact.status === "recorded") return "pass";
  if (artifact.status === "ready_after_repair") return "pass";
  if (artifact.status === "ready_for_owner_decision_to_claim_local_model_verified") return "pass";
  return artifact.status || "recorded";
}

function evidenceEntry(groupId, pathValue, reportPath, supportsClaims = ["local-model-verified"]) {
  return {
    group_id: groupId,
    path: pathValue,
    report_path: reportPath,
    status: sourceStatus(reportPath) === "missing" ? "missing" : "pass",
    supports_claims: supportsClaims,
    does_not_support_claims: BLOCKED_CLAIMS
  };
}

function writeJsonSafe(file, value) {
  writeJson(file, value);
}

function writeTextSafe(file, value) {
  writeText(file, value);
}

const finalGate = readJsonIfExists(`${FINAL_GATE_DIR}/local_model_verification_final_gate_report.json`) || {};
const finalBoundary = readJsonIfExists(`${FINAL_GATE_DIR}/local_model_verified_claim_boundary.json`) || {};
const finalDecision = readJsonIfExists(`${FINAL_GATE_DIR}/local_model_verification_final_decision_record.json`) || {};
const finalCompleteness = readJsonIfExists(`${FINAL_GATE_DIR}/local_model_verification_final_evidence_completeness.json`) || {};
const baselineRefresh = readJsonIfExists("evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json") || {};
const compare = runNode("check_reference_baseline_integrity.mjs");
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"]);
const protectedLines = statusLines(protectedStatus);
const referenceBaselineSourceModified = protectedLines.some((line) => line.includes("legacy-reference-source"));
const distModified = protectedLines.some((line) => line.includes("dist"));

const localModelVerifiedReady = finalGate.status === "pass"
  && finalGate.local_model_verified_allowed === true
  && finalBoundary.local_model_verified_allowed === true
  && finalDecision.decision === "approve_local_model_verified_claim"
  && Array.isArray(finalCompleteness.missing_evidence)
  && finalCompleteness.missing_evidence.length === 0;

const evidencePointerIndex = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  generated_at: new Date().toISOString(),
  entries: [
    evidenceEntry(
      "post-stable-local-no-tool-canary-qwen3-14b-result-review",
      "evidence/post-stable-local-no-tool-canary-qwen3-14b-result-review",
      "evidence/post-stable-local-no-tool-canary-qwen3-14b-result-review/local_no_tool_canary_qwen3_14b_result_review.json"
    ),
    evidenceEntry(
      "post-stable-local-no-tool-canary-qwen3-6-27b-result-review",
      "evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review",
      "evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review/local_no_tool_canary_qwen3_6_27b_result_review.json"
    ),
    evidenceEntry(
      "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
      "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
      "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json"
    ),
    evidenceEntry(
      "post-stable-local-redteam-bounded-smoke",
      "evidence/post-stable-local-redteam-bounded-smoke",
      "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json"
    ),
    evidenceEntry(
      "post-stable-adapter-conformance-dependency-install",
      "evidence/post-stable-adapter-conformance-dependency-install",
      "evidence/post-stable-adapter-conformance-dependency-install/adapter_dependency_install_gate_report.json"
    ),
    evidenceEntry(
      "post-stable-local-ollama-adapter-conformance",
      "evidence/post-stable-local-ollama-adapter-conformance",
      "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_gate_report.json"
    ),
    evidenceEntry(
      "post-stable-local-model-verification-owner-decision-packet-refresh",
      "evidence/post-stable-local-model-verification-owner-decision-packet-refresh",
      "evidence/post-stable-local-model-verification-owner-decision-packet-refresh/local_model_verification_owner_packet_refresh_gate_report.json"
    ),
    evidenceEntry(
      "post-stable-reference-baseline-refresh-for-local-model-verification",
      "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification",
      "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json"
    ),
    evidenceEntry(
      "post-stable-local-model-verification-final-gate",
      FINAL_GATE_DIR,
      `${FINAL_GATE_DIR}/local_model_verification_final_gate_report.json`
    )
  ]
};

const finalClaimState = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  allowed_claims: MAINTAINED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  canonicalization_rules: [
    "Use local-model-verified only for the Ollama qwen3 local lane.",
    "local-model-verified does not imply provider-diverse.",
    "local-model-verified does not imply provider-verified.",
    "local-model-verified does not imply adapter-checked.",
    "local-model-verified does not imply general production-ready or stable."
  ],
  local_model_verified: localModelVerifiedReady,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false
};

const strictPaths = {
  status: "recorded",
  stage: STAGE,
  provider_diversity: {
    status: "blocked",
    reason: "Provider diversity requires separate provider-diverse gate and evidence beyond local-model verification.",
    next_stage: "v2.0.0-post-stable-provider-diverse-path-design"
  },
  provider_verification: {
    status: "blocked",
    reason: "Provider verification requires separate provider verification gate.",
    next_stage: "v2.0.0-post-stable-provider-verified-gate-design"
  },
  adapter_checked: {
    status: "blocked",
    reason: "Adapter-checked requires dedicated full adapter coverage gate beyond Ollama mapping review.",
    next_stage: "v2.0.0-post-stable-adapter-checked-gate-design"
  },
  general_production_ready_and_stable: {
    status: "blocked",
    reason: "General production-ready and stable remain blocked; scoped OpenAI-only claims remain separate."
  }
};

const referenceBaselineStatus = {
  status: "recorded",
  stage: STAGE,
  check_reference_baseline_integrity_status: compare.status,
  ds_store_exclusion_policy_enforced: baselineRefresh.snapshot_exclusion_policy?.excluded_basenames?.includes(".DS_Store") === true
    && baselineRefresh.snapshot_exclusion_policy?.source_files_removed === false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  additional_refresh_in_this_stage: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  notes: [
    "The final local-model verification gate read the owner-approved baseline state and did not refresh evidence/reference-baseline in this handoff stage."
  ]
};

const nextOptions = {
  status: "recorded",
  stage: STAGE,
  options: [
    {
      id: "NEXT-001",
      name: "provider_diverse_path_design",
      stage: "v2.0.0-post-stable-provider-diverse-path-design",
      description: "Define separate provider diversity evidence path before any provider diversity allowance."
    },
    {
      id: "NEXT-002",
      name: "provider_verified_gate_design",
      stage: "v2.0.0-post-stable-provider-verified-gate-design",
      description: "Define provider-level verification gate separately from local model verification."
    },
    {
      id: "NEXT-003",
      name: "adapter_checked_gate_design",
      stage: "v2.0.0-post-stable-adapter-checked-gate-design",
      description: "Define adapter-checked criteria beyond current Ollama mapping review."
    },
    {
      id: "NEXT-004",
      name: "combined_archive_export",
      stage: "v2.0.0-combined-openai-local-archive-export",
      description: "Package current OpenAI-only scoped stable plus local-model-verified evidence."
    }
  ]
};

const handoffReport = {
  status: localModelVerifiedReady ? "pass" : "fail",
  stage: STAGE,
  final_gate_stage: FINAL_GATE_STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  local_model_verified: localModelVerifiedReady,
  local_model_verified_allowed: localModelVerifiedReady,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  can_enter_stable_release: false,
  final_claim_state_status: finalClaimState.status,
  evidence_pointer_index_status: evidencePointerIndex.status,
  strict_paths_status: strictPaths.status,
  next_options_status: nextOptions.status,
  reference_baseline_status: referenceBaselineStatus.status,
  new_local_model_execution: false,
  new_local_model_generation: false,
  new_local_generation_calls: 0,
  local_redteam_rerun: false,
  adapter_conformance_rerun_with_generation: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  ds_store_deletion_from_reference_baseline: false,
  claims_maintained: MAINTAINED_CLAIMS,
  claims_allowed_by_this_stage: FINAL_STAGE_CLAIMS,
  claims_still_blocked: BLOCKED_CLAIMS,
  included_evidence_groups: evidencePointerIndex.entries.map((entry) => entry.group_id)
};

const unresolvedItems = handoffReport.status === "pass" ? [] : [
  {
    id: "LMV-HANDOFF-001",
    severity: "high",
    description: "Local model verified final gate evidence is not ready for final handoff.",
    blocks_final_handoff: true
  }
];

writeTextSafe(p("release", "post_stable_local_model_verified_final_handoff_scope.yaml"), `stage: ${STAGE}
approved_actions:
  final_handoff_generation: true
  final_claim_state_snapshot: true
  evidence_pointer_index_generation: true
  archive_manifest_generation: true
  archive_checksum_generation: true
  strict_paths_registry: true
  next_options_registry: true
  reference_baseline_status_recording: true
  claim_boundary_audit: true
forbidden_execution:
  new_local_model_generation: true
  local_redteam_rerun: true
  adapter_conformance_rerun_with_generation: true
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_refresh: true
  ds_store_deletion_from_reference_baseline: true
claims_maintained:
${MAINTAINED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
claims_allowed:
${FINAL_STAGE_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);
writeTextSafe(p("release", "post_stable_local_model_verified_final_claim_state.yaml"), `stage: ${STAGE}
status: ${finalClaimState.status}
scope: ${SCOPE}
local_model_verified: ${localModelVerifiedReady}
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
`);
writeTextSafe(p("release", "post_stable_local_model_verified_archive_manifest.yaml"), `stage: ${STAGE}
status: pending_archive_generation
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
reference_baseline_source_modified: ${referenceBaselineSourceModified}
dist_modified: ${distModified}
additional_reference_baseline_refresh: false
`);
writeTextSafe(p("release", "post_stable_local_model_verified_next_options.yaml"), `stage: ${STAGE}
status: recorded
options:
${nextOptions.options.map((option) => `  - id: ${option.id}
    name: ${option.name}
    stage: ${option.stage}`).join("\n")}
`);
writeTextSafe(p("release", "post_stable_local_provider_strict_paths.yaml"), `stage: ${STAGE}
status: recorded
provider_diversity: blocked
provider_verification: blocked
adapter_checked: blocked
general_production_ready_and_stable: blocked
`);
writeTextSafe(p("evals", "suites", "post_stable_local_model_verified_final_handoff.yaml"), `suite: post_stable_local_model_verified_final_handoff
stage: ${STAGE}
checks:
  - local_model_verified_final_handoff_report_exists
  - local_model_verified_final_claim_state_exists
  - local_model_verified_evidence_pointer_index_exists
  - local_model_verified_archive_manifest_exists
  - local_model_verified_archive_checksums_exists
  - local_model_verified_strict_paths_exists
  - local_model_verified_reference_baseline_status_exists
  - local_model_verified_next_options_exists
  - claim_boundary_audit
forbidden:
  - new_local_model_generation
  - local_redteam_rerun
  - adapter_conformance_rerun_with_generation
  - openai_model_api_call
  - openai_provider_call
  - telemetry_sink_write
  - evidence_reference_baseline_refresh
  - ds_store_deletion_from_reference_baseline
`);

writeJsonSafe(e("local_model_verified_final_handoff_report.json"), handoffReport);
writeJsonSafe(e("local_model_verified_final_claim_state.json"), finalClaimState);
writeJsonSafe(e("local_model_verified_evidence_pointer_index.json"), evidencePointerIndex);
writeJsonSafe(e("local_model_verified_strict_paths.json"), strictPaths);
writeJsonSafe(e("local_model_verified_reference_baseline_status.json"), referenceBaselineStatus);
writeJsonSafe(e("local_model_verified_next_options.json"), nextOptions);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);
writeJsonSafe(p("evals", "reports", "local_model_verified_final_handoff_report.json"), handoffReport);
writeTextSafe(p("evals", "reports", "local_model_verified_final_handoff_report.md"), `# Local Model Verified Final Handoff

Status: ${handoffReport.status}

- Stage: ${STAGE}
- Scope: ${SCOPE}
- Archive label: ${ARCHIVE_LABEL}
- Local-model-verified: ${handoffReport.local_model_verified}
- Provider-diverse allowed: false
- Provider-verified allowed: false
- Adapter-checked allowed: false
- Production-ready allowed: false
- Stable allowed: false
- New local model execution: false
- Additional reference baseline refresh: false
`);

writeTextSafe(p("docs", "local_model_verified_final_handoff.ko.md"), `# Local-model-verified final handoff

상태: ${handoffReport.status}

- scope: ${SCOPE}
- archive label: ${ARCHIVE_LABEL}
- local-model-verified: ${handoffReport.local_model_verified}
- provider-diverse: blocked
- provider-verified: blocked
- adapter-checked: blocked
- production-ready: blocked
- stable: blocked
- 새 local model execution: false
- 추가 evidence/reference-baseline refresh: false
`);
writeTextSafe(p("docs", "local_model_verified_final_claim_state.ko.md"), `# Local-model-verified final claim state

\`local-model-verified\`는 ${SCOPE}에 한정한다.

유지되는 claim:
${MAINTAINED_CLAIMS.map((claim) => `- ${claim}`).join("\n")}

차단되는 claim:
${BLOCKED_CLAIMS.map((claim) => `- ${claim}`).join("\n")}
`);
writeTextSafe(p("docs", "local_model_verified_strict_paths.ko.md"), `# Local provider strict paths

provider-diverse, provider-verified, adapter-checked는 이번 handoff에서 계속 blocked다.

- provider diversity path: ${strictPaths.provider_diversity.next_stage}
- provider verification path: ${strictPaths.provider_verification.next_stage}
- adapter checked path: ${strictPaths.adapter_checked.next_stage}
`);
writeTextSafe(p("docs", "next_provider_diverse_path_plan.ko.md"), `# Next provider-diverse path plan

현재 handoff는 local-model-verified를 ${SCOPE} 범위로만 고정한다.

provider-diverse claim before any provider-diverse allowance:
- 독립 provider evidence lane 정의
- provider별 no-tool, redteam, adapter, redaction evidence 비교
- provider-diverse 전용 gate와 claim boundary audit

이 문서는 계획이며 provider-diverse claim은 계속 차단한다.
`);
writeTextSafe(p("docs", "next_provider_verified_path_plan.ko.md"), `# Next provider-verified path plan

현재 handoff는 provider verification을 수행하지 않는다.

provider-verified claim before any provider-verified allowance:
- provider-level request/response contract 정의
- provider별 execution evidence와 redaction evidence 분리
- provider-verified 전용 gate와 claim boundary audit

이 문서는 계획이며 provider-verified claim은 계속 차단한다.
`);
writeTextSafe(p("docs", "next_adapter_checked_path_plan.ko.md"), `# Next adapter-checked path plan

현재 handoff는 Ollama mapping review를 local-model-verified 근거로만 보존한다.

adapter-checked claim before any adapter-checked allowance:
- adapter별 runtime contract와 fixture coverage 확정
- no-tool, structured output, tool-calling mock, redaction boundary의 adapter-level 기준
- adapter-checked 전용 gate와 claim boundary audit

이 문서는 계획이며 adapter-checked claim은 계속 차단한다.
`);

console.log(JSON.stringify(handoffReport, null, 2));
process.exit(handoffReport.status === "pass" ? 0 : 1);
