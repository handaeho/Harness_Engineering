#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseYamlFile } from "./lib/yaml_loader.mjs";
import { ensureDir, readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const repoRoot = process.cwd();
const root = process.argv[2]
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

const stage = "v2.0.0-rc.1-agents-md-and-system-of-record-alignment";
const evidenceDir = path.join(root, "evidence", "rc1-agents-md-system-of-record-alignment");
const reportsDir = path.join(root, "evals", "reports");

function p(...parts) {
  return path.join(root, ...parts);
}

function exists(rel) {
  return fs.existsSync(p(rel));
}

function runNode(script) {
  const result = spawnSync(process.execPath, [p("tools", script)], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
  return {
    script: `tools/${script}`,
    status: result.status === 0 ? "pass" : "fail",
    exit_code: result.status,
    stdout_tail: (result.stdout || "").split(/\r?\n/).slice(-20).join("\n"),
    stderr_tail: (result.stderr || "").split(/\r?\n/).slice(-20).join("\n")
  };
}

function includesPath(paths, target) {
  return Array.isArray(paths) && paths.some((item) => String(item).replace(/\\/g, "/") === target);
}

const checks = [];
const errors = [];

function record(name, status, detail) {
  checks.push({ name, status, detail });
  if (status !== "pass") errors.push(`${name}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
}

for (const script of [
  "validate_alpha.mjs",
  "scan_prohibited_claims.mjs",
  "check_reference_baseline_integrity.mjs",
  "validate_agents_md_alignment.mjs"
]) {
  const result = runNode(script);
  record(result.script, result.status, result);
}

const requiredFiles = [
  "AGENTS.md",
  "MANIFEST.asset_classes.yaml",
  "docs/system_of_record.md",
  "docs/directory_roles.md",
  "docs/naming_conventions.md",
  "docs/agent_workflow.md",
  "docs/asset_classes.md",
  "docs/agent_entrypoint_policy.md",
  "docs/system_of_record_alignment.md",
  "docs/next_rc1_evidence_bundle_plan.md",
  "release/rc1_agents_md_alignment_scope.yaml",
  "release/system_of_record_alignment_gate.yaml",
  "evals/suites/rc1_agents_md_and_system_of_record_alignment.yaml"
];

const missingFiles = requiredFiles.filter((rel) => !exists(rel));
record("required alignment files exist", missingFiles.length === 0 ? "pass" : "fail", { missing: missingFiles });

try {
  const stack = parseYamlFile(p("stack.yaml"));
  const source = stack.source_of_truth || {};
  const aligned = stack.agent_entrypoint?.path === "AGENTS.md"
    && stack.asset_class_manifest?.path === "MANIFEST.asset_classes.yaml"
    && includesPath(source.agent_index, "AGENTS.md")
    && includesPath(source.machine_manifest, "stack.yaml")
    && includesPath(source.machine_manifest, "stack.schema.json")
    && includesPath(source.core_contract, "core/spec/harness.spec.yaml")
    && includesPath(source.release_contract, "release/claim_ladder.md")
    && includesPath(source.release_contract, "release/release_gate.yaml")
    && includesPath(source.capability_contract, "adapters/provider_capability_matrix.yaml")
    && includesPath(source.evidence_truth, "evidence/");
  record("stack.yaml source_of_truth alignment", aligned ? "pass" : "fail", {
    agent_entrypoint: stack.agent_entrypoint,
    asset_class_manifest: stack.asset_class_manifest,
    source_of_truth: source
  });
} catch (error) {
  record("stack.yaml source_of_truth alignment", "fail", error.message);
}

const alignmentReportPath = path.join(evidenceDir, "agents_md_alignment_report.json");
let alignmentReport = null;
if (fs.existsSync(alignmentReportPath)) {
  alignmentReport = readJson(alignmentReportPath);
}
record("validate_agents_md_alignment report pass", alignmentReport?.status === "pass" ? "pass" : "fail", {
  path: "evidence/rc1-agents-md-system-of-record-alignment/agents_md_alignment_report.json",
  status: alignmentReport?.status || "missing"
});

const status = errors.length === 0 ? "pass" : "fail";
const gateReport = {
  status,
  stage,
  agents_md_exists: exists("AGENTS.md"),
  asset_class_manifest_exists: exists("MANIFEST.asset_classes.yaml"),
  system_of_record_aligned: status === "pass",
  new_provider_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  release_gate_execution: false,
  dist_modified: false,
  reference_baseline_source_modified: false,
  can_enter_rc1_openai_scope_bundle: status === "pass",
  can_enter_stable_release: false,
  can_enter_release_gated_claim: false,
  reason: status === "pass"
    ? "Root AGENTS.md and System of Record alignment are complete. RC1 OpenAI-only evidence bundle can proceed, but stable and release-gated claims remain blocked."
    : "System of Record alignment checks failed; RC1 OpenAI-only evidence bundle should not proceed until fixed.",
  checks,
  claims_allowed: [
    "agents-md-root-entrypoint-added",
    "system-of-record-aligned",
    "asset-classes-manifested",
    "directory-roles-documented",
    "naming-conventions-documented",
    "agent-workflow-documented"
  ],
  claims_blocked: [
    "stable",
    "release-gated",
    "production-ready",
    "production-monitored",
    "provider-diverse",
    "provider-verified",
    "adapter-checked",
    "local-model-verified",
    "integration-verified"
  ],
  errors
};

const report = {
  status,
  stage,
  system_of_record_aligned: status === "pass",
  agents_md_exists: gateReport.agents_md_exists,
  asset_class_manifest_exists: gateReport.asset_class_manifest_exists,
  stack_source_of_truth_aligned: checks.some((item) => item.name === "stack.yaml source_of_truth alignment" && item.status === "pass"),
  new_provider_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  release_gate_execution: false,
  dist_modified: false,
  reference_baseline_source_modified: false,
  checks,
  errors
};

const reportMd = `# System of Record Alignment Report

Status: ${report.status}

Stage: ${stage}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Errors

${errors.length ? errors.map((item) => `- ${item}`).join("\n") : "- none"}
`;

ensureDir(evidenceDir);
ensureDir(reportsDir);
writeJson(path.join(evidenceDir, "system_of_record_alignment_report.json"), report);
writeJson(path.join(evidenceDir, "system_of_record_gate_report.json"), gateReport);
writeJson(path.join(evidenceDir, "unresolved_items.json"), errors);
writeJson(path.join(reportsDir, "system_of_record_alignment_report.json"), report);
writeText(path.join(reportsDir, "system_of_record_alignment_report.md"), reportMd);

console.log(JSON.stringify(gateReport, null, 2));
process.exit(status === "pass" ? 0 : 1);
