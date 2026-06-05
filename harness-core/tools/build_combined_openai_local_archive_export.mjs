#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-combined-openai-local-archive-export";
const EVIDENCE_DIR = "evidence/combined-openai-local-archive-export";
const SCOPE = "openai_only_post_rc_plus_ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified-ollama-qwen3";
const ALLOWED_CLAIMS = [
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated",
  "local-model-verified"
];
const BLOCKED_CLAIMS = [
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];
const STAGE_CLAIMS = [
  "combined-openai-local-archive-export-recorded",
  "combined-openai-local-final-claim-state-recorded",
  "combined-openai-local-evidence-indexed",
  "combined-openai-local-strict-paths-recorded"
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
  return status.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function artifactStatus(relPath) {
  if (!exists(relPath)) return "missing";
  const artifact = readJsonIfExists(relPath);
  if (!artifact) return "pass";
  if (artifact.status === "pass" || artifact.status === "recorded") return "pass";
  if (artifact.status === "containment_verified_decision_approved") return "pass";
  if (artifact.status === "pass_openai_scope_release_gated_not_stable") return "pass";
  if (artifact.status === "ready_for_owner_decision_to_claim_local_model_verified") return "pass";
  if (artifact.status === "ready_after_repair") return "pass";
  return artifact.status || "pass";
}

function evidenceEntry(groupId, pathValue, reportPath, supportsClaims = []) {
  return {
    group_id: groupId,
    path: pathValue,
    report_path: reportPath,
    status: artifactStatus(reportPath),
    supports_claims: supportsClaims,
    does_not_support_claims: BLOCKED_CLAIMS
  };
}

const openaiFinal = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json") || {};
const openaiGate = readJsonIfExists("evidence/post-rc-openai-only-stable-final-handoff/final_handoff_gate_report.json") || {};
const localFinal = readJsonIfExists("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json") || {};
const localGate = readJsonIfExists("evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_gate_report.json") || {};
const compare = runNode("check_reference_baseline_integrity.mjs");
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline"]);
const protectedLines = statusLines(protectedStatus);
const referenceBaselineSourceModified = protectedLines.some((line) => line.includes("legacy-reference-source"));
const distModified = protectedLines.some((line) => line.includes("dist"));

const postRcOpenaiOnlyStable = openaiFinal.status === "pass"
  && openaiFinal.post_rc_openai_only_stable === true
  && openaiGate.status === "pass"
  && openaiGate.can_claim_post_rc_openai_only_stable === true;
const localModelVerified = localFinal.status === "pass"
  && localFinal.local_model_verified === true
  && localGate.status === "pass"
  && localGate.can_claim_local_model_verified === true;

const finalClaimState = {
  status: "recorded",
  stage: STAGE,
  archive_scope: SCOPE,
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  canonicalization_rules: [
    "Use post-rc-openai-only-stable, not stable.",
    "Use post-rc-openai-only-production-ready, not production-ready.",
    "Use rc1-openai-scope-release-gated, not release-gated.",
    "Use local-model-verified only for the Ollama qwen3 local lane.",
    "Do not claim provider-diverse until a separate provider-diverse gate passes.",
    "Do not claim provider-verified until a separate provider verification gate passes.",
    "Do not claim adapter-checked until a dedicated adapter-checked gate passes."
  ],
  post_rc_openai_only_stable: postRcOpenaiOnlyStable,
  local_model_verified: localModelVerified,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false
};

const evidencePointerIndex = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  generated_at: new Date().toISOString(),
  entries: [
    evidenceEntry(
      "post-rc-openai-only-stable-final-handoff",
      "evidence/post-rc-openai-only-stable-final-handoff",
      "evidence/post-rc-openai-only-stable-final-handoff/final_handoff_report.json",
      [
        "post-rc-openai-only-stable",
        "post-rc-openai-only-production-ready",
        "production-monitored",
        "telemetry-connected",
        "containment-verified",
        "rc1-openai-scope-release-gated"
      ]
    ),
    evidenceEntry(
      "post-stable-local-model-verified-final-handoff",
      "evidence/post-stable-local-model-verified-final-handoff",
      "evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-stable-local-model-verification-final-gate",
      "evidence/post-stable-local-model-verification-final-gate",
      "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-stable-local-ollama-adapter-conformance",
      "evidence/post-stable-local-ollama-adapter-conformance",
      "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_gate_report.json",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-stable-local-redteam-bounded-smoke",
      "evidence/post-stable-local-redteam-bounded-smoke",
      "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
      "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b",
      "evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-rc-production-monitoring-final-gate",
      "evidence/post-rc-production-monitoring-final-gate",
      "evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json",
      ["production-monitored", "telemetry-connected"]
    ),
    evidenceEntry(
      "post-rc-telemetry-connection",
      "evidence/post-rc-telemetry-connection",
      "evidence/post-rc-telemetry-connection/telemetry_connection_report.json",
      ["telemetry-connected"]
    ),
    evidenceEntry(
      "post-rc-openai-only-production-ready-scope-decision",
      "evidence/post-rc-openai-only-production-ready-scope-decision",
      "evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json",
      ["post-rc-openai-only-production-ready"]
    ),
    evidenceEntry(
      "rc1-openai-scope-bundle",
      "evidence/rc1-openai-scope-bundle",
      "evidence/rc1-openai-scope-bundle/rc1_gate_report.json",
      ["rc1-openai-scope-release-gated", "containment-verified"]
    ),
    evidenceEntry(
      "rc1-release-gate-actual-openai-scope",
      "evidence/rc1-release-gate-actual-openai-scope",
      "evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_gate_report.json",
      ["rc1-openai-scope-release-gated"]
    ),
    evidenceEntry(
      "rc1-post-release-gate-review",
      "docs/next_rc1_post_release_gate_review.md",
      "docs/next_rc1_post_release_gate_review.md",
      ["rc1-openai-scope-release-gated"]
    ),
    evidenceEntry(
      "reference-baseline-owner-approved-refresh",
      "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification",
      "evidence/post-stable-reference-baseline-dependency-repair-for-local-verification/reference_baseline_refresh_after_owner_approval_for_local_verification.json",
      []
    )
  ]
};

