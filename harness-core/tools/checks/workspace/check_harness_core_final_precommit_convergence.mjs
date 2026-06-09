#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";
import { parse as parseYaml } from "yaml";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const PROJECT_NAME = "HARNESS Core";
const PROJECT_SLUG = "harness-core";
const CLEAN_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const REFERENCE_BASELINE_PATH = "evidence/reference-baseline";
const EVIDENCE_DIR = "evidence/harness-core-final-precommit-convergence";
const oldProjectLiteral = ["prompt", "stack", "v2"].join("-");
const oldProjectAltLiteral = ["prompt_stack", "v2"].join("_");
const oldReferenceLiteral = ["v", "36"].join("");
const oldCompareChecker = ["compare", oldReferenceLiteral, "baseline"].join("_") + ".mjs";
const SELF_CONTAINED_COMMAND = "node tools/checks/workspace/check_agent_ready_self_contained.mjs";
const REFERENCE_BASELINE_COMMAND = "node tools/checks/workspace/check_reference_baseline_integrity.mjs";
const CURRENT_STATE_ALIGNMENT_COMMAND = "node tools/checks/workspace/check_current_state_alignment.mjs";
const FINAL_PRECOMMIT_COMMAND = "node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs";
const APPROVAL_PHRASE = "I approve committing the HARNESS Core rename and final surface cleanup.";

const ACTIVE_ROOTS = [
  "CURRENT_STATE.yaml",
  "CURRENT_STATE.json",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "NAME_MIGRATION.md",
  "docs",
  "profiles/agents",
  "release",
  "tools",
  "schemas",
  "stack.schema.json",
  "stack.yaml",
  "package.json",
  "evals/fixtures/static/required_files.json"
];

const COMMAND_DOCS = [
  "AGENT_BOOTSTRAP.ko.md",
  "README.md",
  "START_HERE_FOR_AGENTS.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/workspace/harness_core_final_precommit_convergence.ko.md"
];

const BLOCKED_CLAIM_FLAGS = [
  "provider_verified_allowed",
  "adapter_checked_allowed",
  "production_ready_allowed",
  "stable_allowed",
  "release_gated_allowed"
];

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, PROJECT_SLUG);
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());
const gitRoot = path.resolve(root, "..");

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readText(relPath) {
  return fs.readFileSync(p(relPath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relPath) {
  try {
    return JSON.parse(readText(relPath));
  } catch {
    return null;
  }
}

function readYaml(relPath) {
  try {
    return parseYaml(readText(relPath));
  } catch {
    return null;
  }
}

function sha256File(relPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(p(relPath))).digest("hex");
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

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024
  });
  return {
    command: `node ${script}`,
    exit_code: result.status,
    signal: result.signal,
    status: result.status === 0 ? "pass" : "fail",
    stdout_json: parseLastJsonObject(result.stdout),
    stderr: [result.stderr?.trim?.(), result.error?.message].filter(Boolean).join("\n")
  };
}

