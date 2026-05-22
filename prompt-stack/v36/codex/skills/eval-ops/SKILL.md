---
name: eval-ops
description: Use for evaluation design, scorecards, regression review, drift or anomaly analysis, release-readiness checks, benchmark comparison, and prompt or workflow quality-control tasks.
---

# Evaluation and Operations Skill

This skill is the primary execution pack for evaluation, monitoring, regression control, and release-quality reasoning.

It extends the base constitution with:
- formal evaluation activation rules
- metric taxonomy
- scorecard and rubric design
- regression / drift / anomaly handling
- release-gating logic
- semantic drift and coverage regression checks
- prompt-stack / candidate / workflow comparison discipline
- safety-surface and guardrail-fidelity evaluation
- stagnation-threshold and long-run monitoring control
- measurement-substrate readiness checks before hard release conclusions
- harness-first evaluation routing when trace, runner, sandbox, or telemetry quality is the real review surface

It is derived primarily from:
- `PROMPT_full`
- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
- `04_harness/PROMPT_harness_engineering.md`
- `04_harness/PROMPT_harness_contracts.md`
- `04_harness/PROMPT_harness_release_gate.md`
- selected `PROMPT_guardrails_safety_overlay` principles for safety-surface evaluation
- release / scorecard / rubric-oriented example families where useful

## 1. When to Use

Use this skill when one or more apply:
- agent behavior must be compared across releases, candidates, prompts, tools, or workflows
- the task is to design or interpret an eval
- regression detection matters
- release or rollout decisions depend on measurable criteria
- drift, anomaly, or canary monitoring is relevant
- a scorecard, rubric, or benchmark memo is needed
- an attached guide, canon, or pattern document is being used to benchmark prompt-stack reflection or chapter-family carryover
- semantic drift, coverage regression, or variant consistency must be checked
- the user asks whether a candidate is release-ready

Do not use this skill when:
- the task is a trivial one-shot answer
- a simple local verification step is enough
- no monitoring or comparison decision depends on the output
- the work is exploratory and not evaluation-driven

## 2. Primary Mission

Produce trustworthy evaluation and monitoring signals that improve deployment and versioning decisions.

This includes:
- choosing the right evaluation surface
- selecting metrics that map to decisions
- comparing against stable baselines
- detecting meaningful regression
- surfacing drift and anomaly honestly
- preserving semantic behavior over wording polish

## 3. Evaluation Surfaces

Select the surface that actually matters.

Typical surfaces:
- output quality
- process / trajectory quality
- system performance
- safety / compliance
- collaboration quality
- prompt-stack integrity

Safety-surface examples include:
- unsupported-claim rate
- approval-boundary violations
- containment or rollback trigger rate
- guardrail-escalation fidelity

Rules:
- do not measure before defining what quality means for this system
- do not over-expand to every surface if only one or two matter
- do not let a single metric dominate a multi-dimensional task

## 4. Contract-First Evaluation

Whenever possible, define:
- expected deliverable
- required sections or schema
- allowed scope
- forbidden scope
- evidence or risk behavior
- acceptance criteria
- stop conditions
- pass/fail threshold if applicable

Rules:
- evaluate against what was actually promised
- do not punish the system for not doing what was outside the contract
- if the contract is weak, fix the contract before multiplying metrics

Decision-quality rule:
- define the actual decision, gate owner, solved condition, and escalation threshold before expanding metrics
- do not let repeated reruns substitute for a clearer contract or better instrumentation

Measurement-substrate readiness:
- cohort tags, identifiers, and metadata should be stable enough for the intended comparison
- logs, timestamps, retries, and failure states should be observable enough to support the claimed conclusion
- trajectory artifacts should exist if process quality is being evaluated
- rollback, quarantine, or hold actions should exist if the gate fails

Readiness rule:
- do not compensate for weak measurement substrate with more scoring sophistication
- if the substrate is weak, narrow claims, collect missing instrumentation, or treat the result as diagnostic rather than release-gating

### 4.1 Harness-first evaluation route

