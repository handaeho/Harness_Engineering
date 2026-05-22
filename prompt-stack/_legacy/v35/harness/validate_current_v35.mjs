import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(root, "..");
const archiveRel = "_archive/v35_release_evidence_2026-05-19";
const archive = path.join(workspaceRoot, archiveRel);
const resultPath = path.join(root, "validation", "current_validation_result.json");
const runsDir = path.join(root, "validation", "runs");

const requiredPaths = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "00_governance",
  "01_base",
  "02_overlays",
  "03_examples",
  "04_harness",
  "99_total",
  "codex",
  "docs/V35_CURRENT_STATE.md",
  "docs/V35_OPERATING_GUIDE.md",
  "docs/V35_LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/V35_ARTIFACT_MAP.md",
  "harness/README.md",
  "harness/validate_current_v35.mjs",
  "records/v35_current_state.json",
  "records/v35_release_manifest.json",
  "records/v35_file_checksums.json",
  "records/v35_limitations_register.json",
  "records/v35_followup_backlog.json",
  "records/v35_active_validation_summary.json",
  "records/v35_release_integrity_closure.json",
  "records/v35_final_verification_and_cleanup_dry_run.json",
  "reports/V35_CURRENT_STATE_SUMMARY.md",
  "reports/V35_VALIDATION_SUMMARY.md",
  "reports/V35_RELEASE_NOTES.md",
  "reports/V35_ROLLBACK_AND_MONITORING_PLAN.md",
  "reports/V35_CLEANUP_FINAL_REPORT.md",
  "reports/V35_RELEASE_INTEGRITY_CLOSURE_REPORT.md",
  "reports/V35_FINAL_VERIFICATION_AND_CLEANUP_DRY_RUN.md",
  "validation/current_validation_suite.json",
  "validation/current_validation_result.json",
  "validation/validation_readme.md"
];

const jsonPaths = [
  "records/v35_current_state.json",
  "records/v35_release_manifest.json",
  "records/v35_limitations_register.json",
  "records/v35_followup_backlog.json",
  "records/v35_active_validation_summary.json",
  "records/v35_release_integrity_closure.json",
  "records/v35_final_verification_and_cleanup_dry_run.json",
  "validation/current_validation_suite.json"
];

const docsToScan = [
  "README.md",
  "PROMPT_USER_GUIDE.md",
  "docs/V35_CURRENT_STATE.md",
  "docs/V35_OPERATING_GUIDE.md",
  "docs/V35_LIMITATIONS_AND_FOLLOWUPS.md",
  "docs/V35_ARTIFACT_MAP.md",
  "reports/V35_CURRENT_STATE_SUMMARY.md",
  "reports/V35_VALIDATION_SUMMARY.md",
  "reports/V35_RELEASE_NOTES.md",
  "reports/V35_ROLLBACK_AND_MONITORING_PLAN.md",
  "reports/V35_CLEANUP_FINAL_REPORT.md",
  "reports/V35_RELEASE_INTEGRITY_CLOSURE_REPORT.md",
  "reports/V35_FINAL_VERIFICATION_AND_CLEANUP_DRY_RUN.md"
];

const sourceToTotalPairs = [
  ["00_governance/PROMPT_guideline.md", "99_total/PROMPT_guideline.md"],
  ["01_base/PROMPT_full.md", "99_total/PROMPT_full.md"],
  ["01_base/PROMPT_light.md", "99_total/PROMPT_light.md"],
  ["01_base/PROMPT_lightest.md", "99_total/PROMPT_lightest.md"],
  ["01_base/PROMPT_standalone.md", "99_total/PROMPT_standalone.md"],
  ["02_overlays/PROMPT_evaluation_monitoring_overlay.md", "99_total/PROMPT_evaluation_monitoring_overlay.md"],
  ["02_overlays/PROMPT_guardrails_safety_overlay.md", "99_total/PROMPT_guardrails_safety_overlay.md"],
  ["02_overlays/PROMPT_memory_adaptation_overlay.md", "99_total/PROMPT_memory_adaptation_overlay.md"],
  ["02_overlays/PROMPT_multi_agent_overlay.md", "99_total/PROMPT_multi_agent_overlay.md"],
  ["02_overlays/PROMPT_retrieval_grounding_overlay.md", "99_total/PROMPT_retrieval_grounding_overlay.md"],
  ["02_overlays/PROMPT_search_reasoning_overlay.md", "99_total/PROMPT_search_reasoning_overlay.md"],
  ["02_overlays/PROMPT_tool_protocol_overlay.md", "99_total/PROMPT_tool_protocol_overlay.md"],
  ["03_examples/PROMPT_example_catalog.md", "99_total/PROMPT_example_catalog.md"],
  ["03_examples/PROMPT_example_injection.md", "99_total/PROMPT_example_injection.md"],
  ["04_harness/PROMPT_harness_contracts.md", "99_total/PROMPT_harness_contracts.md"],
  ["04_harness/PROMPT_harness_engineering.md", "99_total/PROMPT_harness_engineering.md"],
  ["04_harness/PROMPT_harness_release_gate.md", "99_total/PROMPT_harness_release_gate.md"]
];