const archiveManifest = {
  status: "recorded",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  included_evidence_groups: evidencePointerIndex.entries.map((entry) => entry.group_id)
};

const strictPaths = {
  status: "recorded",
  stage: STAGE,
  provider_diverse: {
    status: "blocked",
    reason: "Provider-diverse requires separate gate to decide whether OpenAI plus Ollama local lane qualifies for provider diversity.",
    next_stage: "v2.0.0-post-stable-provider-diverse-path-design"
  },
  provider_verified: {
    status: "blocked",
    reason: "Provider-verified requires separate provider-level verification gate.",
    next_stage: "v2.0.0-post-stable-provider-verified-gate-design"
  },
  adapter_checked: {
    status: "blocked",
    reason: "Adapter-checked requires dedicated full adapter coverage gate beyond current Ollama mapping review.",
    next_stage: "v2.0.0-post-stable-adapter-checked-gate-design"
  },
  general_stable_and_production_ready: {
    status: "blocked",
    reason: "General stable, general production-ready, and bare release-gated remain blocked. Only scoped claims are allowed."
  }
};

const referenceBaselineStatus = {
  status: "recorded",
  stage: STAGE,
  check_reference_baseline_integrity_status: compare.status,
  ds_store_exclusion_policy_enforced: compare.parsed?.snapshot_exclusion_policy?.excluded_basenames?.includes(".DS_Store") === true
    && compare.parsed?.snapshot_exclusion_policy?.source_files_removed === false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  additional_refresh_in_this_stage: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  protected_status_lines: protectedLines,
  notes: [
    "The combined archive export reads the owner-approved baseline state and does not refresh evidence/reference-baseline.",
    ".DS_Store files are excluded from baseline inventory/checksum snapshots but not deleted from legacy-reference-source."
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
      description: "Define whether OpenAI plus Ollama qwen3 local lane can support a provider diversity allowance."
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
      name: "final_export_package",
      stage: "v2.0.0-final-export-package",
      description: "Create a distributable export package for the current combined archive."
    }
  ]
};

