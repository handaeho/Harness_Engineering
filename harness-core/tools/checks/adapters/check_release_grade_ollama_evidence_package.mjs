#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-ollama-evidence-package";
const EVIDENCE_DIR = "release-grade-ollama-evidence-package";
const PROVIDER_GATE =
  "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
const ADAPTER_FINAL_GATE =
  "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json";
const GENERAL_RELEASE_GATE =
  "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json";

const REQUIRED_ARTIFACTS = [
  {
    id: "ollama_adapter_preflight",
    path: "evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json",
    required_status: "pass",
    required_flags: {
      provider_verified_allowed: true,
      ollama_adapter_checked_candidate_ready: true,
      adapter_checked_allowed: false
    }
  },
  {
    id: "ollama_local_model_final_gate",
    path: "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
    required_status: "pass",
    required_flags: {
      local_model_verified_allowed: true
    }
  },
  {
    id: "ollama_structured_output",
    path: "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json",
    required_status: "pass",
    required_flags: {
      provider: "ollama",
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "ollama_tool_calling",
    path: "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json",
    required_status: "pass",
    required_flags: {
      provider: "ollama",
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "ollama_replay_regression",
    path: "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json",
    required_status: "pass",
    required_flags: {
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "ollama_redaction_storage",
    path: "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
    required_status: "pass",
    required_flags: {
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "ollama_adapter_conformance",
    path: "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json",
    required_status: "pass",
    required_flags: {
      provider: "ollama",
      raw_request_stored: false,
      raw_response_stored: false
    }
  },
  {
    id: "ollama_adapter_conformance_execution",
    path: "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
    required_status: "pass",
    required_flags: {
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "adapter_coverage_completion",
    path: "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json",
    required_status: "ready_for_adapter_checked_final_gate",
    required_flags: {
      ready_for_adapter_checked_final_gate: true,
      can_enter_adapter_checked_final_gate: true,
      adapter_checked_allowed: false,
      provider_verified_allowed: true
    }
  },
  {
    id: "adapter_coverage_completion_check",
    path: "evals/reports/release_grade_adapter_coverage_completion_check_report.json",
    required_status: "pass",
    required_flags: {
      ready_for_adapter_checked_final_gate: true,
      adapter_checked_allowed: false
    }
  },
  {
    id: "adapter_checked_final_gate",
    path: "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json",
    required_status: "pass",
    required_flags: {
      provider_verified_allowed: true,
      adapter_checked_allowed: true,
      production_ready_allowed: false,
      stable_allowed: false,
      release_gated_allowed: false
    }
  },
  {
    id: "adapter_checked_final_gate_check",
    path: "evals/reports/release_grade_adapter_checked_final_gate_check_report.json",
    required_status: "pass",
    required_flags: {
      adapter_checked_allowed: true
    }
  },
  {
    id: "general_release_gate_after_adapter",
    path: "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json",
    allowed_statuses: ["hold", "pass"],
    required_flags: {
      provider_verified_allowed: true,
      adapter_checked_allowed: true
    }
  },
  {
    id: "general_release_gate_check",
    path: "evals/reports/release_grade_general_release_gate_check_report.json",
    allowed_statuses: ["hold", "pass"]
  }
];

const SUBMISSION_FILES = [
  "evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json",
  "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
  "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json",
  "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json",
  "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json",
  "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
  "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json",
  "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
  "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json",
  "evals/reports/release_grade_adapter_coverage_completion_check_report.json",
  "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json",
  "evals/reports/release_grade_adapter_checked_final_gate_check_report.json",
  "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json",
  "evals/reports/release_grade_general_release_gate_check_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json",
  "evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json"
];

const FULL_RUN_COMMAND = "npm run ollama-release-grade-evidence-gate";
const MANUAL_RUN_COMMANDS = [
  "npm run check:release-grade-adapter-ollama",
  "npm run run:release-grade-adapter-coverage",
  "npm run check:release-grade-adapter-coverage",
  "npm run run:release-grade-adapter-checked-final",
  "npm run check:release-grade-adapter-checked-final",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-ollama-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-ollama-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync"
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

function readJsonIfExists(relPath) {
  const file = p(...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function valueAt(object, key) {
  return key.split(".").reduce((current, segment) => current?.[segment], object);
}

function artifactStatus(definition) {
  const json = readJsonIfExists(definition.path);
  const checks = [];
  checks.push({
    name: "exists",
    status: json ? "pass" : "fail",
    detail: { path: definition.path }
  });
  if (!json) {
    return {
      id: definition.id,
      path: definition.path,
      exists: false,
      status: null,
      stage: null,
      checks,
      pass: false
    };
  }

  const allowedStatuses = definition.allowed_statuses || [definition.required_status];
  checks.push({
    name: "status allowed",
    status: allowedStatuses.includes(json.status) ? "pass" : "fail",
    detail: { status: json.status, allowed_statuses: allowedStatuses }
  });

  for (const [key, expected] of Object.entries(definition.required_flags || {})) {
    const actual = valueAt(json, key);
    checks.push({
      name: `flag:${key}`,
      status: actual === expected ? "pass" : "fail",
      detail: { expected, actual }
    });
  }

  return {
    id: definition.id,
    path: definition.path,
    exists: true,
    status: json.status || null,
    stage: json.stage || null,
    checks,
    pass: checks.every((check) => check.status === "pass")
  };
}

function generatedAtMs(record) {
  const value = record?.generated_at;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function addCrossCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const artifactResults = REQUIRED_ARTIFACTS.map(artifactStatus);
const failedArtifacts = artifactResults.filter((artifact) => !artifact.pass);
const providerGate = readJsonIfExists(PROVIDER_GATE);
const adapterFinalGate = readJsonIfExists(ADAPTER_FINAL_GATE);
const generalReleaseGate = readJsonIfExists(GENERAL_RELEASE_GATE);
const adapterFinalGeneratedAt = generatedAtMs(adapterFinalGate);
const generalReleaseGeneratedAt = generatedAtMs(generalReleaseGate);
const orderingChecks = [];
addCrossCheck(
  orderingChecks,
  "general release gate refreshed after adapter final gate",
  adapterFinalGeneratedAt !== null
    && generalReleaseGeneratedAt !== null
    && generalReleaseGeneratedAt >= adapterFinalGeneratedAt,
  {
    adapter_final_generated_at: adapterFinalGate?.generated_at || null,
    general_release_generated_at: generalReleaseGate?.generated_at || null
  }
);

const failedOrderingChecks = orderingChecks.filter((check) => check.status !== "pass");
const pass = failedArtifacts.length === 0 && failedOrderingChecks.length === 0;
const providerVerifiedAllowed = providerGate?.status === "pass"
  && providerGate?.provider_verified_allowed === true;
const adapterCheckedAllowed = pass
  && adapterFinalGate?.status === "pass"
  && adapterFinalGate?.adapter_checked_allowed === true;
const generalReleaseAllowed = pass
  && generalReleaseGate?.status === "pass"
  && generalReleaseGate?.production_ready_allowed === true
  && generalReleaseGate?.stable_allowed === true
  && generalReleaseGate?.release_gated_allowed === true
  && generalReleaseGate?.approval_event?.approval_present === true;
const allowedClaimsAfterPass = [
  ...(adapterCheckedAllowed ? ["adapter-checked"] : []),
  ...(generalReleaseAllowed ? ["production-ready", "stable", "release-gated"] : [])
];
const blockedClaims = !pass
  ? ["adapter-checked", "production-ready", "stable", "release-gated", "bare release-gated"]
  : generalReleaseAllowed
    ? ["bare release-gated"]
    : ["production-ready", "stable", "release-gated", "bare release-gated"];
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  purpose: "Evidence package for the version1 Ollama adapter-checked to production-ready/stable/release-gated path.",
  ollama_adapter_evidence_complete: pass,
  provider_verified_allowed: providerVerifiedAllowed,
  adapter_checked_allowed: adapterCheckedAllowed,
  production_ready_allowed: generalReleaseAllowed,
  stable_allowed: generalReleaseAllowed,
  release_gated_allowed: generalReleaseAllowed,
  bare_release_gated_allowed: false,
  local_vllm_version2_follow_up: {
    claim: "local-vllm-adapter-checked",
    required_before_version1_release_gated: false,
    status: "deferred_until_version2"
  },
  required_artifacts: artifactResults,
  ordering_checks: orderingChecks,
  missing_or_incomplete_artifacts: failedArtifacts.map((artifact) => ({
    id: artifact.id,
    path: artifact.path,
    status: artifact.status,
    failed_checks: artifact.checks.filter((check) => check.status !== "pass")
  })),
  stale_or_unordered_artifacts: failedOrderingChecks.map((check) => ({
    id: check.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
    status: "hold",
    failed_check: check
  })),
  claim_promotion_readiness: {
    provider_verified: providerVerifiedAllowed ? "open_by_provider_gate" : "hold",
    adapter_checked: adapterCheckedAllowed ? "open_by_ollama_adapter_checked_final_gate" : "hold",
    general_release: generalReleaseAllowed
      ? "open_by_general_release_gate"
      : adapterCheckedAllowed
        ? "awaiting_explicit_general_release_approval_or_general_gate_pass"
        : "blocked_until_ollama_adapter_checked_passes",
    local_vllm_adapter_checked: "version2_follow_up",
    approval_text_stored: false
  },
  operator_packet: {
    full_run_command: FULL_RUN_COMMAND,
    manual_run_commands: MANUAL_RUN_COMMANDS,
    general_release_gate_refresh_required_after_adapter_checked: true,
    evidence_package_command_must_run_last: false,
    claim_state_sync_command_must_run_after_package: true,
    final_sync_command_must_run_last: true
  },
  submission_files: SUBMISSION_FILES,
  redaction_policy: {
    raw_request_storage_allowed: false,
    raw_response_storage_allowed: false,
    secret_storage_allowed: false
  },
  allowed_claims_after_pass: pass ? allowedClaimsAfterPass : [],
  blocked_claims: blockedClaims,
  next_actions: pass
    ? generalReleaseAllowed
      ? [
        "Review the general release gate decision record and SOR alignment before claiming release-grade general readiness.",
        "Start local-vllm-adapter-checked only as the version2 follow-up."
      ]
      : [
        "Review adapter-checked final gate output.",
        "General release remains blocked unless explicit release approval is present and general-release-grade-gate passes.",
        "After this package passes, run npm run apply:release-grade-claim-state-sync and npm run check:release-grade-claim-state-sync.",
        "After release approval, rerun npm run general-release-grade-gate, npm run check:release-grade-ollama-evidence-package, and the claim-state sync pair."
      ]
    : [
      "Run npm run ollama-release-grade-evidence-gate and inspect the first missing artifact listed in missing_or_incomplete_artifacts.",
      "If running manually, run general-release-grade-gate after adapter-checked final gate and before the first package check.",
      "Rerun npm run check:release-grade-ollama-evidence-package after the adapter and general-gate commands finish."
    ]
};

const unresolvedItems = [
  ...report.missing_or_incomplete_artifacts.map((artifact) => ({
    id: artifact.id,
    lane: "ollama_adapter",
    status: "hold",
    reason: "Required Ollama release-grade evidence artifact is missing or incomplete.",
    path: artifact.path,
    failed_checks: artifact.failed_checks
  })),
  ...report.stale_or_unordered_artifacts.map((artifact) => ({
    id: artifact.id,
    lane: "ollama_adapter",
    status: "hold",
    reason: "Required release-grade evidence artifacts were not generated in the required order.",
    failed_check: artifact.failed_check
  }))
];

const md = `# Release-grade Ollama Evidence Package

Status: ${report.status}

- Ollama adapter evidence complete: ${report.ollama_adapter_evidence_complete}
- Adapter-checked allowed by this package: ${report.adapter_checked_allowed}
- Production-ready allowed by general gate: ${report.production_ready_allowed}
- Stable allowed by general gate: ${report.stable_allowed}
- Release-gated allowed by general gate: ${report.release_gated_allowed}
- local-vllm-adapter-checked: deferred_until_version2
- Missing or incomplete artifacts: ${report.missing_or_incomplete_artifacts.length}
- Stale or unordered artifacts: ${report.stale_or_unordered_artifacts.length}

## Full Command

\`\`\`bash
${FULL_RUN_COMMAND}
\`\`\`

## Manual Command Sequence

${MANUAL_RUN_COMMANDS.map((command, index) => `${index + 1}. \`${command}\``).join("\n")}

## Submit These Files

${SUBMISSION_FILES.map((file) => `- ${file}`).join("\n")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "ollama_evidence_package_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "ollama_evidence_package_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status: report.status,
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeJson(p("evals", "reports", "release_grade_ollama_evidence_package_report.json"), report);
writeText(p("evals", "reports", "release_grade_ollama_evidence_package_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" || report.status === "hold" ? 0 : 1);
