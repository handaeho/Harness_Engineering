#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const EVIDENCE_DIR = "evidence/clean-artifact-prune";
const FINAL_SURFACE_EVIDENCE_DIR = "evidence/harness-core-final-surface-git-readiness";
const CLEAN_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const LEGACY_TOKEN = ["v", "36"].join("");
const OLD_SOURCE_PATH = ["prompt-stack", LEGACY_TOKEN].join("/");
const OLD_BASELINE_PATH = ["evidence", `${LEGACY_TOKEN}-baseline`].join("/");
const OLD_COMPARE_CHECKER = ["compare_", LEGACY_TOKEN, "_baseline.mjs"].join("");

const CLEAN_EXPORT_ROOTS = [
  "CURRENT_STATE.json",
  "CURRENT_STATE.yaml",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "NAME_MIGRATION.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/name_migration_to_harness_core.ko.md",
  "docs/workspace/reference_baseline_policy.ko.md",
  "docs/workspace/reference_baseline_deemphasis.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "profiles/agents",
  "release/claims/general/claim_ladder.md",
  "release/claims/general/current_state_claim_boundary.yaml",
  "release/scopes/project-rename/project_rename_to_harness_core_scope.yaml",
  "release/claims/project-rename/project_rename_claim_boundary.yaml",
  "release/scopes/agent-ready/self_contained_agent_ready_check_scope.yaml",
  "release/claims/agent-ready/self_contained_agent_ready_claim_boundary.yaml",
  "release/scopes/reference-baseline/reference_baseline_deemphasis_scope.yaml",
  "release/claims/reference-baseline/reference_baseline_claim_boundary.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "tools/checks/workspace/check_clean_export_self_contained.mjs",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "evidence/current-state",
  "evidence/reference-baseline",
  "evidence/reference-baseline-deemphasis",
  "evidence/harness-core-final-surface-git-readiness"
];

const REQUIRED_ENTRIES = [
  "CURRENT_STATE.json",
  "CURRENT_STATE.yaml",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/reference_baseline_policy.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
  "release/scopes/reference-baseline/reference_baseline_deemphasis_scope.yaml",
  "release/claims/reference-baseline/reference_baseline_claim_boundary.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "tools/checks/workspace/check_clean_export_self_contained.mjs",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "evidence/current-state/current_state_index.json",
  "evidence/current-state/current_state_gate_report.json",
  "evidence/current-state/current_state_claim_boundary.json",
  "evidence/reference-baseline/file_inventory.json",
  "evidence/reference-baseline/checksums.json",
  "evidence/reference-baseline-deemphasis/reference_baseline_deemphasis_report.json",
  "evidence/reference-baseline-deemphasis/reference_baseline_integrity_report.json",
  "evidence/harness-core-final-surface-git-readiness/harness_core_no_legacy_surface_report.json",
  "evidence/harness-core-final-surface-git-readiness/reference_baseline_integrity_report.json",
  "evidence/harness-core-final-surface-git-readiness/git_readiness_report.json",
  "evidence/harness-core-final-surface-git-readiness/harness_core_final_surface_gate_report.json"
];

const INTERNAL_ARCHIVE_SHA_REPORT_ENTRIES = [
  "evidence/self-contained-agent-ready-check/self_contained_clean_export_check.json",
  "evidence/self-contained-agent-ready-check/self_contained_gate_report.json",
  "evidence/clean-artifact-prune/agent_ready_clean_export_report.json"
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

function trimProcessText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function collectStageFiles(stageRoot) {
  const files = [];
  function walk(absDir) {
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        files.push({
          abs,
          rel: path.relative(stageRoot, abs).split(path.sep).join("/")
        });
      }
    }
  }
  walk(stageRoot);
  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

