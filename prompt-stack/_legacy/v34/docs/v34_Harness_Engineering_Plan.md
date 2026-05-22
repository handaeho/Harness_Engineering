# v34 Harness Engineering 계획

## 개요

`v34`는 `v33`의 현재 프롬프트 문서 구조와 내용을 그대로 계승한 뒤, 프롬프트 문장 개선 중심 스택에서 한 단계 나아가 `harness engineering`을 1급 설계 대상으로 승격하는 버전으로 정의한다.

이번 단계의 목표는 곧바로 대규모 재작성하는 것이 아니라, `v33`의 검증 자산과 운영 문서를 보존하면서 하네스 구성요소를 명시적 계약, 실행 자산, release gate 전제 조건으로 끌어올리는 것이다.

## 경로 규칙

- 별도 표시가 없으면 경로는 `v34` 루트 기준이다.
- 이전 버전 baseline만 `../v33`로 표기한다.
- 현재 계획 위치는 `this directory`로 줄여서 표기한다.
- 디렉터리 표기는 trailing slash 없이 유지한다.

## 분석

### 기준 상태

- baseline version:
  - `../v33`
- current v34 state:
  - `./`
- inheritance rule:
  - `v34`는 `v33`의 top-level 구조를 유지한다
  - 다만 `harness engineering`을 공식 구조로 승격하기 위해 `04_harness` layer를 새로 추가한다
  - 기존 runtime owner hierarchy는 파괴하지 않는다
  - 기존 prompt content는 additive patch 원칙으로만 확장한다

### v33이 이미 갖춘 것

- prompt-stack runtime constitution and overlay system
- document-level benchmark, separated external harness, frozen release gate
- packet-floor and operational-evidence doctrine
- mock-tool / replay / runner / coding-proof / telemetry 관련 artifact names
- basic harness scripts:
  - `harness/scenarios.json`
  - `harness/response_schema.json`
  - `harness/stack_eval_actor_schema.json`
  - `harness/stack_eval_response_schema.json`
  - `harness/run_external_harness.mjs`
  - `harness/run_prompt_stack_eval.mjs`
  - `harness/run_release_gate_repeats.mjs`
- current `harness` directory already functions as:
  - `v33` validation and replay substrate
  - executable runner / schema / run-output storage
  - but not as official runtime-owner prompt layer

### v33이 아직 충분히 승격하지 못한 것

- `Harness Coverage Matrix`가 없다
- `trace_required`, `trace_schema`, `trace_to_eval_conversion`이 없다
- clean-state / cache / shared-state / trial independence contract가 release gate 전제 조건으로 고정돼 있지 않다
- `Sandbox Policy`와 `Telemetry Schema`가 실제 harness asset으로 분리돼 있지 않다
- mock tool contract는 example and doctrine 수준이고, executable contract asset이 아니다
- user simulation harness가 없다
- long-running coding harness artifact contract가 없다
- current `scenarios.json`은 정적 single-turn review 질문 중심이다
- current runner outputs are verdict-centric and do not capture structured trace as first-class evidence
- repository legibility가 release-relevant harness surface로 승격돼 있지 않다
- documentation freshness가 CI / linter / doc-gardening harness로 내려가 있지 않다
- agent-readable observability contract가 없다
- architecture invariant가 deterministic check contract로 명시돼 있지 않다
- failure가 prompt failure와 harness failure taxonomy로 충분히 분리돼 있지 않다
- entropy / garbage collection loop가 없다
- throughput-aware review / merge harness가 없다
- end-to-end agent task loop artifact contract가 없다
- human taste encoding loop가 없다
- agent-first technology choice review가 없다
- harness readiness checklist가 release gate 앞단의 별도 gate로 고정돼 있지 않다
- managed runtime / config harness / code-defined harness distinction이 없다
- policy / observability / evaluation 삼각 제어가 운영 하네스 구조로 고정돼 있지 않다
- runtime / compute separation과 artifact store lineage가 substrate contract로 명시돼 있지 않다
- sandbox escape readiness와 containment architecture review가 없다
- claim-strength gate가 없다

