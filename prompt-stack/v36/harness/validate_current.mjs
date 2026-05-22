import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const packageName = path.basename(root);
const evidenceRoot = path.join(workspace, "_evidence", packageName);
const checks = [];

function slash(p) {
  return p.replace(/\\/g, "/");
}

function existsInRoot(rel) {
  return fs.existsSync(path.join(root, rel));
}

function existsInWorkspace(rel) {
  return fs.existsSync(path.join(workspace, rel));
}

function readRoot(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
}

function readWorkspace(rel) {
  const file = path.join(workspace, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "") : "";
}

function displayPath(rel) {
  return slash(rel);
}

function check(name, pass, detail, severity = pass ? "pass" : "P1") {
  checks.push({ name, pass: Boolean(pass), severity: pass ? "pass" : severity, detail });
}

function listFiles(dir) {
  const out = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      if (entry.isFile()) out.push(full);
    }
  }
  walk(dir);
  return out.sort((a, b) => slash(a).localeCompare(slash(b)));
}

function parseJsonRoot(rel) {
  return JSON.parse(readRoot(rel));
}

function koreanChars(text) {
  return [...text].filter((ch) => /[가-힣]/.test(ch)).length;
}

const requiredActive = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "AGENTS.md",
  "MASTER_PROMPT_ROUTER.md",
  "autonomous/00_governance",
  "autonomous/01_base",
  "autonomous/02_overlays",
  "autonomous/03_examples",
  "autonomous/04_harness",
  "autonomous/05_state",
  "autonomous/06_verification",
  "autonomous/07_scope",
  "autonomous/08_lifecycle",
  "autonomous/99_total",
  "codex/AGENTS.md",
  "codex/CODEX_RUNTIME_GUIDE.md",
  "codex/skills/coding-core/SKILL.md",
  "codex/skills/design-analysis/SKILL.md",
  "codex/skills/eval-ops/SKILL.md",
  "codex/skills/grounded-research/SKILL.md",
  "codex/skills/orchestration-control/SKILL.md",
  "state/feature_list.json",
  "state/progress.md",
  "state/decision_log.md",
  "state/evidence_log.json",
  "state/session-handoff.md",
  "verification/current_validation_suite.json",
  "verification/current_validation_result.json",
  "verification/evaluator-rubric.md",
  "verification/benchmark_suite.json",
  "verification/behavioral_benchmark_suite.json",
  "verification/claim_strength_checklist.json",
  "verification/validation_readme.md",
  "lifecycle/init.sh",
  "lifecycle/clean-state-checklist.md",
  "lifecycle/session-start.md",
  "lifecycle/session-closeout.md",
  "lifecycle/handoff-template.md",
  "docs/CURRENT_STATE.md",
  "docs/OPERATING_GUIDE.md",
  "docs/LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/ARTIFACT_MAP.md",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/RELIABILITY.md",
  "docs/QUALITY_SCORE.md",
  "docs/PLANS.md",
  "docs/OPERATOR_CHECKLIST.md",
  "harness/README.md",
  "harness/validate_current_v36.mjs",
  "harness/validate_current.mjs",
  "harness/validate_assembled_bundle.mjs",
  "harness/validate_codex_runtime.mjs",
  "harness/run_smoke_validation.mjs",
  "validation/current_validation_suite.json",
  "validation/current_validation_result.json",
  "validation/validation_readme.md",
  "records/current_state.json",
  "records/release_manifest.json",
  "records/file_checksums.json",
  "records/active_validation_summary.json",
  "records/followup_backlog.json",
  "records/artifact_map.json",
  "records/limitations_register.json",
  "reports/CURRENT_STATE_SUMMARY.md",
  "reports/VALIDATION_SUMMARY.md",
  "reports/RELEASE_NOTES.md",
  "reports/ROLLBACK_AND_MONITORING_PLAN.md",
  "reports/FINAL_STATUS.md",
];

for (const rel of requiredActive) {
  check(`required_active:${rel}`, existsInRoot(rel), rel, "P0");
}

const requiredEvidence = [
  ["README.md", "_evidence/v36/README.md"],
  ["evidence_manifest.json", "_evidence/v36/evidence_manifest.json"],
  ["evidence_checksums.json", "_evidence/v36/evidence_checksums.json"],
  ["source_clone", "_evidence/v36/source_clone"],
  ["actor_outputs", "_evidence/v36/actor_outputs"],
  ["release_decision", "_evidence/v36/release_decision"],
  ["validation_runs", "_evidence/v36/validation_runs"],
  ["phase_reports", "_evidence/v36/phase_reports"],
];

