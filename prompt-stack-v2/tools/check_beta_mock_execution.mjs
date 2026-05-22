#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readJson, readText, writeJson, writeText } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");

const claimsAllowed = [
  "harness-designed",
  "static-structure-created",
  "baseline-snapshotted",
  "adapter-skeleton-created",
  "alpha-static-validated",
  "dependency-static-validated",
  "adapter-dry-run-checked",
  "beta-preflight-prepared",
  "beta-mock-runtime-executed",
  "mock-tool-routing-checked",
  "approval-boundary-smoke-tested",
  "trace-schema-smoke-tested",
  "schema-contract-validated"
];

const claimsBlocked = [
  "adapter-checked",
  "provider-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "telemetry-connected",
  "production-ready",
  "production-monitored",
  "containment-verified",
  "replay-verified",
  "benchmark-backed",
  "provider-diverse",
  "integration-verified",
  "release-gated"
];

const checks = [];

function p(...parts) {
  return path.join(root, ...parts);
}

function addCheck(name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function readReport(file) {
  return readJson(p(file));
}

const dependency = readReport("evidence/beta-preflight/dependency_validation_report.json");
addCheck("validate_alpha.mjs pass", dependency.status === "pass" && dependency.fallback_used === false, {
  status: dependency.status,
  fallback_used: dependency.fallback_used
});

const scan = readReport("evidence/alpha/prohibited_claim_scan.json");
addCheck("scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length,
  allowed_mentions: scan.allowed_mentions ? scan.allowed_mentions.length : 0
});

const baseline = readReport("evidence/alpha/baseline_comparison.json");
addCheck("compare_v36_baseline.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
  status: baseline.status,
  unresolved_items_count: baseline.unresolved_items_count,
  current_snapshot_mismatch_count: baseline.alpha_snapshot.current_snapshot_mismatch_count
});

const adapterDryRun = readReport("evals/reports/adapter_conformance_dry_run.json");
addCheck("run_adapter_conformance_dry_run.mjs pass", adapterDryRun.status === "pass" && adapterDryRun.provider_execution === false && adapterDryRun.local_model_execution === false, {
  status: adapterDryRun.status,
  cases_total: adapterDryRun.cases_total,
  cases_passed: adapterDryRun.cases_passed,
  cases_failed: adapterDryRun.cases_failed
});

const mockExecution = readReport("evals/reports/beta_mock_execution_report.json");
addCheck("run_beta_mock_execution.mjs pass", mockExecution.status === "pass", {
  status: mockExecution.status,
  cases_total: mockExecution.cases_total,
  cases_passed: mockExecution.cases_passed,
  cases_failed: mockExecution.cases_failed
});

addCheck("beta_mock_execution_scope.yaml exists", fs.existsSync(p("release", "beta_mock_execution_scope.yaml")), {});

const gitignoreText = fs.existsSync(p(".gitignore")) ? readText(p(".gitignore")) : "";
const requiredFiles = readReport("evals/fixtures/static/required_files.json");
addCheck("node_modules is install output and not source or evidence artifact", gitignoreText.includes("node_modules/") && !JSON.stringify(requiredFiles).includes("node_modules"), {
  gitignore_contains_node_modules: gitignoreText.includes("node_modules/"),
  required_files_contains_node_modules: JSON.stringify(requiredFiles).includes("node_modules"),
  classification: "install output, not tracked artifact"
});

addCheck("trace_samples.jsonl exists", fs.existsSync(p("evidence", "beta-mock-execution", "trace_samples.jsonl")), {});
addCheck("blocked_tools_executed is zero", mockExecution.blocked_tools_executed === 0, {
  blocked_tools_executed: mockExecution.blocked_tools_executed
});
addCheck("provider execution is false", mockExecution.provider_execution === false, {
  provider_execution: mockExecution.provider_execution
});
addCheck("local model execution is false", mockExecution.local_model_execution === false, {
  local_model_execution: mockExecution.local_model_execution
});
addCheck("external side effects are false", mockExecution.external_side_effects === false, {
  external_side_effects: mockExecution.external_side_effects
});

const unresolved = readReport("evidence/beta-mock-execution/unresolved_items.json");
addCheck("unresolved_items.json is empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : "not_array"
});

addCheck("v36 modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_v36_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const report = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: "v2.0.0-beta-mock-execution",
  can_enter_provider_execution: false,
  can_enter_local_model_execution: false,
  reason: failed.length === 0
    ? "Mock execution gate passed, but provider and local model execution still require explicit operator approval."
    : "One or more beta mock execution gate checks failed.",
  checks,
  claims_allowed: claimsAllowed,
  claims_blocked: claimsBlocked
};

const md = `# Beta Mock Execution Gate Report

Status: ${report.status}

Stage: ${report.stage}

- Can enter provider execution: ${report.can_enter_provider_execution}
- Can enter local model execution: ${report.can_enter_local_model_execution}
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed: ${claimsAllowed.join(", ")}
- Blocked: ${claimsBlocked.join(", ")}
`;

writeJson(p("evals", "reports", "beta_mock_gate_report.json"), report);
writeText(p("evals", "reports", "beta_mock_gate_report.md"), md);
writeJson(p("evidence", "beta-mock-execution", "beta_mock_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
