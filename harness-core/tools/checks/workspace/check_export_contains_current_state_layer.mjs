#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";

const STAGE = "v2.0.0-post-final-dossier-agent-ready-export-repair";
const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-final-dossier-agent-ready-export.zip";
const EVIDENCE_DIR = "evidence/agent-ready-export-repair";

const REQUIRED_ENTRIES = [
  "CURRENT_STATE.yaml",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "stack.yaml",
  "docs/handoffs/session_handoff_latest.md",
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
  "evidence/current-state/current_state_index.json",
  "evidence/current-state/current_state_gate_report.json",
  "evidence/current-state/current_state_claim_boundary.json",
  "tools/checks/workspace/check_current_state_alignment.mjs",
  "tools/builders/workspace/build_current_state_index.mjs"
];

const REQUIRED_BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function zipInfo(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    entries: result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : []
  };
}

function unzipText(packageAbs, entry) {
  const result = spawnSync("unzip", ["-p", packageAbs, entry], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });
  if (result.status !== 0) return null;
  return result.stdout;
}

function readZipJson(packageAbs, entry) {
  const text = unzipText(packageAbs, entry);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readZipYaml(packageAbs, entry) {
  const text = unzipText(packageAbs, entry);
  if (text === null) return null;
  try {
    return parseYaml(text);
  } catch {
    return null;
  }
}

function forbiddenEntrySets(entries) {
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.startsWith("node_modules/") || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    raw_payload_path: entries.filter((entry) => /(^|\/)(raw[-_])?(request|response)[-_]?payload/i.test(entry)
      || /(^|\/)raw[-_](request|response)/i.test(entry)),
    secret_value_path: entries.filter((entry) => /(^|\/)(secret|api[-_]?key|auth[-_]?header)[-_]?value/i.test(entry)
      || /(^|\/)\.env($|\.)/i.test(entry))
  };
}

function isTextEntry(entry) {
  return /\.(md|txt|yaml|yml|json|mjs|js|schema|lock)$/i.test(entry)
    || !path.basename(entry).includes(".");
}

function isPolicyOrPatternEntry(entry) {
  return /(^|\/)(secret_detection_patterns|raw_storage_forbidden_patterns|telemetry_sink_credential_policy|credential_policy|redaction_policy|provider_canary_attempts)/i.test(entry);
}

