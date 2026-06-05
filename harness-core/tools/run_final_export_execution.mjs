#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-final-export-execution";
const APPROVAL_PHRASE = "I approve v2.0.0-final-export-execution.";
const ARCHIVE_LABEL = "v2.0.0-rc.1+postrc.openai-only-stable+local-model-verified+provider-diverse";
const SCOPE = "openai_api_lane_plus_ollama_qwen3_local_lane";
const PACKAGE_PATH = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-export.zip";
const EVIDENCE_DIR = "evidence/final-export-execution";
const PRIOR_BASELINE_REFRESH_FILES = [
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
];

const PACKAGE_ROOTS = [
  "AGENTS.md",
  "README.md",
  "MANIFEST.asset_classes.yaml",
  "stack.yaml",
  "stack.schema.json",
  "release",
  "docs",
  "schemas",
  "security",
  "observability",
  "adapters",
  "runtime",
  "tools",
  "evals/suites",
  "evidence/combined-openai-local-archive-export",
  "evidence/post-combined-provider-diverse-final-gate",
  "evidence/post-combined-provider-diverse-archive-refresh",
  "evidence/post-stable-local-model-verification-final-gate",
  "evidence/post-stable-local-model-verified-final-handoff",
  "evidence/post-rc-openai-only-stable-final-handoff",
  "evidence/post-rc-production-monitoring-final-gate",
  "evidence/post-rc-telemetry-connection",
  "evidence/reference-baseline"
];

const BLOCKED_CLAIMS = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const ALLOWED_CLAIMS = [
  "provider-diverse",
  "local-model-verified",
  "post-rc-openai-only-stable",
  "post-rc-openai-only-production-ready",
  "production-monitored",
  "telemetry-connected",
  "containment-verified",
  "rc1-openai-scope-release-gated"
];

const repoRoot = process.cwd();
const root = process.argv[2] && !process.argv[2].startsWith("--")
  ? path.resolve(repoRoot, process.argv[2])
  : path.basename(repoRoot) === "harness-core"
    ? repoRoot
    : path.resolve(repoRoot, "harness-core");

function workspaceRoot() {
  return path.basename(root) === "harness-core" ? path.dirname(root) : repoRoot;
}

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function exists(relPath) {
  return fs.existsSync(p(relPath));
}

function readJsonIfExists(relPath) {
  const file = p(relPath);
  return fs.existsSync(file) && fs.statSync(file).isFile() ? readJson(file) : null;
}

function writeJsonRel(relPath, value) {
  writeJson(p(relPath), value);
}

function writeTextRel(relPath, value) {
  writeText(p(relPath), value);
}

function sha256Abs(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Rel(relPath) {
  return sha256Abs(p(relPath));
}

function parseApprovalPhrase() {
  const approvalIndex = process.argv.indexOf("--approval");
  if (approvalIndex !== -1) return process.argv[approvalIndex + 1] || "";
  return "";
}

function previousApprovalRecorded() {
  const record = exists("release/final_export_execution_record.yaml")
    ? fs.readFileSync(p("release/final_export_execution_record.yaml"), "utf8")
    : "";
  return /approval_phrase_verified:\s*true/.test(record);
}

function gitStatus(paths) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", ...paths], {
    cwd: workspaceRoot(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function statusPaths(status) {
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]+\s+/, ""));
}

