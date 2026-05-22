# v26 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf`를 다시 심층 분석하고, 이전 버전 결과인 `prompt-stack/v26/v25_Augmentation_Results.md`와 다음 버전 요구를 정리한 `prompt-stack/v26/Next_Augmentation_Plan.md`를 함께 참고하여, `prompt-stack/v26` 활성 문서 전체에 반영해야 할 보강점을 정리한다.

이번 `v26`의 핵심은 새 doctrine 추가가 아니다.

- `v25`는 PDF 기반 control surface를 문서, overlay, example, skill layer에 폭넓게 반영했다.
- 그러나 아직 상당수는 documented surface다.
- `v26`은 이를 executable proof, measured lifecycle, reproducible review, integrated release evidence 수준으로 끌어올려야 한다.

즉 `v26`은 `coverage augmentation`이 아니라 `documented surface -> executable proof surface` 전환 버전이어야 한다.

---

## 2. 분석 기준

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `prompt-stack/v26/v25_Augmentation_Results.md`
- `prompt-stack/v26/Next_Augmentation_Plan.md`
- `prompt-stack/v26` 활성 문서 전체

### 2.2 PDF에서 다시 확인한 핵심 메시지

이번 계획은 특히 아래 메시지를 다시 기준으로 잡는다.

- `resource-aware optimization`
- `dynamic re-prioritization`
- `Terminal-Bench` 계열의 CLI coding-agent benchmark 현실
- `critique-and-reflection`의 terminal-facing immediate feedback
- learning / adaptation과 drift 방지
- context-aware / context-engineered execution

### 2.3 현재 v26 상태 진단

현재 `v26`는 사실상 `v25` 수준의 문서 보강 surface를 이미 계승하고 있다.

이미 존재하는 축:

- benchmark registry and replay surface
- context engineering quality gate
- critique / no-gain-loop governance surface
- adaptation promotion / rollback threshold surface
- route-quality / prioritization / exploration score surface
- repo-scale coding proof surface
- lightweight measured operations vocabulary

이미 연결된 packet family:

- `Benchmark registry memo`
- `Context sufficiency review memo`
- `Critique quality review memo`
- `Adaptation promotion review memo`
- `Route-quality scorecard`
- `Coding benchmark scenario memo`

하지만 현재 `v26`의 실질 공백은 다음과 같다.

1. benchmark와 replay가 아직 executable harness가 아니라 document-level registry에 가깝다.
2. context quality는 reviewable하지만 아직 failure taxonomy와 scoring program이 약하다.
3. critique quality는 정의돼 있지만 utility-tracked refinement loop는 없다.
4. adaptation은 threshold는 있으나 candidate -> trial -> promoted -> quarantined -> rolled-back lifecycle이 없다.
5. route-quality는 scorecard는 있으나 re-prioritization benchmark와 연결되지 않았다.
6. coding proof는 verification-running doctrine은 있으나 engineering proof bundle과 scenario program은 없다.
7. release evidence는 richer해졌지만 benchmark / replay / context / critique / adaptation / coding-proof를 통합한 promotion packet은 약하다.
8. telemetry는 vocabulary는 있으나 longitudinal trend와 cohort-aware interpretation이 약하다.

중요한 점은, `v26`의 문제는 “무엇을 추가할까”가 아니라 “무엇을 실제로 보장 가능한 구조로 바꿀까”다.

---

## 3. 적용 범위

보강 범위는 `prompt-stack/v26` 활성 문서 전체다.

명시적 제외:

- `99_original/*`

대상 문서 총 22개:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

---

## 4. v26 보강 원칙

1. `v25`의 packet and doctrine surface를 유지한다.
2. 문서-level coverage와 operational proof를 명시적으로 구분한다.
3. executable / measured / reproducible / lifecycle-managed surface를 우선한다.
4. raw hidden reasoning, raw transcript replay, decorative telemetry는 계속 금지한다.
5. 새로운 packet은 genuinely separate control problem일 때만 추가한다.
6. guide -> runtime -> governance -> base -> overlay -> example -> skill parity를 유지한다.
7. release claim은 measurement substrate가 약하면 반드시 약화한다.

---

## 5. 핵심 보강 축

### P0. Executable benchmark and replay system

문제:

`v26` 현재 문서군에는 benchmark registry와 replay surface가 존재하지만, 아직 실제 benchmark execution program은 없다.