for (const [rel, display] of requiredEvidence) {
  const actual = path.join("_evidence", packageName, rel);
  check(`required_evidence:${display}`, existsInWorkspace(actual), display, "P0");
}

const jsonFiles = listFiles(root).filter((file) => slash(file).endsWith(".json"));
for (const file of jsonFiles) {
  const rel = slash(path.relative(root, file));
  try {
    JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    check(`json_parse:${rel}`, true, rel);
  } catch (error) {
    check(`json_parse:${rel}`, false, `${rel}: ${error.message}`, "P0");
  }
}

for (const rel of ["evidence_manifest.json", "evidence_checksums.json"]) {
  const actual = path.join("_evidence", packageName, rel);
  const display = path.join("_evidence", packageName, rel);
  try {
    JSON.parse(readWorkspace(actual));
    check(`evidence_json_parse:${displayPath(display)}`, true, displayPath(display));
  } catch (error) {
    check(`evidence_json_parse:${displayPath(display)}`, false, `${displayPath(display)}: ${error.message}`, "P0");
  }
}

const currentPointer = readWorkspace("CURRENT_STABLE_VERSION.txt");
const releaseIndex = readWorkspace("RELEASE_INDEX.md");
const releaseHistory = JSON.parse(readWorkspace("records/release_history.json"));
const releaseHistoryText = readWorkspace("records/release_history.json");
const artifactMapText = `${readRoot("docs/ARTIFACT_MAP.md")}\n${readRoot("records/artifact_map.json")}`;
check("current_stable_pointer_matches_active_package", currentPointer.includes(`current_stable_version=${packageName}`), "CURRENT_STABLE_VERSION.txt", "P0");
check("release_index_current_stable_matches_active_package", releaseIndex.includes(`current stable: ${packageName}`), "RELEASE_INDEX.md", "P0");
check("release_history_current_stable_matches_active_package", releaseHistory.current_stable_version === packageName, "records/release_history.json", "P0");
const retiredLegacyToken = ["legacy", "version"].join("_");
check("retired_legacy_token_not_used", !releaseIndex.includes(retiredLegacyToken) && !readWorkspace("records/release_history.json").includes(retiredLegacyToken), "legacy path references", "P0");
const canonicalPathSurface = `${releaseIndex}\n${releaseHistoryText}\n${artifactMapText}`;
check("canonical_legacy_v35_path_used", canonicalPathSurface.includes("_legacy/v35"), "_legacy/v35", "P0");
check("canonical_legacy_v34_path_used", canonicalPathSurface.includes("_legacy/v34"), "_legacy/v34", "P0");
check("canonical_cold_storage_path_used", canonicalPathSurface.includes("_legacy/_cold_storage/legacy_older_versions"), "_legacy/_cold_storage/legacy_older_versions", "P0");
check("root_legacy_paths_absent", !/(?<!_)legacy\/v3[45]/.test(canonicalPathSurface), "legacy/v34 and legacy/v35 absent", "P0");
check("root_cold_storage_path_absent", !/(?<!_legacy\/)_cold_storage\/legacy_older_versions/.test(canonicalPathSurface), "root _cold_storage/legacy_older_versions absent", "P0");
check("canonical_legacy_v35_exists", existsInWorkspace("_legacy/v35"), "_legacy/v35", "P0");
check("canonical_legacy_v34_exists", existsInWorkspace("_legacy/v34"), "_legacy/v34", "P0");
check("canonical_cold_storage_exists", existsInWorkspace("_legacy/_cold_storage/legacy_older_versions"), "_legacy/_cold_storage/legacy_older_versions", "P0");

const rawEvidenceDirs = [
  "sources",
  "04_upgraded_prompt_assets",
  "archive/behavioral_evidence",
  "archive/raw_benchmark_runs",
  "validation/runs",
];
for (const rel of rawEvidenceDirs) {
  const count = listFiles(path.join(root, rel)).length;
  check(`active_raw_evidence_files_zero:${rel}`, count === 0, `${rel}: ${count}`, "P0");
}

