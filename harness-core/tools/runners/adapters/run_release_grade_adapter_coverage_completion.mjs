#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-adapter-coverage-completion";
const EVIDENCE_DIR = "release-grade-adapter-coverage-completion";
const PROVIDER_GATE = "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
const SOURCE_LEDGER = "evidence/release-grade-source-ledger/release_grade_source_ledger_report.json";
const OLLAMA_LOCAL_MODEL_FINAL = "evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json";
const OLLAMA_STRUCTURED = "evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json";
const OLLAMA_TOOL = "evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json";
const OLLAMA_REPLAY = "evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json";
const OLLAMA_REDACTION = "evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json";
const OLLAMA_CONFORMANCE = "evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json";
const OLLAMA_CONFORMANCE_EXECUTION = "evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json";
const DRY_RUN = "evals/reports/adapter_conformance_dry_run.json";
const REQUIRED_ADAPTERS = [
  "openai.api.skeleton",
  "gemini.api.skeleton",
  "ollama.local.skeleton"
];
const CLAIMS_ALLOWED_AFTER_READY = [
  "release-grade-adapter-coverage-completion-ready",
  "ollama-adapter-evidence-accepted-for-adapter-gate",
  "local-vllm-adapter-checked-version2-follow-up-set"
];
const CLAIMS_BLOCKED = [
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
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

function exists(relPath) {
  return fs.existsSync(p(...relPath.split("/")));
}

function source(relPath) {
  const json = relPath.endsWith(".json") ? readJsonIfExists(relPath) : null;
  return {
    path: relPath,
    exists: exists(relPath),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function blocker(id, lane, reason, nextAction, detail = {}) {
  return {
    id,
    lane,
    status: "hold",
    reason,
    next_action: nextAction,
    detail
  };
}

const sourceLedger = readJsonIfExists(SOURCE_LEDGER);
const providerGate = readJsonIfExists(PROVIDER_GATE);
const dryRun = readJsonIfExists(DRY_RUN);
const ollamaLocalModelFinal = readJsonIfExists(OLLAMA_LOCAL_MODEL_FINAL);
const ollamaStructured = readJsonIfExists(OLLAMA_STRUCTURED);
const ollamaTool = readJsonIfExists(OLLAMA_TOOL);
const ollamaReplay = readJsonIfExists(OLLAMA_REPLAY);
const ollamaRedaction = readJsonIfExists(OLLAMA_REDACTION);
const ollama = readJsonIfExists(OLLAMA_CONFORMANCE);
const ollamaConformanceExecution = readJsonIfExists(OLLAMA_CONFORMANCE_EXECUTION);
const adaptersChecked = new Set(Array.isArray(dryRun?.adapters_checked) ? dryRun.adapters_checked : []);
const dryRunCaseResults = Array.isArray(dryRun?.case_results) ? dryRun.case_results : [];
const dryRunByAdapter = Object.fromEntries(REQUIRED_ADAPTERS.map((adapterId) => {
  const cases = dryRunCaseResults.filter((item) => item.adapter_id === adapterId);
  return [adapterId, {
    cases_total: cases.length,
    cases_passed: cases.filter((item) => item.status === "pass").length,
    all_passed: cases.length > 0 && cases.every((item) => item.status === "pass")
  }];
}));

const openaiLane = providerGate?.providers?.openai || {};
const geminiLane = providerGate?.providers?.gemini || {};
const ollamaLane = providerGate?.providers?.ollama || {};
const checks = [];
addCheck(checks, "source ledger pass", sourceLedger?.status === "pass", sourceLedger || {});
addCheck(checks, "provider gate pass", providerGate?.status === "pass" && providerGate?.provider_verified_allowed === true, {
  status: providerGate?.status || null,
  provider_verified_allowed: providerGate?.provider_verified_allowed || false
});
addCheck(checks, "adapter manifests exist", [
  "adapters/api/openai/adapter.yaml",
  "adapters/api/gemini/adapter.yaml",
  "adapters/local/ollama/adapter.yaml"
].every(exists), {});
addCheck(checks, "adapter dry-run pass", dryRun?.status === "pass"
  && REQUIRED_ADAPTERS.every((adapterId) => adaptersChecked.has(adapterId))
  && REQUIRED_ADAPTERS.every((adapterId) => dryRunByAdapter[adapterId].all_passed), {
  dry_run_status: dryRun?.status || null,
  adapters_checked: [...adaptersChecked].sort(),
  dry_run_by_adapter: dryRunByAdapter
});
addCheck(checks, "openai adapter runtime evidence covered by provider gate", openaiLane.behavior_pass === true
  && openaiLane.schema_pass === true
  && openaiLane.tool_pass === true
  && openaiLane.replay_regression_pass === true
  && openaiLane.redaction_pass === true
  && openaiLane.trace_pass === true, openaiLane);
addCheck(checks, "gemini adapter runtime evidence covered by provider gate", geminiLane.behavior_pass === true
  && geminiLane.schema_pass === true
  && geminiLane.tool_pass === true
  && geminiLane.replay_regression_pass === true
  && geminiLane.redaction_pass === true
  && geminiLane.trace_pass === true, geminiLane);
addCheck(checks, "ollama adapter evidence pass", ollamaLocalModelFinal?.status === "pass"
  && ollamaLocalModelFinal?.local_model_verified_allowed === true
  && ollamaStructured?.status === "pass"
  && ollamaTool?.status === "pass"
  && ollamaReplay?.status === "pass"
  && ollamaRedaction?.status === "pass"
  && ollama?.status === "pass"
  && ollamaConformanceExecution?.status === "pass"
  && ollamaLane.behavior_pass === true
  && ollamaLane.schema_pass === true
  && ollamaLane.tool_pass === true
  && ollamaLane.replay_regression_pass === true
  && ollamaLane.redaction_pass === true, {
  local_model_final_gate_status: ollamaLocalModelFinal?.status || null,
  structured_output_status: ollamaStructured?.status || null,
  tool_calling_status: ollamaTool?.status || null,
  replay_regression_status: ollamaReplay?.status || null,
  redaction_status: ollamaRedaction?.status || null,
  ollama_conformance_status: ollama?.status || null,
  ollama_conformance_execution_status: ollamaConformanceExecution?.status || null,
  ollama_provider_lane: ollamaLane
});
addCheck(checks, "raw storage blocked across ollama", ollamaStructured?.raw_request_stored === false
  && ollamaStructured?.raw_response_stored === false
  && ollamaTool?.raw_request_stored === false
  && ollamaTool?.raw_response_stored === false
  && ollamaReplay?.raw_request_stored === false
  && ollamaReplay?.raw_response_stored === false
  && ollamaRedaction?.raw_request_stored === false
  && ollamaRedaction?.raw_response_stored === false
  && ollama?.raw_request_stored === false
  && ollama?.raw_response_stored === false
  && ollamaConformanceExecution?.raw_request_stored === false
  && ollamaConformanceExecution?.raw_response_stored === false, {
  structured_raw_request_stored: ollamaStructured?.raw_request_stored ?? null,
  structured_raw_response_stored: ollamaStructured?.raw_response_stored ?? null,
  tool_raw_request_stored: ollamaTool?.raw_request_stored ?? null,
  tool_raw_response_stored: ollamaTool?.raw_response_stored ?? null,
  replay_raw_request_stored: ollamaReplay?.raw_request_stored ?? null,
  replay_raw_response_stored: ollamaReplay?.raw_response_stored ?? null,
  redaction_raw_request_stored: ollamaRedaction?.raw_request_stored ?? null,
  redaction_raw_response_stored: ollamaRedaction?.raw_response_stored ?? null,
  conformance_raw_request_stored: ollama?.raw_request_stored ?? null,
  conformance_raw_response_stored: ollama?.raw_response_stored ?? null
});
addCheck(checks, "local vllm adapter checked is version2 follow-up", exists("adapters/local/vllm/adapter.yaml"), {
  claim: "local-vllm-adapter-checked",
  required_before_version1_release_gated: false,
  status: "deferred_until_version2"
});

const failures = checks.filter((check) => check.status !== "pass");
const blockers = failures.map((failure) => {
  const id = failure.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  const lane = id.includes("vllm") ? "vllm_adapter"
    : id.includes("openai") ? "openai_adapter"
      : id.includes("gemini") ? "gemini_adapter"
        : id.includes("ollama") ? "ollama_adapter"
          : "adapter_coverage";
  return blocker(
    id,
    lane,
    "Release-grade adapter coverage completion check did not pass.",
    "Run the missing provider or Ollama adapter evidence command and rerun run:release-grade-adapter-coverage.",
    failure.detail
  );
});
const ready = blockers.length === 0;
const report = {
  status: ready ? "ready_for_adapter_checked_final_gate" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  ready_for_adapter_checked_final_gate: ready,
  can_enter_adapter_checked_final_gate: ready,
  adapter_checked_final_gate_not_executed_by_this_report: true,
  adapter_checked_allowed: false,
  provider_verified_allowed: providerGate?.provider_verified_allowed === true,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  evidence_inputs: {
    source_ledger: source(SOURCE_LEDGER),
    provider_gate: source(PROVIDER_GATE),
    adapter_dry_run: source(DRY_RUN),
    ollama_local_model_final_gate: source(OLLAMA_LOCAL_MODEL_FINAL),
    ollama_structured_output: source(OLLAMA_STRUCTURED),
    ollama_tool_calling: source(OLLAMA_TOOL),
    ollama_replay_regression: source(OLLAMA_REPLAY),
    ollama_redaction_storage: source(OLLAMA_REDACTION),
    ollama_adapter_conformance: source(OLLAMA_CONFORMANCE),
    ollama_adapter_conformance_execution: source(OLLAMA_CONFORMANCE_EXECUTION)
  },
  coverage_matrix: {
    openai: {
      adapter_id: "openai.api.skeleton",
      dry_run: dryRunByAdapter["openai.api.skeleton"],
      provider_gate_runtime_coverage: checks.find((item) => item.name === "openai adapter runtime evidence covered by provider gate")?.status || "fail"
    },
    gemini: {
      adapter_id: "gemini.api.skeleton",
      dry_run: dryRunByAdapter["gemini.api.skeleton"],
      provider_gate_runtime_coverage: checks.find((item) => item.name === "gemini adapter runtime evidence covered by provider gate")?.status || "fail"
    },
    ollama: {
      adapter_id: "ollama.local.skeleton",
      dry_run: dryRunByAdapter["ollama.local.skeleton"],
      local_model_final_gate: ollamaLocalModelFinal?.status || "missing",
      structured_output: ollamaStructured?.status || "missing",
      tool_calling: ollamaTool?.status || "missing",
      replay_regression: ollamaReplay?.status || "missing",
      redaction_storage: ollamaRedaction?.status || "missing",
      local_adapter_conformance: ollama?.status || "missing",
      local_adapter_conformance_execution: ollamaConformanceExecution?.status || "missing"
    },
    local_vllm_version2_follow_up: {
      adapter_id: "vllm.local.skeleton",
      adapter_manifest_exists: exists("adapters/local/vllm/adapter.yaml"),
      claim: "local-vllm-adapter-checked",
      required_before_version1_release_gated: false,
      status: "deferred_until_version2"
    },
    common: {
      adapter_dry_run_status: dryRun?.status || "missing",
      required_adapters_checked: REQUIRED_ADAPTERS.every((adapterId) => adaptersChecked.has(adapterId))
    }
  },
  live_execution: {
    new_openai_provider_call: false,
    new_gemini_provider_call: false,
    new_local_model_execution_by_this_report: false,
    ollama_execution_evidence_required: true,
    ollama_execution_evidence_observed: ollamaLocalModelFinal?.status === "pass"
      && ollama?.status === "pass"
      && ollamaConformanceExecution?.status === "pass",
    local_vllm_execution_required_for_version1: false,
    telemetry_sink_write: false
  },
  checks,
  blockers,
  unresolved_items_count: blockers.length,
  allowed_claims: ready ? CLAIMS_ALLOWED_AFTER_READY : [],
  blocked_claims: CLAIMS_BLOCKED
};
const boundary = {
  status: report.status,
  stage: STAGE,
  provider_verified_allowed: report.provider_verified_allowed,
  adapter_checked_allowed: false,
  ready_for_adapter_checked_final_gate: ready,
  allowed_claims: report.allowed_claims,
  blocked_claims: CLAIMS_BLOCKED
};
const md = `# Release-grade Adapter Coverage Completion

Status: ${report.status}

- Ready for adapter-checked final gate: ${ready}
- Provider-verified allowed: ${report.provider_verified_allowed}
- Adapter-checked allowed by this report: false
- Blockers: ${blockers.length}
- Ollama execution evidence observed: ${report.live_execution.ollama_execution_evidence_observed}
- local-vllm-adapter-checked version2 follow-up: deferred_until_version2
`;

writeJson(p("evidence", EVIDENCE_DIR, "release_grade_adapter_coverage_completion_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "release_grade_adapter_coverage_completion_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "release_grade_adapter_coverage_matrix.json"), report.coverage_matrix);
writeJson(p("evidence", EVIDENCE_DIR, "release_grade_adapter_coverage_claim_boundary.json"), boundary);
writeJson(p("evidence", EVIDENCE_DIR, "release_grade_adapter_coverage_gate_report.json"), report);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status: ready ? "pass" : "hold",
  stage: STAGE,
  unresolved_items_count: blockers.length,
  unresolved_items: blockers
});
writeJson(p("evals", "reports", "release_grade_adapter_coverage_completion_report.json"), report);
writeText(p("evals", "reports", "release_grade_adapter_coverage_completion_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "ready_for_adapter_checked_final_gate" || report.status === "hold" ? 0 : 1);
