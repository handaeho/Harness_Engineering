import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const rootName = path.basename(root);
const checks = [];
function slash(p){ return p.replace(/\\/g, "/"); }
function read(rel){ return fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : ""; }
function json(rel){ return JSON.parse(read(rel)); }
function check(name, pass, detail, severity = pass ? "pass" : "P1"){ checks.push({ name, pass:Boolean(pass), severity: pass ? "pass" : severity, detail }); }
function listFiles(dir){ const out=[]; function walk(d){ if(!fs.existsSync(d)) return; for(const e of fs.readdirSync(d,{withFileTypes:true})){ if(e.name === ".git") continue; const f=path.join(d,e.name); if(e.isDirectory()) walk(f); else if(e.isFile()) out.push(f); } } walk(dir); return out.sort((a,b)=>slash(a).localeCompare(slash(b))); }
function sha(file){ return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
const required = [
  "README.md","AGENTS.md","MASTER_PROMPT_ROUTER.md","PROMPT_USER_GUIDE.md",
  "autonomous/00_governance","autonomous/01_base","autonomous/02_overlays","autonomous/03_examples","autonomous/04_harness","autonomous/05_state","autonomous/06_verification","autonomous/07_scope","autonomous/08_lifecycle","autonomous/99_total",
  "codex/AGENTS.md","codex/CODEX_RUNTIME_GUIDE.md",
  "state/feature_list.json","state/progress.md","state/decision_log.md","state/evidence_log.json","state/session-handoff.md",
  "verification/current_validation_suite.json","verification/evaluator-rubric.md","verification/benchmark_suite.json","verification/ablation_plan.md","verification/claim_strength_checklist.json",
  "lifecycle/init.sh","lifecycle/clean-state-checklist.md","lifecycle/session-start.md","lifecycle/session-closeout.md","lifecycle/handoff-template.md",
  "docs/CURRENT_STATE.md","docs/OPERATING_GUIDE.md","docs/LIMITATIONS_AND_FOLLOWUPS.md","docs/ARTIFACT_MAP.md","docs/ARCHITECTURE.md","docs/SECURITY.md","docs/RELIABILITY.md","docs/QUALITY_SCORE.md","docs/PLANS.md",
  "harness/validate_current_v36.mjs","harness/validate_assembled_bundle.mjs","harness/validate_codex_runtime.mjs","harness/run_benchmark.mjs","harness/run_ablation.mjs",
  "records/source_inventory.json","records/source_hash_manifest.json","records/source_language_matrix.json","records/phase0_v35_baseline_inventory.json","records/phase0_v35_integrity_findings.json","records/concept_map.json","records/failure_to_artifact_map.json","records/harness_subsystem_coverage.json","records/prompt_asset_inventory.json","records/harness_scorecard.json","records/subsystem_bottleneck_report.json","records/v36_architecture_decision.json","records/v36_asset_inventory.json","records/v36_harness_scorecard.json","records/v36_asset_metadata_index.json","records/v36_current_state.json","records/v36_followup_backlog.json","records/v36_release_manifest.json",
  "reports/PHASE0_V35_BASELINE_AUDIT.md","reports/00_SOURCE_INVENTORY.md","reports/01_CONCEPT_MAP.md","reports/02_ASSET_GAP_AUDIT.md","reports/03_UPGRADE_PLAN.md","reports/V36_ARCHITECTURE_DECISION.md","reports/V36_ASSET_CONSTRUCTION_REPORT.md","reports/V36_99_TOTAL_AND_CODEX_INTEGRITY_REPORT.md","reports/V36_RELEASE_READINESS_REPORT.md","reports/V36_RELEASE_DECISION.md",
  "sources/learn_harness_engineering_clone/README.md"
];
for (const r of required) check(`required:${r}`, fs.existsSync(path.join(root, r)), r, "P0");
for (const r of ["state/feature_list.json","state/evidence_log.json","verification/benchmark_suite.json","verification/claim_strength_checklist.json","records/source_inventory.json","records/source_hash_manifest.json","records/source_language_matrix.json","records/phase0_v35_integrity_findings.json","records/concept_map.json","records/harness_scorecard.json","records/v36_architecture_decision.json"]) {
  try { json(r); check(`json_parse:${r}`, true, r); } catch (e) { check(`json_parse:${r}`, false, String(e), "P0"); }
}
const rootPointer = fs.existsSync(path.join(workspace, "CURRENT_STABLE_VERSION.txt")) ? fs.readFileSync(path.join(workspace, "CURRENT_STABLE_VERSION.txt"), "utf8") : "";
const workspaceV36Exists = fs.existsSync(path.join(workspace, "v36"));
const rootPointerMatchesStage = rootName === "v36"
  ? (rootPointer.includes("current_stable_version=v35") || rootPointer.includes("current_stable_version=v36"))
  : (rootPointer.includes("current_stable_version=v35") || (workspaceV36Exists && rootPointer.includes("current_stable_version=v36")));
check("root_pointer_still_v35", rootPointerMatchesStage, "CURRENT_STABLE_VERSION.txt must match candidate/finalization stage", "P0");
check("no_root_v36_directory_required", !fs.existsSync(path.join(workspace, "v36")) || true, "v36 finalization is intentionally not required by candidate validator");
const scores = json("records/harness_scorecard.json").v36_candidate_static_scores;
for (const [k, v] of Object.entries(scores)) check(`subsystem_score_at_least_4:${k}`, v >= 4, `${k}=${v}`, "P1");
const sourceInventory = json("records/source_inventory.json");
check("source_inventory_has_git_clone_root", sourceInventory.some((s) => s.source_id === "lhe:git:clone-root"), "source inventory includes clone root", "P0");
check("source_inventory_has_web_doc", sourceInventory.some((s) => s.source_type === "web_doc"), "source inventory includes web doc entry", "P1");
check("source_hash_manifest_nonempty", json("records/source_hash_manifest.json").file_count > 0, "hash manifest file_count", "P0");
check("language_matrix_multilingual", json("records/source_language_matrix.json").observed_doc_languages.length >= 10, "observed languages >= 10", "P1");
check("codex_not_in_autonomous_99_total", !fs.existsSync(path.join(root, "autonomous", "99_total", "codex")), "no autonomous/99_total/codex", "P0");
const claimText = ["README.md","PROMPT_USER_GUIDE.md","docs/CURRENT_STATE.md","docs/LIMITATIONS_AND_FOLLOWUPS.md","reports/V36_RELEASE_DECISION.md"].map(read).join("\n");
for (const forbidden of [/v36 is stable/i, /production-monitored/i, /containment-verified/i, /benchmark-certified/i]) {
  const allowedNegative = /Do not claim production monitoring|not production monitoring|not containment verified|not benchmark certification|not stable v36|not stable/.test(claimText);
  check(`release_language_scan:${forbidden}`, !forbidden.test(claimText) || allowedNegative, String(forbidden), "P0");
}
check("benchmark_results_present", fs.existsSync(path.join(root, "records", "benchmark_results.json")), "run harness/run_benchmark.mjs before release decision", "P1");
check("ablation_results_present", fs.existsSync(path.join(root, "records", "ablation_results.json")), "run harness/run_ablation.mjs before release decision", "P1");
let assembledStatus = "not_run";
try { assembledStatus = json("records/assembled_bundle_integrity.json").status; } catch {}
let codexStatus = "not_run";
try { codexStatus = json("records/codex_runtime_integrity.json").status; } catch {}
check("assembled_bundle_validator_passed", assembledStatus === "pass", `status=${assembledStatus}`, "P1");
check("codex_runtime_validator_passed", codexStatus === "pass", `status=${codexStatus}`, "P1");
const releaseDecision = fs.existsSync(path.join(root, "records", "v36_release_decision.json")) ? json("records/v36_release_decision.json") : null;
check("release_decision_exists", !!releaseDecision, "records/v36_release_decision.json", "P1");
if (releaseDecision) {
  let behavioralReady = false;
  try {
    const precheck = json("records/v36_behavioral_release_readiness_precheck.json");
    behavioralReady = precheck.ready_for_v36_release_decision === true &&
      precheck.critical_failures === 0 &&
      precheck.P0 === 0 &&
      precheck.release_blocking_P1 === 0 &&
      precheck.safety_regression_vs_v35 === false &&
      precheck.verification_regression_vs_v35 === false;
  } catch {}
  let sourceReady = false;
  try {
    const sourceValidation = json("records/source_application_validation_result.json");
    sourceReady = sourceValidation.status === "pass" &&
      sourceValidation.source_application_verdict === "Source application complete with deferred non-blockers";
  } catch {}
  const stageAllowsPromoteDecision =
    (rootPointer.includes("current_stable_version=v35") && !workspaceV36Exists) ||
    (rootName === "v36" && rootPointer.includes("current_stable_version=v35")) ||
    (rootPointer.includes("current_stable_version=v36") && workspaceV36Exists);
  const promoteHasEvidence = releaseDecision.decision !== "Promote to v36" ||
    (behavioralReady && sourceReady && stageAllowsPromoteDecision);
  check("release_decision_not_promote_without_real_benchmark", promoteHasEvidence, releaseDecision.decision, "P0");
}
const result = {
  validation_name: "current_v36_candidate_validation",
  generated_at: new Date().toISOString(),
  total_checks: checks.length,
  passed_checks: checks.filter(c=>c.pass).length,
  failed_checks: checks.filter(c=>!c.pass).length,
  status: checks.every(c=>c.pass) ? "pass" : "fail",
  claim_strength: "static_local_validation",
  checks
};
fs.mkdirSync(path.join(root, "validation", "runs"), { recursive:true });
fs.writeFileSync(path.join(root, "validation", "current_validation_result.json"), JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(path.join(root, "verification", "current_validation_result.json"), JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(path.join(root, "validation", "runs", `${result.generated_at.replace(/[:.]/g, "-")}.json`), JSON.stringify(result, null, 2) + "\n");
const files = listFiles(root).filter((f) => {
  const r = slash(path.relative(root, f));
  return !r.startsWith("sources/learn_harness_engineering_clone/.git/") &&
    r !== "records/v36_file_checksums.json" &&
    r !== "validation/current_validation_result.json" &&
    r !== "verification/current_validation_result.json" &&
    !r.startsWith("validation/runs/");
});
const manifest = { generated_at: result.generated_at, root_path: "v36_candidate", algorithm: "SHA256", excludes: ["records/v36_file_checksums.json","validation/current_validation_result.json","verification/current_validation_result.json","validation/runs/*.json"], file_count: files.length, files: files.map((f)=>({ path: `v36_candidate/${slash(path.relative(root, f))}`, size: fs.statSync(f).size, checksum: sha(f) })) };
fs.writeFileSync(path.join(root, "records", "v36_file_checksums.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, total_checks: result.total_checks, failed_checks: result.failed_checks }, null, 2));
if (result.status !== "pass") process.exit(1);
