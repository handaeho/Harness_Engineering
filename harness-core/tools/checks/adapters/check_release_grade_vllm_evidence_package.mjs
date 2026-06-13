#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-vllm-evidence-package";
const EVIDENCE_DIR = "release-grade-vllm-evidence-package";
const PROVIDER_GATE =
  "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
const ADAPTER_FINAL_GATE =
  "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json";
const GENERAL_RELEASE_GATE =
  "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json";

const REQUIRED_ARTIFACTS = [
  {
    id: "vllm_operator_env_guard",
    path: "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json",
    required_status: "pass",
    required_flags: {
      provider: "vllm",
      can_enter_vllm_live_evidence_gate: true,
      local_endpoint_probe: false,
      local_model_execution: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false,
      api_key_value_stored: false
    }
  },
  {
    id: "vllm_endpoint_readiness",
    path: "evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_preflight_report.json",
    required_status: "pass",
    required_flags: {
      provider: "vllm",
      can_enter_local_no_tool_canary: true,
      local_endpoint_probe: true,
      local_model_execution: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "vllm_no_tool_canary",
    path: "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json",
    required_status: "pass",
    required_flags: {
      provider: "vllm",
      vllm_no_tool_canary_executed: true,
      vllm_local_server_roundtrip_passed: true,
      local_model_execution: true,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "vllm_no_tool_check",
    path: "evals/reports/vllm_no_tool_canary_check_report.json",
    required_status: "pass"
  },
  {
    id: "vllm_adapter_conformance",
    path: "evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json",
    required_status: "pass",
    required_flags: {
      provider: "vllm",
      local_model_execution: true,
      structured_output_runtime_checked: true,
      tool_parser_runtime_checked: true,
      external_tool_executed: false,
      raw_request_stored: false,
      raw_response_stored: false,
      secrets_logged: false
    }
  },
  {
    id: "vllm_adapter_conformance_check",
    path: "evals/reports/vllm_adapter_conformance_check_report.json",
    required_status: "pass"
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
    id: "adapter_vllm_preflight",
    path: "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json",
    required_status: "pass",
    required_flags: {
      provider_verified_allowed: true,
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
  "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json",
  "evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_preflight_report.json",
  "evidence/post-stable-vllm-endpoint-readiness-preflight/endpoint_probe_summary.json",
  "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json",
  "evals/reports/vllm_no_tool_canary_check_report.json",
  "evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json",
  "evals/reports/vllm_adapter_conformance_check_report.json",
  "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json",
  "evals/reports/release_grade_adapter_coverage_completion_check_report.json",
  "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json",
  "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json",
  "evals/reports/release_grade_adapter_checked_final_gate_check_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json",
  "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json",
  "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json",
  "evals/reports/release_grade_general_release_gate_check_report.json",
  "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json"
];

const OPERATOR_ENV = [
  {
    name: "VLLM_ENDPOINT_URL",
    required: true,
    example: "http://127.0.0.1:8000/v1",
    rule: "Must be a localhost-only OpenAI-compatible base URL with no credentials, query, or hash."
  },
  {
    name: "VLLM_MODEL",
    required: true,
    example: "<exact id from GET /v1/models>",
    rule: "Must match the served model id exactly. Use ASCII quotes only."
  },
  {
    name: "VLLM_AUTH_REQUIRED",
    required: true,
    example: "no",
    rule: "Must be yes or no."
  },
  {
    name: "VLLM_API_KEY",
    required: false,
    example: "<local endpoint token>",
    rule: "Set only when VLLM_AUTH_REQUIRED=yes. The value must never be stored in evidence."
  }
];

const FULL_RUN_COMMAND = "npm run vllm-release-grade-evidence-gate";
const MANUAL_RUN_COMMANDS = [
  "npm run preflight:vllm-operator-env",
  "npm run preflight:vllm-live-canary",
  "npm run canary:vllm-no-tool",
  "npm run check:vllm-no-tool",
  "npm run run:vllm-adapter-conformance",
  "npm run check:vllm-adapter-conformance",
  "npm run check:release-grade-adapter-vllm",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync",
  "npm run check:final-precommit-convergence",
  "npm run general-release-grade-gate",
  "npm run check:release-grade-vllm-evidence-package",
  "npm run apply:release-grade-claim-state-sync",
  "npm run check:release-grade-claim-state-sync",
  "npm run check:final-precommit-convergence"
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

const artifactResults = REQUIRED_ARTIFACTS.map(artifactStatus);
const failedArtifacts = artifactResults.filter((artifact) => !artifact.pass);
const providerGate = readJsonIfExists(PROVIDER_GATE);
const adapterFinalGate = readJsonIfExists(ADAPTER_FINAL_GATE);
const generalReleaseGate = readJsonIfExists(GENERAL_RELEASE_GATE);

function generatedAtMs(record) {
  const value = record?.generated_at;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function addCrossCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const orderingChecks = [];
const adapterFinalGeneratedAt = generatedAtMs(adapterFinalGate);
const generalReleaseGeneratedAt = generatedAtMs(generalReleaseGate);
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
    ? []
    : ["production-ready", "stable", "release-gated", "bare release-gated"];
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  purpose: "Operator-facing evidence package for the version2 local-vllm-adapter-checked to production-ready/stable/release-gated follow-up path.",
  vllm_execution_evidence_complete: pass,
  provider_verified_allowed: providerVerifiedAllowed,
  adapter_checked_allowed: adapterCheckedAllowed,
  production_ready_allowed: generalReleaseAllowed,
  stable_allowed: generalReleaseAllowed,
  release_gated_allowed: generalReleaseAllowed,
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
    adapter_checked: adapterCheckedAllowed ? "open_by_adapter_checked_final_gate" : "hold",
    general_release: generalReleaseAllowed
      ? "open_by_general_release_gate"
      : adapterCheckedAllowed
        ? "awaiting_explicit_general_release_approval_or_general_gate_pass"
        : "blocked_until_adapter_checked_passes",
    approval_text_stored: false
  },
  operator_packet: {
    required_env: OPERATOR_ENV,
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
        "No raw request, raw response, secret, or approval text should be stored in submitted evidence."
      ]
      : [
      "Review adapter-checked final gate output.",
      "General release remains blocked unless explicit release approval is present and general-release-grade-gate passes.",
      "After this package passes, run npm run apply:release-grade-claim-state-sync and npm run check:release-grade-claim-state-sync.",
      "After release approval, rerun npm run general-release-grade-gate, npm run check:release-grade-vllm-evidence-package, and the claim-state sync pair."
    ]
    : [
      "Run npm run vllm-release-grade-evidence-gate with VLLM_ENDPOINT_URL, VLLM_MODEL, and VLLM_AUTH_REQUIRED set.",
      "If the wrapper stops, inspect the first failed artifact listed in missing_or_incomplete_artifacts.",
      "If running manually, run general-release-grade-gate after adapter-checked final gate and before the first package check.",
      "Rerun npm run check:release-grade-vllm-evidence-package after the vLLM and general-gate commands finish."
    ]
};

const unresolvedItems = [
  ...report.missing_or_incomplete_artifacts.map((artifact) => ({
    id: artifact.id,
    lane: "vllm_adapter",
    status: "hold",
    reason: "Required vLLM release-grade evidence artifact is missing or incomplete.",
    path: artifact.path,
    failed_checks: artifact.failed_checks
  })),
  ...report.stale_or_unordered_artifacts.map((artifact) => ({
    id: artifact.id,
    lane: "vllm_adapter",
    status: "hold",
    reason: "Required release-grade evidence artifacts were not generated in the required order.",
    failed_check: artifact.failed_check
  }))
];

const md = `# Release-grade vLLM Evidence Package

Status: ${report.status}

- vLLM execution evidence complete: ${report.vllm_execution_evidence_complete}
- Adapter-checked allowed by this package: ${report.adapter_checked_allowed}
- Missing or incomplete artifacts: ${report.missing_or_incomplete_artifacts.length}
- Stale or unordered artifacts: ${report.stale_or_unordered_artifacts.length}
- General release allowed by general gate: ${report.release_gated_allowed}

## Required Environment

${OPERATOR_ENV.map((item) => `- ${item.name}: ${item.required ? "required" : "conditional"}; ${item.rule}`).join("\n")}

## Full Command

\`\`\`bash
${FULL_RUN_COMMAND}
\`\`\`

## Manual Command Sequence

${MANUAL_RUN_COMMANDS.map((command, index) => `${index + 1}. \`${command}\``).join("\n")}

## Submit These Files

${SUBMISSION_FILES.map((file) => `- ${file}`).join("\n")}
`;

writeJson(p("evidence", EVIDENCE_DIR, "vllm_evidence_package_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "vllm_evidence_package_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status: report.status,
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeJson(p("evals", "reports", "release_grade_vllm_evidence_package_report.json"), report);
writeText(p("evals", "reports", "release_grade_vllm_evidence_package_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" || report.status === "hold" ? 0 : 1);