const forbiddenActivePaths = [
  "sources",
  "archive",
  "04_upgraded_prompt_assets",
  "records/actor_outputs",
  "records/actor_packets",
  "validation/runs",
  "records/active-package_practical_cleanup_evidence_moves.json",
  "records/active-package_practical_cleanup_pre_action_snapshot.json",
  "records/active-package_practical_cleanup_execution.json",
  "records/active-package_korean_user_doc_rewrite_execution.json",
  "records/active-package_practical_cleanup_review_needed_hold.json",
  "records/active-package_active_package_inventory.json",
  "records/active-package_evidence_package_inventory.json",
  "records/active-package_practical_structure_final_report.json",
  "reports/PRACTICAL_STRUCTURE_FINAL_REPORT.md",
  "reports/REVIEW_NEEDED_ITEMS.md",
  "records/hard_cleanup_empty_dirs.json",
  "records/hard_cleanup_final_report.json",
  "records/hard_cleanup_inventory.json",
  "records/hard_cleanup_record_moves.json",
  "records/hard_cleanup_report_moves.json",
  "records/harness_creator_adapter_audit.json",
  "records/harness_creator_adapter_final_sanity_check.json",
  "records/harness_creator_adapter_reinforcement_result.json",
  "records/structure_normalization_execution.json",
  "records/structure_normalization_pre_action_snapshot.json",
  "records/v36_root_path_registry_canonicalization.json",
  "records/v36_structure_normalization_dry_run.json",
  "records/v36_structure_normalization_inventory.json",
  "reports/HARNESS_CREATOR_ADAPTER_AUDIT.md",
  "reports/HARNESS_CREATOR_ADAPTER_FINAL_SANITY_CHECK.md",
  "reports/HARNESS_CREATOR_ADAPTER_REINFORCEMENT_REPORT.md",
  "reports/HARD_CLEANUP_FINAL_REPORT.md",
  "reports/HARD_CLEANUP_INVENTORY.md",
  "reports/STRUCTURE_NORMALIZATION_EXECUTION_REPORT.md",
  "reports/V36_ROOT_PATH_REGISTRY_CANONICALIZATION.md",
  "reports/V36_STRUCTURE_NORMALIZATION_DRY_RUN.md",
  "reports/V36_STRUCTURE_NORMALIZATION_INVENTORY.md",
];
for (const rel of forbiddenActivePaths) {
  check(`forbidden_active_path_absent:${rel}`, !existsInRoot(rel), rel, "P0");
}

const userDocs = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "docs/CURRENT_STATE.md",
  "docs/OPERATING_GUIDE.md",
  "docs/LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/ARTIFACT_MAP.md",
  "reports/CURRENT_STATE_SUMMARY.md",
  "reports/VALIDATION_SUMMARY.md",
  "reports/RELEASE_NOTES.md",
  "reports/ROLLBACK_AND_MONITORING_PLAN.md",
  "reports/FINAL_STATUS.md",
  "harness/README.md",
  "validation/validation_readme.md",
];
for (const rel of userDocs) {
  const chars = koreanChars(readRoot(rel));
  check(`korean_user_doc:${rel}`, chars >= 20, `${rel}: ${chars} Korean chars`, "P1");
}

const activeText = [
  ...userDocs,
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/RELIABILITY.md",
  "docs/QUALITY_SCORE.md",
  "docs/PLANS.md",
  "docs/OPERATOR_CHECKLIST.md",
].map(readRoot).join("\n");

const previousVersionScanTerms = [
  { label: "candidate_version_token", term: ["active-package", "candidate"].join("_") },
  { label: "phase_9", term: "release decision stage" },
  { label: "phase_10", term: "finalization stage" },
  { label: "promotion_phrase", term: "promote the active package" },
];
for (const { label, term } of previousVersionScanTerms) {
  check(`previous_version_active_doc_scan:${label}`, !activeText.includes(term), label, "P1");
}

for (const term of [
  "production-monitored",
  "containment-verified",
  "all-primary-source-validated",
  "public-benchmark-certified",
  "live-production-rollout-certified",
]) {
  check(`prohibited_positive_claim_absent:${term}`, !activeText.includes(term), term, "P0");
}

check("codex_runtime_not_mirror", !existsInRoot("autonomous/99_total/codex"), "autonomous/99_total/codex absent", "P0");
check("evidence_manifest_nonempty", JSON.parse(readWorkspace(path.join("_evidence", packageName, "evidence_manifest.json"))).moved_files > 0, "evidence_manifest.moved_files", "P0");
check("active_artifact_map_exists", existsInRoot("records/artifact_map.json"), "records/artifact_map.json", "P1");

const result = {
  validation_name: "current_package_practical_structure_validation",
  generated_at: new Date().toISOString(),
  total_checks: checks.length,
  passed_checks: checks.filter((item) => item.pass).length,
  failed_checks: checks.filter((item) => !item.pass).length,
  status: checks.every((item) => item.pass) ? "pass" : "fail",
  claim_strength: "local_practical_structure_validation",
  checks,
};

fs.mkdirSync(path.join(root, "validation"), { recursive: true });
fs.mkdirSync(path.join(root, "verification"), { recursive: true });
fs.writeFileSync(path.join(root, "validation", "current_validation_result.json"), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(root, "verification", "current_validation_result.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, total_checks: result.total_checks, failed_checks: result.failed_checks }, null, 2));
if (result.status !== "pass") process.exit(1);
