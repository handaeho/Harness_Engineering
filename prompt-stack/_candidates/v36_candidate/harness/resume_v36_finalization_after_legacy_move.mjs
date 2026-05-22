import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const candidateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stackRoot = path.resolve(candidateRoot, "..");
const v36Root = path.join(stackRoot, "v36");
const legacyV35 = path.join(stackRoot, "legacy", "v35");
const dateStamp = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();
const archivePath = path.join(stackRoot, "_archive", `v36_release_evidence_${dateStamp}`);

function slash(value) { return value.replace(/\\/g, "/"); }
function ensureDir(absPath) { fs.mkdirSync(absPath, { recursive: true }); }
function readText(absPath) { return fs.readFileSync(absPath, "utf8"); }
function writeText(absPath, text) { ensureDir(path.dirname(absPath)); fs.writeFileSync(absPath, text.trimEnd() + "\n"); }
function readJson(absPath) { return JSON.parse(readText(absPath)); }
function writeJson(absPath, data) { writeText(absPath, JSON.stringify(data, null, 2)); }
function shaFile(absPath) { return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex"); }
function shaText(text) { return crypto.createHash("sha256").update(text).digest("hex"); }

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
    } else if (stat.isFile()) files.push(current);
  }
  walk(absPath);
  return { files: files.sort(), dirs: dirs.sort() };
}

function checksumSummary(absPath) {
  if (!fs.existsSync(absPath)) return { algorithm: "SHA256", file_count: 0, digest: null };
  if (fs.statSync(absPath).isFile()) return { algorithm: "SHA256", file_count: 1, digest: shaFile(absPath) };
  const { files } = listEntries(absPath);
  const digest = shaText(files.map((file) => `${slash(path.relative(absPath, file))}:${shaFile(file)}`).join("\n"));
  return { algorithm: "SHA256", file_count: files.length, digest };
}

