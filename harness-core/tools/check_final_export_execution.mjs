#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { readJson, writeJson, writeText } from "./lib/file_walk.mjs";

const STAGE = "v2.0.0-final-export-execution";
const EVIDENCE_DIR = "evidence/final-export-execution";
const PACKAGE_PATH = "exports/v2.0.0-rc.1-postrc-openai-local-provider-diverse-export.zip";
const PRIOR_BASELINE_REFRESH_FILES = [
  "harness-core/evidence/reference-baseline/checksums.json",
  "harness-core/evidence/reference-baseline/file_inventory.json"
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

function sha256Rel(relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(relPath))).digest("hex");
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

function zipEntries() {
  const result = spawnSync("zipinfo", ["-1", p(PACKAGE_PATH)], {
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

function checksumFailures(checksums) {
  const failures = [];
  for (const entry of checksums?.entries || []) {
    if (!entry.path || !entry.sha256 || !exists(entry.path)) {
      failures.push({ path: entry.path, issue: "missing_or_incomplete" });
      continue;
    }
    const actual = sha256Rel(entry.path);
    if (actual !== entry.sha256) failures.push({ path: entry.path, issue: "sha256_mismatch", expected: entry.sha256, actual });
  }
  return failures;
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const report = readJsonIfExists(`${EVIDENCE_DIR}/final_export_execution_report.json`) || {};
const manifest = readJsonIfExists(`${EVIDENCE_DIR}/final_export_manifest.json`) || {};
const checksums = readJsonIfExists(`${EVIDENCE_DIR}/final_export_checksums.json`) || {};
const claimState = readJsonIfExists(`${EVIDENCE_DIR}/final_export_claim_state.json`) || {};
const pointerIndex = readJsonIfExists(`${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`) || {};
const boundary = readJsonIfExists(`${EVIDENCE_DIR}/final_export_claim_boundary.json`) || {};
const packageRecord = readJsonIfExists(`${EVIDENCE_DIR}/final_export_package_record.json`) || {};
const zip = zipEntries();
const forbidden = forbiddenEntrySummary(zip.entries);
const prot = protectedBoundary();
const checksumBad = checksumFailures(checksums);
const requiredFiles = [
  `${EVIDENCE_DIR}/final_export_execution_report.json`,
  `${EVIDENCE_DIR}/final_export_manifest.json`,
  `${EVIDENCE_DIR}/final_export_checksums.json`,
  `${EVIDENCE_DIR}/final_export_claim_state.json`,
  `${EVIDENCE_DIR}/final_export_evidence_pointer_index.json`,
  `${EVIDENCE_DIR}/final_export_claim_boundary.json`,
  `${EVIDENCE_DIR}/final_export_package_record.json`,
  PACKAGE_PATH
];
const missingRequiredFiles = requiredFiles.filter((file) => !exists(file));

const checks = [];
addCheck(checks, "required files exist", missingRequiredFiles.length === 0, { missing_required_files: missingRequiredFiles });
addCheck(checks, "execution report permits only scoped export", report.status === "pass" && report.approval_phrase_verified === true && report.actual_export_write === true && report.export_package_created === true && report.dist_modified === false && report.reference_baseline_source_modified === false && report.evidence_reference_baseline_refreshed === false, report);
addCheck(checks, "manifest recorded package", manifest.status === "exported" && manifest.package_path === PACKAGE_PATH && manifest.package_sha256 === packageRecord.package_sha256, manifest);
addCheck(checks, "checksums valid", checksums.status === "recorded" && checksumBad.length === 0, { checksum_failures: checksumBad });
addCheck(checks, "claim state recorded", claimState.status === "recorded" && claimState.allowed_claims?.includes("provider-diverse") && claimState.blocked_claims?.includes("provider-verified"), claimState);
addCheck(checks, "evidence pointer index recorded", pointerIndex.status === "recorded" && Array.isArray(pointerIndex.pointers), pointerIndex);
addCheck(checks, "claim boundary blocks strong claims", boundary.status === "pass" && boundary.provider_diverse_allowed === true && boundary.provider_verified_allowed === false && boundary.adapter_checked_allowed === false && boundary.production_ready_allowed === false && boundary.stable_allowed === false && boundary.release_gated_allowed === false, boundary);
addCheck(checks, "package record excludes forbidden entries", packageRecord.package_created === true && packageRecord.contains_node_modules === false && packageRecord.contains_dist === false && packageRecord.contains_git_metadata === false && packageRecord.contains_ds_store === false && packageRecord.contains_raw_payload === false && packageRecord.contains_secret_values === false, packageRecord);
addCheck(checks, "zip entries exclude forbidden entries", forbidden.node_modules.length === 0 && forbidden.dist.length === 0 && forbidden.git_metadata.length === 0 && forbidden.ds_store.length === 0 && forbidden.logs.length === 0 && forbidden.raw_payload.length === 0, forbidden);
addCheck(checks, "zip contains required roots", ["AGENTS.md", "README.md", "release/", "docs/", "tools/", "evidence/reference-baseline/"].every((entry) => zip.entries.includes(entry) || zip.entries.some((item) => item.startsWith(entry))), { entries_checked: zip.entries.length });
addCheck(checks, "protected boundary respected", prot.reference_baseline_source_modified === false && prot.dist_modified === false && prot.node_modules_modified === false && prot.evidence_reference_baseline_modified_only_prior_refresh === true, prot);

const failures = checks.filter((check) => check.status !== "pass");
const gate = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  export_package_created: failures.length === 0,
  package_path: PACKAGE_PATH,
  package_sha256: packageRecord.package_sha256 || null,
  can_claim_provider_diverse: failures.length === 0,
  can_claim_provider_verified: false,
  can_claim_adapter_checked: false,
  can_claim_general_stable: false,
  provider_diverse_allowed: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  actual_export_write: true,
  dist_modified: false,
  reference_baseline_source_modified: false,
  evidence_reference_baseline_refreshed: false,
  unresolved_items_count: failures.length,
  reason: failures.length === 0
    ? "Final export package was created for the current combined archive state. Strong provider/adapter/general claims remain blocked."
    : "Final export package checks failed.",
  checks,
  failures
};

writeJsonRel(`${EVIDENCE_DIR}/final_export_gate_report.json`, gate);
writeJsonRel("evals/reports/final_export_gate_report.json", gate);
writeTextRel("evals/reports/final_export_gate_report.md", `# Final Export Gate

Status: ${gate.status}

- Stage: ${STAGE}
- Package path: ${PACKAGE_PATH}
- Package checksum: ${gate.package_sha256 || "missing"}
- Export package created: ${gate.export_package_created}
- Can claim provider-diverse: ${gate.can_claim_provider_diverse}
- Can claim provider-verified: false
- Can claim adapter-checked: false
- Can claim general stable: false
- dist modified: false
- reference baseline source modified: false
- Unresolved items: ${gate.unresolved_items_count}
`);
writeJsonRel(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: failures.length === 0 ? "pass" : "blocked",
  stage: STAGE,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(gate, null, 2));
process.exit(gate.status === "pass" ? 0 : 1);
