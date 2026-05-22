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

It is derived primarily from:
- `PROMPT_full`
- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
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
- prompt-stack integrity

Examples:
- task success
- contract adherence
- latency
- token cost
- failure rate
- retry rate
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

## 8. Drift and Anomaly Discipline

Drift sources may include:
- data shifts
- task mix changes
- user behavior changes
- tool behavior changes
- prompt rewrites
- dependency or model updates

Anomalies may include:
- abrupt quality collapse
- unusual retry bursts
- latency spikes
- tool-call pattern shifts
- strange coordination failures
- rubric-score divergence

Rules:
- assess drift over time, not from one noisy point
- repeated anomalies matter more than isolated harmless spikes
- trigger diagnosis, not just alert accumulation
- if evidence is weak, say so

## 9. Prompt / Release / Workflow Integrity

For prompt-stack or workflow reviews, detect at least:
- semantic regressions
- ownership drift
- variant inconsistency
- boundary duplication
- coverage regression
- compression failure
- rewrite-induced contradiction
- safety-surface regression

Rules:
- judge rewrites by changed behavior, not textual elegance
- same names with new wording are not automatically stable
- a version that reads better but drops owned coverage is not an improvement
- a candidate that scores well on utility but regresses on safety or ownership integrity is not release-ready

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

Threshold rules:
- define thresholds only where action follows
- safety and compliance thresholds should be stricter than stylistic ones
- noisy metrics require stronger evidence before disruptive rollback

A gate is not real unless it has:
- owner
- threshold
- action

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

## 14. Final Rule

Evaluate only what matters for the decision.
Use metrics tied to action.
Compare against stable baselines.
Detect regression, drift, anomaly, and semantic loss explicitly.
Judge versions by behavior, not wording polish.
Preserve release integrity over cosmetic improvement.
