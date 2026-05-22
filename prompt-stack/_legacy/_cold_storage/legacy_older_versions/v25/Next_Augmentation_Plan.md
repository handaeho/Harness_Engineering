# Next Augmentation Plan

## 1. 목적

이 문서는 다음 버전인 `v26`에서 충족해야 할 보강점을 정리한다.

기준은 단순하다.

- `v25`는 `Agentic_Design_Patterns.pdf`의 중요한 control surface를 문서, overlay, skill, example layer에 넓게 반영했다.
- 그러나 아직 상당수는 `documented control surface` 수준이다.
- `v26`의 목표는 이를 `operationally guaranteed surface`로 끌어올리는 것이다.

즉 `v26`는 새 doctrine을 더 붙이는 버전이 아니라, `v25`가 정의한 benchmark / context / critique / adaptation / route-quality / coding-proof surface를 실제 보장 가능한 운영 체계로 고도화하는 버전이어야 한다.

---

## 2. v25가 달성한 것과 남은 공백

### 2.1 v25가 이미 달성한 것

`v25`는 다음을 prompt-stack 전반에 반영했다.

- benchmark registry and replay surface
- context engineering quality gate
- reflection / critique governance
- adaptation promotion / rollback governance
- route / prioritization / exploration scoring surface
- repo-scale coding-agent proof surface
- lightweight measured operations

또한 다음 packet family를 실제로 example / guide / runtime / skill layer에 연결했다.

- `Benchmark registry memo`
- `Context sufficiency review memo`
- `Critique quality review memo`
- `Adaptation promotion review memo`
- `Route-quality scorecard`
- `Coding benchmark scenario memo`

### 2.2 v25의 본질적 한계

하지만 `v25`의 본질적 한계는 여전히 명확하다.

1. benchmark와 replay가 아직 `실행되는 프로그램`이 아니라 `정의된 문서 surface`에 가깝다.
2. context sufficiency / critique quality / route quality / adaptation promotion이 아직 실제 scored loop로 운영되지는 않는다.
3. coding benchmark도 verification-running doctrine은 생겼지만 실제 harness / scenario / pass-fail infrastructure는 없다.
4. telemetry는 vocabulary 수준이지 장기적 관찰 체계까지는 아니다.
5. adaptation rollback은 규칙으로는 생겼지만, 실제 drift detection and rollback workflow까지는 연결되지 않았다.
6. release evidence도 richer해졌지만, 실제 benchmark / replay / coding-eval / adaptation evidence를 통합한 release bundle 체계는 아직 약하다.

즉 `v25`는 “무엇을 봐야 하는가”를 잘 정리했지만, `v26`은 “그것을 어떻게 반복 가능하게 측정하고 증명할 것인가”를 정리해야 한다.

### 2.3 v25 달성도에 대한 평가

`v25_Augmentation_Plan.md`와 `v25_Augmentation_Results.md`, 그리고 활성 22개 문서를 다시 대조했을 때 다음 평가는 비교적 명확하다.

- 계획 대비 문서-level 달성도: 높음
- guide / runtime / governance / base / overlay / example / skill layer coverage: 충족
- 신규 packet family 연결: 충족
- operational benchmark / replay / telemetry proof: 미충족
- “계획을 완벽히 달성했는가”: 아니오

이 판단의 이유는 다음과 같다.

1. `v25`는 계획에서 요구한 신규 control surface와 packet family를 실제 문서군에 반영했다.
2. 활성 22개 문서 전체에 `Benchmark registry memo`, `Context sufficiency review memo`, `Critique quality review memo`, `Adaptation promotion review memo`, `Route-quality scorecard`, `Coding benchmark scenario memo` 또는 관련 threshold / metric term이 실제로 존재한다.
3. 그러나 결과 문서 스스로도 `benchmark harness 실행`, `replay suite 실행`, `telemetry aggregation`이 아직 문서화만 된 영역이라고 명시한다.

따라서 `v25`에 대해 가능한 strongest faithful claim은 아래와 같다.

- `Agentic_Design_Patterns.pdf` 기반 보강 항목이 prompt-stack 전 레이어에 문서적으로 반영되었다.
- 하지만 그것이 실행 가능한 benchmark / replay / telemetry / adaptation rollback system으로 이미 보장된 것은 아니다.

이 평가는 `v26`의 출발점을 규정한다.
`v26`은 “coverage augmentation”이 아니라 “documented surface -> executable proof” 전환 버전이어야 한다.

### 2.4 v25에서 보장 가능한 것과 보장 불가능한 것

#### v25에서 보장 가능한 것

- `00_governance`, `01_base`, `02_overlays`, `03_examples`, `codex` 전체 파일이 PDF 기반 보강 축을 반영했다
- 신규 packet family가 example, guide, runtime, skill layer에 모두 연결됐다
- context / critique / adaptation / route-quality / coding-proof surface가 owner-preserving 방식으로 문서군에 삽입됐다
- `99_original/*`를 제외한 활성 문서 전반에 이번 라운드 용어와 surface가 배포됐다

