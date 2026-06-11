#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const root = path.basename(process.cwd()) === "harness-core"
  ? process.cwd()
  : path.resolve(process.cwd(), "harness-core");

const agentInstructionFiles = [
  "AGENTS.md",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md"
];

const humanDocRoots = [
  "README.md",
  "NAME_MIGRATION.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs/"
];

const forbiddenAgentPatterns = [
  { label: "purpose_heading", pattern: /^##\s*Purpose\b/im },
  { label: "korean_purpose_heading", pattern: /^##\s*목적\b/im },
  { label: "this_file_is", pattern: /\bthis file is\b/i },
  { label: "this_document", pattern: /\bthis document\b/i },
  { label: "this_repository_contains", pattern: /\bthis repository contains\b/i },
  { label: "this_package_is", pattern: /\bthis package is\b/i },
  { label: "korean_this_document", pattern: /이 문서는/ },
  { label: "structure_heading", pattern: /^##\s*Structure\b/im },
  { label: "new_project_usage_heading", pattern: /^##\s*New Project Usage\b/im },
  { label: "current_allowed_claims_heading", pattern: /^##\s*Current Allowed Claims\b/im },
  { label: "path_purpose_table", pattern: /\|\s*Path\s*\|\s*Purpose\s*\|/i }
];

const checks = [];

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readText(relPath) {
  return fs.readFileSync(p(relPath), "utf8").replace(/^\uFEFF/, "");
}

function readYaml(relPath) {
  return parseYaml(readText(relPath));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function addCheck(name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function includesPath(paths, expected) {
  return Array.isArray(paths) && paths.includes(expected);
}

function scanAgentFile(relPath) {
  if (!fs.existsSync(p(relPath))) {
    return [{ label: "missing_file", file: relPath }];
  }
  const text = readText(relPath);
  return forbiddenAgentPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => ({ label, file: relPath }));
}

let manifest = null;
try {
  manifest = readYaml("MANIFEST.asset_classes.yaml");
  addCheck("asset class manifest parses", true, { file: "MANIFEST.asset_classes.yaml" });
} catch (error) {
  addCheck("asset class manifest parses", false, { error: error.message });
}

for (const relPath of agentInstructionFiles) {
  addCheck(`${relPath} exists`, fs.existsSync(p(relPath)), { file: relPath });
}

if (manifest) {
  const agentInstructions = manifest.asset_classes?.agent_instructions?.paths || [];
  const humanDocs = manifest.asset_classes?.human_docs?.paths || [];
  const missingAgentClassification = agentInstructionFiles.filter((file) => !includesPath(agentInstructions, file));
  const leakedToHumanDocs = agentInstructionFiles.filter((file) => includesPath(humanDocs, file));
  const missingHumanDocs = humanDocRoots.filter((file) => !includesPath(humanDocs, file));

  addCheck("agent instruction class exists", Boolean(manifest.asset_classes?.agent_instructions), {
    classes: Object.keys(manifest.asset_classes || {})
  });
  addCheck("agent instruction files classified as agent_instructions", missingAgentClassification.length === 0, {
    missing: missingAgentClassification,
    agent_instructions: agentInstructions
  });
  addCheck("agent instruction files absent from human_docs", leakedToHumanDocs.length === 0, {
    leaked: leakedToHumanDocs,
    human_docs: humanDocs
  });
  addCheck("human docs keep human-facing roots", missingHumanDocs.length === 0, {
    missing: missingHumanDocs,
    human_docs: humanDocs
  });
}

const agentProseFindings = agentInstructionFiles.flatMap(scanAgentFile);
addCheck("agent instruction files avoid human-doc prose", agentProseFindings.length === 0, {
  findings: agentProseFindings
});

const agentsText = fs.existsSync(p("AGENTS.md")) ? readText("AGENTS.md") : "";
addCheck("AGENTS.md keeps runtime rule language", [
  "Operate as an autonomous programming-agent runtime maintainer",
  "Non-Negotiable Rules",
  "Current Claim Status",
  "Asset Role Boundary",
  "node tools/checks/workspace/check_asset_purpose_boundaries.mjs"
].every((needle) => agentsText.includes(needle)), {
  file: "AGENTS.md"
});

const startHereText = fs.existsSync(p("START_HERE_FOR_AGENTS.ko.md")) ? readText("START_HERE_FOR_AGENTS.ko.md") : "";
addCheck("START_HERE keeps executable bootstrap commands", [
  "node tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "node tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "node tools/checks/workspace/check_current_state_alignment.mjs"
].every((needle) => startHereText.includes(needle)), {
  file: "START_HERE_FOR_AGENTS.ko.md"
});

const bootstrapText = fs.existsSync(p("AGENT_BOOTSTRAP.ko.md")) ? readText("AGENT_BOOTSTRAP.ko.md") : "";
addCheck("AGENT_BOOTSTRAP keeps execution and claim boundaries", [
  "새 에이전트에게는 `harness-core-agent-ready.zip`을 전달한다.",
  "Forbidden Without Approval",
  "node tools/scanners/release/scan_prohibited_claims.mjs",
  "node tools/checks/workspace/check_asset_purpose_boundaries.mjs"
].every((needle) => bootstrapText.includes(needle)), {
  file: "AGENT_BOOTSTRAP.ko.md"
});

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: "asset-purpose-boundary-check",
  generated_at: new Date().toISOString(),
  agent_instruction_files: agentInstructionFiles,
  human_doc_roots: humanDocRoots,
  checks,
  failures,
  claim_boundary: {
    agent_instruction_boundary_checked: true,
    human_doc_boundary_checked: true,
    provider_execution: false,
    local_model_execution: false,
    release_gate_execution: false
  }
};

writeJson("evidence/current-state/asset_purpose_boundary_report.json", report);
writeJson("evals/reports/asset_purpose_boundary_report.json", report);

console.log(JSON.stringify({
  status: report.status,
  checks: checks.length,
  failures: failures.length
}, null, 2));

if (report.status !== "pass") process.exit(1);