function createZipArchiveWithNode(stageRoot, exportAbs) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of collectStageFiles(stageRoot)) {
    const name = Buffer.from(file.rel, "utf8");
    const data = fs.readFileSync(file.abs);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const checksum = crc32(data);
    const flags = 0x0800;
    const method = 8;
    const localOffset = offset;

    const local = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(flags),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(checksum),
      writeUInt32(compressed.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      name,
      compressed
    ]);
    chunks.push(local);
    offset += local.length;

    central.push(Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(flags),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(checksum),
      writeUInt32(compressed.length),
      writeUInt32(data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(localOffset),
      name
    ]));
  }

  const centralOffset = offset;
  const centralBuffer = Buffer.concat(central);
  const end = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(central.length),
    writeUInt16(central.length),
    writeUInt32(centralBuffer.length),
    writeUInt32(centralOffset),
    writeUInt16(0)
  ]);

  fs.writeFileSync(exportAbs, Buffer.concat([...chunks, centralBuffer, end]));
  return {
    status: 0,
    stderr: "",
    method: "node-zip-writer"
  };
}

function createZipArchive(stageRoot, exportAbs) {
  const zip = spawnSync("zip", ["-qr", exportAbs, "."], {
    cwd: stageRoot,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (zip.status === 0 && fs.existsSync(exportAbs)) {
    return {
      status: 0,
      stderr: trimProcessText(zip.stderr),
      method: "zip -qr"
    };
  }

  try {
    const fallback = createZipArchiveWithNode(stageRoot, exportAbs);
    return {
      ...fallback,
      stderr: [trimProcessText(zip.stderr), zip.error?.message].filter(Boolean).join("\n")
    };
  } catch (error) {
    return {
      status: 1,
      stderr: [trimProcessText(zip.stderr), zip.error?.message, error.message].filter(Boolean).join("\n"),
      method: "node-zip-writer"
    };
  }
}

function shouldSkip(absPath) {
  const relPath = rel(absPath);
  if (!relPath || relPath === ".") return false;
  if (relPath === "node_modules" || relPath.startsWith("node_modules/") || relPath.includes("/node_modules/")) return true;
  if (relPath === "dist" || relPath.startsWith("dist/") || relPath.includes("/dist/")) return true;
  if (relPath === ".git" || relPath.startsWith(".git/") || relPath.includes("/.git/")) return true;
  if (relPath === "exports" || relPath.startsWith("exports/")) return true;
  if (relPath === "archive/legacy-handoffs" || relPath.startsWith("archive/legacy-handoffs/")) return true;
  if (relPath === "evidence/clean-artifact-prune" || relPath.startsWith("evidence/clean-artifact-prune/")) return true;
  if (relPath === "evidence/self-contained-agent-ready-check" || relPath.startsWith("evidence/self-contained-agent-ready-check/")) return true;
  if (relPath === `${FINAL_SURFACE_EVIDENCE_DIR}/clean_export_surface_report.json`) return true;
  if (path.basename(absPath) === ".DS_Store") return true;
  return false;
}

function copyIntoStage(relPath, stageRoot) {
  const source = p(relPath);
  if (!fs.existsSync(source)) return;
  const destination = path.join(stageRoot, ...relPath.split("/"));
  if (fs.statSync(source).isDirectory()) {
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

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readZipDirectory(zipPath) {
  const buffer = fs.readFileSync(zipPath);
  const eocd = findEndOfCentralDirectory(buffer);
  if (eocd < 0) throw new Error("zip end of central directory not found");

  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocd + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end && entries.length < totalEntries) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`invalid central directory header at ${offset}`);
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer.toString("utf8", nameStart, nameStart + fileNameLength);
    entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset });
    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return { buffer, entries };
}

function zipEntryData(parsed, entry) {
  const { buffer } = parsed;
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`invalid local file header for ${entry.name}`);
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.method === 0) return compressed;
  if (entry.method === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`unsupported zip compression method ${entry.method} for ${entry.name}`);
}

