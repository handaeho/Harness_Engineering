#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, readJson, toPosix, walkFiles, writeJson, writeText } from "./lib/file_walk.mjs";

export const STAGE = "v2.0.0-rc.1-evidence-bundle-openai-scope";

export const rc1ClaimsAllowed = [
  "rc1-openai-scope-evidence-bundle-drafted",
  "rc1-evidence-lineage-indexed",
  "rc1-claim-boundary-audited",
  "rc1-blocker-snapshot-recorded",
  "rc1-release-readiness-assessed",
  "rc1-openai-only-scope-declared"
];

export const rc1ClaimsBlocked = [
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "telemetry-connected",
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

export function resolveRoot(argv = process.argv) {
  const repoRoot = process.cwd();
  return argv[2] && !argv[2].startsWith("--")
    ? path.resolve(repoRoot, argv[2])
    : path.basename(repoRoot) === "prompt-stack-v2"
      ? repoRoot
      : path.resolve(repoRoot, "prompt-stack-v2");
}

function p(root, ...parts) {
  return path.join(root, ...parts);
}

function exists(root, relPath) {
  return fs.existsSync(p(root, ...relPath.split("/")));
}

function readIfExists(root, relPath, fallback = null) {
  const file = p(root, ...relPath.split("/"));
  return fs.existsSync(file) ? readJson(file) : fallback;
}

function rel(root, file) {
  return toPosix(path.relative(root, file));
}

function yamlList(items, indent = 2) {
  const pad = " ".repeat(indent);
  return items.map((item) => `${pad}- ${item}`).join("\n");
}

function yamlBoolMap(values, indent = 2) {
  const pad = " ".repeat(indent);
  return Object.entries(values).map(([key, value]) => `${pad}${key}: ${value}`).join("\n");
}

function mdList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function artifact(root, pathValue, status = "pass") {
  return {
    path: pathValue,
    exists: exists(root, pathValue),
    status: exists(root, pathValue) ? status : "missing"
  };
}

function evidenceEntry(root, groupId, status, claimLevel, required, artifacts) {
  return {
    group_id: groupId,
    status,
    claim_level: claimLevel,
    required_for_rc1_openai_scope: required,
    artifacts: artifacts.map((item) => artifact(root, item.path, item.status || status))
  };
}

function scopeYaml() {
  return `stage: ${STAGE}

approved_actions:
${yamlBoolMap({
  rc1_evidence_bundle_generation: true,
  openai_scope_declaration: true,
  evidence_lineage_indexing: true,
  claim_boundary_audit: true,
  blocker_snapshot_generation: true,
  release_gate_readiness_draft: true,
  bundle_manifest_and_checksums: true
}, 2)}

forbidden_execution:
${yamlBoolMap({
  openai_provider_call: true,
  redteam_rerun: true,
  containment_rerun: true,
  local_model_execution: true,
  local_endpoint_probe: true,
  telemetry_connection: true,
  telemetry_sink_write: true,
  release_gate_actual_execution: true,
  production_deployment: true,
  stable_release_claim: true,
  release_gated_claim: true,
  production_ready_claim: true,
  production_monitored_claim: true,
  provider_diverse_claim: true,
  provider_verified_claim: true,
  adapter_checked_claim: true,
  dist_modification: true
}, 2)}

claims_allowed:
${yamlList(rc1ClaimsAllowed, 2)}

claims_not_allowed:
${yamlList([
  "stable",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "integration-verified"
], 2)}
`;
}

function openaiScopeSummary() {
  return {
    stage: STAGE,
    status: "drafted",
    scope: "openai_only_rc1",
    new_execution: false,
    new_provider_execution: false,
    local_model_execution: false,
    telemetry_connection: false,
    release_gate_execution: false,
    dist_modified: false,
    v36_modified: false,
    openai_surfaces: {
      no_tool_canary: "pass",
      structured_output_canary: "pass",
      tool_calling_canary: "pass",
      canary_replay_suite: "pass",
      limited_redteam: "pass",
      additional_redteam: "pass"
    },
    containment: {
      dedicated_verification: "pass",
      post_execution_audit: "pass",
      owner_decision: "approve_containment_verified",
      containment_verified: true
    },
    storage_redaction: {
      cross_suite_audit: "pass",
      raw_storage_violations: 0,
      secret_or_auth_violations: 0
    },
    not_in_scope: [
      "local model verification",
      "provider diversity",
      "production monitoring",
      "production readiness",
      "release-gated stable"
    ]
  };
}

function rc1ClaimBoundary() {
  return {
    status: "pass",
    rc1_openai_scope_allowed: true,
    containment_verified_allowed: true,
    release_gated_allowed: false,
    production_ready_allowed: false,
    production_monitored_allowed: false,
    provider_diverse_allowed: false,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    local_model_verified_allowed: false,
    allowed_claims: [
      ...rc1ClaimsAllowed,
      "containment-verified"
    ],
    blocked_claims: [
      "stable",
      "release-gated",
      "production-ready",
      "production-monitored",
      "provider-diverse",
      "provider-verified",
      "adapter-checked",
      "local-model-verified",
      "integration-verified"
    ],
    reason: "OpenAI-only rc.1 evidence bundle is allowed, but release gate, production readiness, provider diversity, and local/runtime verification remain blocked."
  };
}

function blockerSnapshot() {
  return {
    status: "blocked_for_release_gated",
    containment_verified: true,
    release_gate_passed: false,
    production_ready: false,
    production_monitored: false,
    provider_diversity_established: false,
    local_model_execution_verified: false,
    remaining_blockers: [
      {
        id: "RCB-001",
        priority: "P0",
        category: "provider_diversity",
        status: "blocked",
        reason: "OpenAI-only evidence; no local or second provider evidence."
      },
      {
        id: "RCB-002",
        priority: "P0",
        category: "local_runtime",
        status: "blocked",
        reason: "vLLM/Ollama local endpoint unavailable; local no-tool canary not executed."
      },
      {
        id: "RCB-003",
        priority: "P1",
        category: "telemetry",
        status: "blocked",
        reason: "Telemetry connection not established; production-monitored claim blocked."
      },
      {
        id: "RCB-004",
        priority: "P1",
        category: "release_process",
        status: "pending",
        reason: "Release gate actual execution not performed."
      }
    ]
  };
}

function releaseReadinessAssessment() {
  return {
    status: "rc1_openai_scope_ready",
    openai_only_rc1_ready: true,
    strict_provider_diverse_ready: false,
    release_gated_ready: false,
    production_ready: false,
    production_monitored: false,
    recommended_next_stage: "v2.0.0-rc.1-release-gate-dry-run-openai-scope",
    why_not_stable: [
      "release gate actual execution not performed",
      "provider diversity not established",
      "local runtime not verified",
      "production telemetry not connected",
      "production readiness not established"
    ]
  };
}

function notStableNotice() {
  return {
    status: "not_stable",
    rc1_is_not_stable: true,
    rc1_is_not_release_gated: true,
    rc1_is_not_production_ready: true,
    rc1_is_not_provider_diverse: true,
    rc1_is_not_production_monitored: true,
    message: "This rc.1 bundle is an OpenAI-only release candidate evidence bundle, not a stable or production-ready release."
  };
}

function evidenceIndex(root) {
  return [
    evidenceEntry(root, "v36 baseline", "pass", "baseline_snapshot", true, [
      { path: "evidence/v36-baseline/file_inventory.json" },
      { path: "evidence/v36-baseline/checksums.json" }
    ]),
    evidenceEntry(root, "alpha validation", "pass", "alpha_static_validation", true, [
      { path: "evidence/alpha/validation_report.json" },
      { path: "evidence/alpha/baseline_comparison.json" }
    ]),
    evidenceEntry(root, "alpha hardening", "pass", "alpha_hardening_static", true, [
      { path: "evidence/alpha/prohibited_claim_scan.json" },
      { path: "evidence/alpha/unresolved_items.json" }
    ]),
    evidenceEntry(root, "beta preflight", "pass", "beta_preflight", true, [
      { path: "evidence/beta-preflight/dependency_validation_report.json" },
      { path: "evidence/beta-preflight/beta_entry_gate_report.json" }
    ]),
    evidenceEntry(root, "beta mock execution", "pass", "mock_execution_only", true, [
      { path: "evidence/beta-mock-execution/execution_report.json" },
      { path: "evidence/beta-mock-execution/beta_mock_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI no-tool canary", "pass", "openai_provider_canary_only", true, [
      { path: "evidence/beta-provider-canary-openai/provider_canary_report.json" },
      { path: "evidence/beta-provider-canary-openai/provider_canary_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI structured output canary", "pass", "openai_structured_output_canary_only", true, [
      { path: "evidence/beta-structured-output-canary-openai/structured_output_canary_report.json" },
      { path: "evidence/beta-structured-output-canary-openai/structured_output_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI tool-calling canary", "pass", "openai_tool_calling_canary_only", true, [
      { path: "evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json" },
      { path: "evidence/beta-tool-calling-canary-openai/tool_calling_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI canary replay suite", "pass", "canary_suite_only", true, [
      { path: "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json" },
      { path: "evidence/beta-openai-canary-replay-suite/suite_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI limited redteam execution", "pass", "openai_limited_redteam_scope", true, [
      { path: "evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json" },
      { path: "evidence/beta-openai-redteam-limited-execution/redteam_gate_report.json" }
    ]),
    evidenceEntry(root, "OpenAI additional redteam execution", "pass", "openai_additional_redteam_scope", true, [
      { path: "evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json" },
      { path: "evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_gate_report.json" }
    ]),
    evidenceEntry(root, "broader redteam pass gate design", "drafted", "design_only", false, [
      { path: "evidence/beta-broader-redteam-pass-gate-design/broader_redteam_pass_gate_design_report.json", status: "drafted" },
      { path: "evidence/beta-broader-redteam-pass-gate-design/broader_redteam_pass_gate_design_gate_report.json", status: "drafted" }
    ]),
    evidenceEntry(root, "skipped redteam case review", "pass", "case_disposition_review", true, [
      { path: "evidence/beta-skipped-redteam-case-review/skipped_case_review_report.json" },
      { path: "evidence/beta-skipped-redteam-case-review/skipped_case_review_gate_report.json" }
    ]),
    evidenceEntry(root, "containment design", "pass", "design_only", true, [
      { path: "evidence/beta-containment-boundary-verification-design/containment_boundary_verification_design_report.json" },
      { path: "evidence/beta-containment-boundary-verification-design/containment_coverage_matrix.json" }
    ]),
    evidenceEntry(root, "containment mock dry-run", "pass", "mock_dry_run_passed", true, [
      { path: "evidence/beta-containment-boundary-mock-dry-run/containment_boundary_mock_dry_run_report.json" },
      { path: "evidence/beta-containment-boundary-mock-dry-run/containment_mock_gate_report.json" }
    ]),
    evidenceEntry(root, "containment gate refinement", "pass", "gate_refined_not_verified", true, [
      { path: "evidence/beta-containment-verification-gate-refinement/containment_verification_gate_refinement_report.json" },
      { path: "evidence/beta-containment-verification-gate-refinement/containment_gate_refinement_gate_report.json" }
    ]),
    evidenceEntry(root, "cross-suite storage/redaction audit", "pass", "storage_redaction_audit_passed", true, [
      { path: "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json" },
      { path: "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_gate_report.json" }
    ]),
    evidenceEntry(root, "dedicated containment verification plan", "pass", "plan_ready_execution_pending_then_executed", true, [
      { path: "evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json" },
      { path: "evidence/beta-dedicated-containment-verification-plan/dedicated_containment_plan_gate_report.json" }
    ]),
    evidenceEntry(root, "dedicated containment verification execution", "pass", "dedicated_containment_execution_passed", true, [
      { path: "evidence/beta-dedicated-containment-verification/dedicated_containment_verification_report.json" },
      { path: "evidence/beta-dedicated-containment-verification/dedicated_containment_gate_report.json" }
    ]),
    evidenceEntry(root, "containment post-execution claim audit", "pass", "post_execution_audit_passed", true, [
      { path: "evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json" },
      { path: "evidence/beta-containment-post-execution-claim-audit/containment_post_execution_gate_report.json" }
    ]),
    evidenceEntry(root, "containment verified decision gate", "pass", "containment_verified_allowed_beta_scope", true, [
      { path: "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json" },
      { path: "evidence/beta-containment-verified-decision-gate/containment_verified_decision_gate_report.json" }
    ]),
    evidenceEntry(root, "release blocker P0/P1 reevaluation", "pass", "openai_only_rc1_candidate", true, [
      { path: "evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json" },
      { path: "evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_p0_p1_gate_report.json" }
    ])
  ];
}

function lineageEntry({ stage, status = "pass", newExecution = false, providerExecution = false, localModelExecution = false, telemetryConnection = false, claimsAdded = [], claimsBlocked = [], evidencePaths = [] }) {
  return {
    stage,
    status,
    new_execution: newExecution,
    provider_execution: providerExecution,
    local_model_execution: localModelExecution,
    telemetry_connection: telemetryConnection,
    claims_added: claimsAdded,
    claims_blocked: claimsBlocked,
    evidence_paths: evidencePaths
  };
}

function evidenceLineage() {
  return [
    lineageEntry({
      stage: "v36 baseline",
      evidencePaths: ["evidence/v36-baseline/file_inventory.json", "evidence/v36-baseline/checksums.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-alpha-static-validation",
      claimsAdded: ["alpha-static-validated", "baseline-snapshotted"],
      claimsBlocked: rc1ClaimsBlocked,
      evidencePaths: ["evidence/alpha/validation_report.json", "evidence/alpha/baseline_comparison.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-preflight",
      claimsAdded: ["beta-preflight-prepared"],
      claimsBlocked: rc1ClaimsBlocked,
      evidencePaths: ["evidence/beta-preflight/dependency_validation_report.json", "evidence/beta-preflight/beta_entry_gate_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-mock-execution",
      claimsAdded: ["beta-mock-runtime-executed"],
      claimsBlocked: rc1ClaimsBlocked,
      evidencePaths: ["evidence/beta-mock-execution/execution_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-provider-canary-openai",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["openai-provider-canary-executed"],
      claimsBlocked: ["provider-diverse", "provider-verified", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-provider-canary-openai/provider_canary_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-structured-output-canary-openai",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["openai-structured-output-canary-executed"],
      claimsBlocked: ["schema-output-verified", "provider-verified", "release-gated"],
      evidencePaths: ["evidence/beta-structured-output-canary-openai/structured_output_canary_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-tool-calling-canary-openai",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["openai-tool-calling-canary-executed"],
      claimsBlocked: ["tool-call-verified", "provider-verified", "release-gated"],
      evidencePaths: ["evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-openai-canary-replay-suite",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["openai-canary-replay-suite-executed", "canary-suite-replay-evidence-recorded"],
      claimsBlocked: ["replay-verified", "provider-diverse", "release-gated"],
      evidencePaths: ["evidence/beta-openai-canary-replay-suite/suite_replay_summary.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-openai-redteam-limited-execution",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["openai-redteam-limited-executed"],
      claimsBlocked: ["redteam-passed", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-additional-openai-redteam-execution",
      newExecution: true,
      providerExecution: true,
      claimsAdded: ["additional-openai-redteam-executed"],
      claimsBlocked: ["redteam-passed", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-containment-boundary-verification-design",
      claimsAdded: ["containment-boundary-verification-design-drafted"],
      claimsBlocked: ["containment-verified", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-containment-boundary-verification-design/containment_boundary_verification_design_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-containment-boundary-mock-dry-run",
      claimsAdded: ["containment-boundary-mock-dry-run-executed"],
      claimsBlocked: ["containment-verified", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-containment-boundary-mock-dry-run/containment_boundary_mock_dry_run_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-cross-suite-storage-redaction-audit",
      claimsAdded: ["cross-suite-storage-redaction-audit-executed", "raw-storage-audit-passed"],
      claimsBlocked: ["containment-verified", "telemetry-connected", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-dedicated-containment-verification-execution",
      newExecution: true,
      claimsAdded: ["dedicated-containment-verification-executed"],
      claimsBlocked: ["containment-verified", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-dedicated-containment-verification/dedicated_containment_verification_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-containment-post-execution-claim-audit-and-owner-review",
      claimsAdded: ["containment-post-execution-audit-completed"],
      claimsBlocked: ["containment-verified", "release-gated", "production-ready"],
      evidencePaths: ["evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-containment-verified-decision-gate",
      claimsAdded: ["containment-verified"],
      claimsBlocked: ["release-gated", "production-ready", "production-monitored"],
      evidencePaths: ["evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json"]
    }),
    lineageEntry({
      stage: "v2.0.0-beta-release-blocker-p0-p1-reevaluation",
      claimsAdded: ["release-blockers-reevaluated", "rc1-readiness-assessed"],
      claimsBlocked: ["release-gated", "production-ready", "provider-diverse"],
      evidencePaths: ["evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json"]
    }),
    lineageEntry({
      stage: STAGE,
      status: "drafted",
      claimsAdded: rc1ClaimsAllowed,
      claimsBlocked: rc1ClaimsBlocked,
      evidencePaths: ["evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json"]
    })
  ];
}

function rc1BundleReport(root, summary, index, lineage, boundary, readiness, blocker) {
  const missingArtifacts = index.flatMap((entry) => entry.artifacts.filter((item) => !item.exists).map((item) => `${entry.group_id}: ${item.path}`));
  return {
    status: missingArtifacts.length === 0 ? "pass" : "fail",
    stage: STAGE,
    new_provider_execution: false,
    local_model_execution: false,
    telemetry_connection: false,
    release_gate_execution: false,
    dist_modified: false,
    v36_modified: false,
    scope: summary.scope,
    evidence_groups_indexed: index.length,
    lineage_stages_indexed: lineage.length,
    missing_artifacts: missingArtifacts,
    rc1_openai_scope_allowed: boundary.rc1_openai_scope_allowed,
    containment_verified_allowed: boundary.containment_verified_allowed,
    release_gated_allowed: boundary.release_gated_allowed,
    production_ready_allowed: boundary.production_ready_allowed,
    production_monitored_allowed: boundary.production_monitored_allowed,
    provider_diverse_allowed: boundary.provider_diverse_allowed,
    openai_only_rc1_ready: readiness.openai_only_rc1_ready,
    strict_provider_diverse_ready: readiness.strict_provider_diverse_ready,
    remaining_blockers_count: blocker.remaining_blockers.length,
    claims_allowed: [
      ...rc1ClaimsAllowed,
      "containment-verified"
    ],
    claims_not_allowed: rc1ClaimsBlocked
  };
}

function manifest(root, report, index) {
  const evidenceRoot = p(root, "evidence", "rc1-openai-scope-bundle");
  const existingBundleFiles = fs.existsSync(evidenceRoot)
    ? walkFiles(evidenceRoot, { excludedPaths: ["node_modules", "dist"], extensions: [".json", ".md", ".yaml", ".yml"] })
      .map((file) => rel(root, file))
      .sort()
    : [];
  const requiredBundleFiles = [
    "evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json",
    "evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.md",
    "evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json",
    "evidence/rc1-openai-scope-bundle/rc1_evidence_index.json",
    "evidence/rc1-openai-scope-bundle/rc1_evidence_index.md",
    "evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json",
    "evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json",
    "evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json",
    "evidence/rc1-openai-scope-bundle/rc1_capability_matrix_snapshot.yaml",
    "evidence/rc1-openai-scope-bundle/rc1_release_gate_snapshot.yaml",
    "evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json",
    "evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json",
    "evidence/rc1-openai-scope-bundle/rc1_not_stable_notice.json",
    "evidence/rc1-openai-scope-bundle/rc1_gate_report.json",
    "evidence/rc1-openai-scope-bundle/unresolved_items.json"
  ];
  return {
    status: report.status,
    stage: STAGE,
    generated_at: "2026-05-22",
    scope: "openai_only_rc1",
    new_execution: false,
    excludes: [
      "node_modules",
      "dist",
      "prompt-stack/v36 mutation",
      "raw provider responses",
      "secret-bearing data"
    ],
    evidence_groups: index.map((entry) => ({
      group_id: entry.group_id,
      status: entry.status,
      claim_level: entry.claim_level
    })),
    required_bundle_files: requiredBundleFiles,
    current_bundle_files: Array.from(new Set([...existingBundleFiles, ...requiredBundleFiles])).sort()
  };
}

function checksums(root) {
  const evidenceRoot = p(root, "evidence", "rc1-openai-scope-bundle");
  const files = walkFiles(evidenceRoot, {
    excludedPaths: ["node_modules", "dist"],
    extensions: [".json", ".md", ".yaml", ".yml"]
  })
    .filter((file) => path.basename(file) !== "rc1_bundle_checksums.json")
    .map((file) => ({
      path: rel(root, file),
      sha256: sha256(file)
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
  return {
    status: "pass",
    stage: STAGE,
    algorithm: "sha256",
    file_count: files.length,
    files
  };
}

function bundleManifestMarkdown(value) {
  return `# RC1 Bundle Manifest

Status: ${value.status}

Stage: ${value.stage}

- Scope: ${value.scope}
- New execution: ${value.new_execution}
- Bundle files: ${value.current_bundle_files.length}
- Evidence groups: ${value.evidence_groups.length}

## Evidence Groups

${value.evidence_groups.map((entry) => `- ${entry.group_id}: ${entry.status} (${entry.claim_level})`).join("\n")}
`;
}

function evidenceIndexMarkdown(index) {
  return `# RC1 Evidence Index

Indexed groups: ${index.length}

${index.map((entry) => `## ${entry.group_id}

- Status: ${entry.status}
- Claim level: ${entry.claim_level}
- Required for OpenAI-only rc.1 scope: ${entry.required_for_rc1_openai_scope}
- Artifacts:
${entry.artifacts.map((item) => `  - ${item.exists ? "present" : "missing"}: \`${item.path}\``).join("\n")}
`).join("\n")}
`;
}

function reportMarkdown(report) {
  return `# RC1 OpenAI Scope Bundle Report

Status: ${report.status}

Stage: ${report.stage}

- Scope: ${report.scope}
- New provider execution: ${report.new_provider_execution}
- Local model execution: ${report.local_model_execution}
- Telemetry connection: ${report.telemetry_connection}
- Release gate execution: ${report.release_gate_execution}
- Evidence groups indexed: ${report.evidence_groups_indexed}
- Lineage stages indexed: ${report.lineage_stages_indexed}
- RC1 OpenAI scope allowed: ${report.rc1_openai_scope_allowed}
- Containment verified allowed: ${report.containment_verified_allowed}
- Release-gated allowed: ${report.release_gated_allowed}
- Production-ready allowed: ${report.production_ready_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
`;
}

function lineageMarkdown(lineage) {
  return `# RC1 Evidence Lineage

Stages indexed: ${lineage.length}

${lineage.map((entry) => `- ${entry.stage}: ${entry.status}; new_execution=${entry.new_execution}; provider_execution=${entry.provider_execution}`).join("\n")}
`;
}

function boundaryMarkdown(boundary) {
  return `# RC1 Claim Boundary

Status: ${boundary.status}

- RC1 OpenAI scope allowed: ${boundary.rc1_openai_scope_allowed}
- Containment verified allowed: ${boundary.containment_verified_allowed}
- Release-gated allowed: ${boundary.release_gated_allowed}
- Production-ready allowed: ${boundary.production_ready_allowed}
- Production-monitored allowed: ${boundary.production_monitored_allowed}
- Provider-diverse allowed: ${boundary.provider_diverse_allowed}

Reason: ${boundary.reason}
`;
}

function docsText(title, lines) {
  return `# ${title}

${lines.join("\n\n")}
`;
}

function readmeText() {
  return `# Prompt Stack v2

Status: \`${STAGE}\`

This package is the v2 prompt-stack RC1 evidence workspace. The current stage drafts an OpenAI-only rc.1 evidence bundle from existing validated beta evidence without new provider, local model, telemetry, containment, or release-gate execution.

This bundle is not a stable release, is not release-gated, and is not production-ready. Provider diversity, local model verification, production monitoring, provider verification, and adapter claims remain blocked.

## Source of Truth

- \`stack.yaml\`
- \`stack.schema.json\`
- \`core/spec/harness.spec.yaml\`

Prompt bundles under \`dist/\` are generated artifacts. Do not edit generated bundles by hand.

## Current Allowed Claims

${mdList([...rc1ClaimsAllowed, "containment-verified"])}

These claims do not allow \`stable\`, \`release-gated\`, \`production-ready\`, \`production-monitored\`, \`telemetry-connected\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, \`local-model-verified\`, \`integration-verified\`, or \`benchmark-backed\`.

## Static Validation

Run from the workspace root:

\`\`\`powershell
node prompt-stack-v2/tools/check_rc1_openai_scope_bundle.mjs
\`\`\`
`;
}

function releaseGateYaml() {
  return `id: prompt-stack-v2.release_gate
version: ${STAGE}
status: blocked_not_release_gated

alpha_required_checks:
  - Release blocker P0/P1 reevaluation gate exists and passes
  - RC1 OpenAI-only bundle manifest exists
  - RC1 bundle checksums exist
  - RC1 evidence index exists
  - RC1 evidence lineage exists
  - RC1 OpenAI scope summary exists
  - RC1 claim boundary exists
  - RC1 blocker snapshot exists
  - RC1 release readiness assessment exists
  - RC1 not-stable notice exists
  - Stable release claim remains blocked
  - Release gated claim remains blocked
  - Production ready claim remains blocked
  - Provider diverse claim remains blocked

allowed_alpha_claims:
${yamlList([
  "containment-verified",
  ...rc1ClaimsAllowed
], 2)}

prohibited_positive_claims:
${yamlList(rc1ClaimsBlocked, 2)}

claim_upgrade_rule:
  rc1_evidence_bundle_is_not_stable_release: true
  openai_only_rc1_is_not_provider_diverse: true
  rc1_readiness_is_not_release_gated: true
  containment_verified_is_not_production_ready: true
  no_new_execution_in_rc1_bundle_stage: true
  release_gate_actual_execution_still_required: true

runner_status:
  provider_execution: false
  local_model_execution: false
  v36_runners_reexecuted_for_alpha: false
  runtime_execution_loop_implemented: false
  live_telemetry_connected: false
  telemetry_sink_write_enabled: false
  production_monitored: false
  mock_runtime_execution_loop_implemented: true
  mock_provider_execution: false
  mock_local_model_execution: false
  mock_external_side_effects: false
  openai_provider_canary_allowed: true
  openai_provider_execution_status: canary_only
  openai_tool_calling_execution: canary_only
  openai_tool_calling_rerun: canary_rerun_only
  openai_canary_replay_suite: canary_suite_only
  beta_release_evidence_bundle: draft_only
  release_gate_dry_run: blocked_not_release_gated
  redteam_suite_design: design_only
  redteam_mock_runtime_dry_run: mock_dry_run_only
  openai_redteam_limited_execution_plan: draft_only
  openai_redteam_limited_execution_preflight: blocked_by_missing_credential
  production_telemetry_design: design_only
  actual_redteam_execution: false
  actual_provider_redteam_execution: false
  actual_local_redteam_execution: false
  can_execute_provider_redteam: false
  redteam_execution_allowed: false
  replay_verified_claim: false
  openai_structured_output_execution: canary_only
  canary_matrix_summary_generated: true
  local_endpoint_probe: false
  local_readiness_documented: true
  note: OpenAI-only rc.1 evidence bundle is drafted without new execution. Stable, release, production, provider-diversity, telemetry, local-runtime, provider-verification, and adapter claims remain blocked.
`;
}

function releaseCandidateYaml(summary) {
  return `stage: ${STAGE}
status: drafted
scope: ${summary.scope}
new_execution: false
new_provider_execution: false
local_model_execution: false
telemetry_connection: false
release_gate_execution: false
stable_release: false
release_gated: false
production_ready: false
containment_verified: true
recommended_next_stage: v2.0.0-rc.1-release-gate-dry-run-openai-scope
`;
}

function claimBoundaryYaml(boundary) {
  return `status: ${boundary.status}
rc1_openai_scope_allowed: ${boundary.rc1_openai_scope_allowed}
containment_verified_allowed: ${boundary.containment_verified_allowed}
release_gated_allowed: ${boundary.release_gated_allowed}
production_ready_allowed: ${boundary.production_ready_allowed}
production_monitored_allowed: ${boundary.production_monitored_allowed}
provider_diverse_allowed: ${boundary.provider_diverse_allowed}
provider_verified_allowed: ${boundary.provider_verified_allowed}
adapter_checked_allowed: ${boundary.adapter_checked_allowed}
local_model_verified_allowed: ${boundary.local_model_verified_allowed}
allowed_claims:
${yamlList(boundary.allowed_claims, 2)}
blocked_claims:
${yamlList(boundary.blocked_claims, 2)}
reason: "${boundary.reason}"
`;
}

function blockerSnapshotYaml(blocker) {
  return `status: ${blocker.status}
containment_verified: ${blocker.containment_verified}
release_gate_passed: ${blocker.release_gate_passed}
production_ready: ${blocker.production_ready}
production_monitored: ${blocker.production_monitored}
provider_diversity_established: ${blocker.provider_diversity_established}
local_model_execution_verified: ${blocker.local_model_execution_verified}
remaining_blockers:
${blocker.remaining_blockers.map((item) => `  - id: ${item.id}
    priority: ${item.priority}
    category: ${item.category}
    status: ${item.status}
    reason: "${item.reason}"`).join("\n")}
`;
}

function readinessYaml(readiness) {
  return `status: ${readiness.status}
openai_only_rc1_ready: ${readiness.openai_only_rc1_ready}
strict_provider_diverse_ready: ${readiness.strict_provider_diverse_ready}
release_gated_ready: ${readiness.release_gated_ready}
production_ready: ${readiness.production_ready}
production_monitored: ${readiness.production_monitored}
recommended_next_stage: ${readiness.recommended_next_stage}
why_not_stable:
${yamlList(readiness.why_not_stable, 2)}
`;
}

function notStableYaml(notice) {
  return `status: ${notice.status}
rc1_is_not_stable: ${notice.rc1_is_not_stable}
rc1_is_not_release_gated: ${notice.rc1_is_not_release_gated}
rc1_is_not_production_ready: ${notice.rc1_is_not_production_ready}
rc1_is_not_provider_diverse: ${notice.rc1_is_not_provider_diverse}
rc1_is_not_production_monitored: ${notice.rc1_is_not_production_monitored}
message: "${notice.message}"
`;
}

function blockerPriorityYaml(blocker) {
  return `stage: ${STAGE}
status: rc1-openai-scope-blocker-snapshot-recorded
containment_verified: true
release_gate_status: blocked_not_release_gated
blockers:
${blocker.remaining_blockers.map((item) => `  - id: ${item.id}
    priority: ${item.priority}
    category: ${item.category}
    current_status: ${item.status}
    blocks_release_gated: true
    reason: "${item.reason}"`).join("\n")}
`;
}

function ownerActionMatrixYaml() {
  return `stage: ${STAGE}
status: refreshed
entries:
  - lane: openai_only_rc1
    owner: agent
    action: Prepare OpenAI-only rc.1 release gate dry-run using current bundle.
    exit_criteria: Dry-run completes while stable, release, production, provider-diversity, and production monitoring claims remain blocked.
    claim_unblocked_after_exit:
      - rc1-release-gate-dry-run-candidate
    claim_still_not_allowed:
      - stable
      - release-gated
      - production-ready
  - lane: strict_provider_diverse
    owner: human
    action: Provide local vLLM/Ollama endpoint or second provider path.
    exit_criteria: Non-OpenAI or local canary evidence exists.
    claim_unblocked_after_exit:
      - provider-diverse-candidate
    claim_still_not_allowed:
      - provider-diverse
      - release-gated
  - lane: telemetry
    owner: human
    action: Provide telemetry approval and sink credentials if production monitoring is desired.
    exit_criteria: Live telemetry receipt and anomaly response evidence exist.
    claim_unblocked_after_exit:
      - production-monitoring-candidate
    claim_still_not_allowed:
      - production-monitored
      - production-ready
`;
}

function betaReleaseBlockersYaml(blocker) {
  return `stage: ${STAGE}
status: rc1-openai-scope-snapshot
containment_verified: true
openai_only_rc1_ready: true
strict_provider_diverse_ready: false
release_gate_status: blocked_not_release_gated
remaining_blockers:
${blocker.remaining_blockers.map((item) => `  - id: ${item.id}
    priority: ${item.priority}
    category: ${item.category}
    status: ${item.status}
    reason: "${item.reason}"`).join("\n")}
`;
}

function providerCapabilityMatrixYaml() {
  return `version: ${STAGE}
status: rc1-openai-scope-bundle-drafted
policy:
  unverified_capabilities_must_not_be_true: true
  production_telemetry_default: false
  allowed_unverified_statuses:
    - needs_verification
    - false
    - not_applicable
    - roadmap
    - skeleton
    - failed_http_429
    - failed_trace_recorded
    - failure_path_checked
    - blocked_by_missing_local_endpoint
    - canary_rerun_checked
    - canary_rerun_recorded
    - canary_suite_checked
    - canary_suite_recorded
    - containment_verified_beta_scope
    - openai_only_rc1_candidate

providers:
  openai:
    adapter_path: adapters/api/openai/adapter.yaml
    status: provider_canary_checked
    message_mapping: dry_run_checked
    provider_canary: executed
    no_tool_text_path: canary_checked
    no_tool_text_rerun: canary_rerun_checked
    provider_trace: canary_checked
    trace: canary_checked
    redaction: canary_checked
    structured_output_canary: executed
    structured_output_path: canary_checked
    structured_output_rerun: canary_rerun_checked
    json_schema_response_validation: canary_checked
    tool_calling_canary: executed
    tool_call_path: canary_checked
    tool_argument_schema_validation: canary_checked
    mock_tool_output_reinjection: canary_checked
    tool_output_reclassification: canary_checked
    tool_calling_rerun: canary_rerun_checked
    canary_replay_suite: canary_suite_checked
    replay_evidence: canary_suite_recorded
    tool_calling: canary_only
    structured_outputs: canary_only
    evals_api: needs_verification
    tracing: needs_verification
    provider_execution: canary_only
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

  vllm:
    adapter_path: adapters/local/vllm/adapter.yaml
    status: dry_run_checked
    message_mapping: dry_run_checked
    local_no_tool_canary: blocked_by_missing_local_endpoint
    openai_compatible_server: needs_verification
    tool_calling: needs_verification
    structured_outputs: needs_verification
    chat_template: needs_verification
    evals_api: not_applicable
    provider_execution: false
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

  ollama:
    adapter_path: adapters/local/ollama/adapter.yaml
    status: dry_run_checked
    message_mapping: dry_run_checked
    local_no_tool_canary: blocked_by_missing_local_endpoint
    tool_calling: needs_verification
    structured_outputs: needs_verification
    chat_template: needs_verification
    evals_api: not_applicable
    provider_execution: false
    local_model_execution: false
    runtime_execution: false
    telemetry: false
    redteam: false
    replay: false
    production_monitoring: false
    production_telemetry: false
    verified: false

deferred_providers:
  anthropic: roadmap
  gemini: roadmap
  hf_transformers: roadmap
  mcp: roadmap
  agents_md: roadmap

mock_runtime:
  runtime_orchestration: beta_mock_executed
  tool_routing: mock_checked
  approval_boundary: smoke_tested
  trace_schema: smoke_tested
  provider_execution: false
  local_model_execution: false
  external_side_effects: false
`;
}

function claimLadderAppend() {
  return `## RC1 OpenAI Scope Evidence Bundle Claim

\`rc1-openai-scope-evidence-bundle-drafted\` means an OpenAI-only rc.1 evidence bundle was drafted from existing validated evidence without new execution.

It allows:
- OpenAI-only rc.1 evidence bundle statement
- rc.1 evidence lineage indexed statement
- rc.1 claim boundary audit statement
- OpenAI-only scope declaration

It does not allow:
- \`stable\`
- \`release-gated\`
- \`production-ready\`
- \`production-monitored\`
- \`provider-diverse\`
- \`provider-verified\`
- \`adapter-checked\`

Additional rules:
- rc.1 evidence bundle is not stable release
- OpenAI-only rc.1 is not \`provider-diverse\`
- rc.1 readiness is not \`release-gated\`
- \`containment-verified\` is not \`production-ready\`
- no new execution in rc.1 bundle stage
`;
}

function ensureClaimLadder(root) {
  const file = p(root, "release", "claim_ladder.md");
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
  if (current.includes("## RC1 OpenAI Scope Evidence Bundle Claim")) return current;
  const marker = "\n## Later Claims\n";
  const addition = `${claimLadderAppend()}\n`;
  return current.includes(marker)
    ? current.replace(marker, `\n${addition}${marker}`)
    : `${current.trimEnd()}\n\n${addition}`;
}

function handoffText(report, readiness, gateStatus = "pending") {
  return `# Session Handoff - 2026-05-22

Current stage: \`${STAGE}\`

## Latest Completed Work

- OpenAI-only rc.1 evidence bundle was drafted from existing beta evidence without new provider, local model, telemetry, containment, or release-gate execution.
- Evidence lineage, claim boundary, blocker snapshot, readiness assessment, manifest, and checksums are recorded under \`evidence/rc1-openai-scope-bundle/\`.
- \`containment-verified\` remains allowed for beta containment scope.
- Stable, release, production, telemetry, provider-diversity, provider-verification, adapter, local-model, replay, integration, and benchmark-backed claims remain blocked.

## Current Gate

- Gate script: \`prompt-stack-v2/tools/check_rc1_openai_scope_bundle.mjs\`
- Gate status: ${gateStatus}
- Can enter OpenAI-scope release gate dry-run: true
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false

## Current Evidence

- \`evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_evidence_index.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json\`
- \`evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json\`

## Current Status

- RC1 scope: OpenAI-only
- OpenAI-only rc.1 ready: ${readiness.openai_only_rc1_ready}
- Strict provider-diverse blocked: ${!readiness.strict_provider_diverse_ready}
- Release-gated ready: ${readiness.release_gated_ready}
- Production ready: ${readiness.production_ready}
- Production monitored: ${readiness.production_monitored}
- Recommended next stage: ${readiness.recommended_next_stage}

## Still Blocked

${mdList(rc1ClaimsBlocked.map((claim) => `\`${claim}\``))}
`;
}

function gateReportSkeleton() {
  return {
    status: "pass",
    stage: STAGE,
    can_enter_openai_scope_release_gate_dry_run: true,
    can_enter_stable_release: false,
    can_enter_release_gated_claim: false,
    can_enter_production_ready_claim: false,
    can_enter_provider_diverse_claim: false,
    reason: "OpenAI-only rc.1 evidence bundle is ready, but stable/release-gated/provider-diverse/production claims remain blocked.",
    checks: [],
    claims_allowed: rc1ClaimsAllowed,
    claims_blocked: rc1ClaimsBlocked
  };
}

function writeSnapshot(root, sourceRel, destRel) {
  const source = p(root, ...sourceRel.split("/"));
  const dest = p(root, ...destRel.split("/"));
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, fs.existsSync(source) ? fs.readFileSync(source, "utf8") : `# Missing snapshot source: ${sourceRel}\n`, "utf8");
}

function writeArtifacts(root, values) {
  const evidenceDir = p(root, "evidence", "rc1-openai-scope-bundle");
  const {
    summary,
    index,
    lineage,
    boundary,
    blocker,
    readiness,
    notice,
    report
  } = values;

  writeText(p(root, "release", "rc1_openai_scope_bundle_scope.yaml"), scopeYaml());
  writeText(p(root, "release", "rc1_openai_scope_release_candidate.yaml"), releaseCandidateYaml(summary));
  writeText(p(root, "release", "rc1_claim_boundary.yaml"), claimBoundaryYaml(boundary));
  writeText(p(root, "release", "rc1_blocker_snapshot.yaml"), blockerSnapshotYaml(blocker));
  writeText(p(root, "release", "rc1_release_gate_readiness.yaml"), readinessYaml(readiness));
  writeText(p(root, "release", "rc1_not_stable_notice.yaml"), notStableYaml(notice));

  writeJson(path.join(evidenceDir, "rc1_evidence_index.json"), index);
  writeText(path.join(evidenceDir, "rc1_evidence_index.md"), evidenceIndexMarkdown(index));
  writeJson(path.join(evidenceDir, "rc1_evidence_lineage.json"), lineage);
  writeJson(path.join(evidenceDir, "rc1_openai_scope_summary.json"), summary);
  writeJson(path.join(evidenceDir, "rc1_claim_boundary.json"), boundary);
  writeJson(path.join(evidenceDir, "rc1_blocker_snapshot.json"), blocker);
  writeJson(path.join(evidenceDir, "rc1_release_readiness_assessment.json"), readiness);
  writeJson(path.join(evidenceDir, "rc1_not_stable_notice.json"), notice);
  writeJson(path.join(evidenceDir, "rc1_gate_report.json"), gateReportSkeleton());
  writeJson(path.join(evidenceDir, "unresolved_items.json"), []);
  writeJson(path.join(evidenceDir, "rc1_bundle_report.json"), report);
  writeText(path.join(evidenceDir, "rc1_bundle_report.md"), reportMarkdown(report));
  writeSnapshot(root, "adapters/provider_capability_matrix.yaml", "evidence/rc1-openai-scope-bundle/rc1_capability_matrix_snapshot.yaml");
  writeSnapshot(root, "release/release_gate.yaml", "evidence/rc1-openai-scope-bundle/rc1_release_gate_snapshot.yaml");

  const manifestValue = manifest(root, report, index);
  writeJson(path.join(evidenceDir, "rc1_bundle_manifest.json"), manifestValue);
  writeText(path.join(evidenceDir, "rc1_bundle_manifest.md"), bundleManifestMarkdown(manifestValue));
  writeJson(path.join(evidenceDir, "rc1_bundle_checksums.json"), checksums(root));

  writeJson(p(root, "evals", "reports", "rc1_openai_scope_bundle_report.json"), report);
  writeText(p(root, "evals", "reports", "rc1_openai_scope_bundle_report.md"), reportMarkdown(report));
  writeJson(p(root, "evals", "reports", "rc1_evidence_lineage_report.json"), { status: "pass", stage: STAGE, lineage });
  writeText(p(root, "evals", "reports", "rc1_evidence_lineage_report.md"), lineageMarkdown(lineage));
  writeJson(p(root, "evals", "reports", "rc1_claim_boundary_report.json"), boundary);
  writeText(p(root, "evals", "reports", "rc1_claim_boundary_report.md"), boundaryMarkdown(boundary));
  writeJson(p(root, "evals", "reports", "rc1_gate_report.json"), gateReportSkeleton());
  writeText(p(root, "evals", "reports", "rc1_gate_report.md"), reportMarkdown(report));
  writeText(p(root, "evals", "suites", "rc1_openai_scope_evidence_bundle.yaml"), `id: rc1_openai_scope_evidence_bundle\nstage: ${STAGE}\nmode: no_execution_evidence_bundle\nexpected_next_stage: ${readiness.recommended_next_stage}\n`);

  writeText(p(root, "docs", "rc1_openai_scope_bundle.md"), reportMarkdown(report));
  writeText(p(root, "docs", "rc1_evidence_lineage.md"), lineageMarkdown(lineage));
  writeText(p(root, "docs", "rc1_claim_boundary.md"), boundaryMarkdown(boundary));
  writeText(p(root, "docs", "rc1_remaining_blockers.md"), docsText("RC1 Remaining Blockers", blocker.remaining_blockers.map((item) => `\`${item.id}\` (${item.priority}/${item.category}): ${item.reason}`)));
  writeText(p(root, "docs", "rc1_not_stable_notice.md"), docsText("RC1 Not Stable Notice", [
    notice.message,
    "Release-gated, production-ready, production-monitored, provider-diverse, provider-verified, adapter, local-model, integration, and benchmark-backed claims remain blocked."
  ]));
  writeText(p(root, "docs", "next_release_gate_actual_plan.md"), docsText("Next Release Gate Actual Plan", [
    `Recommended next stage: \`${readiness.recommended_next_stage}\`.`,
    "Use the RC1 OpenAI-only bundle as input for a release gate dry-run first. Do not execute a stable release gate in this bundle stage."
  ]));
  writeText(p(root, "docs", "next_strict_provider_diverse_path.md"), docsText("Next Strict Provider-diverse Path", [
    "Strict provider-diverse rc.1 remains blocked until local runtime or second-provider evidence exists.",
    "Prepare vLLM/Ollama localhost endpoint or second provider canary path before changing provider-diversity claims."
  ]));
  writeText(p(root, "docs", "next_local_canary_plan.md"), docsText("Next Local Canary Plan", [
    "Prepare a localhost-only vLLM or Ollama endpoint.",
    "Run local no-tool canary only after explicit endpoint readiness is available."
  ]));
  writeText(p(root, "docs", "next_telemetry_connection_plan.md"), docsText("Next Telemetry Connection Plan", [
    "Telemetry remains blocked by approval and sink credentials.",
    "Do not claim production monitoring before live telemetry receipt and anomaly-response evidence exists."
  ]));

  writeText(p(root, "README.md"), readmeText());
  writeText(p(root, "release", "release_gate.yaml"), releaseGateYaml());
  writeText(p(root, "release", "release_blocker_priority.yaml"), blockerPriorityYaml(blocker));
  writeText(p(root, "release", "owner_action_matrix.yaml"), ownerActionMatrixYaml());
  writeText(p(root, "release", "beta_release_blockers.yaml"), betaReleaseBlockersYaml(blocker));
  writeText(p(root, "adapters", "provider_capability_matrix.yaml"), providerCapabilityMatrixYaml());
  writeText(p(root, "release", "claim_ladder.md"), ensureClaimLadder(root));
  writeText(p(root, "docs", "beta_entry_criteria.md"), docsText("Beta Entry Criteria", [
    `Current stage: \`${STAGE}\`.`,
    "OpenAI-only rc.1 evidence bundle is drafted from existing validated evidence.",
    "`containment-verified` remains allowed for beta containment scope.",
    "Stable, release, production, telemetry, provider-diversity, local-model, provider-verification, adapter, integration, and benchmark-backed claims remain blocked."
  ]));
  writeText(p(root, "session_handoff_2026-05-22.md"), handoffText(report, readiness));
}

export function buildRc1OpenAiScopeBundleArtifacts(root = resolveRoot()) {
  const containmentDecision = readIfExists(root, "evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json");
  const reevaluation = readIfExists(root, "evidence/beta-release-blocker-p0-p1-reevaluation/rc1_readiness_assessment.json");
  if (containmentDecision?.containment_verified_allowed !== true) {
    throw new Error("containment-verified decision must be approved before rc.1 OpenAI-scope bundle");
  }
  if (reevaluation?.openai_only_rc1_possible !== true) {
    throw new Error("release blocker reevaluation must allow OpenAI-only rc.1 candidate before bundle");
  }

  const summary = openaiScopeSummary();
  const index = evidenceIndex(root);
  const lineage = evidenceLineage();
  const boundary = rc1ClaimBoundary();
  const blocker = blockerSnapshot();
  const readiness = releaseReadinessAssessment();
  const notice = notStableNotice();
  const report = rc1BundleReport(root, summary, index, lineage, boundary, readiness, blocker);
  const values = { summary, index, lineage, boundary, blocker, readiness, notice, report };
  writeArtifacts(root, values);
  return values;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolveRoot();
  const artifacts = buildRc1OpenAiScopeBundleArtifacts(root);
  console.log(JSON.stringify(artifacts.report, null, 2));
}
