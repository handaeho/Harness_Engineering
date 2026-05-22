#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { createAjv, loadSchema, validateWithSchema } from "./lib/json_schema_validator.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const ajv = createAjv();
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
addCheck("dependency-backed validate_alpha.mjs pass", dependency.status === "pass" && dependency.fallback_used === false, {
  status: dependency.status,
  fallback_used: dependency.fallback_used
});

const scan = readReport("evidence/alpha/prohibited_claim_scan.json");
addCheck("prohibited claim scan pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length,
  allowed_mentions: scan.allowed_mentions ? scan.allowed_mentions.length : 0
});

const baseline = readReport("evidence/alpha/baseline_comparison.json");
addCheck("compare_v36_baseline.mjs pass", baseline.status === "pass" && baseline.unresolved_items_count === 0, {
  status: baseline.status,
  unresolved_items_count: baseline.unresolved_items_count,
  existing_record_checked_count: baseline.existing_v36_checksum_record.checked_count,
  current_snapshot_mismatch_count: baseline.alpha_snapshot.current_snapshot_mismatch_count
});

const dryRun = readReport("evals/reports/adapter_conformance_dry_run.json");
addCheck("run_adapter_conformance_dry_run.mjs pass", dryRun.status === "pass" && dryRun.provider_execution === false && dryRun.local_model_execution === false, {
  status: dryRun.status,
  cases_total: dryRun.cases_total,
  cases_passed: dryRun.cases_passed,
  cases_failed: dryRun.cases_failed,
  provider_execution: dryRun.provider_execution,
  local_model_execution: dryRun.local_model_execution
});

const unresolved = readReport("evidence/beta-preflight/unresolved_items.json");
addCheck("unresolved_items.json is empty", Array.isArray(unresolved) && unresolved.length === 0, {
  unresolved_items_count: Array.isArray(unresolved) ? unresolved.length : "not_array"
});

const matrix = parseYamlFile(p("adapters", "provider_capability_matrix.yaml"));
const matrixBad = [];
for (const [provider, values] of Object.entries(matrix.providers || {})) {
  for (const [key, value] of Object.entries(values)) {
    if (value === true || ["true", "verified", "production", "production_monitored", "integration_verified"].includes(String(value))) {
      matrixBad.push({ provider, key, value });
    }
  }
}
addCheck("provider_capability_matrix.yaml has no unverified true values", matrixBad.length === 0, { bad_values: matrixBad });

const gate = parseYamlFile(p("release", "release_gate.yaml"));
const requiredBlocked = [
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
const gateBlocked = new Set(gate.prohibited_positive_claims || []);
const missingBlocked = requiredBlocked.filter((claim) => !gateBlocked.has(claim));
addCheck("release_gate.yaml blocks forbidden claims", missingBlocked.length === 0, { missing_blocked_claims: missingBlocked });

addCheck("package-lock.json exists", fs.existsSync(p("package-lock.json")), {});

addCheck("v36 modified false by checksum comparison", baseline.alpha_snapshot.current_snapshot_mismatch_count === 0 && baseline.existing_v36_checksum_record.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const report = {
  status: failed.length === 0 ? "pass" : "fail",
  stage: "v2.0.0-beta-preflight",
  can_enter_beta_execution: false,
  reason: failed.length === 0
    ? "Preflight passed, but beta execution still requires explicit operator approval."
    : "One or more beta preflight checks failed.",
  checks,
  claims_allowed: [
    "harness-designed",
    "static-structure-created",
    "baseline-snapshotted",
    "adapter-skeleton-created",
    "alpha-static-validated",
    "dependency-static-validated",
    "adapter-dry-run-checked",
    "beta-preflight-prepared"
  ],
  claims_blocked: requiredBlocked
};

validateWithSchema(ajv, loadSchema(p("schemas", "beta_entry_report.schema.json")), report, "beta_entry_report");

const md = `# Beta Entry Report

Status: ${report.status}

Stage: ${report.stage}

Can enter beta execution: ${report.can_enter_beta_execution}

Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Claim Boundary

- Allowed: ${report.claims_allowed.join(", ")}
- Blocked: ${report.claims_blocked.join(", ")}
`;

writeJson(p("evals", "reports", "beta_entry_report.json"), report);
writeText(p("evals", "reports", "beta_entry_report.md"), md);
writeJson(p("evidence", "beta-preflight", "beta_entry_gate_report.json"), report);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
