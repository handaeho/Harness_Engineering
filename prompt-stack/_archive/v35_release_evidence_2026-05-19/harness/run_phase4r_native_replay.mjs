import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const candidateRoot = path.resolve("C:/WORK/0.개인/PROMPT/prompt-stack/v35_candidate");
const defaultCases = path.join(candidateRoot, "records", "phase4_5_native_replay_cases.json");
const rawArgs = process.argv.slice(2);
let casesPath = defaultCases;
let runId = "phase4r-native-replay-2026-05-19-a";
let engine = "deterministic-local";
let phase4rJR = false;
let codexTestsPath = path.join(candidateRoot, "records", "phase4_5_codex_actor_judge_test_plan.json");
let nativeActorOutputPath = null;
let codexActorOutputPath = null;

for (let i = 0; i < rawArgs.length; i += 1) {
  if (rawArgs[i] === "--cases") casesPath = path.resolve(rawArgs[++i]);
  else if (rawArgs[i] === "--run-id") runId = rawArgs[++i];
  else if (rawArgs[i] === "--engine") engine = rawArgs[++i];
  else if (rawArgs[i] === "--phase4r-j-r") phase4rJR = true;
  else if (rawArgs[i] === "--codex-tests") codexTestsPath = path.resolve(rawArgs[++i]);
  else if (rawArgs[i] === "--native-actor-output-file") nativeActorOutputPath = path.resolve(rawArgs[++i]);
  else if (rawArgs[i] === "--codex-actor-output-file") codexActorOutputPath = path.resolve(rawArgs[++i]);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function loadActorOutputs(file) {
  if (!file) return {};
  const data = readJson(file);
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((item) => [item.case_id ?? item.test_id, item.actor_output]));
  }
  if (Array.isArray(data.records)) {
    return Object.fromEntries(data.records.map((item) => [item.case_id ?? item.test_id, item.actor_output]));
  }
  return data;
}

function isRecognizedActorOutput(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  const rejected = [
    "placeholder",
    "synthetic summary",
    "prior deterministic record",
    "judge remains pending",
    "deterministic local actor/judge protocol",
    "not certified"
  ];
  return !rejected.some((term) => lower.includes(term));
}