When the live question is not only output quality but harness quality itself:
- separate `Guide / Sensor / Runner / Simulator / Sandbox / Telemetry / Gate`
- capture or inspect trace before routing a failure directly to prompt rewrite
- distinguish `harness-designed`, `config-harness-ready`, `code-defined-harness-ready`, `harness-executed`, and `replay-verified`
- if only doctrine exists without executable substrate, keep the verdict at `harness-designed`
- if executable substrate exists without executed evidence, do not overstate `harness-executed`

Preferred owner artifacts for this route:
- `Harness Coverage Matrix`
- `Runner Contract`
- `Sandbox Policy`
- `Telemetry Schema`
- `Trace-to-Eval Conversion Record`
- `Production Monitoring Policy`
- `Telemetry Summary`
- `Drift Report`
- `Rollback / Escalation Decision`

## 5. Metric Taxonomy

Use grouped metrics rather than one vague score.

Potential groups:
- effectiveness
- efficiency
- reliability
- safety / compliance
- robustness
- user value
- collaboration quality
- adaptation quality
- lifecycle fidelity
- prompt-stack integrity

Examples:
- task success
- contract adherence
- latency
- token cost
- route quality
- priority quality
- budget adherence
- lifecycle fidelity
- adaptation safety drift
- quality-gate precision
- failure rate
- retry rate
- fallback quality
- exploration efficiency
- unsupported claim rate
- rubric score
- human-review rejection
- semantic drift count
- variant consistency failures
- coverage regression count
- rollback success rate
- guardrail-trigger correctness

Rule:
- if no decision depends on a metric, question its inclusion

## 6. Scorecards and Rubrics

A good scorecard or rubric should include:
- criteria
- scoring anchors
- pass/fail threshold where needed
- critical-failure override
- weighting if not equal
- recommendation logic

Rules:
- criteria must be legible and repeatable
- critical failures may override average quality
- judge language must reduce ambiguity
- simplify the rubric if it cannot be applied consistently

## 7. Regression Review Discipline

When comparing baseline vs candidate:
- preserve comparable conditions
- compare on the same evaluation surface
- identify whether decline is meaningful or noisy
- isolate critical-cohort failures
- treat safety regressions more strictly than cosmetic regressions

Check at least:
- task success change
- contract adherence change
- latency/cost change
- safety/compliance change
- trajectory or process quality change where relevant
- human-review acceptance change if applicable

Mock-tool and harness rule:
- when evaluating agentic tool behavior, prefer mock tools or a dedicated safe test environment over live irreversible systems
- assert tool-call parameters, partial-state handling, and final answer elements separately when possible

### 7.1 Preferred evaluation packets

When evaluation work must be reused or reviewed, prefer compact artifacts such as:
- mock-tool evaluation report
- safe trajectory artifact report
- harness coverage matrix
- runner contract
- sandbox policy
- telemetry schema
- trace-to-eval conversion record
- production monitoring policy
- telemetry summary
- drift report
- rollback / escalation decision
- benchmark comparison memo
- prompt-stack release review
- guide reflection benchmark memo when chapter-family question / answer / verdict loops are the live review surface
- source consultation ledger when research-transparency review is part of the gate
- packet compliance report when required-vs-optional artifact coverage is itself under review
- release evidence bundle memo when a pass/hold/reject decision depends on attached evidence rather than summary prose
- operational substrate readiness memo
- lifecycle event / audit trail memo
- goal-monitoring status memo
- recovery / escalation checkpoint memo
- quality iteration checkpoint memo
- learning-signal review memo
- adaptation decision memo
- HITL approval packet
- benchmark registry memo when scenario identity, cohort scope, or replay support must be defined before comparison
- context sufficiency review memo when context quality may explain performance changes
- critique quality review memo when iteration quality or no-gain-loop behavior is itself under evaluation
- adaptation promotion review memo when judged signals may change future defaults
- route-quality scorecard when branch quality, prioritization quality, or exploration quality is the live surface
- coding benchmark scenario memo when coding-agent proof depends on repo scope and verification-running expectations
- benchmark execution report when compared candidates have actually been run
- replay suite verdict memo when replay execution state and verdict reproducibility matter
- context failure taxonomy memo when substrate diagnosis is itself the evaluation output
- critique utility scorecard when refinement value, not mere critique presence, is the question
- adaptation lifecycle state memo when promoted, quarantined, or rolled-back states must be reviewed
- route re-prioritization audit memo when route switching quality matters
- coding proof bundle memo when engineering proof must distinguish executed-vs-unexecuted claims
- release evidence bundle v2 when promotion depends on integrated evidence rather than one memo
- telemetry trend memo when drift and trend interpretation matter
- plan approval checkpoint artifact

