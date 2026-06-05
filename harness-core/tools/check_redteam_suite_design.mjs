#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-redteam-suite-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-redteam-suite-design");

const claimsAllowed = [
  "redteam-suite-designed",
  "redteam-fixtures-authored",
  "redteam-taxonomy-mapped",
  "redteam-severity-rubric-drafted",
  "redteam-execution-gate-designed",
  "redteam-blocker-updated"
];
const claimsBlocked = [
  "redteam-executed",
  "redteam-passed",
  "containment-verified",
  "release-gated",
  "production-ready",
  "production-monitored",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "replay-verified",
  "integration-verified",
  "telemetry-connected",
  "benchmark-backed"
];

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readIfExists(relPath) {
  return exists(relPath) ? readJson(p(relPath)) : null;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const checks = [];
const dependency = readIfExists("evidence/beta-preflight/dependency_validation_report.json");
const baseline = readIfExists("evidence/alpha/baseline_comparison.json");
const releaseGateDryRun = readIfExists("evidence/beta-release-gate-dry-run/release_gate_dry_run_gate_report.json");
const designReport = readIfExists("evidence/beta-redteam-suite-design/redteam_suite_design_report.json");
const validationReport = readIfExists("evidence/beta-redteam-suite-design/redteam_fixture_validation_report.json");
const mappingReport = readIfExists("evidence/beta-redteam-suite-design/redteam_mapping_summary.json");
const fixtureIndex = readIfExists("evidence/beta-redteam-suite-design/redteam_fixture_index.json");
const gate = exists("release/redteam_execution_gate.yaml")
  ? parseYamlFile(p("release", "redteam_execution_gate.yaml")).redteam_execution_gate
  : null;
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/reference-baseline",
    "evidence/alpha/prohibited_claim_scan.json",
    "node_modules",
    ".git"
  ]
});
const distFiles = exists("dist")
  ? fs.readdirSync(p("dist"), { withFileTypes: true }).map((item) => item.name).sort()
  : [];

addCheck(checks, "validate_alpha.mjs pass", dependency?.status === "pass" && dependency?.fallback_used === false, {
  status: dependency?.status || "missing",
  fallback_used: dependency?.fallback_used
});
addCheck(checks, "scan_prohibited_claims.mjs pass", scan.status === "pass" && scan.matches.length === 0, {
  status: scan.status,
  matches: scan.matches.length
});
addCheck(checks, "check_reference_baseline_integrity.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_release_gate_dry_run.mjs pass", releaseGateDryRun?.status === "pass", {
  status: releaseGateDryRun?.status || "missing"
});

for (const relPath of [
  "security/redteam/redteam_taxonomy.yaml",
  "security/redteam/redteam_case.schema.json",
  "security/redteam/redteam_severity_rubric.yaml",
  "security/redteam/redteam_pass_fail_policy.yaml",
  "security/redteam/owasp_genai_mapping.yaml",
  "security/redteam/nist_genai_profile_mapping.yaml",
  "security/redteam/mitre_atlas_mapping.yaml",
  "release/redteam_execution_gate.yaml",
  "release/redteam_blocker_update.yaml",
  "evidence/beta-redteam-suite-design/redteam_suite_design_report.json",
  "evidence/beta-redteam-suite-design/redteam_fixture_index.json",
  "evidence/beta-redteam-suite-design/redteam_mapping_summary.json",
  "evidence/beta-redteam-suite-design/redteam_severity_rubric_snapshot.yaml",
  "evidence/beta-redteam-suite-design/redteam_blocker_update.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

const fixtureFiles = exists("evals/fixtures/redteam")
  ? fs.readdirSync(p("evals", "fixtures", "redteam")).filter((file) => file.endsWith(".jsonl")).sort()
  : [];
addCheck(checks, "redteam fixtures exist", fixtureFiles.length === 13, {
  fixture_files_total: fixtureFiles.length
});
addCheck(checks, "fixture validation pass", validationReport?.status === "pass" && validationReport?.fixture_validation_passed === true, {
  status: validationReport?.status || "missing",
  fixture_validation_passed: validationReport?.fixture_validation_passed,
  fixture_cases_total: validationReport?.fixture_cases_total
});
addCheck(checks, "mapping summary pass", mappingReport?.status === "pass", {
  status: mappingReport?.status || "missing",
  owasp_mapping_exists: mappingReport?.owasp_mapping_exists,
  nist_mapping_exists: mappingReport?.nist_mapping_exists,
  mitre_mapping_exists: mappingReport?.mitre_mapping_exists
});
addCheck(checks, "redteam execution gate remains closed", gate?.can_execute_redteam === false && gate?.status === "design_only", {
  status: gate?.status || "missing",
  can_execute_redteam: gate?.can_execute_redteam
});
addCheck(checks, "design report has no execution", designReport?.design_only === true
  && designReport?.actual_redteam_execution === false
  && designReport?.provider_execution === false
  && designReport?.local_model_execution === false
  && designReport?.external_side_effects === false, {
  design_only: designReport?.design_only,
  actual_redteam_execution: designReport?.actual_redteam_execution,
  provider_execution: designReport?.provider_execution,
  local_model_execution: designReport?.local_model_execution,
  external_side_effects: designReport?.external_side_effects
});
addCheck(checks, "fixture counts recorded", fixtureIndex?.fixture_files_total === 13
  && fixtureIndex?.fixture_cases_total >= 45, {
  fixture_files_total: fixtureIndex?.fixture_files_total,
  fixture_cases_total: fixtureIndex?.fixture_cases_total
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "reference baseline source modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_reference_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus referenceBaseline existing checksum record comparison",
  reference_baseline_source_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
const status = failed.length ? "fail" : "pass";
const report = {
  status,
  stage: STAGE,
  design_only: true,
  redteam_execution_allowed: false,
  can_execute_redteam: false,
  can_enter_release_gated_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_containment_verified_claim: false,
  reason: status === "pass"
    ? "Redteam suite design artifacts are present and validated. Execution and stronger claims remain closed."
    : "One or more redteam suite design checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};

const md = `# Redteam Gate Design Report

Status: ${report.status}

Stage: ${STAGE}

- Design only: true
- Redteam execution allowed: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter containment-verified claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "redteam_gate_design_report.json"), report);
writeJson(p("evals", "reports", "redteam_gate_design_report.json"), report);
writeText(p("evals", "reports", "redteam_gate_design_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "RTD-001",
    severity: "high",
    description: "One or more required redteam design artifacts are missing or invalid.",
    blocks_redteam_execution: true,
    blocks_release_gate: true,
    owner: "agent",
    recommended_next_action: "Regenerate redteam design artifacts and rerun check_redteam_suite_design.mjs."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
