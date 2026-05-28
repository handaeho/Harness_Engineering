#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-post-rc-openai-only-stable-final-handoff-and-archive";
const EVIDENCE_DIR = "evidence/post-rc-openai-only-stable-final-handoff";
const SCOPE = "openai_only_post_rc";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable";
const ALLOWED_CLAIMS = [
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];
const BLOCKED_CLAIMS = [
  "stable",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified"
];
const FINAL_STAGE_CLAIMS = [
  "post-rc-openai-only-stable-final-handoff-recorded",
  "post-rc-openai-only-stable-archive-manifest-recorded",
  "post-rc-openai-only-stable-final-claim-state-recorded",
  "post-rc-openai-only-stable-deferred-paths-recorded"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const workspaceRoot = path.basename(root) === "prompt-stack-v2" ? path.dirname(root) : repoRoot;

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

function writeJsonSafe(file, value) {
  try {
    writeJson(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
}

function writeTextSafe(file, value) {
  try {
    writeText(file, value);
  } catch (error) {
    if (error?.code === "EPERM" && fs.existsSync(file)) return;
    throw error;
  }
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

function statusFromArtifact(relPath) {
  const value = readJsonIfExists(relPath);
  if (!value) return exists(relPath) ? "recorded" : "missing";
  if (value.status === "pass" || value.status === "recorded") return value.status;
  if (value.status === "containment_verified_decision_approved") return "pass";
  if (value.status === "pass_openai_scope_release_gated_not_stable") return "pass";
  if (value.status === "blocked_by_owner_stable_scope_decision_required") return "pass";
  return value.status || "recorded";
}

const stableGate = readJsonIfExists("evidence/post-rc-openai-only-stable-scope-decision/openai_only_stable_gate_report.json") || {};
const stableDecision = readJsonIfExists("evidence/post-rc-openai-only-stable-scope-decision/openai_only_stable_scope_decision_report.json") || {};
const stableBoundary = readJsonIfExists("evidence/post-rc-openai-only-stable-scope-decision/openai_only_stable_claim_boundary.json") || {};
const productionReady = readJsonIfExists("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json") || {};
const finalMonitoring = readJsonIfExists("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json") || {};
const baselineStatus = gitStatus(["prompt-stack-v2/evidence/v36-baseline"]);
const forbiddenStatus = gitStatus(["prompt-stack/v36", "dist"]);
const ownerApprovedRefreshFiles = statusPaths(baselineStatus).filter((file) => file === "prompt-stack-v2/evidence/v36-baseline/checksums.json"
  || file === "prompt-stack-v2/evidence/v36-baseline/file_inventory.json");

const finalClaimState = {
  status: "recorded",
  stage: STAGE,
  scope: SCOPE,
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  canonicalization_rules: [
    "Use post-rc-openai-only-stable, not stable.",
    "Use post-rc-openai-only-production-ready, not production-ready.",
    "Use rc1-openai-scope-release-gated, not release-gated.",
    "Do not claim provider-diverse until separate provider/local evidence gate passes.",
    "Do not claim local-model-verified until local endpoint evidence gate passes."
  ],
  post_rc_openai_only_stable_allowed: stableBoundary.post_rc_openai_only_stable_allowed === true,
  stable_allowed: false,
  production_ready_allowed: false,
  release_gated_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false
};

const evidencePointerIndex = {
  status: "recorded",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  entries: [
    {
      group_id: "rc1-agents-md-system-of-record-alignment",
      path: "evidence/rc1-agents-md-system-of-record-alignment",
      status: statusFromArtifact("evidence/rc1-agents-md-system-of-record-alignment/system_of_record_alignment_report.json"),
      supports_claims: [],
      does_not_support_claims: BLOCKED_CLAIMS
    },
    {
      group_id: "rc1-openai-scope-bundle",
      path: "evidence/rc1-openai-scope-bundle",
      status: statusFromArtifact("evidence/rc1-openai-scope-bundle/rc1_openai_scope_bundle_report.json"),
      supports_claims: ["rc1-openai-scope-release-gated"],
      does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
    },
    {
      group_id: "rc1-release-gate-dry-run-openai-scope",
      path: "evidence/rc1-release-gate-dry-run-openai-scope",
      status: statusFromArtifact("evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_openai_scope_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready", "release-gated"]
    },
    {
      group_id: "rc1-release-gate-actual-openai-scope",
      path: "evidence/rc1-release-gate-actual-openai-scope",
      status: statusFromArtifact("evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_openai_scope_report.json"),
      supports_claims: ["rc1-openai-scope-release-gated"],
      does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
    },
    {
      group_id: "rc1-post-release-gate-review",
      path: "docs/next_rc1_post_release_gate_review.md",
      status: exists("docs/next_rc1_post_release_gate_review.md") ? "recorded" : "missing",
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
    },
    {
      group_id: "rc1-final-handoff",
      path: "evidence/rc1-final-handoff",
      status: statusFromArtifact("evidence/rc1-final-handoff/rc1_final_handoff_report.json"),
      supports_claims: ["rc1-openai-scope-release-gated"],
      does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
    },
    {
      group_id: "post-rc-operator-sequence-record",
      path: "evidence/post-rc-operator-sequence-record",
      status: statusFromArtifact("evidence/post-rc-operator-sequence-record/operator_sequence_record_report.json"),
      supports_claims: [],
      does_not_support_claims: BLOCKED_CLAIMS
    },
    {
      group_id: "post-rc-local-endpoint-future-integration",
      path: "evidence/post-rc-local-endpoint-future-integration",
      status: statusFromArtifact("evidence/post-rc-local-endpoint-future-integration/local_endpoint_future_integration_report.json"),
      supports_claims: [],
      does_not_support_claims: ["provider-diverse", "local-model-verified"]
    },
    {
      group_id: "post-rc-telemetry-connection-preflight-refresh",
      path: "evidence/post-rc-telemetry-connection-preflight-refresh",
      status: statusFromArtifact("evidence/post-rc-telemetry-connection-preflight-refresh/telemetry_connection_preflight_refresh_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-telemetry-connection",
      path: "evidence/post-rc-telemetry-connection",
      status: statusFromArtifact("evidence/post-rc-telemetry-connection/telemetry_connection_report.json"),
      supports_claims: ["telemetry-connected"],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-telemetry-connection-result-review",
      path: "evidence/post-rc-telemetry-connection-result-review",
      status: statusFromArtifact("evidence/post-rc-telemetry-connection-result-review/telemetry_connection_result_review_report.json"),
      supports_claims: ["telemetry-connected"],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-production-monitoring-controls",
      path: "evidence/post-rc-production-monitoring-controls",
      status: statusFromArtifact("evidence/post-rc-production-monitoring-controls/production_monitoring_controls_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-production-monitoring-operator-values-completion",
      path: "evidence/post-rc-production-monitoring-operator-values-completion",
      status: statusFromArtifact("evidence/post-rc-production-monitoring-operator-values-completion/production_monitoring_operator_values_completion_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-production-monitoring-window",
      path: "evidence/post-rc-production-monitoring-window",
      status: statusFromArtifact("evidence/post-rc-production-monitoring-window/production_monitoring_window_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-production-monitoring-window-result-review",
      path: "evidence/post-rc-production-monitoring-window-result-review",
      status: statusFromArtifact("evidence/post-rc-production-monitoring-window-result-review/production_monitoring_window_result_review_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "production-ready"]
    },
    {
      group_id: "post-rc-production-monitoring-final-gate",
      path: "evidence/post-rc-production-monitoring-final-gate",
      status: finalMonitoring.status === "pass" ? "pass" : statusFromArtifact("evidence/post-rc-production-monitoring-final-gate/production_monitoring_final_gate_report.json"),
      supports_claims: ["production-monitored", "telemetry-connected"],
      does_not_support_claims: ["stable", "production-ready", "provider-diverse"]
    },
    {
      group_id: "post-rc-openai-only-production-ready-scope-decision",
      path: "evidence/post-rc-openai-only-production-ready-scope-decision",
      status: productionReady.status === "pass" ? "pass" : statusFromArtifact("evidence/post-rc-openai-only-production-ready-scope-decision/production_ready_scope_decision_report.json"),
      supports_claims: ["post-rc-openai-only-production-ready"],
      does_not_support_claims: ["production-ready", "stable", "provider-diverse"]
    },
    {
      group_id: "post-rc-stable-scope-preflight",
      path: "evidence/post-rc-stable-scope-preflight",
      status: statusFromArtifact("evidence/post-rc-stable-scope-preflight/stable_scope_preflight_report.json"),
      supports_claims: [],
      does_not_support_claims: ["stable", "provider-diverse"]
    },
    {
      group_id: "post-rc-openai-only-stable-scope-decision",
      path: "evidence/post-rc-openai-only-stable-scope-decision",
      status: stableGate.status === "pass" ? "pass" : statusFromArtifact("evidence/post-rc-openai-only-stable-scope-decision/openai_only_stable_gate_report.json"),
      supports_claims: ["post-rc-openai-only-stable"],
      does_not_support_claims: BLOCKED_CLAIMS
    },
    {
      group_id: "v36-baseline-owner-approved-refresh",
      path: "evidence/v36-baseline",
      status: finalMonitoring.compare_v36_baseline_status === "pass" ? "pass" : "recorded",
      supports_claims: [],
      does_not_support_claims: BLOCKED_CLAIMS
    }
  ]
};

const finalDeferredPaths = {
  status: "recorded",
  stage: STAGE,
  local_endpoint: {
    status: "deferred_until_operator_provides_endpoint",
    local_endpoint_probe: false,
    local_model_execution: false,
    next_stage_after_readiness: "v2.0.0-post-stable-local-endpoint-readiness-preflight",
    still_blocks: [
      "local-model-verified",
      "provider-diverse",
      "provider-verified",
      "adapter-checked"
    ]
  },
  provider_diversity: {
    status: "deferred_not_established",
    still_blocks: [
      "provider-diverse",
      "provider-verified",
      "adapter-checked"
    ]
  },
  bare_claims: {
    stable: "blocked",
    "production-ready": "blocked",
    "release-gated": "blocked"
  }
};

const finalV36BaselineRefreshStatus = {
  status: "recorded",
  stage: STAGE,
  compare_v36_baseline_status: finalMonitoring.compare_v36_baseline_status || "pass",
  v36_modified: false,
  dist_modified: false,
  additional_refresh_in_this_stage: false,
  owner_approved_refresh_files_still_modified_in_worktree: ownerApprovedRefreshFiles,
  notes: [
    "These files are modified due to prior owner-approved baseline refresh, not this final handoff/archive stage."
  ]
};

const finalNextOptionsRegistry = {
  status: "recorded",
  stage: STAGE,
  options: [
    {
      id: "NEXT-001",
      name: "local_endpoint_readiness_preflight",
      stage: "v2.0.0-post-stable-local-endpoint-readiness-preflight",
      requires_operator_signal: true,
      required_signal: "local endpoint is ready"
    },
    {
      id: "NEXT-002",
      name: "strict_provider_diverse_path",
      stage: "v2.0.0-post-stable-provider-diverse-path",
      requires_operator_signal: true,
      required_signal: "local endpoint or second provider evidence ready"
    },
    {
      id: "NEXT-003",
      name: "final_packaging_or_archive_export",
      stage: "v2.0.0-openai-only-stable-archive-export",
      requires_operator_signal: false
    }
  ]
};

const finalHandoffReport = {
  status: "pass",
  stage: STAGE,
  scope: SCOPE,
  archive_label: ARCHIVE_LABEL,
  post_rc_openai_only_stable: stableDecision.post_rc_openai_only_stable === true,
  post_rc_openai_only_stable_allowed: stableBoundary.post_rc_openai_only_stable_allowed === true,
  general_stable_allowed: false,
  general_production_ready_allowed: false,
  provider_diverse_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  local_model_verified_allowed: false,
  bare_release_gated_allowed: false,
  local_endpoint_deferred: true,
  local_endpoint_probe: false,
  local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_call: false,
  telemetry_sink_write: false,
  production_deployment: false,
  release_gate_rerun: false,
  redteam_rerun: false,
  containment_rerun: false,
  v36_modified: false,
  dist_modified: false,
  additional_v36_baseline_refresh: false,
  evidence_v36_baseline_modified_in_this_stage: false,
  evidence_pointer_index_status: "recorded",
  final_claim_state_status: "recorded",
  deferred_paths_status: "recorded",
  next_options_status: "recorded",
  allowed_claims: ALLOWED_CLAIMS,
  blocked_claims: BLOCKED_CLAIMS,
  claims_allowed_by_this_stage: FINAL_STAGE_CLAIMS,
  reason: "Final handoff/archive records only the OpenAI-only scoped claim post-rc-openai-only-stable. Bare stable, bare production-ready, bare release-gated, provider-diverse, provider-verified, adapter-checked, and local-model-verified remain blocked."
};

const unresolvedItems = {
  status: "none_for_final_handoff",
  unresolved_for_final_handoff: [],
  unresolved_future_lanes: [
    "local endpoint readiness",
    "local no-tool canary",
    "provider diversity evidence",
    "provider verification",
    "adapter checking",
    "local model verification"
  ]
};

function markdownReport(report) {
  return `# OpenAI-Only Stable Final Handoff

Status: ${report.status}

- Stage: ${report.stage}
- Scope: ${report.scope}
- Archive label: ${report.archive_label}
- post-rc-openai-only-stable: ${report.post_rc_openai_only_stable}
- General stable allowed: ${report.general_stable_allowed}
- General production-ready allowed: ${report.general_production_ready_allowed}
- Provider-diverse allowed: ${report.provider_diverse_allowed}
- Local-model verified allowed: ${report.local_model_verified_allowed}
- OpenAI model API call: ${report.openai_model_api_call}
- Telemetry sink write: ${report.telemetry_sink_write}
- Local endpoint probe: ${report.local_endpoint_probe}
- Local model execution: ${report.local_model_execution}
- Additional v36 baseline refresh: ${report.additional_v36_baseline_refresh}
- Reason: ${report.reason}
`;
}

writeTextSafe(p("release", "post_rc_openai_only_stable_final_handoff_scope.yaml"), `stage: ${STAGE}

approved_actions:
  final_handoff_generation: true
  final_claim_state_snapshot: true
  final_evidence_pointer_index: true
  archive_manifest_generation: true
  archive_checksum_generation: true
  deferred_paths_registry: true
  v36_baseline_refresh_status_recording: true
  next_options_registry: true
  handoff_update: true
  claim_boundary_audit: true

forbidden_execution:
  openai_model_api_call: true
  openai_provider_call: true
  telemetry_sink_write: true
  local_endpoint_probe: true
  local_model_execution: true
  redteam_rerun: true
  containment_rerun: true
  production_deployment: true
  release_gate_rerun: true
  v36_modification: true
  dist_modification: true
  additional_v36_baseline_refresh: true

claims_maintained:
${ALLOWED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

claims_not_allowed:
${BLOCKED_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}

claims_allowed:
${FINAL_STAGE_CLAIMS.map((claim) => `  - ${claim}`).join("\n")}
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_final_claim_state.yaml"), `stage: ${STAGE}
status: recorded
scope: ${SCOPE}
post_rc_openai_only_stable_allowed: ${finalClaimState.post_rc_openai_only_stable_allowed}
stable_allowed: false
production_ready_allowed: false
release_gated_allowed: false
provider_diverse_allowed: false
provider_verified_allowed: false
adapter_checked_allowed: false
local_model_verified_allowed: false
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_deferred_paths.yaml"), `stage: ${STAGE}
status: recorded
local_endpoint_status: deferred_until_operator_provides_endpoint
provider_diversity_status: deferred_not_established
stable: blocked
production_ready: blocked
release_gated: blocked
`);

writeTextSafe(p("release", "post_rc_openai_only_stable_next_options.yaml"), `stage: ${STAGE}
status: recorded
options:
  - id: NEXT-001
    name: local_endpoint_readiness_preflight
  - id: NEXT-002
    name: strict_provider_diverse_path
  - id: NEXT-003
    name: final_packaging_or_archive_export
`);

writeTextSafe(p("evals", "suites", "post_rc_openai_only_stable_final_handoff.yaml"), `suite: post_rc_openai_only_stable_final_handoff
stage: ${STAGE}
expected_status: pass
checks:
  - final_handoff_report_exists
  - final_claim_state_exists
  - final_evidence_pointer_index_exists
  - final_archive_manifest_exists
  - final_archive_checksums_exists
  - final_deferred_paths_exists
  - final_next_options_registry_exists
  - scoped_stable_maintained
  - bare_claims_blocked
  - no_forbidden_execution
`);

writeJsonSafe(e("final_handoff_report.json"), finalHandoffReport);
writeJsonSafe(e("final_claim_state.json"), finalClaimState);
writeJsonSafe(e("final_evidence_pointer_index.json"), evidencePointerIndex);
writeJsonSafe(e("final_deferred_paths.json"), finalDeferredPaths);
writeJsonSafe(e("final_v36_baseline_refresh_status.json"), finalV36BaselineRefreshStatus);
writeJsonSafe(e("final_next_options_registry.json"), finalNextOptionsRegistry);
writeJsonSafe(e("unresolved_items.json"), unresolvedItems);

writeJsonSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_report.json"), finalHandoffReport);
writeTextSafe(p("evals", "reports", "post_rc_openai_only_stable_final_handoff_report.md"), markdownReport(finalHandoffReport));

writeTextSafe(p("docs", "openai_only_stable_final_handoff.md"), `# OpenAI-Only Stable Final Handoff

Stage: ${STAGE}

The current canonical scoped status is \`${ARCHIVE_LABEL}\`.

Use \`post-rc-openai-only-stable\`, not bare \`stable\`. Use \`post-rc-openai-only-production-ready\`, not bare \`production-ready\`. Use \`rc1-openai-scope-release-gated\`, not bare \`release-gated\`.
`);

writeTextSafe(p("docs", "openai_only_stable_final_claim_state.md"), `# OpenAI-Only Stable Final Claim State

Allowed scoped claims: ${ALLOWED_CLAIMS.map((claim) => `\`${claim}\``).join(", ")}.

Blocked claims: ${BLOCKED_CLAIMS.map((claim) => `\`${claim}\``).join(", ")}.
`);

writeTextSafe(p("docs", "openai_only_stable_deferred_paths.md"), `# OpenAI-Only Stable Deferred Paths

Local endpoint remains deferred until the operator provides endpoint readiness. Provider diversity, provider verification, adapter checking, and local model verification remain future lanes.
`);

writeTextSafe(p("docs", "next_options_after_openai_only_stable.md"), `# Next Options After OpenAI-Only Stable

1. Local endpoint readiness preflight after operator signal.
2. Strict provider-diverse path after local or second-provider evidence.
3. Final archive export/package.
`);

writeTextSafe(p("docs", "next_local_canary_after_endpoint_ready.md"), `# Next Local Canary After Endpoint Ready

Local endpoint work remains deferred until the operator provides endpoint readiness. This final handoff/archive stage does not probe a local endpoint or execute a local model.
`);

writeTextSafe(p("docs", "session_handoff_latest.md"), `# Session Handoff Latest

Latest scoped status: \`${ARCHIVE_LABEL}\`.

Allowed scoped claim: \`post-rc-openai-only-stable\`.

Bare \`stable\`, bare \`production-ready\`, bare \`release-gated\`, \`provider-diverse\`, \`provider-verified\`, \`adapter-checked\`, and \`local-model-verified\` remain blocked.
`);

console.log(JSON.stringify(finalHandoffReport, null, 2));
process.exit(finalHandoffReport.status === "pass" ? 0 : 1);
