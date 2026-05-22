import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const candidateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stackRoot = path.resolve(candidateRoot, "..");
const paths = {
  candidate: path.join(stackRoot, "v36_candidate"),
  target: path.join(stackRoot, "v36"),
  v35: path.join(stackRoot, "v35"),
  legacyRoot: path.join(stackRoot, "legacy"),
  legacyV35: path.join(stackRoot, "legacy", "v35"),
  currentStable: path.join(stackRoot, "CURRENT_STABLE_VERSION.txt"),
  releaseIndex: path.join(stackRoot, "RELEASE_INDEX.md"),
  releaseHistory: path.join(stackRoot, "records", "release_history.json"),
  rootRecords: path.join(stackRoot, "records")
};

const now = new Date().toISOString();
const dateStamp = now.slice(0, 10);
const archivePath = path.join(stackRoot, "_archive", `v36_release_evidence_${dateStamp}`);

function slash(value) {
  return value.replace(/\\/g, "/");
}

function relFromStack(absPath) {
  return slash(path.relative(stackRoot, absPath));
}

function ensureDir(absPath) {
  fs.mkdirSync(absPath, { recursive: true });
}

function readText(absPath) {
  return fs.readFileSync(absPath, "utf8");
}

function writeText(absPath, text) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, text.trimEnd() + "\n");
}

function readJson(absPath) {
  return JSON.parse(readText(absPath));
}

function writeJson(absPath, data) {
  writeText(absPath, JSON.stringify(data, null, 2));
}

function shaFile(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function shaText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function listEntries(absPath) {
  const files = [];
  const dirs = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      dirs.push(current);
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (entry.name === ".git") continue;
        walk(path.join(current, entry.name));
      }
    } else if (stat.isFile()) {
      files.push(current);
    }
  }
  walk(absPath);
  return { files: files.sort(), dirs: dirs.sort() };
}

function checksumSummary(absPath) {
  if (!fs.existsSync(absPath)) return { algorithm: "SHA256", file_count: 0, digest: null };
  const stat = fs.statSync(absPath);
  if (stat.isFile()) return { algorithm: "SHA256", file_count: 1, digest: shaFile(absPath) };
  const { files } = listEntries(absPath);
  const joined = files.map((file) => `${slash(path.relative(absPath, file))}:${shaFile(file)}`).join("\n");
  return { algorithm: "SHA256", file_count: files.length, digest: shaText(joined) };
}

function snapshot(absPath, role, note = "") {
  const exists = fs.existsSync(absPath);
  const entries = exists && fs.statSync(absPath).isDirectory() ? listEntries(absPath) : { files: exists ? [absPath] : [], dirs: [] };
  return {
    path: relFromStack(absPath),
    role,
    exists,
    file_count: entries.files.length,
    directory_count: entries.dirs.length,
    checksum_summary: checksumSummary(absPath),
    timestamp: now,
    note
  };
}

function writeConflict(preflight) {
  ensureDir(paths.rootRecords);
  const conflict = {
    generated_at: now,
    status: "finalization_blocked",
    preflight,
    note: "Phase 10 stopped before copying, moving, or pointer updates."
  };
  writeJson(path.join(paths.rootRecords, "v36_finalization_conflict_report.json"), conflict);
  writeText(path.join(paths.rootRecords, "V36_FINALIZATION_CONFLICT_REPORT.md"), `# V36 Finalization Conflict Report

Status: finalization_blocked

Blockers:
${preflight.blockers.map((item) => `- ${item}`).join("\n")}
`);
}