보강 방향:

- versioned benchmark manifest format
- replay scenario registry with stable IDs
- task-family별 expected route / expected packet / expected failure class
- benchmark execution state
- replay execution state
- benchmark result schema
- replay verdict schema
- benchmark-to-release linkage

목표:

- benchmark를 packet name이 아니라 repeatable evaluation substrate로 만든다

### P0. Context failure taxonomy and measured context substrate

문제:

context engineering은 충분히 강조됐지만, 왜 실패했는지를 taxonomy와 score로 남기지 못한다.

보강 방향:

- `under-context`
- `stale-context`
- `noisy-context`
- `over-context`
- `mismatched-context`
- `missing-briefing-context`
- context-pack scoring rubric
- context-loss regression review
- context-before-model diagnosis rule

목표:

- context failure를 model failure와 구분해 진단할 수 있게 한다

### P0. Critique utility and critique-refine proof

문제:

critique quality surface는 있으나 critique가 실제 품질을 얼마나 바꿨는지는 아직 약하다.

보강 방향:

- producer / critic / refiner contract
- critique delta tracking
- critique utility scoring
- no-gain-loop hard stop
- critique-to-reroute vs critique-to-repair distinction
- ignored-critique failure class

목표:

- critique를 존재 여부가 아니라 correction utility로 평가한다

### P0. Adaptation lifecycle with quarantine and rollback

문제:

promotion threshold와 rollback threshold는 있으나 lifecycle state가 없다.

보강 방향:

- adaptation candidate registry
- candidate -> trial -> promoted -> quarantined -> rolled-back lifecycle
- adaptation evidence bundle
- drift suspicion workflow
- rollback execution trigger
- session-local vs persistent adaptation separation audit

목표:

- adaptation을 threshold memo에서 lifecycle-controlled improvement로 승격한다

### P1. Route-quality and re-prioritization benchmark

문제:

PDF는 re-prioritization을 중요한 control surface로 보지만, 현재는 route-quality scorecard 수준이다.

보강 방향:

- route-quality benchmark cases
- re-prioritization trigger inventory
- clarification-vs-exploration benchmark
- exploration frontier shrink / expand audit
- fallback quality review
- budget-aware route switching eval

목표:

- route quality를 hindsight narrative가 아니라 benchmarked control quality로 다룬다

### P1. Repo-scale coding benchmark and engineering proof bundle

문제:

coding proof surface는 있지만 engineering proof program은 아직 약하다.

보강 방향:

- repo-scale coding benchmark registry
- scenario taxonomy
  - bug fix
  - bounded refactor
  - regression-sensitive patch
  - test repair
  - multi-file contract edit
  - review-only task
- verification-running capability matrix
- executed-vs-unexecuted claim taxonomy
- diff-quality audit
- briefing-quality impact review
- human quality-gate outcome tracking

목표:

- coding-agent proof를 repo-aware engineering reliability로 끌어올린다

### P1. Release evidence unification

문제:

현재 release evidence는 여러 surface를 나열할 수는 있지만, one-bundle promotion system은 아니다.

보강 방향:

- `Release evidence bundle v2`
- benchmark evidence attachment set
- replay coverage attachment set
- context-quality gate result
- critique-governance result
- adaptation lifecycle state
- coding benchmark state
- release recommendation confidence class

목표:

- release summary가 아니라 promotion-grade evidence packet을 만든다

### P2. Longitudinal telemetry and drift observability

문제:

현재는 metric vocabulary만 있고 trend interpretation이 없다.

보강 방향:

- metric history schema
- cohort-aware telemetry
- reviewer burden trend
- replay coverage trend
- omission rate trend
- adaptation rollback trend
- route-switch trend
- false-promotion / false-hold review

목표:

- 단발성 score가 아니라 지속적인 quality movement를 본다

---

## 6. 신규 또는 확장 packet 계획

기존 packet 유지:

- `Benchmark registry memo`
- `Context sufficiency review memo`
- `Critique quality review memo`
- `Adaptation promotion review memo`
- `Route-quality scorecard`
- `Coding benchmark scenario memo`
- `Safe trajectory artifact report`
- `Packet compliance report`
- `Release evidence bundle memo`

v26에서 새로 필요할 가능성이 높은 packet:

- `Benchmark execution report`
- `Replay suite verdict memo`
- `Context failure taxonomy memo`
- `Critique utility scorecard`
- `Adaptation lifecycle state memo`
- `Route re-prioritization audit memo`
- `Coding proof bundle memo`
- `Release evidence bundle v2`
- `Telemetry trend memo`

원칙:

- `v25` packet으로 흡수 가능하면 억지로 늘리지 않는다
- 새 packet은 execution state, lifecycle state, trend state처럼 truly new control surface일 때만 추가한다

---

## 7. 문서군별 보강 방향

### 7.1 Runtime / guide layer

대상:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

반영 내용:

- documented surface vs executable proof distinction 강화
- benchmark execution state / replay execution state / adaptation lifecycle state / telemetry state lookup 추가
- release recommendation confidence class 추가
- coding proof bundle와 telemetry trend lookup 추가

### 7.2 Governance layer

대상:

- `00_governance/PROMPT_guideline.md`

반영 내용:

- executable proof doctrine
- context failure taxonomy doctrine
- critique utility governance
- adaptation lifecycle governance
- telemetry trend and drift review doctrine
- release evidence unification doctrine

### 7.3 Base prompt layer

대상:

- `01_base/*`

반영 내용:

- executed-vs-unexecuted claim taxonomy
- context failure diagnosis before deeper reasoning
- critique utility / no-gain stop 강화
- coding proof claim discipline 강화
- release confidence downgrade rule 강화

### 7.4 Evaluation overlay

대상:

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

반영 내용:

- executable benchmark and replay program doctrine
- benchmark execution report / replay suite verdict packet 연결
- telemetry trend surface
- confidence-classed release recommendation
- false-promotion / false-hold review

### 7.5 Search / reasoning overlay

대상:

- `02_overlays/PROMPT_search_reasoning_overlay.md`

반영 내용:

- re-prioritization benchmark
- route re-prioritization audit packet
- route-switch trend and fallback review
- clarification-vs-exploration benchmark strengthening

### 7.6 Memory / adaptation overlay

대상:

- `02_overlays/PROMPT_memory_adaptation_overlay.md`

반영 내용:

- adaptation lifecycle state
- quarantine / rollback workflow
- drift suspicion escalation
- adaptation candidate registry logic

### 7.7 Retrieval overlay

대상:

- `02_overlays/PROMPT_retrieval_grounding_overlay.md`

반영 내용:

- context substrate and evidence substrate joint diagnosis
- retrieval failure taxonomy와 context failure taxonomy 연결
- measured evidence adequacy vs measured context adequacy 분리

### 7.8 Multi-agent overlay

대상:

- `02_overlays/PROMPT_multi_agent_overlay.md`

반영 내용:

- measured join failure surface
- coordinator quality review
- topology quality vs integration quality 분리
- rework / duplicate work / reviewer burden trend surface

### 7.9 Tool / guardrail overlay

대상:

- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`

반영 내용:

- benchmark execution substrate readiness
- harness availability vs live-system constraint 분리
- adaptation / benchmark / telemetry surface가 safety boundary를 침식하지 못하게 강화

### 7.10 Example layer

대상:

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

반영 내용:

- benchmark execution report family
- replay suite verdict family
- context failure taxonomy family
- critique utility scorecard family
- adaptation lifecycle state family
- coding proof bundle family
- release evidence bundle v2 family
- telemetry trend family

### 7.11 Codex skill layer

대상:

- `coding-core`
- `design-analysis`
- `eval-ops`
- `grounded-research`
- `orchestration-control`

반영 내용:

- `eval-ops`: benchmark execution and telemetry interpretation owner 강화
- `coding-core`: engineering proof taxonomy and execution honesty 강화
- `grounded-research`: context substrate failure vs evidence substrate failure 구분 강화
- `design-analysis`: route re-prioritization audit 강화
- `orchestration-control`: measured coordination quality, join-failure lifecycle, coordinator quality 강화

---

## 8. 현재 v26 문서군 대비 구체 공백

이번 탐색에서 확인한 실질 공백:

- `v26` 활성 문서군에는 `Benchmark execution report`, `Replay suite verdict memo`, `Context failure taxonomy memo`, `Critique utility scorecard`, `Adaptation lifecycle state memo`, `Route re-prioritization audit memo`, `Coding proof bundle memo`, `Release evidence bundle v2`, `Telemetry trend memo`가 아직 없다
- `PROMPT_evaluation_monitoring_overlay.md`는 replay coverage와 benchmark registry는 다루지만 executable benchmark state와 longitudinal telemetry trend는 아직 약하다
- `PROMPT_memory_adaptation_overlay.md`는 threshold는 명시하지만 lifecycle state와 quarantine workflow는 아직 약하다
- `PROMPT_search_reasoning_overlay.md`는 clarification-vs-exploration note는 있지만 re-prioritization benchmark program은 아직 없다
- `PROMPT_tool_protocol_overlay.md`는 verification-running policy는 다루지만 harness readiness surface는 아직 분리되지 않았다
- `PROMPT_example_catalog.md`는 v25 packet exemplar는 있으나 execution report / lifecycle state / trend packet exemplar는 아직 없다

즉 `v26`의 핵심 공백은 “packet existence”가 아니라 “execution-state packet and measured lifecycle packet 부재”다.

---

## 9. 완료 기준

`v26`이 완료되었다고 보려면 최소 다음이 충족되어야 한다.

1. `v25`의 packet and doctrine surface가 유지된다.
2. benchmark registry가 executable benchmark system으로 승격된다.
3. replay surface가 real replay suite verdict로 연결된다.
4. context engineering이 taxonomy + scoring + regression review를 갖는다.
5. critique loop가 utility-scored refinement mechanism이 된다.
6. adaptation이 lifecycle + quarantine + rollback까지 가진다.
7. route-quality가 re-prioritization benchmark와 연결된다.
8. coding-agent proof가 repo-scale scenario와 verification execution state를 갖는다.
9. release evidence가 benchmark / replay / context / critique / adaptation / coding-proof를 통합한다.
10. telemetry가 longitudinal trend와 drift review까지 연결된다.

---

## 10. 검증 계획

반영 후 최소 다음을 확인한다.

- active 22개 문서 전체 반영 여부
- `99_original/*` 미수정 여부
- 아래 용어 / packet 존재 여부
  - `Benchmark execution report`
  - `Replay suite verdict memo`
  - `Context failure taxonomy memo`
  - `Critique utility scorecard`
  - `Adaptation lifecycle state memo`
  - `Route re-prioritization audit memo`
  - `Coding proof bundle memo`
  - `Release evidence bundle v2`
  - `Telemetry trend memo`
  - `executed-vs-unexecuted`
  - `benchmark execution state`
  - `replay execution state`
  - `adaptation lifecycle state`
  - `release recommendation confidence class`
  - `cohort-aware telemetry`
- example layer와 skill layer가 새 execution-state packet을 실제 참조하는지 여부
- release / eval / search / memory / coding path가 execution-state language를 공유하는지 여부

---

## 11. 안티패턴

- benchmark vocabulary만 늘리고 executable harness는 없는 상태
- context doctrine만 늘리고 failure taxonomy는 없는 상태
- critique packet은 많지만 critique utility는 측정하지 않는 상태
- adaptation threshold는 있지만 quarantine / rollback workflow는 없는 상태
- route-quality scorecard는 있지만 re-prioritization benchmark는 없는 상태
- coding benchmark라는 이름만 있고 execution honesty taxonomy는 없는 상태
- telemetry vocabulary는 있지만 trend decision model은 없는 상태
- release evidence를 나열만 하고 promotion confidence class는 없는 상태

---

## 12. 실행 요약

`v25`는 `Agentic_Design_Patterns.pdf` 기반 control surface를 prompt-stack 문서 전반에 배포한 버전이었다.

`v26`의 역할은 다르다.

- benchmark registry를 executable benchmark로 전환
- replay surface를 verdict-bearing replay suite로 전환
- context review를 measured failure taxonomy로 전환
- critique surface를 utility-scored refinement loop로 전환
- adaptation doctrine을 lifecycle controller로 전환
- route-quality score를 re-prioritization benchmark로 전환
- coding proof doctrine을 engineering proof bundle로 전환
- release evidence를 integrated promotion packet으로 전환
- telemetry vocabulary를 longitudinal observability로 전환

즉 `v26`의 목표는 더 많이 말하는 것이 아니라, `v25`가 말한 것을 실제로 보장 가능한 구조로 만드는 것이다.