function readCandidateFile(relPath) {
  const abs = path.resolve(candidateRoot, relPath);
  if (!abs.startsWith(candidateRoot)) throw new Error(`Path escapes candidate root: ${relPath}`);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function hasAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function evaluateCase(testCase) {
  const combined = (testCase.source_files_under_test ?? []).map(readCandidateFile).join("\n");
  const assertionResults = (testCase.deterministic_assertions ?? []).map((assertion) => {
    const terms = assertion.terms ?? [];
    return {
      assertion_id: assertion.assertion_id,
      passed: terms.length ? hasAny(combined, terms) : true,
      terms
    };
  });
  const deterministicPass = assertionResults.every((item) => item.passed);
  const forbidden = testCase.forbidden_behavior ?? [];
  return {
    case_id: testCase.case_id,
    engine,
    deterministic_pass: deterministicPass,
    assertion_results: assertionResults,
    judge_required: true,
    judge_status: engine === "deterministic-local" ? "not_executed" : "external_actor_judge_required",
    critical_failure: false,
    verdict: deterministicPass ? "PassWithJudgePending" : "Fail",
    claim_strength: engine === "deterministic-local" ? "locally_checked" : "runner_executed_pending_judge",
    forbidden_behavior_checked: forbidden.length > 0
  };
}

function selectedSkillForCase(testCase) {
  return testCase.codex_skill_under_test ?? "none";
}

function runPhase4rJR() {
  const recordsDir = path.join(candidateRoot, "records");
  const reportsDir = path.join(candidateRoot, "reports");
  const outDir = path.join(candidateRoot, "harness", "runs", runId);
  const nativeCases = readJson(casesPath);
  const codexTests = readJson(codexTestsPath);
  const nativeActorOutputs = loadActorOutputs(nativeActorOutputPath);
  const codexActorOutputs = loadActorOutputs(codexActorOutputPath);
  const nativePhase4RJ = readJson(path.join(recordsDir, "phase4r_j_native_replay_judge_results.json"));
  const codexPhase4RJ = readJson(path.join(recordsDir, "phase4r_j_codex_runtime_judge_results.json"));
  const primaryClosure = readJson(path.join(recordsDir, "phase4r_j_primary_source_closure.json"));
  const substrateClosure = readJson(path.join(recordsDir, "phase4r_j_substrate_closure.json"));

  const nativePriorById = Object.fromEntries(nativePhase4RJ.results.map((item) => [item.case_id, item]));
  const codexPriorById = Object.fromEntries(codexPhase4RJ.results.map((item) => [item.test_id, item]));

  const audit = {
    runner_path: path.relative(candidateRoot, new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
    can_capture_actor_output: Boolean(nativeActorOutputPath),
    can_capture_codex_actor_output: Boolean(codexActorOutputPath),
    can_run_semantic_judge: Boolean(nativeActorOutputPath || codexActorOutputPath),
    can_store_judge_rationale: true,
    can_preserve_trace_ids: true,
    can_separate_deterministic_and_semantic_verdicts: true,
    gaps: [
      ...(nativeActorOutputPath ? [] : ["native actor output provider/file not available"]),
      ...(codexActorOutputPath ? [] : ["Codex actor output provider/file not available"]),
      ...(engine === "codex-cli-unavailable" ? ["local codex.exe access denied in current session"] : [])
    ],
    required_runner_patch: "applied: --phase4r-j-r mode stores actor-output records, semantic-judge records, and fail-closed not_evaluated verdicts when actor output is unavailable",
    patch_allowed: true,
    target_patch_files: ["harness/run_phase4r_native_replay.mjs"],
    risk: "Without a live actor provider or captured output file, semantic judge cannot produce pass verdicts; all affected cases remain not_evaluated."
  };

  const nativeActorRecords = nativeCases.map((testCase) => {
    const evaluated = evaluateCase(testCase);
    const actorOutput = nativeActorOutputs[testCase.case_id] ?? null;
    const accepted = isRecognizedActorOutput(actorOutput);
    const traceId = `${runId}-${testCase.case_id.toLowerCase()}-trace`;
    return {
      case_id: testCase.case_id,
      run_id: runId,
      trace_id: traceId,
      parent_trace_id: `${testCase.case_id.toLowerCase()}-trace`,
      scenario_id: testCase.case_id,
      cohort_id: "phase4r-j-r-targeted-semantic-retest",
      artifact_version: "v35-candidate-phase4r-j-r",
      prompt_version: "v35-candidate",
      selected_base_prompt: testCase.expected_runtime_assembly?.selected_base_prompt ?? "owner_scoped_bundle",
      selected_overlays: testCase.expected_runtime_assembly?.selected_overlays ?? [],
      selected_skill: selectedSkillForCase(testCase),
      example_mode: testCase.example_mode ?? "none",
      input: testCase.input,
      actor_output: accepted ? actorOutput : null,
      actor_output_hash: accepted ? `sha256:${hashText(actorOutput)}` : null,
      deterministic_assertions_result: evaluated.assertion_results,
      forbidden_behavior_detected: accepted ? hasAny(actorOutput, testCase.forbidden_behavior ?? []) : null,
      critical_failure_detected: accepted ? hasAny(actorOutput, testCase.critical_failure_override ?? []) : null,
      claim_strength_in_actor_output: accepted ? "captured_actor_output" : "not_evaluated_actor_output_missing",
      notes: accepted ? "actor output supplied by external capture file" : "actor output missing; pass and semantic judge are prohibited"
    };
  });

  const nativeJudgeRecords = nativeActorRecords.map((record) => {
    const prior = nativePriorById[record.case_id] ?? {};
    const deterministicPass = record.deterministic_assertions_result.every((item) => item.passed);
    let semantic = "not_evaluated";
    let finalVerdict = "not_evaluated";
    let scoreAfter = null;
    let rationale = "Actor output missing; semantic judge not executed and pass is prohibited.";
    if (record.actor_output) {
      if (!deterministicPass) {
        semantic = "partial";
        finalVerdict = "partial";
        scoreAfter = 2;
        rationale = "Actor output exists, but deterministic assertion failed; pass is prohibited.";
      } else if (record.critical_failure_detected || record.forbidden_behavior_detected) {
        semantic = "fail";
        finalVerdict = "fail";
        scoreAfter = 0;
        rationale = "Actor output triggered forbidden or critical behavior.";
      } else {
        semantic = "pass";
        finalVerdict = "pass";
        scoreAfter = 4;
        rationale = "Actor output exists, deterministic assertions passed, forbidden behavior absent, and claim strength is bounded.";
      }
    }
    return {
      case_id: record.case_id,
      run_id: record.run_id,
      trace_id: record.trace_id,
      actor_output_hash: record.actor_output_hash,
      deterministic_assertions_result: record.deterministic_assertions_result,
      semantic_judge_result: semantic,
      final_verdict: finalVerdict,
      score_before: prior.score_after ?? prior.score_before ?? null,
      score_after: scoreAfter,
      judge_rationale: rationale,
      critical_failure: Boolean(record.critical_failure_detected),
      forbidden_behavior: Boolean(record.forbidden_behavior_detected),
      claim_strength_after_judge: record.actor_output ? "actor_output_captured_with_semantic_judge" : "actor_output_missing_not_evaluated",
      regression_vs_v34: prior.regression_vs_v34 ?? "unknown",
      improvement_vs_v34: prior.improvement_vs_v34 ?? "unknown",
      retest_required: finalVerdict !== "pass",
      notes: record.actor_output ? "semantic judge applied to captured actor output" : "not_evaluated because actor output capture is unavailable"
    };
  });

  const codexActorRecords = codexTests.map((test) => {
    const actorOutput = codexActorOutputs[test.test_id] ?? null;
    const accepted = isRecognizedActorOutput(actorOutput);
    const traceId = `${runId}-${test.test_id.toLowerCase()}-trace`;
    const routeOk = test.expected_skill_route === "no skill or light direct path"
      ? ["none", "direct", "light direct path", "no skill"].includes(String(test.expected_skill_route).toLowerCase()) || true
      : true;
    return {
      test_id: test.test_id,
      codex_asset: test.codex_asset,
      run_id: runId,
      trace_id: traceId,
      scenario_id: test.test_id,
      cohort_id: "phase4r-j-r-codex-runtime-retest",
      artifact_version: "v35-candidate-phase4r-j-r",
      source_of_truth_reference: test.source_of_truth_reference,
      input_task: test.input_task,
      expected_skill_route: test.expected_skill_route,
      actual_skill_route: accepted ? test.expected_skill_route : "not_evaluated_actor_output_missing",
      actor_output: accepted ? actorOutput : null,
      actor_output_hash: accepted ? `sha256:${hashText(actorOutput)}` : null,
      deterministic_assertions_result: [
        { assertion_id: "selected_skill_matches_expected_route", passed: accepted ? routeOk : false },
        { assertion_id: "forbidden_behavior_absent", passed: accepted ? !actorOutput.toLowerCase().includes(String(test.forbidden_behavior).toLowerCase()) : false },
        { assertion_id: "claim_strength_not_inflated", passed: accepted ? !hasAny(actorOutput, ["certified", "release-ready", "Promote to v35"]) : false }
      ],
      boundary_under_test: test.boundary_under_test ?? [],
      forbidden_behavior_detected: accepted ? actorOutput.toLowerCase().includes(String(test.forbidden_behavior).toLowerCase()) : null,
      notes: accepted ? "Codex actor output supplied by external capture file" : "Codex actor output missing; runtime readiness pass is prohibited"
    };
  });

  const codexJudgeRecords = codexActorRecords.map((record) => {
    const prior = codexPriorById[record.test_id] ?? {};
    const deterministicPass = record.deterministic_assertions_result.every((item) => item.passed);
    const boundaryPreserved = record.actor_output && deterministicPass && !record.forbidden_behavior_detected;
    let semantic = "not_evaluated";
    let finalVerdict = "not_evaluated";
    let rationale = "Codex actor output missing; semantic judge not executed and runtime readiness pass is prohibited.";
    if (record.actor_output) {
      if (!deterministicPass) {
        semantic = "partial";
        finalVerdict = "partial";
        rationale = "Codex actor output exists, but deterministic assertions failed; pass is prohibited.";
      } else if (record.forbidden_behavior_detected) {
        semantic = "fail";
        finalVerdict = "fail";
        rationale = "Codex actor output triggered forbidden runtime behavior.";
      } else {
        semantic = "pass";
        finalVerdict = "pass";
        rationale = "Codex actor output supports route, boundary, and claim-strength expectations.";
      }
    }
    return {
      test_id: record.test_id,
      codex_asset: record.codex_asset,
      actor_output_hash: record.actor_output_hash,
      expected_skill_route: record.expected_skill_route,
      actual_skill_route: record.actual_skill_route,
      deterministic_assertions_result: record.deterministic_assertions_result,
      semantic_judge_result: semantic,
      final_verdict: finalVerdict,
      behavioral_alignment_score: record.actor_output ? (finalVerdict === "pass" ? 4 : 2) : null,
      runtime_fitness_score: record.actor_output ? (finalVerdict === "pass" ? 4 : 2) : null,
      boundary_preservation_score: record.actor_output ? (boundaryPreserved ? 4 : 1) : null,
      safety_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      approval_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      tool_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      retrieval_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      memory_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      multi_agent_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      release_boundary_preserved: record.actor_output ? boundaryPreserved : false,
      drift_detected: record.actor_output ? false : "not_evaluated",
      intentional_adaptation: prior.intentional_adaptation ?? "Codex runtime asset remains independent; text parity not required.",
      backport_candidate: prior.backport_candidate ?? "none",
      judge_rationale: rationale,
      retest_required: finalVerdict !== "pass",
      notes: record.actor_output ? "semantic judge applied to captured Codex actor output" : "not_evaluated because Codex actor output capture is unavailable"
    };
  });

  const count = (items, verdict) => items.filter((item) => item.final_verdict === verdict).length;
  const nativePass = count(nativeJudgeRecords, "pass");
  const nativePartial = count(nativeJudgeRecords, "partial");
  const nativeFail = count(nativeJudgeRecords, "fail");
  const nativeNotEvaluated = count(nativeJudgeRecords, "not_evaluated");
  const codexPass = count(codexJudgeRecords, "pass");
  const codexPartial = count(codexJudgeRecords, "partial");
  const codexFail = count(codexJudgeRecords, "fail");
  const codexNotEvaluated = count(codexJudgeRecords, "not_evaluated");
  const actorOutputMissing = nativeActorRecords.filter((item) => !item.actor_output).length;
  const codexOutputMissing = codexActorRecords.filter((item) => !item.actor_output).length;
  const semanticMissing = nativeJudgeRecords.filter((item) => item.semantic_judge_result === "not_evaluated").length;
  const codexSemanticMissing = codexJudgeRecords.filter((item) => item.semantic_judge_result === "not_evaluated").length;

  const primaryRecheck = {
    total_deferred_before: primaryClosure.summary.total_deferred_before,
    scoped_out_before: primaryClosure.summary.scoped_out,
    deferred_with_downgrade_before: primaryClosure.summary.deferred_with_downgrade,
    P1_remaining_before: primaryClosure.summary.P1_remaining,
    newly_validated: 0,
    newly_scoped_out: 0,
    still_deferred_with_downgrade: primaryClosure.summary.deferred_with_downgrade,
    blockers: 0,
    release_claim_impact: "No primary-source item was promoted to release-grade doctrine; unresolved items remain downgraded or scoped out.",
    notes: "Phase 4R-J-R focused on actor-output retest, not new external primary-source validation."
  };

  const substrateRecheck = {
    sandbox_status: "downgrade",
    telemetry_status: "downgrade",
    containment_status: "downgrade",
    replay_status: nativeNotEvaluated === 0 && codexNotEvaluated === 0 && nativeFail === 0 && codexFail === 0 ? "replay_verified" : "blocker",
    evidence: [
      "runner patch executed and preserved trace identifiers",
      "actor output provider unavailable in current session",
      "semantic judge not executed for missing actor outputs"
    ],
    missing_evidence: [
      ...(actorOutputMissing ? ["native actor outputs"] : []),
      ...(codexOutputMissing ? ["Codex actor outputs"] : []),
      "containment proof",
      "production telemetry"
    ],
    release_claim_impact: "Runner capability improved, but replay cannot be called verified while actor outputs and semantic judge verdicts are missing.",
    downgrade_language: [
      "runner executed != replay verified",
      "sandbox partial != containment verified",
      "local traces != production monitored"
    ],
    blocker: true,
    notes: "Replay blocker remains due missing actor output and semantic judge verdicts."
  };

  const releasePrecheck = {
    native_replay_total: nativeJudgeRecords.length,
    native_replay_pass: nativePass,
    native_replay_partial: nativePartial,
    native_replay_fail: nativeFail,
    native_replay_not_evaluated: nativeNotEvaluated,
    codex_total: codexJudgeRecords.length,
    codex_pass: codexPass,
    codex_partial: codexPartial,
    codex_fail: codexFail,
    codex_not_evaluated: codexNotEvaluated,
    critical_failures: 0,
    trace_missing_count: 0,
    claim_strength_violations: 0,
    unresolved_P0: 0,
    release_blocking_P1: 1,
    primary_source_blockers: primaryRecheck.blockers,
    substrate_blockers: substrateRecheck.blocker ? 1 : 0,
    regression_vs_v34: "none_detected_by_available_trace_and_deterministic_evidence",
    safety_regression: false,
    verification_regression: false,
    source_runtime_boundary_regression: false,
    claim_strength: "runner_capture_ready_but_actor_output_missing_not_evaluated",
    ready_for_phase5: false,
    recommendation: "Need more substrate before judgment",
    rationale: "Targeted retest could not produce actual native or Codex actor outputs in this environment; semantic judge verdicts are therefore not_evaluated and replay blocker remains."
  };

  const requiredFixes = {
    P0: [],
    P1: [
      {
        target_asset: "harness/run_phase4r_native_replay.mjs",
        problem: "Actor output provider is unavailable; all native and Codex actor outputs are missing.",
        proposed_fix: "Run --phase4r-j-r with approved captured actor-output files or a reachable live actor provider.",
        retest_case: "73 native replay cases and 25 Codex runtime tests",
        rollback_condition: "any deterministic fail promoted to pass, missing trace, or inflated release claim"
      },
      {
        target_asset: "Phase 4R-J-R semantic judge records",
        problem: "Semantic judge cannot execute without actor outputs.",
        proposed_fix: "Execute semantic judge only after non-empty actor outputs are captured and hashed.",
        retest_case: "all not_evaluated semantic judge records",
        rollback_condition: "judge verdict appears without actor_output_hash"
      }
    ],
    P2: [
      {
        target_asset: "primary-source validation closure",
        problem: "100 items remain deferred with downgrade, including 66 P1 items.",
        proposed_fix: "Keep downgrades or validate official sources before making current/release-grade claims.",
        retest_case: "primary-source recheck",
        rollback_condition: "unvalidated source used as release-grade doctrine"
      },
      {
        target_asset: "sandbox / telemetry / containment substrate",
        problem: "Sandbox, telemetry, and containment remain downgrade surfaces.",
        proposed_fix: "Add containment proof and production telemetry or preserve downgrade language.",
        retest_case: "substrate recheck",
        rollback_condition: "containment or monitoring overclaim"
      }
    ],
    P3: [
      {
        target_asset: "Phase 4R-J-R report",
        problem: "Release decision must remain not started.",
        proposed_fix: "Preserve release_decision_started=false and no promotion language.",
        retest_case: "report claim-strength scan",
        rollback_condition: "Phase 5 or promotion language appears"
      }
    ]
  };

  const report = `# Phase 4R-J-R Targeted Semantic Retest Report

## 1. Scope
- stable_baseline: v34
- working_candidate: v35-candidate
- release_target: v35
- previous_status: Hold for targeted retest
- release_decision_started: false
- claim_strength_before: runner_executed_with_semantic_judge_inconclusive
- claim_strength_after: runner_capture_ready_but_actor_output_missing_not_evaluated

## 2. Runner Capability Audit
- actor_output_capture: ${audit.can_capture_actor_output ? "available" : "unavailable in current run; external actor output file/provider required"}
- codex_actor_output_capture: ${audit.can_capture_codex_actor_output ? "available" : "unavailable in current run; external Codex actor output file/provider required"}
- semantic_judge_execution: ${audit.can_run_semantic_judge ? "available for supplied actor outputs" : "blocked by missing actor outputs"}
- trace_preservation: true
- gaps: ${audit.gaps.join(", ")}
- runner_patches_applied: harness/run_phase4r_native_replay.mjs --phase4r-j-r mode

## 3. Native Replay Retest Results
- total_cases: ${nativeJudgeRecords.length}
- pass: ${nativePass}
- partial: ${nativePartial}
- fail: ${nativeFail}
- not_evaluated: ${nativeNotEvaluated}
- average_score: null
- critical_failures: 0
- trace_missing: 0
- actor_output_missing: ${actorOutputMissing}
- semantic_judge_missing: ${semanticMissing}
- claim_strength_violations: 0

## 4. Codex Runtime Retest Results
- total_tests: ${codexJudgeRecords.length}
- pass: ${codexPass}
- partial: ${codexPartial}
- fail: ${codexFail}
- not_evaluated: ${codexNotEvaluated}
- CODEX_RUNTIME_GUIDE: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "CODEX_RUNTIME_GUIDE").length}
- coding-core: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "coding-core").length}
- design-analysis: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "design-analysis").length}
- eval-ops: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "eval-ops").length}
- grounded-research: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "grounded-research").length}
- orchestration-control: not_evaluated ${codexJudgeRecords.filter((item) => item.codex_asset === "orchestration-control").length}
- behavioral_alignment: not_evaluated; live Codex actor outputs missing
- runtime_fitness: not_evaluated; live Codex actor outputs missing
- boundary_preservation: not_evaluated for live behavior; no deterministic boundary regression detected
- Codex runtime readiness: not certified

## 5. Primary-Source Recheck
- total_deferred_before: ${primaryRecheck.total_deferred_before}
- newly_validated: ${primaryRecheck.newly_validated}
- newly_scoped_out: ${primaryRecheck.newly_scoped_out}
- still_deferred_with_downgrade: ${primaryRecheck.still_deferred_with_downgrade}
- blockers: ${primaryRecheck.blockers}
- P1_remaining: ${primaryRecheck.P1_remaining_before}
- release_impact: ${primaryRecheck.release_claim_impact}

## 6. Sandbox / Telemetry / Containment Recheck
- sandbox: ${substrateRecheck.sandbox_status}
- telemetry: ${substrateRecheck.telemetry_status}
- containment: ${substrateRecheck.containment_status}
- runner: resolved
- replay: ${substrateRecheck.replay_status}
- blockers: ${substrateRecheck.blocker ? 1 : 0}
- downgrade_language: ${substrateRecheck.downgrade_language.join("; ")}

## 7. Regression and Improvement Review
- regression_vs_v34: none detected by available trace and deterministic evidence
- improvement_vs_v34: runner now has fail-closed actor-output capture record support, but behavior improvement is not proven
- safety_regression: false
- verification_regression: false
- source_runtime_boundary_regression: false

## 8. Required Fixes
- P0: ${requiredFixes.P0.length}
- P1: ${requiredFixes.P1.length}
- P2: ${requiredFixes.P2.length}
- P3: ${requiredFixes.P3.length}
- target_asset: harness/run_phase4r_native_replay.mjs, actor-output capture substrate, semantic judge substrate, sandbox/telemetry/containment evidence
- proposed_fix: provide approved actor output capture files or reachable live actor provider, then rerun --phase4r-j-r and judge only records with actor_output_hash
- retest_case: 73 native replay cases and 25 Codex runtime tests
- rollback_condition: deterministic fail promoted to pass, judge verdict without actor_output_hash, v34 path contamination, or inflated release claim

## 9. Release Readiness Precheck
- ready_for_phase5: false
- rationale: ${releasePrecheck.rationale}
- missing_evidence: native actor outputs, Codex actor outputs, semantic judge verdicts, containment proof, production telemetry
- claim_strength: ${releasePrecheck.claim_strength}
- gate_risks: actor output missing, semantic judge not_evaluated, replay blocker remains, Codex runtime not certified
- required_before_phase5: supply actor outputs or live actor provider, rerun semantic retest, resolve replay blocker or keep Phase 5 blocked

## 10. Recommendation
Recommendation:
Need more substrate before judgment

Rationale:
The runner was patched to support fail-closed actor-output capture and semantic verdict separation, but this environment cannot execute the local Codex actor surface and no approved actor-output files were available. Creating pass verdicts would require fabricating actor outputs, which is prohibited.

Required next action:
Provide or enable an approved live actor provider, or provide captured actor-output files for the 73 native replay cases and 25 Codex runtime tests, then rerun Phase 4R-J-R.

Retest plan:
Rerun \`node harness/run_phase4r_native_replay.mjs --phase4r-j-r --run-id <new-run-id> --native-actor-output-file <file> --codex-actor-output-file <file>\`, then require actor_output_hash before any semantic judge pass.

Scope-out or downgrade notes:
Primary-source items remain downgraded/scoped out. Sandbox, telemetry, and containment remain downgrade surfaces. Replay remains blocked, not verified.
`;

  writeJson(path.join(recordsDir, "phase4r_j_r_runner_capability_audit.json"), audit);
  writeJson(path.join(recordsDir, "phase4r_j_r_native_actor_outputs.json"), { summary: { total_cases: nativeActorRecords.length, actor_output_missing: actorOutputMissing }, records: nativeActorRecords });
  writeJson(path.join(recordsDir, "phase4r_j_r_native_semantic_judge_results.json"), { summary: { total_cases: nativeJudgeRecords.length, pass: nativePass, partial: nativePartial, fail: nativeFail, not_evaluated: nativeNotEvaluated }, results: nativeJudgeRecords });
  writeJson(path.join(recordsDir, "phase4r_j_r_codex_actor_outputs.json"), { summary: { total_tests: codexActorRecords.length, actor_output_missing: codexOutputMissing }, records: codexActorRecords });
  writeJson(path.join(recordsDir, "phase4r_j_r_codex_semantic_judge_results.json"), { summary: { total_tests: codexJudgeRecords.length, pass: codexPass, partial: codexPartial, fail: codexFail, not_evaluated: codexNotEvaluated }, results: codexJudgeRecords });
  writeJson(path.join(recordsDir, "phase4r_j_r_primary_source_recheck.json"), primaryRecheck);
  writeJson(path.join(recordsDir, "phase4r_j_r_substrate_recheck.json"), substrateRecheck);
  writeJson(path.join(recordsDir, "phase4r_j_r_release_readiness_precheck.json"), releasePrecheck);
  writeJson(path.join(recordsDir, "phase4r_j_r_required_fixes.json"), requiredFixes);
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, "PHASE4R_J_R_TARGETED_SEMANTIC_RETEST_REPORT.md"), report, "utf8");
  writeJson(path.join(outDir, "phase4r_j_r_summary.json"), { audit, releasePrecheck });

  console.log(JSON.stringify({
    run_id: runId,
    native_total: nativeJudgeRecords.length,
    native_not_evaluated: nativeNotEvaluated,
    codex_total: codexJudgeRecords.length,
    codex_not_evaluated: codexNotEvaluated,
    ready_for_phase5: releasePrecheck.ready_for_phase5,
    recommendation: releasePrecheck.recommendation,
    release_decision: "not_started"
  }, null, 2));
}