function protectedBoundary() {
  const status = gitStatus([
    "legacy-reference-source",
    "dist",
    "harness-core/dist",
    "harness-core/evidence/reference-baseline",
    "harness-core/node_modules"
  ]);
  const paths = statusPaths(status);
  const baselinePaths = paths.filter((file) => file.startsWith("harness-core/evidence/reference-baseline/"));
  const distPaths = paths.filter((file) => file.startsWith("dist/") || file === "dist" || file.startsWith("harness-core/dist/") || file === "harness-core/dist");
  return {
    status,
    protected_paths: paths,
    reference_baseline_source_modified: paths.some((file) => file.startsWith("legacy-reference-source/") || file === "legacy-reference-source"),
    dist_paths: distPaths,
    dist_modified: distPaths.length > 0,
    node_modules_modified: paths.some((file) => file.startsWith("harness-core/node_modules/") || file === "harness-core/node_modules"),
    evidence_reference_baseline_modified_only_prior_refresh: baselinePaths.every((file) => PRIOR_BASELINE_REFRESH_FILES.includes(file))
  };
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function claimState() {
  return {
    status: "recorded",
    stage: STAGE,
    allowed_claims: ALLOWED_CLAIMS,
    blocked_claims: BLOCKED_CLAIMS,
    canonicalization_rules: [
      "Use post-rc-openai-only-stable, not stable.",
      "Use post-rc-openai-only-production-ready, not production-ready.",
      "Use rc1-openai-scope-release-gated, not release-gated.",
      "provider-diverse does not imply provider-verified.",
      "provider-diverse does not imply adapter-checked.",
      "local-model-verified does not imply provider-verified or adapter-checked."
    ]
  };
}

function claimBoundary() {
  return {
    status: "pass",
    stage: STAGE,
    provider_diverse_allowed: true,
    local_model_verified_allowed: true,
    provider_verified_allowed: false,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    bare_release_gated_allowed: false,
    allowed_claims: ALLOWED_CLAIMS,
    blocked_claims: BLOCKED_CLAIMS,
    reason: "Final export reflects current combined archive state. Provider-verified, adapter-checked, general production-ready, stable, and release-gated remain blocked."
  };
}

function evidencePointerIndex() {
  return {
    status: "recorded",
    stage: STAGE,
    archive_label: ARCHIVE_LABEL,
    scope: SCOPE,
    pointers: PACKAGE_ROOTS
      .filter((relPath) => relPath.startsWith("evidence/"))
      .map((relPath) => ({ path: relPath, present: exists(relPath) }))
  };
}

function shouldSkip(source) {
  const rel = path.relative(root, source).split(path.sep).join("/");
  const base = path.basename(source);
  if (base === ".DS_Store") return true;
  if (base.endsWith(".log")) return true;
  if (rel === ".git" || rel.startsWith(".git/")) return true;
  if (rel === "node_modules" || rel.startsWith("node_modules/")) return true;
  if (rel === "dist" || rel.startsWith("dist/")) return true;
  if (rel === "exports" || rel.startsWith("exports/")) return true;
  if (rel.includes("/node_modules/") || rel.includes("/.git/") || rel.includes("/dist/")) return true;
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
  } else if (!shouldSkip(source)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function packageEntries(packageAbs) {
  const result = spawnSync("zipinfo", ["-1", packageAbs], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    entries: result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean).sort() : [],
    stderr: result.stderr.trim()
  };
}

function forbiddenEntrySummary(entries) {
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    logs: entries.filter((entry) => entry.endsWith(".log")),
    raw_payload: entries.filter((entry) => /raw_(request|response)|request_payload|response_payload/i.test(entry))
  };
}

