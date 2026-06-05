#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const PROJECT_NAME = "HARNESS Core";
const PROJECT_SLUG = "harness-core";
const OLD_PROJECT_NAME = ["prompt", "stack", "v2"].join("-");
const OLD_PROJECT_NAME_ALT = ["prompt_stack", "v2"].join("_");
const OLD_REFERENCE_LABEL = ["v", "36"].join("");
const OLD_COMPARE_CHECKER = ["compare", OLD_REFERENCE_LABEL, "baseline"].join("_");
const CANONICAL_REFERENCE_CHECKER = "check_reference_baseline_integrity.mjs";
const EVIDENCE_DIR = "evidence/harness-core-final-surface-git-readiness";

const ACTIVE_ROOTS = [
  "CURRENT_STATE.yaml",
  "CURRENT_STATE.json",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs",
  "profiles/agents",
  "release",
  "tools",
  "package.json",
  "stack.yaml",
  "MANIFEST.asset_classes.yaml"
];

const ALLOWED_LEGACY_PREFIXES = [
  "archive/",
  "evidence/project-rename-to-harness-core/",
  "evidence/reference-baseline-deemphasis/"
];

const ALLOWED_LEGACY_FILES = [
  "NAME_MIGRATION.md",
  "docs/legacy_reference_policy.ko.md",
  "docs/reference_baseline_deemphasis.ko.md"
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

function toPosix(file) {
  return file.split(path.sep).join("/");
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

function isTextFile(absPath) {
  const buffer = fs.readFileSync(absPath);
  return !buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);
}

function collectFiles(relRoot, files = []) {
  const absRoot = p(relRoot);
  if (!fs.existsSync(absRoot)) return files;
  const stat = fs.statSync(absRoot);
  if (stat.isFile()) {
    files.push(relRoot);
    return files;
  }
  if (!stat.isDirectory()) return files;
  for (const entry of fs.readdirSync(absRoot, { withFileTypes: true })) {
    const rel = `${relRoot}/${entry.name}`;
    if (entry.isDirectory()) collectFiles(rel, files);
    else if (entry.isFile()) files.push(rel);
  }
  return files;
}

function legacyAllowed(relPath) {
  return ALLOWED_LEGACY_FILES.includes(relPath)
    || relPath.startsWith("docs/name_migration_")
    || ALLOWED_LEGACY_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function findMatches(files) {
  const matches = [];
  for (const relPath of files) {
    const basename = path.basename(relPath);
    const allowed = legacyAllowed(relPath);
    const filenameNeedles = [
      OLD_PROJECT_NAME,
      OLD_PROJECT_NAME_ALT,
      OLD_REFERENCE_LABEL,
      OLD_COMPARE_CHECKER
    ];
    for (const needle of filenameNeedles) {
      if (basename.includes(needle) && !allowed) {
        matches.push({ file: relPath, surface: "filename", token_class: tokenClass(needle) });
      }
    }
    const abs = p(relPath);
    if (!fs.existsSync(abs) || !isTextFile(abs)) continue;
    const text = fs.readFileSync(abs, "utf8");
    for (const needle of filenameNeedles) {
      if (text.includes(needle) && !allowed) {
        matches.push({ file: relPath, surface: "content", token_class: tokenClass(needle) });
      }
    }
  }
  return matches;
}

function tokenClass(needle) {
  if (needle === OLD_PROJECT_NAME || needle === OLD_PROJECT_NAME_ALT) return "old_project_name";
  if (needle === OLD_COMPARE_CHECKER) return "old_compare_checker";
  return "old_reference_label";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

const files = [...new Set(ACTIVE_ROOTS.flatMap((entry) => collectFiles(entry)))].sort();
const matches = findMatches(files);
const currentStateYaml = readYaml("CURRENT_STATE.yaml");
const currentStateJson = readJson("CURRENT_STATE.json");
const packageJson = readJson("package.json");
const commandText = [
  "CURRENT_STATE.yaml",
  "CURRENT_STATE.json",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "AGENTS.md",
  "README.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "package.json",
  "stack.yaml"
].filter((file) => fs.existsSync(p(file))).map(readText).join("\n");

const oldProjectMatches = matches.filter((match) => match.token_class === "old_project_name");
const oldReferenceMatches = matches.filter((match) => match.token_class === "old_reference_label");
const oldCompareMatches = matches.filter((match) => match.token_class === "old_compare_checker");
const checks = [];

addCheck(checks, "project name is HARNESS Core", currentStateYaml?.project?.name === PROJECT_NAME
  && currentStateJson?.project?.name === PROJECT_NAME, {
  yaml_project: currentStateYaml?.project || null,
  json_project: currentStateJson?.project || null
});
addCheck(checks, "project slug is harness-core", currentStateYaml?.project?.slug === PROJECT_SLUG
  && currentStateJson?.project?.slug === PROJECT_SLUG, {
  yaml_project: currentStateYaml?.project || null,
  json_project: currentStateJson?.project || null
});
addCheck(checks, "old project name absent from active surface", oldProjectMatches.length === 0, {
  count: oldProjectMatches.length,
  matches: oldProjectMatches
});
addCheck(checks, "old reference label absent from active surface", oldReferenceMatches.length === 0, {
  count: oldReferenceMatches.length,
  matches: oldReferenceMatches
});
addCheck(checks, "old baseline compare checker absent from active surface", oldCompareMatches.length === 0, {
  count: oldCompareMatches.length,
  matches: oldCompareMatches
});
addCheck(checks, "canonical reference checker is active", commandText.includes(CANONICAL_REFERENCE_CHECKER)
  || Object.values(packageJson?.scripts || {}).some((value) => String(value).includes(CANONICAL_REFERENCE_CHECKER)), {
  checker: CANONICAL_REFERENCE_CHECKER
});

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  checker: "check_harness_core_no_legacy_surface.mjs",
  scanned_file_count: files.length,
  canonical_name: PROJECT_NAME,
  slug: PROJECT_SLUG,
  old_project_name_active_count: oldProjectMatches.length,
  old_reference_label_active_count: oldReferenceMatches.length,
  old_compare_checker_active_count: oldCompareMatches.length,
  legacy_only_policy: {
    old_project_name_allowed_only_in_migration_or_archive_context: true,
    old_reference_label_allowed_only_in_legacy_reference_migration_or_archive_context: true
  },
  active_command_checker: CANONICAL_REFERENCE_CHECKER,
  checks,
  failures,
  unresolved_items_count: failures.length,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(`${EVIDENCE_DIR}/harness_core_no_legacy_surface_report.json`, report);
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
