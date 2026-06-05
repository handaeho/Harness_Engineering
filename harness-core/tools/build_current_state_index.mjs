#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const STAGE = "v2.0.0-post-clean-export-agent-ready-usability-polish";
const WEAK_CLAIMS = [
  "post-final-dossier-agent-application-layer-recorded",
  "post-final-dossier-current-state-aligned"
];

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function readYaml(file) {
  return parseYaml(readText(file));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const currentStatePath = p("CURRENT_STATE.yaml");
const currentState = readYaml(currentStatePath);
const finalClaimState = readJson(p(currentState.final_dossier.claim_state_path));
const finalExportReport = readJson(p(currentState.final_dossier.export_report_path));
const agentReadyExport = currentState.agent_ready_export;
const dossierExport = currentState.latest_dossier_export;
const dossierExportPath = dossierExport ? p(dossierExport.path) : null;
const dossierExportExists = dossierExportPath ? fs.existsSync(dossierExportPath) : false;
const dossierExportSha256 = dossierExportExists ? sha256File(dossierExportPath) : null;
const dossierExportChecksumMatches = dossierExportSha256 === dossierExport?.sha256;

const index = {
  status: "recorded",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  state_label: currentState.state_label,
  scope: currentState.scope,
  source_files: {
    current_state: "CURRENT_STATE.yaml",
    start_here: "START_HERE_FOR_AGENTS.ko.md",
    bootstrap: "AGENT_BOOTSTRAP.ko.md",
    agents: "AGENTS.md",
    readme: "README.md",
    stack: "stack.yaml",
    session_handoff_latest: "docs/session_handoff_latest.md",
    provider_capability_matrix: "adapters/provider_capability_matrix.yaml",
    final_claim_state: currentState.final_dossier.claim_state_path,
    final_export_report: currentState.final_dossier.export_report_path
  },
  agent_ready_export: {
    path: agentReadyExport?.path || null,
    checksum_report_path: agentReadyExport?.checksum_report_path || null,
    intended_recipient: agentReadyExport?.intended_recipient || null,
    checksum_embedded_in_archive: false,
    checksum_note: "The clean export archive cannot embed its own final SHA256 without creating a self-referential checksum."
  },
  latest_dossier_export: {
    path: dossierExport?.path || null,
    expected_sha256: dossierExport?.sha256 || null,
    observed_sha256: dossierExportSha256,
    exists: dossierExportExists,
    checksum_matches: dossierExportChecksumMatches,
    intended_recipient: dossierExport?.intended_recipient || null
  },
  allowed_claims: currentState.allowed_claims,
  blocked_claims: currentState.blocked_claims,
  final_claim_state_allowed_claims: finalClaimState.allowed_claims,
  final_claim_state_blocked_claims: finalClaimState.blocked_claims,
  final_export_status: finalExportReport.status,
  final_export_write_recorded: finalExportReport.actual_export_write === true,
  weak_claims_recorded: WEAK_CLAIMS,
  new_local_model_execution: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_refreshed: false
};

const claimBoundary = {
  status: "recorded",
  stage: STAGE,
  source: "CURRENT_STATE.yaml",
  allowed_claims: currentState.allowed_claims,
  blocked_claims: currentState.blocked_claims,
  canonicalization_rules: currentState.canonicalization_rules,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  bare_release_gated_allowed: false,
  weak_claims_recorded: WEAK_CLAIMS,
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};

const agentApplicationLayerReport = {
  status: "recorded",
  stage: STAGE,
  current_state_path: "CURRENT_STATE.yaml",
  start_here_path: currentState.agent_application_layer.start_here,
  bootstrap_path: currentState.agent_application_layer.bootstrap,
  how_to_path: currentState.agent_application_layer.how_to,
  profiles: currentState.agent_application_layer.profiles,
  alignment_checker: currentState.agent_application_layer.alignment_checker,
  expected_usage_flow: [
    "read START_HERE_FOR_AGENTS.ko.md",
    "read CURRENT_STATE.yaml",
    "read AGENT_BOOTSTRAP.ko.md",
    "read AGENTS.md and claim ladder",
    "read the active stage scope",
    "perform the scoped task",
    "run current-state alignment and claim scanner",
    "report checked-vs-unverified state"
  ],
  weak_claim_recorded: "post-final-dossier-agent-application-layer-recorded",
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};

const alignmentReport = {
  status: "recorded",
  stage: STAGE,
  current_state_index_path: "evidence/current-state/current_state_index.json",
  current_state_claim_boundary_path: "evidence/current-state/current_state_claim_boundary.json",
  agent_application_layer_report_path: "evidence/current-state/agent_application_layer_report.json",
  agent_ready_export: index.agent_ready_export,
  latest_dossier_export: index.latest_dossier_export,
  unresolved_items_count: [
    dossierExportChecksumMatches
  ].filter((item) => item !== true).length,
  unresolved_items: [
    !dossierExportChecksumMatches
      ? {
        id: "latest_dossier_export_checksum_mismatch",
        expected: dossierExport?.sha256 || null,
        observed: dossierExportSha256
      }
      : null
  ].filter(Boolean),
  weak_claim_recorded: "post-final-dossier-current-state-aligned",
  new_local_model_execution: false,
  openai_model_api_call: false,
  telemetry_sink_write: false
};

writeJson(p("evidence/current-state/current_state_index.json"), index);
writeJson(p("evidence/current-state/current_state_claim_boundary.json"), claimBoundary);
writeJson(p("evidence/current-state/agent_application_layer_report.json"), agentApplicationLayerReport);
writeJson(p("evidence/current-state/current_state_alignment_report.json"), alignmentReport);
writeJson(p("evidence/current-state/unresolved_items.json"), {
  status: alignmentReport.unresolved_items_count === 0 ? "pass" : "fail",
  stage: STAGE,
  unresolved_items_count: alignmentReport.unresolved_items_count,
  unresolved_items: alignmentReport.unresolved_items
});

const md = `# Current State Alignment Report

Status: ${alignmentReport.status}

- Stage: ${STAGE}
- Current state: ${rel(currentStatePath)}
- Agent-ready export: ${agentReadyExport?.path || "missing"}
- Agent-ready export checksum embedded in archive: false
- Latest dossier export: ${dossierExport?.path || "missing"}
- Latest dossier export checksum matches: ${dossierExportChecksumMatches}
- New local model execution: false
- OpenAI model API call: false
- Telemetry sink write: false
`;

writeJson(p("evals/reports/current_state_alignment_report.json"), alignmentReport);
writeText(p("evals/reports/current_state_alignment_report.md"), md);

console.log(JSON.stringify(alignmentReport, null, 2));