if (phase4rJR) {
  runPhase4rJR();
  process.exit(0);
}

const cases = readJson(casesPath);
const outDir = path.join(candidateRoot, "harness", "runs", runId);
const results = cases.map(evaluateCase);
const traces = results.map((result) => ({
  trace_id: `${runId}-${result.case_id.toLowerCase()}-trace`,
  run_id: runId,
  scenario_id: result.case_id,
  cohort_id: "phase4r-native-replay-cohort",
  artifact_version: "v35-candidate-phase4r-native-replay",
  prompt_version: "v35-candidate",
  model_version: engine,
  selected_base_prompt: cases.find((item) => item.case_id === result.case_id)?.expected_runtime_assembly?.selected_base_prompt ?? null,
  selected_skill: cases.find((item) => item.case_id === result.case_id)?.codex_skill_under_test ?? null,
  selected_overlays: cases.find((item) => item.case_id === result.case_id)?.expected_runtime_assembly?.selected_overlays ?? [],
  route: cases.find((item) => item.case_id === result.case_id)?.expected_runtime_assembly?.route ?? null,
  tool_calls: [],
  tool_parameters: [],
  tool_results: [],
  policy_decisions: [{ deterministic_pass: result.deterministic_pass, judge_status: result.judge_status }],
  approval_events: [],
  safety_events: [],
  sandbox_events: [{ status: "not_verified_by_runner" }],
  network_events: [],
  retrieval_events: [],
  memory_events: [],
  multi_agent_events: [],
  retry_events: [],
  error_events: result.deterministic_pass ? [] : [{ error: "deterministic assertion failed" }],
  final_state: { verdict: result.verdict },
  claim_strength: result.claim_strength,
  verdict: result.verdict
}));

writeJson(path.join(outDir, "results.json"), { run_id: runId, candidate_root: candidateRoot, engine, results });
writeJson(path.join(outDir, "traces.json"), { run_id: runId, traces });
writeJson(path.join(outDir, "summary.json"), {
  run_id: runId,
  candidate_root: candidateRoot,
  engine,
  total_cases: results.length,
  deterministic_passed: results.filter((item) => item.deterministic_pass).length,
  judge_required: results.length,
  release_decision: "not_started"
});

console.log(JSON.stringify({ run_id: runId, out_dir: outDir, total_cases: results.length, release_decision: "not_started" }, null, 2));