function runGit(args) {
  const result = spawnSync("git", ["-C", gitRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 160 * 1024 * 1024
  });
  return {
    command: `git ${args.join(" ")}`,
    exit_code: result.status,
    status: result.status === 0 ? "pass" : "fail",
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function runZip(args) {
  const result = spawnSync(args[0], args.slice(1), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 160 * 1024 * 1024
  });
  return result.status === 0 ? result.stdout : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function collectFiles(relRoot, files = []) {
  const abs = p(relRoot);
  if (!fs.existsSync(abs)) return files;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    files.push(relRoot);
    return files;
  }
  if (!stat.isDirectory()) return files;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${relRoot}/${entry.name}`;
    if (entry.isDirectory()) collectFiles(rel, files);
    else if (entry.isFile()) files.push(rel);
  }
  return files;
}

function isTextFile(relPath) {
  const buffer = fs.readFileSync(p(relPath));
  return !buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);
}

function tokenClass(value) {
  if (value === oldProjectLiteral || value === oldProjectAltLiteral) return "old_project_literal";
  if (value === oldCompareChecker) return "old_compare_checker";
  return "old_reference_literal";
}

function activeSurfaceScan() {
  const files = [...new Set(ACTIVE_ROOTS.flatMap((entry) => collectFiles(entry)))].sort();
  const needles = [oldProjectLiteral, oldProjectAltLiteral, oldReferenceLiteral, oldCompareChecker];
  const matches = [];
  for (const relPath of files) {
    const basename = path.basename(relPath);
    for (const value of needles) {
      if (basename.includes(value)) matches.push({ file: relPath, surface: "filename", token_class: tokenClass(value) });
    }
    if (!isTextFile(relPath)) continue;
    const text = readText(relPath);
    for (const value of needles) {
      if (text.includes(value)) matches.push({ file: relPath, surface: "content", token_class: tokenClass(value) });
    }
  }
  return {
    scanned_file_count: files.length,
    matches,
    old_project_literal_active_count: matches.filter((item) => item.token_class === "old_project_literal").length,
    old_reference_literal_active_count: matches.filter((item) => item.token_class === "old_reference_literal").length,
    old_compare_checker_active_count: matches.filter((item) => item.token_class === "old_compare_checker").length
  };
}

function topLevelEvidenceLegacyPaths() {
  const evidenceRoot = p("evidence");
  if (!fs.existsSync(evidenceRoot)) return [];
  return fs.readdirSync(evidenceRoot)
    .filter((entry) => entry.includes(oldReferenceLiteral) || entry.includes(oldCompareChecker) || entry.includes(oldProjectLiteral))
    .map((entry) => `evidence/${entry}`)
    .sort();
}

function commandLines(text) {
  return [...text.matchAll(/^\s*node tools\/[^\s`]+/gm)].map((match) => match[0].trim());
}

function sectionAfter(text, marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`^#{1,3}.*${escaped}.*$`, "gim");
  const headingMatch = headingPattern.exec(text);
  const index = headingMatch ? headingMatch.index : text.toLowerCase().indexOf(marker.toLowerCase());
  if (index === -1) return "";
  const rest = text.slice(index);
  const nextHeading = rest.slice(1).search(/\n#{1,3}\s+/);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading + 1);
}

function rootOnlyIfMentioned(text, command) {
  if (!text.includes(command) && !text.includes(command.replace("node ", ""))) return true;
  const lower = text.toLowerCase();
  return lower.includes("root-workspace-only")
    || lower.includes("root workspace only")
    || text.includes("root workspace mode 전용")
    || text.includes("root workspace 전용")
    || text.includes("Root workspace 전용")
    || lower.includes("source-workspace-only")
    || lower.includes("source workspace 전용");
}

function notDefaultExportCommand(text, command) {
  if (!text.includes(command) && !text.includes(command.replace("node ", ""))) return true;
  const lower = text.toLowerCase();
  return lower.includes("not the default command")
    || text.includes("기본 명령으로 사용하지")
    || text.includes("기본 health check")
    || text.includes("기본 명령이 아닙니다")
    || text.includes("root workspace mode 전용")
    || text.includes("root workspace 전용");
}

