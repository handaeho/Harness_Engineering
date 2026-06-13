#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-reinforcement-completion-audit";
const EVIDENCE_DIR = "release-grade-reinforcement-completion-audit";
const BLOCKED_GENERAL_CLAIMS = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const REQUIRED_HARNESS_SOURCE_IDS = [
  "RGS-OPENAI-AGENTS-TRACING",
  "RGS-OPENAI-AGENTS-TOOLS",
  "RGS-GEMINI-FUNCTION-CALLING",
  "RGS-GEMINI-STRUCTURED-OUTPUT",
  "RGS-GEMINI-SAFETY",
  "RGS-GEMINI-OPENAI-COMPAT",
  "RGS-OTEL-GENAI",
  "RGS-LANGFUSE-TRACING",
  "RGS-OWASP-LLM-TOP10-2025",
  "RGS-NIST-AI-600-1"
];
const REQUIRED_PROMPT_SOURCE_IDS = [
  "PSR-OPENAI-AGENTS-TRACING",
  "PSR-OPENAI-AGENTS-TOOLS",
  "PSR-GEMINI-FUNCTION-CALLING",
  "PSR-GEMINI-STRUCTURED-OUTPUT",
  "PSR-GEMINI-SAFETY",
  "PSR-GEMINI-OPENAI-COMPAT",
  "PSR-OTEL-GENAI",
  "PSR-LANGFUSE-TRACING",
  "PSR-OWASP-LLM-TOP10-2025",
  "PSR-NIST-AI-600-1"
];
const PROMPT_PACKAGE_VERSION = ["v", "36"].join("");
const PROMPT_PACKAGE_LABEL = "current prompt-stack package";

const args = process.argv.slice(2);
const rootArg = args.find((arg) => !arg.startsWith("--"));
const repoRoot = process.cwd();
const root = rootArg
  ? path.resolve(repoRoot, rootArg)
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const harnessRoot = path.resolve(root, "..");
const promptRoot = path.join(harnessRoot, "prompt-stack", PROMPT_PACKAGE_VERSION);

function p(...parts) {
  return path.join(root, ...parts);
}

function pp(...parts) {
  return path.join(promptRoot, ...parts);
}

