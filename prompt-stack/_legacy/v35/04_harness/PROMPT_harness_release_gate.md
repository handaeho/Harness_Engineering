# PROMPT_harness_release_gate

## 0. Purpose

이 문서는 `v35` harness-grade release language와 downgrade rule을 정의한다.

## 1. Claim Ladder

- `prompt-reviewed`
  - prompt 문서 검토만 완료
- `harness-designed`
  - harness doctrine와 contract가 설계됨
- `config-harness-ready`
  - model, prompt, tools, memory, identity, sandbox, observability가 config surface로 연결됨
- `code-defined-harness-ready`
  - routing, custom orchestration, fallback, lifecycle control, replay or simulator runner가 구현됨
- `harness-executed`
  - 실제 eval run이 수행됨
- `replay-verified`
  - 동일 scenario가 재현 가능하게 rerun됨
- `release-gated`
  - explicit threshold, owner, action을 가진 gate를 통과함
- `production-monitored`
  - live telemetry와 anomaly response까지 연결됨

## 2. Harness Readiness Gate

release language 전에 최소 아래를 본다.

- repository map exists
- docs are linked and fresh
- `AGENTS.md` is short and map-like
- active docs are versioned
- execution plans are stored and reusable
- runtime substrate class is declared
- policy / observability / evaluation triangle is declared
- logs / metrics / traces are agent-readable
- UI or runtime behavior can be observed by agent when relevant
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

- prompt quality review보다 harness readiness gate가 먼저다.
- `docs present`와 `docs fresh`를 구분한다.
- `PR opened`와 `task complete`를 구분한다.
- `config-harness-ready`와 `code-defined-harness-ready`를 구분한다.

## 3. Downgrade Rules

- `04_harness` 문서만 있고 executable substrate가 비어 있으면:
  - stay at `harness-designed`
- config surface만 있고 custom orchestration evidence가 없으면:
  - do not use `code-defined-harness-ready`
- executable substrate가 있어도 run evidence가 없으면:
  - do not use `harness-executed`
- single run만 있고 rerun reproducibility가 없으면:
  - do not use `replay-verified`
- telemetry lineage가 없으면:
  - do not use `production-monitored`
- approval-sensitive action인데 approval event가 trace에 없으면:
  - lower proof strength
- docs는 있지만 freshness checks가 없으면:
  - do not use stronger than `harness-designed`
- repository map는 있지만 agent-readable observability나 invariant checks가 high-risk path에 없으면:
  - do not use stronger than `config-harness-ready`
- PR opened만 있고 reproduction / verification evidence가 없으면:
  - do not use `task-complete`, `coding-proof-grade`, or `release-gated`
- policy engine, observability pipeline, or evaluation pipeline 중 하나라도 enterprise-facing path에서 빠지면:
  - do not use `production-monitored`
- sandbox exists but containment or misconfiguration evidence가 없으면:
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

release gate는 `prompt quality`와 `harness execution quality`를 분리해서 본다.

둘 중 하나라도 약하면 stronger release claim을 금지한다.

## 8. Claim Strength Gate

- `plausible`
- `locally-checked`
- `runner-executed`
- `replay-verified`
- `integration-verified`
- `release-gated`
- `production-monitored`

Rule:

- claim wording은 가장 강한 실제 evidence surface까지만 올라간다.

<!-- V35_RELEASE_STABLE_PATCH_START -->
## v35 Release Gate Downgrade and Codex Runtime Independence

This v35 release addendum adds release-gate blockers and downgrades.

- Deterministic-local fallback is not release-grade proof.
- Native replay requires a v35 asset root, executed actor/judge or explicitly accepted deterministic substitute, complete traces, and verdict records.
- Codex runtime readiness is separate from source-of-truth stack readiness.
- Codex runtime cannot be called certified unless CODEX_RUNTIME_GUIDE and each skill pass runtime behavior tests.
- Primary-source validation gaps for current/model/API/tool claims must be validated or downgraded before release language.
- Sandbox exists, telemetry exists, trace captured, docs present, and replay-ready are weaker than containment verified, production monitored, evaluation passed, docs fresh, and replay verified.
<!-- V35_RELEASE_STABLE_PATCH_END -->