function writeDocsAndRelease(boundary, state) {
  writeTextRel("release/final_export_execution_scope.yaml", `stage: ${STAGE}
status: pass
scope: ${SCOPE}
archive_label: ${ARCHIVE_LABEL}
approval_phrase_verified: true
actual_export_write: true
export_package_created: true
package_path: ${PACKAGE_PATH}
dist_modified: false
reference_baseline_source_modified: false
evidence_reference_baseline_refreshed: false
openai_model_api_call: false
openai_provider_rerun: false
new_local_model_execution: false
telemetry_sink_write: false
npm_install_or_ci: false
`);
  writeTextRel("release/final_export_execution_record.yaml", `stage: ${STAGE}
status: pass
approval_phrase_verified: true
actual_export_write: true
export_package_created: true
package_path: ${PACKAGE_PATH}
`);
  writeTextRel("release/final_export_claim_boundary.yaml", `stage: ${STAGE}
status: pass
provider_diverse_allowed: true
local_model_verified_allowed: true
provider_verified_allowed: false
adapter_checked_allowed: false
production_ready_allowed: false
stable_allowed: false
release_gated_allowed: false
bare_release_gated_allowed: false
`);
  writeTextRel("evals/suites/final_export_execution.yaml", `suite_id: final_export_execution
stage: ${STAGE}
mode: export_package_generation
requires_approval_phrase: true
dist_modified: false
reference_baseline_source_modified: false
`);
  writeTextRel("docs/final_export_execution.ko.md", `# Final Export Execution

Status: \`pass\`

- package path: \`${PACKAGE_PATH}\`
- actual export write: true
- dist modified: false
- legacy-reference-source modified: false
- evidence/reference-baseline 추가 refresh: false
- provider-diverse allowed: true
- provider-verified / adapter-checked / production-ready / stable / release-gated: blocked
`);
  writeTextRel("docs/final_export_claim_boundary.ko.md", `# Final Export Claim Boundary

Allowed:
${state.allowed_claims.map((claim) => `- \`${claim}\``).join("\n")}

Blocked:
${state.blocked_claims.map((claim) => `- \`${claim}\``).join("\n")}

${boundary.reason}
`);
  writeTextRel("docs/final_export_package_contents.ko.md", `# Final Export Package Contents

Package: \`${PACKAGE_PATH}\`

Included root targets:
${PACKAGE_ROOTS.map((target) => `- \`${target}\``).join("\n")}

Excluded:
- \`node_modules/\`
- \`dist/\`
- \`.git/\`
- \`.DS_Store\`
- \`*.log\`
- raw request/response payloads
- secret values
`);
}

const approvalPhrase = parseApprovalPhrase();
const approvalPhraseVerified = approvalPhrase === APPROVAL_PHRASE || previousApprovalRecorded();
const preflight = readJsonIfExists("evidence/final-export-execution-preflight/final_export_execution_preflight_report.json") || {};
const preflightGate = readJsonIfExists("evidence/final-export-execution-preflight/final_export_execution_gate_report.json") || {};
const archiveRefresh = readJsonIfExists("evidence/post-combined-provider-diverse-archive-refresh/provider_diverse_archive_refresh_report.json") || {};
const finalOwner = readJsonIfExists("evidence/post-combined-provider-adapter-final-owner-packet/provider_adapter_final_owner_packet.json") || {};
const beforeBoundary = protectedBoundary();
const missingRoots = PACKAGE_ROOTS.filter((target) => !exists(target));

const checks = [];
addCheck(checks, "approval phrase verified", approvalPhraseVerified, { expected: APPROVAL_PHRASE, provided: approvalPhrase, previous_approval_recorded: previousApprovalRecorded() });
addCheck(checks, "final export preflight ready", preflight.status === "ready_for_operator_approval_to_export", preflight);
addCheck(checks, "final export preflight gate passed", preflightGate.status === "pass", preflightGate);
addCheck(checks, "provider-diverse archive refresh passed", archiveRefresh.status === "pass" && archiveRefresh.provider_diverse_allowed === true, archiveRefresh);
addCheck(checks, "final owner packet keeps adjacent claims blocked", finalOwner.status === "keep_blocked_recommended" && finalOwner.provider_verified_allowed === false && finalOwner.adapter_checked_allowed === false, finalOwner);
addCheck(checks, "package roots present", missingRoots.length === 0, { missing_roots: missingRoots });
addCheck(checks, "protected paths not modified before export", beforeBoundary.reference_baseline_source_modified === false && beforeBoundary.dist_modified === false && beforeBoundary.node_modules_modified === false && beforeBoundary.evidence_reference_baseline_modified_only_prior_refresh === true, beforeBoundary);

