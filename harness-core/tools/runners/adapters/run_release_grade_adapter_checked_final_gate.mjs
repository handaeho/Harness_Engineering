#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";

const STAGE = "v2.0.0-release-grade-adapter-checked-final-gate";
const EVIDENCE_DIR = "release-grade-adapter-checked-final-gate";
const PROVIDER_GATE = "evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json";
const ADAPTER_PREFLIGHT = "evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json";
const COVERAGE_COMPLETION = "evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json";
const COVERAGE_CHECK = "evals/reports/release_grade_adapter_coverage_completion_check_report.json";
const CLAIMS_BLOCKED_AFTER_PASS = [
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];
const CLAIMS_BLOCKED_ON_HOLD = [
  "adapter-checked",
  ...CLAIMS_BLOCKED_AFTER_PASS
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

function source(relPath) {
  const json = readJsonIfExists(relPath);
  return {
    path: relPath,
    exists: Boolean(json),
    status: json?.status || null,
    stage: json?.stage || null
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const providerGate = readJsonIfExists(PROVIDER_GATE);
const adapterPreflight = readJsonIfExists(ADAPTER_PREFLIGHT);
const coverage = readJsonIfExists(COVERAGE_COMPLETION);
const coverageCheck = readJsonIfExists(COVERAGE_CHECK);
const checks = [];
addCheck(checks, "provider gate pass", providerGate?.status === "pass"
  && providerGate?.provider_verified_allowed === true, {
  provider_gate_status: providerGate?.status || null,
  provider_verified_allowed: providerGate?.provider_verified_allowed || false
});
addCheck(checks, "coverage completion ready", coverage?.status === "ready_for_adapter_checked_final_gate"
  && coverage?.ready_for_adapter_checked_final_gate === true
  && coverage?.can_enter_adapter_checked_final_gate === true, {
  coverage_status: coverage?.status || null,
  ready_for_adapter_checked_final_gate: coverage?.ready_for_adapter_checked_final_gate || false
});
addCheck(checks, "coverage check pass", coverageCheck?.status === "pass"
  && coverageCheck?.ready_for_adapter_checked_final_gate === true, {
  coverage_check_status: coverageCheck?.status || null
});
addCheck(checks, "adapter ollama preflight pass", adapterPreflight?.status === "pass"
  && adapterPreflight?.provider_verified_allowed === true
  && adapterPreflight?.ollama_adapter_checked_candidate_ready === true
  && adapterPreflight?.adapter_checked_allowed === false
  && adapterPreflight?.unresolved_items_count === 0, {
  adapter_preflight_status: adapterPreflight?.status || null,
  unresolved_items_count: adapterPreflight?.unresolved_items_count ?? null
});
addCheck(checks, "ollama execution evidence observed", coverage?.live_execution?.ollama_execution_evidence_observed === true
  && adapterPreflight?.coverage_matrix?.ollama_evidence?.local_model_final_gate?.status === "pass"
  && adapterPreflight?.coverage_matrix?.ollama_evidence?.adapter_conformance?.status === "pass"
  && adapterPreflight?.coverage_matrix?.ollama_evidence?.adapter_conformance_execution?.status === "pass", {
  coverage_ollama_observed: coverage?.live_execution?.ollama_execution_evidence_observed || false,
  ollama_evidence: adapterPreflight?.coverage_matrix?.ollama_evidence || {}
});
addCheck(checks, "local vllm follow-up is version2", adapterPreflight?.coverage_matrix?.local_vllm_version2_follow_up?.claim === "local-vllm-adapter-checked"
  && adapterPreflight?.coverage_matrix?.local_vllm_version2_follow_up?.required_before_version1_release_gated === false
  && adapterPreflight?.coverage_matrix?.local_vllm_version2_follow_up?.status === "deferred_until_version2", {
  local_vllm_version2_follow_up: adapterPreflight?.coverage_matrix?.local_vllm_version2_follow_up || null
});

const failures = checks.filter((check) => check.status !== "pass");
const pass = failures.length === 0;
const inheritedAllowed = Array.isArray(providerGate?.allowed_claims) ? providerGate.allowed_claims : [];
const allowedClaims = pass
  ? [...new Set([...inheritedAllowed, "adapter-checked"])]
  : inheritedAllowed;
const blockedClaims = pass
  ? CLAIMS_BLOCKED_AFTER_PASS
  : CLAIMS_BLOCKED_ON_HOLD;
const blockers = failures.map((failure) => ({
  id: failure.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
  lane: "adapter_checked_final_gate",
  status: "hold",
  reason: "Adapter-checked final gate prerequisite did not pass.",
  detail: failure.detail
}));
const report = {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  adapter_checked_final_gate_executed: pass,
  provider_verified_allowed: providerGate?.provider_verified_allowed === true,
  adapter_checked_allowed: pass,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  evidence_inputs: {
    provider_gate: source(PROVIDER_GATE),
    adapter_ollama_preflight: source(ADAPTER_PREFLIGHT),
    adapter_coverage_completion: source(COVERAGE_COMPLETION),
    adapter_coverage_completion_check: source(COVERAGE_CHECK)
  },
  live_execution: {
    new_openai_provider_call: false,
    new_gemini_provider_call: false,
    new_local_model_execution_by_this_gate: false,
    telemetry_sink_write: false
  },
  checks,
  blockers,
  unresolved_items_count: blockers.length,
  allowed_claims: allowedClaims,
  blocked_claims: blockedClaims
};
const boundary = {
  status: report.status,
  stage: STAGE,
  provider_verified_allowed: report.provider_verified_allowed,
  adapter_checked_allowed: report.adapter_checked_allowed,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  allowed_claims: allowedClaims,
  blocked_claims: blockedClaims,
  claim_update_rule: "Only status=pass may add bare adapter-checked to allowed_claims; hold keeps adapter-checked blocked."
};
const md = `# Release-grade Adapter-Checked Final Gate

Status: ${report.status}

- Provider-verified allowed: ${report.provider_verified_allowed}
- Adapter-checked allowed: ${report.adapter_checked_allowed}
- Production-ready allowed: false
- Stable allowed: false
- Release-gated allowed: false
- Blockers: ${blockers.length}
`;

writeJson(p("evidence", EVIDENCE_DIR, "release_grade_adapter_checked_final_gate_report.json"), report);
writeText(p("evidence", EVIDENCE_DIR, "release_grade_adapter_checked_final_gate_report.md"), md);
writeJson(p("evidence", EVIDENCE_DIR, "adapter_checked_claim_boundary.json"), boundary);
writeJson(p("evidence", EVIDENCE_DIR, "unresolved_items.json"), {
  status: pass ? "pass" : "hold",
  stage: STAGE,
  unresolved_items_count: blockers.length,
  unresolved_items: blockers
});
writeJson(p("evals", "reports", "release_grade_adapter_checked_final_gate_report.json"), report);
writeText(p("evals", "reports", "release_grade_adapter_checked_final_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" || report.status === "hold" ? 0 : 1);