Packet rule:
- preserve the smallest artifact that lets another reviewer reproduce the gate decision
- do not inflate a simple compare/reject decision into a dashboard-shaped narrative

### 7.2 Coding prompt-package evaluation floor

When the candidate is a programming-oriented prompt package for coding agents, keep at least this evaluation mix visible:
- simple feature implementation x2
- complex feature implementation x2
- bug fix x2
- test writing x2
- code review x2
- security risk detection x2
- ambiguous requirement x1
- prompt injection or indirect prompt injection x1
- latest API or framework verification x1
- over-broad change pressure x1

Case contract:
- each case should define `input_prompt`, `expected_behavior`, `failure_behavior`, `scoring_criteria`, `auto_verifiable_or_not`, and `required_test_commands`
- keep `executed-vs-unexecuted` status explicit when the verdict depends on commands, tests, or harness runs
- if the case mix omits safety, freshness, or scope-stretch pressure, do not use strong release-ready language for the prompt package

Community-practice stress cases:
- almost-right-but-wrong code detection
- early wrong-assumption detection on intentionally ambiguous requirements
- over-broad change suppression for small bug-fix asks
- prompt-injection defense using issue title, PR body, README, or log content
- verification-loop compliance after a failing test
- checkpoint operation in long-running work
- context restraint when many irrelevant files are present
- code-understanding explanation quality for intent, invariants, and test rationale

## 8. Drift and Anomaly Discipline

Drift sources may include:
- data shifts
- task mix changes
- user behavior changes
- tool behavior changes
- adaptation-default changes
- coordination topology changes
- prompt rewrites
- dependency or model updates

Anomalies may include:
- abrupt quality collapse
- unusual retry bursts
- latency spikes
- tool-call pattern shifts
- lifecycle state mismatches
- quality-gate flip-flop
- adaptation drift suspicion
- strange coordination failures
- rubric-score divergence
- no-gain rerun loops

Rules:
- assess drift over time, not from one noisy point
- repeated anomalies matter more than isolated harmless spikes
- trigger diagnosis, not just alert accumulation
- if evidence is weak, say so
- if lifecycle labeling, checkpoint artifacts, or candidate identity are weak, narrow the gate conclusion before escalating it

## 9. Prompt / Release / Workflow Integrity

For prompt-stack or workflow reviews, detect at least:
- semantic regressions
- ownership drift
- variant inconsistency
- boundary duplication
- coverage regression
- host-runtime carryover regression
- packet-family completeness regression
- control-loop packet parity regression
- guide-vs-runtime lookup parity regression
- skill-layer packet parity regression
- coding-briefing carryover regression
- research-transparency regression
- resource-concurrency parity regression
- human-quality-gate carryover regression
- packet-compliance regression
- behavior-replay coverage regression
- delegation-join review regression
- approval-lifecycle carryover regression
- release-evidence coverage regression
- compression failure
- rewrite-induced contradiction
- safety-surface regression

Rules:
- judge rewrites by changed behavior, not textual elegance
- same names with new wording are not automatically stable
- a version that reads better but drops owned coverage is not an improvement
- a candidate that scores well on utility but regresses on safety or ownership integrity is not release-ready
- compressed-candidate release reviews should keep `coverage regression` and `host-runtime carryover regression` explicit rather than implied

## 10. Release-Gating Logic

Possible gates:
- release gate
- rollout gate
- canary continuation gate
- human-review gate
- compliance gate
- prompt-version promotion gate
- semantic-drift gate
- variant-consistency gate
- control-loop packet parity gate
- guide-vs-runtime lookup parity gate
- skill-layer packet parity gate
- quality-iteration continuation gate
- adaptation-promotion gate
- benchmark-registry gate
- context-sufficiency gate
- critique-quality gate
- route-quality gate
- coding-proof gate
- benchmark-execution gate
- replay-verdict gate
- adaptation-lifecycle gate
- telemetry-trend gate
- lifecycle-fidelity gate
- packet-compliance gate
- behavior-replay gate
- delegation-join gate
- approval-lifecycle gate
- release-evidence gate

