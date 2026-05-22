---
name: harness-creator-adapter
description: Use when adapting harness-engineering patterns into this prompt stack by creating or revising Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, and harness artifacts. Do not use for ordinary code fixes, release decisions, or mirroring autonomous source assets into Codex runtime.
---

# Harness Creator Adapter Skill

## 1. When to Use

Use this skill when the task asks to:
- create or improve harness assets
- adapt Learn Harness Engineering patterns
- strengthen Instructions, State, Verification, Scope, or Lifecycle
- create feature lists, progress logs, session handoff, evaluator rubrics, benchmark suites, claim-strength checklists, clean-state checklists, or artifact maps
- improve agent continuity, verification, scope control, or lifecycle closeout
- convert source material into local operational artifacts
- prepare harness validation or ablation artifacts

## 2. Do Not Use When

Do not use this skill when:
- the task is an ordinary code patch
- the task is a narrow bug fix
- `coding-core` is the better runtime skill
- `eval-ops` is needed for release decision or release gate judgment
- `grounded-research` is needed for source-grounded research
- `design-analysis` is needed for architecture trade-off analysis
- `orchestration-control` is needed for multi-agent handoff or lifecycle coordination
- the user asks to copy autonomous source files into Codex runtime
- the task requires destructive action, deployment, or external mutation

## 3. Primary Mission

Adapt harness-engineering ideas into local, owner-correct, testable artifacts.

Priorities:
1. identify the target harness subsystem
2. select the correct owner layer
3. create the smallest useful artifact
4. preserve autonomous-vs-Codex separation
5. add validation expectations
6. keep claim strength aligned with available proof
7. leave a handoff that the next session can use

## 4. Runtime Model

Use this loop:

`Identify Subsystem -> Select Owner Layer -> Map Pattern -> Create Artifact -> Add Verification -> Check Boundary -> Summarize Handoff`

Subsystems:
- Instructions
- State
- Verification
- Scope
- Lifecycle

Owner layers:
- autonomous source stack
- Codex runtime package
- shared state / verification / lifecycle
- evidence / archive

## 5. Source-to-Asset Mapping

When source material is provided:
- do not copy source prose wholesale
- extract the actionable pattern
- map it to a local artifact
- define when the artifact is used
- define how the artifact is validated
- record what was deferred or archived

Examples:
- repository-as-system-of-record -> docs/ARTIFACT_MAP.md, state/evidence_log.json
- huge instruction file failure -> AGENTS.md router, MASTER_PROMPT_ROUTER.md
- long task continuity failure -> state/progress.md, session-handoff.md
- early completion failure -> verification/evaluator-rubric.md, claim_strength_checklist.json
- scope creep failure -> autonomous/07_scope/SCOPE_POLICY.md
- clean-state failure -> lifecycle/clean-state-checklist.md

## 6. Output Artifacts

Prefer concrete artifacts such as:
- AGENTS.md routing note
- MASTER_PROMPT_ROUTER update
- feature_list.json
- progress.md
- decision_log.md
- evidence_log.json
- session-handoff.md
- evaluator-rubric.md
- benchmark_suite.json
- ablation_plan.md
- claim_strength_checklist.json
- clean-state-checklist.md
- session-start.md
- session-closeout.md
- artifact map
- validation summary
- follow-up backlog

Avoid pure theory output unless the user explicitly asks for theory.

## 7. Codex Runtime Boundary

Codex runtime assets are not mirrors of autonomous source assets.

Rules:
- do not copy autonomous source files into Codex runtime
- do not treat Codex skill success as automatic source-of-truth backport
- do not treat autonomous source changes as Codex runtime validation
- preserve behavioral alignment, safety preservation, and runtime fitness
- use source-of-truth backport review before moving Codex improvements into autonomous doctrine
- keep Codex instructions execution-oriented and compact

## 8. Safety and Claim Strength

Maintain these distinctions:
- source coverage is not execution proof
- harness-designed is not harness-executed
- runner-ready is not replay-verified
- local validation is not production monitoring
- sandbox exists is not containment verified
- telemetry plan is not production telemetry
- benchmark-designed is not benchmark-executed

Never claim the following unless the evidence exists:
- production-monitored
- containment-verified
- all-primary-source-validated
- public-benchmark-certified
- live-production-rollout-certified

## 9. Verification Matrix

Before closeout, check:
- owner layer is correct
- artifact has a concrete use
- output is not just prose
- validation path exists
- claim strength is not inflated
- no source prose was copied wholesale
- no autonomous/Codex mirroring occurred
- state, verification, scope, or lifecycle gap is actually reduced
- next-session handoff exists when continuity is involved
- no release or deployment claim was made

## 10. Close-out Contract

At closeout, report:
- changed artifact
- target subsystem
- owner layer
- validation path
- remaining unverified risk
- next safest step
- backport candidate, if any

Do not say the harness is complete unless validation evidence supports it.

## 11. Anti-patterns

Avoid:
- copying source prose wholesale
- creating generic harness theory without local artifacts
- mirroring autonomous files into Codex runtime
- adding documents without validation path
- treating source coverage as execution proof
- treating harness-designed as harness-executed
- creating bulky governance docs inside Codex skills
- using this skill for ordinary code patches
- silently changing release registry or stable pointers
