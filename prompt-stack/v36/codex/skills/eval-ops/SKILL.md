---
name: eval-ops
description: Use for evaluation and operational quality control: scorecards, regression review, drift/anomaly analysis, benchmark comparison, release-readiness, and prompt/workflow quality gates. Do not use for ordinary code patches, pure research, architecture design, harness asset creation, or multi-agent topology.
---

# Evaluation and Operations Skill

## Purpose

Use this skill to decide whether behavior, prompts, workflows, candidates, releases, or operational signals meet an explicit quality bar. It turns vague confidence into measurable criteria, executed evidence, and honest gate language.

This skill is not a replacement for local code tests. It owns evaluation design, interpretation, regression detection, drift analysis, release-readiness, and quality-control reporting.

## When to use

Use `eval-ops` when:

- the user asks whether something is ready, better, regressed, stable, promoted, or release-worthy
- scorecards, rubrics, benchmark suites, canaries, ablations, or drift checks are needed
- prompt, workflow, model, tool, or candidate behavior must be compared against a baseline
- monitoring, telemetry, anomaly, rollback, quarantine, or gate decisions matter
- release or deployment language depends on evidence strength

Do not use it as primary owner when:

- the task is a bounded code edit, debug, refactor, test, or review; use `coding-core`
- the task is mostly source-backed research; use `grounded-research`
- the task is a design trade-off before an eval exists; use `design-analysis`
- the task creates harness artifacts rather than judging evidence; use `harness-creator-adapter`
- the task is mainly delegation topology; use `orchestration-control`

## Inputs

Collect the evaluation contract:

- decision to be made and gate owner
- candidate, baseline, version, run, scenario, cohort, trace, or artifact identifiers
- expected behavior, forbidden behavior, acceptance threshold, and stop conditions
- available logs, metrics, traces, judge outputs, tests, benchmark results, or telemetry
- known limitations, missing instrumentation, and freshness boundaries
- rollback, quarantine, hold, or escalation options if the gate fails

## Workflow

Use this flow:

`Analyze -> Plan -> Evaluate -> Compare -> Verify -> Report`

1. Analyze
   - State the decision and claim strength being requested.
   - Separate document completeness, benchmark registry, executed benchmark, replay verification, release gate, and production monitoring.

2. Plan
   - Define the evaluation surface: output quality, process quality, safety, reliability, performance, collaboration, prompt integrity, or operational readiness.
   - Choose metrics that map to the decision.
   - Define pass/fail, hold, quarantine, or partial-completion states.

3. Evaluate
   - Run or inspect the available checks.
   - Preserve scenario IDs, run IDs, cohort IDs, trace IDs, artifact versions, timestamps, and failure states when they matter.
   - Do not rerun blindly; diagnose failed or flaky checks.

4. Compare
   - Compare against a stable baseline or explicit contract.
   - Identify regressions, improvements, drift, and unresolved gaps.
   - Keep measurement-substrate weakness visible.

5. Verify
   - Confirm the evidence supports the requested gate language.
   - Downgrade claims when runs are missing, partial, stale, or unrepresentative.

6. Report
   - State verdict, evidence, failures, risk, and next action.

## Engineering rules

- Evaluate against the actual contract, not an implied ideal.
- Prefer executed evidence over prose, registry existence, or claimed coverage.
- Keep benchmark-designed, benchmark-executed, replay-verified, release-gated, and production-monitored states separate.
- Treat missing telemetry, weak cohort tags, stale fixtures, or unreadable traces as substrate defects.
- Use grouped metrics instead of one vague score when the decision is multi-dimensional.
- Preserve false-promotion, false-hold, rollback, stale context, ignored critique, and no-gain loop signals when diagnosing workflow quality.
- Use `harness-creator-adapter` when the missing item is an artifact to create, then return here to judge execution evidence.

## Verification

Before giving a verdict, check:

- decision and gate owner are explicit
- baseline and candidate are identifiable
- acceptance criteria and thresholds are stated
- evidence is executed, current, and relevant enough for the claim
- failure states and partial results are not hidden
- safety, approval, rollback, and monitoring implications are covered when relevant
- claim strength is downgraded if evidence is missing

Required language discipline:

- `diagnostic`: useful signal, not enough for a gate
- `locally checked`: local checks ran
- `benchmark-executed`: benchmark actually ran
- `replay-verified`: replay surface was executed and passed
- `release-gated`: release gate criteria passed
- `production-monitored`: production telemetry was observed

## Constraints

- Do not treat a benchmark suite file as an executed benchmark.
- Do not treat a passing local check as production readiness.
- Do not make release, promotion, containment, or monitoring claims without matching evidence.
- Do not overwrite release records, stable pointers, or reports unless the task explicitly asks and the approval boundary allows it.
- Do not use LLM-as-judge output without a rubric and calibration boundary when the decision is high impact.

## Output

Use a concise evaluation report:

- verdict: pass, fail, hold, partial, diagnostic, or blocked
- evaluated surface and contract
- evidence consulted or executed
- regression/drift findings
- failed or skipped checks
- risk and rollback/escalation path
- next required evidence for stronger claim

## Examples

- "Is v36 ready to promote based on these validation results?"
  - Use `eval-ops`.
  - Do not use `design-analysis` unless the next question is route choice.

- "Create a scorecard for comparing two prompt candidates."
  - Use `eval-ops`.
  - If the scorecard artifact itself becomes a new harness asset, use `harness-creator-adapter` for that artifact.

- "Fix the failing unit test."
  - Use `coding-core`, not `eval-ops`, unless the task is to interpret test trends or gate a release.

## Checklist

- [ ] Decision and claim strength are explicit.
- [ ] Baseline, candidate, and run identifiers are preserved.
- [ ] Metrics map to the decision.
- [ ] Executed evidence is separated from planned or registered evidence.
- [ ] Failures, skipped checks, and substrate gaps are visible.
- [ ] Verdict language is no stronger than evidence.
- [ ] Rollback, hold, quarantine, or escalation path is stated when relevant.