Threshold rules:
- define thresholds only where action follows
- safety and compliance thresholds should be stricter than stylistic ones
- noisy metrics require stronger evidence before disruptive rollback
- when monitoring is iterative or continuous, define stagnation thresholds and intervention actions, not only quality thresholds
- when route choice changes across checkpoints, define continuation, fallback, and stop actions explicitly
- drift or anomaly close-outs should explicitly state classification (`drift`, `anomaly`, or `undetermined`), owner, threshold, and next action

A gate is not real unless it has:
- owner
- threshold
- action

### 10.1 Candidate labeling and gate integrity

For prompt, workflow, or release candidates, preserve at least:
- baseline identity
- candidate identity
- cohort or environment boundary
- gate owner
- pass / hold / reject outcome

Gate-integrity rule:
- if candidate identity or cohort labeling is ambiguous, narrow the conclusion before escalating the gate

### 10.2 Iteration-gated continuation

When the gate is mid-execution rather than final:
- preserve the current checkpoint state
- preserve the baseline or prior accepted state
- preserve the next route and fallback route
- preserve the stop trigger
- do not promote repeated improvement into a persistent default without an explicit adaptation decision

### 10.3 Guide-reflection benchmark loop

When an attached guide or pattern canon governs a prompt-stack review:
- define the in-scope chapter or pattern families before scoring
- generate benchmark questions that test decision-quality answerability, not mere keyword presence
- answer each question from the actual runtime, overlay, example, or skill surfaces under review
- verify each answer against the guide expectation and keep `direct`, `indirect`, `missing`, or `stale-owner` findings explicit
- patch the highest-signal gaps first, then rerun the same benchmark set instead of silently swapping questions

Stop rule:
- every in-scope family has at least one authoritative answer path in the reviewed prompt surfaces
- no required runtime behavior depends only on operator-facing prose
- no stale ownership claim survives in a runtime or skill surface
- remaining weaknesses, if any, are explicit `Need Verification` or explicit scope exclusions rather than hidden gaps

Keep these control families direct when the loop is active:
- `BR-00 / runtime owner integrity`
- chapter-family answerability

### 10.4 Harness-grade release labeling

When a gate speaks about harness quality, preserve:
- `prompt-reviewed`
- `harness-designed`
- `config-harness-ready`
- `code-defined-harness-ready`
- `harness-executed`
- `replay-verified`
- `release-gated`
- `production-monitored`

Labeling rule:
- do not let packet names or schema presence imply executed harness state
- do not let `config-harness-ready` impersonate `code-defined-harness-ready`
- do not let one successful run impersonate replay verification
- if sandbox, telemetry, or runner-readiness evidence is missing, downgrade before promotion language
- do not let `production-monitored` language appear without linked `telemetry_summary`, `drift_report`, and `rollback_escalation_decision`
- nested `codex exec` fallback may still be acceptable if actor/judge artifacts are emitted, the execution engine is explicitly marked, and `runner_failures = 0`
- document-benchmark to assembled-replay escalation
- `BR-19 / benchmark-loop adequacy`
- route-continuation judgment under cost, risk, and evidence strength

Family-specific sufficiency rule:
- for `BR-00 / runtime owner integrity`, document-level benchmark is sufficient when the reviewed runtime surfaces directly expose the owner boundary and no required behavior depends only on operator-facing prose
- for `BR-19 / benchmark-loop adequacy`, document-level benchmark is sufficient when the reviewed runtime surfaces directly expose the question -> answer -> verification -> rerun loop and explicit stop rule
- escalate those families to replay only when the claim is no longer about document/runtime parity and now depends on assembled behavior or actual runner execution state

Route-directness note:
- when `BR-00` and `BR-19` are the live benchmark families, treat the route as `direct` if the active runtime bundle itself exposes the owner boundary and benchmark-loop ladder
- do not downgrade the route to `indirect` merely because the benchmark-family IDs are evaluator tags rather than literal section headers, unless operator-facing prose or out-of-scope artifacts are actually required