### 설계 판단

- `v34`의 주된 변화는 새 base prompt를 만드는 것이 아니다
- `v34`의 주된 변화는 기존 prompt stack 위에 `Guide + Sensor + Runner + Simulator + Sandbox + Telemetry + Gate` 계층을 명시적으로 얹는 것이다
- 여기에 `Runtime Substrate + Policy + Observability + Evaluation + Artifact Store + Claim Strength Gate`를 운영 하네스 계층으로 추가한다
- 최신 확장에서는 이를 `Agent Runtime Operating System` 관점으로 재정의해 `docs/` 기반 runtime charter, component map, policy plane, sandbox policy, observability schema, replay harness, failure taxonomy, release gate 문서군까지 소유한다
- 따라서 `v34`의 변경은 다음 두 축으로 나눈다
  - prompt-layer augmentation
  - harness-layer implementation and artifactization
  - runtime-os documentation and structured registry layer

### 구조 결정: `04_harness` 대 `harness`

- `04_harness`는 새 공식 owner layer다
  - purpose:
    - harness engineering doctrine
    - harness component model
    - claim-language ladder
    - gate and downgrade rules
    - agent-readable harness usage guidance
  - non-purpose:
    - run output 저장
    - replay logs 저장
    - executable runner script 저장
- `harness`는 executable substrate다
  - purpose:
    - runner scripts
    - schemas
    - simulator fixtures
    - mock tool contracts
    - run outputs
    - freezes and replay artifacts
  - source policy:
    - `v33/harness`를 `v34`의 baseline execution substrate로 재사용하고 증설한다
- separation rule:
  - owner doctrine와 executable substrate를 한 디렉터리에 섞지 않는다
  - `04_harness` 없이 `harness`만 두면 harness engineering이 여전히 외부 검증 자산으로 남는다
  - `harness` 없이 `04_harness`만 두면 실행 가능한 harness 증거가 부족해진다

### v34 성공 조건

- `v33`의 prompt family / overlay family / skill family / example family / release docs 구조가 유지된다
- `04_harness`가 공식 stack layer로 추가된다
- `harness engineering` doctrine가 runtime-owner 문서와 operator-facing guide에 직접 노출된다
- trace-first evaluation, stable isolated runner, sandbox policy, telemetry schema가 실제 `harness` 자산으로 존재한다
- `04_harness`와 `harness`의 owner / execution 책임이 문서상 명확히 분리된다
- single-turn static cases 외에 simulation / mock-tool / long-running checkpoint evaluation surface가 추가된다
- release language가 `prompt-reviewed`와 `harness-executed`를 혼동하지 않도록 더 엄격해진다
- managed/config/code-defined/runtime-substrate distinction이 문서와 asset에 반영된다
- `Policy -> Observability -> Evaluation` 운영 폐루프가 release-grade harness의 기본 구조로 드러난다
- runtime/compute separation, artifact store, containment architecture, sandbox escape readiness가 safety substrate로 승격된다
- claim language가 `plausible`, `locally-checked`, `runner-executed`, `integration-verified`를 분리한다
- `docs/agent-runtime-os.md`와 supporting `docs` owner surface가 repo-legible Runtime OS manual로 추가된다
- `runtime_os_charter.json`, `runtime_component_map.json`, `context_pack_schema.json`, `tool_capability_registry.json`, `policy_rule_set.json`, `runtime_os_scenarios.json`이 structured operator substrate로 추가된다

## 실행 계획

### 단계 0: baseline 계승

1. `v33` 전체 구조를 `v34` baseline으로 복제한다.
2. `v34`에 `04_harness`를 새 공식 layer로 생성한다.
3. 기존 `harness`는 `v33` validation substrate를 계승한 execution directory로 유지한다.
4. `v34` 최초 상태를 `v33 inherited baseline + 04_harness added`로 명시한다.
5. `v34` 변경은 baseline diff가 읽히도록 additive patch로만 진행한다.