function rootVsExportCommandSurface() {
  const docs = COMMAND_DOCS.map((entry) => {
    const included = fs.existsSync(p(entry));
    const text = included ? readText(entry) : "";
    const exportSection = sectionAfter(text, "Agent-ready export mode");
    const exportCommands = commandLines(exportSection);
    const allCommands = commandLines(text);
    return {
      entry,
      included,
      all_commands: allCommands,
      export_mode_commands: exportCommands,
      export_first_command_is_self_contained: exportCommands.length === 0 || exportCommands[0] === SELF_CONTAINED_COMMAND,
      export_reference_baseline_command_present: entry === "docs/workspace/harness_core_final_precommit_convergence.ko.md"
        ? exportCommands.includes(REFERENCE_BASELINE_COMMAND)
        : exportCommands.includes(REFERENCE_BASELINE_COMMAND),
      current_state_alignment_root_only_if_mentioned: rootOnlyIfMentioned(text, CURRENT_STATE_ALIGNMENT_COMMAND),
      current_state_alignment_not_default_export_command: notDefaultExportCommand(text, CURRENT_STATE_ALIGNMENT_COMMAND),
      final_precommit_root_only_if_mentioned: rootOnlyIfMentioned(text, FINAL_PRECOMMIT_COMMAND),
      final_precommit_not_default_export_command: notDefaultExportCommand(text, FINAL_PRECOMMIT_COMMAND)
    };
  });
  const checks = [];
  addCheck(checks, "command docs exist", docs.every((doc) => doc.included), { docs });
  addCheck(checks, "export first command is self-contained", docs.every((doc) => doc.export_first_command_is_self_contained), { docs });
  addCheck(checks, "export reference baseline command is present", docs.every((doc) => doc.export_reference_baseline_command_present), { docs });
  addCheck(checks, "current-state alignment is root-only if mentioned", docs.every((doc) => doc.current_state_alignment_root_only_if_mentioned), { docs });
  addCheck(checks, "current-state alignment is not default export command", docs.every((doc) => doc.current_state_alignment_not_default_export_command), { docs });
  addCheck(checks, "final precommit checker is root-only if mentioned", docs.every((doc) => doc.final_precommit_root_only_if_mentioned), { docs });
  addCheck(checks, "final precommit checker is not default export command", docs.every((doc) => doc.final_precommit_not_default_export_command), { docs });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    docs,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function schemaAlignment() {
  const stackSchemas = ["stack.schema.json", "schemas/stack.schema.json"].map((entry) => ({ entry, schema: readJson(entry) }));
  const validationSchema = readJson("schemas/validation_report.schema.json");
  const requiredFiles = readJson("evals/fixtures/static/required_files.json");
  const checks = [];
  for (const item of stackSchemas) {
    const required = item.schema?.required || [];
    const legacyNames = item.schema?.properties?.project?.properties?.legacy_names || {};
    addCheck(checks, `${item.entry} requires reference baseline`, required.includes("reference_baseline"), { required });
    addCheck(checks, `${item.entry} does not require old top-level baseline`, !required.includes("baseline"), { required });
    addCheck(checks, `${item.entry} allows empty legacy_names`, legacyNames.type === "array" && legacyNames.minItems === undefined, { legacy_names_schema: legacyNames });
  }
  const runner = validationSchema?.properties?.runner_reexecution || {};
  addCheck(checks, "validation report schema requires reference baseline runner flag", (runner.required || []).includes("reference_baseline_runners_reexecuted"), {
    required: runner.required || []
  });
  addCheck(checks, "validation report schema omits old runner flag", !(runner.required || []).includes("legacy_reference_runners_reexecuted")
    && !Object.hasOwn(runner.properties || {}, "legacy_reference_runners_reexecuted"), {
    required: runner.required || [],
    properties: Object.keys(runner.properties || {})
  });
  const requiredInputs = requiredFiles?.required_inputs || [];
  addCheck(checks, "required files use reference baseline checker", requiredInputs.includes("tools/checks/workspace/check_reference_baseline_integrity.mjs"), { required_input_count: requiredInputs.length });
  addCheck(checks, "required files do not require old compare checker", !requiredInputs.includes(`tools/${oldCompareChecker}`), { forbidden_checker: `tools/${oldCompareChecker}` });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    generated_at: new Date().toISOString(),
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function zipEntries(zipPath) {
  const result = spawnSync("zipinfo", ["-1", p(zipPath)], {
    encoding: "utf8",
    maxBuffer: 160 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout.split(/\r?\n/).filter(Boolean).sort();
  try {
    return readZipDirectory(p(zipPath)).entries.map((entry) => entry.name).filter(Boolean).sort();
  } catch {
    return [];
  }
}

function unzipText(zipPath, entry) {
  const result = spawnSync("unzip", ["-p", p(zipPath), entry], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout;
  try {
    const parsed = readZipDirectory(p(zipPath));
    const found = parsed.entries.find((item) => item.name === entry);
    if (!found || found.name.endsWith("/")) return "";
    return zipEntryData(parsed, found).toString("utf8");
  } catch {
    return "";
  }
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readZipDirectory(zipAbsPath) {
  const buffer = fs.readFileSync(zipAbsPath);
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

function textEntries(entries) {
  return entries.filter((entry) => /\.(md|txt|yaml|yml|json|mjs|js|schema|lock)$/i.test(entry));
}

function cleanExportLiteralScan(entries) {
  const needles = [oldProjectLiteral, oldProjectAltLiteral, oldReferenceLiteral, oldCompareChecker];
  const matches = [];
  for (const entry of textEntries(entries)) {
    const text = unzipText(CLEAN_EXPORT_PATH, entry);
    for (const value of needles) {
      if (text.includes(value)) matches.push({ entry, token_class: tokenClass(value) });
    }
  }
  return matches;
}

function cleanExportForbiddenEntries(entries) {
  return {
    node_modules: entries.filter((entry) => entry === "node_modules/" || entry.startsWith("node_modules/") || entry.includes("/node_modules/")),
    dist: entries.filter((entry) => entry === "dist/" || entry.startsWith("dist/") || entry.includes("/dist/")),
    git_metadata: entries.filter((entry) => entry === ".git/" || entry.startsWith(".git/") || entry.includes("/.git/")),
    ds_store: entries.filter((entry) => path.basename(entry) === ".DS_Store"),
    archive: entries.filter((entry) => entry === "archive/" || entry.startsWith("archive/")),
    old_exports: entries.filter((entry) => entry.startsWith("exports/") && entry.endsWith(".zip")),
    raw_payload_path: entries.filter((entry) => /(^|\/)(raw[-_])?(request|response)[-_]?payload/i.test(entry)
      || /(^|\/)raw[-_](request|response)/i.test(entry)),
    secret_value_path: entries.filter((entry) => /(^|\/)(secret|api[-_]?key|auth[-_]?header)[-_]?value/i.test(entry)
      || /(^|\/)\.env($|\.)/i.test(entry))
  };
}

function summarizeGitStatus(stdout) {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const summary = {};
  for (const line of lines) {
    const code = line.slice(0, 2);
    summary[code] = (summary[code] || 0) + 1;
  }
  return {
    line_count: lines.length,
    by_status: summary
  };
}

const generatedAt = new Date().toISOString();
const currentStateYaml = readYaml("CURRENT_STATE.yaml");
const currentStateJson = readJson("CURRENT_STATE.json");
const stack = readYaml("stack.yaml");
const activeScan = activeSurfaceScan();
const evidenceLegacyPaths = topLevelEvidenceLegacyPaths();
const commandSurface = rootVsExportCommandSurface();
const schemaReport = schemaAlignment();

const selfContained = runNode("tools/checks/workspace/check_agent_ready_self_contained.mjs");
const referenceBaseline = runNode("tools/checks/workspace/check_reference_baseline_integrity.mjs");
const currentStateAlignment = runNode("tools/checks/workspace/check_current_state_alignment.mjs");
const noLegacySurface = runNode("tools/checks/workspace/check_harness_core_no_legacy_surface.mjs");
const gitReadiness = runNode("tools/checks/workspace/check_harness_core_git_readiness.mjs");
const cleanExportCheck = runNode("tools/checks/workspace/check_clean_export_self_contained.mjs");
const validateAlpha = runNode("tools/validators/evals/validate_alpha.mjs");
const scanProhibitedClaims = runNode("tools/scanners/release/scan_prohibited_claims.mjs");
const gitDiffCheck = runGit(["diff", "--check"]);
const gitDiffCachedCheck = runGit(["diff", "--cached", "--check"]);
const gitLsFiles = runGit(["ls-files"]);
const gitStatus = runGit(["status", "--short"]);

const cleanExportExists = fs.existsSync(p(CLEAN_EXPORT_PATH));
const cleanExportEntries = cleanExportExists ? zipEntries(CLEAN_EXPORT_PATH) : [];
const cleanExportForbidden = cleanExportForbiddenEntries(cleanExportEntries);
const cleanExportForbiddenCount = Object.values(cleanExportForbidden).reduce((sum, values) => sum + values.length, 0);
const cleanExportLiteralMatches = cleanExportExists ? cleanExportLiteralScan(cleanExportEntries) : [];
const trackedOldPathCount = gitLsFiles.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => file === oldProjectLiteral || file.startsWith(`${oldProjectLiteral}/`))
  .length;

const checks = [];
addCheck(checks, "project name is canonical", currentStateYaml?.project?.name === PROJECT_NAME && currentStateJson?.project?.name === PROJECT_NAME, {
  yaml_project: currentStateYaml?.project || null,
  json_project: currentStateJson?.project || null
});
addCheck(checks, "project slug is canonical", currentStateYaml?.project?.slug === PROJECT_SLUG && currentStateJson?.project?.slug === PROJECT_SLUG, {
  yaml_project: currentStateYaml?.project || null,
  json_project: currentStateJson?.project || null
});
addCheck(checks, "operation mode is root workspace primary", currentStateYaml?.operation_mode?.primary === "root_workspace"
  && currentStateJson?.operation_mode?.primary === "root_workspace", {
  yaml_operation_mode: currentStateYaml?.operation_mode || null,
  json_operation_mode: currentStateJson?.operation_mode || null
});
addCheck(checks, "operation mode records agent-ready export secondary", currentStateYaml?.operation_mode?.secondary === "agent_ready_export"
  && currentStateJson?.operation_mode?.secondary === "agent_ready_export", {
  yaml_operation_mode: currentStateYaml?.operation_mode || null,
  json_operation_mode: currentStateJson?.operation_mode || null
});
addCheck(checks, "active old project literal count is zero", activeScan.old_project_literal_active_count === 0, activeScan);
addCheck(checks, "active old reference literal count is zero", activeScan.old_reference_literal_active_count === 0, activeScan);
addCheck(checks, "active old compare checker count is zero", activeScan.old_compare_checker_active_count === 0, activeScan);
addCheck(checks, "top-level legacy reference evidence paths are absent", evidenceLegacyPaths.length === 0, { paths: evidenceLegacyPaths });
addCheck(checks, "reference baseline path is canonical", currentStateYaml?.reference_baseline?.path === REFERENCE_BASELINE_PATH
  && currentStateJson?.reference_baseline?.path === REFERENCE_BASELINE_PATH
  && stack?.reference_baseline?.path === REFERENCE_BASELINE_PATH, {
  current_state_yaml: currentStateYaml?.reference_baseline || null,
  current_state_json: currentStateJson?.reference_baseline || null,
  stack_reference_baseline: stack?.reference_baseline || null
});
addCheck(checks, "reference baseline integrity passes", referenceBaseline.status === "pass", referenceBaseline);
addCheck(checks, "required files and schemas are aligned", schemaReport.status === "pass", schemaReport);
addCheck(checks, "root/export command surface is aligned", commandSurface.status === "pass", commandSurface);
addCheck(checks, "clean export exists", cleanExportExists, { path: CLEAN_EXPORT_PATH });
addCheck(checks, "clean export excludes forbidden entries", cleanExportForbiddenCount === 0, cleanExportForbidden);
addCheck(checks, "clean export old literals count is zero", cleanExportLiteralMatches.length === 0, { matches: cleanExportLiteralMatches });
addCheck(checks, "clean export self-contained checker passes", cleanExportCheck.status === "pass", cleanExportCheck);
addCheck(checks, "self-contained checker passes", selfContained.status === "pass", selfContained);
addCheck(checks, "current-state alignment passes", currentStateAlignment.status === "pass", currentStateAlignment);
addCheck(checks, "no legacy surface checker passes", noLegacySurface.status === "pass", noLegacySurface);
addCheck(checks, "git readiness checker passes", gitReadiness.status === "pass", gitReadiness);
addCheck(checks, "validate alpha passes", validateAlpha.status === "pass", validateAlpha);
addCheck(checks, "prohibited claim scan passes", scanProhibitedClaims.status === "pass", scanProhibitedClaims);
addCheck(checks, "git diff check passes", gitDiffCheck.status === "pass", { exit_code: gitDiffCheck.exit_code, stderr: gitDiffCheck.stderr.trim() });
addCheck(checks, "git cached diff check passes", gitDiffCachedCheck.status === "pass", { exit_code: gitDiffCachedCheck.exit_code, stderr: gitDiffCachedCheck.stderr.trim() });
addCheck(checks, "git tracked old project path count is zero", trackedOldPathCount === 0, { tracked_old_path_count: trackedOldPathCount });
addCheck(checks, "provider verified remains false", currentStateJson?.blocked_claims?.includes("provider-verified") === true
  && currentStateJson?.harness_core_final_precommit_convergence?.commit_performed === false);
addCheck(checks, "adapter checked remains false", currentStateJson?.blocked_claims?.includes("adapter-checked") === true);
addCheck(checks, "production ready remains false", currentStateJson?.blocked_claims?.includes("production-ready") === true);
addCheck(checks, "stable remains false", currentStateJson?.blocked_claims?.includes("stable") === true);
addCheck(checks, "release gated remains false", currentStateJson?.blocked_claims?.includes("release-gated") === true);
addCheck(checks, "commit not performed", currentStateJson?.harness_core_final_precommit_convergence?.commit_performed === false, {
  commit_performed: currentStateJson?.harness_core_final_precommit_convergence?.commit_performed ?? null
});

const failures = checks.filter((check) => check.status !== "pass");
const commitReady = failures.length === 0;
const report = {
  status: commitReady ? "pass" : "fail",
  stage: STAGE,
  generated_at: generatedAt,
  checker: "check_harness_core_final_precommit_convergence.mjs",
  canonical_name: PROJECT_NAME,
  slug: PROJECT_SLUG,
  root_workspace_mode: currentStateYaml?.operation_mode?.primary || null,
  agent_ready_export_mode: currentStateYaml?.operation_mode?.secondary || null,
  clean_export_path: CLEAN_EXPORT_PATH,
  clean_export_sha256: cleanExportExists ? sha256File(CLEAN_EXPORT_PATH) : null,
  clean_export_entry_count: cleanExportEntries.length,
  active_old_project_literal_count: activeScan.old_project_literal_active_count,
  active_old_reference_literal_count: activeScan.old_reference_literal_active_count,
  active_old_compare_checker_count: activeScan.old_compare_checker_active_count,
  clean_export_old_literals_count: cleanExportLiteralMatches.length,
  tracked_old_project_path_count: trackedOldPathCount,
  reference_baseline: {
    path: REFERENCE_BASELINE_PATH,
    integrity_result: referenceBaseline.stdout_json?.status || referenceBaseline.status,
    refresh_performed: referenceBaseline.stdout_json?.refresh_performed ?? false,
    source_scan_performed: referenceBaseline.stdout_json?.source_scan_performed ?? false,
    checksum_recalculated: referenceBaseline.stdout_json?.checksum_recalculated ?? false
  },
  command_results: {
    self_contained: selfContained.status,
    reference_baseline: referenceBaseline.status,
    current_state_alignment: currentStateAlignment.status,
    no_legacy_surface: noLegacySurface.status,
    git_readiness: gitReadiness.status,
    clean_export: cleanExportCheck.status,
    validate_alpha: validateAlpha.status,
    scan_prohibited_claims: scanProhibitedClaims.status,
    git_diff_check: gitDiffCheck.status,
    git_diff_cached_check: gitDiffCachedCheck.status
  },
  git_status_summary: summarizeGitStatus(gitStatus.stdout),
  commit_ready: commitReady,
  commit_performed: false,
  commit_approval_required: true,
  required_commit_approval_phrase: APPROVAL_PHRASE,
  weak_claims_recordable: [
    "harness-core-final-precommit-convergence-recorded",
    "root-vs-export-command-surface-finalized",
    "reference-baseline-final-integrity-checked",
    "clean-export-finalized",
    "git-final-readiness-recorded"
  ],
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  checks,
  failures,
  unresolved_items_count: failures.length
};

const noLegacyFinalScan = {
  status: activeScan.old_project_literal_active_count === 0
    && activeScan.old_reference_literal_active_count === 0
    && activeScan.old_compare_checker_active_count === 0
    && evidenceLegacyPaths.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: generatedAt,
  scanned_file_count: activeScan.scanned_file_count,
  old_project_literal_active_count: activeScan.old_project_literal_active_count,
  old_reference_literal_active_count: activeScan.old_reference_literal_active_count,
  old_compare_checker_active_count: activeScan.old_compare_checker_active_count,
  top_level_legacy_reference_evidence_paths: evidenceLegacyPaths,
  matches: activeScan.matches
};

const referenceBaselineFinalReport = {
  status: referenceBaseline.status,
  stage: STAGE,
  generated_at: generatedAt,
  source_checker: "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  source_exit_code: referenceBaseline.exit_code,
  report: referenceBaseline.stdout_json
};

const cleanExportFinalReport = {
  status: cleanExportCheck.status === "pass"
    && cleanExportForbiddenCount === 0
    && cleanExportLiteralMatches.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: generatedAt,
  source_checker: "tools/checks/workspace/check_clean_export_self_contained.mjs",
  source_exit_code: cleanExportCheck.exit_code,
  path: CLEAN_EXPORT_PATH,
  sha256: cleanExportExists ? sha256File(CLEAN_EXPORT_PATH) : null,
  entry_count: cleanExportEntries.length,
  forbidden_entries: cleanExportForbidden,
  old_literal_matches: cleanExportLiteralMatches,
  self_contained_check_result: cleanExportCheck.stdout_json?.extracted_self_contained_agent_check_passed === true ? "pass" : cleanExportCheck.status,
  reference_baseline_check_result: cleanExportCheck.stdout_json?.extracted_reference_baseline_integrity_check_passed === true ? "pass" : cleanExportCheck.status
};

const gitFinalReadinessReport = {
  status: gitReadiness.status,
  stage: STAGE,
  generated_at: generatedAt,
  source_checker: "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  source_exit_code: gitReadiness.exit_code,
  tracked_old_project_path_count: trackedOldPathCount,
  git_diff_check: {
    status: gitDiffCheck.status,
    exit_code: gitDiffCheck.exit_code,
    stderr: gitDiffCheck.stderr.trim()
  },
  git_diff_cached_check: {
    status: gitDiffCachedCheck.status,
    exit_code: gitDiffCachedCheck.exit_code,
    stderr: gitDiffCachedCheck.stderr.trim()
  },
  git_status_summary: summarizeGitStatus(gitStatus.stdout),
  commit_ready: commitReady,
  commit_performed: false,
  commit_approval_required: true,
  required_commit_approval_phrase: APPROVAL_PHRASE,
  report: gitReadiness.stdout_json
};

const gateReport = {
  status: report.status,
  stage: STAGE,
  generated_at: generatedAt,
  final_precommit_convergence: report.status,
  no_legacy_surface_final_scan: noLegacyFinalScan.status,
  reference_baseline_final_integrity: referenceBaselineFinalReport.status,
  root_vs_export_command_surface: commandSurface.status,
  clean_export_final: cleanExportFinalReport.status,
  git_final_readiness: gitFinalReadinessReport.status,
  commit_ready: report.commit_ready,
  commit_performed: false,
  commit_approval_required: true,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: failures.length,
  unresolved_items: failures
};

writeJson(`${EVIDENCE_DIR}/final_precommit_convergence_report.json`, report);
writeJson(`${EVIDENCE_DIR}/no_legacy_surface_final_scan.json`, noLegacyFinalScan);
writeJson(`${EVIDENCE_DIR}/reference_baseline_final_integrity_report.json`, referenceBaselineFinalReport);
writeJson(`${EVIDENCE_DIR}/root_vs_export_command_surface_report.json`, commandSurface);
writeJson(`${EVIDENCE_DIR}/clean_export_final_report.json`, cleanExportFinalReport);
writeJson(`${EVIDENCE_DIR}/git_final_readiness_report.json`, gitFinalReadinessReport);
writeJson(`${EVIDENCE_DIR}/final_precommit_gate_report.json`, gateReport);
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