Packet preference:
- `Benchmark registry memo` for chapter-family inventory and expected verdict surface
- `Guide reflection benchmark memo` for question / answer / comparison / rerun tracking
- `Prompt-stack release review` when the loop is deciding rewrite acceptance, release readiness, or parity preservation
- `Packet compliance report` when packet-floor doctrine is part of the failure surface

Operational escalation rule:
- if the live question has shifted from document reflection to assembled prompt behavior, escalate from `Guide reflection benchmark memo` to `Benchmark cohort manifest`
- if replay has actually been attempted, preserve `Replay runner verdict sheet` rather than prose-only replay status
- if multiple replayed scenarios must be summarized into one decision, preserve `Replay suite verdict memo` and keep partial coverage explicit

## 11. LLM-as-a-Judge Discipline

Use judge-like qualitative evaluation only when:
- exact-match metrics are insufficient
- the output is open-ended but contract-bound
- rubric-based qualitative comparison is needed
- trajectory review needs nuanced interpretation

Rules:
- use explicit criteria
- keep anchors visible
- separate factual scoring from style preference
- prefer comparative judging when absolute scales are unstable
- never treat a single judge score as unquestionable truth
- do not let judge-style scoring replace obvious deterministic harness checks

## 12. Reporting Contract

Unless the user requests another format, prefer:

### Acknowledgment
- restate the evaluation scope and compared systems

### Analysis
- define the evaluation surface, criteria, and relevant thresholds

### Execution
- present the scorecard, findings, or comparison result
- identify regressions, strengths, blockers, and recommendation

### Impact & Risk
- state release sensitivity, unresolved risks, drift signals, or anomaly concerns

### Verification
- state what evidence the evaluation is based on
- state what remains uncertain or weakly supported
- state the safest next step: approve, hold, re-test, narrow rollout, or reject

### 12.1 Evaluation close-out rule

A good Codex-facing eval close-out usually keeps:
- compared candidates or surfaces
- decisive regressions or passes
- gate outcome and owner-relevant next step
- one explicit uncertainty if instrumentation or cohorts were weak

## 13. Anti-Patterns

Avoid:
- measuring the wrong surface
- single-score worship
- style-based approval without semantic comparison
- comparing incomparable cohorts
- hiding severe small-cohort failures in averages
- low-value alert fatigue
- evaluation theater with no decision model
- treating dashboards as substitutes for grounded judgment
- hard release conclusions from opaque or weakly instrumented measurement surfaces
- treating harness doctrine documents as if they were already executed proof

## 14. Final Rule

Evaluate only what matters for the decision.
Use metrics tied to action.
Compare against stable baselines.
Detect regression, drift, anomaly, and semantic loss explicitly.
Judge versions by behavior, not wording polish.
Preserve release integrity over cosmetic improvement.
Keep adaptation safety and lifecycle fidelity visible when they affect the gate.
Prefer linked operational artifacts such as `Benchmark cohort manifest`, `Replay runner verdict sheet`, `Release promotion decision record`, and `Telemetry drift investigation memo` when the gate depends on repeated execution evidence.
Keep `scenario_id`, `run_id`, `cohort_id`, `trace_id`, and `artifact_version` stable across benchmark, replay, release, and telemetry gates.
If the required packet floor is missing or joined artifacts fail precedence, compatibility, freshness, or completeness checks, downgrade the gate and keep `false-promotion`, `false-hold`, and `drift-triggered review` separate.
Keep `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, and `unresolved join failure` explicit when they are the actual reason one gate must stay weaker, split, or blocked.
Treat `deterministic-local-fallback` as an explicit execution mode rather than silently equivalent to native nested Codex execution, and preserve the acceptance rule in the final gate note.

<!-- CURRENT_RUNTIME_REINFORCEMENT_START -->
## Current Package Eval Evidence Reinforcement

This runtime skill section strengthens release/eval discipline.

- LLM judge output cannot override deterministic failures, critical failures, or missing evidence.
- Small safety cohort failures are release blockers even when averages are high.
- Deterministic fallback is a diagnostic evidence class, not release-grade proof.
- Release-readiness language requires owner, threshold, action, rollback condition, and executed evidence.
<!-- CURRENT_RUNTIME_REINFORCEMENT_END -->
