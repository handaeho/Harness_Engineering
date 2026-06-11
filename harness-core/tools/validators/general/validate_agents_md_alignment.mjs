#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseYamlFile } from "../../lib/yaml_loader.mjs";
import { ensureDir, readText, writeJson, writeText } from "../../lib/file_walk.mjs";

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

function includesPath(paths, target) {
  return Array.isArray(paths) && paths.some((item) => String(item).replace(/\\/g, "/") === target);
}

const checks = [];
const errors = [];

function check(name, fn) {
  try {
    const detail = fn();
    checks.push({ name, status: "pass", detail });
  } catch (error) {
    checks.push({ name, status: "fail", detail: error.message });
    errors.push(`${name}: ${error.message}`);
  }
}

let stack = {};
let manifest = {};
let agentsText = "";

check("AGENTS.md exists", () => {
  if (!exists("AGENTS.md")) throw new Error("AGENTS.md missing");
  agentsText = readText(p("AGENTS.md"));
  return { path: "AGENTS.md" };
});

check("MANIFEST.asset_classes.yaml exists", () => {
  if (!exists("MANIFEST.asset_classes.yaml")) throw new Error("MANIFEST.asset_classes.yaml missing");
  manifest = parseYamlFile(p("MANIFEST.asset_classes.yaml"));
  return { path: "MANIFEST.asset_classes.yaml" };
});

check("stack.yaml declares AGENTS.md entrypoint and asset manifest", () => {
  stack = parseYamlFile(p("stack.yaml"));
  if (stack.agent_entrypoint?.path !== "AGENTS.md") throw new Error("agent_entrypoint.path must be AGENTS.md");
  if (stack.asset_class_manifest?.path !== "MANIFEST.asset_classes.yaml") {
    throw new Error("asset_class_manifest.path must be MANIFEST.asset_classes.yaml");
  }
  return {
    agent_entrypoint: stack.agent_entrypoint.path,
    asset_class_manifest: stack.asset_class_manifest.path
  };
});

check("stack.yaml source_of_truth includes required records", () => {
  const source = stack.source_of_truth || {};
  const required = {
    agent_index: ["AGENTS.md", "START_HERE_FOR_AGENTS.ko.md", "AGENT_BOOTSTRAP.ko.md"],
    machine_manifest: ["stack.yaml", "stack.schema.json"],
    core_contract: ["core/spec/harness.spec.yaml"],
    release_contract: ["release/claims/general/claim_ladder.md", "release/gates/core-release/release_gate.yaml"],
    capability_contract: ["adapters/provider_capability_matrix.yaml"],
    evidence_truth: ["evidence/"]
  };
  const missing = Object.entries(required)
    .flatMap(([key, targets]) => targets
      .filter((target) => !includesPath(source[key], target))
      .map((target) => `${key}:${target}`));
  if (missing.length) throw new Error(`missing source_of_truth entries: ${missing.join(", ")}`);
  return required;
});

check("AGENTS.md mentions required operating sections", () => {
  const requiredTexts = [
    "Source of Record",
    "Non-Negotiable Rules",
    "evidence/reference-baseline",
    "dist/",
    "Current Claim Status",
    "node tools/validators/evals/validate_alpha.mjs",
    "node tools/scanners/release/scan_prohibited_claims.mjs",
    "node tools/checks/workspace/check_reference_baseline_integrity.mjs"
  ];
  const missing = requiredTexts.filter((item) => !agentsText.includes(item));
  if (missing.length) throw new Error(`missing AGENTS.md text: ${missing.join(", ")}`);
  return { checked: requiredTexts.length };
});

check("asset class manifest contains required classes", () => {
  const classes = manifest.asset_classes || {};
  const required = ["agent_instructions", "core_source", "evidence", "human_docs", "generated_or_ignored", "reference_baseline"];
  const missing = required.filter((key) => !classes[key]);
  if (missing.length) throw new Error(`missing asset classes: ${missing.join(", ")}`);
  return { classes: required };
});

check("agent instructions are separate from human docs", () => {
  const agentInstructions = manifest.asset_classes?.agent_instructions?.paths || [];
  const humanDocs = manifest.asset_classes?.human_docs?.paths || [];
  const requiredAgentFiles = ["AGENTS.md", "START_HERE_FOR_AGENTS.ko.md", "AGENT_BOOTSTRAP.ko.md"];
  const missing = requiredAgentFiles.filter((file) => !includesPath(agentInstructions, file));
  const leaked = requiredAgentFiles.filter((file) => includesPath(humanDocs, file));
  if (missing.length || leaked.length) {
    throw new Error(`agent instruction classification mismatch: missing=${missing.join(", ")} leaked=${leaked.join(", ")}`);
  }
  return { agent_instructions: agentInstructions, human_docs: humanDocs };
});