function zipEntries(zipPath) {
  const result = spawnSync("zipinfo", ["-1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout.split(/\r?\n/).filter(Boolean).sort();
  try {
    return readZipDirectory(zipPath).entries.map((entry) => entry.name).filter(Boolean).sort();
  } catch {
    return [];
  }
}

function unzipText(zipPath, entry) {
  const result = spawnSync("unzip", ["-p", zipPath, entry], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout;
  try {
    const parsed = readZipDirectory(zipPath);
    const found = parsed.entries.find((item) => item.name === entry);
    if (!found || found.name.endsWith("/")) return "";
    return zipEntryData(parsed, found).toString("utf8");
  } catch {
    return "";
  }
}

function textEntries(entries) {
  return entries.filter((entry) => /\.(md|txt|yaml|yml|json|mjs|js|schema|lock)$/i.test(entry));
}

function findTextOccurrences(zipPath, entries, values) {
  const matches = [];
  const needles = values.filter(Boolean);
  for (const entry of textEntries(entries)) {
    const text = unzipText(zipPath, entry);
    for (const value of needles) {
      if (text.includes(value)) matches.push({ entry, value });
    }
  }
  return matches;
}

function forbiddenEntries(entries) {
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.startsWith("node_modules/") || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    old_exports: entries.filter((entry) => entry.startsWith("exports/") && entry.endsWith(".zip")),
    archive_legacy_handoffs: entries.filter((entry) => entry === "archive/legacy-handoffs/" || entry.startsWith("archive/legacy-handoffs/")),
    nested_harness_core: entries.filter((entry) => entry === "harness-core/" || entry.startsWith("harness-core/")),
    internal_archive_sha_reports: entries.filter((entry) => INTERNAL_ARCHIVE_SHA_REPORT_ENTRIES.includes(entry)),
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

function readJsonIfExists(relPath) {
  try {
    return JSON.parse(fs.readFileSync(p(relPath), "utf8"));
  } catch {
    return null;
  }
}

function checkerStatusPassish(report) {
  return report?.status === "pass" || report?.status === "ready_for_owner_commit_approval";
}

function writeFinalSurfaceGateReport(cleanExportSurfaceReport = null) {
  const currentState = readJsonIfExists("CURRENT_STATE.json");
  const providerVerifiedAllowed = currentState?.allowed_claims?.includes("provider-verified") === true
    && currentState?.blocked_claims?.includes("provider-verified") !== true;
  const noLegacySurfaceReport = readJsonIfExists(`${FINAL_SURFACE_EVIDENCE_DIR}/harness_core_no_legacy_surface_report.json`);
  const referenceBaselineReport = readJsonIfExists(`${FINAL_SURFACE_EVIDENCE_DIR}/reference_baseline_integrity_report.json`);
  const gitReadinessReport = readJsonIfExists(`${FINAL_SURFACE_EVIDENCE_DIR}/git_readiness_report.json`);
  const inputFailures = [
    ["no_legacy_surface_status", noLegacySurfaceReport?.status || "missing"],
    ["reference_baseline_integrity_status", referenceBaselineReport?.status || "missing"],
    ["git_readiness_status", gitReadinessReport?.status || "missing"]
  ].filter(([, status]) => status !== "pass" && status !== "ready_for_owner_commit_approval");
  const cleanStatus = cleanExportSurfaceReport?.status || "pending_generation_for_current_archive";
  const cleanExportReady = cleanStatus === "pass" || cleanStatus === "pending_generation_for_current_archive";
  const status = inputFailures.length === 0 && cleanExportReady ? "pass" : "blocked";
  const gateReport = {
    status,
    stage: STAGE,
    generated_at: new Date().toISOString(),
    weak_claims_recorded: [
      "harness-core-final-surface-checked",
      "reference-baseline-integrity-checked",
      "harness-core-git-readiness-recorded",
      "harness-core-agent-ready-export-refreshed"
    ],
    no_legacy_surface_status: noLegacySurfaceReport?.status || "missing",
    reference_baseline_integrity_status: referenceBaselineReport?.status || "missing",
    git_readiness_status: gitReadinessReport?.status || "missing",
    clean_export_surface_status: cleanStatus,
    clean_export_surface_report_path: `${FINAL_SURFACE_EVIDENCE_DIR}/clean_export_surface_report.json`,
    clean_export_path: CLEAN_EXPORT_PATH,
    clean_export_sha256_embedded_in_archive: false,
    commit_performed: false,
    commit_approval_required: true,
    provider_verified_allowed: providerVerifiedAllowed,
    adapter_checked_allowed: false,
    production_ready_allowed: false,
    stable_allowed: false,
    release_gated_allowed: false,
    unresolved_items_count: inputFailures.length,
    unresolved_items: inputFailures.map(([name, itemStatus]) => ({
      id: name,
      status: itemStatus,
      reason: `${name} is ${itemStatus}`
    }))
  };
  writeJson(p(`${FINAL_SURFACE_EVIDENCE_DIR}/harness_core_final_surface_gate_report.json`), gateReport);
  writeJson(p(`${FINAL_SURFACE_EVIDENCE_DIR}/unresolved_items.json`), {
    status: status === "pass" ? "pass" : "blocked",
    stage: STAGE,
    generated_at: gateReport.generated_at,
    unresolved_items_count: gateReport.unresolved_items_count,
    unresolved_items: gateReport.unresolved_items
  });
  return gateReport;
}

const pruneReportPath = p(`${EVIDENCE_DIR}/clean_artifact_prune_report.json`);
if (fs.existsSync(pruneReportPath)) {
  const pruneReport = JSON.parse(fs.readFileSync(pruneReportPath, "utf8"));
  if (pruneReport.status !== "pass") {
    console.error("Refusing clean export: clean artifact prune did not pass.");
    process.exit(1);
  }
}

writeFinalSurfaceGateReport();

const stageRoot = path.join(os.tmpdir(), `harness-core-agent-ready-${process.pid}`);
fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageRoot, { recursive: true });
for (const relPath of CLEAN_EXPORT_ROOTS) copyIntoStage(relPath, stageRoot);

const exportAbs = p(CLEAN_EXPORT_PATH);
fs.mkdirSync(path.dirname(exportAbs), { recursive: true });
fs.rmSync(exportAbs, { force: true });
const zip = createZipArchive(stageRoot, exportAbs);
fs.rmSync(stageRoot, { recursive: true, force: true });

const created = zip.status === 0 && fs.existsSync(exportAbs);
const entries = created ? zipEntries(exportAbs) : [];
const entrySet = new Set(entries);
const missingRequiredEntries = REQUIRED_ENTRIES.filter((entry) => !entrySet.has(entry));
const bad = forbiddenEntries(entries);
const forbiddenCount = Object.values(bad).reduce((sum, items) => sum + items.length, 0);
const oldLabelMatches = created ? findTextOccurrences(exportAbs, entries, [
  OLD_SOURCE_PATH,
  OLD_BASELINE_PATH,
  OLD_COMPARE_CHECKER,
  LEGACY_TOKEN
]) : [];
const sha256 = created ? sha256File(exportAbs) : null;

const report = {
  status: created && missingRequiredEntries.length === 0 && forbiddenCount === 0 && oldLabelMatches.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "agent-ready-clean-export-created",
  export_path: CLEAN_EXPORT_PATH,
  export_sha256: sha256,
  export_entry_count: entries.length,
  current_state_json_included: entrySet.has("CURRENT_STATE.json"),
  current_state_layer_included: entrySet.has("CURRENT_STATE.yaml") && entrySet.has("evidence/current-state/current_state_index.json"),
  reference_baseline_included: entrySet.has("evidence/reference-baseline/file_inventory.json")
    && entrySet.has("evidence/reference-baseline/checksums.json"),
  reference_baseline_checker_included: entrySet.has("tools/checks/workspace/check_reference_baseline_integrity.mjs"),
  start_here_included: entrySet.has("START_HERE_FOR_AGENTS.ko.md"),
  agent_bootstrap_included: entrySet.has("AGENT_BOOTSTRAP.ko.md"),
  agent_profiles_included: [
    "profiles/agents/codex_goal_executor.yaml",
    "profiles/agents/chatgpt_reviewer.yaml",
    "profiles/agents/local_runtime_operator.yaml",
    "profiles/agents/release_gate_reviewer.yaml"
  ].every((entry) => entrySet.has(entry)),
  self_contained_checker_included: entrySet.has("tools/checks/workspace/check_agent_ready_self_contained.mjs"),
  clean_export_self_contained_checker_included: entrySet.has("tools/checks/workspace/check_clean_export_self_contained.mjs"),
  internal_archive_sha_reports_included: bad.internal_archive_sha_reports.length > 0,
  node_modules_included: bad.node_modules.length > 0,
  dist_included: bad.dist.length > 0,
  git_metadata_included: bad.git_metadata.length > 0,
  ds_store_included: bad.ds_store.length > 0,
  old_exports_included: bad.old_exports.length > 0,
  nested_harness_core_included: bad.nested_harness_core.length > 0,
  archive_legacy_handoffs_included: bad.archive_legacy_handoffs.length > 0,
  raw_payload_included: bad.raw_payload_path.length > 0,
  secret_values_included: bad.secret_value_path.length > 0,
  old_label_present: oldLabelMatches.length > 0,
  old_label_matches: oldLabelMatches,
  provider_verified_allowed: readJsonIfExists("CURRENT_STATE.json")?.allowed_claims?.includes("provider-verified") === true
    && readJsonIfExists("CURRENT_STATE.json")?.blocked_claims?.includes("provider-verified") !== true,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  missing_required_entries: missingRequiredEntries,
  forbidden_entries: bad,
  zip_method: zip.method,
  zip_exit_code: zip.status,
  zip_stderr: zip.stderr
};

const cleanExportSurfaceReport = {
  status: report.status,
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "harness-core-agent-ready-export-refreshed",
  export_path: CLEAN_EXPORT_PATH,
  export_sha256: sha256,
  export_entry_count: entries.length,
  current_state_json_included: report.current_state_json_included,
  current_state_layer_included: report.current_state_layer_included,
  reference_baseline_included: report.reference_baseline_included,
  reference_baseline_checker_included: report.reference_baseline_checker_included,
  no_legacy_surface_checker_included: entrySet.has("tools/checks/workspace/check_harness_core_no_legacy_surface.mjs"),
  git_readiness_checker_included: entrySet.has("tools/checks/workspace/check_harness_core_git_readiness.mjs"),
  final_surface_gate_report_included: entrySet.has(`${FINAL_SURFACE_EVIDENCE_DIR}/harness_core_final_surface_gate_report.json`),
  clean_export_sha256_embedded_in_archive: false,
  clean_export_surface_report_embedded_in_archive: entrySet.has(`${FINAL_SURFACE_EVIDENCE_DIR}/clean_export_surface_report.json`),
  node_modules_included: report.node_modules_included,
  dist_included: report.dist_included,
  git_metadata_included: report.git_metadata_included,
  ds_store_included: report.ds_store_included,
  old_exports_included: report.old_exports_included,
  archive_legacy_handoffs_included: report.archive_legacy_handoffs_included,
  nested_harness_core_included: report.nested_harness_core_included,
  old_label_present: report.old_label_present,
  provider_verified_allowed: report.provider_verified_allowed,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  missing_required_entries: missingRequiredEntries,
  forbidden_entries: bad
};

writeJson(p(`${FINAL_SURFACE_EVIDENCE_DIR}/clean_export_surface_report.json`), cleanExportSurfaceReport);
writeFinalSurfaceGateReport(cleanExportSurfaceReport);

const manifest = {
  status: report.status === "pass" ? "exported" : "fail",
  stage: STAGE,
  generated_at: report.generated_at,
  export_path: CLEAN_EXPORT_PATH,
  export_sha256: sha256,
  export_entry_count: entries.length,
  included_roots: CLEAN_EXPORT_ROOTS,
  required_entries: REQUIRED_ENTRIES,
  package_entries: entries,
  excluded_roots: ["node_modules", "dist", ".git", "exports", "archive/legacy-handoffs", "evidence/clean-artifact-prune", "evidence/self-contained-agent-ready-check"],
  excluded_internal_archive_sha_report_entries: INTERNAL_ARCHIVE_SHA_REPORT_ENTRIES
};

writeJson(p(`${EVIDENCE_DIR}/agent_ready_clean_export_report.json`), report);
writeJson(p(`${EVIDENCE_DIR}/agent_ready_clean_export_manifest.json`), manifest);
writeJson(p(`${EVIDENCE_DIR}/agent_ready_clean_export_checksums.json`), {
  status: "recorded",
  stage: STAGE,
  export: {
    path: CLEAN_EXPORT_PATH,
    sha256
  },
  required_entry_source_checksums: REQUIRED_ENTRIES.map(fileRecord)
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