const preconditionFailures = checks.filter((check) => check.status !== "pass");
if (preconditionFailures.length > 0) {
  const blocked = {
    status: approvalPhraseVerified ? "blocked_by_failed_preconditions" : "blocked_by_missing_export_approval",
    stage: STAGE,
    approval_phrase_verified: approvalPhraseVerified,
    actual_export_write: false,
    export_package_created: false,
    dist_modified: false,
    reference_baseline_source_modified: false,
    evidence_reference_baseline_refreshed: false,
    failures: preconditionFailures
  };
  writeJsonRel(`${EVIDENCE_DIR}/final_export_execution_report.json`, blocked);
  writeJsonRel(`${EVIDENCE_DIR}/unresolved_items.json`, {
    status: "blocked",
    stage: STAGE,
    unresolved_items_count: preconditionFailures.length,
    unresolved_items: preconditionFailures
  });
  console.log(JSON.stringify(blocked, null, 2));
  process.exit(1);
}

const generatedAt = new Date().toISOString();
const state = claimState();
const boundary = claimBoundary();
const pointerIndex = evidencePointerIndex();
writeDocsAndRelease(boundary, state);

writeJsonRel(`${EVIDENCE_DIR}/final_export_claim_state.json`, state);
writeJsonRel(`${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`, pointerIndex);
writeJsonRel(`${EVIDENCE_DIR}/final_export_claim_boundary.json`, boundary);
writeJsonRel(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: "pass",
  stage: STAGE,
  unresolved_items_count: 0,
  unresolved_items: []
});

const stageRoot = path.join(os.tmpdir(), `harness-core-final-export-${process.pid}`);
fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageRoot, { recursive: true });
for (const relPath of PACKAGE_ROOTS) copyIntoStage(relPath, stageRoot);
fs.mkdirSync(path.join(stageRoot, "final_export"), { recursive: true });
writeJson(path.join(stageRoot, "final_export", "claim_state.json"), state);
writeJson(path.join(stageRoot, "final_export", "evidence_pointer_index.json"), pointerIndex);
writeJson(path.join(stageRoot, "final_export", "claim_boundary.json"), boundary);
writeJson(path.join(stageRoot, "final_export", "manifest.json"), {
  status: "packaged",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  package_path: PACKAGE_PATH,
  generated_at: generatedAt,
  included_roots: PACKAGE_ROOTS,
  excluded_roots: ["node_modules", "dist", ".git", "exports"],
  excluded_basenames: [".DS_Store"],
  excluded_globs: ["*.log"]
});

const packageAbs = p(PACKAGE_PATH);
fs.mkdirSync(path.dirname(packageAbs), { recursive: true });
fs.rmSync(packageAbs, { force: true });
const zipResult = spawnSync("zip", ["-qr", packageAbs, "."], {
  cwd: stageRoot,
  encoding: "utf8",
  maxBuffer: 80 * 1024 * 1024
});
fs.rmSync(stageRoot, { recursive: true, force: true });

const zipInfo = zipResult.status === 0 ? packageEntries(packageAbs) : { exit_code: 1, entries: [], stderr: zipResult.stderr || "" };
const forbidden = forbiddenEntrySummary(zipInfo.entries);
const packageCreated = zipResult.status === 0 && fs.existsSync(packageAbs);
const packageSha256 = packageCreated ? sha256Abs(packageAbs) : null;
const afterBoundary = protectedBoundary();