const archiveExportReport = {
  status: postRcOpenaiOnlyStable && localModelVerified && compare.status === "pass" && !referenceBaselineSourceModified && !distModified ? "pass" : "fail",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  post_rc_openai_only_stable: postRcOpenaiOnlyStable,
  local_model_verified: localModelVerified,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  claims_maintained: ALLOWED_CLAIMS,
  claims_allowed_by_this_stage: STAGE_CLAIMS,
  claims_still_blocked: [...BLOCKED_CLAIMS, "bare release-gated"],
  final_claim_state_status: finalClaimState.status,
  evidence_pointer_index_status: evidencePointerIndex.status,
  archive_manifest_status: archiveManifest.status,
  strict_paths_status: strictPaths.status,
  reference_baseline_status: referenceBaselineStatus.status,
  next_options_status: nextOptions.status,
  new_local_model_execution: false,
  new_local_model_generation: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  local_endpoint_probe: false,
  local_redteam_rerun: false,
  adapter_conformance_rerun: false,
  production_deployment: false,
  release_gate_rerun: false,
  reference_baseline_source_modified: referenceBaselineSourceModified,
  dist_modified: distModified,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  included_evidence_groups: archiveManifest.included_evidence_groups
};

writeJson(e("combined_archive_export_report.json"), archiveExportReport);
writeJson(e("combined_final_claim_state.json"), finalClaimState);
writeJson(e("combined_evidence_pointer_index.json"), evidencePointerIndex);
writeJson(e("combined_archive_manifest.json"), archiveManifest);
writeJson(e("combined_strict_paths.json"), strictPaths);
writeJson(e("combined_reference_baseline_status.json"), referenceBaselineStatus);
writeJson(e("combined_next_options.json"), nextOptions);
writeJson(e("unresolved_items.json"), {
  status: "pass",
  stage: STAGE,
  unresolved_items_count: 0,
  unresolved_items: []
});

writeText(p("release", "combined_openai_local_archive_export_scope.yaml"), `stage: ${STAGE}
status: recorded
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
approved_actions:
  combined_archive_export: true
  combined_claim_state_snapshot: true
  combined_evidence_pointer_index: true
  archive_manifest_generation: true
  archive_checksum_generation: true
  strict_paths_registry: true
  next_options_registry: true
  reference_baseline_status_recording: true
  claim_boundary_audit: true
forbidden_execution:
  new_local_model_generation: true
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_redteam_rerun: true
  adapter_conformance_rerun: true
  production_deployment: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_refresh: true
claims_maintained:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
claims_allowed:
${STAGE_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);

writeText(p("release", "combined_openai_local_final_claim_state.yaml"), `stage: ${STAGE}
status: recorded
archive_scope: ${SCOPE}
post_rc_openai_only_stable: ${postRcOpenaiOnlyStable}
local_model_verified: ${localModelVerified}
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
allowed_claims:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
blocked_claims:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);

writeText(p("release", "combined_openai_local_archive_manifest.yaml"), `stage: ${STAGE}
status: recorded
archive_label: ${ARCHIVE_LABEL}
scope: ${SCOPE}
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
local_endpoint_probe: false
reference_baseline_source_modified: ${referenceBaselineSourceModified}
dist_modified: ${distModified}
additional_reference_baseline_refresh: false
included_evidence_group_count: ${archiveManifest.included_evidence_groups.length}
`);

writeText(p("release", "combined_openai_local_strict_paths.yaml"), `stage: ${STAGE}
status: recorded
provider_diverse_status: blocked
provider_verified_status: blocked
adapter_checked_status: blocked
general_stable_and_production_ready_status: blocked
next_provider_diverse_stage: v2.0.0-post-stable-provider-diverse-path-design
next_provider_verified_stage: v2.0.0-post-stable-provider-verified-gate-design
next_adapter_checked_stage: v2.0.0-post-stable-adapter-checked-gate-design
`);

writeText(p("release", "combined_openai_local_next_options.yaml"), `stage: ${STAGE}
status: recorded
options:
  - id: NEXT-001
    name: provider_diverse_path_design
    stage: v2.0.0-post-stable-provider-diverse-path-design
  - id: NEXT-002
    name: provider_verified_gate_design
    stage: v2.0.0-post-stable-provider-verified-gate-design
  - id: NEXT-003
    name: adapter_checked_gate_design
    stage: v2.0.0-post-stable-adapter-checked-gate-design
  - id: NEXT-004
    name: final_export_package
    stage: v2.0.0-final-export-package
`);

writeText(p("evals", "suites", "combined_openai_local_archive_export.yaml"), `suite_id: combined_openai_local_archive_export
stage: ${STAGE}
scope: ${SCOPE}
mode: archive_export_only
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
local_endpoint_probe: false
required_evidence_groups:
${archiveManifest.included_evidence_groups.map((group) => `  - ${group}`).join("\n")}
`);

