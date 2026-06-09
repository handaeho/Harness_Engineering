#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "../../lib/file_walk.mjs";
import { scanClaims } from "../../lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-design";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-design");

const claimsAllowed = [
  "production-telemetry-design-drafted",
  "otel-genai-mapping-drafted",
  "langfuse-integration-plan-drafted",
  "telemetry-dashboard-spec-drafted",
  "telemetry-anomaly-thresholds-drafted",
  "telemetry-claim-gate-designed",
  "telemetry-blocker-updated"
];
const claimsBlocked = [
  "telemetry-connected",
  "production-monitored",
  "production-ready",
  "release-gated",
  "provider-diverse",
  "provider-verified",
  "adapter-checked",
  "local-model-verified",
  "runtime-verified",
  "tool-call-verified",
  "schema-output-verified",
  "redteam-passed",
  "containment-verified",
  "replay-verified",
  "integration-verified",
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
const releaseDryRun = readIfExists("evidence/beta-release-gate-dry-run/release_gate_dry_run_gate_report.json");
const bundleGate = readIfExists("evidence/beta-release-evidence-bundle/beta_release_evidence_bundle_gate_report.json");
const design = readIfExists("evidence/beta-production-telemetry-design/production_telemetry_design_report.json");
const validation = readIfExists("evidence/beta-production-telemetry-design/telemetry_design_validation_report.json");
const policy = exists("observability/production_telemetry_policy.yaml")
  ? parseYamlFile(p("observability", "production_telemetry_policy.yaml")).production_telemetry_policy
  : null;
const gate = exists("release/gates/telemetry/production_telemetry_gate.yaml")
  ? parseYamlFile(p("release", "production_telemetry_gate.yaml")).production_telemetry_gate
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
addCheck(checks, "check_release_gate_dry_run.mjs pass", releaseDryRun?.status === "pass", {
  status: releaseDryRun?.status || "missing"
});
addCheck(checks, "check_beta_release_evidence_bundle.mjs pass", bundleGate?.status === "pass", {
  status: bundleGate?.status || "missing"
});

for (const relPath of [
  "observability/production_telemetry_policy.yaml",
  "observability/telemetry_event_taxonomy.yaml",
  "observability/telemetry_metric_catalog.yaml",
  "observability/telemetry_redaction_policy.yaml",
  "observability/telemetry_retention_policy.yaml",
  "observability/telemetry_anomaly_thresholds.yaml",
  "observability/telemetry_dashboard_spec.yaml",
  "observability/otel/genai_semantic_mapping.yaml",
  "observability/otel/trace_attribute_mapping.yaml",
  "observability/otel/metric_mapping.yaml",
  "observability/otel/exporter_policy.yaml",
  "observability/langfuse/integration_plan.yaml",
  "observability/langfuse/trace_mapping.yaml",
  "observability/langfuse/score_mapping.yaml",
  "observability/langfuse/dashboard_plan.yaml",
  "release/gates/telemetry/production_telemetry_gate.yaml",
  "release/blockers/telemetry/telemetry_blocker_update.yaml",
  "evidence/beta-production-telemetry-design/production_telemetry_design_report.json",
  "evidence/beta-production-telemetry-design/telemetry_schema_snapshot.json",
  "evidence/beta-production-telemetry-design/trace_schema_snapshot.json",
  "evidence/beta-production-telemetry-design/otel_genai_mapping_snapshot.yaml",
  "evidence/beta-production-telemetry-design/langfuse_integration_plan_snapshot.yaml",
  "evidence/beta-production-telemetry-design/telemetry_dashboard_spec_snapshot.yaml",
  "evidence/beta-production-telemetry-design/telemetry_anomaly_thresholds_snapshot.yaml",
  "evidence/beta-production-telemetry-design/production_telemetry_gate_report.json",
  "evidence/beta-production-telemetry-design/telemetry_blocker_update.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "telemetry design report pass", design?.status === "pass", { status: design?.status || "missing" });
addCheck(checks, "telemetry validation report pass", validation?.status === "pass", { status: validation?.status || "missing" });
addCheck(checks, "no live telemetry connection", policy?.live_telemetry_connected === false
  && design?.live_telemetry_connected === false, {
  policy: policy?.live_telemetry_connected,
  report: design?.live_telemetry_connected
});
addCheck(checks, "telemetry sink write disabled", policy?.telemetry_sink_write_enabled === false
  && design?.telemetry_sink_write_enabled === false, {
  policy: policy?.telemetry_sink_write_enabled,
  report: design?.telemetry_sink_write_enabled
});
addCheck(checks, "no provider or local execution", design?.provider_execution === false
  && design?.local_model_execution === false
  && design?.external_side_effects === false, {
  provider_execution: design?.provider_execution,
  local_model_execution: design?.local_model_execution,
  external_side_effects: design?.external_side_effects
});
addCheck(checks, "production claims remain blocked", gate?.can_claim_telemetry_connected === false
  && gate?.can_claim_production_monitored === false
  && gate?.can_claim_production_ready === false, {
  can_claim_telemetry_connected: gate?.can_claim_telemetry_connected,
  can_claim_production_monitored: gate?.can_claim_production_monitored,
  can_claim_production_ready: gate?.can_claim_production_ready
});
addCheck(checks, "design artifacts exist in report", design?.otel_mapping_exists === true
  && design?.langfuse_integration_plan_exists === true
  && design?.dashboard_spec_exists === true
  && design?.anomaly_thresholds_exist === true
  && design?.redaction_policy_exists === true
  && design?.production_telemetry_gate_exists === true, {
  otel_mapping_exists: design?.otel_mapping_exists,
  langfuse_integration_plan_exists: design?.langfuse_integration_plan_exists,
  dashboard_spec_exists: design?.dashboard_spec_exists,
  anomaly_thresholds_exist: design?.anomaly_thresholds_exist,
  redaction_policy_exists: design?.redaction_policy_exists,
  production_telemetry_gate_exists: design?.production_telemetry_gate_exists
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
  can_enter_telemetry_connected_claim: false,
  can_enter_production_monitored_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "Production telemetry design is drafted, but live telemetry connection and production monitoring claims remain blocked."
    : "One or more production telemetry design checks failed.",
  checks,
  claims_allowed: status === "pass" ? claimsAllowed : [],
  claims_blocked: claimsBlocked
};
const md = `# Production Telemetry Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter telemetry-connected claim: false
- Can enter production-monitored claim: false
- Can enter production-ready claim: false
- Can enter release-gated claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "production_telemetry_gate_report.json"), report);
writeText(path.join(evidenceDir, "production_telemetry_gate_report.md"), md);
writeJson(p("evals", "reports", "production_telemetry_gate_report.json"), report);
writeText(p("evals", "reports", "production_telemetry_gate_report.md"), md);
writeJson(path.join(evidenceDir, "unresolved_items.json"), status === "pass" ? [] : [
  {
    id: "PTD-001",
    severity: "high",
    description: "Production telemetry design failed because required telemetry schema, mapping, gate, or policy artifacts are missing or invalid.",
    blocks_telemetry_connection: true,
    blocks_production_monitored_claim: true,
    owner: "agent",
    recommended_next_action: "Regenerate telemetry design artifacts and rerun check_production_telemetry_design.mjs."
  }
]);

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
