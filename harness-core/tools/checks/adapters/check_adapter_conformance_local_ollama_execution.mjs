#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-post-stable-adapter-conformance-local-ollama-execution";
const EVIDENCE_DIR = "post-stable-adapter-conformance-local-ollama-execution";
const REQUIRED = [
  "adapter_conformance_local_ollama_execution_report.json",
  "adapter_conformance_local_ollama_mapping_review.json",
  "adapter_conformance_local_ollama_claim_boundary.json",
  "adapter_conformance_local_ollama_blocker_update.json",
  "adapter_conformance_local_ollama_gate_report.json",
  "unresolved_items.json"
];
const BLOCKED_CLAIMS = [
  "local-model-verified",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
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

function e(file) {
  return p("evidence", EVIDENCE_DIR, file);
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
for (const file of REQUIRED) {
  addCheck(checks, `${file} exists`, fs.existsSync(e(file)), {});
}
for (const rel of [
  "release/scopes/post-stable/post_stable_adapter_conformance_local_ollama_execution_scope.yaml",
  "release/claims/post-stable/post_stable_adapter_conformance_local_ollama_execution_claim_boundary.yaml",
  "release/blockers/post-stable/post_stable_adapter_conformance_local_ollama_execution_blocker_update.yaml",
  "evals/suites/post_stable_adapter_conformance_local_ollama_execution.yaml",
  "docs/adapters/adapter_conformance_local_ollama_execution.ko.md"
]) {
  addCheck(checks, `${rel} exists`, fs.existsSync(p(...rel.split("/"))), {});
}

const report = fs.existsSync(e("adapter_conformance_local_ollama_execution_report.json"))
  ? readJson(e("adapter_conformance_local_ollama_execution_report.json"))
  : null;
const mapping = fs.existsSync(e("adapter_conformance_local_ollama_mapping_review.json"))
  ? readJson(e("adapter_conformance_local_ollama_mapping_review.json"))
  : null;
const boundary = fs.existsSync(e("adapter_conformance_local_ollama_claim_boundary.json"))
  ? readJson(e("adapter_conformance_local_ollama_claim_boundary.json"))
  : null;
const unresolved = fs.existsSync(e("unresolved_items.json"))
  ? readJson(e("unresolved_items.json"))
  : [];

addCheck(checks, "stage matches", report?.stage === STAGE, { stage: report?.stage });
addCheck(checks, "status pass", report?.status === "pass", { status: report?.status });
addCheck(checks, "dependency-backed validation executed", report?.dependency_backed_validation_executed === true
  && report?.adapter_conformance_dry_run_status === "pass", {});
addCheck(checks, "no new model calls", report?.new_local_model_execution === false
  && report?.new_local_generation_calls === 0
  && report?.openai_model_api_call === false
  && report?.telemetry_sink_write === false, {});
addCheck(checks, "mapping surfaces reviewed", mapping?.ollama_adapter_loaded === true
  && mapping?.dry_run_ollama_cases_total > 0
  && mapping?.dry_run_ollama_cases_passed === mapping?.dry_run_ollama_cases_total
  && mapping?.no_tool_mapping_reviewed === true
  && mapping?.reasoning_control_mapping_reviewed === true
  && mapping?.structured_output_mapping_reviewed === true
  && mapping?.tool_calling_mock_mapping_reviewed === true
  && mapping?.redaction_storage_boundary_reviewed === true, mapping || {});
addCheck(checks, "protected paths unmodified", report?.reference_baseline_source_modified === false
  && report?.dist_modified === false
  && report?.evidence_reference_baseline_modified === false, {});
addCheck(checks, "raw request/response not stored", report?.raw_request_stored === false
  && report?.raw_response_stored === false
  && report?.secrets_logged === false, {});
addCheck(checks, "strong claims blocked", boundary?.local_model_verified_allowed === false
  && boundary?.provider_diverse_allowed === false
  && boundary?.provider_verified_allowed === false
  && boundary?.adapter_checked_allowed === false
  && boundary?.production_ready_allowed === false
  && boundary?.stable_allowed === false
  && boundary?.release_gated_allowed === false, boundary || {});

const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "original_order.txt",
    "node_modules",
    ".git",
    "evals/reports/adapter_conformance_local_ollama_execution_check_report.json",
    "evals/reports/adapter_conformance_local_ollama_execution_check_report.md"
  ]
});
const blockedMatches = scan.matches.filter((match) => BLOCKED_CLAIMS.includes(match.claim));
addCheck(checks, "prohibited claim scan pass", scan.status === "pass", { matches: scan.matches.length });
addCheck(checks, "local blocked positive claims absent", blockedMatches.length === 0, { matches: blockedMatches });

const failed = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: STAGE,
  checks,
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : null,
  can_rebuild_owner_decision_packet: failed.length === 0,
  claims_allowed: report?.claims_allowed || [],
  claims_blocked: boundary?.blocked_claims || [],
  failures: failed
};
const md = `# Adapter Conformance Local Ollama Execution Check

Status: ${gate.status}

- Stage: ${STAGE}
- Can rebuild owner decision packet: ${gate.can_rebuild_owner_decision_packet}
- Unresolved items: ${gate.unresolved_items_count}

## Checks

${checks.map((check) => `- ${check.status}: ${check.name}`).join("\n")}
`;

writeJson(p("evals", "reports", "adapter_conformance_local_ollama_execution_check_report.json"), gate);
writeText(p("evals", "reports", "adapter_conformance_local_ollama_execution_check_report.md"), md);

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
