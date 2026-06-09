#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STAGE = "v2.0.0-harness-core-final-precommit-convergence-autopilot";
const EVIDENCE_DIR = "evidence/reference-baseline-deemphasis";
const LEGACY_TOKEN = ["v", "36"].join("");
const OLD_SOURCE_PATH = ["prompt-stack", LEGACY_TOKEN].join("/");
const OLD_BASELINE_PATH = ["evidence", `${LEGACY_TOKEN}-baseline`].join("/");
const OLD_COMPARE_CHECKER = ["compare_", LEGACY_TOKEN, "_baseline.mjs"].join("");
const REFERENCE_CHECKER = "check_reference_baseline_integrity.mjs";

const ACTIVE_FILES = [
  "CURRENT_STATE.yaml",
  "CURRENT_STATE.json",
  "START_HERE_FOR_AGENTS.ko.md",
  "AGENT_BOOTSTRAP.ko.md",
  "README.md",
  "AGENTS.md",
  "FINAL_HANDOFF.ko.md",
  "FINAL_NEW_CONVERSATION_PROMPT.ko.md",
  "docs/workspace/how_to_apply_harness_to_agents.ko.md",
  "docs/workspace/agent_ready_self_contained_mode.ko.md",
  "docs/release/harness_core_final_surface_git_readiness.ko.md",
  "docs/workspace/git_commit_after_harness_core_rename.ko.md",
  "docs/workspace/harness_core_final_precommit_convergence.ko.md",
  "profiles/agents/chatgpt_reviewer.yaml",
  "profiles/agents/codex_goal_executor.yaml",
  "profiles/agents/local_runtime_operator.yaml",
  "profiles/agents/release_gate_reviewer.yaml",
  "stack.yaml",
  "MANIFEST.asset_classes.yaml",
  "package.json",
  "release/claims/general/claim_ladder.md",
  "release/gates/core-release/release_gate.yaml",
  "release/scopes/harness-core/harness_core_final_surface_git_readiness_scope.yaml",
  "release/claims/harness-core/harness_core_final_surface_claim_boundary.yaml",
  "release/approvals/harness-core/harness_core_git_commit_approval_request.md",
  "release/scopes/harness-core/harness_core_final_precommit_convergence_scope.yaml",
  "release/claims/harness-core/harness_core_final_precommit_claim_boundary.yaml",
  "tools/checks/workspace/check_reference_baseline_integrity.mjs",
  "tools/checks/workspace/check_harness_core_no_legacy_surface.mjs",
  "tools/checks/workspace/check_harness_core_git_readiness.mjs",
  "tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs"
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

function readText(relPath) {
  return fs.readFileSync(p(relPath), "utf8").replace(/^\uFEFF/, "");
}

function findMatches(relPath) {
  if (!fs.existsSync(p(relPath))) {
    return [{ file: relPath, line: null, value: "missing_file", excerpt: "" }];
  }
  const text = readText(relPath);
  const values = [OLD_SOURCE_PATH, OLD_BASELINE_PATH, OLD_COMPARE_CHECKER, LEGACY_TOKEN];
  const matches = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const value of values) {
      if (lines[index].includes(value)) {
        matches.push({
          file: relPath,
          line: index + 1,
          value,
          excerpt: lines[index].trim().slice(0, 240)
        });
      }
    }
  }
  return matches.filter((match) => match.value !== "missing_file");
}

const oldLabelMatches = ACTIVE_FILES.flatMap(findMatches);
const activeTexts = ACTIVE_FILES
  .filter((file) => fs.existsSync(p(file)))
  .map((file) => ({ file, text: readText(file) }));
const commandMentions = activeTexts.flatMap(({ file, text }) => text.includes(REFERENCE_CHECKER) ? [file] : []);
const referenceWordingMentions = activeTexts.flatMap(({ file, text }) => /reference baseline|reference-baseline|reference snapshot|legacy reference|historical reference/i.test(text) ? [file] : []);
const missingFiles = ACTIVE_FILES.filter((file) => !fs.existsSync(p(file)));

const checks = [
  {
    name: "active files exist",
    status: missingFiles.length === 0 ? "pass" : "fail",
    detail: { missing_files: missingFiles }
  },
  {
    name: "active docs old label absent",
    status: oldLabelMatches.length === 0 ? "pass" : "fail",
    detail: { matches: oldLabelMatches }
  },
  {
    name: "active commands use reference baseline checker",
    status: commandMentions.length > 0 ? "pass" : "fail",
    detail: { files: commandMentions, checker: REFERENCE_CHECKER }
  },
  {
    name: "user-facing wording uses reference baseline language",
    status: referenceWordingMentions.length >= 6 ? "pass" : "fail",
    detail: { files: referenceWordingMentions }
  }
];
const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  stage: STAGE,
  generated_at: new Date().toISOString(),
  weak_claim_recorded: "active-docs-reference-name-aligned",
  active_docs_old_label_count: oldLabelMatches.length,
  old_label_matches: oldLabelMatches,
  command_replacement_status: oldLabelMatches.filter((match) => match.value === OLD_COMPARE_CHECKER).length === 0
    && commandMentions.length > 0 ? "pass" : "fail",
  user_facing_wording_status: referenceWordingMentions.length >= 6 ? "pass" : "fail",
  reference_checker: REFERENCE_CHECKER,
  scanned_files: ACTIVE_FILES,
  checks,
  failures,
  unresolved_items_count: failures.length,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
};

writeJson(`${EVIDENCE_DIR}/active_docs_reference_name_scan.json`, report);
writeJson(`${EVIDENCE_DIR}/reference_baseline_deemphasis_report.json`, {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  reference_baseline_deemphasized: report.status === "pass",
  active_docs_reference_name_aligned: report.status === "pass",
  active_docs_old_label_count: oldLabelMatches.length,
  command_replacement_status: report.command_replacement_status,
  user_facing_wording_status: report.user_facing_wording_status,
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false
});
writeJson(`${EVIDENCE_DIR}/reference_baseline_deemphasis_gate_report.json`, {
  status: report.status,
  stage: STAGE,
  generated_at: report.generated_at,
  reference_baseline_deemphasized: report.status === "pass",
  active_docs_reference_name_aligned: report.status === "pass",
  legacy_reference_policy_recorded: fs.existsSync(p(`${EVIDENCE_DIR}/legacy_reference_policy.json`)),
  reference_baseline_integrity_checked: fs.existsSync(p(`${EVIDENCE_DIR}/reference_baseline_integrity_report.json`)),
  provider_verified_allowed: false,
  adapter_checked_allowed: false,
  production_ready_allowed: false,
  stable_allowed: false,
  release_gated_allowed: false,
  unresolved_items_count: failures.length
});
writeJson(`${EVIDENCE_DIR}/unresolved_items.json`, {
  status: report.status === "pass" ? "pass" : "blocked",
  stage: STAGE,
  generated_at: report.generated_at,
  unresolved_items_count: failures.length,
  unresolved_items: failures
});

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
