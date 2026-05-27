---
name: harness-creator-adapter
description: Use for harness asset creation or adaptation: Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, and artifact-map work. Do not use for ordinary code fixes, release decisions, pure research, architecture design, or mirroring autonomous source assets into Codex runtime.
---

# Harness Creator Adapter Skill

## Purpose

Use this skill to create or revise local harness assets that improve agent continuity, verification, scope control, lifecycle closeout, validation, or benchmark readiness.

This skill adapts harness-engineering patterns into owner-correct Codex or prompt-stack artifacts. It does not copy autonomous source files into Codex runtime and does not make release decisions.

## When to use

Use `harness-creator-adapter` when the task asks to:

- create or improve Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, or artifact-map assets
- convert source material into local operational artifacts
- strengthen claim-strength, evidence, session continuity, progress tracking, or closeout behavior
- create feature lists, progress logs, decision logs, evidence logs, evaluator rubrics, benchmark suites, claim-strength checklists, clean-state checklists, or validation summaries
- adapt harness patterns without changing the autonomous source-of-truth bundle

Do not use it as primary owner when:

- the task is an ordinary code patch, bug fix, code review, test, debug, or refactor; use `coding-core`
- the task is a release decision, benchmark verdict, regression gate, or scorecard interpretation; use `eval-ops`
- the task is source-grounded research; use `grounded-research`
- the task is architecture trade-off analysis; use `design-analysis`
- the task is multi-agent handoff or topology coordination; use `orchestration-control`
- the user asks to mirror or copy autonomous source assets into Codex runtime

## Inputs

Identify:

- target subsystem: Instructions, State, Verification, Scope, or Lifecycle
- owner layer: autonomous source stack, Codex runtime package, shared state/verification/lifecycle, evidence/archive, or reports
- current asset path and intended consumer
- gap being fixed and the failure mode it prevents
- validation path and claim-strength boundary
- source material, if any, and whether it is authoritative, draft, evidence, or inspiration

## Workflow

Use this flow:

`Analyze -> Plan -> Create/Revise -> Test -> Verify -> Report`

1. Analyze
   - Name the harness gap and target subsystem.
   - Confirm the correct owner layer.
   - Separate active runtime assets from evidence, archive, and autonomous source assets.

2. Plan
   - Choose the smallest useful artifact change.
   - Decide whether to create, revise, or only propose a follow-up.
   - Define validation before editing.

3. Create/Revise
   - Extract actionable patterns; do not copy source prose wholesale.
   - Keep Codex runtime assets compact and execution-oriented.
   - Preserve autonomous-vs-Codex separation.

4. Test
   - Run existing validation runners when available.
   - Add or update validation fixtures only when they directly test the new or revised behavior.

5. Verify
   - Check owner layer, artifact purpose, validation path, claim strength, and routing boundaries.
   - Downgrade claims when only design exists without execution.

6. Report
   - State changed artifacts, subsystem, owner layer, validation, remaining risk, and next safe step.

## Engineering rules

- Prefer concrete artifacts over theory.
- Use one active artifact per control problem when possible.
- Make superseded lower-strength artifacts explicit if they remain.
- Preserve linked identifiers such as `scenario_id`, `run_id`, `cohort_id`, `trace_id`, or `artifact_version` when operational evidence depends on them.
- Treat source coverage, runner files, and validation suites as different proof classes.
- Keep validation expectations close to the artifact they validate.
- If a structural problem suggests a new Skill, record it as a follow-up candidate; do not create a new Skill during a fixed-scope six-Skill maintenance pass.

## Verification

Before closeout, check:

- target subsystem is explicit
- owner layer is correct
- artifact has a concrete use
- validation path exists
- claim strength is not inflated
- no autonomous source prose was copied wholesale into Codex runtime
- no autonomous/Codex mirror assumption was introduced
- state, verification, scope, lifecycle, or instruction gap is actually reduced
- next-session handoff exists when continuity is involved
- no release, production monitoring, or containment claim was made without evidence

Claim distinctions:

- source coverage is not execution proof
- harness-designed is not harness-executed
- runner-ready is not replay-verified
- local validation is not production monitoring
- sandbox exists is not containment verified
- telemetry plan is not production telemetry
- benchmark-designed is not benchmark-executed

## Constraints

- Do not use this skill for ordinary code fixes.
- Do not use it to approve releases.
- Do not mirror autonomous source files into Codex runtime.
- Do not silently change stable pointers, release registries, records, or reports outside the requested scope.
- Do not claim production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, or live-production-rollout-certified without matching evidence.

## Output

Report:

- changed artifact
- target subsystem
- owner layer
- validation path and result
- claim-strength boundary
- remaining unverified risk
- next safest step
- backport candidate, if any

## Examples

- "Create a claim-strength checklist for this prompt stack."
  - Use `harness-creator-adapter`.
  - Output a Verification artifact and validation expectation.

- "This bug needs a minimal code fix."
  - Use `coding-core`, not `harness-creator-adapter`.

- "Decide whether this candidate can be released."
  - Use `eval-ops`, not `harness-creator-adapter`.

- "Copy autonomous prompts into Codex skills."
  - Use this skill only to reject mirroring and propose owner-correct adaptation.

## Checklist

- [ ] Subsystem and owner layer identified.
- [ ] Smallest useful artifact selected.
- [ ] Autonomous/Codex boundary preserved.
- [ ] Validation path added or confirmed.
- [ ] Claim strength downgraded where evidence is partial.
- [ ] Scope-limited follow-ups recorded instead of out-of-scope creation.
- [ ] Closeout states changed artifact, validation, and remaining risk.