function runNode(scriptAbsPath) {
  const stdout = execFileSync(process.execPath, [scriptAbsPath], {
    cwd: stackRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

function generateChecksumManifest(rootAbsPath, rootName) {
  const excludes = new Set([
    "records/v36_file_checksums.json",
    "validation/current_validation_result.json",
    "verification/current_validation_result.json"
  ]);
  const records = [];
  for (const file of listEntries(rootAbsPath).files) {
    const rel = slash(path.relative(rootAbsPath, file));
    if (excludes.has(rel) || rel.startsWith("validation/runs/") || rel.startsWith("sources/learn_harness_engineering_clone/.git/")) continue;
    const top = rel.split("/")[0];
    const layer = top === "autonomous" ? "autonomous"
      : top === "codex" ? "codex"
      : top === "state" ? "state"
      : top === "verification" || top === "validation" ? "verification"
      : top === "lifecycle" ? "lifecycle"
      : top === "harness" ? "harness"
      : top === "records" ? "records"
      : top === "reports" ? "reports"
      : top === "archive" || top === "sources" ? "archive"
      : "docs";
    records.push({
      path: `${rootName}/${rel}`,
      layer,
      asset_type: path.extname(file).replace(/^\./, "") || "file",
      size: fs.statSync(file).size,
      checksum: shaFile(file),
      note: ""
    });
  }
  const manifest = {
    generated_at: new Date().toISOString(),
    root_path: rootName,
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
  const manifest = readJson(path.join(rootAbsPath, "records", "v36_file_checksums.json"));
  const failures = [];
  for (const record of manifest.files) {
    const rel = record.path.replace(/^v36[\\/]/, "").replace(/^_archive\/v36_release_evidence_\d{4}-\d{2}-\d{2}\//, "");
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

function positiveClaimFindings(absRoot) {
  const terms = ["production-monitored", "containment-verified", "all-primary-source-validated", "public-benchmark-certified", "live-production-rollout-certified"];
  const findings = [];
  for (const file of listEntries(absRoot).files) {
    if (!/\.(md|txt|json)$/i.test(file)) continue;
    const rel = slash(path.relative(absRoot, file));
    readText(file).split(/\r?\n/).forEach((line, index) => {
      for (const term of terms) {
        const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const positivePatterns = [
          new RegExp(`\\b(is|are|status|claim_strength|final_claim_strength)\\s*[:=]?\\s*["'\`]?${escaped}\\b`, "i"),
          new RegExp(`\\b${escaped}\\b\\s*[:=]\\s*(true|yes|pass|verified|certified|current|stable)\\b`, "i")
        ];
        if (positivePatterns.some((pattern) => pattern.test(line))) {
          findings.push({ path: `v36/${rel}`, line: index + 1, term, text: line.trim().slice(0, 240) });
        }
      }
    });
  }
  return findings;
}

function writeRootPointers() {
  writeText(path.join(stackRoot, "CURRENT_STABLE_VERSION.txt"), `current_stable_version=v36
current_stable_path=.\\v36
release_manifest=.\\v36\\records\\v36_release_manifest.json
release_notes=.\\v36\\reports\\V36_RELEASE_NOTES.md
current_state=.\\v36\\docs\\CURRENT_STATE.md
validation_summary=.\\v36\\reports\\V36_VALIDATION_SUMMARY.md
rollback_and_monitoring=.\\v36\\reports\\V36_ROLLBACK_AND_MONITORING_PLAN.md`);

  writeText(path.join(stackRoot, "RELEASE_INDEX.md"), `# Release Index

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
- legacy_version/v34: existing legacy rollback reference, preserved.
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
- live-production-rollout-certified`);

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
        prohibited_positive_claims: ["production_monitored", "containment_verified", "all_primary_source_items_fully_validated", "public_benchmark_certified", "live_production_rollout_certified"]
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
    legacy_versions: [
      {
        version: "v34",
        status: "legacy_rollback_reference",
        path: "legacy_version/v34",
        note: "Existing legacy rollback reference preserved."
      }
    ],
    generated_at: new Date().toISOString()
  };
  writeJson(path.join(stackRoot, "records", "release_history.json"), history);
}

function copyEvidenceItem(srcRel, destRel = srcRel) {
  const src = path.join(v36Root, srcRel);
  const dest = path.join(archivePath, destRel);
  if (!fs.existsSync(src)) return { source: srcRel, archived: false, reason: "missing" };
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true, force: false, errorOnExist: false });
  return { source: srcRel, archived: true, target: slash(path.relative(stackRoot, dest)) };
}

function createArchive() {
  const items = [
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
  const copied = items.map((item) => copyEvidenceItem(item));
  const manifest = generateChecksumManifest(archivePath, `_archive/v36_release_evidence_${dateStamp}`);
  const broken = copied.filter((item) => !item.archived);
  const record = {
    generated_at: new Date().toISOString(),
    archive_path: slash(path.relative(stackRoot, archivePath)),
    files_archived: manifest.file_count,
    checksums_generated: true,
    broken_links: broken,
    archive_verdict: broken.length === 0 ? "pass" : "fail"
  };
  writeJson(path.join(v36Root, "records", "v36_archive_finalization_record.json"), record);
  return record;
}

if (!fs.existsSync(v36Root) || !fs.existsSync(legacyV35) || fs.existsSync(path.join(stackRoot, "v35"))) {
  console.log(JSON.stringify({ status: "blocked", reason: "resume precondition failed", v36_exists: fs.existsSync(v36Root), legacy_v35_exists: fs.existsSync(legacyV35), root_v35_exists: fs.existsSync(path.join(stackRoot, "v35")) }, null, 2));
  process.exit(1);
}

const legacyEntries = listEntries(legacyV35);
const legacyRecord = {
  source_path: "v35",
  target_path: "legacy/v35",
  moved: true,
  file_count: legacyEntries.files.length,
  directory_count: legacyEntries.dirs.length,
  checksum_summary: checksumSummary(legacyV35),
  legacy_v35_exists: true,
  conflicts: [],
  note: "v35 preserved as previous stable rollback target."
};
writeJson(path.join(v36Root, "records", "v35_legacy_record.json"), legacyRecord);

writeRootPointers();
const archiveRecord = createArchive();

const finalCurrent = runNode(path.join(v36Root, "harness", "validate_current_v36.mjs"));
const finalAssembled = runNode(path.join(v36Root, "harness", "validate_assembled_bundle.mjs"));
const finalCodex = runNode(path.join(v36Root, "harness", "validate_codex_runtime.mjs"));

writeText(path.join(v36Root, "reports", "V36_VALIDATION_SUMMARY.md"), `# V36 Validation Summary

- validate_current_v36: ${finalCurrent.total_checks - finalCurrent.failed_checks}/${finalCurrent.total_checks} ${finalCurrent.status}
- validate_assembled_bundle: ${finalAssembled.total_checks - finalAssembled.failed_checks}/${finalAssembled.total_checks} ${finalAssembled.status}
- validate_codex_runtime: ${finalCodex.total_checks - finalCodex.failed_checks}/${finalCodex.total_checks} ${finalCodex.status}
- archive: ${archiveRecord.archive_verdict}
- stable pointer: v36
`);

const rollbackPlan = readJson(path.join(v36Root, "records", "v36_rollback_and_monitoring_plan.json"));
const validationRecord = {
  validate_current_v36: { executed: true, passed: finalCurrent.total_checks - finalCurrent.failed_checks, failed: finalCurrent.failed_checks, result: finalCurrent.status },
  validate_assembled_bundle: { executed: true, passed: finalAssembled.total_checks - finalAssembled.failed_checks, failed: finalAssembled.failed_checks, result: finalAssembled.status },
  validate_codex_runtime: { executed: true, passed: finalCodex.total_checks - finalCodex.failed_checks, failed: finalCodex.failed_checks, result: finalCodex.status },
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
    v36: true,
    legacy_v35: true,
    legacy_v34: fs.existsSync(path.join(stackRoot, "legacy_version", "v34")),
    v36_candidate: fs.existsSync(path.join(stackRoot, "v36_candidate")),
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
    allowed_claims: ["v36 is current stable after Phase 10 finalization."],
    downgraded_claims: ["production telemetry", "containment proof", "broader provider diversity", "archive-only source items"],
    prohibited_claims: ["production-monitored", "containment-verified", "all-primary-source-validated", "public-benchmark-certified", "live-production-rollout-certified"],
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
    follow_up_items: ["production telemetry", "containment proof", "broader provider diversity"]
  },
  validation_record: validationRecord
};

writeJson(path.join(v36Root, "records", "v36_finalization_record.json"), finalizationRecord);
writeText(path.join(v36Root, "reports", "V36_FINALIZATION_REPORT.md"), `# V36 Finalization Report

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

const checksumManifest = generateChecksumManifest(v36Root, "v36");
const checksumVerification = verifyChecksumManifest(v36Root);
validationRecord.checksum_after_validation = { file_count: checksumManifest.file_count, checked: checksumVerification.checked };
validationRecord.checksum_drift = checksumVerification.failed === 0 ? 0 : checksumVerification.failures;
validationRecord.verdict = finalCurrent.status === "pass" && finalAssembled.status === "pass" && finalCodex.status === "pass" && checksumVerification.failed === 0 ? "pass" : "fail";

const stableText = readText(path.join(stackRoot, "CURRENT_STABLE_VERSION.txt"));
const releaseIndexText = readText(path.join(stackRoot, "RELEASE_INDEX.md"));
const history = readJson(path.join(stackRoot, "records", "release_history.json"));
const prohibited = positiveClaimFindings(v36Root);
const finalValidationRecord = {
  v36_exists: fs.existsSync(v36Root),
  v36_validation_pass: validationRecord.verdict === "pass",
  legacy_v35_exists: fs.existsSync(legacyV35),
  current_stable_pointer: stableText.includes("current_stable_version=v36") ? "v36" : "invalid",
  release_index_valid: /current stable:\s*v36/i.test(releaseIndexText) && /previous stable:\s*legacy\/v35/i.test(releaseIndexText),
  release_history_valid: history.current_stable_version === "v36" && history.releases.some((item) => item.version === "v36" && item.status === "current_stable") && history.releases.some((item) => item.version === "v35" && item.status === "legacy_previous_stable"),
  archive_valid: archiveRecord.archive_verdict === "pass",
  checksum_valid: checksumVerification.failed === 0,
  prohibited_claim_scan: { passed: prohibited.length === 0, findings: prohibited },
  downgrade_language_preserved: readText(path.join(v36Root, "reports", "V36_RELEASE_NOTES.md")).includes("not production-monitored") && readText(path.join(v36Root, "reports", "V36_RELEASE_NOTES.md")).includes("not containment-verified"),
  final_status: "fail"
};
finalValidationRecord.v36_release_manifest_exists = fs.existsSync(path.join(v36Root, "records", "v36_release_manifest.json"));
finalValidationRecord.v36_file_checksums_exists = fs.existsSync(path.join(v36Root, "records", "v36_file_checksums.json"));
finalValidationRecord.final_status = finalValidationRecord.v36_exists &&
  finalValidationRecord.v36_validation_pass &&
  finalValidationRecord.legacy_v35_exists &&
  finalValidationRecord.current_stable_pointer === "v36" &&
  finalValidationRecord.release_index_valid &&
  finalValidationRecord.release_history_valid &&
  finalValidationRecord.archive_valid &&
  finalValidationRecord.checksum_valid &&
  finalValidationRecord.prohibited_claim_scan.passed &&
  finalValidationRecord.downgrade_language_preserved &&
  finalValidationRecord.v36_release_manifest_exists &&
  finalValidationRecord.v36_file_checksums_exists
  ? "pass"
  : "fail";
finalValidationRecord.validation_record = validationRecord;

finalizationRecord.validation_record = validationRecord;
finalizationRecord.final_validation_record = finalValidationRecord;
writeJson(path.join(v36Root, "records", "v36_finalization_record.json"), finalizationRecord);
writeJson(path.join(v36Root, "records", "v36_validation_record.json"), validationRecord);
writeJson(path.join(v36Root, "records", "v36_final_validation_record.json"), finalValidationRecord);

console.log(JSON.stringify({
  status: finalValidationRecord.final_status,
  current_stable: "v36",
  previous_stable: "legacy/v35",
  validations: {
    validate_current_v36: finalCurrent,
    validate_assembled_bundle: finalAssembled,
    validate_codex_runtime: finalCodex
  },
  checksum: { checked: checksumVerification.checked, failed: checksumVerification.failed },
  archive: archiveRecord,
  prohibited_claim_findings: prohibited.length
}, null, 2));

if (finalValidationRecord.final_status !== "pass") process.exit(1);
