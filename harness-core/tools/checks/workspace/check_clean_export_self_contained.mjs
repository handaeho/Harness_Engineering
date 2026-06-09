#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const EVIDENCE_DIR = "evidence/self-contained-agent-ready-check";
const CLEAN_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const LEGACY_TOKEN = ["v", "36"].join("");
const OLD_SOURCE_PATH = ["prompt-stack", LEGACY_TOKEN].join("/");
const OLD_BASELINE_PATH = ["evidence", `${LEGACY_TOKEN}-baseline`].join("/");
const OLD_COMPARE_CHECKER = ["compare_", LEGACY_TOKEN, "_baseline.mjs"].join("");
const OLD_CLEAN_EXPORT_SHA_VALUES = [
  [
    "88748e3f",
    "3a61f06d",
    "4b7c170d",
    "798db524",
    "95c5aa1e",
    "4f93e329",
    "5960eb59",
    "b0336f35"
  ].join(""),
  [
    "ffd62ac5",
    "9971f262",
    "7d7ecd9f",
    "04c18747",
    "903ffdba",
    "606bc5a9",
    "a8a1744b",
    "84c4554a"
  ].join("")
];
const SELF_CONTAINED_COMMAND = "node tools/checks/workspace/check_agent_ready_self_contained.mjs";
const REFERENCE_BASELINE_COMMAND = "node tools/checks/workspace/check_reference_baseline_integrity.mjs";
const CURRENT_STATE_ALIGNMENT_COMMAND = "node tools/checks/workspace/check_current_state_alignment.mjs";
const ZIP_CACHE = new Map();
const CLEAN_EXPORT_DOC_ENTRIES = [
  "AGENT_BOOTSTRAP.ko.md",
  "README.md",
  "START_HERE_FOR_AGENTS.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md"
];

const REQUIRED_ENTRIES = [
  "CURRENT_STATE.json",
  "CURRENT_STATE.yaml",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/reference_baseline_policy.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "tools/checks/workspace/check_clean_export_self_contained.mjs",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "release/scopes/reference-baseline/reference_baseline_deemphasis_scope.yaml",
  "release/claims/reference-baseline/reference_baseline_claim_boundary.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
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

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, "harness-core");
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function trimProcessText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readZipDirectory(zipPath) {
  if (ZIP_CACHE.has(zipPath)) return ZIP_CACHE.get(zipPath);

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

  const parsed = { buffer, entries };
  ZIP_CACHE.set(zipPath, parsed);
  return parsed;
}