function findSecretContentLeaks(packageAbs, entries) {
  const leaks = [];
  const textEntries = entries.filter((entry) => isTextEntry(entry) && !isPolicyOrPatternEntry(entry));
  const secretPatterns = [
    { id: "openai_api_key_like_value", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
    { id: "authorization_bearer_value", pattern: /authorization\s*:\s*bearer\s+(?!<|YOUR_|REDACTED|redacted|placeholder|example)[A-Za-z0-9._~+/=-]{12,}/gi },
    { id: "api_key_assigned_value", pattern: /\b(api[-_]?key|auth[-_]?header|secret)\b\s*[:=]\s*["']?(?!false\b|true\b|null\b|none\b|missing\b|redacted\b|REDACTED\b|placeholder\b|example\b|not_applicable\b|needs_verification\b|forbidden\b|blocked\b)[A-Za-z0-9._~+/=-]{24,}/gi }
  ];
  for (const entry of textEntries) {
    const text = unzipText(packageAbs, entry);
    if (text === null) continue;
    for (const { id, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        leaks.push({
          entry,
          pattern: id,
          excerpt: match[0].slice(0, 24)
        });
        break;
      }
    }
  }
  return leaks;
}

const packageAbs = p(EXPORT_PACKAGE);
const checks = [];
const packageExists = fs.existsSync(packageAbs);
addCheck(checks, "agent-ready export exists", packageExists, { package_path: EXPORT_PACKAGE });

const info = packageExists ? zipInfo(packageAbs) : { exit_code: 1, stdout: "", stderr: "missing package", entries: [] };
const entries = info.entries;
const entrySet = new Set(entries);
const packageSha256 = packageExists ? sha256File(packageAbs) : null;

addCheck(checks, "zip entries readable", info.exit_code === 0, { exit_code: info.exit_code, stderr: info.stderr.trim() });
for (const entry of REQUIRED_ENTRIES) {
  addCheck(checks, `${entry} exists in export`, entrySet.has(entry), { entry });
}

const agentsText = packageExists ? unzipText(packageAbs, "AGENTS.md") || "" : "";
const readmeText = packageExists ? unzipText(packageAbs, "README.md") || "" : "";
const stack = packageExists ? readZipYaml(packageAbs, "stack.yaml") : null;
const providerMatrix = packageExists ? readZipYaml(packageAbs, "adapters/provider_capability_matrix.yaml") : null;
const currentState = packageExists ? readZipYaml(packageAbs, "CURRENT_STATE.yaml") : null;
const currentStateGate = packageExists ? readZipJson(packageAbs, "evidence/current-state/current_state_gate_report.json") : null;
const currentStateClaimBoundary = packageExists ? readZipJson(packageAbs, "evidence/current-state/current_state_claim_boundary.json") : null;

addCheck(checks, "AGENTS.md in export references CURRENT_STATE.yaml", agentsText.includes("CURRENT_STATE.yaml"));
addCheck(checks, "README.md in export reflects v2.0.0-rc.1-postrc-final-dossier", readmeText.includes("v2.0.0-rc.1-postrc-final-dossier")
  && readmeText.includes("CURRENT_STATE.yaml")
  && readmeText.includes("AGENT_BOOTSTRAP.ko.md"));
addCheck(checks, "stack.yaml in export has version v2.0.0 and final dossier status", stack?.version === "v2.0.0"
  && stack?.status === "v2.0.0-rc.1-postrc-final-dossier", stack || {});
addCheck(checks, "provider_capability_matrix.yaml in export does not show Ollama local endpoint as missing", providerMatrix?.providers?.ollama?.local_no_tool_canary !== "blocked_by_missing_local_endpoint", {
  ollama_local_no_tool_canary: providerMatrix?.providers?.ollama?.local_no_tool_canary
});
addCheck(checks, "provider_capability_matrix.yaml in export keeps provider verified false", Object.values(providerMatrix?.providers || {}).every((provider) => provider.verified === false));

const forbidden = forbiddenEntrySets(entries);
const secretContentLeaks = packageExists ? findSecretContentLeaks(packageAbs, entries) : [];
addCheck(checks, "export does not include node_modules", forbidden.node_modules.length === 0, { entries: forbidden.node_modules });
addCheck(checks, "export does not include dist", forbidden.dist.length === 0, { entries: forbidden.dist });
addCheck(checks, "export does not include .git", forbidden.git_metadata.length === 0, { entries: forbidden.git_metadata });
addCheck(checks, "export does not include .DS_Store", forbidden.ds_store.length === 0, { entries: forbidden.ds_store });
addCheck(checks, "export does not include raw payload paths", forbidden.raw_payload_path.length === 0, { entries: forbidden.raw_payload_path });
addCheck(checks, "export does not include secret/API key/auth header value paths", forbidden.secret_value_path.length === 0, { entries: forbidden.secret_value_path });
addCheck(checks, "export does not include raw/secret payload values", secretContentLeaks.length === 0, { leaks: secretContentLeaks });

for (const claim of REQUIRED_BLOCKED_CLAIMS) {
  addCheck(checks, `${claim} remains blocked`, currentState?.blocked_claims?.includes(claim) === true
    && currentStateClaimBoundary?.blocked_claims?.includes(claim) === true, {
    current_state_blocked_claims: currentState?.blocked_claims || [],
    current_state_claim_boundary_blocked_claims: currentStateClaimBoundary?.blocked_claims || []
  });
}

addCheck(checks, "provider-verified allowed flag remains false", currentStateClaimBoundary?.provider_verified_allowed === false
  && currentStateGate?.provider_verified_allowed === false);
addCheck(checks, "adapter-checked allowed flag remains false", currentStateClaimBoundary?.adapter_checked_allowed === false
  && currentStateGate?.adapter_checked_allowed === false);
addCheck(checks, "production-ready allowed flag remains false", currentStateClaimBoundary?.production_ready_allowed === false
  && currentStateGate?.production_ready_allowed === false);
addCheck(checks, "stable allowed flag remains false", currentStateClaimBoundary?.stable_allowed === false
  && currentStateGate?.stable_allowed === false);
addCheck(checks, "release-gated allowed flag remains false", currentStateClaimBoundary?.release_gated_allowed === false
  && currentStateGate?.release_gated_allowed === false);

const failures = checks.filter((check) => check.status !== "pass");
const unresolvedItems = failures.map((failure) => ({
  id: failure.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  status: "blocked",
  reason: failure.name,
  detail: failure.detail
}));

const exportReportPath = p(`${EVIDENCE_DIR}/agent_ready_export_report.json`);
const existingExportReport = fs.existsSync(exportReportPath) ? readJson(exportReportPath) : {};
const summary = {
  package_path: EXPORT_PACKAGE,
  package_sha256: packageSha256,
  package_entry_count: entries.length,
  current_state_layer_included: REQUIRED_ENTRIES.every((entry) => entrySet.has(entry)),
  stale_top_level_docs_check: failures.every((failure) => !/AGENTS|README|stack|provider_capability_matrix/.test(failure.name)),
  node_modules_included: forbidden.node_modules.length > 0,
  dist_included: forbidden.dist.length > 0,
  git_metadata_included: forbidden.git_metadata.length > 0,
  ds_store_included: forbidden.ds_store.length > 0,
  raw_or_secret_included: forbidden.raw_payload_path.length
    + forbidden.secret_value_path.length
    + secretContentLeaks.length > 0
};

const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checks,
  failures,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems,
  export: summary,
  weak_claim_recorded: failures.length === 0 ? "post-final-dossier-agent-ready-export-repaired" : null,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  new_local_model_execution: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  redteam_rerun: false,
  adapter_conformance_rerun: false,
  npm_install_or_ci: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_refreshed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

const mergedExportReport = {
  ...existingExportReport,
  ...summary,
  status: report.status,
  stage: STAGE,
  checked_at: report.generated_at,
  weak_claim_recorded: report.weak_claim_recorded,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  new_local_model_execution: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  redteam_rerun: false,
  adapter_conformance_rerun: false,
  npm_install_or_ci: false,
  reference_baseline_source_modified: false,
  dist_modified: false,
  evidence_reference_baseline_refreshed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
};

const md = `# Agent-Ready Export Gate

Status: ${report.status}

- Stage: ${STAGE}
- Package: ${EXPORT_PACKAGE}
- SHA256: ${packageSha256 || "missing"}
- Entry count: ${entries.length}
- Current-state layer included: ${summary.current_state_layer_included}
- Stale top-level docs check: ${summary.stale_top_level_docs_check}
- node_modules included: ${summary.node_modules_included}
- dist included: ${summary.dist_included}
- git metadata included: ${summary.git_metadata_included}
- .DS_Store included: ${summary.ds_store_included}
- raw/secret included: ${summary.raw_or_secret_included}
- Failures: ${failures.length}
`;

writeJson(p(`${EVIDENCE_DIR}/agent_ready_export_report.json`), mergedExportReport);
writeJson(p(`${EVIDENCE_DIR}/export_contains_current_state_layer_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/agent_ready_export_gate_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status: unresolvedItems.length === 0 ? "pass" : "blocked",
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});
writeText(p("evals/reports/agent_ready_export_gate_report.md"), md);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
