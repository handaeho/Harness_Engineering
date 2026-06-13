import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "./file_walk.mjs";

export const RELEASE_GRADE_PROVIDER_STAGE = "v2.0.0-release-grade-provider-verified-gate";
export const RELEASE_GRADE_ADAPTER_STAGE = "v2.0.0-release-grade-adapter-vllm-preflight";
export const RELEASE_GRADE_OLLAMA_ADAPTER_STAGE = "v2.0.0-release-grade-adapter-ollama-preflight";
export const SOURCE_LEDGER_REPORT = "evidence/release-grade-source-ledger/release_grade_source_ledger_report.json";
export const PROVIDER_GATE_DIR = "evidence/release-grade-provider-verified-gate";
export const ADAPTER_PREFLIGHT_DIR = "evidence/release-grade-adapter-vllm-preflight";
export const ADAPTER_OLLAMA_PREFLIGHT_DIR = "evidence/release-grade-adapter-ollama-preflight";
export const RELEASE_GRADE_ADAPTER_COVERAGE_REPORT = "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json";
export const LEGACY_ADAPTER_COVERAGE_REPORT = "evidence/post-export-adapter-checked-coverage-completion/adapter_checked_coverage_completion_report.json";

const REQUIRED_SOURCE_IDS = [
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

const MAINTAINED_ALLOWED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-export-active-provider-lanes-verified",
  "post-export-active-adapters-checked",
  "post-export-active-scoped-production-ready",
  "post-export-active-scoped-stable",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const BLOCKED_BARE_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

export function resolveRoot() {
  const repoRoot = process.cwd();
  return process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(repoRoot, process.argv[2])
    : path.basename(repoRoot) === "harness-core"
      ? repoRoot
      : path.resolve(repoRoot, "harness-core");
}

function p(root, relPath) {
  return path.join(root, ...relPath.split("/"));
}

function exists(root, relPath) {
  return fs.existsSync(p(root, relPath));
}

function readJsonIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function readTextIfExists(root, relPath) {
  const file = p(root, relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
}

function writeJsonRel(root, relPath, value) {
  writeJson(p(root, relPath), value);
}

function writeTextRel(root, relPath, value) {
  writeText(p(root, relPath), value);
}

function source(root, relPath) {
  const json = relPath.endsWith(".json") ? readJsonIfExists(root, relPath) : null;
  return {
    path: relPath,
    exists: exists(root, relPath),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function statusIsPass(root, relPath) {
  const record = readJsonIfExists(root, relPath);
  return record?.status === "pass";
}

function boolInRecord(root, relPath, key, expected = true) {
  const record = readJsonIfExists(root, relPath);
  return record?.[key] === expected;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function writeUnresolved(root, dir, stage, items) {
  writeJsonRel(root, `${dir}/unresolved_items.json`, {
    status: items.length === 0 ? "pass" : "hold",
    stage,
    unresolved_items_count: items.length,
    unresolved_items: items
  });
}

function providerVerifiedAllowedByGate(root) {
  const report = readJsonIfExists(root, `${PROVIDER_GATE_DIR}/release_grade_provider_verified_gate_report.json`);
  return report?.status === "pass" && report?.provider_verified_allowed === true;
}

function claimStateForProviderGate(root) {
  const providerVerifiedAllowed = providerVerifiedAllowedByGate(root);
  return {
    providerVerifiedAllowed,
    allowedClaims: providerVerifiedAllowed ? [...MAINTAINED_ALLOWED_CLAIMS, "provider-verified"] : MAINTAINED_ALLOWED_CLAIMS,
    blockedClaims: providerVerifiedAllowed
      ? BLOCKED_BARE_CLAIMS.filter((claim) => claim !== "provider-verified")
      : BLOCKED_BARE_CLAIMS
  };
}

function sourceLedgerStatus(root) {
  const report = readJsonIfExists(root, SOURCE_LEDGER_REPORT);
  const ledger = readJsonIfExists(root, "core/source_authority/release_grade_source_ledger.json");
  const ids = new Set((ledger?.sources || []).map((item) => item.id));
  const missingIds = REQUIRED_SOURCE_IDS.filter((id) => !ids.has(id));
  return {
    path: SOURCE_LEDGER_REPORT,
    report_status: report?.status || "missing_report",
    ledger_exists: Boolean(ledger),
    required_ids_present: missingIds.length === 0,
    missing_ids: missingIds,
    source_count: ledger?.sources?.length || 0
  };
}

function openaiEvidence(root) {
  const noTool = "evidence/beta-provider-canary-openai/provider_canary_report.json";
  const structured = "evidence/beta-structured-output-canary-openai/structured_output_canary_report.json";
  const tool = "evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json";
  const replay = "evidence/beta-openai-canary-replay-suite/suite_replay_summary.json";
  const releaseGradeReplay = "evidence/release-grade-provider-replay-regression/provider_replay_regression_report.json";
  const redaction = "evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json";
  const errorReview = "evidence/release-grade-provider-error-handling/provider_error_handling_report.json";
  const releaseGradeReplayRecord = readJsonIfExists(root, releaseGradeReplay);
  const errorReviewRecord = readJsonIfExists(root, errorReview);
  return {
    lane: "openai_api_lane",
    evidence: {
      no_tool_text: source(root, noTool),
      structured_output: source(root, structured),
      tool_calling: source(root, tool),
      canary_replay_suite: source(root, replay),
      release_grade_replay_regression: source(root, releaseGradeReplay),
      storage_redaction: source(root, redaction),
      provider_error_handling_review: source(root, errorReview)
    },
    behavior_pass: statusIsPass(root, noTool) && boolInRecord(root, noTool, "provider_execution") && boolInRecord(root, noTool, "raw_response_stored", false),
    schema_pass: statusIsPass(root, structured),
    tool_pass: statusIsPass(root, tool),
    replay_regression_pass: releaseGradeReplayRecord?.provider_verified_replay_regression_sufficient === true
      && releaseGradeReplayRecord?.providers?.openai?.status === "pass"
      && releaseGradeReplayRecord?.replay_verified_allowed === false,
    redaction_pass: statusIsPass(root, redaction),
    trace_pass: boolInRecord(root, noTool, "redaction_passed") && (readJsonIfExists(root, noTool)?.trace_events_total || 0) > 0,
    error_handling_pass: errorReviewRecord?.provider_verified_error_handling_sufficient === true
      && errorReviewRecord?.providers?.openai?.status === "pass"
  };
}

function geminiEvidence(root) {
  const noTool = "evidence/beta-provider-canary-gemini/gemini_provider_canary_report.json";
  const structured = "evidence/beta-structured-output-canary-gemini/structured_output_canary_report.json";
  const tool = "evidence/beta-tool-calling-canary-gemini/tool_calling_canary_report.json";
  const assetPack = "evidence/beta-provider-canary-gemini/gemini_runtime_asset_pack_report.json";
  const releaseGradeReplay = "evidence/release-grade-provider-replay-regression/provider_replay_regression_report.json";
  const errorReview = "evidence/release-grade-provider-error-handling/provider_error_handling_report.json";
  const releaseGradeReplayRecord = readJsonIfExists(root, releaseGradeReplay);
  const errorReviewRecord = readJsonIfExists(root, errorReview);
  return {
    lane: "native_gemini_api_lane",
    evidence: {
      no_tool_text: source(root, noTool),
      structured_output: source(root, structured),
      tool_calling: source(root, tool),
      runtime_asset_pack: source(root, assetPack),
      release_grade_replay_regression: source(root, releaseGradeReplay),
      provider_error_handling_review: source(root, errorReview)
    },
    behavior_pass: statusIsPass(root, noTool) && boolInRecord(root, noTool, "provider_execution"),
    schema_pass: statusIsPass(root, structured),
    tool_pass: statusIsPass(root, tool),
    replay_regression_pass: releaseGradeReplayRecord?.provider_verified_replay_regression_sufficient === true
      && releaseGradeReplayRecord?.providers?.gemini?.status === "pass"
      && releaseGradeReplayRecord?.replay_verified_allowed === false,
    redaction_pass: boolInRecord(root, noTool, "redaction_passed") && boolInRecord(root, noTool, "raw_response_stored", false),
    trace_pass: (readJsonIfExists(root, noTool)?.trace_events_total || 0) > 0,
    error_handling_pass: errorReviewRecord?.provider_verified_error_handling_sufficient === true
      && errorReviewRecord?.providers?.gemini?.status === "pass"
  };
}

function ollamaEvidence(root) {
  const finalGate = "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json";
  const structured = "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json";
  const tool = "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json";
  const replay = "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json";
  const redaction = "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json";
  return {
    lane: "ollama_qwen3_local_lane",
    evidence: {
      local_model_final_gate: source(root, finalGate),
      structured_output: source(root, structured),
      tool_calling_mock: source(root, tool),
      replay_regression: source(root, replay),
      storage_redaction: source(root, redaction)
    },
    behavior_pass: statusIsPass(root, finalGate) && boolInRecord(root, finalGate, "local_model_verified_allowed"),
    schema_pass: statusIsPass(root, structured),
    tool_pass: statusIsPass(root, tool),
    replay_regression_pass: statusIsPass(root, replay),
    redaction_pass: statusIsPass(root, redaction),
    trace_pass: true,
    error_handling_pass: statusIsPass(root, "evidence/post-stable-local-redteam-bounded-smoke/local_redteam_bounded_smoke_report.json")
  };
}

function laneBlockers(lane) {
  const blockers = [];
  for (const [field, id] of [
    ["behavior_pass", "provider_behavior_missing"],
    ["schema_pass", "schema_roundtrip_missing"],
    ["tool_pass", "tool_roundtrip_missing"],
    ["replay_regression_pass", "replay_regression_missing"],
    ["redaction_pass", "redaction_result_missing"],
    ["trace_pass", "trace_result_missing"],
    ["error_handling_pass", "provider_error_handling_missing"]
  ]) {
    if (!lane[field]) {
      blockers.push({
        id: `${lane.lane}_${id}`,
        lane: lane.lane,
        status: "hold",
        reason: `${field} is not established at release-grade provider verification strength.`
      });
    }
  }
  return blockers;
}

function providerReport(root) {
  const sourceLedger = sourceLedgerStatus(root);
  const openai = openaiEvidence(root);
  const gemini = geminiEvidence(root);
  const ollama = ollamaEvidence(root);
  const checks = [];

  addCheck(checks, "release-grade source ledger passes", sourceLedger.report_status === "pass" && sourceLedger.required_ids_present, sourceLedger);
  for (const lane of [openai, gemini, ollama]) {
    addCheck(checks, `${lane.lane} provider behavior`, lane.behavior_pass, lane.evidence);
    addCheck(checks, `${lane.lane} schema result`, lane.schema_pass, lane.evidence);
    addCheck(checks, `${lane.lane} tool result`, lane.tool_pass, lane.evidence);
    addCheck(checks, `${lane.lane} replay regression result`, lane.replay_regression_pass, lane.evidence);
    addCheck(checks, `${lane.lane} redaction result`, lane.redaction_pass, lane.evidence);
    addCheck(checks, `${lane.lane} trace result`, lane.trace_pass, lane.evidence);
    addCheck(checks, `${lane.lane} error handling result`, lane.error_handling_pass, lane.evidence);
  }

  const blockers = [
    ...(sourceLedger.report_status === "pass" && sourceLedger.required_ids_present ? [] : [{
      id: "release_grade_source_ledger_not_passed",
      lane: "source_authority",
      status: "hold",
      reason: "Official source authority ledger must pass before provider claim evaluation."
    }]),
    ...laneBlockers(openai),
    ...laneBlockers(gemini),
    ...laneBlockers(ollama)
  ];
  const pass = blockers.length === 0;
  const status = pass ? "pass" : "hold";
  return {
    candidate_id: "release-grade-provider-verified-2026-06-11",
    status,
    stage: RELEASE_GRADE_PROVIDER_STAGE,
    generated_at: new Date().toISOString(),
    claim_update_rule: "Only status=pass may add provider-verified to allowed_claims; hold or blocked keeps the bare claim blocked.",
    providers: {
      openai,
      gemini,
      ollama
    },
    evidence_inputs: {
      source_ledger: sourceLedger,
      prior_provider_verified_completion: source(root, "evidence/post-export-provider-verified-coverage-completion/provider_verified_coverage_completion_report.json"),
      prior_provider_verified_final_gate: source(root, "evidence/post-export-provider-verified-final-gate/provider_verified_final_gate_report.json")
    },
    live_execution: {
      new_openai_provider_call: false,
      new_gemini_provider_call: false,
      new_local_model_execution: false,
      telemetry_sink_write: false,
      approval_required_for_new_live_calls: true
    },
    redaction_result: {
      status: [openai.redaction_pass, gemini.redaction_pass, ollama.redaction_pass].every(Boolean) ? "pass" : "hold",
      raw_request_storage_allowed: false,
      raw_response_storage_allowed: false,
      secret_storage_allowed: false
    },
    schema_result: {
      status: [openai.schema_pass, gemini.schema_pass, ollama.schema_pass].every(Boolean) ? "pass" : "hold"
    },
    tool_result: {
      status: [openai.tool_pass, gemini.tool_pass, ollama.tool_pass].every(Boolean) ? "pass" : "hold"
    },
    trace_result: {
      status: [openai.trace_pass, gemini.trace_pass, ollama.trace_pass].every(Boolean) ? "pass" : "hold",
      otel_mapping_source: "core/source_authority/release_grade_source_ledger.json#RGS-OTEL-GENAI",
      langfuse_mapping_source: "core/source_authority/release_grade_source_ledger.json#RGS-LANGFUSE-TRACING"
    },
    checks,
    blockers,
    unresolved_items_count: blockers.length,
    allowed_claims: pass ? [...MAINTAINED_ALLOWED_CLAIMS, "provider-verified"] : MAINTAINED_ALLOWED_CLAIMS,
    blocked_claims: pass ? BLOCKED_BARE_CLAIMS.filter((claim) => claim !== "provider-verified") : BLOCKED_BARE_CLAIMS,
    provider_verified_allowed: pass,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false
  };
}

export function checkReleaseGradeProviderVerifiedGate(root) {
  const report = providerReport(root);
  writeJsonRel(root, `${PROVIDER_GATE_DIR}/release_grade_provider_verified_gate_report.json`, report);
  writeJsonRel(root, `${PROVIDER_GATE_DIR}/provider_gate_claim_boundary.json`, {
    status: report.status,
    stage: report.stage,
    provider_verified_allowed: report.provider_verified_allowed,
    allowed_claims: report.allowed_claims,
    blocked_claims: report.blocked_claims,
    claim_update_rule: report.claim_update_rule
  });
  writeUnresolved(root, PROVIDER_GATE_DIR, report.stage, report.blockers);
  writeJsonRel(root, "evals/reports/release_grade_provider_verified_gate_report.json", report);
  writeTextRel(root, "evals/reports/release_grade_provider_verified_gate_report.md", `# Release Grade Provider Gate

Status: ${report.status}

- Candidate: ${report.candidate_id}
- Provider-verified allowed: ${report.provider_verified_allowed}
- Blockers: ${report.blockers.length}
- New live execution: false
- Telemetry sink write: false
- Claim rule: ${report.claim_update_rule}
`);
  return report;
}

function adapterPreflightReport(root) {
  const claimState = claimStateForProviderGate(root);
  const sourceLedger = sourceLedgerStatus(root);
  const vllmAdapter = readTextIfExists(root, "adapters/local/vllm/adapter.yaml");
  const vllmRequired = [
    "local server request and response roundtrip",
    "tool parser compatibility",
    "structured output decoding behavior",
    "selected model chat template compatibility"
  ];
  const vllmRequirementsPresent = vllmRequired.every((term) => vllmAdapter.includes(term));
  const vllmExecutionEvidence = [
    "evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json",
    "evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json",
    "evals/reports/vllm_no_tool_canary_check_report.json",
    "evals/reports/vllm_adapter_conformance_check_report.json"
  ].filter((relPath) => exists(root, relPath)).map((relPath) => source(root, relPath));
  const releaseGradeCoverageCompletion = readJsonIfExists(root, RELEASE_GRADE_ADAPTER_COVERAGE_REPORT);
  const legacyCoverageCompletion = readJsonIfExists(root, LEGACY_ADAPTER_COVERAGE_REPORT);
  const coverageCompletion = releaseGradeCoverageCompletion || legacyCoverageCompletion;
  const coverageCompletionSource = releaseGradeCoverageCompletion
    ? source(root, RELEASE_GRADE_ADAPTER_COVERAGE_REPORT)
    : source(root, LEGACY_ADAPTER_COVERAGE_REPORT);
  const openaiAdapter = exists(root, "adapters/api/openai/adapter.yaml");
  const geminiAdapter = exists(root, "adapters/api/gemini/adapter.yaml");
  const ollamaAdapter = exists(root, "adapters/local/ollama/adapter.yaml");
  const vllmAdapterExists = exists(root, "adapters/local/vllm/adapter.yaml");
  const vllmExecuted = vllmExecutionEvidence.some((entry) => entry.status === "pass");
  const blockers = [];

  if (sourceLedger.report_status !== "pass" || !sourceLedger.required_ids_present) {
    blockers.push({
      id: "release_grade_source_ledger_not_passed",
      lane: "source_authority",
      status: "hold",
      reason: "Adapter preflight requires the official source authority ledger to pass."
    });
  }
  if (!openaiAdapter || !geminiAdapter || !ollamaAdapter || !vllmAdapterExists) {
    blockers.push({
      id: "adapter_manifest_missing",
      lane: "all_adapters",
      status: "hold",
      reason: "OpenAI, Gemini, Ollama, and vLLM adapter manifests must all exist."
    });
  }
  if (!vllmRequirementsPresent) {
    blockers.push({
      id: "vllm_required_execution_contract_missing",
      lane: "vllm_adapter",
      status: "hold",
      reason: "vLLM adapter manifest must declare model, parser, schema, and roundtrip verification requirements."
    });
  }
  if (!vllmExecuted) {
    blockers.push({
      id: "vllm_execution_required_for_bare_adapter_checked",
      lane: "vllm_adapter",
      status: "hold",
      reason: "vLLM remains execution-required for bare adapter-checked; no vLLM execution evidence was found."
    });
  }
  if (coverageCompletion?.ready_for_adapter_checked_final_gate !== true) {
    blockers.push({
      id: "adapter_coverage_completion_not_ready",
      lane: "all_adapters",
      status: "hold",
      reason: "Existing adapter coverage completion report is not ready for the final adapter gate."
    });
  }

  const pass = blockers.length === 0;
  return {
    candidate_id: "release-grade-adapter-vllm-preflight-2026-06-11",
    status: pass ? "pass" : "hold",
    stage: RELEASE_GRADE_ADAPTER_STAGE,
    generated_at: new Date().toISOString(),
    vllm_policy: "execution_required_for_bare_adapter_checked",
    source_ledger: sourceLedger,
    coverage_matrix: {
      openai_adapter_exists: openaiAdapter,
      gemini_adapter_exists: geminiAdapter,
      ollama_adapter_exists: ollamaAdapter,
      vllm_adapter_exists: vllmAdapterExists,
      vllm_requirements_present: vllmRequirementsPresent,
      vllm_execution_evidence: vllmExecutionEvidence,
      adapter_coverage_completion_source: coverageCompletionSource,
      adapter_coverage_completion_status: coverageCompletion?.status || "missing"
    },
    blockers,
    unresolved_items_count: blockers.length,
    live_execution: {
      new_openai_provider_call: false,
      new_gemini_provider_call: false,
      new_local_model_execution: false,
      vllm_endpoint_probe: false,
      telemetry_sink_write: false,
      approval_required_for_vllm_execution: true
    },
    allowed_claims: claimState.allowedClaims,
    blocked_claims: claimState.blockedClaims,
    provider_verified_allowed: claimState.providerVerifiedAllowed,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false
  };
}

export function checkReleaseGradeAdapterVllmPreflight(root) {
  const report = adapterPreflightReport(root);
  writeJsonRel(root, `${ADAPTER_PREFLIGHT_DIR}/release_grade_adapter_vllm_preflight_report.json`, report);
  writeJsonRel(root, `${ADAPTER_PREFLIGHT_DIR}/adapter_vllm_claim_boundary.json`, {
    status: report.status,
    stage: report.stage,
    vllm_policy: report.vllm_policy,
    provider_verified_allowed: report.provider_verified_allowed,
    adapter_checked_allowed: false,
    allowed_claims: report.allowed_claims,
    blocked_claims: report.blocked_claims
  });
  writeUnresolved(root, ADAPTER_PREFLIGHT_DIR, report.stage, report.blockers);
  writeJsonRel(root, "evals/reports/release_grade_adapter_vllm_preflight_report.json", report);
  writeTextRel(root, "evals/reports/release_grade_adapter_vllm_preflight_report.md", `# Release Grade Adapter vLLM Preflight

Status: ${report.status}

- Candidate: ${report.candidate_id}
- Adapter-checked allowed: ${report.adapter_checked_allowed}
- vLLM policy: ${report.vllm_policy}
- Blockers: ${report.blockers.length}
- vLLM endpoint probe: false
- Claim boundary: bare adapter claim remains blocked until vLLM execution evidence exists.
`);
  return report;
}

function ollamaArtifactStatus(root, relPath, requiredFlags = {}) {
  const record = readJsonIfExists(root, relPath);
  const checks = [];
  addCheck(checks, "exists", Boolean(record), { path: relPath });
  addCheck(checks, "status pass", record?.status === "pass", {
    status: record?.status || null
  });
  for (const [key, expected] of Object.entries(requiredFlags)) {
    addCheck(checks, `flag:${key}`, record?.[key] === expected, {
      expected,
      actual: record?.[key] ?? null
    });
  }
  return {
    path: relPath,
    exists: Boolean(record),
    status: record?.status || null,
    stage: record?.stage || null,
    checks,
    pass: checks.every((check) => check.status === "pass")
  };
}

function adapterOllamaPreflightReport(root) {
  const claimState = claimStateForProviderGate(root);
  const sourceLedger = sourceLedgerStatus(root);
  const ollamaAdapter = readTextIfExists(root, "adapters/local/ollama/adapter.yaml");
  const ollamaRequired = [
    "selected model capability check",
    "tool calling format roundtrip",
    "structured output schema conformance",
    "local runtime fallback behavior"
  ];
  const ollamaRequirementsPresent = ollamaRequired.every((term) => ollamaAdapter.includes(term));
  const openaiAdapter = exists(root, "adapters/api/openai/adapter.yaml");
  const geminiAdapter = exists(root, "adapters/api/gemini/adapter.yaml");
  const ollamaAdapterExists = exists(root, "adapters/local/ollama/adapter.yaml");
  const vllmAdapterExists = exists(root, "adapters/local/vllm/adapter.yaml");
  const ollamaEvidence = {
    local_model_final_gate: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json",
      { local_model_verified_allowed: true }
    ),
    structured_output_smoke: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json",
      {
        provider: "ollama",
        raw_request_stored: false,
        raw_response_stored: false,
        secrets_logged: false
      }
    ),
    tool_calling_mock_smoke: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json",
      {
        provider: "ollama",
        raw_request_stored: false,
        raw_response_stored: false,
        secrets_logged: false
      }
    ),
    replay_regression_smoke: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json",
      {
        raw_request_stored: false,
        raw_response_stored: false,
        secrets_logged: false
      }
    ),
    redaction_storage_audit: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json",
      {
        raw_request_stored: false,
        raw_response_stored: false,
        secrets_logged: false
      }
    ),
    adapter_conformance: ollamaArtifactStatus(
      root,
      "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json",
      {
        provider: "ollama",
        raw_request_stored: false,
        raw_response_stored: false
      }
    ),
    adapter_conformance_execution: ollamaArtifactStatus(
      root,
      "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json",
      {
        raw_request_stored: false,
        raw_response_stored: false,
        secrets_logged: false
      }
    )
  };
  const blockers = [];

  if (sourceLedger.report_status !== "pass" || !sourceLedger.required_ids_present) {
    blockers.push({
      id: "release_grade_source_ledger_not_passed",
      lane: "source_authority",
      status: "hold",
      reason: "Adapter preflight requires the official source authority ledger to pass."
    });
  }
  if (!openaiAdapter || !geminiAdapter || !ollamaAdapterExists) {
    blockers.push({
      id: "adapter_manifest_missing",
      lane: "version1_ollama_adapter",
      status: "hold",
      reason: "OpenAI, Gemini, and Ollama adapter manifests must exist for the version1 Ollama adapter gate."
    });
  }
  if (!ollamaRequirementsPresent) {
    blockers.push({
      id: "ollama_required_execution_contract_missing",
      lane: "ollama_adapter",
      status: "hold",
      reason: "Ollama adapter manifest must declare model, tool, schema, and local fallback verification requirements."
    });
  }
  for (const [id, artifact] of Object.entries(ollamaEvidence)) {
    if (!artifact.pass) {
      blockers.push({
        id: `ollama_${id}_not_passed`,
        lane: "ollama_adapter",
        status: "hold",
        reason: "Required Ollama adapter evidence is missing or incomplete.",
        detail: artifact
      });
    }
  }

  const pass = blockers.length === 0;
  return {
    candidate_id: "release-grade-adapter-ollama-preflight-2026-06-13",
    status: pass ? "pass" : "hold",
    stage: RELEASE_GRADE_OLLAMA_ADAPTER_STAGE,
    generated_at: new Date().toISOString(),
    adapter_policy: "ollama_adapter_checked_is_version1_release_prerequisite",
    source_ledger: sourceLedger,
    coverage_matrix: {
      openai_adapter_exists: openaiAdapter,
      gemini_adapter_exists: geminiAdapter,
      ollama_adapter_exists: ollamaAdapterExists,
      ollama_requirements_present: ollamaRequirementsPresent,
      ollama_evidence: ollamaEvidence,
      local_vllm_adapter_exists: vllmAdapterExists,
      local_vllm_version2_follow_up: {
        claim: "local-vllm-adapter-checked",
        required_before_version1_release_gated: false,
        status: "deferred_until_version2"
      }
    },
    blockers,
    unresolved_items_count: blockers.length,
    live_execution: {
      new_openai_provider_call: false,
      new_gemini_provider_call: false,
      new_local_model_execution: false,
      ollama_endpoint_probe: false,
      telemetry_sink_write: false,
      approval_required_for_new_local_execution: true
    },
    allowed_claims: claimState.allowedClaims,
    blocked_claims: claimState.blockedClaims,
    provider_verified_allowed: claimState.providerVerifiedAllowed,
    ollama_adapter_checked_candidate_ready: pass,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false
  };
}