### 단계 1: prompt layer 증설

우선 수정 대상은 기존 owner surface를 유지하면서 하네스 엔지니어링 개념을 직접 노출하는 문서들이다.

#### 0. `04_harness`

- create new official harness-owner docs:
  - `04_harness/PROMPT_harness_engineering.md`
  - `04_harness/PROMPT_harness_contracts.md`
  - `04_harness/PROMPT_harness_release_gate.md`
- assign roles:
- `PROMPT_harness_engineering.md`
    - core definition, feedforward vs feedback, trace-first loop
    - repository legibility, documentation freshness, observability, invariant, entropy, throughput, and taste-encoding doctrine
    - managed/config/code-defined/runtime-substrate, policy/eval/observability triangle, containment, and claim-strength doctrine
  - `PROMPT_harness_contracts.md`
    - Guide / Sensor / Runner / Simulator / Sandbox / Telemetry / Gate component contract
    - repo-legibility / doc-freshness / observability / invariant / failure-taxonomy / review-merge / E2E-task / taste-encoding / tech-choice contract
    - runtime substrate / policy triangle / tool-surface / containment / long-running initializer / claim-strength contract
  - `PROMPT_harness_release_gate.md`
    - harness claim-language ladder, downgrade rules, release preconditions
    - harness-readiness checklist and readiness-before-release rule
    - config-harness-ready vs code-defined-harness-ready vs executed proof separation
- integration rule:
  - `04_harness`는 `02_overlays`를 대체하지 않는다
  - `02_overlays`는 도메인별 owner를 유지하고, `04_harness`는 cross-cutting harness doctrine를 소유한다

#### 1. `AGENTS.md`

- add:
  - harness definition as model-external operating substrate
  - feedforward vs feedback sensor distinction
  - trace-first failure handling
  - harness component diagnosis rule
  - repository-map and agent-first environment posture
  - harness failure classification awareness
  - config-harness / code-defined-harness / managed-runtime distinction
  - policy-before-action / observability-during-action / evaluation-after-action triangle
  - stronger claim-language ladder:
    - `prompt-reviewed`
    - `harness-designed`
    - `config-harness-ready`
    - `code-defined-harness-ready`
    - `harness-executed`
    - `replay-verified`
    - `release-gated`
    - `production-monitored`
- extend sections:
  - tool / external interaction discipline
  - retrieval / evidence discipline
  - verification doctrine
  - output contract

#### 2. `PROMPT_USER_GUIDE.md`

- add:
  - harness control-surface quick lookup
  - harness artifact escalation matrix
  - required vs recommended harness packet floor
  - operator guidance for when to stay document-level and when to escalate to trace / replay / simulation
  - OpenAI-style agent-first environment lookup for repo legibility, docs freshness, observability, invariants, entropy control, review/merge policy, E2E task loop, taste encoding, and tech choice
  - AWS/OpenAI-style runtime substrate, policy triangle, containment, and claim-strength lookup
- keep:
  - current assembly logic unchanged
- change:
  - treat harness artifacts as selectable operational surfaces, not just named example packets

#### 3. `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

- make this the primary owner for:
  - `Harness Coverage Matrix`
  - `trace_required`
  - `trace_schema`
  - `trace_to_eval_conversion`
  - stable isolated runner contract
  - user simulation harness
  - sensor taxonomy
  - benchmark contamination and private eval policy
  - limited `Harness Evolution Loop`
  - trace grading and trajectory matching mode
  - claim-strength gate for evaluation language
  - policy / observability / evaluation closed loop
- add explicit rule:
  - failure does not route directly to prompt rewrite
  - failure routes to harness-component diagnosis first

#### 4. `02_overlays/PROMPT_tool_protocol_overlay.md`

- make this the primary owner for:
  - mock tool contract fields
  - tool trajectory vs outcome policy
  - partial-state and unsafe-tool-call assertions
  - runner readiness vs tool correctness separation
  - tool-result telemetry fields
  - tool surface quality harness
  - config harness vs code-defined harness distinction
  - runtime / compute separation and artifact store handoff
  - long-running initializer / handoff artifact contract

