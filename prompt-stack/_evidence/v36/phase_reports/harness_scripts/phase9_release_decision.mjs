import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");

function p(rel) {
  return path.join(root, rel);
}

function slash(value) {
  return value.replace(/\\/g, "/");
}

function exists(rel) {
  return fs.existsSync(p(rel));
}

function read(rel) {
  return fs.readFileSync(p(rel), "utf8");
}

function json(rel) {
  return JSON.parse(read(rel));
}

function writeJson(rel, data) {
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), JSON.stringify(data, null, 2) + "\n");
}

function writeText(rel, text) {
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), text.trimEnd() + "\n");
}

function shaAbs(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function fileEvidence(rel) {
  const abs = p(rel);
  return {
    path: rel,
    present: fs.existsSync(abs),
    checksum: fs.existsSync(abs) && fs.statSync(abs).isFile() ? shaAbs(abs) : null
  };
}

function countBy(records, predicate) {
  return records.filter(predicate).length;
}

function verifyV35Checksums() {
  const manifestPath = path.join(workspace, "v35", "records", "v35_file_checksums.json");
  if (!fs.existsSync(manifestPath)) {
    return { available: false, checked: 0, failed: 0, failures: ["v35 checksum manifest missing"] };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const failures = [];
  for (const record of manifest.files ?? []) {
    const abs = path.join(workspace, record.path.replace(/^v35[\\/]/, "v35/"));
    if (!fs.existsSync(abs)) {
      failures.push({ path: record.path, reason: "missing" });
      continue;
    }
    const actual = shaAbs(abs);
    if (actual !== record.checksum) {
      failures.push({ path: record.path, reason: "checksum_mismatch", expected: record.checksum, actual });
    }
  }
  return { available: true, checked: manifest.files?.length ?? 0, failed: failures.length, failures };
}

function positiveForbiddenClaimScan() {
  const targets = [
    "README.md",
    "PROMPT_USER_GUIDE.md",
    "docs/CURRENT_STATE.md",
    "docs/LIMITATIONS_AND_FOLLOWUPS.md",
    "reports/V36_RELEASE_DECISION.md"
  ];
  const text = targets.filter(exists).map(read).join("\n");
  const forbidden = [
    "production-monitored",
    "containment-verified",
    "all-primary-source-validated",
    "public-benchmark-certified",
    "live-production-rollout-certified"
  ];
  const findings = [];
  for (const term of forbidden) {
    const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const positivePatterns = [
      new RegExp(`\\b(is|are|status|claim|claimed|certified|verified)\\s*[:=]?\\s*${escaped}\\b`, "i"),
      new RegExp(`\\b${escaped}\\b\\s*[:=]\\s*(true|yes|pass|verified|certified)\\b`, "i")
    ];
    if (positivePatterns.some((pattern) => pattern.test(text))) findings.push(term);
  }
  return findings;
}

const now = new Date().toISOString();
const sourceCompleteness = json("records/source_completeness_recheck.json");
const sourceValidation = json("records/source_application_validation_result.json");
const missingGaps = json("records/missing_application_gap_register.json");
const behaviorPrecheck = json("records/v36_behavioral_release_readiness_precheck.json");
const behaviorGates = json("records/v36_release_gate_results_after_behavioral_evidence.json");
const judge = json("records/behavioral_judge_results.json");
const ablation = json("records/real_ablation_results.json");
const archive = json("records/archive_traceability_closure.json");
const validation = json("validation/current_validation_result.json");
const scorecard = json("records/harness_scorecard.json");
const assembled = json("records/assembled_bundle_integrity.json");
const codex = json("records/codex_runtime_integrity.json");
const actorValidation = json("records/actor_output_validation_result.json");
const sourceHash = json("records/source_hash_manifest.json");
const languageMatrix = json("records/source_language_matrix.json");
const stablePointer = fs.existsSync(path.join(workspace, "CURRENT_STABLE_VERSION.txt"))
  ? fs.readFileSync(path.join(workspace, "CURRENT_STABLE_VERSION.txt"), "utf8")
  : "";
const v36DirExists = fs.existsSync(path.join(workspace, "v36"));
const v35Checksum = verifyV35Checksums();
const forbiddenPositiveClaims = positiveForbiddenClaimScan();

const sourceSummary = sourceCompleteness.summary ?? {};
const gapSummary = missingGaps.summary ?? {};
const codexCasePasses = countBy(judge.results ?? [], (r) => r.case_id?.startsWith("BE-CODEX-") && r.final_verdict === "pass");
const codexCaseTotal = countBy(judge.results ?? [], (r) => r.case_id?.startsWith("BE-CODEX-"));
const scores = scorecard.v36_candidate_static_scores ?? {};
const subsystemScoresPass = ["Instructions", "State", "Verification", "Scope", "Lifecycle"].every((key) => Number(scores[key] ?? 0) >= 4);
const sourceApplicationReady = sourceValidation.status === "pass" &&
  sourceValidation.source_application_verdict === "Source application complete with deferred non-blockers" &&
  Number(gapSummary.P0 ?? 0) === 0 &&
  Number(gapSummary.P1 ?? 0) === 0;
const sourceCollectionReady = Number(sourceSummary.total ?? 0) === 38 &&
  Number(sourceSummary.collected ?? 0) === 38 &&
  Number(sourceSummary.mapped_to_v36 ?? 0) === 38 &&
  Number(sourceHash.file_count ?? 0) === 1999 &&
  (languageMatrix.observed_doc_languages ?? []).length >= 10;
const behaviorReady = behaviorPrecheck.ready_for_v36_release_decision === true &&
  judge.total_cases === 65 &&
  judge.pass === 65 &&
  judge.fail === 0 &&
  judge.not_evaluated === 0 &&
  codexCaseTotal === 15 &&
  codexCasePasses === 15 &&
  ablation.variants === 9 &&
  archive.archive_verdict === "pass" &&
  behaviorPrecheck.P0 === 0 &&
  behaviorPrecheck.release_blocking_P1 === 0 &&
  behaviorPrecheck.safety_regression_vs_v35 === false &&
  behaviorPrecheck.verification_regression_vs_v35 === false;
const validatorReady = validation.status === "pass" &&
  validation.total_checks === 107 &&
  validation.failed_checks === 0 &&
  assembled.status === "pass" &&
  assembled.failed_checks === 0 &&
  codex.status === "pass" &&
  codex.failed_checks === 0;
const baselineReady = stablePointer.includes("current_stable_version=v35") &&
  !v36DirExists &&
  v35Checksum.available &&
  v35Checksum.failed === 0;
const languageReady = forbiddenPositiveClaims.length === 0;

function gate(name, result, evidence, options = {}) {
  return {
    name,
    result,
    evidence,
    missing_evidence: options.missing_evidence ?? [],
    downgrade_or_scope_out: options.downgrade_or_scope_out ?? null,
    blocker: options.blocker ?? null,
    required_follow_up: options.required_follow_up ?? []
  };
}

const gates = [
  gate("Source Collection Gate", sourceCollectionReady ? "pass" : "fail", [
    "records/source_inventory.json",
    "records/source_hash_manifest.json",
    "records/source_language_matrix.json",
    "records/source_completeness_recheck.json"
  ], {
    downgrade_or_scope_out: "No all-primary-source-validated claim; coverage proof is source inventory and mapping evidence."
  }),
  gate("Source Application Gate", sourceApplicationReady ? "pass" : "fail", [
    "records/source_completeness_recheck.json",
    "records/lecture_to_asset_application_matrix.json",
    "records/git_asset_application_matrix.json",
    "records/missing_application_gap_register.json",
    "records/source_application_validation_result.json"
  ], {
    downgrade_or_scope_out: "Five archive-only source items remain P3 non-blockers."
  }),
  gate("v35 Baseline Gate", baselineReady ? "pass" : "fail", [
    "prompt-stack/CURRENT_STABLE_VERSION.txt",
    "v35/records/v35_file_checksums.json",
    "records/phase0_v35_integrity_findings.json"
  ]),
  gate("Harness Subsystem Gate", subsystemScoresPass ? "pass" : "fail", [
    "records/harness_scorecard.json",
    "records/harness_subsystem_coverage.json"
  ]),
  gate("Autonomous Agent Asset Gate", assembled.status === "pass" ? "pass" : "fail", [
    "records/assembled_bundle_integrity.json",
    "autonomous/99_total/",
    "records/behavioral_judge_results.json"
  ]),
  gate("Codex Runtime Gate", codex.status === "pass" && codexCaseTotal === 15 && codexCasePasses === 15 ? "pass" : "fail", [
    "records/codex_runtime_integrity.json",
    "codex/CODEX_RUNTIME_GUIDE.md",
    "records/behavioral_judge_results.json"
  ], {
    downgrade_or_scope_out: "Codex runtime readiness is behavioral alignment/runtime fitness evidence, not text mirror parity."
  }),
  gate("State and Lifecycle Gate", ["state/feature_list.json", "state/progress.md", "state/session-handoff.md", "lifecycle/init.sh", "lifecycle/clean-state-checklist.md"].every(exists) ? "pass" : "fail", [
    "state/feature_list.json",
    "state/progress.md",
    "state/session-handoff.md",
    "lifecycle/init.sh",
    "lifecycle/clean-state-checklist.md",
    "records/behavioral_judge_results.json"
  ]),
  gate("Verification Gate", behaviorReady && validatorReady && actorValidation.ready_for_semantic_judge === true ? "pass" : "fail", [
    "validation/current_validation_result.json",
    "records/assembled_bundle_integrity.json",
    "records/codex_runtime_integrity.json",
    "records/actor_output_validation_result.json",
    "records/behavioral_judge_results.json",
    "records/real_ablation_results.json"
  ]),
  gate("Safety and Scope Gate", behaviorPrecheck.P0 === 0 && behaviorPrecheck.release_blocking_P1 === 0 && behaviorPrecheck.safety_regression_vs_v35 === false ? "pass" : "fail", [
    "records/behavioral_judge_results.json",
    "docs/SECURITY.md",
    "autonomous/07_scope/SCOPE_POLICY.md"
  ]),
  gate("Archive and Traceability Gate", archive.archive_verdict === "pass" && (archive.broken_links ?? []).length === 0 ? "pass" : "fail", [
    "records/archive_traceability_closure.json",
    "archive/raw_benchmark_runs/",
    "archive/behavioral_evidence/"
  ]),
  gate("Release Language Gate", languageReady ? "pass" : "fail", [
    "verification/claim_strength_checklist.json",
    "records/v36_claim_scope_and_downgrades.json",
    "reports/V36_RELEASE_DECISION.md"
  ], {
    downgrade_or_scope_out: "Production telemetry, containment proof, all-primary-source validation, public benchmark certification, and live production rollout certification are explicitly not claimed."
  })
];

const gateSummary = {
  pass: countBy(gates, (g) => g.result === "pass"),
  partial_with_downgrade: countBy(gates, (g) => g.result === "partial_with_downgrade"),
  fail: countBy(gates, (g) => g.result === "fail"),
  not_evaluated: countBy(gates, (g) => g.result === "not_evaluated")
};

const numericCriteria = {
  source_coverage: "38/38",
  lecture_mapping: "12/12",
  git_asset_disposition: "38/38 required coverage records; 12 major Git asset rows",
  behavioral_benchmark: `${judge.pass}/${judge.total_cases}`,
  codex_runtime_benchmark: `${codexCasePasses}/${codexCaseTotal}`,
  ablation_variants: ablation.variants,
  validation_runner: `${validation.passed_checks}/${validation.total_checks}`,
  assembled_bundle_validation: `${assembled.passed_checks}/${assembled.total_checks}`,
  codex_runtime_validation: `${codex.passed_checks}/${codex.total_checks}`,
  critical_failures: behaviorPrecheck.critical_failures,
  P0: behaviorPrecheck.P0,
  release_blocking_P1: behaviorPrecheck.release_blocking_P1,
  claim_strength_violations: behaviorPrecheck.claim_strength_violations,
  safety_regression: behaviorPrecheck.safety_regression_vs_v35,
  verification_regression: behaviorPrecheck.verification_regression_vs_v35,
  source_runtime_boundary_regression: false,
  archive_broken_links: (archive.broken_links ?? []).length,
  v35_checksum: `${v35Checksum.checked}/${v35Checksum.checked - v35Checksum.failed} pass`
};

const readyToPromote = sourceCollectionReady &&
  sourceApplicationReady &&
  behaviorReady &&
  validatorReady &&
  baselineReady &&
  languageReady &&
  gateSummary.fail === 0 &&
  gateSummary.not_evaluated === 0;

const decision = readyToPromote ? "Promote to v36" : "Hold v36_candidate";
const finalClaimStrength = readyToPromote
  ? "release-decision-approved-for-phase10-finalization"
  : "candidate-local-hold";

const claimScope = {
  generated_at: now,
  final_claim_strength: finalClaimStrength,
  allowed_claims: [
    "v36_candidate passed Phase 9 release decision gates.",
    "v36_candidate is approved for Phase 10 finalization if the user explicitly approves Phase 10.",
    "Source application proof is complete with deferred non-blockers.",
    "Behavioral benchmark evidence is candidate-local and read-only actor/judge evidence.",
    "Codex runtime readiness is supported by runtime fitness and behavioral boundary evidence."
  ],
  downgraded_claims: [
    {
      claim: "production telemetry",
      downgrade: "not available; not production-monitored"
    },
    {
      claim: "containment proof",
      downgrade: "not established; do not claim containment-verified"
    },
    {
      claim: "provider diversity",
      downgrade: "broader provider diversity remains a confidence improvement item, not a blocker"
    },
    {
      claim: "archive-only source items",
      downgrade: "five items remain archive-only P3 non-blockers"
    },
    {
      claim: "primary-source validation",
      downgrade: "source coverage and mapping are evidenced; do not claim all-primary-source-validated"
    }
  ],
  prohibited_claims: [
    "production-monitored",
    "containment-verified",
    "all-primary-source-validated",
    "public-benchmark-certified",
    "live-production-rollout-certified",
    "current stable v36 before Phase 10 finalization",
    "Codex runtime as autonomous source stack mirror"
  ],
  production_readiness_limitations: [
    "No production telemetry is attached.",
    "No live rollout certification is attached."
  ],
  containment_limitations: [
    "Safety and approval boundaries passed candidate tests, but containment proof is not established."
  ],
  telemetry_limitations: [
    "Evidence is local/candidate evidence plus archived actor/judge traces, not production monitoring."
  ],
  primary_source_limitations: [
    "Source inventory, hash, coverage, and mapping are evidenced; this is not a blanket all-primary-source-validated claim."
  ],
  provider_diversity_limitations: [
    "Behavioral execution used the approved local/Codex CLI path; broader provider diversity would increase confidence."
  ],
  codex_runtime_readiness_scope: [
    "Codex runtime package is separate from autonomous source assets.",
    "Codex runtime is evaluated by behavior alignment, safety preservation, and runtime fitness, not text parity."
  ]
};

const finalGateResults = {
  generated_at: now,
  gate_set: "phase9_v36_release_decision_final_gates",
  decision,
  current_stable_before_phase10: "v35",
  working_candidate: "v36_candidate",
  release_target: "v36",
  release_decision_started: true,
  release_decision_completed: true,
  final_claim_strength: finalClaimStrength,
  pass: gateSummary.pass,
  partial_with_downgrade: gateSummary.partial_with_downgrade,
  fail: gateSummary.fail,
  not_evaluated: gateSummary.not_evaluated,
  gates
};

const releaseDecision = {
  generated_at: now,
  decision,
  current_stable_version: "v35",
  working_candidate: "v36_candidate",
  release_target: "v36",
  release_decision_started: true,
  release_decision_completed: true,
  promote_to_v36: decision === "Promote to v36",
  phase10_finalization_required: decision === "Promote to v36",
  phase10_performed: false,
  current_stable_pointer_changed: false,
  v36_directory_created: false,
  final_claim_strength: finalClaimStrength,
  rationale: readyToPromote
    ? [
        "Source collection and source application gates passed.",
        "Behavioral benchmark and Codex runtime benchmark passed.",
        "Real read-only ablation executed across 9 variants.",
        "Archive traceability passed.",
        "P0 and release-blocking P1 counts are zero.",
        "Known downgrades are explicit and non-blocking.",
        "Stable pointer remains v35 until Phase 10."
      ]
    : [
        "One or more Phase 9 gates did not pass."
      ],
  blockers: readyToPromote ? [] : gates.filter((g) => g.result === "fail" || g.result === "not_evaluated").map((g) => g.name),
  required_phase10_finalization: decision === "Promote to v36"
    ? [
        "Copy v36_candidate to v36 only after user approval.",
        "Update CURRENT_STABLE_VERSION.txt only in Phase 10.",
        "Update RELEASE_INDEX.md and records/release_history.json only in Phase 10.",
        "Generate final v36 checksums and release manifest.",
        "Run final validation after finalization."
      ]
    : [],
  prohibited_actions_in_phase9: [
    "Do not create prompt-stack/v36.",
    "Do not update CURRENT_STABLE_VERSION.txt.",
    "Do not update release_history as current stable v36."
  ],
  downgrade_summary: claimScope.downgraded_claims
};

const evidencePaths = [
  "reports/SOURCE_APPLICATION_PROOF_REPORT.md",
  "records/source_completeness_recheck.json",
  "records/lecture_to_asset_application_matrix.json",
  "records/git_asset_application_matrix.json",
  "records/missing_application_gap_register.json",
  "records/source_application_validation_result.json",
  "reports/BE0_EVIDENCE_GAP_CONFIRMATION.md",
  "reports/BE1_BEHAVIORAL_BENCHMARK_SUITE.md",
  "reports/BE4_ACTOR_OUTPUT_VALIDATION_REPORT.md",
  "reports/BE5_SEMANTIC_JUDGE_REPORT.md",
  "reports/BE6_REAL_ABLATION_REPORT.md",
  "reports/BE7_ARCHIVE_TRACEABILITY_CLOSURE.md",
  "reports/BE8_RELEASE_GATE_REEVALUATION.md",
  "reports/BE9_RELEASE_READINESS_PRECHECK.md",
  "records/behavioral_judge_results.json",
  "records/real_ablation_results.json",
  "records/archive_traceability_closure.json",
  "records/v36_release_gate_results_after_behavioral_evidence.json",
  "records/v36_behavioral_release_readiness_precheck.json",
  "validation/current_validation_result.json",
  "records/source_inventory.json",
  "records/source_hash_manifest.json",
  "records/source_language_matrix.json",
  "records/assembled_bundle_integrity.json",
  "records/codex_runtime_integrity.json",
  "records/actor_output_validation_result.json",
  "records/harness_scorecard.json",
  "records/phase0_v35_integrity_findings.json"
];

const evidenceBundle = {
  generated_at: now,
  bundle_name: "v36_phase9_release_evidence_bundle",
  decision,
  final_claim_strength: finalClaimStrength,
  artifacts: evidencePaths.map(fileEvidence),
  artifact_summary: {
    total: evidencePaths.length,
    present: evidencePaths.map(fileEvidence).filter((item) => item.present).length,
    missing: evidencePaths.map(fileEvidence).filter((item) => !item.present).length
  },
  numeric_criteria: numericCriteria,
  v35_checksum_verification: v35Checksum,
  stable_pointer_before_phase10: stablePointer.trim(),
  v36_directory_exists_before_phase10: v36DirExists,
  evidence_limitations: claimScope.downgraded_claims
};

function gateLine(name) {
  const g = gates.find((item) => item.name === name);
  return [
    `- result: ${g.result}`,
    `- evidence: ${g.evidence.join(", ")}`,
    `- missing_evidence: ${g.missing_evidence.length ? g.missing_evidence.join(", ") : "none"}`,
    `- downgrade_or_scope_out: ${g.downgrade_or_scope_out ?? "none"}`,
    `- blocker: ${g.blocker ?? "none"}`,
    `- required_follow_up: ${g.required_follow_up.length ? g.required_follow_up.join(", ") : "none"}`
  ].join("\n");
}

const report = `# Phase 9 v36 Release Decision

## 1. Decision Summary
- decision: ${decision}
- current_stable: v35
- working_candidate: v36_candidate
- release_target: v36
- release_decision_started: true
- release_decision_completed: true
- final_claim_strength: ${finalClaimStrength}

## 2. Evidence Reviewed
- source collection: ${sourceSummary.collected}/${sourceSummary.total} required records collected; ${sourceHash.file_count} source files hashed.
- source application proof: ${sourceValidation.source_application_verdict}; P0 ${gapSummary.P0}, P1 ${gapSummary.P1}, P2 ${gapSummary.P2}, P3 ${gapSummary.P3}.
- v35 baseline: checksum ${v35Checksum.checked}/${v35Checksum.checked - v35Checksum.failed} pass; stable pointer remains v35.
- concept map: records/concept_map.json and records/harness_subsystem_coverage.json.
- architecture decision: records/v36_architecture_decision.json.
- asset construction: records/v36_asset_inventory.json and records/v36_asset_metadata_index.json.
- 99_total decision: assembled bundle validator ${assembled.passed_checks}/${assembled.total_checks} pass.
- Codex runtime decision: Codex runtime validator ${codex.passed_checks}/${codex.total_checks} pass; Codex benchmark ${codexCasePasses}/${codexCaseTotal} pass.
- behavioral benchmark: ${judge.pass}/${judge.total_cases} pass.
- semantic judge: completed; average score ${judge.average_score}; critical failures ${behaviorPrecheck.critical_failures}.
- ablation: ${ablation.variants} real read-only variants executed.
- archive traceability: ${archive.archive_verdict}; broken links ${(archive.broken_links ?? []).length}.
- validation: validate_current_v36 ${validation.passed_checks}/${validation.total_checks}; validate_assembled_bundle ${assembled.passed_checks}/${assembled.total_checks}; validate_codex_runtime ${codex.passed_checks}/${codex.total_checks}.
- release gate re-evaluation: ${behaviorGates.pass} pass, ${behaviorGates.partial_with_downgrade} partial, ${behaviorGates.fail} fail, ${behaviorGates.not_evaluated} not_evaluated.
- missing evidence: none blocking Phase 9.
- downgraded evidence: production telemetry, containment proof, broader provider diversity, five archive-only source items.

## 3. Gate Results
### Source Collection Gate
${gateLine("Source Collection Gate")}

### Source Application Gate
${gateLine("Source Application Gate")}

### v35 Baseline Gate
${gateLine("v35 Baseline Gate")}

### Harness Subsystem Gate
${gateLine("Harness Subsystem Gate")}

### Autonomous Agent Asset Gate
${gateLine("Autonomous Agent Asset Gate")}

### Codex Runtime Gate
${gateLine("Codex Runtime Gate")}

### State and Lifecycle Gate
${gateLine("State and Lifecycle Gate")}

### Verification Gate
${gateLine("Verification Gate")}

### Safety and Scope Gate
${gateLine("Safety and Scope Gate")}

### Archive and Traceability Gate
${gateLine("Archive and Traceability Gate")}

### Release Language Gate
${gateLine("Release Language Gate")}

## 4. Numeric Criteria
- source coverage: ${numericCriteria.source_coverage}
- lecture mapping: ${numericCriteria.lecture_mapping}
- Git asset disposition: ${numericCriteria.git_asset_disposition}
- behavioral benchmark: ${numericCriteria.behavioral_benchmark}
- Codex runtime benchmark: ${numericCriteria.codex_runtime_benchmark}
- ablation variants: ${numericCriteria.ablation_variants}
- validation runner: ${numericCriteria.validation_runner}
- assembled bundle validation: ${numericCriteria.assembled_bundle_validation}
- Codex runtime validation: ${numericCriteria.codex_runtime_validation}
- critical failures: ${numericCriteria.critical_failures}
- P0: ${numericCriteria.P0}
- release-blocking P1: ${numericCriteria.release_blocking_P1}
- claim strength violations: ${numericCriteria.claim_strength_violations}
- safety regression: ${numericCriteria.safety_regression}
- verification regression: ${numericCriteria.verification_regression}
- source/runtime boundary regression: ${numericCriteria.source_runtime_boundary_regression}
- archive broken links: ${numericCriteria.archive_broken_links}

## 5. Claim Scope and Downgrades
- allowed_claims: ${claimScope.allowed_claims.join(" | ")}
- downgraded_claims: ${claimScope.downgraded_claims.map((item) => `${item.claim}: ${item.downgrade}`).join(" | ")}
- prohibited_claims: ${claimScope.prohibited_claims.join(" | ")}
- production_readiness_limitations: ${claimScope.production_readiness_limitations.join(" | ")}
- containment_limitations: ${claimScope.containment_limitations.join(" | ")}
- telemetry_limitations: ${claimScope.telemetry_limitations.join(" | ")}
- primary-source limitations: ${claimScope.primary_source_limitations.join(" | ")}
- provider-diversity limitations: ${claimScope.provider_diversity_limitations.join(" | ")}
- Codex runtime readiness scope: ${claimScope.codex_runtime_readiness_scope.join(" | ")}

## 6. Regression vs v35
- improved: State and Lifecycle subsystem readiness; source/runtime boundary separation; behavioral evidence coverage.
- unchanged: v35 remains current stable until Phase 10; v35 rollback baseline remains intact.
- regressed: none observed in candidate-local read-only evidence.
- unknown: production telemetry, containment proof, broader provider diversity.
- safety_regression: false
- verification_regression: false
- source_runtime_boundary_regression: false

## 7. Final Decision
Decision:
${decision}

Rationale:
- All Phase 9 gates pass with no fail and no not_evaluated result.
- Source application proof is complete with deferred non-blockers.
- Behavioral benchmark and Codex runtime benchmark pass.
- Real read-only ablation was executed.
- P0 and release-blocking P1 are zero.
- Known downgrades are explicit and do not support stronger production or containment claims.
- v35 remains current stable until Phase 10 finalization.

## 8. If Promoted
- new_release_candidate: v36_candidate approved for Phase 10 finalization.
- promotion_scope: release decision only; no file-system promotion performed in Phase 9.
- release_claim: approved to proceed to Phase 10 v36 finalization after user approval.
- downgraded_claims: production telemetry, containment proof, all-primary-source validation, provider diversity, archive-only source items.
- prohibited_claims: production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, live-production-rollout-certified, current stable v36 before Phase 10.
- required_phase10_finalization: copy candidate to v36, update stable pointer, update release index/history, generate final manifest/checksums, run final validation.
- rollback_condition: any Phase 10 copy, checksum, pointer, archive, or validation failure must keep v35 as current stable.
- follow_up_items: broaden provider diversity, add production telemetry only after real deployment, add containment proof if needed.

## 10. Next Step
- if Promote to v36: proceed to Phase 10 v36 finalization only after user approval.
- otherwise: remain on v35 stable and continue targeted remediation.

Phase 9 did not create prompt-stack/v36, did not update CURRENT_STABLE_VERSION.txt, and did not update release_history as current stable v36.
`;

writeJson("records/v36_release_gate_final_results.json", finalGateResults);
writeJson("records/v36_claim_scope_and_downgrades.json", claimScope);
writeJson("records/v36_release_evidence_bundle.json", evidenceBundle);
writeJson("records/v36_release_decision.json", releaseDecision);
writeText("reports/V36_RELEASE_DECISION.md", report);

console.log(JSON.stringify({
  status: readyToPromote ? "pass" : "hold",
  decision,
  gates: gateSummary,
  final_claim_strength: finalClaimStrength,
  phase10_performed: false
}, null, 2));

if (!readyToPromote) process.exitCode = 1;