const codexToTotalPairs = [
  ["codex/AGENTS.md", "99_total/codex/AGENTS.md"],
  ["codex/CODEX_RUNTIME_GUIDE.md", "99_total/codex/CODEX_RUNTIME_GUIDE.md"],
  ["codex/skills/coding-core/SKILL.md", "99_total/codex/skills/coding-core/SKILL.md"],
  ["codex/skills/design-analysis/SKILL.md", "99_total/codex/skills/design-analysis/SKILL.md"],
  ["codex/skills/eval-ops/SKILL.md", "99_total/codex/skills/eval-ops/SKILL.md"],
  ["codex/skills/grounded-research/SKILL.md", "99_total/codex/skills/grounded-research/SKILL.md"],
  ["codex/skills/orchestration-control/SKILL.md", "99_total/codex/skills/orchestration-control/SKILL.md"]
];

const requiredRootPointerPaths = [
  "v35/records/v35_release_manifest.json",
  "v35/reports/V35_RELEASE_NOTES.md",
  "v35/docs/V35_CURRENT_STATE.md",
  "v35/reports/V35_VALIDATION_SUMMARY.md",
  "v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md"
];

const prohibitedPositive = [
  /v35\s+is\s+production-monitored/i,
  /v35\s+is\s+containment-verified/i,
  /all\s+primary-source\s+items\s+are\s+fully\s+validated/i,
  /v35\s+is\s+public\s+benchmark\s+certified/i,
  /v35\s+is\s+live\s+production\s+rollout\s+certified/i,
  /v35\s+is\s+production\s+monitored/i,
  /v35\s+is\s+containment\s+verified/i,
  /v35\s+is\s+public\s+benchmark\s+certified/i,
  /v35\s+is\s+live\s+production\s+rollout\s+certified/i
];

const requiredDowngradeText = [
  "primary-source deferred item",
  "production-readiness claim",
  "containment proof",
  "production telemetry",
  "textual mirror",
  "live production rollout certification"
];

const checks = [];
function check(name, pass, detail = "") {
  checks.push({ name, pass: Boolean(pass), detail });
}
function slash(p) {
  return p.replace(/\\/g, "/");
}
function relFromRoot(abs) {
  return slash(path.relative(root, abs));
}
function relFromWorkspace(abs) {
  return slash(path.relative(workspaceRoot, abs));
}
function readUtf8(abs) {
  return fs.readFileSync(abs, "utf8").replace(/^\uFEFF/, "");
}
function sha256(abs) {
  return crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
}
function listFiles(absDir) {
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile()) files.push(full);
    }
  }
  if (fs.existsSync(absDir)) walk(absDir);
  return files.sort((a, b) => slash(a).localeCompare(slash(b)));
}
function workspacePath(rel) {
  const cleaned = rel.replace(/^\.([/\\])/, "").replace(/\\/g, "/");
  return path.join(workspaceRoot, cleaned);
}
function shouldExcludeActive(rel) {
  const p = slash(rel);
  return p === "v35/records/v35_file_checksums.json" ||
    p === "v35/validation/current_validation_result.json" ||
    p.startsWith("v35/validation/runs/");
}
function readJson(abs) {
  return JSON.parse(readUtf8(abs));
}

for (const rel of requiredPaths) {
  check(`required_path:${rel}`, fs.existsSync(path.join(root, rel)), rel);
}

for (const rel of jsonPaths) {
  try {
    readJson(path.join(root, rel));
    check(`json_parse:${rel}`, true, rel);
  } catch (error) {
    check(`json_parse:${rel}`, false, String(error));
  }
}

let scanText = "";
for (const rel of docsToScan) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) scanText += `\n--- ${rel} ---\n${readUtf8(abs)}`;
}
for (const pattern of prohibitedPositive) {
  check(`prohibited_positive_claim:${pattern}`, !pattern.test(scanText), String(pattern));
}
for (const text of requiredDowngradeText) {
  check(`downgrade_text:${text}`, scanText.includes(text), text);
}
check("codex_runtime_independence_documented", scanText.includes("textual mirror") && scanText.includes("behavioral alignment"), "codex runtime non-00~04-mirror boundary");
check("99_total_actual_use_bundle_documented", scanText.includes("assembled prompt bundle") || scanText.includes("actual-use-bundle"), "99_total role");