#### 5. `02_overlays/PROMPT_guardrails_safety_overlay.md`

- elevate:
  - sandbox boundary
  - approval event logging
  - network policy boundary
  - secret exposure policy
  - rollback boundary
  - policy-as-code enforcement boundary
  - containment architecture as blast-radius control
  - sandbox escape readiness and misconfiguration tests
- add explicit rule:
  - no high-autonomy coding-agent release without sandbox boundary
  - no external-action autonomy without network policy

#### 6. `codex/CODEX_RUNTIME_GUIDE.md`

- add routing cues for:
  - `Harness Coverage Matrix`
  - `Runner Contract`
  - `Sandbox Policy`
  - `Telemetry Schema`
  - `Trace-to-Eval Conversion Record`
  - `Simulator Scenario Set`
  - `Runtime Substrate Contract`
  - `Policy/Evaluation/Observability Triangle`
  - `Tool Surface Quality Harness`
  - `Sandbox Escape / Containment Harness`
  - `Long-running Initializer Harness`
  - `Claim Strength Gate`
- make clear:
  - packet names alone do not prove executed harness state

#### 7. skill 문서

- `eval-ops/SKILL.md`
  - primary owner for trace-first eval loop and harness gate interpretation
- `coding-core/SKILL.md`
  - add long-running checkpoint harness closeout expectations
- `grounded-research/SKILL.md`
  - add trace-to-eval evidence packaging cue when research failures become reusable evals
- `design-analysis/SKILL.md`
  - keep minimal changes; only add harness-component comparison framing where route choice is the live issue

#### 8. `03_examples/PROMPT_example_catalog.md`

- add new example entries for:
  - `Harness Coverage Matrix`
  - `Runner Contract`
  - `Sandbox Policy`
  - `Telemetry Schema`
  - `Trace-to-Eval Conversion Record`
  - `Simulator Scenario Set`
  - `Mock Tool Contract`
  - `Sensor Inventory`
  - `Feedforward Guide Inventory`
  - `Feedback Sensor Inventory`
  - `Harness Gap List`
  - `Harness Patch Proposal`
  - `Rerun Verdict`
  - `Release Gate Decision`
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

### 단계 2: harness 자산 구현

`v34/harness`는 `v33`의 검증용 harness assets를 baseline execution substrate로 재사용하되, `04_harness`가 정의한 계약을 실제 실행 자산으로 내리는 계층으로 확장한다.

#### 디렉터리 책임 분리

- `04_harness`
  - authoritative prompt-layer harness doctrine
  - human / agent readable owner documents
- `harness`
  - executable harness substrate
  - scripts / schemas / fixtures / outputs / freezes
- rule:
  - top-level validation docs는 verdict와 evidence를 기록한다
  - `04_harness`는 doctrine을 소유한다
  - `harness`는 execution을 소유한다

#### 새 harness 계약

- `harness/trace_schema.json`
- `harness/telemetry_schema.json`
- `harness/sandbox_policy.json`
- `harness/runner_contract.json`
- `harness/trial_isolation_policy.json`
- `harness/mock_tool_contracts.json`
- `harness/simulated_user_scenarios.json`
- `harness/trace_to_eval_registry.json`
- `harness/sensor_inventory.json`
- `harness/feedforward_guide_inventory.json`
- `harness/harness_coverage_matrix.json`
- `harness/repository_legibility_harness.json`
- `harness/documentation_freshness_policy.json`
- `harness/observability_harness.json`
- `harness/architecture_invariant_harness.json`
- `harness/failure_classification.json`
- `harness/garbage_collection_policy.json`
- `harness/review_merge_policy.json`
- `harness/e2e_task_harness.json`
- `harness/human_taste_encoding.json`
- `harness/agent_first_technology_review.json`
- `harness/harness_readiness_checklist.json`
- `harness/runtime_substrate_contract.json`
- `harness/policy_eval_observability_triangle.json`
- `harness/tool_surface_quality_harness.json`
- `harness/sandbox_escape_harness.json`
- `harness/long_running_initializer_harness.json`
- `harness/claim_strength_gate.json`