function zipEntries(zipPath) {
  const zipinfo = spawnSync("zipinfo", ["-1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (zipinfo.status === 0) {
    return {
      exit_code: 0,
      stderr: trimProcessText(zipinfo.stderr),
      entries: zipinfo.stdout.split(/\r?\n/).filter(Boolean).sort(),
      method: "zipinfo -1"
    };
  }

  const unzip = spawnSync("unzip", ["-Z1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (unzip.status === 0) {
    return {
      exit_code: 0,
      stderr: trimProcessText(unzip.stderr),
      entries: unzip.stdout.split(/\r?\n/).filter(Boolean).sort(),
      method: "unzip -Z1"
    };
  }

  try {
    const parsed = readZipDirectory(zipPath);
    return {
      exit_code: 0,
      stderr: [trimProcessText(unzip.stderr), trimProcessText(zipinfo.stderr), unzip.error?.message, zipinfo.error?.message].filter(Boolean).join("\n"),
      entries: parsed.entries.map((entry) => entry.name).filter(Boolean).sort(),
      method: "node-zip-central-directory"
    };
  } catch (error) {
    return {
      exit_code: 1,
      stderr: [trimProcessText(unzip.stderr), trimProcessText(zipinfo.stderr), unzip.error?.message, zipinfo.error?.message, error.message].filter(Boolean).join("\n"),
      entries: [],
      method: "node-zip-central-directory"
    };
  }
}

function unzipTextWithNode(zipPath, entryName) {
  try {
    const parsed = readZipDirectory(zipPath);
    const entry = parsed.entries.find((item) => item.name === entryName);
    if (!entry || entry.name.endsWith("/")) return "";

    return zipEntryData(parsed, entry).toString("utf8");
  } catch {
    return "";
  }
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

function extractZipWithNode(zipPath, targetDir) {
  const parsed = readZipDirectory(zipPath);
  const targetRoot = path.resolve(targetDir);

  for (const entry of parsed.entries) {
    const normalized = entry.name.replace(/\\/g, "/");
    const destination = path.resolve(targetRoot, ...normalized.split("/").filter(Boolean));
    if (destination !== targetRoot && !destination.startsWith(`${targetRoot}${path.sep}`)) {
      throw new Error(`refusing unsafe zip entry path: ${entry.name}`);
    }
    if (entry.name.endsWith("/")) {
      fs.mkdirSync(destination, { recursive: true });
      continue;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, zipEntryData(parsed, entry));
  }

  return {
    status: 0,
    stderr: "",
    method: "node-zip-central-directory"
  };
}

function extractZip(zipPath, targetDir) {
  const unzip = spawnSync("unzip", ["-q", zipPath, "-d", targetDir], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (unzip.status === 0) {
    return {
      status: 0,
      stderr: trimProcessText(unzip.stderr),
      method: "unzip -q"
    };
  }

  try {
    const fallback = extractZipWithNode(zipPath, targetDir);
    return {
      ...fallback,
      stderr: [trimProcessText(unzip.stderr), unzip.error?.message].filter(Boolean).join("\n")
    };
  } catch (error) {
    return {
      status: 1,
      stderr: [trimProcessText(unzip.stderr), unzip.error?.message, error.message].filter(Boolean).join("\n"),
      method: "node-zip-central-directory"
    };
  }
}

function unzipText(zipPath, entry) {
  const result = spawnSync("unzip", ["-p", zipPath, entry], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout;
  return unzipTextWithNode(zipPath, entry);
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

function isPolicyOrPatternEntry(entry) {
  return /(^|\/)(secret_detection_patterns|raw_storage_forbidden_patterns|telemetry_sink_credential_policy|credential_policy|redaction_policy|provider_canary_attempts)/i.test(entry);
}

function secretContentLeaks(zipPath, entries) {
  const leaks = [];
  const patterns = [
    { id: "openai_api_key_like_value", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
    { id: "authorization_bearer_value", pattern: /authorization\s*:\s*bearer\s+(?!<|YOUR_|REDACTED|redacted|placeholder|example)[A-Za-z0-9._~+/=-]{12,}/gi },
    { id: "api_key_assigned_value", pattern: /\b(api[-_]?key|auth[-_]?header|secret)\b\s*[:=]\s*["']?(?!false\b|true\b|null\b|none\b|missing\b|redacted\b|REDACTED\b|placeholder\b|example\b|not_applicable\b|needs_verification\b|forbidden\b|blocked\b)[A-Za-z0-9._~+/=-]{24,}/gi }
  ];
  for (const entry of textEntries(entries)) {
    if (isPolicyOrPatternEntry(entry)) continue;
    const text = unzipText(zipPath, entry);
    for (const item of patterns) {
      item.pattern.lastIndex = 0;
      const match = item.pattern.exec(text);
      if (match) {
        leaks.push({ entry, pattern: item.id, excerpt: match[0].slice(0, 24) });
        break;
      }
    }
  }
  return leaks;
}

function parseLastJsonObject(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function runExtractedSelfContainedCheck(zipPath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-core-self-contained-"));
  try {
    const extract = extractZip(zipPath, tempRoot);
    if (extract.status !== 0) {
      return {
        status: "fail",
        extract_exit_code: extract.status,
        extract_method: extract.method,
        extract_stderr: extract.stderr,
        checker_exit_code: null,
        checker_stdout_json: null,
        checker_stderr: ""
      };
    }

    const checker = spawnSync(process.execPath, ["tools/checks/workspace/check_agent_ready_self_contained.mjs"], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 80 * 1024 * 1024
    });
    return {
      status: checker.status === 0 ? "pass" : "fail",
      extract_exit_code: extract.status,
      extract_method: extract.method,
      extract_stderr: extract.stderr,
      checker_exit_code: checker.status,
      checker_stdout_json: parseLastJsonObject(checker.stdout),
      checker_stderr: trimProcessText(checker.stderr)
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runExtractedReferenceBaselineIntegrityCheck(zipPath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-core-reference-baseline-"));
  try {
    const extract = extractZip(zipPath, tempRoot);
    if (extract.status !== 0) {
      return {
        status: "fail",
        extract_exit_code: extract.status,
        extract_method: extract.method,
        extract_stderr: extract.stderr,
        checker_exit_code: null,
        checker_stdout_json: null,
        checker_stderr: ""
      };
    }

    const checker = spawnSync(process.execPath, ["tools/checks/workspace/check_reference_baseline_integrity.mjs"], {
      cwd: tempRoot,
      encoding: "utf8",
      maxBuffer: 80 * 1024 * 1024
    });
    return {
      status: checker.status === 0 ? "pass" : "fail",
      extract_exit_code: extract.status,
      extract_method: extract.method,
      extract_stderr: extract.stderr,
      checker_exit_code: checker.status,
      checker_stdout_json: parseLastJsonObject(checker.stdout),
      checker_stderr: trimProcessText(checker.stderr)
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function commandLines(text) {
  return [...text.matchAll(/^\s*node tools\/[^\s`]+/gm)].map((match) => match[0].trim());
}

function sectionAfter(text, marker) {
  const headingPattern = new RegExp(`^#{1,3}.*${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*$`, "gim");
  const headingMatch = headingPattern.exec(text);
  const index = headingMatch ? headingMatch.index : text.toLowerCase().indexOf(marker.toLowerCase());
  if (index === -1) return "";
  const rest = text.slice(index);
  const nextHeading = rest.slice(1).search(/\n#{1,3}\s+/);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading + 1);
}

function currentStateAlignmentRootOnly(text) {
  if (!text.includes(CURRENT_STATE_ALIGNMENT_COMMAND) && !text.includes("tools/checks/workspace/check_current_state_alignment.mjs")) {
    return true;
  }
  const lower = text.toLowerCase();
  return lower.includes("root-workspace-only")
    || lower.includes("root workspace only")
    || text.includes("root workspace mode 전용")
    || text.includes("Root workspace 전용")
    || lower.includes("source-workspace-only")
    || lower.includes("source workspace 전용");
}

function currentStateAlignmentNotDefaultExportCommand(text) {
  if (!text.includes(CURRENT_STATE_ALIGNMENT_COMMAND) && !text.includes("tools/checks/workspace/check_current_state_alignment.mjs")) {
    return true;
  }
  const lower = text.toLowerCase();
  return lower.includes("not the default command")
    || lower.includes("is not the default command")
    || text.includes("기본 명령으로 사용하지")
    || text.includes("기본 health check로 실행")
    || text.includes("root workspace mode 전용");
}

function cleanExportCommandSurface(zipPath, entries) {
  const docs = CLEAN_EXPORT_DOC_ENTRIES.map((entry) => {
    const included = entries.includes(entry);
    const text = included ? unzipText(zipPath, entry) : "";
    const exportSection = sectionAfter(text, "Agent-ready export mode");
    const exportCommands = commandLines(exportSection);
    const allCommands = commandLines(text);
    const mentionsCurrentStateAlignment = text.includes(CURRENT_STATE_ALIGNMENT_COMMAND)
      || text.includes("tools/checks/workspace/check_current_state_alignment.mjs");
    return {
      entry,
      included,
      all_commands: allCommands,
      export_mode_commands: exportCommands,
      export_first_command_is_self_contained: exportCommands[0] === SELF_CONTAINED_COMMAND,
      export_reference_baseline_command_present: exportCommands.includes(REFERENCE_BASELINE_COMMAND),
      current_state_alignment_mentioned: mentionsCurrentStateAlignment,
      current_state_alignment_root_only_if_mentioned: currentStateAlignmentRootOnly(text),
      current_state_alignment_not_default_export_command: currentStateAlignmentNotDefaultExportCommand(text)
    };
  });
  const checks = [];
  addCheck(checks, "clean export docs included", docs.every((doc) => doc.included), { docs });
  addCheck(checks, "clean export docs present self-contained checker as first export command", docs.every((doc) => doc.export_first_command_is_self_contained), { docs });
  addCheck(checks, "clean export docs present reference baseline integrity command", docs.every((doc) => doc.export_reference_baseline_command_present), { docs });
  addCheck(checks, "current-state alignment is root-workspace-only if mentioned", docs.every((doc) => doc.current_state_alignment_root_only_if_mentioned), { docs });
  addCheck(checks, "current-state alignment is not default export command", docs.every((doc) => doc.current_state_alignment_not_default_export_command), { docs });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    root_workspace_first_commands: [
      SELF_CONTAINED_COMMAND,
      CURRENT_STATE_ALIGNMENT_COMMAND,
      REFERENCE_BASELINE_COMMAND
    ],
    agent_ready_export_first_commands: [
      SELF_CONTAINED_COMMAND,
      REFERENCE_BASELINE_COMMAND
    ],
    current_state_alignment_placement: "root_workspace_only",
    docs,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

const checks = [];
const exportAbs = p(CLEAN_EXPORT_PATH);
const exists = fs.existsSync(exportAbs);
const exportSha256 = exists ? sha256File(exportAbs) : null;
addCheck(checks, "clean export exists", exists, { export_path: CLEAN_EXPORT_PATH });

const zip = exists ? zipEntries(exportAbs) : {
  exit_code: 1,
  stderr: "missing clean export",
  entries: [],
  method: "not_run"
};
const entries = zip.entries;
const entrySet = new Set(entries);
addCheck(checks, "zip entries readable", zip.exit_code === 0, { method: zip.method, exit_code: zip.exit_code, stderr: zip.stderr });

const missingRequiredEntries = REQUIRED_ENTRIES.filter((entry) => !entrySet.has(entry));
for (const entry of REQUIRED_ENTRIES) {
  addCheck(checks, `${entry} included`, entrySet.has(entry), { entry });
}
const bad = forbiddenEntries(entries);
const leaks = exists && zip.exit_code === 0 ? secretContentLeaks(exportAbs, entries) : [];
const staleShaMatches = exists && zip.exit_code === 0 ? findTextOccurrences(exportAbs, entries, OLD_CLEAN_EXPORT_SHA_VALUES) : [];
const selfShaMatches = exists && zip.exit_code === 0 ? findTextOccurrences(exportAbs, entries, [exportSha256]) : [];
const oldLabelMatches = exists && zip.exit_code === 0 ? findTextOccurrences(exportAbs, entries, [
  OLD_SOURCE_PATH,
  OLD_BASELINE_PATH,
  OLD_COMPARE_CHECKER,
  LEGACY_TOKEN
]) : [];

addCheck(checks, "reference baseline included", entrySet.has("evidence/reference-baseline/file_inventory.json")
  && entrySet.has("evidence/reference-baseline/checksums.json"));
addCheck(checks, "reference baseline integrity checker included", entrySet.has("tools/checks/workspace/check_reference_baseline_integrity.mjs"));
addCheck(checks, "legacy baseline label not present", oldLabelMatches.length === 0, { matches: oldLabelMatches });
addCheck(checks, "internal archive SHA self-contained reports not included", bad.internal_archive_sha_reports.length === 0, {
  entries: bad.internal_archive_sha_reports
});
addCheck(checks, "node_modules not included", bad.node_modules.length === 0, { entries: bad.node_modules });
addCheck(checks, "dist not included", bad.dist.length === 0, { entries: bad.dist });
addCheck(checks, ".git not included", bad.git_metadata.length === 0, { entries: bad.git_metadata });
addCheck(checks, ".DS_Store not included", bad.ds_store.length === 0, { entries: bad.ds_store });
addCheck(checks, "archive/legacy-handoffs not included", bad.archive_legacy_handoffs.length === 0, { entries: bad.archive_legacy_handoffs });
addCheck(checks, "old exports not included", bad.old_exports.length === 0, { entries: bad.old_exports });
addCheck(checks, "nested harness-core residue not included", bad.nested_harness_core.length === 0, { entries: bad.nested_harness_core });
addCheck(checks, "raw/secret path entries not included", bad.raw_payload_path.length === 0 && bad.secret_value_path.length === 0, { entries: bad });
addCheck(checks, "raw/secret values not included", leaks.length === 0, { leaks });
addCheck(checks, "stale clean export SHA not present", staleShaMatches.length === 0, { matches: staleShaMatches });
addCheck(checks, "clean export does not hard-code its own SHA", selfShaMatches.length === 0, { matches: selfShaMatches });

const extractedCheck = exists && zip.exit_code === 0
  ? runExtractedSelfContainedCheck(exportAbs)
  : {
    status: "fail",
    extract_exit_code: null,
    extract_stderr: "zip not available",
    checker_exit_code: null,
    checker_stdout_json: null,
    checker_stderr: ""
  };
const extractedReferenceBaselineCheck = exists && zip.exit_code === 0
  ? runExtractedReferenceBaselineIntegrityCheck(exportAbs)
  : {
    status: "fail",
    extract_exit_code: null,
    extract_stderr: "zip not available",
    checker_exit_code: null,
    checker_stdout_json: null,
    checker_stderr: ""
  };
const commandSurface = exists && zip.exit_code === 0
  ? cleanExportCommandSurface(exportAbs, entries)
  : {
    status: "fail",
    root_workspace_first_commands: [],
    agent_ready_export_first_commands: [],
    current_state_alignment_placement: "unknown",
    docs: [],
    checks: [],
    failures: [{ name: "zip unavailable", status: "fail", detail: {} }],
    unresolved_items_count: 1
  };
addCheck(checks, "extracted self-contained agent check passes", extractedCheck.status === "pass", extractedCheck);
addCheck(checks, "extracted reference baseline check passes", extractedCheck.checker_stdout_json?.reference_baseline_check_passed === true, {
  reference_baseline_check_passed: extractedCheck.checker_stdout_json?.reference_baseline_check_passed
});
addCheck(checks, "extracted reference baseline integrity command passes", extractedReferenceBaselineCheck.status === "pass"
  && extractedReferenceBaselineCheck.checker_stdout_json?.reference_baseline_check_passed === true, extractedReferenceBaselineCheck);
addCheck(checks, "clean export command surface is root/export separated", commandSurface.status === "pass", commandSurface);
addCheck(checks, "legacy reference source not required", extractedCheck.checker_stdout_json?.requires_legacy_reference_source === false, {
  requires_legacy_reference_source: extractedCheck.checker_stdout_json?.requires_legacy_reference_source
});
addCheck(checks, "provider-verified remains false", extractedCheck.checker_stdout_json?.provider_verified_allowed === false, {
  provider_verified_allowed: extractedCheck.checker_stdout_json?.provider_verified_allowed
});
addCheck(checks, "adapter-checked remains false", extractedCheck.checker_stdout_json?.adapter_checked_allowed === false, {
  adapter_checked_allowed: extractedCheck.checker_stdout_json?.adapter_checked_allowed
});
addCheck(checks, "production-ready remains false", extractedCheck.checker_stdout_json?.production_ready_allowed === false, {
  production_ready_allowed: extractedCheck.checker_stdout_json?.production_ready_allowed
});
addCheck(checks, "stable remains false", extractedCheck.checker_stdout_json?.stable_allowed === false, {
  stable_allowed: extractedCheck.checker_stdout_json?.stable_allowed
});
addCheck(checks, "release-gated remains false", extractedCheck.checker_stdout_json?.release_gated_allowed === false, {
  release_gated_allowed: extractedCheck.checker_stdout_json?.release_gated_allowed
});

const failures = checks.filter((check) => check.status !== "pass");
const unresolvedItems = failures.map((failure) => ({
  id: failure.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  status: "blocked",
  reason: failure.name,
  detail: failure.detail
}));

const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "self-contained-clean-export-checked",
  export_path: CLEAN_EXPORT_PATH,
  export_sha256: exportSha256,
  export_entry_count: entries.length,
  required_entries_missing: missingRequiredEntries,
  current_state_json_included: entrySet.has("CURRENT_STATE.json"),
  current_state_yaml_included: entrySet.has("CURRENT_STATE.yaml"),
  start_here_included: entrySet.has("START_HERE_FOR_AGENTS.ko.md"),
  agent_bootstrap_included: entrySet.has("AGENT_BOOTSTRAP.ko.md"),
  self_contained_checker_included: entrySet.has("tools/checks/workspace/check_agent_ready_self_contained.mjs"),
  clean_export_self_contained_checker_included: entrySet.has("tools/checks/workspace/check_clean_export_self_contained.mjs"),
  reference_baseline_included: entrySet.has("evidence/reference-baseline/file_inventory.json")
    && entrySet.has("evidence/reference-baseline/checksums.json"),
  reference_baseline_checker_included: entrySet.has("tools/checks/workspace/check_reference_baseline_integrity.mjs"),
  internal_archive_sha_reports_included: bad.internal_archive_sha_reports.length > 0,
  extracted_self_contained_agent_check_passed: extractedCheck.status === "pass",
  extracted_self_contained_agent_check: extractedCheck,
  extracted_reference_baseline_integrity_check_passed: extractedReferenceBaselineCheck.status === "pass",
  extracted_reference_baseline_integrity_check: extractedReferenceBaselineCheck,
  command_surface_check_passed: commandSurface.status === "pass",
  command_surface: commandSurface,
  node_modules_included: bad.node_modules.length > 0,
  dist_included: bad.dist.length > 0,
  git_metadata_included: bad.git_metadata.length > 0,
  ds_store_included: bad.ds_store.length > 0,
  old_exports_included: bad.old_exports.length > 0,
  archive_legacy_handoffs_included: bad.archive_legacy_handoffs.length > 0,
  nested_harness_core_included: bad.nested_harness_core.length > 0,
  raw_payload_included: bad.raw_payload_path.length > 0,
  secret_values_included: bad.secret_value_path.length > 0 || leaks.length > 0,
  stale_sha_present: staleShaMatches.length > 0,
  self_referential_sha_hard_code_present: selfShaMatches.length > 0,
  old_label_present: oldLabelMatches.length > 0,
  stale_sha_matches: staleShaMatches,
  self_referential_sha_matches: selfShaMatches,
  old_label_matches: oldLabelMatches,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  checks,
  failures,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
};

const gateReport = {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  self_contained_agent_ready_check_recorded: extractedCheck.checker_stdout_json?.status === "pass",
  self_contained_clean_export_checked: report.status === "pass",
  current_state_json_recorded: report.current_state_json_included,
  dependency_free: extractedCheck.checker_stdout_json?.dependency_free === true,
  clean_export_path: CLEAN_EXPORT_PATH,
  clean_export_sha256: exportSha256,
  clean_export_entry_count: entries.length,
  reference_baseline_check_passed: extractedCheck.checker_stdout_json?.reference_baseline_check_passed === true,
  extracted_reference_baseline_integrity_check_passed: extractedReferenceBaselineCheck.status === "pass",
  command_surface_check_passed: commandSurface.status === "pass",
  current_state_alignment_placement: commandSurface.current_state_alignment_placement,
  requires_legacy_reference_source: false,
  stale_sha_present: staleShaMatches.length > 0,
  self_referential_sha_hard_code_present: selfShaMatches.length > 0,
  old_label_present: oldLabelMatches.length > 0,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: unresolvedItems.length
};

writeJson(`${EVIDENCE_DIR}/self_contained_clean_export_check.json`, report);
writeJson(`${EVIDENCE_DIR}/self_contained_gate_report.json`, gateReport);
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: unresolvedItems.length,
  unresolved_items: unresolvedItems
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