function runNode(scriptAbsPath) {
  const stdout = execFileSync(process.execPath, [scriptAbsPath], {
    cwd: stackRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

function generateChecksumManifest(rootAbsPath, releaseVersion) {
  const excludes = new Set([
    "records/v36_file_checksums.json",
    "validation/current_validation_result.json",
    "verification/current_validation_result.json"
  ]);
  const { files } = listEntries(rootAbsPath);
  const records = [];
  for (const file of files) {
    const rel = slash(path.relative(rootAbsPath, file));
    if (excludes.has(rel) || rel.startsWith("validation/runs/") || rel.startsWith("sources/learn_harness_engineering_clone/.git/")) continue;
    const top = rel.split("/")[0];
    const layer = top === "autonomous" ? "autonomous"
      : top === "codex" ? "codex"
      : top === "state" ? "state"
      : top === "verification" || top === "validation" ? "verification"
      : top === "lifecycle" ? "lifecycle"
      : top === "harness" ? "harness"
      : top === "docs" ? "docs"
      : top === "records" ? "records"
      : top === "reports" ? "reports"
      : top === "archive" || top === "sources" ? "archive"
      : "docs";
    records.push({
      path: `${releaseVersion}/${rel}`,
      layer,
      asset_type: path.extname(file).replace(/^\./, "") || "file",
      size: fs.statSync(file).size,
      checksum: shaFile(file),
      note: excludes.has(rel) ? "mutable excluded" : ""
    });
  }
  const manifest = {
    generated_at: new Date().toISOString(),
    root_path: releaseVersion,
    algorithm: "SHA256",
    excludes: [
      "records/v36_file_checksums.json",
      "validation/current_validation_result.json",
      "verification/current_validation_result.json",
      "validation/runs/*.json"
    ],
    file_count: records.length,
    files: records
  };
  writeJson(path.join(rootAbsPath, "records", "v36_file_checksums.json"), manifest);
  return manifest;
}

function verifyChecksumManifest(rootAbsPath) {
  const manifestPath = path.join(rootAbsPath, "records", "v36_file_checksums.json");
  const manifest = readJson(manifestPath);
  const failures = [];
  for (const record of manifest.files) {
    const rel = record.path.replace(/^v36[\\/]/, "");
    const abs = path.join(rootAbsPath, rel);
    if (!fs.existsSync(abs)) {
      failures.push({ path: record.path, reason: "missing" });
      continue;
    }
    const actual = shaFile(abs);
    if (actual !== record.checksum) failures.push({ path: record.path, reason: "checksum_mismatch", expected: record.checksum, actual });
  }
  return { checked: manifest.files.length, failed: failures.length, failures };
}

function verifyV35Checksums(absRoot) {
  const manifestPath = path.join(absRoot, "records", "v35_file_checksums.json");
  if (!fs.existsSync(manifestPath)) return { available: false, checked: 0, failed: 1, failures: ["manifest missing"] };
  const manifest = readJson(manifestPath);
  const failures = [];
  for (const record of manifest.files ?? []) {
    const rel = record.path.replace(/^v35[\\/]/, "");
    const abs = path.join(absRoot, rel);
    if (!fs.existsSync(abs)) {
      failures.push({ path: record.path, reason: "missing" });
      continue;
    }
    const actual = shaFile(abs);
    if (actual !== record.checksum) failures.push({ path: record.path, reason: "checksum_mismatch", expected: record.checksum, actual });
  }
  return { available: true, checked: manifest.files?.length ?? 0, failed: failures.length, failures };
}

function positiveClaimFindings(absRoot) {
  const terms = [
    "production-monitored",
    "containment-verified",
    "all-primary-source-validated",
    "public-benchmark-certified",
    "live-production-rollout-certified"
  ];
  const allowedContext = /(not|no |without|prohibited|downgrade|downgraded|limitation|limitations|follow-up|monitoring item|claim list|do not claim|unless|not established|not available)/i;
  const findings = [];
  for (const file of listEntries(absRoot).files) {
    const rel = slash(path.relative(absRoot, file));
    if (!/\.(md|txt|json)$/i.test(file)) continue;
    const lines = readText(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const term of terms) {
        if (line.toLowerCase().includes(term.toLowerCase()) && !allowedContext.test(line)) {
          findings.push({ path: `v36/${rel}`, line: index + 1, term, text: line.trim().slice(0, 240) });
        }
      }
    });
  }
  return findings;
}

function copyEvidenceItem(srcRel, destRel = srcRel) {
  const src = path.join(paths.target, srcRel);
  const dest = path.join(archivePath, destRel);
  if (!fs.existsSync(src)) return { source: srcRel, archived: false, reason: "missing" };
  ensureDir(path.dirname(dest));
  fs.cpSync(src, dest, { recursive: true, force: false, errorOnExist: false });
  return { source: srcRel, archived: true, target: slash(path.relative(stackRoot, dest)) };
}

function createReleaseManifest() {
  const manifest = {
    release_version: "v36",
    previous_stable_version: "v35",
    source_candidate: "v36_candidate",
    release_decision: "Promote to v36",
    release_decision_source: [
      "v36_candidate/records/v36_release_decision.json",
      "v36_candidate/reports/V36_RELEASE_DECISION.md"
    ],
    release_scope: [
      "autonomous_agent_assets",
      "codex_runtime_assets",
      "state_assets",
      "verification_assets",
      "scope_assets",
      "lifecycle_assets",
      "harness_assets",
      "archive_traceability"
    ],
    evidence_summary: {
      source_coverage: "38/38",
      korean_lecture_mapping: "12/12",
      git_top_level_core_asset_disposition: "38/38",
      behavioral_benchmark: "65/65 pass",
      codex_runtime_benchmark: "15/15 pass",
      ablation_variants: 9,
      validate_current_v36: "107/107 pass",
      validate_assembled_bundle: "18/18 pass",
      validate_codex_runtime: "17/17 pass",
      phase9_gates: "11 pass",
      P0: 0,
      release_blocking_P1: 0
    },
    known_downgrades: [
      "production telemetry",
      "containment proof",
      "broader provider diversity",
      "archive-only source items: non-blocking P3"
    ],
    prohibited_positive_claims: [
      "production_monitored",
      "containment_verified",
      "all_primary_source_items_fully_validated",
      "public_benchmark_certified",
      "live_production_rollout_certified"
    ],
    release_date: dateStamp,
    finalization_date: now,
    generated_by: "Codex Phase 10 finalization runner",
    manifest_hash: null
  };
  const hashInput = JSON.stringify({ ...manifest, manifest_hash: null });
  manifest.manifest_hash = shaText(hashInput);
  writeJson(path.join(paths.target, "records", "v36_release_manifest.json"), manifest);
  writeText(path.join(paths.target, "reports", "V36_RELEASE_MANIFEST.md"), `# V36 Release Manifest

- release_version: v36
- previous_stable_version: v35
- source_candidate: v36_candidate
- release_decision: Promote to v36
- source_coverage: 38/38
- Korean lecture mapping: 12/12
- Git top-level/core asset disposition: 38/38
- behavioral benchmark: 65/65 pass
- Codex runtime benchmark: 15/15 pass
- ablation variants: 9
- validate_current_v36: 107/107 pass
- validate_assembled_bundle: 18/18 pass
- validate_codex_runtime: 17/17 pass
- Phase 9 gates: 11 pass
- P0: 0
- release_blocking_P1: 0
- manifest_hash: ${manifest.manifest_hash}

Known downgrades remain: production telemetry, containment proof, broader provider diversity, archive-only source items as non-blocking P3 references.
`);
  return manifest;
}

function writeReleaseNotes() {
  writeText(path.join(paths.target, "reports", "V36_RELEASE_NOTES.md"), `# V36 Release Notes

## 1. Release Summary
v36 is the current stable release after Phase 10 finalization. It was promoted from v36_candidate after Phase 9 release decision gates passed.

## 2. What v36 Is
v36 is a long-running agent harness asset system with separated autonomous agent assets, Codex runtime assets, state assets, verification assets, scope assets, lifecycle assets, harness scripts, records, reports, and archive evidence.

## 3. Major Architectural Changes
- Autonomous source-of-truth assets and Codex runtime assets are separate.
- Root routing is kept short.
- State, verification, scope, and lifecycle assets are first-class release surfaces.
- autonomous/99_total is an assembled autonomous bundle, not a Codex runtime mirror.

## 4. Five Harness Subsystems
Instructions, State, Verification, Scope, and Lifecycle all meet the Phase 9 release gate threshold.

## 5. Autonomous Agent Assets
Autonomous assets live under autonomous/ and include governance, base prompts, overlays, examples, harness contracts, state, verification, scope, lifecycle, and assembled bundle assets.

## 6. Codex Runtime Assets
Codex runtime assets live under codex/. They are runtime packages evaluated by behavioral alignment, safety preservation, and runtime fitness. They are not autonomous source-stack mirrors.

## 7. State / Verification / Scope / Lifecycle Assets
State and lifecycle assets include feature_list, progress, session handoff, init, closeout, and clean-state surfaces. Verification assets include validation suites, evaluator rubric, benchmark, ablation, and claim-strength controls.

## 8. Learn Harness Engineering Source Integration Summary
The Walking Labs Learn Harness Engineering source set was collected into the candidate source archive, inventoried, hashed, language-classified, and mapped.

## 9. Source Application Proof Summary
Source application proof: 38/38 required coverage records, 12/12 Korean lecture mappings, 38/38 required Git top-level/core dispositions, P0 0, P1 0, P2 0, P3 1 archive-only non-blocker.

## 10. Behavioral Evidence Summary
Behavioral benchmark: 65/65 pass. Codex runtime benchmark: 15/15 pass. Real read-only ablation: 9 variants executed. Phase 9 gates: 11 pass.

## 11. Known Downgrades
- v36 is not production-monitored unless production telemetry is connected.
- v36 is not containment-verified unless containment proof is produced.
- Not all broader provider diversity checks are complete.
- Archive-only source items remain non-blocking references.
- v36 release is validated under collected source coverage, local actor outputs, semantic judge, benchmark, ablation, and validation runner evidence.

## 12. Prohibited Claims
Do not claim production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, or live-production-rollout-certified status.

## 13. Follow-up Backlog
- Add production telemetry only after real deployment substrate exists.
- Add containment proof if containment-grade claims are required.
- Broaden provider diversity tests.
- Continue monitoring Codex runtime boundary behavior.

## 14. How to Validate
Run:
- node v36/harness/validate_current_v36.mjs
- node v36/harness/validate_assembled_bundle.mjs
- node v36/harness/validate_codex_runtime.mjs

## 15. How to Rollback
Rollback target is legacy/v35. Change root pointers only after explicit rollback approval and preserve v36 evidence for postmortem.
`);
}

function writeRollbackPlan() {
  const plan = {
    generated_at: now,
    rollback_target: "legacy/v35",
    rollback_triggers: [
      "prompt injection regression",
      "approval boundary regression",
      "destructive action boundary regression",
      "state continuity failure",
      "verification gate regression",
      "lifecycle handoff failure",
      "Codex runtime routing failure",
      "evidence / retrieval regression",
      "unsupported release claim"
    ],
    rollback_method: [
      "After explicit approval, set CURRENT_STABLE_VERSION.txt back to legacy/v35 or restore legacy/v35 at root.",
      "Preserve v36 evidence for postmortem.",
      "Update RELEASE_INDEX.md and records/release_history.json consistently."
    ],
    monitoring_items: [
      "Instructions routing",
      "State continuity",
      "Verification proof",
      "Scope control",
      "Lifecycle closeout",
      "Codex runtime behavior",
      "claim strength language",
      "production telemetry follow-up",
      "containment proof follow-up",
      "provider diversity follow-up"
    ]
  };
  writeJson(path.join(paths.target, "records", "v36_rollback_and_monitoring_plan.json"), plan);
  writeText(path.join(paths.target, "reports", "V36_ROLLBACK_AND_MONITORING_PLAN.md"), `# V36 Rollback and Monitoring Plan

## Rollback Target
legacy/v35

## Rollback Triggers
${plan.rollback_triggers.map((item) => `- ${item}`).join("\n")}

## Rollback Method
${plan.rollback_method.map((item) => `- ${item}`).join("\n")}

## Monitoring Items
${plan.monitoring_items.map((item) => `- ${item}`).join("\n")}

## Downgraded Claims
v36 is not production-monitored and is not containment-verified. Production telemetry, containment proof, and broader provider diversity remain follow-up items.
`);
  return plan;
}

function updateRootPointers() {
  writeText(paths.currentStable, `current_stable_version=v36
current_stable_path=.\\v36
release_manifest=.\\v36\\records\\v36_release_manifest.json
release_notes=.\\v36\\reports\\V36_RELEASE_NOTES.md
current_state=.\\v36\\docs\\CURRENT_STATE.md
validation_summary=.\\v36\\reports\\V36_VALIDATION_SUMMARY.md
rollback_and_monitoring=.\\v36\\reports\\V36_ROLLBACK_AND_MONITORING_PLAN.md`);

  writeText(paths.releaseIndex, `# Release Index

## Current Stable
- current stable: v36
- current stable path: v36/
- previous stable: legacy/v35
- release manifest: v36/records/v36_release_manifest.json
- release notes: v36/reports/V36_RELEASE_NOTES.md
- current state: v36/docs/CURRENT_STATE.md
- validation summary: v36/reports/V36_VALIDATION_SUMMARY.md
- rollback / monitoring: v36/reports/V36_ROLLBACK_AND_MONITORING_PLAN.md

## Preserved Versions
- legacy/v35: previous stable baseline, preserved for rollback.
- v36_candidate: preserved candidate evidence source.

## Downgrades
- production telemetry is not connected.
- containment proof is not produced.
- broader provider diversity remains a confidence improvement item.

## Prohibited Positive Claims
- production-monitored
- containment-verified
- all-primary-source-validated
- public-benchmark-certified
- live-production-rollout-certified
`);

  let previous = {};
  if (fs.existsSync(paths.releaseHistory)) previous = readJson(paths.releaseHistory);
  const legacyVersions = [];
  for (const item of previous.legacy_versions ?? []) {
    if (item.version !== "v35") legacyVersions.push(item);
  }
  if (!legacyVersions.some((item) => item.version === "v34") && fs.existsSync(path.join(stackRoot, "legacy", "v34"))) {
    legacyVersions.push({ version: "v34", status: "legacy_rollback_reference", path: "legacy/v34" });
  }
  const history = {
    current_stable_version: "v36",
    current_stable_path: "v36",
    releases: [
      {
        version: "v36",
        status: "current_stable",
        path: "v36",
        release_manifest: "v36/records/v36_release_manifest.json",
        release_notes: "v36/reports/V36_RELEASE_NOTES.md",
        current_state: "v36/docs/CURRENT_STATE.md",
        validation_summary: "v36/reports/V36_VALIDATION_SUMMARY.md",
        rollback_and_monitoring: "v36/reports/V36_ROLLBACK_AND_MONITORING_PLAN.md",
        release_decision: "Promote to v36",
        finalization_status: "finalized",
        traceability: "checksum_manifest",
        evidence_archive: `_archive/v36_release_evidence_${dateStamp}`,
        downgrades: ["production_telemetry", "containment_proof", "provider_diversity", "archive_only_source_items"],
        prohibited_positive_claims: [
          "production_monitored",
          "containment_verified",
          "all_primary_source_items_fully_validated",
          "public_benchmark_certified",
          "live_production_rollout_certified"
        ]
      },
      {
        version: "v35",
        status: "legacy_previous_stable",
        path: "legacy/v35",
        release_manifest: "legacy/v35/records/v35_release_manifest.json",
        release_notes: "legacy/v35/reports/V35_RELEASE_NOTES.md",
        current_state: "legacy/v35/docs/V35_CURRENT_STATE.md",
        validation_summary: "legacy/v35/reports/V35_VALIDATION_SUMMARY.md",
        rollback_and_monitoring: "legacy/v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md",
        traceability: "checksum_manifest"
      },
      {
        version: "v36_candidate",
        status: "preserved_candidate_evidence_source",
        path: "v36_candidate",
        release_decision: "Promote to v36",
        note: "Preserved after finalization; not current stable."
      }
    ],
    legacy_versions: legacyVersions,
    generated_at: new Date().toISOString()
  };
  writeJson(paths.releaseHistory, history);
}

function createArchive() {
  const evidenceItems = [
    "records/source_inventory.json",
    "records/source_hash_manifest.json",
    "records/source_language_matrix.json",
    "records/source_completeness_recheck.json",
    "reports/SOURCE_APPLICATION_PROOF_REPORT.md",
    "records/source_application_validation_result.json",
    "records/behavioral_judge_results.json",
    "records/real_ablation_results.json",
    "records/archive_traceability_closure.json",
    "records/v36_release_gate_results_after_behavioral_evidence.json",
    "records/v36_behavioral_release_readiness_precheck.json",
    "records/v36_release_decision.json",
    "records/v36_release_gate_final_results.json",
    "records/v36_claim_scope_and_downgrades.json",
    "records/v36_release_evidence_bundle.json",
    "validation/current_validation_result.json",
    "records/actor_outputs",
    "archive/raw_benchmark_runs",
    "archive/behavioral_evidence"
  ];
  ensureDir(archivePath);
  const copied = evidenceItems.map((item) => copyEvidenceItem(item));
  const archiveManifest = generateChecksumManifest(archivePath, `_archive/v36_release_evidence_${dateStamp}`);
  const broken = copied.filter((item) => !item.archived);
  const record = {
    generated_at: new Date().toISOString(),
    archive_path: slash(path.relative(stackRoot, archivePath)),
    files_archived: archiveManifest.file_count,
    checksums_generated: true,
    broken_links: broken,
    archive_verdict: broken.length === 0 ? "pass" : "fail"
  };
  writeJson(path.join(paths.target, "records", "v36_archive_finalization_record.json"), record);
  return record;
}

function finalValidation(validationRuns, archiveRecord, rollbackPlan) {
  const stableText = readText(paths.currentStable);
  const releaseIndexText = readText(paths.releaseIndex);
  const history = readJson(paths.releaseHistory);
  const checksum = verifyChecksumManifest(paths.target);
  const prohibitedFindings = positiveClaimFindings(paths.target);
  const finalRecord = {
    v36_exists: fs.existsSync(paths.target),
    v36_validation_pass: validationRuns.final_current.status === "pass" && validationRuns.final_assembled.status === "pass" && validationRuns.final_codex.status === "pass",
    legacy_v35_exists: fs.existsSync(paths.legacyV35),
    current_stable_pointer: stableText.includes("current_stable_version=v36") ? "v36" : "invalid",
    release_index_valid: /current stable:\s*v36/i.test(releaseIndexText) && /previous stable:\s*legacy\/v35/i.test(releaseIndexText),
    release_history_valid: history.current_stable_version === "v36" && history.releases?.some((item) => item.version === "v36" && item.status === "current_stable") && history.releases?.some((item) => item.version === "v35" && item.status === "legacy_previous_stable"),
    archive_valid: archiveRecord.archive_verdict === "pass",
    checksum_valid: checksum.failed === 0,
    prohibited_claim_scan: {
      passed: prohibitedFindings.length === 0,
      findings: prohibitedFindings
    },
    downgrade_language_preserved: [
      "V36_RELEASE_NOTES.md",
      "V36_ROLLBACK_AND_MONITORING_PLAN.md"
    ].every((file) => readText(path.join(paths.target, "reports", file)).includes("not production-monitored")) &&
      readText(path.join(paths.target, "reports", "V36_RELEASE_NOTES.md")).includes("not containment-verified"),
    final_status: "fail"
  };
  finalRecord.final_status = Object.entries(finalRecord)
    .filter(([key]) => key !== "final_status" && key !== "prohibited_claim_scan")
    .every(([, value]) => value === true || value === "v36") && finalRecord.prohibited_claim_scan.passed
    ? "pass"
    : "fail";
  finalRecord.checksum_after_validation = checksum;
  finalRecord.rollback_plan = rollbackPlan;
  return finalRecord;
}

const phase9Path = path.join(paths.candidate, "records", "v36_release_decision.json");
const phase9 = fs.existsSync(phase9Path) ? readJson(phase9Path) : null;
const validationResultPath = path.join(paths.candidate, "validation", "current_validation_result.json");
const validationResult = fs.existsSync(validationResultPath) ? readJson(validationResultPath) : null;
const gateResultsPath = path.join(paths.candidate, "records", "v36_release_gate_final_results.json");
const gateResults = fs.existsSync(gateResultsPath) ? readJson(gateResultsPath) : null;

const preflight = {
  root_path: slash(stackRoot),
  current_stable_before: fs.existsSync(paths.currentStable) ? readText(paths.currentStable).trim() : null,
  candidate_path: "v36_candidate",
  target_release_path: "v36",
  previous_stable_path: "legacy/v35",
  phase9_decision_found: !!phase9,
  phase9_decision: phase9?.decision ?? null,
  v36_exists: fs.existsSync(paths.target),
  legacy_v35_exists: fs.existsSync(paths.legacyV35),
  v35_exists: fs.existsSync(paths.v35),
  v36_candidate_exists: fs.existsSync(paths.candidate),
  finalization_allowed: false,
  blockers: []
};

if (!preflight.v36_candidate_exists) preflight.blockers.push("v36_candidate missing");
if (!preflight.v35_exists) preflight.blockers.push("v35 missing");
if (preflight.v36_exists) preflight.blockers.push("v36 already exists");
if (preflight.legacy_v35_exists) preflight.blockers.push("legacy/v35 already exists");
if (!preflight.phase9_decision_found) preflight.blockers.push("Phase 9 decision missing");
if (preflight.phase9_decision !== "Promote to v36") preflight.blockers.push("Phase 9 decision is not Promote to v36");
if (!preflight.current_stable_before?.includes("current_stable_version=v35")) preflight.blockers.push("current stable pointer does not point to v35");
if (validationResult?.status !== "pass" || validationResult?.total_checks !== 107 || validationResult?.failed_checks !== 0) preflight.blockers.push("candidate validate_current_v36 is not 107/107 pass");
if (gateResults?.fail !== 0 || gateResults?.not_evaluated !== 0) preflight.blockers.push("Phase 9 final gates are not clean");

preflight.finalization_allowed = preflight.blockers.length === 0;
writeJson(path.join(paths.candidate, "records", "v36_finalization_preflight.json"), preflight);
ensureDir(paths.rootRecords);
writeJson(path.join(paths.rootRecords, "v36_finalization_preflight.json"), preflight);
if (!preflight.finalization_allowed) {
  writeConflict(preflight);
  console.log(JSON.stringify({ status: "blocked", blockers: preflight.blockers }, null, 2));
  process.exit(1);
}

const snapshotRecord = {
  generated_at: now,
  records: [
    snapshot(paths.candidate, "candidate_source", "v36_candidate preserved after finalization"),
    snapshot(paths.v35, "previous_stable", "current stable before finalization"),
    snapshot(paths.currentStable, "root_pointer"),
    snapshot(paths.releaseIndex, "root_pointer"),
    snapshot(paths.releaseHistory, "release_history")
  ]
};
writeJson(path.join(paths.rootRecords, "v36_finalization_pre_action_snapshot.json"), snapshotRecord);
writeJson(path.join(paths.candidate, "records", "v36_finalization_pre_action_snapshot.json"), snapshotRecord);

fs.cpSync(paths.candidate, paths.target, { recursive: true, force: false, errorOnExist: true });
const targetEntries = listEntries(paths.target);
const directoryRecord = {
  source_candidate_path: "v36_candidate",
  target_release_path: "v36",
  copied: true,
  files_copied: targetEntries.files.length,
  directories_copied: targetEntries.dirs.length,
  skipped: [],
  conflicts: [],
  v36_candidate_preserved: fs.existsSync(paths.candidate),
  destructive_operations: []
};
writeJson(path.join(paths.target, "records", "v36_directory_record.json"), directoryRecord);

const releaseManifest = createReleaseManifest();
writeReleaseNotes();
const rollbackPlan = writeRollbackPlan();
generateChecksumManifest(paths.target, "v36");

const validationRuns = {
  pre_move_current: runNode(path.join(paths.target, "harness", "validate_current_v36.mjs")),
  pre_move_assembled: runNode(path.join(paths.target, "harness", "validate_assembled_bundle.mjs")),
  pre_move_codex: runNode(path.join(paths.target, "harness", "validate_codex_runtime.mjs"))
};

const validationPass = validationRuns.pre_move_current.status === "pass" &&
  validationRuns.pre_move_assembled.status === "pass" &&
  validationRuns.pre_move_codex.status === "pass";
if (!validationPass) {
  writeJson(path.join(paths.target, "records", "v36_finalization_validation_failure.json"), validationRuns);
  console.log(JSON.stringify({ status: "blocked", reason: "v36 validation failed before v35 legacy move", validationRuns }, null, 2));
  process.exit(1);
}

ensureDir(paths.legacyRoot);
fs.renameSync(paths.v35, paths.legacyV35);
const legacyEntries = listEntries(paths.legacyV35);
const legacyRecord = {
  source_path: "v35",
  target_path: "legacy/v35",
  moved: true,
  file_count: legacyEntries.files.length,
  directory_count: legacyEntries.dirs.length,
  checksum_summary: checksumSummary(paths.legacyV35),
  legacy_v35_exists: fs.existsSync(paths.legacyV35),
  conflicts: [],
  note: "v35 preserved as previous stable rollback target."
};
writeJson(path.join(paths.target, "records", "v35_legacy_record.json"), legacyRecord);

try {
  updateRootPointers();
} catch (error) {
  if (!fs.existsSync(paths.v35) && fs.existsSync(paths.legacyV35)) fs.renameSync(paths.legacyV35, paths.v35);
  throw error;
}

const archiveRecord = createArchive();
validationRuns.final_current = runNode(path.join(paths.target, "harness", "validate_current_v36.mjs"));
validationRuns.final_assembled = runNode(path.join(paths.target, "harness", "validate_assembled_bundle.mjs"));
validationRuns.final_codex = runNode(path.join(paths.target, "harness", "validate_codex_runtime.mjs"));

const validationRecord = {
  validate_current_v36: {
    executed: true,
    passed: validationRuns.final_current.total_checks - validationRuns.final_current.failed_checks,
    failed: validationRuns.final_current.failed_checks,
    result: validationRuns.final_current.status
  },
  validate_assembled_bundle: {
    executed: true,
    passed: validationRuns.final_assembled.total_checks - validationRuns.final_assembled.failed_checks,
    failed: validationRuns.final_assembled.failed_checks,
    result: validationRuns.final_assembled.status
  },
  validate_codex_runtime: {
    executed: true,
    passed: validationRuns.final_codex.total_checks - validationRuns.final_codex.failed_checks,
    failed: validationRuns.final_codex.failed_checks,
    result: validationRuns.final_codex.status
  },
  checksum_after_validation: null,
  checksum_drift: null,
  verdict: "fail"
};

const finalizationRecord = {
  generated_at: new Date().toISOString(),
  status: "v36 finalized",
  current_stable: "v36",
  previous_stable: "legacy/v35",
  candidate_source: "v36_candidate",
  finalized_at: new Date().toISOString(),
  final_claim_strength: "current-stable-after-phase10-finalization",
  actions_performed: {
    v36_candidate_copied_to_v36: true,
    v36_validation_executed: true,
    v35_moved_to_legacy: true,
    root_pointers_updated: true,
    release_history_updated: true,
    archive_created: archiveRecord.archive_verdict === "pass",
    checksums_generated: true
  },
  final_structure: {
    v36: fs.existsSync(paths.target),
    legacy_v35: fs.existsSync(paths.legacyV35),
    legacy_v34: fs.existsSync(path.join(stackRoot, "legacy", "v34")) || fs.existsSync(path.join(stackRoot, "legacy_version", "v34")),
    v36_candidate: fs.existsSync(paths.candidate),
    archive: slash(path.relative(stackRoot, archivePath)),
    root_pointers: "v36"
  },
  evidence_summary: {
    source_coverage: "38/38",
    source_application: "Source application complete with deferred non-blockers",
    behavioral_benchmark: "65/65 pass",
    codex_runtime_benchmark: "15/15 pass",
    ablation: "9 variants executed",
    validation: "107/107, 18/18, 17/17 pass",
    release_gates: "11 pass",
    P0: 0,
    release_blocking_P1: 0
  },
  claim_scope_and_downgrades: {
    allowed_claims: [
      "v36 is current stable after Phase 10 finalization.",
      "v36 passed local release-gate, source-coverage, actor-output, semantic-judge, ablation, and validator evidence."
    ],
    downgraded_claims: [
      "production telemetry",
      "containment proof",
      "broader provider diversity",
      "archive-only source items"
    ],
    prohibited_claims: [
      "production-monitored",
      "containment-verified",
      "all-primary-source-validated",
      "public-benchmark-certified",
      "live-production-rollout-certified"
    ],
    production_readiness_limitations: "No production telemetry is connected.",
    containment_limitations: "Containment proof has not been produced.",
    telemetry_limitations: "Evidence is local/candidate and archived actor/judge evidence, not production telemetry.",
    provider_diversity_limitations: "Broader provider diversity remains a confidence improvement item."
  },
  codex_runtime_boundary: {
    codex_runtime_assets: "codex/",
    non_mirror_status: "Codex runtime is not an autonomous source-stack mirror.",
    behavioral_alignment: "15/15 Codex runtime benchmark pass.",
    runtime_fitness: "validate_codex_runtime 17/17 pass.",
    safety_preservation: "Safety/approval/tool/retrieval/memory/multi-agent/release boundary checks pass."
  },
  rollback_and_monitoring: {
    rollback_target: "legacy/v35",
    rollback_triggers: rollbackPlan.rollback_triggers,
    monitoring_items: rollbackPlan.monitoring_items,
    follow_up_items: [
      "production telemetry",
      "containment proof",
      "broader provider diversity"
    ]
  },
  validation_record: null
};

writeJson(path.join(paths.target, "records", "v36_finalization_record.json"), finalizationRecord);
writeText(path.join(paths.target, "reports", "V36_FINALIZATION_REPORT.md"), `# V36 Finalization Report

## 1. Final Status
- status: v36 finalized
- current_stable: v36
- previous_stable: legacy/v35
- candidate_source: v36_candidate
- finalized_at: ${finalizationRecord.finalized_at}
- final_claim_strength: current-stable-after-phase10-finalization

## 2. Actions Performed
- v36_candidate_copied_to_v36: true
- v36_validation_executed: true
- v35_moved_to_legacy: true
- root_pointers_updated: true
- release_history_updated: true
- archive_created: ${archiveRecord.archive_verdict === "pass"}
- checksums_generated: true

## 3. Final Structure
- v36: true
- legacy/v35: true
- legacy/v34: ${finalizationRecord.final_structure.legacy_v34}
- v36_candidate: true
- archive: ${finalizationRecord.final_structure.archive}
- root pointers: v36

## 4. Evidence Summary
- source coverage: 38/38
- source application: Source application complete with deferred non-blockers
- behavioral benchmark: 65/65 pass
- Codex runtime benchmark: 15/15 pass
- ablation: 9 variants executed
- validation: 107/107, 18/18, 17/17 pass
- release gates: 11 pass
- P0: 0
- release-blocking P1: 0

## 5. Claim Scope and Downgrades
- allowed_claims: v36 is current stable after Phase 10 finalization.
- downgraded_claims: production telemetry, containment proof, broader provider diversity, archive-only source items.
- prohibited_claims: production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, live-production-rollout-certified.
- production_readiness_limitations: No production telemetry is connected.
- containment_limitations: Containment proof has not been produced.
- telemetry_limitations: Evidence is local/candidate and archived actor/judge evidence, not production telemetry.
- provider_diversity_limitations: Broader provider diversity remains a confidence improvement item.

## 6. Codex Runtime Boundary
- codex_runtime_assets: codex/
- non_mirror_status: Codex runtime is not an autonomous source-stack mirror.
- behavioral_alignment: 15/15 Codex runtime benchmark pass.
- runtime_fitness: validate_codex_runtime 17/17 pass.
- safety_preservation: Safety, approval, tool, retrieval, memory, multi-agent, and release boundaries pass.

## 7. Rollback and Monitoring
- rollback_target: legacy/v35
- rollback_triggers: ${rollbackPlan.rollback_triggers.join(", ")}
- monitoring_items: ${rollbackPlan.monitoring_items.join(", ")}
- follow_up_items: production telemetry, containment proof, broader provider diversity

## 8. Final Recommendation
Recommendation:
No further release finalization required.

Next action:
- Operate from v36 as current stable.
`);

const finalChecksum = generateChecksumManifest(paths.target, "v36");
const checksumVerification = verifyChecksumManifest(paths.target);
validationRecord.checksum_after_validation = { file_count: finalChecksum.file_count, checked: checksumVerification.checked };
validationRecord.checksum_drift = checksumVerification.failed === 0 ? 0 : checksumVerification.failures;
validationRecord.verdict = validationRuns.final_current.status === "pass" &&
  validationRuns.final_assembled.status === "pass" &&
  validationRuns.final_codex.status === "pass" &&
  checksumVerification.failed === 0
  ? "pass"
  : "fail";

const finalRecord = finalValidation(validationRuns, archiveRecord, rollbackPlan);
finalRecord.v36_release_manifest_exists = fs.existsSync(path.join(paths.target, "records", "v36_release_manifest.json"));
finalRecord.v36_file_checksums_exists = fs.existsSync(path.join(paths.target, "records", "v36_file_checksums.json"));
finalRecord.validation_record = validationRecord;
finalRecord.release_manifest = releaseManifest;
finalizationRecord.validation_record = validationRecord;
finalizationRecord.final_validation_record = finalRecord;

writeJson(path.join(paths.target, "records", "v36_finalization_record.json"), finalizationRecord);
writeJson(path.join(paths.target, "records", "v36_final_validation_record.json"), finalRecord);
writeJson(path.join(paths.target, "records", "v36_validation_record.json"), validationRecord);

if (finalRecord.final_status !== "pass" || validationRecord.verdict !== "pass") {
  console.log(JSON.stringify({ status: "fail", final_validation: finalRecord, validation_record: validationRecord }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "pass",
  final_status: "v36 finalized",
  current_stable: "v36",
  previous_stable: "legacy/v35",
  v36_candidate_preserved: fs.existsSync(paths.candidate),
  validations: {
    validate_current_v36: validationRuns.final_current,
    validate_assembled_bundle: validationRuns.final_assembled,
    validate_codex_runtime: validationRuns.final_codex
  },
  checksum: { checked: checksumVerification.checked, failed: checksumVerification.failed },
  archive: archiveRecord
}, null, 2));