function readJsonIfExists(base, relPath) {
  const file = path.join(base, ...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function readYamlIfExists(base, relPath) {
  const file = path.join(base, ...relPath.split("/"));
  return fs.existsSync(file) && fs.statSync(file).isFile()
    ? parseYaml(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))
    : null;
}

function exists(base, relPath) {
  const file = path.join(base, ...relPath.split("/"));
  return fs.existsSync(file);
}

function source(baseLabel, relPath, record = null) {
  return {
    base: baseLabel,
    path: relPath,
    exists: baseLabel === PROMPT_PACKAGE_LABEL ? exists(promptRoot, relPath) : exists(root, relPath),
    status: record?.status || null,
    stage: record?.stage || null,
    generated_at: record?.generated_at || null
  };
}

function statusOf(condition, holdCondition = false) {
  if (condition) return "complete";
  return holdCondition ? "hold" : "fail";
}

function addRequirement(requirements, id, area, status, summary, evidence, detail = {}) {
  requirements.push({
    id,
    area,
    status,
    summary,
    evidence,
    detail
  });
}

function idsPresent(collection, required) {
  const ids = new Set((collection || []).map((item) => item.id));
  return {
    present: required.filter((id) => ids.has(id)),
    missing: required.filter((id) => !ids.has(id))
  };
}

function claimMembershipMatches(record, claim, expectedOpen, options = {}) {
  const allowed = Array.isArray(record?.allowed_claims) ? record.allowed_claims : [];
  const blocked = Array.isArray(record?.blocked_claims) ? record.blocked_claims : [];
  const requireAllowedClaim = options.requireAllowedClaim !== false;
  if (expectedOpen) {
    return blocked.includes(claim) === false
      && (requireAllowedClaim === false || allowed.includes(claim) === true);
  }
  return allowed.includes(claim) === false && blocked.includes(claim) === true;
}

const currentStateYaml = readYamlIfExists(root, "CURRENT_STATE.yaml");
const currentStateJson = readJsonIfExists(root, "CURRENT_STATE.json");
const finalClaimState = readJsonIfExists(root, "evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json");
const currentStateAlignment = readJsonIfExists(root, "evidence/current-state/current_state_alignment_report.json");
const sourceLedger = readJsonIfExists(root, "core/source_authority/release_grade_source_ledger.json");
const sourceLedgerReport = readJsonIfExists(root, "evidence/release-grade-source-ledger/release_grade_source_ledger_report.json");
const providerGate = readJsonIfExists(root, "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json");
const providerError = readJsonIfExists(root, "evidence/release-grade-provider-error-handling/provider_error_handling_report.json");
const providerReplay = readJsonIfExists(root, "evidence/release-grade-provider-replay-regression/provider_replay_regression_report.json");
const vllmEnvGuard = readJsonIfExists(root, "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json");
const vllmEnvGuardRegression = readJsonIfExists(root, "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_regression_report.json");
const adapterOllamaPreflight = readJsonIfExists(root, "evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json");
const adapterVllmPreflight = readJsonIfExists(root, "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json");
const adapterCoverage = readJsonIfExists(root, "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json");
const adapterFinal = readJsonIfExists(root, "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json");
const generalRelease = readJsonIfExists(root, "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json");
const ollamaPackage = readJsonIfExists(root, "evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json");
const vllmPackage = readJsonIfExists(root, "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json");
const vllmPackageRegression = readJsonIfExists(root, "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_regression_report.json");
const vllmOperatorPacket = readJsonIfExists(root, "evidence/release-grade-vllm-operator-packet/vllm_operator_packet_report.json");
const claimStateSync = readJsonIfExists(root, "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json");
const claimStateSyncCheck = readJsonIfExists(root, "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json");
const finalPrecommit = readJsonIfExists(root, "evidence/harness-core-final-precommit-convergence/final_precommit_convergence_report.json");
const packageJson = readJsonIfExists(root, "package.json");

const promptSourceLedger = readJsonIfExists(promptRoot, "validation/release_grade_runtime_source_ledger.json");
const promptBoundaryTests = readJsonIfExists(promptRoot, "validation/prompt_package_provider_boundary_tests.json");
const promptCurrent = readJsonIfExists(promptRoot, "validation/current_validation_result.json");
const promptAssembled = readJsonIfExists(promptRoot, "records/assembled_bundle_integrity.json");
const promptCodex = readJsonIfExists(promptRoot, "records/codex_runtime_integrity.json");
const promptGemini = readJsonIfExists(promptRoot, "records/gemini_runtime_integrity.json");
const promptSkillBenchmark = readJsonIfExists(
  harnessRoot,
  ["prompt-stack", "_evidence", PROMPT_PACKAGE_VERSION, "validation_runs", "skill_asset_enhancement", "skill_forward_benchmark_result.json"].join("/")
);

const requirements = [];
const harnessSourceIds = idsPresent(sourceLedger?.sources, REQUIRED_HARNESS_SOURCE_IDS);
const promptSourceIds = idsPresent(promptSourceLedger?.sources, REQUIRED_PROMPT_SOURCE_IDS);
const providerVerifiedOpen = providerGate?.status === "pass"
  && providerGate?.provider_verified_allowed === true
  && currentStateYaml?.allowed_claims?.includes("provider-verified")
  && currentStateJson?.allowed_claims?.includes("provider-verified")
  && finalClaimState?.provider_verified_allowed === true
  && !currentStateYaml?.blocked_claims?.includes("provider-verified")
  && !finalClaimState?.blocked_claims?.includes("provider-verified");
const adapterCheckedExpectedOpen = providerGate?.status === "pass"
  && providerGate?.provider_verified_allowed === true
  && adapterFinal?.status === "pass"
  && adapterFinal?.adapter_checked_allowed === true
  && ollamaPackage?.status === "pass"
  && ollamaPackage?.adapter_checked_allowed === true
  && ollamaPackage?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && ollamaPackage?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false;
const generalReleaseExpectedOpen = adapterCheckedExpectedOpen
  && generalRelease?.status === "pass"
  && generalRelease?.approval_event?.approval_present === true
  && generalRelease?.production_ready_allowed === true
  && generalRelease?.stable_allowed === true
  && generalRelease?.release_gated_allowed === true
  && ollamaPackage?.production_ready_allowed === true
  && ollamaPackage?.stable_allowed === true
  && ollamaPackage?.release_gated_allowed === true;
const releaseGradeClaimExpectations = [
  {
    claim: "provider-verified",
    expected_open: providerGate?.status === "pass" && providerGate?.provider_verified_allowed === true,
    final_flag: "provider_verified_allowed",
    require_allowed_claim: true
  },
  {
    claim: "adapter-checked",
    expected_open: adapterCheckedExpectedOpen,
    final_flag: "adapter_checked_allowed",
    require_allowed_claim: true
  },
  {
    claim: "production-ready",
    expected_open: generalReleaseExpectedOpen,
    final_flag: "production_ready_allowed",
    require_allowed_claim: true
  },
  {
    claim: "stable",
    expected_open: generalReleaseExpectedOpen,
    final_flag: "stable_allowed",
    require_allowed_claim: true
  },
  {
    claim: "release-gated",
    expected_open: generalReleaseExpectedOpen,
    final_flag: "release_gated_allowed",
    require_allowed_claim: true
  },
  {
    claim: "bare release-gated",
    expected_open: false,
    final_flag: null,
    require_allowed_claim: false
  }
];
const releaseGradeSorClaimsAligned = releaseGradeClaimExpectations.every((expectation) => {
  return claimMembershipMatches(currentStateYaml, expectation.claim, expectation.expected_open, {
    requireAllowedClaim: expectation.require_allowed_claim
  })
    && claimMembershipMatches(currentStateJson, expectation.claim, expectation.expected_open, {
      requireAllowedClaim: expectation.require_allowed_claim
    })
    && claimMembershipMatches(finalClaimState, expectation.claim, expectation.expected_open, {
      requireAllowedClaim: expectation.require_allowed_claim
    })
    && (expectation.final_flag === null || finalClaimState?.[expectation.final_flag] === expectation.expected_open);
});
const claimStateSyncComplete = claimStateSync?.status === "pass"
  && claimStateSyncCheck?.status === "pass"
  && claimStateSync?.sync_required_after_apply === false
  && claimStateSyncCheck?.unresolved_items_count === 0
  && claimStateSync?.expected_claim_state?.provider_verified_allowed === (providerGate?.status === "pass" && providerGate?.provider_verified_allowed === true)
  && claimStateSync?.expected_claim_state?.adapter_checked_allowed === adapterCheckedExpectedOpen
  && claimStateSync?.expected_claim_state?.production_ready_allowed === generalReleaseExpectedOpen
  && claimStateSync?.expected_claim_state?.stable_allowed === generalReleaseExpectedOpen
  && claimStateSync?.expected_claim_state?.release_gated_allowed === generalReleaseExpectedOpen
  && claimStateSyncCheck?.expected_claim_state?.provider_verified_allowed === claimStateSync?.expected_claim_state?.provider_verified_allowed
  && claimStateSyncCheck?.expected_claim_state?.adapter_checked_allowed === claimStateSync?.expected_claim_state?.adapter_checked_allowed
  && claimStateSyncCheck?.expected_claim_state?.production_ready_allowed === claimStateSync?.expected_claim_state?.production_ready_allowed
  && claimStateSyncCheck?.expected_claim_state?.stable_allowed === claimStateSync?.expected_claim_state?.stable_allowed
  && claimStateSyncCheck?.expected_claim_state?.release_gated_allowed === claimStateSync?.expected_claim_state?.release_gated_allowed;

addRequirement(
  requirements,
  "sor_claim_alignment",
  "harness-core",
  statusOf(providerVerifiedOpen && releaseGradeSorClaimsAligned && currentStateAlignment?.status === "pass"),
  "SOR, final claim state, and current-state alignment agree with release-grade gate evidence for provider, adapter, and general release claims.",
  [
    source("harness-core", "CURRENT_STATE.yaml", currentStateYaml),
    source("harness-core", "CURRENT_STATE.json", currentStateJson),
    source("harness-core", "evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json", finalClaimState),
    source("harness-core", "evidence/current-state/current_state_alignment_report.json", currentStateAlignment)
  ],
  {
    provider_verified_open: providerVerifiedOpen,
    adapter_checked_expected_open: adapterCheckedExpectedOpen,
    general_release_expected_open: generalReleaseExpectedOpen,
    release_grade_sor_claims_aligned: releaseGradeSorClaimsAligned,
    claim_expectations: releaseGradeClaimExpectations
  }
);

addRequirement(
  requirements,
  "claim_state_sync_control",
  "harness-core",
  statusOf(claimStateSyncComplete),
  "Release-grade claim-state sync report and checker prove CURRENT_STATE, JSON SOR, and final claim state match current gate-derived claim expectations.",
  [
    source("harness-core", "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json", claimStateSync),
    source("harness-core", "evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json", claimStateSyncCheck),
    source("harness-core", "docs/workspace/release_grade_claim_state_sync.md"),
    source("harness-core", "evals/suites/release_grade_claim_state_sync.yaml")
  ],
  {
    sync_status: claimStateSync?.status || null,
    sync_check_status: claimStateSyncCheck?.status || null,
    sync_required_after_apply: claimStateSync?.sync_required_after_apply ?? null,
    sync_check_unresolved_items_count: claimStateSyncCheck?.unresolved_items_count ?? null,
    expected_provider_verified_allowed: providerGate?.status === "pass" && providerGate?.provider_verified_allowed === true,
    expected_adapter_checked_allowed: adapterCheckedExpectedOpen,
    expected_general_release_allowed: generalReleaseExpectedOpen,
    sync_expected_claim_state: claimStateSync?.expected_claim_state || null,
    sync_check_expected_claim_state: claimStateSyncCheck?.expected_claim_state || null
  }
);

addRequirement(
  requirements,
  "harness_source_ledger",
  "harness-core",
  statusOf(sourceLedgerReport?.status === "pass" && harnessSourceIds.missing.length === 0),
  "Official release-grade source ledger exists and covers OpenAI, Gemini, OTel, Langfuse, OWASP, and NIST source classes.",
  [
    source("harness-core", "core/source_authority/release_grade_source_ledger.json", sourceLedger),
    source("harness-core", "evidence/release-grade-source-ledger/release_grade_source_ledger_report.json", sourceLedgerReport)
  ],
  {
    source_count: sourceLedger?.sources?.length || 0,
    missing_source_ids: harnessSourceIds.missing
  }
);

addRequirement(
  requirements,
  "provider_verified_gate",
  "harness-core",
  statusOf(providerVerifiedOpen && providerError?.status === "pass" && providerReplay?.status === "pass"),
  "Provider-verified gate passes with provider behavior, schema/tool roundtrip, replay/regression, redaction, trace, and error-handling evidence.",
  [
    source("harness-core", "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json", providerGate),
    source("harness-core", "evidence/release-grade-provider-error-handling/provider_error_handling_report.json", providerError),
    source("harness-core", "evidence/release-grade-provider-replay-regression/provider_replay_regression_report.json", providerReplay)
  ],
  {
    provider_verified_allowed: providerGate?.provider_verified_allowed ?? null,
    blockers: providerGate?.blockers || null
  }
);

addRequirement(
  requirements,
  "adapter_checked_gate_prepared",
  "harness-core",
  statusOf(
    typeof packageJson?.scripts?.["adapter-checked-release-grade-gate"] === "string"
      && packageJson.scripts["adapter-checked-release-grade-gate"].includes("check:release-grade-adapter-ollama")
      && adapterOllamaPreflight?.status === "pass"
      && adapterCoverage
      && adapterFinal,
    true
  ),
  "Adapter-checked gate assets, scripts, and coverage/final-gate reports exist for the version1 Ollama path.",
  [
    source("harness-core", "package.json", packageJson),
    source("harness-core", "evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json", adapterOllamaPreflight),
    source("harness-core", "evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json", adapterVllmPreflight),
    source("harness-core", "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json", adapterCoverage),
    source("harness-core", "evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json", adapterFinal)
  ],
  {
    adapter_checked_allowed: adapterFinal?.adapter_checked_allowed ?? null,
    ollama_preflight_status: adapterOllamaPreflight?.status || null,
    local_vllm_version2_follow_up: ollamaPackage?.local_vllm_version2_follow_up || null
  }
);

addRequirement(
  requirements,
  "local_vllm_version2_follow_up",
  "harness-core",
  statusOf(
    typeof packageJson?.scripts?.["local-vllm-adapter-checked-v2-gate"] === "string"
      && exists(root, "adapters/local/vllm/adapter.yaml")
      && exists(root, "docs/adapters/release_grade_adapter_vllm_preflight.md")
      && ollamaPackage?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
      && ollamaPackage?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false
  ),
  "local-vllm-adapter-checked is declared as the version2 follow-up and is not a version1 release blocker.",
  [
    source("harness-core", "package.json", packageJson),
    source("harness-core", "adapters/local/vllm/adapter.yaml"),
    source("harness-core", "docs/adapters/release_grade_adapter_vllm_preflight.md"),
    source("harness-core", "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json", vllmEnvGuard),
    source("harness-core", "evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_regression_report.json", vllmEnvGuardRegression),
    source("harness-core", "evidence/release-grade-vllm-operator-packet/vllm_operator_packet_report.json", vllmOperatorPacket),
    source("harness-core", "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json", vllmPackage),
    source("harness-core", "evidence/release-grade-vllm-evidence-package/vllm_evidence_package_regression_report.json", vllmPackageRegression)
  ],
  {
    v2_script_present: typeof packageJson?.scripts?.["local-vllm-adapter-checked-v2-gate"] === "string",
    vllm_adapter_manifest_exists: exists(root, "adapters/local/vllm/adapter.yaml"),
    follow_up: ollamaPackage?.local_vllm_version2_follow_up || null,
    current_vllm_package_status: vllmPackage?.status || null
  }
);

addRequirement(
  requirements,
  "general_release_gate",
  "harness-core",
  statusOf(
    generalRelease?.status === "pass"
      && generalRelease?.approval_event?.approval_present === true
      && generalRelease?.production_ready_allowed === true
      && generalRelease?.stable_allowed === true
      && generalRelease?.release_gated_allowed === true,
    generalRelease?.status === "hold"
  ),
  "Bare production-ready/stable/release-gated remain closed until provider-verified, adapter-checked, and explicit release approval all pass.",
  [
    source("harness-core", "evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json", generalRelease)
  ],
  {
    approval_present: generalRelease?.approval_event?.approval_present ?? null,
    adapter_checked_allowed: generalRelease?.adapter_checked_allowed ?? null,
    production_ready_allowed: generalRelease?.production_ready_allowed ?? null,
    stable_allowed: generalRelease?.stable_allowed ?? null,
    release_gated_allowed: generalRelease?.release_gated_allowed ?? null
  }
);

addRequirement(
  requirements,
  "prompt_stack_source_boundary",
  PROMPT_PACKAGE_LABEL,
  statusOf(
    promptSourceLedger?.checked_on === "2026-06-12"
      && promptSourceIds.missing.length === 0
      && Array.isArray(promptBoundaryTests?.tests)
      && promptBoundaryTests.tests.length >= 4
      && promptBoundaryTests.tests.every((test) => test.expected_verdict === "reject")
  ),
  "Current prompt-stack package has official runtime source ledger and provider-boundary tests that reject prompt-package-as-provider-proof claims.",
  [
    source(PROMPT_PACKAGE_LABEL, "validation/release_grade_runtime_source_ledger.json", promptSourceLedger),
    source(PROMPT_PACKAGE_LABEL, "validation/prompt_package_provider_boundary_tests.json", promptBoundaryTests)
  ],
  {
    source_count: promptSourceLedger?.sources?.length || 0,
    missing_source_ids: promptSourceIds.missing,
    boundary_tests: promptBoundaryTests?.tests?.length || 0
  }
);

addRequirement(
  requirements,
  "prompt_stack_runtime_validation",
  PROMPT_PACKAGE_LABEL,
  statusOf(
    promptCurrent?.status === "pass"
      && promptAssembled?.status === "pass"
      && promptCodex?.status === "pass"
      && promptGemini?.status === "pass"
      && promptSkillBenchmark?.status === "pass"
      && promptSkillBenchmark?.cases_passed === promptSkillBenchmark?.cases_total
  ),
  "Current prompt-stack package current, assembled, Codex, Gemini, smoke, and skill-forward validation evidence is passing.",
  [
    source(PROMPT_PACKAGE_LABEL, "validation/current_validation_result.json", promptCurrent),
    source(PROMPT_PACKAGE_LABEL, "records/assembled_bundle_integrity.json", promptAssembled),
    source(PROMPT_PACKAGE_LABEL, "records/codex_runtime_integrity.json", promptCodex),
    source(PROMPT_PACKAGE_LABEL, "records/gemini_runtime_integrity.json", promptGemini),
    {
      base: "prompt-stack",
      path: ["_evidence", PROMPT_PACKAGE_VERSION, "validation_runs", "skill_asset_enhancement", "skill_forward_benchmark_result.json"].join("/"),
      exists: Boolean(promptSkillBenchmark),
      status: promptSkillBenchmark?.status || null,
      generated_at: promptSkillBenchmark?.generated_at || null
    }
  ],
  {
    current_checks: `${promptCurrent?.passed_checks || 0}/${promptCurrent?.total_checks || 0}`,
    codex_checks: `${promptCodex?.passed_checks || 0}/${promptCodex?.total_checks || 0}`,
    gemini_checks: `${promptGemini?.passed_checks || 0}/${promptGemini?.total_checks || 0}`,
    skill_forward_cases: `${promptSkillBenchmark?.cases_passed || 0}/${promptSkillBenchmark?.cases_total || 0}`
  }
);

addRequirement(
  requirements,
  "raw_storage_secret_boundary",
  "cross-cutting",
  statusOf(
    providerGate?.redaction_result?.status === "pass"
      && ollamaPackage?.redaction_policy?.raw_request_storage_allowed === false
      && ollamaPackage?.redaction_policy?.raw_response_storage_allowed === false
      && ollamaPackage?.redaction_policy?.secret_storage_allowed === false,
    ollamaPackage?.status === "hold"
  ),
  "No raw request/response, authorization header, API key value, or unredacted payload is permitted in release-grade evidence.",
  [
    source("harness-core", "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json", providerGate),
    source("harness-core", "evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json", ollamaPackage)
  ],
  {
    provider_redaction_status: providerGate?.redaction_result?.status || null,
    evidence_package_redaction_policy: ollamaPackage?.redaction_policy || null
  }
);

addRequirement(
  requirements,
  "final_precommit_convergence",
  "harness-core",
  statusOf(finalPrecommit?.status === "pass" && finalPrecommit?.commit_ready === true),
  "Final precommit convergence passes without opening stronger bare claims; owner commit approval is still required.",
  [
    source("harness-core", "evidence/harness-core-final-precommit-convergence/final_precommit_convergence_report.json", finalPrecommit)
  ],
  {
    commit_ready: finalPrecommit?.commit_ready ?? null,
    commit_approval_required: finalPrecommit?.commit_approval_required ?? null,
    clean_export_sha256: finalPrecommit?.clean_export_sha256 || null
  }
);

const failed = requirements.filter((item) => item.status === "fail");
const held = requirements.filter((item) => item.status === "hold");
const complete = requirements.filter((item) => item.status === "complete");
const goalComplete = failed.length === 0
  && held.length === 0
  && providerVerifiedOpen
  && ollamaPackage?.adapter_checked_allowed === true
  && generalRelease?.release_gated_allowed === true;
const status = failed.length > 0 ? "fail" : goalComplete ? "pass" : "hold";
const blockers = [
  ...held.map((item) => ({
    id: item.id,
    area: item.area,
    status: "hold",
    reason: item.summary,
    detail: item.detail
  })),
  ...failed.map((item) => ({
    id: item.id,
    area: item.area,
    status: "fail",
    reason: item.summary,
    detail: item.detail
  }))
];

const report = {
  status,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  objective: "prompt-stack and harness-core release-grade reinforcement assets are evidence-gated and claim gates open or close by actual evidence.",
  goal_complete: goalComplete,
  completion_policy: "pass only when all requirements are complete, adapter-checked is opened by Ollama evidence, general release claims are opened by explicit approval-backed gate evidence, and local-vllm-adapter-checked is preserved as the version2 follow-up",
  requirements_total: requirements.length,
  requirements_complete: complete.length,
  requirements_hold: held.length,
  requirements_fail: failed.length,
  requirements,
  blockers,
  claim_state: {
    provider_verified_allowed: providerVerifiedOpen,
    adapter_checked_allowed: ollamaPackage?.adapter_checked_allowed === true,
    production_ready_allowed: generalRelease?.production_ready_allowed === true,
    stable_allowed: generalRelease?.stable_allowed === true,
    release_gated_allowed: generalRelease?.release_gated_allowed === true
  },
  live_execution: {
    performed_by_this_audit: false,
    provider_call: false,
    local_model_execution: false,
    telemetry_sink_write: false
  },
  next_actions: status === "hold"
    ? [
      "Review evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json#claim_promotion_readiness.",
      "Provide explicit general release approval before opening production-ready/stable/release-gated if the gate is still on hold.",
      "Start local-vllm-adapter-checked only after version1 release-gated is complete."
    ]
    : failed.map((item) => `Repair failed requirement: ${item.id}`)
};

const unresolvedItems = blockers.map((blocker, index) => ({
  id: `RGCA-${String(index + 1).padStart(3, "0")}`,
  requirement_id: blocker.id,
  area: blocker.area,
  status: blocker.status,
  reason: blocker.reason,
  detail: blocker.detail
}));

const md = `# Release-grade Reinforcement Completion Audit

Status: ${status}

- Goal complete: ${goalComplete}
- Requirements complete: ${complete.length}/${requirements.length}
- Requirements on hold: ${held.length}
- Requirements failed: ${failed.length}
- Provider-verified allowed: ${report.claim_state.provider_verified_allowed}
- Adapter-checked allowed: ${report.claim_state.adapter_checked_allowed}
- Production-ready allowed: ${report.claim_state.production_ready_allowed}
- Stable allowed: ${report.claim_state.stable_allowed}
- Release-gated allowed: ${report.claim_state.release_gated_allowed}
- Live execution by this audit: false

## Held Or Failed Requirements

${blockers.map((item) => `- ${item.status}: ${item.id} (${item.area})`).join("\n") || "- none"}
`;

writeJson(p("evidence", EVIDENCE_DIR, "release_grade_reinforcement_completion_audit_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "release_grade_reinforcement_completion_audit_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status,
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeJson(p("evals", "reports", "release_grade_reinforcement_completion_audit_report.json"), report);
writeText(p("evals", "reports", "release_grade_reinforcement_completion_audit_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
