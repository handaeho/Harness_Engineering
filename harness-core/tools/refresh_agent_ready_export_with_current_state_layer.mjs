#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-post-final-dossier-agent-ready-export-repair";
const EXPORT_PACKAGE = "exports/v2.0.0-rc.1-postrc-final-dossier-agent-ready-export.zip";
const EVIDENCE_DIR = "evidence/agent-ready-export-repair";

const REQUIRED_EXPORT_ENTRIES = [
  "CURRENT_STATE.yaml",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "stack.yaml",
  "docs/session_handoff_latest.md",
  "docs/how_to_apply_harness_to_agents.ko.md",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
  "evidence/current-state/current_state_index.json",
  "evidence/current-state/current_state_gate_report.json",
  "evidence/current-state/current_state_claim_boundary.json",
  "tools/check_current_state_alignment.mjs",
  "tools/build_current_state_index.mjs"
];

const PACKAGE_ROOTS = [
  "CURRENT_STATE.yaml",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "MANIFEST.asset_classes.yaml",
  "stack.yaml",
  "package.json",
  "package-lock.json",
  "profiles",
  "release",
  "docs",
  "schemas",
  "security",
  "observability",
  "adapters",
  "runtime",
  "tools",
  "evals/suites",
  "evals/reports",
  "evidence/current-state",
  "evidence/post-active-scoped-final-release-dossier",
  "evidence/final-export-refresh-after-final-dossier",
  "evidence/reference-baseline"
];

const repoRoot = process.cwd();
const root = path.basename(repoRoot) === "harness-core"
  ? repoRoot
  : path.resolve(repoRoot, "harness-core");

function p(...parts) {
  return path.join(root, ...parts);
}