check("asset class manifest classifies generated and reference baseline paths", () => {
  const generated = manifest.asset_classes?.generated_or_ignored?.paths || [];
  const referenceBaseline = manifest.asset_classes?.reference_baseline?.paths || [];
  if (!includesPath(generated, "node_modules/")) throw new Error("node_modules/ not listed as generated_or_ignored");
  if (!includesPath(generated, "dist/")) throw new Error("dist/ not listed as generated_or_ignored");
  if (!includesPath(referenceBaseline, "evidence/reference-baseline/")) {
    throw new Error("evidence/reference-baseline/ not listed as reference_baseline");
  }
  return {
    generated_or_ignored: generated,
    reference_baseline: referenceBaseline
  };
});

check("docs required by alignment exist", () => {
  const docs = [
    "docs/workspace/system_of_record.md",
    "docs/workspace/directory_roles.md",
    "docs/workspace/naming_conventions.md",
    "docs/workspace/agent_workflow.md",
    "docs/workspace/asset_classes.md",
    "docs/workspace/agent_entrypoint_policy.md",
    "docs/workspace/system_of_record_alignment.md",
    "docs/plans/next_rc1_evidence_bundle_plan.md"
  ];
  const missing = docs.filter((rel) => !exists(rel));
  if (missing.length) throw new Error(`missing docs: ${missing.join(", ")}`);
  return { docs };
});

const status = errors.length === 0 ? "pass" : "fail";
const report = {
  status,
  stage,
  generated_at: new Date().toISOString(),
  agents_md_exists: exists("AGENTS.md"),
  asset_class_manifest_exists: exists("MANIFEST.asset_classes.yaml"),
  system_of_record_aligned: status === "pass",
  new_provider_execution: false,
  local_model_execution: false,
  telemetry_connection: false,
  release_gate_execution: false,
  dist_modified: false,
  reference_baseline_source_modified: false,
  checks,
  errors,
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
  ]
};

const md = `# AGENTS.md Alignment Report

Status: ${report.status}

Stage: ${stage}

## Checks

${checks.map((item) => `- ${item.status}: ${item.name}`).join("\n")}

## Errors

${errors.length ? errors.map((item) => `- ${item}`).join("\n") : "- none"}

## Execution Boundary

- New provider execution: false
- Local model execution: false
- Telemetry connection: false
- Release gate execution: false
- dist modified: false
- reference baseline source modified: false
`;

const assetReport = {
  status,
  stage,
  asset_classes: manifest.asset_classes || {},
  rules: manifest.rules || {},
  checks: checks.filter((item) => item.name.includes("asset class")),
  errors: errors.filter((item) => item.includes("asset"))
};

const assetMd = `# Asset Class Manifest Report

Status: ${assetReport.status}

Stage: ${stage}

## Classes

${Object.keys(assetReport.asset_classes).map((key) => `- ${key}`).join("\n")}
`;

ensureDir(evidenceDir);
ensureDir(reportsDir);
writeJson(path.join(evidenceDir, "agents_md_alignment_report.json"), report);
writeText(path.join(evidenceDir, "agents_md_alignment_report.md"), md);
writeJson(path.join(reportsDir, "agents_md_alignment_report.json"), report);
writeText(path.join(reportsDir, "agents_md_alignment_report.md"), md);
writeJson(path.join(reportsDir, "asset_class_manifest_report.json"), assetReport);
writeText(path.join(reportsDir, "asset_class_manifest_report.md"), assetMd);

if (exists("MANIFEST.asset_classes.yaml")) {
  writeText(path.join(evidenceDir, "asset_class_manifest_snapshot.yaml"), readText(p("MANIFEST.asset_classes.yaml")));
}
if (exists("docs/workspace/directory_roles.md")) {
  writeText(path.join(evidenceDir, "directory_roles_snapshot.md"), readText(p("docs", "workspace", "directory_roles.md")));
}
if (exists("docs/workspace/naming_conventions.md")) {
  writeText(path.join(evidenceDir, "naming_conventions_snapshot.md"), readText(p("docs", "workspace", "naming_conventions.md")));
}
if (exists("docs/workspace/agent_workflow.md")) {
  writeText(path.join(evidenceDir, "agent_workflow_snapshot.md"), readText(p("docs", "workspace", "agent_workflow.md")));
}

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