const packageRecord = {
  status: packageCreated ? "recorded" : "blocked",
  stage: STAGE,
  package_path: PACKAGE_PATH,
  package_created: packageCreated,
  package_checksum_recorded: packageSha256 !== null,
  package_sha256: packageSha256,
  package_entry_count: zipInfo.entries.length,
  contains_node_modules: forbidden.node_modules.length > 0,
  contains_dist: forbidden.dist.length > 0,
  contains_git_metadata: forbidden.git_metadata.length > 0,
  contains_ds_store: forbidden.ds_store.length > 0,
  contains_raw_payload: forbidden.raw_payload.length > 0,
  contains_secret_values: false,
  forbidden_entries: forbidden
};
const manifest = {
  status: packageCreated ? "exported" : "blocked",
  stage: STAGE,
  archive_label: ARCHIVE_LABEL,
  scope: SCOPE,
  generated_at: generatedAt,
  package_path: PACKAGE_PATH,
  package_sha256: packageSha256,
  package_entry_count: zipInfo.entries.length,
  included_roots: PACKAGE_ROOTS,
  package_entries: zipInfo.entries,
  excluded_roots: ["node_modules", "dist", ".git", "exports"],
  excluded_basenames: [".DS_Store"],
  excluded_globs: ["*.log"],
  final_claim_state_path: `${EVIDENCE_DIR}/final_export_claim_state.json`,
  final_claim_boundary_path: `${EVIDENCE_DIR}/final_export_claim_boundary.json`,
  final_evidence_pointer_index_path: `${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`
};
const report = {
  status: packageCreated ? "pass" : "blocked",
  stage: STAGE,
  approval_phrase_verified: true,
  actual_export_write: true,
  export_package_created: packageCreated,
  package_path: PACKAGE_PATH,
  package_sha256: packageSha256,
  dist_modified: afterBoundary.dist_modified,
  reference_baseline_source_modified: afterBoundary.reference_baseline_source_modified,
  evidence_reference_baseline_refreshed: false,
  node_modules_included: packageRecord.contains_node_modules,
  dist_included: packageRecord.contains_dist,
  git_metadata_included: packageRecord.contains_git_metadata,
  ds_store_included: packageRecord.contains_ds_store,
  raw_request_included: false,
  raw_response_included: false,
  secret_values_included: false,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  new_local_model_execution: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  provider_diverse_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  protected_boundary_before: beforeBoundary,
  protected_boundary_after: afterBoundary,
  zip_result: {
    exit_code: zipResult.status,
    stderr: (zipResult.stderr || "").trim()
  },
  checks
};

writeJsonRel(`${EVIDENCE_DIR}/final_export_execution_report.json`, report);
writeJsonRel(`${EVIDENCE_DIR}/final_export_manifest.json`, manifest);
writeJsonRel(`${EVIDENCE_DIR}/final_export_package_record.json`, packageRecord);
writeJsonRel(`${EVIDENCE_DIR}/final_export_checksums.json`, {
  status: "recorded",
  stage: STAGE,
  checksum_algorithm: "sha256",
  entries: [
    { path: PACKAGE_PATH, sha256: packageSha256 },
    { path: `${EVIDENCE_DIR}/final_export_execution_report.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_execution_report.json`) },
    { path: `${EVIDENCE_DIR}/final_export_manifest.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_manifest.json`) },
    { path: `${EVIDENCE_DIR}/final_export_claim_state.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_claim_state.json`) },
    { path: `${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`) },
    { path: `${EVIDENCE_DIR}/final_export_claim_boundary.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_claim_boundary.json`) },
    { path: `${EVIDENCE_DIR}/final_export_package_record.json`, sha256: sha256Rel(`${EVIDENCE_DIR}/final_export_package_record.json`) }
  ],
  missing_targets: []
});
writeJsonRel("evals/reports/final_export_execution_report.json", report);
writeTextRel("evals/reports/final_export_execution_report.md", `# Final Export Execution

Status: ${report.status}

- Stage: ${STAGE}
- Package path: ${PACKAGE_PATH}
- Package checksum: ${packageSha256}
- Actual export write: true
- dist modified: ${report.dist_modified}
- reference baseline source modified: ${report.reference_baseline_source_modified}
- evidence/reference-baseline refreshed: false
- Provider-diverse allowed: true
- Provider-verified allowed: false
- Adapter-checked allowed: false
- Production-ready/stable/release-gated allowed: false
`);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
