# PROMPT_harness_release_gate

## 0. Purpose

This document defines `active package` harness-grade release language and downgrade rules.

## 1. Claim Ladder

- `prompt-reviewed`
  - only prompt documents were reviewed
- `harness-designed`
  - harness doctrine and contracts were designed
- `config-harness-ready`
  - model, prompt, tools, memory, identity, sandbox, and observability are connected through a config surface
- `code-defined-harness-ready`
  - routing, custom orchestration, fallback, lifecycle control, replay runner, or simulator runner is implemented
- `harness-executed`
  - an actual eval run was executed
- `replay-verified`
  - the same scenario was rerun reproducibly
- `release-gated`
  - a gate with explicit threshold, owner, and action passed
- `production-monitored`
  - live telemetry and anomaly response are connected

## 2. Harness Readiness Gate

Before using release language, inspect at least the following:

- repository map exists
- docs are linked and fresh
- `AGENTS.md` is short and map-like
- active docs are versioned
- execution plans are stored and reusable
- runtime substrate class is declared
- policy / observability / evaluation triangle is declared
- logs / metrics / traces are agent-readable
- UI or runtime behavior can be observed by the agent when relevant
- local isolated runner exists
- deterministic architecture checks exist
- custom linters catch repeated agent failures
- test commands are known and runnable
- PR risk class is defined
- human escalation boundary is clear
- rollback path exists for risky work
- garbage collection loop exists for entropy control
- trace / run / cohort identifiers are preserved
- benchmark / replay claims are backed by actual execution state

Readiness rule:

- Harness readiness gate comes before prompt quality review.
- Distinguish `docs present` from `docs fresh`.
- Distinguish `PR opened` from `task complete`.
- Distinguish `config-harness-ready` from `code-defined-harness-ready`.

## 3. Downgrade Rules

- If only `04_harness` documents exist and executable substrate is empty:
  - stay at `harness-designed`
- If only config surface exists and custom orchestration evidence is absent:
  - do not use `code-defined-harness-ready`
- If executable substrate exists but run evidence is absent:
  - do not use `harness-executed`
- If there is only a single run and no rerun reproducibility:
  - do not use `replay-verified`
- If telemetry lineage is absent:
  - do not use `production-monitored`
- If an approval-sensitive action lacks an approval event in the trace:
  - lower proof strength
- If docs exist but freshness checks are absent:
  - do not use stronger than `harness-designed`
- If a repository map exists but agent-readable observability or invariant checks are missing on a high-risk path:
  - do not use stronger than `config-harness-ready`
- If only a PR was opened and reproduction / verification evidence is absent:
  - do not use `task-complete`, `coding-proof-grade`, or `release-gated`
- If a policy engine, observability pipeline, or evaluation pipeline is missing on an enterprise-facing path:
  - do not use `production-monitored`
- If sandbox exists but containment or misconfiguration evidence is absent:
  - do not use stronger than `code-defined-harness-ready`

## 4. P0 Gate Inputs

- `Harness Coverage Matrix`
- `Runner Contract`
- `Sandbox Policy`
- `Telemetry Schema`
- `Trace Schema`
- `trial_independence_check`
- stable lineage fields
- `Claim Strength Gate`

## 5. P1 Agent-First Gate Inputs

- `Repository Legibility Harness`
- `Documentation Freshness Harness`
- `Agent-Readable Observability Harness`
- `Architecture Invariant Harness`
- `Harness Failure Classification`
- `Agentic Garbage Collection Harness`
- `Throughput-Aware Review and Merge Harness`
- `End-to-End Agent Task Harness`
- `Human Taste Encoding Loop`
- `Agent-First Technology Choice Review`
- `Harness Readiness Checklist`
- `Runtime Substrate Contract`
- `Policy/Evaluation/Observability Triangle`
- `Tool Surface Quality Harness`
- `Sandbox Escape / Containment Harness`
- `Long-running Initializer Harness`

## 6. Gate Output Minimum

- `decision`
- `owner`
- `threshold`
- `action`
- `limitations`
- `missing_evidence`

## 7. Release Rule

The release gate evaluates `prompt quality` and `harness execution quality` separately.

If either surface is weak, stronger release claims are forbidden.

## 8. Claim Strength Gate

- `plausible`
- `locally-checked`
- `runner-executed`
- `replay-verified`
- `integration-verified`
- `release-gated`
- `production-monitored`

Rule:

- Claim wording may rise only to the strongest actually evidenced surface.

<!-- V35_RELEASE_STABLE_PATCH_START -->
## active package Release Gate Downgrade and Codex Runtime Independence

This active package release addendum adds release-gate blockers and downgrades.

- Deterministic-local fallback is not release-grade proof.
- Native replay requires a active package asset root, executed actor/judge or explicitly accepted deterministic substitute, complete traces, and verdict records.
- Codex runtime readiness is separate from source-of-truth stack readiness.
- Codex runtime cannot be called certified unless CODEX_RUNTIME_GUIDE and each skill pass runtime behavior tests.
- Primary-source validation gaps for current/model/API/tool claims must be validated or downgraded before release language.
- Sandbox exists, telemetry exists, trace captured, docs present, and replay-ready are weaker than containment verified, production monitored, evaluation passed, docs fresh, and replay verified.
<!-- V35_RELEASE_STABLE_PATCH_END -->