let sourceParityPass = 0;
let sourceStablePatchPass = 0;
for (const [srcRel, totalRel] of sourceToTotalPairs) {
  const src = path.join(root, srcRel);
  const total = path.join(root, totalRel);
  const exists = fs.existsSync(src) && fs.existsSync(total);
  const same = exists && sha256(src) === sha256(total);
  if (same) sourceParityPass += 1;
  check(`source_to_99_total_parity:${srcRel}`, same, `${srcRel} -> ${totalRel}`);
  const markerOk = exists && readUtf8(total).includes("V35_RELEASE_STABLE_PATCH_START");
  if (markerOk) sourceStablePatchPass += 1;
  check(`99_total_stable_patch_marker:${totalRel}`, markerOk, totalRel);
}
check("source_to_99_total_parity_summary", sourceParityPass === sourceToTotalPairs.length, `${sourceParityPass}/${sourceToTotalPairs.length}`);
check("99_total_stable_patch_marker_summary", sourceStablePatchPass === sourceToTotalPairs.length, `${sourceStablePatchPass}/${sourceToTotalPairs.length}`);

let codexParityPass = 0;
for (const [srcRel, totalRel] of codexToTotalPairs) {
  const src = path.join(root, srcRel);
  const total = path.join(root, totalRel);
  const same = fs.existsSync(src) && fs.existsSync(total) && sha256(src) === sha256(total);
  if (same) codexParityPass += 1;
  check(`codex_to_99_total_codex_parity:${srcRel}`, same, `${srcRel} -> ${totalRel}`);
}
const nonMirrorSentence = "99_total/codex is not the authoritative Codex runtime package. Use v35/codex for Codex runtime execution.";
const nonMirrorDocumented = ["README.md", "PROMPT_USER_GUIDE.md", "docs/V35_ARTIFACT_MAP.md"].every((rel) => {
  const abs = path.join(root, rel);
  return fs.existsSync(abs) && readUtf8(abs).includes(nonMirrorSentence);
});
check("codex_to_99_total_codex_parity_or_documented_non_mirror", codexParityPass === codexToTotalPairs.length || nonMirrorDocumented, `mirror=${codexParityPass}/${codexToTotalPairs.length}; documented_non_mirror=${nonMirrorDocumented}`);

const currentStablePath = path.join(workspaceRoot, "CURRENT_STABLE_VERSION.txt");
const releaseIndexPath = path.join(workspaceRoot, "RELEASE_INDEX.md");
const releaseHistoryPath = path.join(workspaceRoot, "records", "release_history.json");
const currentStableText = fs.existsSync(currentStablePath) ? readUtf8(currentStablePath) : "";
const releaseIndexText = fs.existsSync(releaseIndexPath) ? readUtf8(releaseIndexPath) : "";
let releaseHistory = null;
try { releaseHistory = readJson(releaseHistoryPath); check("release_history_json_parse", true, "records/release_history.json"); }
catch (error) { check("release_history_json_parse", false, String(error)); }
check("current_stable_pointer_is_v35", /^current_stable_version=v35$/m.test(currentStableText), "CURRENT_STABLE_VERSION.txt");
check("release_index_current_stable_is_v35", /current_stable_version:\s*v35/.test(releaseIndexText), "RELEASE_INDEX.md");
check("release_history_current_stable_is_v35", releaseHistory?.current_stable_version === "v35", "records/release_history.json");
check("no_broken_phase5_active_pointer", !/v35[\\/]reports[\\/]PHASE5_V35_CANDIDATE_RELEASE_DECISION\.md/.test(currentStableText + "\n" + releaseIndexText + "\n" + JSON.stringify(releaseHistory ?? {})), "no active missing Phase 5 report pointer");
check("no_candidate_current_stable_pointer", !/current_stable[^\n\r]*v35_candidate/i.test(currentStableText + "\n" + releaseIndexText + "\n" + JSON.stringify(releaseHistory ?? {})), "v35_candidate must not be current stable");
for (const rel of requiredRootPointerPaths) {
  check(`root_pointer_path_exists:${rel}`, fs.existsSync(workspacePath(rel)), rel);
}
const currentStablePaths = currentStableText.split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^[a-z_]+=/.test(line))
  .map((line) => line.split("=").slice(1).join("=").trim())
  .filter((value) => /[\\/]/.test(value));
for (const rel of currentStablePaths) {
  check(`current_stable_file_path_exists:${rel}`, fs.existsSync(workspacePath(rel)), rel);
}
if (releaseHistory) {
  const pathKeys = ["current_stable_path", "release_manifest", "release_notes", "current_state", "validation_summary", "rollback_and_monitoring", "release_integrity_closure", "evidence_archive", "path"];
  function walk(value, key = "") {
    if (Array.isArray(value)) value.forEach((item) => walk(item, key));
    else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walk(v, k));
    else if (typeof value === "string" && pathKeys.includes(key)) {
      check(`release_history_path_exists:${key}:${value}`, fs.existsSync(workspacePath(value)), value);
    }
  }
  walk(releaseHistory);
}

