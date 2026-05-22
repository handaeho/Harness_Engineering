#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";
import { scanClaims } from "./lib/claim_scanner.mjs";

const STAGE = "v2.0.0-beta-production-telemetry-connection-preflight";
const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "prompt-stack-v2"
    ? repoRoot
    : path.resolve(repoRoot, "prompt-stack-v2");
const evidenceDir = path.join(root, "evidence", "beta-production-telemetry-connection-preflight");

const claimsAllowed = [
  "production-telemetry-connection-preflight-completed",
  "telemetry-approval-packet-generated",
  "telemetry-credential-readiness-checked",
  "telemetry-payload-shape-validated",
  "telemetry-exporter-guard-checked",
  "telemetry-connection-command-plan-drafted",
  "telemetry-connection-blocker-updated"
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
const acceptablePreflightStatus = new Set([
  "ready_but_blocked_by_missing_explicit_approval",
  "blocked_by_missing_otel_endpoint",
  "blocked_by_missing_langfuse_credentials"
]);

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
const telemetryDesignGate = readIfExists("evidence/beta-production-telemetry-design/production_telemetry_gate_report.json");
const preflight = readIfExists("evidence/beta-production-telemetry-connection-preflight/preflight_report.json");
const otelShape = readIfExists("evidence/beta-production-telemetry-connection-preflight/otel_payload_shape_report.json");
const langfuseShape = readIfExists("evidence/beta-production-telemetry-connection-preflight/langfuse_payload_shape_report.json");
const approval = readIfExists("evidence/beta-production-telemetry-connection-preflight/approval_readiness_report.json");
const credential = readIfExists("evidence/beta-production-telemetry-connection-preflight/credential_readiness_report.json");
const exporterGuard = readIfExists("evidence/beta-production-telemetry-connection-preflight/exporter_guard_readiness.json");
const redaction = readIfExists("evidence/beta-production-telemetry-connection-preflight/redaction_readiness_report.json");
const approvalGate = exists("release/production_telemetry_connection_approval_gate.yaml")
  ? parseYamlFile(p("release", "production_telemetry_connection_approval_gate.yaml")).approval_gate
  : null;
const scan = scanClaims(root, {
  excludedPaths: [
    "evidence/v36-baseline",
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
addCheck(checks, "compare_v36_baseline.mjs pass", baseline?.status === "pass" && baseline?.unresolved_items_count === 0, {
  status: baseline?.status || "missing",
  unresolved_items_count: baseline?.unresolved_items_count,
  current_snapshot_mismatch_count: baseline?.alpha_snapshot?.current_snapshot_mismatch_count
});
addCheck(checks, "check_production_telemetry_design.mjs pass", telemetryDesignGate?.status === "pass", {
  status: telemetryDesignGate?.status || "missing"
});

for (const relPath of [
  "release/beta_production_telemetry_connection_preflight_scope.yaml",
  "release/production_telemetry_connection_approval_gate.yaml",
  "release/production_telemetry_connection_approval_request.md",
  "release/production_telemetry_connection_command_plan.yaml",
  "release/telemetry_connection_blocker_update.yaml",
  "observability/telemetry_connection_preflight_policy.yaml",
  "observability/telemetry_sink_credential_policy.yaml",
  "observability/telemetry_exporter_guard_policy.yaml",
  "observability/telemetry_payload_shape_policy.yaml",
  "observability/otel/exporter_preflight_policy.yaml",
  "observability/otel/otlp_payload_shape.schema.json",
  "observability/otel/otlp_dry_payload_example.json",
  "observability/langfuse/connection_preflight_policy.yaml",
  "observability/langfuse/langfuse_payload_shape.schema.json",
  "observability/langfuse/langfuse_dry_payload_example.json",
  "evidence/beta-production-telemetry-connection-preflight/preflight_report.json",
  "evidence/beta-production-telemetry-connection-preflight/credential_readiness_report.json",
  "evidence/beta-production-telemetry-connection-preflight/approval_readiness_report.json",
  "evidence/beta-production-telemetry-connection-preflight/exporter_guard_readiness.json",
  "evidence/beta-production-telemetry-connection-preflight/otel_payload_shape_report.json",
  "evidence/beta-production-telemetry-connection-preflight/langfuse_payload_shape_report.json",
  "evidence/beta-production-telemetry-connection-preflight/redaction_readiness_report.json",
  "evidence/beta-production-telemetry-connection-preflight/command_plan_snapshot.yaml",
  "evidence/beta-production-telemetry-connection-preflight/telemetry_connection_blocker_update.json"
]) {
  addCheck(checks, `${path.basename(relPath)} exists`, exists(relPath), {});
}

addCheck(checks, "preflight status acceptable", acceptablePreflightStatus.has(preflight?.status), {
  status: preflight?.status || "missing"
});
addCheck(checks, "OTel payload shape validation pass", preflight?.otel_payload_shape_valid === true
  && otelShape?.status === "pass", {
  preflight: preflight?.otel_payload_shape_valid,
  report: otelShape?.status
});
addCheck(checks, "Langfuse payload shape validation pass", preflight?.langfuse_payload_shape_valid === true
  && langfuseShape?.status === "pass", {
  preflight: preflight?.langfuse_payload_shape_valid,
  report: langfuseShape?.status
});
addCheck(checks, "approval gate remains closed", approvalGate?.explicit_user_approval_present === false
  && approvalGate?.can_connect_telemetry === false
  && approval?.explicit_user_approval_present === false
  && approval?.can_connect_telemetry === false, {
  explicit_user_approval_present: approvalGate?.explicit_user_approval_present,
  can_connect_telemetry: approvalGate?.can_connect_telemetry
});
addCheck(checks, "no telemetry connection or sink write", preflight?.live_telemetry_connected === false
  && preflight?.telemetry_sink_write_enabled === false
  && preflight?.exporter_network_call_performed === false
  && exporterGuard?.exporter_network_call_allowed === false, {
  live_telemetry_connected: preflight?.live_telemetry_connected,
  telemetry_sink_write_enabled: preflight?.telemetry_sink_write_enabled,
  exporter_network_call_performed: preflight?.exporter_network_call_performed
});
addCheck(checks, "no provider or local execution", preflight?.provider_execution === false
  && preflight?.local_model_execution === false
  && preflight?.external_side_effects === false, {
  provider_execution: preflight?.provider_execution,
  local_model_execution: preflight?.local_model_execution,
  external_side_effects: preflight?.external_side_effects
});
addCheck(checks, "credential presence checked without secrets", credential?.credential_presence_checked === true
  && credential?.secrets_logged === false
  && !Object.prototype.hasOwnProperty.call(credential || {}, "otel_endpoint_value")
  && !Object.prototype.hasOwnProperty.call(credential || {}, "langfuse_secret_key_value"), {
  credential_presence_checked: credential?.credential_presence_checked,
  otel_endpoint_present: credential?.otel_endpoint_present,
  langfuse_credentials_present: credential?.langfuse_credentials_present,
  secrets_logged: credential?.secrets_logged
});
addCheck(checks, "redaction readiness pass", redaction?.status === "pass"
  && preflight?.secrets_logged === false
  && preflight?.raw_payload_stored === false, {
  redaction_status: redaction?.status,
  secrets_logged: preflight?.secrets_logged,
  raw_payload_stored: preflight?.raw_payload_stored
});
addCheck(checks, "forbidden positive claims absent", scan.matches.length === 0, {
  matches: scan.matches.length
});
addCheck(checks, "dist modified false", distFiles.length === 1 && distFiles[0] === "README.md", {
  dist_modified: false,
  dist_files: distFiles
});
addCheck(checks, "v36 modified false by checksum comparison", baseline?.alpha_snapshot?.current_snapshot_mismatch_count === 0
  && baseline?.existing_v36_checksum_record?.mismatch_count === 0, {
  method: "alpha snapshot plus v36 existing checksum record comparison",
  v36_modified: false
});

const failed = checks.filter((item) => item.status !== "pass");
let status = failed.length ? "fail" : "pass";
if (!failed.length && preflight?.status !== "ready_but_blocked_by_missing_explicit_approval") {
  status = "blocked";
}
const report = {
  status,
  stage: STAGE,
  can_enter_telemetry_connection: false,
  can_enter_telemetry_connected_claim: false,
  can_enter_production_monitored_claim: false,
  can_enter_production_ready_claim: false,
  can_enter_release_gated_claim: false,
  reason: status === "fail"
    ? "One or more production telemetry connection preflight checks failed."
    : "Telemetry connection preflight is complete, but explicit user approval and sink credentials are required before live telemetry connection.",
  checks,
  claims_allowed: status === "fail" ? [] : claimsAllowed,
  claims_blocked: claimsBlocked
};
const md = `# Production Telemetry Connection Preflight Gate Report

Status: ${report.status}

Stage: ${STAGE}

- Can enter telemetry connection: false
- Can enter telemetry-connected claim: false
- Can enter production-monitored claim: false
- Can enter production-ready claim: false
- Can enter release-gated claim: false
- Reason: ${report.reason}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}
`;

writeJson(path.join(evidenceDir, "preflight_gate_report.json"), report);
writeText(path.join(evidenceDir, "preflight_gate_report.md"), md);
writeJson(p("evals", "reports", "production_telemetry_connection_preflight_gate_report.json"), report);
writeText(p("evals", "reports", "production_telemetry_connection_preflight_gate_report.md"), md);

if (status === "fail") {
  writeJson(path.join(evidenceDir, "unresolved_items.json"), [
    {
      id: "PTPF-003",
      severity: "high",
      description: "Production telemetry connection preflight failed because required policy, payload shape, approval gate, or command plan artifacts are missing or invalid.",
      blocks_telemetry_connection: true,
      owner: "agent",
      recommended_next_action: "Regenerate missing preflight artifacts and rerun check_production_telemetry_connection_preflight.mjs."
    }
  ]);
}

console.log(JSON.stringify(report, null, 2));
process.exit(status === "fail" ? 1 : 0);