#### v25에서 아직 보장 불가능한 것

- executable benchmark program의 실제 반복 실행 가능성
- replay suite의 실제 verdict reproducibility
- telemetry trend의 장기 관찰 가능성
- adaptation rollback의 실제 운영 workflow
- repo-scale coding benchmark의 실제 harnessed proof
- release evidence의 integrated operational promotion packet

이 구분은 중요하다.
`v26`은 보장 가능한 범위를 넓히는 버전이어야 하며, 단지 문서를 더 풍부하게 만드는 버전이면 안 된다.

---

## 3. PDF 전체 보장을 위해 v26에서 필요한 핵심 보강 축

### P0. Executable benchmark and replay system

문제:

PDF는 benchmark, evaluation, trajectory inspection을 prose doctrine이 아니라 반복 가능한 검증 체계로 본다.  
`v25`는 benchmark registry를 만들었지만 아직 executable replay system은 없다.

v26 보강 방향:

- versioned benchmark manifest format
- replay scenario registry + stable IDs
- task-family별 expected route / expected packet / expected failure class
- mock-tool / no-tool / tool-using / delegated / coding / research / release-review cohort 분리
- benchmark result schema
- replay verdict schema
- benchmark-to-release linkage

목표:

- “이 버전이 좋아 보인다”가 아니라 “이 버전이 이 benchmark cohort에서 더 강하다”를 말할 수 있게 한다

### P0. Context engineering as measured substrate, not doctrine only

문제:

PDF 전체는 context engineering을 prompt phrasing보다 더 넓은 substrate discipline으로 본다.  
`v25`는 context sufficiency review를 정의했지만, 아직 context failure taxonomy와 measurable substrate audit가 약하다.

v26 보강 방향:

- context failure taxonomy
  - under-context
  - stale-context
  - noisy-context
  - over-context
  - mismatched-context
  - missing-briefing-context
- context-pack scoring rubric
- task-family별 minimal sufficient context contract
- context-loss regression review
- context provenance and freshness interaction review
- context-before-model diagnosis rule

목표:

- 실패 원인을 model weakness로 뭉개지 않고 context substrate failure로 분해한다

### P0. Critique-and-refine operational loop proof

문제:

PDF는 critique / reflection을 실제 refinement engine으로 다룬다.  
`v25`는 critique quality surface를 만들었지만, critique loop가 실제로 품질을 올리는지 증명하는 mechanism은 아직 없다.

v26 보강 방향:

- producer / critic / refiner 3-stage contract
- critique delta tracking
- no-gain-loop hard stop policy
- critique-to-reroute and critique-to-repair distinction
- critique utility scoring
- “critique generated but ignored” failure class
- coding / research / design / orchestration별 critique profile 분리

목표:

- reflection을 sophistication theater가 아니라 measurable correction loop로 만든다

### P0. Adaptation lifecycle with real promotion, quarantine, rollback

문제:

PDF는 learning and adaptation을 강하게 다루고 drift risk도 분명히 암시한다.  
`v25`는 threshold를 정의했지만 lifecycle controller는 아직 없다.

v26 보강 방향:

- adaptation candidate registry
- candidate -> trial -> promoted -> quarantined -> rolled-back lifecycle
- adaptation evidence bundle schema
- drift suspicion workflow
- rollback execution trigger
- session-local vs persistent adaptation separation audit
- evaluation-backed adaptation promotion requirement

목표:

- adaptation을 “기억 기반 편의”가 아니라 controlled improvement lifecycle로 승격한다

### P1. Route-quality and re-prioritization evaluation program

문제:

PDF는 `resource-aware optimization`과 `dynamic re-prioritization`을 핵심 control problem으로 본다.  
`v25`는 route-quality scorecard를 도입했지만 실제 re-prioritization quality benchmark는 없다.

v26 보강 방향:

- route-quality benchmark cases
- re-prioritization trigger inventory
- clarification-vs-exploration decision benchmark
- exploration frontier shrink/expand audit
- fallback quality and route downgrade review
- budget-aware route switching eval

목표:

- reasoning quality를 “깊게 생각했다”가 아니라 “올바른 경로를 적절한 시점에 갈아탔다”로 평가한다

### P1. Repo-scale coding benchmark and engineering proof system

문제:

PDF의 `Terminal-Bench` 축은 coding agent를 진짜 CLI/engineering substrate에서 봐야 함을 시사한다.  
`v25`는 verification-running policy를 정의했지만, 아직 coding benchmark 운영 체계는 없다.

v26 보강 방향:

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
- diff-quality audit packet
- briefing-quality impact review
- human quality-gate outcome tracking

목표:

- coding-agent proof를 local plausibility에서 engineering reliability로 끌어올린다

### P1. Release evidence unification

문제:

`v25`는 release evidence bundle surface를 확장했지만, benchmark / replay / context / critique / adaptation / coding-proof evidence를 통합하는 higher-level release packet은 아직 약하다.

v26 보강 방향:

- release evidence bundle v2
- benchmark evidence attachment set
- replay coverage attachment set
- context-quality gate result
- critique-governance result
- adaptation-promotion state
- coding benchmark state
- release recommendation confidence class

목표:

- release note가 아니라 evidence-backed promotion packet을 만든다

### P2. Longitudinal telemetry and drift observability

문제:

`v25`는 measured operations vocabulary를 넣었지만, 장기 drift를 잡는 longitudinal surface는 아직 약하다.

v26 보강 방향:

- metric history schema
- cohort-aware telemetry
- reviewer burden trend
- replay coverage trend
- omission rate trend
- adaptation rollback trend
- route-switch trend
- false-promotion / false-hold review

목표:

- 단발성 score가 아니라 지속적 quality movement를 본다

---

## 4. v26에서 새로 필요할 가능성이 높은 packet

`v25` packet family를 유지하되, `v26`에서는 아래 packet이 필요할 가능성이 높다.

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

- 새 packet은 `v25` packet으로 흡수할 수 있으면 억지로 늘리지 않는다
- genuinely separate control problem일 때만 추가한다

---

## 5. 문서군별 v26 보강 방향

### 5.1 Governance / runtime layer

대상:

- `AGENTS.md`
- `PROMPT_guideline.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

필요 보강:

- documented surface vs executable proof 구분 강화
- benchmark execution state / replay execution state / adaptation lifecycle state / telemetry state 추가
- release recommendation confidence class 추가

### 5.2 Base prompt layer

대상:

- `01_base/*`

필요 보강:

- executed-vs-unexecuted claim taxonomy
- context failure diagnosis prior to deeper reasoning
- critique utility / no-gain loop termination 강화
- coding proof claim discipline 강화

### 5.3 Overlay layer

대상:

- `02_overlays/*`

필요 보강:

- evaluation overlay: executable benchmark / replay suite / trend monitoring
- memory overlay: adaptation lifecycle and rollback workflow
- search overlay: re-prioritization benchmark and frontier quality scoring
- retrieval overlay: context substrate and evidence substrate joint diagnosis
- multi-agent overlay: measured join failure and coordinator quality
- tool overlay: benchmark execution substrate readiness
- guardrails overlay: adaptation, benchmark, telemetry가 safety boundary를 침식하지 못하도록 추가 명시

### 5.4 Example layer

대상:

- `03_examples/*`

필요 보강:

- benchmark execution report family
- adaptation lifecycle state family
- telemetry trend family
- coding proof bundle family
- release bundle v2 family

### 5.5 Skill layer

대상:

- `coding-core`
- `design-analysis`
- `eval-ops`
- `grounded-research`
- `orchestration-control`

필요 보강:

- `eval-ops`: benchmark execution and telemetry interpretation owner 강화
- `coding-core`: engineering proof taxonomy and execution honesty 강화
- `grounded-research`: context substrate failure vs evidence substrate failure 구분 강화
- `design-analysis`: route re-prioritization audit 강화
- `orchestration-control`: measured coordination quality and join-failure lifecycle 강화

---

## 6. v26 완료 기준

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
10. longitudinal telemetry가 drift and trend review까지 연결된다.

---

## 7. v26에서 특히 피해야 할 안티패턴

- benchmark vocabulary만 늘리고 실제 executable harness는 없는 상태
- context doctrine만 늘리고 context failure taxonomy는 없는 상태
- critique packet은 많지만 critique utility는 측정하지 않는 상태
- adaptation threshold는 있지만 rollback workflow는 없는 상태
- route-quality scorecard는 있지만 re-prioritization benchmark는 없는 상태
- coding benchmark라는 이름만 있고 execution honesty taxonomy는 없는 상태
- telemetry를 넣되 decision model과 연결하지 않는 상태
- PDF coverage를 문장 수로 착각하는 상태

---

## 8. 요약

`v25`는 `Agentic_Design_Patterns.pdf`의 광범위한 내용을 prompt-stack 문서와 packet family에 반영한 버전이었다.

`v26`의 본질은 다르다.

`v26`은 다음을 수행해야 한다.

- document-level coverage를 executable proof로 전환
- review packet을 measured operational loop로 전환
- adaptation doctrine을 lifecycle controller로 전환
- coding-proof doctrine을 real engineering eval surface로 전환
- release evidence를 integrated promotion system으로 전환

즉 `v26`의 목표는 더 많이 말하는 것이 아니라, `v25`가 말한 것을 실제로 보장 가능한 구조로 만드는 것이다.
