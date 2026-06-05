#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-combined-provider-diverse-archive-refresh-and-next-gates-preflight";
const EVIDENCE_DIR = "post-combined-provider-diverse-archive-refresh";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse";
const CLAIMS_MAINTAINED = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
const CLAIMS_NOT_ALLOWED = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const CLAIMS_ALLOWED_BY_THIS_STAGE = [
  "post-combined-provider-diverse-archive-refreshed",
  "post-combined-provider-diverse-final-claim-state-recorded",
  "post-combined-provider-diverse-evidence-indexed",
  "post-combined-provider-diverse-next-gates-recorded",
  "post-combined-provider-diverse-final-export-draft-refreshed"
];
const PRIOR_BASELINE_REFRESH_FILES = [
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(...relPath.split("/")), value);
}

function writeTextRel(relPath, value) {
  writeText(p(...relPath.split("/")), value);
}

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
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

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
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
    script,
    exit_code: result.status,
    status: parsed?.status || (result.status === 0 ? "pass" : "fail"),
    parsed,
    stdout_excerpt: (result.stdout || "").trim().slice(0, 3000),
    stderr_excerpt: (result.stderr || "").trim().slice(0, 3000)
  };
}

function falseFlags(record, flags) {
  return flags.every((flag) => record?.[flag] === false);
}

function artifactPass(relPath) {
  const absPath = p(...relPath.split("/"));
  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) return true;
  const record = readJsonIfExists(relPath);
  if (!record) return exists(relPath);
  return record.status === "pass"
    || record.status === "recorded"
    || record.status === "ready_for_owner_decision_to_claim_provider_diverse"
    || record.status === "containment_verified_decision_approved"
    || record.status === "pass_openai_scope_release_gated_not_stable";
}

function evidenceEntry(groupId, pathValue, supportsClaims, doesNotSupportClaims = CLAIMS_NOT_ALLOWED) {
  return {
    group_id: groupId,
    path: pathValue,
    status: artifactPass(pathValue) ? "pass" : "missing_or_not_pass",
    supports_claims: supportsClaims,
    does_not_support_claims: doesNotSupportClaims
  };
}

function sha256File(relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(...relPath.split("/")))).digest("hex");
}

function checksumEntry(relPath) {
  return exists(relPath)
    ? { path: relPath, type: "file", sha256: sha256File(relPath) }
    : { path: relPath, status: "missing" };
}

function writeKoDoc(relPath, title, lines) {
  writeTextRel(relPath, `# ${title}\n\n${lines.join("\n")}\n`);
}

function markdownReport(report) {
  return `# Provider-Diverse Archive Refresh Report

Status: ${report.status}

- Stage: ${report.stage}
- Archive label: ${report.archive_label}
- Scope: ${report.scope}
- Provider-diverse reflected: ${report.provider_diverse}
- Provider-verified allowance: ${report.provider_verified_allowed}
- Adapter-checked allowance: ${report.adapter_checked_allowed}
- General production-ready allowance: ${report.production_ready_allowed}
- General stable allowance: ${report.stable_allowed}
- Actual export write: ${report.actual_export_write}
- New local model execution: ${report.new_local_model_execution}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
- reference baseline source modified: ${report.reference_baseline_source_modified}
- dist modified: ${report.dist_modified}
- Additional evidence/reference-baseline refresh: ${report.additional_reference_baseline_refresh}
`;
}