#### runner 변경

- patch existing runners to:
  - emit stable `scenario_id`, `run_id`, `cohort_id`, `trace_id`, `artifact_version`
  - capture structured trace metadata in addition to final verdict JSON
  - record runner readiness vs execution success separately
  - record clean-state / cache / shared-state checks
  - refuse stronger verdict language when prerequisite contracts are absent

#### 새 실행 표면

- `mock-tool eval`
  - deterministic tool-call contract checking
- `trace-first replay`
  - trace capture before final-answer-only judging
- `user simulation`
  - multi-turn dynamic conversation evaluation
- `long-running coding harness`
  - checkpoint artifact continuity and bounded feature-slice verification
- `doc freshness harness`
  - cross-link, reference, stale-doc, and completed-plan drift detection
- `agent-readable observability harness`
  - log / metric / trace / DOM / screenshot / reproduction / verification access
- `architecture invariant harness`
  - deterministic boundary and compatibility enforcement
- `garbage collection loop`
  - entropy / drift cleanup and invariant-promotion workflow
- `throughput-aware merge harness`
  - risk-classed validation and merge-flow control
- `end-to-end agent task harness`
  - reproduce -> fix -> verify -> review -> merge-ready evidence flow
- `runtime substrate harness`
  - config / code-defined / managed runtime distinction, compute split, artifact store, session resume
- `policy/eval/observability triangle`
  - deterministic policy, continuous observability, post-action evaluation
- `sandbox escape / containment harness`
  - privileged-container, docker-socket, egress, cleanup, audit, nested isolation checks

### 단계 3: 새 v34 운영자 artifact

`v34`에서는 source-of-truth와 derived review surface를 분리한다.

- source-of-truth assets:
  - owner doctrine -> `04_harness`
  - executable / structured substrate -> `harness`
  - repo-local operating docs -> `docs`
- derived validation summaries and review packets:
  - `validation`
- execution plans:
  - `this directory`

즉, former top-level `v34_*.md` summary를 source-of-truth로 두지 않고, 검증용 / 리뷰용 surface는 `validation`으로 명시 분리한다.

### 단계 4: 시나리오 재설계

#### P0 시나리오 계열

- harness coverage audit
- stable isolated runner verification
- sandbox boundary verification
- trace schema emission and linkage verification

#### P1 시나리오 계열

- mock tool parameter discipline
- tool trajectory hard-check vs outcome-first flexible grading
- simulated user multi-turn completion
- long-running coding checkpoint continuity
- stale-doc candidate detection and doc-gardening review
- log / metric / trace / DOM / screenshot accessibility verification
- architecture invariant violation detection and actionable error repair
- failure taxonomy routing and owner-fix selection
- garbage-collection cleanup slice and invariant promotion
- PR risk-class routing and merge-policy downgrade behavior
- end-to-end reproduce -> fix -> verify -> PR evidence loop
- repeated review comment -> guide/linter/template promotion loop
- agent-first technology choice comparison
- policy decision, observability capture, evaluation verdict linkage
- runtime / compute separation and artifact-store lineage verification
- sandbox escape readiness / containment misconfiguration scenario
- claim-strength downgrade when proof surface is weaker than wording
- initializer artifact to long-running session handoff integrity

#### P2 시나리오 계열

- harness evolution loop proposal and rerun
- MCP red-team harness
- unverifiable claim harness

### 단계 5: release gate 재설계

`v34` release gate는 단순 scenario pass-rate 외에 harness readiness preconditions를 포함해야 한다.

#### 필수 gate 입력

