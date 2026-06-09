#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGE = "v2.0.0-post-rename-harness-core-precommit-doc-export-consistency-repair";
const PROJECT_SLUG = "harness-core";
const EVIDENCE_DIR = "evidence/harness-core-precommit-doc-export-consistency-repair";
const REFERENCE_CHECKER = "tools/checks/workspace/check_reference_baseline_integrity.mjs";
const LEGACY_REFERENCE_LABEL = ["v", "36"].join("");
const LEGACY_COMPARE_CHECKER = `tools/compare_${LEGACY_REFERENCE_LABEL}_baseline.mjs`;
const LEGACY_BASELINE_PATH = `evidence/${LEGACY_REFERENCE_LABEL}-baseline`;
const REFERENCE_BASELINE_PATH = "evidence/reference-baseline";
const LEGACY_RUNNER_FIELD = "legacy_reference_runners_reexecuted";
const REFERENCE_RUNNER_FIELD = "reference_baseline_runners_reexecuted";
const CLEAN_EXPORT_PATH = "exports/harness-core-agent-ready.zip";
const SELF_CONTAINED_COMMAND = "node tools/checks/workspace/check_agent_ready_self_contained.mjs";
const REFERENCE_BASELINE_COMMAND = "node tools/checks/workspace/check_reference_baseline_integrity.mjs";
const CURRENT_STATE_ALIGNMENT_COMMAND = "node tools/checks/workspace/check_current_state_alignment.mjs";
const CLEAN_EXPORT_DOCS = [
  "AGENT_BOOTSTRAP.ko.md",
  "README.md",
  "START_HERE_FOR_AGENTS.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md"
];
const SOURCE_WORKSPACE_REQUIRED_FILES = [
  "evals/fixtures/static/required_files.json",
  "stack.schema.json",
  "schemas/stack.schema.json",
  "schemas/validation_report.schema.json",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "tools/checks/workspace/check_agent_ready_self_contained.mjs",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs"
];

function detectRoot(start) {
  if (fs.existsSync(path.join(start, "CURRENT_STATE.json"))) return start;
  const nested = path.join(start, PROJECT_SLUG);
  if (fs.existsSync(path.join(nested, "CURRENT_STATE.json"))) return nested;
  return start;
}

const root = detectRoot(process.cwd());

function resolveGitMetadata(projectRoot) {
  const candidates = [path.resolve(projectRoot, ".."), projectRoot];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, ".git"))) {
      return {
        git_metadata_present: true,
        git_root: candidate
      };
    }
  }
  return {
    git_metadata_present: false,
    git_root: null
  };
}

const gitMetadata = resolveGitMetadata(root);

function p(relPath) {
  return path.join(root, ...relPath.split("/"));
}