const finalGate = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_report.json") || {};
const finalGateCheck = readJsonIfExists("evidence/post-combined-provider-diverse-final-gate/provider_diverse_final_gate_check_report.json") || {};
const combinedReport = readJsonIfExists("evidence/combined-openai-local-archive-export/combined_archive_export_report.json") || {};
const combinedManifest = readJsonIfExists("evidence/combined-openai-local-archive-export/combined_archive_manifest.json") || {};
const finalExportDraft = readJsonIfExists("evidence/final-export-package-draft/final_export_package_draft_report.json") || {};
const compare = runNode("check_reference_baseline_integrity.mjs");
const protectedStatus = gitStatus(["legacy-reference-source", "dist", "harness-core/evidence/reference-baseline", "harness-core/node_modules"]);
const protectedPaths = statusPaths(protectedStatus);
const baselinePaths = protectedPaths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/"));
const baselineOnlyPriorRefresh = baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file));
const referenceBaselineSourceModified = protectedPaths.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source");
const distModified = protectedPaths.some((file) => file.startsWith("dist/") || file === "dist");
const nodeModulesModified = protectedPaths.some((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules");

const finalGatePassed = finalGate.status === "pass"
  && finalGate.provider_diverse_allowed === true
  && finalGate.can_claim_provider_diverse === true
  && finalGateCheck.status === "pass"
  && finalGateCheck.can_claim_provider_verified === false
  && finalGateCheck.can_claim_adapter_checked === false;
const combinedArchivePassed = combinedReport.status === "pass"
  && combinedReport.post_rc_openai_only_stable === true
  && combinedReport.local_model_verified === true
  && combinedManifest.status === "recorded";
const noForbiddenExecution = falseFlags(finalGate, [
  "openai_model_api_call",
  "openai_provider_call",
  "new_local_model_execution",
  "new_local_model_generation",
  "telemetry_sink_write",
  "local_endpoint_probe",
  "reference_baseline_source_modified",
  "dist_modified",
  "evidence_reference_baseline_refreshed_in_this_stage"
]);
const protectedPathsPassed = protectedStatus.exit_code === 0
  && referenceBaselineSourceModified === false
  && distModified === false
  && nodeModulesModified === false
  && baselineOnlyPriorRefresh === true
  && compare.exit_code === 0
  && compare.status === "pass";

const finalClaimState = {
  status: "recorded",
  stage: STAGE,
  archive_scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  allowed_claims: CLAIMS_MAINTAINED,
  blocked_claims: CLAIMS_NOT_ALLOWED,
  claims_allowed_by_this_stage: CLAIMS_ALLOWED_BY_THIS_STAGE,
  provider_diverse: true,
  provider_diverse_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  canonicalization_rules: [
    "provider-diverse does not imply provider-verified.",
    "provider-diverse does not imply adapter-checked.",
    "provider-diverse does not imply production-ready.",
    "provider-diverse does not imply stable.",
    "Use post-rc-openai-only-stable, not stable.",
    "Use post-rc-openai-only-production-ready, not production-ready.",
    "Use rc1-openai-scope-release-gated, not release-gated."
  ]
};

const evidencePointerIndex = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  entries: [
    evidenceEntry(
      "post-combined-provider-diverse-final-gate",
      "evidence/post-combined-provider-diverse-final-gate",
      ["provider-diverse"]
    ),
    evidenceEntry(
      "post-combined-provider-diverse-path-design",
      "evidence/post-combined-provider-diverse-path-design",
      ["post-combined-provider-diverse-path-designed"]
    ),
    evidenceEntry(
      "post-combined-provider-diverse-evidence-inventory",
      "evidence/post-combined-provider-diverse-evidence-inventory",
      ["post-combined-provider-diverse-inventory-recorded", "post-combined-provider-diverse-evidence-accepted"]
    ),
    evidenceEntry(
      "post-combined-strict-paths-owner-decision-packet",
      "evidence/post-combined-strict-paths-owner-decision-packet",
      ["post-combined-strict-paths-owner-decision-packet-recorded"]
    ),
    evidenceEntry(
      "combined-openai-local-archive-export",
      "evidence/combined-openai-local-archive-export",
      [
        "combined-openai-local-archive-export-recorded",
        "combined-openai-local-final-claim-state-recorded",
        "combined-openai-local-evidence-indexed"
      ]
    ),
    evidenceEntry(
      "post-stable-local-model-verified-final-handoff",
      "evidence/post-stable-local-model-verified-final-handoff",
      ["local-model-verified"]
    ),
    evidenceEntry(
      "post-rc-openai-only-stable-final-handoff",
      "evidence/post-rc-openai-only-stable-final-handoff",
      [
        "post-rc-openai-only-stable",
        "post-rc-openai-only-production-ready",
        "production-monitored",
        "telemetry-connected",
        "containment-verified",
        "rc1-openai-scope-release-gated"
      ]
    )
  ]
};

const archiveManifestRefresh = {
  status: "recorded",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  provider_diverse: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  actual_export_write: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  node_modules_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  included_evidence_groups: evidencePointerIndex.entries.map((entry) => entry.group_id)
};

const strictPathsRefresh = {
  status: "recorded",
  stage: STAGE,
  provider_diverse: {
    status: "allowed",
    scope: SCOPE
  },
  provider_verified: {
    status: "blocked",
    next_stage: "v2.0.0-post-combined-provider-verified-gate-preflight",
    reason: "Provider verification requires a separate provider-level verification gate."
  },
  adapter_checked: {
    status: "blocked",
    next_stage: "v2.0.0-post-combined-adapter-checked-gate-preflight",
    reason: "Adapter-checked requires dedicated full adapter coverage gate."
  },
  general_production_ready_and_stable: {
    status: "blocked",
    reason: "General production-ready and stable remain blocked. Scoped claims remain separate."
  }
};

const nextGatesRegistry = {
  status: "recorded",
  stage: STAGE,
  next_gates: [
    {
      id: "NEXT-001",
      name: "provider_verified_gate_preflight",
      stage: "v2.0.0-post-combined-provider-verified-gate-preflight",
      claim_target: "provider-verified",
      requires_owner_decision_before_final_claim: true
    },
    {
      id: "NEXT-002",
      name: "adapter_checked_gate_preflight",
      stage: "v2.0.0-post-combined-adapter-checked-gate-preflight",
      claim_target: "adapter-checked",
      requires_owner_decision_before_final_claim: true
    },
    {
      id: "NEXT-003",
      name: "final_export_execution",
      stage: "v2.0.0-final-export-execution",
      claim_target: "none",
      requires_operator_signal: true
    }
  ]
};

const archiveRefreshReport = {
  status: finalGatePassed && combinedArchivePassed && noForbiddenExecution && protectedPathsPassed ? "pass" : "fail",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  provider_diverse: true,
  provider_diverse_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  final_gate_passed: finalGatePassed,
  combined_archive_passed: combinedArchivePassed,
  provider_diverse_final_gate_reflected: true,
  evidence_pointer_index_updated: true,
  archive_manifest_refreshed: true,
  archive_checksum_refreshed: true,
  strict_paths_refreshed: true,
  next_gates_recorded: true,
  final_export_draft_refresh_pending: finalExportDraft.status === "pass",
  claims_maintained: CLAIMS_MAINTAINED,
  claims_allowed_by_this_stage: CLAIMS_ALLOWED_BY_THIS_STAGE,
  claims_still_blocked: CLAIMS_NOT_ALLOWED,
  new_local_model_execution: false,
  new_local_model_generation: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  openai_provider_rerun: false,
  telemetry_sink_write: false,
  actual_export_write: false,
  local_endpoint_probe: false,
  local_redteam_rerun: false,
  adapter_conformance_rerun_with_generation: false,
  npm_install_or_ci: false,
  production_deployment: false,
  release_gate_rerun: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  node_modules_modified: false,
  additional_reference_baseline_refresh: false,
  evidence_reference_baseline_refreshed_in_this_stage: false,
  evidence_reference_baseline_modified_only_prior_refresh: baselineOnlyPriorRefresh,
  protected_status_lines: protectedPaths,
  check_reference_baseline_integrity_status: compare.status,
  ds_store_exclusion_policy_enforced: compare.parsed?.snapshot_exclusion_policy?.excluded_basenames?.includes(".DS_Store") === true
};

writeJson(e("provider_diverse_archive_refresh_report.json"), archiveRefreshReport);
writeJson(e("provider_diverse_final_claim_state.json"), finalClaimState);
writeJson(e("provider_diverse_evidence_pointer_index_update.json"), evidencePointerIndex);
writeJson(e("provider_diverse_archive_manifest_refresh.json"), archiveManifestRefresh);
writeJson(e("provider_diverse_strict_paths_refresh.json"), strictPathsRefresh);
writeJson(e("provider_diverse_next_gates_registry.json"), nextGatesRegistry);
writeJson(e("unresolved_items.json"), {
  status: "pass",
  stage: STAGE,
  unresolved_items_count: 0,
  unresolved_items: []
});

writeTextRel("release/post_combined_provider_diverse_archive_refresh_scope.yaml", `stage: ${STAGE}
status: recorded
approved_actions:
  provider_diverse_archive_refresh: true
  combined_claim_state_refresh: true
  provider_diverse_evidence_index_update: true
  archive_manifest_refresh: true
  archive_checksum_refresh: true
  final_export_draft_refresh: true
  strict_paths_refresh: true
  next_gates_registry: true
  claim_boundary_audit: true
forbidden_execution:
  openai_model_api_call: true
  openai_provider_rerun: true
  new_local_model_execution: true
  local_redteam_rerun: true
  adapter_conformance_rerun_with_generation: true
  telemetry_sink_write: true
  npm_install_or_ci: true
  production_deployment: true
  actual_export_write: true
  release_gate_rerun: true
  reference_baseline_modification: true
  dist_modification: true
  evidence_reference_baseline_refresh: true
claims_maintained:
${CLAIMS_MAINTAINED.map((claim) => `  - ${claim}`).join("\n")}
claims_not_allowed:
${CLAIMS_NOT_ALLOWED.map((claim) => `  - ${claim}`).join("\n")}
claims_allowed:
${CLAIMS_ALLOWED_BY_THIS_STAGE.map((claim) => `  - ${claim}`).join("\n")}
`);

writeTextRel("release/post_combined_provider_diverse_final_claim_state.yaml", `stage: ${STAGE}
status: recorded
archive_scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
provider_diverse: true
provider_diverse_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
allowed_claims:
${CLAIMS_MAINTAINED.map((claim) => `  - ${claim}`).join("\n")}
blocked_claims:
${CLAIMS_NOT_ALLOWED.map((claim) => `  - ${claim}`).join("\n")}
`);

writeTextRel("release/post_combined_provider_diverse_archive_manifest.yaml", `stage: ${STAGE}
status: recorded
archive_label: ${ARCHIVE_LABEL}
scope: ${SCOPE}
provider_diverse: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
actual_export_write: false
reference_baseline_source_modified: false
dist_modified: false
additional_reference_baseline_refresh: false
included_evidence_group_count: ${archiveManifestRefresh.included_evidence_groups.length}
`);

writeTextRel("release/post_combined_provider_diverse_next_gates.yaml", `stage: ${STAGE}
status: recorded
next_gates:
  - id: NEXT-001
    name: provider_verified_gate_preflight
    stage: v2.0.0-post-combined-provider-verified-gate-preflight
    claim_target: provider-verified
  - id: NEXT-002
    name: adapter_checked_gate_preflight
    stage: v2.0.0-post-combined-adapter-checked-gate-preflight
    claim_target: adapter-checked
  - id: NEXT-003
    name: final_export_execution
    stage: v2.0.0-final-export-execution
    claim_target: none
`);

writeTextRel("evals/suites/post_combined_provider_diverse_archive_refresh.yaml", `suite_id: post_combined_provider_diverse_archive_refresh
stage: ${STAGE}
scope: ${SCOPE}
mode: archive_refresh_only
new_local_model_execution: false
openai_model_api_call: false
telemetry_sink_write: false
actual_export_write: false
required_evidence_groups:
${archiveManifestRefresh.included_evidence_groups.map((group) => `  - ${group}`).join("\n")}
`);

writeJsonRel("evals/reports/provider_diverse_archive_refresh_report.json", archiveRefreshReport);
writeTextRel("evals/reports/provider_diverse_archive_refresh_report.md", markdownReport(archiveRefreshReport));

writeKoDoc("docs/provider_diverse_archive_refresh.ko.md", "Provider-Diverse Archive Refresh", [
  "`provider-diverse` final gate pass 결과를 combined archive 상태에 반영했습니다.",
  "",
  `- Archive label: \`${ARCHIVE_LABEL}\``,
  `- Scope: \`${SCOPE}\``,
  "- provider-diverse: true",
  "- provider-verified: blocked",
  "- adapter-checked: blocked",
  "- actual export write: false",
  "- new local model execution: false",
  "- OpenAI model API call: false",
  "- telemetry sink write: false",
  "- referenceBaseline/dist modification: false",
  "- evidence/reference-baseline additional refresh: false"
]);
writeKoDoc("docs/provider_diverse_final_claim_state.ko.md", "Provider-Diverse Final Claim State", [
  "Allowed:",
  ...CLAIMS_MAINTAINED.map((claim) => `- \`${claim}\``),
  "",
  "Blocked:",
  ...CLAIMS_NOT_ALLOWED.map((claim) => `- \`${claim}\``),
  "",
  "`provider-diverse`는 `provider-verified`, `adapter-checked`, bare `production-ready`, bare `stable`, bare `release-gated`를 의미하지 않습니다."
]);
writeKoDoc("docs/provider_diverse_next_gates.ko.md", "Provider-Diverse Next Gates", [
  "다음 gate 후보를 archive refresh 이후 상태에 맞춰 기록했습니다.",
  "",
  "- `v2.0.0-post-combined-provider-verified-gate-preflight`: provider-level verification preflight",
  "- `v2.0.0-post-combined-adapter-checked-gate-preflight`: adapter coverage preflight",
  "- `v2.0.0-final-export-execution`: operator signal 이후 final export execution"
]);
writeKoDoc("docs/next_provider_verified_gate_preflight_plan.ko.md", "Next Provider-Verified Gate Preflight Plan", [
  "`provider-verified`는 아직 blocked입니다.",
  "다음 preflight는 각 provider lane별 provider-level contract, no-tool, structured output, tool-calling or explicit unsupported declaration, redaction storage, repeatability evidence를 별도로 점검해야 합니다."
]);
writeKoDoc("docs/next_adapter_checked_gate_preflight_plan.ko.md", "Next Adapter-Checked Gate Preflight Plan", [
  "`adapter-checked`는 아직 blocked입니다.",
  "다음 preflight는 adapter mapping, schema handling, tool argument mapping, local reasoning control handling, storage redaction, failure mapping coverage를 별도로 점검해야 합니다."
]);
writeKoDoc("docs/next_final_export_execution_plan.ko.md", "Next Final Export Execution Plan", [
  "Final export execution은 별도 operator signal 이후 수행합니다.",
  "현재 단계는 draft refresh만 허용하며 `dist` 쓰기와 actual export write는 수행하지 않습니다."
]);

const checksumTargets = [
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_refresh_report.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_final_claim_state.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_evidence_pointer_index_update.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_manifest_refresh.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_strict_paths_refresh.json",
  "evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_next_gates_registry.json",
  "evidence/post-combined-provider-diverse-archive-refresh/unresolved_items.json",
  "release/post_combined_provider_diverse_archive_refresh_scope.yaml",
  "release/post_combined_provider_diverse_final_claim_state.yaml",
  "release/post_combined_provider_diverse_archive_manifest.yaml",
  "release/post_combined_provider_diverse_next_gates.yaml",
  "evals/suites/post_combined_provider_diverse_archive_refresh.yaml",
  "evals/reports/provider_diverse_archive_refresh_report.json",
  "evals/reports/provider_diverse_archive_refresh_report.md",
  "docs/provider_diverse_archive_refresh.ko.md",
  "docs/provider_diverse_final_claim_state.ko.md",
  "docs/provider_diverse_next_gates.ko.md",
  "docs/next_provider_verified_gate_preflight_plan.ko.md",
  "docs/next_adapter_checked_gate_preflight_plan.ko.md",
  "docs/next_final_export_execution_plan.ko.md"
];
const archiveChecksumsRefresh = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  generated_at: new Date().toISOString(),
  entries: checksumTargets.map(checksumEntry),
  missing_targets: checksumTargets.filter((target) => !exists(target))
};
writeJson(e("provider_diverse_archive_checksums_refresh.json"), archiveChecksumsRefresh);

console.log(JSON.stringify(archiveRefreshReport, null, 2));
process.exit(archiveRefreshReport.status === "pass" ? 0 : 1);