- prompt stack diff status
- repository legibility status
- documentation freshness status
- observability harness status
- architecture invariant status
- runtime substrate status
- policy/eval/observability triangle status
- runner contract status
- trial independence status
- sandbox policy status
- telemetry schema status
- trace emission status
- failure classification taxonomy status
- garbage collection policy status
- review / merge risk-class policy status
- end-to-end task harness status
- human taste encoding status
- agent-first technology review status
- tool surface quality status
- sandbox escape readiness status
- claim-strength gate status
- long-running initializer artifact status
- rollback path status for risky work
- mock tool contract coverage
- simulator coverage
- rerun reproducibility status

#### 필수 downgrade 규칙

- `harness-designed` without executable artifacts:
  - do not use `config-harness-ready`
- `config-harness-ready` without custom orchestration evidence:
  - do not use `code-defined-harness-ready`
- `code-defined-harness-ready` without executed runs:
  - do not use `harness-executed`
- `replay-ready` without repeated successful rerun:
  - do not use `replay-verified`
- telemetry absent:
  - lower live monitoring or production autonomy claims
- `04_harness` doctrine exists but `harness` execution substrate is not updated:
  - do not use stronger than `harness-designed`
- docs present but freshness checks absent:
  - do not use stronger than `harness-designed`
- PR opened without reproduction / verification evidence:
  - do not use task-complete or coding-proof-grade language
- observability or invariant surface absent on high-risk coding path:
  - block stronger than `config-harness-ready`
- sandbox exists but containment or misconfiguration evidence가 없으면:
  - do not use stronger than `code-defined-harness-ready`
- trace captured but evaluation / grading rule absent:
  - do not treat trace capture as eval success

## 영향과 위험

### 기대 효과

- `v34`는 prompt-stack 평가를 하네스 운영 품질 평가로 확장한다
- `04_harness`와 `harness`의 분리로 owner 문서와 실행 자산의 경계가 명확해진다
- failure handling이 prompt rewrite bias에서 harness diagnosis bias로 이동한다
- release language가 문서 완성도와 실행 증빙을 더 엄격히 분리한다
- single-turn static review 중심 하니스에서 multi-turn, tool-mediated, long-running behavior harness로 확장된다
- OpenAI식 agent-first 개발환경 관점이 repo legibility, observability, invariant, entropy, merge policy까지 직접 확장된다

### 주요 위험

- scope expansion risk:
  - prompt stack upgrade가 harness platform rewrite로 비대해질 수 있다
- artifact inflation risk:
  - packet 이름만 늘고 executable surface가 따라오지 않을 수 있다
- layer confusion risk:
  - `04_harness`, `harness`, validation docs의 역할이 다시 섞일 수 있다
- runner complexity risk:
  - trace / telemetry / simulator를 한 번에 넣으면 flakiness가 증가할 수 있다

### 완화 방안

- P0 / P1 / P2 phased rollout 유지
- top-level structure는 유지하고 harness sub-assets만 증설
- `04_harness`는 owner docs만, `harness`는 execution assets만 둔다
- prompt edits보다 harness contract additions를 우선
- new artifact는 실행 자산 또는 explicit placeholder owner 없이 추가하지 않는다

## 검증

### 계획 단계 완료 기준

- `v34`의 baseline inheritance rule이 명시됐다
- prompt-layer and harness-layer change set이 분리됐다
- file-level targets가 지정됐다
- P0 / P1 / P2 우선순위가 고정됐다
- release gate redesign 방향이 고정됐다

### P0 구현 승인 기준

- `Harness Coverage Matrix` exists
- `trace_schema.json` exists
- `sandbox_policy.json` exists
- `runner_contract.json` and `trial_isolation_policy.json` exist
- runners emit lineage fields and trace metadata

### 계획 이후 가장 강하게 정당화되는 표현

- `v34 harness-designed`

### 계획 이후 아직 정당화되지 않는 표현

- `v34 config-harness-ready`
- `v34 code-defined-harness-ready`
- `v34 harness-executed`
- `v34 replay-verified`
- `v34 release-gated`

계획 단계가 끝난 지금 시점의 가장 안전한 다음 실행은 `v33 -> v34 baseline carryover`와 `P0 harness contracts`부터 시작하는 것이다.