export function checkReleaseGradeAdapterOllamaPreflight(root) {
  const report = adapterOllamaPreflightReport(root);
  writeJsonRel(root, `${ADAPTER_OLLAMA_PREFLIGHT_DIR}/release_grade_adapter_ollama_preflight_report.json`, report);
  writeJsonRel(root, `${ADAPTER_OLLAMA_PREFLIGHT_DIR}/adapter_ollama_claim_boundary.json`, {
    status: report.status,
    stage: report.stage,
    adapter_policy: report.adapter_policy,
    provider_verified_allowed: report.provider_verified_allowed,
    ollama_adapter_checked_candidate_ready: report.ollama_adapter_checked_candidate_ready,
    adapter_checked_allowed: false,
    allowed_claims: report.allowed_claims,
    blocked_claims: report.blocked_claims,
    local_vllm_version2_follow_up: report.coverage_matrix.local_vllm_version2_follow_up
  });
  writeUnresolved(root, ADAPTER_OLLAMA_PREFLIGHT_DIR, report.stage, report.blockers);
  writeJsonRel(root, "evals/reports/release_grade_adapter_ollama_preflight_report.json", report);
  writeTextRel(root, "evals/reports/release_grade_adapter_ollama_preflight_report.md", `# Release Grade Adapter Ollama Preflight

Status: ${report.status}

- Candidate: ${report.candidate_id}
- Ollama adapter checked candidate ready: ${report.ollama_adapter_checked_candidate_ready}
- Adapter-checked allowed by this preflight: false
- Version2 follow-up: local-vllm-adapter-checked
- Blockers: ${report.blockers.length}
- Ollama endpoint probe: false
- Claim boundary: adapter-checked remains blocked until the final adapter gate passes.
`);
  return report;
}