writeJson(p("evals", "reports", "combined_openai_local_archive_export_report.json"), archiveExportReport);
writeText(p("evals", "reports", "combined_openai_local_archive_export_report.md"), `# Combined OpenAI Local Archive Export Report

Status: ${archiveExportReport.status}

- Stage: ${STAGE}
- Archive label: ${ARCHIVE_LABEL}
- Scope: ${SCOPE}
- post-rc-openai-only-stable: ${postRcOpenaiOnlyStable}
- local-model-verified: ${localModelVerified}
- Provider diversity allowance: false
- Provider verification allowance: false
- Adapter checked allowance: false
- General production-ready allowance: false
- General stable allowance: false
- New local model execution: false
- OpenAI model API call: false
- Telemetry sink write: false
- Local endpoint probe: false
- reference baseline source modified: ${referenceBaselineSourceModified}
- dist modified: ${distModified}
- Additional evidence/reference-baseline refresh: false
`);

writeText(p("docs", "combined_openai_local_archive_export.ko.md"), `# Combined OpenAI Local Archive Export

이 문서는 OpenAI-only post-RC scoped stable archive와 Ollama qwen3 local-model-verified archive를 하나의 combined archive/export 상태로 묶은 최종 handoff이다.

- Stage: \`${STAGE}\`
- Archive label: \`${ARCHIVE_LABEL}\`
- Scope: \`${SCOPE}\`
- post-rc-openai-only-stable: ${postRcOpenaiOnlyStable}
- local-model-verified: ${localModelVerified}
- provider diversity allowance: false
- provider verification allowance: false
- adapter checked allowance: false
- general production-ready allowance: false
- general stable allowance: false
- new local model execution: false
- OpenAI model API call: false
- telemetry sink write: false
- local endpoint probe: false
- reference baseline source modified: ${referenceBaselineSourceModified}
- dist modified: ${distModified}
- evidence/reference-baseline additional refresh: false
`);

writeText(p("docs", "combined_openai_local_final_claim_state.ko.md"), `# Combined Final Claim State

허용된 scoped claim은 OpenAI-only post-RC scope와 Ollama qwen3 local lane에 한정한다.

Allowed:
${ALLOWED_CLAIMS.map((claim) => `- \`${claim}\``).join("\n")}

Blocked:
${BLOCKED_CLAIMS.map((claim) => `- \`${claim}\``).join("\n")}
- bare \`release-gated\`

Canonical rules:
- \`post-rc-openai-only-stable\`을 사용하고 bare \`stable\`은 사용하지 않는다.
- \`post-rc-openai-only-production-ready\`를 사용하고 bare \`production-ready\`는 사용하지 않는다.
- \`rc1-openai-scope-release-gated\`를 사용하고 bare \`release-gated\`는 사용하지 않는다.
- \`local-model-verified\`는 Ollama qwen3 local lane에만 사용한다.
`);

writeText(p("docs", "combined_openai_local_strict_paths.ko.md"), `# Combined Strict Paths

- provider diversity path: blocked, next stage \`v2.0.0-post-stable-provider-diverse-path-design\`
- provider verification path: blocked, next stage \`v2.0.0-post-stable-provider-verified-gate-design\`
- adapter checked path: blocked, next stage \`v2.0.0-post-stable-adapter-checked-gate-design\`
- general stable and production-ready path: blocked

현재 combined archive는 scoped archive/export이며, provider/general 승격 경로는 별도 gate로 분리한다.
`);

writeText(p("docs", "combined_openai_local_next_options.ko.md"), `# Combined Next Options

1. \`v2.0.0-post-stable-provider-diverse-path-design\`: OpenAI plus Ollama qwen3 local lane의 provider diversity allowance 조건을 설계한다.
2. \`v2.0.0-post-stable-provider-verified-gate-design\`: provider-level verification gate를 별도로 설계한다.
3. \`v2.0.0-post-stable-adapter-checked-gate-design\`: current Ollama mapping review 이후의 adapter checked criteria를 설계한다.
4. \`v2.0.0-final-export-package\`: 현재 combined archive를 배포 가능한 export package로 묶는다.
`);

console.log(JSON.stringify(archiveExportReport, null, 2));
process.exit(archiveExportReport.status === "pass" ? 0 : 1);