function readText(relPath) {
  return fs.readFileSync(p(relPath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function readTextIfExists(relPath) {
  return fs.existsSync(p(relPath)) ? readText(relPath) : "";
}

function writeJson(relPath, data) {
  const file = p(relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function runNode(scriptPath, options = {}) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: options.cwd || root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return {
    exit_code: result.status,
    stdout_json: parseLastJsonObject(result.stdout),
    stderr: result.stderr.trim()
  };
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

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function sourceWorkspaceSurfaceAvailable() {
  return SOURCE_WORKSPACE_REQUIRED_FILES.every((file) => fs.existsSync(p(file)));
}

function zipEntries(zipPath) {
  const result = spawnSync("zipinfo", ["-1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  if (result.status === 0) return result.stdout.split(/\r?\n/).filter(Boolean).sort();
  const fallback = spawnSync("unzip", ["-Z1", zipPath], {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024
  });
  return fallback.status === 0 ? fallback.stdout.split(/\r?\n/).filter(Boolean).sort() : [];
}

function unzipText(zipPath, entry) {
  const result = spawnSync("unzip", ["-p", zipPath, entry], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });
  return result.status === 0 ? result.stdout : "";
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
  if (!text.includes(CURRENT_STATE_ALIGNMENT_COMMAND) && !text.includes("tools/checks/workspace/check_current_state_alignment.mjs")) return true;
  const lower = text.toLowerCase();
  return lower.includes("root-workspace-only")
    || lower.includes("root workspace only")
    || text.includes("root workspace mode 전용")
    || text.includes("Root workspace 전용")
    || lower.includes("source-workspace-only")
    || lower.includes("source workspace 전용");
}

function currentStateAlignmentNotDefaultExportCommand(text) {
  if (!text.includes(CURRENT_STATE_ALIGNMENT_COMMAND) && !text.includes("tools/checks/workspace/check_current_state_alignment.mjs")) return true;
  const lower = text.toLowerCase();
  return lower.includes("not the default command")
    || lower.includes("is not the default command")
    || text.includes("기본 명령으로 사용하지")
    || text.includes("root workspace mode 전용")
    || text.includes("Root workspace 전용");
}

function docCommandPolicyFromText(entry, text, included = true) {
  const exportSection = sectionAfter(text, "Agent-ready export mode");
  const exportCommands = commandLines(exportSection);
  return {
    entry,
    included,
    export_mode_commands: exportCommands,
    export_first_command_is_self_contained: exportCommands[0] === SELF_CONTAINED_COMMAND,
    export_reference_baseline_command_present: exportCommands.includes(REFERENCE_BASELINE_COMMAND),
    current_state_alignment_mentioned: text.includes(CURRENT_STATE_ALIGNMENT_COMMAND)
      || text.includes("tools/checks/workspace/check_current_state_alignment.mjs"),
    current_state_alignment_root_only_if_mentioned: currentStateAlignmentRootOnly(text),
    current_state_alignment_not_default_export_command: currentStateAlignmentNotDefaultExportCommand(text)
  };
}

function rootVsExportCommandPolicy() {
  const docs = CLEAN_EXPORT_DOCS.map((entry) => docCommandPolicyFromText(entry, readTextIfExists(entry), fs.existsSync(p(entry))));
  const checks = [];
  addCheck(checks, "docs exist", docs.every((doc) => doc.included), { docs });
  addCheck(checks, "agent-ready export first command is self-contained checker", docs.every((doc) => doc.export_first_command_is_self_contained), { docs });
  addCheck(checks, "agent-ready export includes reference baseline integrity command", docs.every((doc) => doc.export_reference_baseline_command_present), { docs });
  addCheck(checks, "current-state alignment is root-workspace-only if mentioned", docs.every((doc) => doc.current_state_alignment_root_only_if_mentioned), { docs });
  addCheck(checks, "current-state alignment is not default export command", docs.every((doc) => doc.current_state_alignment_not_default_export_command), { docs });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    root_workspace_mode: {
      purpose: "project root source workspace mode",
      first_commands: [
        SELF_CONTAINED_COMMAND,
        CURRENT_STATE_ALIGNMENT_COMMAND,
        REFERENCE_BASELINE_COMMAND
      ],
      git_readiness_full_verification_requires_git_metadata: true
    },
    agent_ready_export_mode: {
      purpose: "clean export transfer/archive mode",
      first_commands: [
        SELF_CONTAINED_COMMAND,
        REFERENCE_BASELINE_COMMAND
      ],
      node_modules_required: false,
      git_metadata_required: false,
      current_state_alignment_default_command: false,
      reference_baseline_policy: "snapshot_integrity_only"
    },
    current_state_alignment_placement: "root_workspace_only",
    docs,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function cleanExportCommandSurface() {
  const zipPath = p(CLEAN_EXPORT_PATH);
  const exists = fs.existsSync(zipPath);
  const entries = exists ? zipEntries(zipPath) : [];
  const docs = CLEAN_EXPORT_DOCS.map((entry) => docCommandPolicyFromText(entry, exists ? unzipText(zipPath, entry) : "", entries.includes(entry)));
  const checks = [];
  addCheck(checks, "clean export exists", exists, { path: CLEAN_EXPORT_PATH });
  addCheck(checks, "clean export docs exist", docs.every((doc) => doc.included), { docs });
  addCheck(checks, "clean export docs first export command is self-contained checker", docs.every((doc) => doc.export_first_command_is_self_contained), { docs });
  addCheck(checks, "clean export docs include reference baseline integrity command", docs.every((doc) => doc.export_reference_baseline_command_present), { docs });
  addCheck(checks, "clean export docs mark current-state alignment root-workspace-only", docs.every((doc) => doc.current_state_alignment_root_only_if_mentioned), { docs });
  addCheck(checks, "clean export docs do not make current-state alignment default export command", docs.every((doc) => doc.current_state_alignment_not_default_export_command), { docs });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    clean_export_path: CLEAN_EXPORT_PATH,
    clean_export_exists: exists,
    clean_export_entry_count: entries.length,
    current_state_alignment_placement: "root_workspace_only",
    docs,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function requiredFilesAlignment() {
  const requiredFiles = readJson("evals/fixtures/static/required_files.json");
  const requiredInputs = requiredFiles.required_inputs || [];
  const checks = [];
  const oldBaselineInputs = requiredInputs.filter((item) => item.startsWith(`${LEGACY_BASELINE_PATH}/`));
  const referenceBaselineInputs = requiredInputs.filter((item) => item.startsWith(`${REFERENCE_BASELINE_PATH}/`));

  addCheck(checks, "legacy compare checker not required", !requiredInputs.includes(LEGACY_COMPARE_CHECKER), {
    legacy_compare_checker: LEGACY_COMPARE_CHECKER
  });
  addCheck(checks, "reference baseline checker required", requiredInputs.includes(REFERENCE_CHECKER), {
    reference_checker: REFERENCE_CHECKER
  });
  addCheck(checks, "legacy reference baseline inputs not required", oldBaselineInputs.length === 0, {
    legacy_reference_baseline_inputs: oldBaselineInputs
  });
  addCheck(checks, "reference baseline inventory required", requiredInputs.includes(`${REFERENCE_BASELINE_PATH}/file_inventory.json`));
  addCheck(checks, "reference baseline checksums required", requiredInputs.includes(`${REFERENCE_BASELINE_PATH}/checksums.json`));
  addCheck(checks, "all required inputs exist", requiredInputs.every((item) => fs.existsSync(p(item))), {
    missing: requiredInputs.filter((item) => !fs.existsSync(p(item)))
  });

  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    checked_file: "evals/fixtures/static/required_files.json",
    required_input_count: requiredInputs.length,
    legacy_compare_checker_required: requiredInputs.includes(LEGACY_COMPARE_CHECKER),
    reference_baseline_checker_required: requiredInputs.includes(REFERENCE_CHECKER),
    legacy_reference_baseline_required_inputs: oldBaselineInputs,
    reference_baseline_required_inputs: referenceBaselineInputs,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function stackSchemaAlignment() {
  const files = ["stack.schema.json", "schemas/stack.schema.json"];
  const results = files.map((file) => {
    const schema = readJson(file);
    const topRequired = schema.required || [];
    const legacyNames = schema.properties?.project?.properties?.legacy_names || {};
    return {
      file,
      requires_reference_baseline: topRequired.includes("reference_baseline"),
      requires_legacy_baseline: topRequired.includes("baseline"),
      legacy_names_type: legacyNames.type || null,
      legacy_names_items_type: legacyNames.items?.type || null,
      legacy_names_contains_present: Object.hasOwn(legacyNames, "contains"),
      legacy_names_min_items_present: Object.hasOwn(legacyNames, "minItems"),
      legacy_names_allows_empty_array: legacyNames.type === "array"
        && legacyNames.items?.type === "string"
        && !Object.hasOwn(legacyNames, "contains")
        && !Object.hasOwn(legacyNames, "minItems")
    };
  });
  const checks = [];
  addCheck(checks, "all stack schemas require reference_baseline", results.every((item) => item.requires_reference_baseline), results);
  addCheck(checks, "no stack schema requires legacy baseline", results.every((item) => !item.requires_legacy_baseline), results);
  addCheck(checks, "legacy_names allows empty array", results.every((item) => item.legacy_names_allows_empty_array), results);
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    checked_files: files,
    results,
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function validationReportSchemaAlignment() {
  const schema = readJson("schemas/validation_report.schema.json");
  const runner = schema.properties?.runner_reexecution || {};
  const required = runner.required || [];
  const properties = runner.properties || {};
  const checks = [];
  addCheck(checks, "runner_reexecution requires reference baseline field", required.includes(REFERENCE_RUNNER_FIELD), {
    required
  });
  addCheck(checks, "runner_reexecution does not require legacy field", !required.includes(LEGACY_RUNNER_FIELD), {
    required
  });
  addCheck(checks, "reference baseline field const false", properties[REFERENCE_RUNNER_FIELD]?.const === false, {
    property: properties[REFERENCE_RUNNER_FIELD] || null
  });
  addCheck(checks, "legacy runner field absent", !Object.hasOwn(properties, LEGACY_RUNNER_FIELD), {
    legacy_property_present: Object.hasOwn(properties, LEGACY_RUNNER_FIELD)
  });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    checked_file: "schemas/validation_report.schema.json",
    reference_baseline_runners_reexecuted_required: required.includes(REFERENCE_RUNNER_FIELD),
    legacy_reference_runners_reexecuted_required: required.includes(LEGACY_RUNNER_FIELD),
    reference_baseline_runners_reexecuted_const_false: properties[REFERENCE_RUNNER_FIELD]?.const === false,
    legacy_reference_runners_reexecuted_property_present: Object.hasOwn(properties, LEGACY_RUNNER_FIELD),
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

function gitReadinessModeAwareness() {
  const sourceRun = fs.existsSync(p("tools/checks/workspace/check_harness_core_git_readiness.mjs"))
    ? runNode(p("tools/checks/workspace/check_harness_core_git_readiness.mjs"))
    : {
      exit_code: null,
      stdout_json: null,
      stderr: "tools/checks/workspace/check_harness_core_git_readiness.mjs missing"
    };
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-core-no-git-"));
  fs.writeFileSync(path.join(tempRoot, "CURRENT_STATE.json"), "{}\n");
  const noGitRun = fs.existsSync(p("tools/checks/workspace/check_harness_core_git_readiness.mjs"))
    ? runNode(p("tools/checks/workspace/check_harness_core_git_readiness.mjs"), { cwd: tempRoot })
    : {
      exit_code: null,
      stdout_json: null,
      stderr: "tools/checks/workspace/check_harness_core_git_readiness.mjs missing"
    };
  fs.rmSync(tempRoot, { recursive: true, force: true });

  const sourceStatus = sourceRun.stdout_json?.status || null;
  const noGitStatus = noGitRun.stdout_json?.status || null;
  const checks = [];
  if (gitMetadata.git_metadata_present) {
    addCheck(checks, "source workspace git readiness checker exits zero", sourceRun.exit_code === 0, {
      exit_code: sourceRun.exit_code,
      status: sourceStatus,
      stderr: sourceRun.stderr
    });
    addCheck(checks, "source workspace uses git metadata mode", sourceRun.stdout_json?.git_metadata_present === true, {
      mode: sourceRun.stdout_json?.mode || null,
      git_metadata_present: sourceRun.stdout_json?.git_metadata_present ?? null
    });
  } else {
    addCheck(checks, "source workspace git readiness not applicable without git metadata", sourceRun.exit_code === 0
      && sourceStatus === "not_applicable_no_git_metadata", {
      exit_code: sourceRun.exit_code,
      status: sourceStatus,
      stderr: sourceRun.stderr
    });
  }
  addCheck(checks, "no-git context exits zero", noGitRun.exit_code === 0, {
    exit_code: noGitRun.exit_code,
    status: noGitStatus,
    stderr: noGitRun.stderr
  });
  addCheck(checks, "no-git context is not applicable", noGitStatus === "not_applicable_no_git_metadata", {
    status: noGitStatus
  });
  addCheck(checks, "no-git context does not require commit", noGitRun.stdout_json?.commit_approval_required === false
    && noGitRun.stdout_json?.commit_performed === false, {
    commit_approval_required: noGitRun.stdout_json?.commit_approval_required ?? null,
    commit_performed: noGitRun.stdout_json?.commit_performed ?? null
  });
  const failures = checks.filter((check) => check.status !== "pass");
  return {
    status: failures.length === 0 ? "pass" : "fail",
    stage: STAGE,
    git_readiness_mode_awareness: gitMetadata.git_metadata_present
      ? "git_metadata_present"
      : "not_applicable_no_git_metadata",
    git_metadata_present: gitMetadata.git_metadata_present,
    reason: gitMetadata.git_metadata_present
      ? "Source workspace .git metadata is present; git readiness is applicable."
      : "No .git metadata is present; source workspace git readiness is not applicable in uploaded archive or clean export context.",
    source_workspace: {
      exit_code: sourceRun.exit_code,
      status: sourceStatus,
      mode: sourceRun.stdout_json?.mode || null,
      git_metadata_present: sourceRun.stdout_json?.git_metadata_present ?? null
    },
    no_git_context: {
      exit_code: noGitRun.exit_code,
      status: noGitStatus,
      mode: noGitRun.stdout_json?.mode || null,
      git_metadata_present: noGitRun.stdout_json?.git_metadata_present ?? null,
      commit_approval_required: noGitRun.stdout_json?.commit_approval_required ?? null,
      commit_performed: noGitRun.stdout_json?.commit_performed ?? null
    },
    checks,
    failures,
    unresolved_items_count: failures.length
  };
}

const generatedAt = new Date().toISOString();
const sourceSurfaceAvailable = sourceWorkspaceSurfaceAvailable();
const rootVsExportPolicyReport = sourceSurfaceAvailable
  ? rootVsExportCommandPolicy()
  : {
    status: "not_applicable_no_git_metadata",
    stage: STAGE,
    reason: "Source workspace command-policy files are not fully present in this archive context.",
    root_workspace_mode: {
      first_commands: [
        SELF_CONTAINED_COMMAND,
        CURRENT_STATE_ALIGNMENT_COMMAND,
        REFERENCE_BASELINE_COMMAND
      ]
    },
    agent_ready_export_mode: {
      first_commands: [
        SELF_CONTAINED_COMMAND,
        REFERENCE_BASELINE_COMMAND
      ],
      current_state_alignment_default_command: false
    },
    current_state_alignment_placement: "root_workspace_only",
    checks: [],
    failures: [],
    unresolved_items_count: 0
  };
const gitModeReport = gitReadinessModeAwareness();
const noGitModeReport = {
  status: "pass",
  stage: STAGE,
  generated_at: generatedAt,
  git_readiness_mode_awareness: gitModeReport.git_readiness_mode_awareness,
  git_metadata_present: gitModeReport.git_metadata_present,
  reason: gitModeReport.reason,
  source_workspace: gitModeReport.source_workspace,
  no_git_context: gitModeReport.no_git_context,
  checks: gitModeReport.checks,
  failures: gitModeReport.failures,
  unresolved_items_count: gitModeReport.unresolved_items_count
};

const archiveNoGitOnly = !gitMetadata.git_metadata_present && !sourceSurfaceAvailable;
const requiredFilesReport = archiveNoGitOnly ? null : requiredFilesAlignment();
const stackSchemaReport = archiveNoGitOnly ? null : stackSchemaAlignment();
const validationSchemaReport = archiveNoGitOnly ? null : validationReportSchemaAlignment();
const cleanExportSurfaceReport = archiveNoGitOnly
  ? {
    status: "not_applicable_no_git_metadata",
    stage: STAGE,
    reason: "Clean export archive file is not required for no-git uploaded archive context.",
    current_state_alignment_placement: "root_workspace_only",
    failures: [],
    unresolved_items_count: 0
  }
  : cleanExportCommandSurface();

const sectionReports = [
  requiredFilesReport,
  stackSchemaReport,
  validationSchemaReport,
  rootVsExportPolicyReport,
  noGitModeReport,
  cleanExportSurfaceReport
].filter(Boolean);
const failures = sectionReports.flatMap((report) => (report.failures || []).map((failure) => ({
  section: report.checked_file || report.checked_files || report.current_state_alignment_placement || "precommit_doc_export_consistency",
  ...failure
})));

const repairReport = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: generatedAt,
  scope: "precommit doc/export consistency repair only",
  archive_no_git_only: archiveNoGitOnly,
  source_workspace_surface_available: sourceSurfaceAvailable,
  reports: {
    root_vs_export_command_policy: `${EVIDENCE_DIR}/root_vs_export_command_policy.json`,
    no_git_precommit_checker_mode_report: `${EVIDENCE_DIR}/no_git_precommit_checker_mode_report.json`,
    clean_export_command_surface_report: `${EVIDENCE_DIR}/clean_export_command_surface_report.json`,
    gate_report: `${EVIDENCE_DIR}/precommit_doc_export_consistency_gate_report.json`
  },
  root_workspace_first_commands: rootVsExportPolicyReport.root_workspace_mode?.first_commands || [],
  clean_export_first_commands: rootVsExportPolicyReport.agent_ready_export_mode?.first_commands || [],
  current_state_alignment_placement: "root_workspace_only",
  git_readiness_mode_awareness: gitModeReport.git_readiness_mode_awareness,
  git_metadata_present: gitModeReport.git_metadata_present,
  openai_model_api_call: false,
  openai_provider_rerun: false,
  local_model_generation: false,
  telemetry_sink_write: false,
  npm_install_or_ci: false,
  reference_baseline_refresh: false,
  legacy_reference_source_modified: false,
  dist_modified: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  weak_claims_recordable: [
    "harness-core-precommit-doc-export-consistency-repair-recorded",
    "root-vs-export-command-policy-recorded",
    "no-git-precommit-checker-mode-recorded",
    "clean-export-command-surface-checked"
  ],
  section_statuses: sectionReports.map((report) => ({
    section: report.checked_file || report.checked_files || report.current_state_alignment_placement || "precommit_doc_export_consistency",
    status: report.status,
    unresolved_items_count: report.unresolved_items_count || 0
  })),
  failures,
  unresolved_items_count: failures.length
};

const gateReport = {
  status: repairReport.status,
  stage: STAGE,
  generated_at: generatedAt,
  root_vs_export_command_policy: rootVsExportPolicyReport.status,
  no_git_precommit_checker_mode: noGitModeReport.status,
  clean_export_command_surface: cleanExportSurfaceReport.status,
  required_files_alignment: requiredFilesReport?.status || "not_applicable_no_git_metadata",
  stack_schema_alignment: stackSchemaReport?.status || "not_applicable_no_git_metadata",
  validation_report_schema_alignment: validationSchemaReport?.status || "not_applicable_no_git_metadata",
  git_readiness_mode_awareness: gitModeReport.git_readiness_mode_awareness,
  git_metadata_present: gitModeReport.git_metadata_present,
  commit_performed: false,
  strong_claims_allowed: false,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  failures,
  unresolved_items_count: failures.length
};

writeJson(`${EVIDENCE_DIR}/root_vs_export_command_policy.json`, rootVsExportPolicyReport);
writeJson(`${EVIDENCE_DIR}/no_git_precommit_checker_mode_report.json`, noGitModeReport);
writeJson(`${EVIDENCE_DIR}/clean_export_command_surface_report.json`, cleanExportSurfaceReport);
writeJson(`${EVIDENCE_DIR}/precommit_doc_export_consistency_repair_report.json`, repairReport);
writeJson(`${EVIDENCE_DIR}/precommit_doc_export_consistency_gate_report.json`, gateReport);
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: repairReport.status,
  stage: STAGE,
  generated_at: generatedAt,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(gateReport, null, 2));
process.exit(repairReport.status === "pass" ? 0 : 1);