const archiveManifest = path.join(archive, "archive_manifest.json");
const archiveChecksumsPath = path.join(archive, "archive_checksums.json");
check("archive_exists", fs.existsSync(archive), archive);
check("archive_manifest_exists", fs.existsSync(archiveManifest), "archive_manifest.json");
check("archive_checksums_exists", fs.existsSync(archiveChecksumsPath), "archive_checksums.json");
try {
  const archiveChecksums = readJson(archiveChecksumsPath);
  const listed = archiveChecksums.files ?? [];
  const mismatches = [];
  for (const item of listed) {
    const abs = workspacePath(item.path);
    if (!fs.existsSync(abs)) mismatches.push({ path: item.path, reason: "missing" });
    else if (sha256(abs) !== item.checksum) mismatches.push({ path: item.path, reason: "checksum_mismatch" });
  }
  const actualArchive = listFiles(archive)
    .map((abs) => relFromWorkspace(abs))
    .filter((rel) => rel !== `${archiveRel}/archive_checksums.json`);
  const listedSet = new Set(listed.map((item) => slash(item.path)));
  const missingListed = actualArchive.filter((rel) => !listedSet.has(rel));
  check("archive_checksum_records_match", mismatches.length === 0, `mismatches=${mismatches.length}`);
  check("archive_checksum_file_count_matches_current_archive", listed.length === actualArchive.length && missingListed.length === 0, `listed=${listed.length}; actual=${actualArchive.length}; unlisted=${missingListed.length}`);
} catch (error) {
  check("archive_checksum_parse_and_validate", false, String(error));
}

try {
  const activeChecksums = readJson(path.join(root, "records", "v35_file_checksums.json"));
  const listed = activeChecksums.files ?? [];
  const mismatches = [];
  for (const item of listed) {
    const abs = workspacePath(item.path);
    if (!fs.existsSync(abs)) mismatches.push({ path: item.path, reason: "missing" });
    else if (sha256(abs) !== item.checksum) mismatches.push({ path: item.path, reason: "checksum_mismatch" });
  }
  const actualActive = listFiles(root)
    .map((abs) => relFromWorkspace(abs))
    .filter((rel) => !shouldExcludeActive(rel));
  const listedSet = new Set(listed.map((item) => slash(item.path)));
  const unlisted = actualActive.filter((rel) => !listedSet.has(rel));
  const listedMutableValidation = listed.filter((item) => slash(item.path) === "v35/validation/current_validation_result.json" || slash(item.path).startsWith("v35/validation/runs/"));
  check("active_checksum_records_match", mismatches.length === 0, `mismatches=${mismatches.length}`);
  check("active_checksum_file_count_matches_current_v35", listed.length === actualActive.length && unlisted.length === 0, `listed=${listed.length}; actual=${actualActive.length}; unlisted=${unlisted.length}`);
  check("mutable_validation_outputs_excluded_from_immutable_checksum", listedMutableValidation.length === 0, `mutable_entries=${listedMutableValidation.length}`);
  check("validation_checksum_drift", mismatches.length === 0 && listedMutableValidation.length === 0, "current_validation_result and validation/runs are excluded");
} catch (error) {
  check("active_checksum_parse_and_validate", false, String(error));
}

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);
const result = {
  validation_name: "current_v35_validation",
  generated_at: new Date().toISOString(),
  root_path: root,
  workspace_root: workspaceRoot,
  archive_path: archive,
  total_checks: checks.length,
  passed_checks: passed,
  failed_checks: failed.length,
  status: failed.length === 0 ? "pass" : "fail",
  integrity_summary: {
    source_to_99_total_parity: `${sourceParityPass}/${sourceToTotalPairs.length}`,
    source_to_99_total_stable_patch_marker: `${sourceStablePatchPass}/${sourceToTotalPairs.length}`,
    codex_to_99_total_codex_parity: `${codexParityPass}/${codexToTotalPairs.length}`,
    codex_non_mirror_documented: nonMirrorDocumented
  },
  checks
};

fs.mkdirSync(path.dirname(resultPath), { recursive: true });
fs.mkdirSync(runsDir, { recursive: true });
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
const runStamp = result.generated_at.replace(/[:.]/g, "-");
fs.writeFileSync(path.join(runsDir, `${runStamp}.json`), JSON.stringify(result, null, 2) + "\n", "utf8");

if (failed.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