function rel(absPath) {
  return path.relative(root, absPath).split(path.sep).join("/");
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    command: `node ${script}`,
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function shouldSkip(absPath) {
  const relativePath = rel(absPath);
  if (!relativePath || relativePath === ".") return false;
  if (relativePath === "exports" || relativePath.startsWith("exports/")) return true;
  if (relativePath === "node_modules" || relativePath.startsWith("node_modules/") || relativePath.includes("/node_modules/")) return true;
  if (relativePath === ".git" || relativePath.startsWith(".git/") || relativePath.includes("/.git/")) return true;
  if (relativePath === "dist" || relativePath.startsWith("dist/") || relativePath.includes("/dist/")) return true;
  if (relativePath === EVIDENCE_DIR || relativePath.startsWith(`${EVIDENCE_DIR}/`)) return true;
  if (path.basename(absPath) === ".DS_Store") return true;
  return false;
}

function copyIntoStage(relPath, stageRoot) {
  const source = p(relPath);
  if (!fs.existsSync(source)) return;
  const destination = path.join(stageRoot, ...relPath.split("/"));
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.cpSync(source, destination, {
      recursive: true,
      filter: (item) => !shouldSkip(item)
    });
    return;
  }
  if (shouldSkip(source)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function zipEntries(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return result.status === 0
    ? result.stdout.split(/\r?\n/).filter(Boolean).sort()
    : [];
}

function forbiddenEntries(entries) {
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

function fileRecord(relPath) {
  const file = p(relPath);
  return {
    path: relPath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) && fs.statSync(file).isFile() ? sha256File(file) : null
  };
}

const preflightRuns = [
  runNode("tools/build_current_state_index.mjs"),
  runNode("tools/check_current_state_alignment.mjs")
];
const preflightPassed = preflightRuns.every((run) => run.exit_code === 0);

const stageRoot = path.join(os.tmpdir(), `harness-core-agent-ready-export-${process.pid}`);
fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageRoot, { recursive: true });
for (const relPath of PACKAGE_ROOTS) {
  copyIntoStage(relPath, stageRoot);
}

const packageAbs = p(EXPORT_PACKAGE);
fs.mkdirSync(path.dirname(packageAbs), { recursive: true });
fs.rmSync(packageAbs, { force: true });
const zipResult = spawnSync("zip", ["-qr", packageAbs, "."], {
  cwd: stageRoot,
  encoding: "utf8",
  maxBuffer: 80 * 1024 * 1024
});
fs.rmSync(stageRoot, { recursive: true, force: true });

const packageCreated = zipResult.status === 0 && fs.existsSync(packageAbs);
const entries = packageCreated ? zipEntries(packageAbs) : [];
const entrySet = new Set(entries);
const missingRequiredEntries = REQUIRED_EXPORT_ENTRIES.filter((entry) => !entrySet.has(entry));
const badEntries = forbiddenEntries(entries);
const forbiddenEntryCount = Object.values(badEntries).reduce((sum, items) => sum + items.length, 0);
const packageSha256 = packageCreated ? sha256File(packageAbs) : null;
const currentStateLayerIncluded = missingRequiredEntries.length === 0;
const status = packageCreated && preflightPassed && currentStateLayerIncluded && forbiddenEntryCount === 0 ? "pass" : "fail";
const unresolvedItems = [];

if (!packageCreated) {
  unresolvedItems.push({
    id: "agent_ready_export_not_created",
    status: "blocked",
    reason: zipResult.stderr.trim() || "zip command failed",
    next_action: "Inspect zip command availability and package staging paths."
  });
}
if (!preflightPassed) {
  unresolvedItems.push({
    id: "current_state_preflight_failed",
    status: "blocked",
    reason: "current-state index or alignment preflight failed",
    next_action: "Run node tools/check_current_state_alignment.mjs and fix failures before export refresh."
  });
}
if (missingRequiredEntries.length > 0) {
  unresolvedItems.push({
    id: "required_current_state_entries_missing",
    status: "blocked",
    missing_entries: missingRequiredEntries,
    next_action: "Include the missing current-state/application layer entries in the package roots."
  });
}
if (forbiddenEntryCount > 0) {
  unresolvedItems.push({
    id: "forbidden_entries_in_export",
    status: "blocked",
    forbidden_entries: badEntries,
    next_action: "Remove forbidden generated, metadata, raw payload, or secret-value entries from staging."
  });
}

const report = {
  status,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: status === "pass" ? "post-final-dossier-agent-ready-export-repaired" : null,
  package_path: EXPORT_PACKAGE,
  package_sha256: packageSha256,
  package_entry_count: entries.length,
  current_state_layer_included: currentStateLayerIncluded,
  missing_required_entries: missingRequiredEntries,
  stale_top_level_docs_checked_by: "tools/check_export_contains_current_state_layer.mjs",
  node_modules_included: badEntries.node_modules.length > 0,
  dist_included: badEntries.dist.length > 0,
  git_metadata_included: badEntries.git_metadata.length > 0,
  ds_store_included: badEntries.ds_store.length > 0,
  raw_or_secret_included: badEntries.raw_payload_path.length + badEntries.secret_value_path.length > 0,
  forbidden_entries: badEntries,
  preflight_runs: preflightRuns,
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

const manifest = {
  status: packageCreated ? "exported" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  package_path: EXPORT_PACKAGE,
  package_sha256: packageSha256,
  package_entry_count: entries.length,
  included_roots: PACKAGE_ROOTS,
  required_entries: REQUIRED_EXPORT_ENTRIES,
  package_entries: entries,
  excluded_roots: ["node_modules", "dist", ".git", "exports", EVIDENCE_DIR],
  excluded_basenames: [".DS_Store"]
};

const checksums = {
  status: "recorded",
  stage: STAGE,
  package: {
    path: EXPORT_PACKAGE,
    sha256: packageSha256
  },
  required_entry_source_checksums: REQUIRED_EXPORT_ENTRIES.map(fileRecord)
};

writeJson(p(`${EVIDENCE_DIR}/agent_ready_export_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/agent_ready_export_manifest.json`), manifest);
writeJson(p(`${EVIDENCE_DIR}/agent_ready_export_checksums.json`), checksums);
writeJson(p(`${EVIDENCE_DIR}/unresolved_items.json`), {
  status: unresolvedItems.length === 0 ? "pass" : "blocked",
  stage: STAGE,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});

console.log(JSON.stringify(report, null, 2));
process.exit(status === "pass" ? 0 : 1);
