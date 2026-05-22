# v25 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf`를 다시 심층 분석하고, 이전 분석 결과인 `prompt-stack/v25/v24_Augmentation_Results.md`와 현재 기준 계획 문서인 `prompt-stack/v25/v24_Augmentation_Plan.md`를 함께 참고하여, `prompt-stack/v25`의 활성 프롬프트 문서 전체에 추가로 반영해야 할 보강 항목을 정리한다.

이번 `v25`의 목표는 새 doctrine을 무분별하게 늘리는 것이 아니다. `v24`가 확보한 다음 control surface를 유지한 상태에서, 이를 실제 운영 품질, 평가 가능성, 개선 루프, benchmarkized validation, adaptation governance 수준까지 끌어올리는 것이다.

`v24`에서 이미 확보한 축:

- behavior replay and packet compliance
- deep-research execution audit
- delegation admission and join-quality review
- human quality-gate lifecycle
- release evidence bundle

`v25`에서 추가로 끌어올릴 축:

- versioned benchmark and replay program
- context engineering quality gate
- reflection / critique quality governance
- adaptation promotion / rollback governance
- route / prioritization / exploration quality scoring
- repo-scale coding-agent proof surface
- measured operations and lightweight telemetry discipline

---

## 2. 분석 근거

### 2.1 사용한 근거 문서

- 첨부 PDF: `Agentic_Design_Patterns.pdf`
- PDF 추출본: `Agentic_Design_Patterns_extracted.txt`
- 이전 계획: `prompt-stack/v25/v24_Augmentation_Plan.md`
- 이전 결과: `prompt-stack/v25/v24_Augmentation_Results.md`
- 현재 대상: `prompt-stack/v25` 활성 문서 전체

### 2.2 PDF에서 다시 확인한 핵심 패턴

이번 계획은 특히 아래 패턴을 근거로 한다.

- `resource-aware optimization` 강조: 추출본 62462 부근
- `dynamic re-prioritization` 강조: 추출본 80942 부근
- `Terminal-Bench` 등 CLI 기반 coding-agent benchmark 현실: 추출본 101488 부근
- learning and adaptation 확대: 추출본 38634 부근, 70178 부근
- critique-and-reflection summary와 terminal-facing review surface: 추출본 103205 부근
- adaptation drift 방지 필요: 추출본 107136-107149 부근

### 2.3 현재 v25 상태 진단

현재 `v25`는 이미 다음을 상당히 잘 갖추고 있다.

- `AGENTS.md` 수준의 강한 context engineering contract
- `PROMPT_search_reasoning_overlay.md`의 bounded search / prioritization / frontier discipline
- `PROMPT_memory_adaptation_overlay.md`의 memory vs adaptation boundary
- `PROMPT_evaluation_monitoring_overlay.md`의 evaluation surface와 metric taxonomy
- `v24`에서 도입된 replay / packet / release evidence 관련 packet family

그러나 아래는 아직 약하거나 분리되지 않았다.

- benchmark registry나 replay suite를 versioned program으로 운영하는 표면
- context sufficiency 자체를 scoreable quality surface로 다루는 표면
- critique quality와 no-gain loop를 gate로 다루는 표면
- adaptation promotion threshold / rollback threshold를 명시하는 표면
- route-quality / prioritization-quality / exploration-quality를 scorecard로 다루는 표면
- repo-scale coding benchmark와 verification-running policy를 명시하는 표면
- packet usage frequency, omission rate, replay coverage, reviewer burden 같은 measured operations 관찰 표면

중요한 점은, 현재 `v25`의 공백은 “기본 doctrine 부재”가 아니라 “운영용 평가/개선 surface의 미분리”에 가깝다.

---

## 3. 적용 범위

보강 범위는 `prompt-stack/v25`의 활성 문서 전체다.

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

## 4. 보강 원칙

1. `v24`의 packet family를 유지한다.
2. 새 packet은 genuinely separate control problem일 때만 추가한다.
3. doctrine만 추가하지 말고, guide -> runtime -> overlay -> skill -> example 경로로 lookup parity를 만든다.
4. 문장 추가보다 운영 가능한 gate, scorecard, review packet, threshold를 우선한다.
5. raw hidden reasoning, raw transcript replay, decorative telemetry는 금지한다.
6. compressed variant에서도 최소 packet floor와 claim-strength discipline을 유지한다.
7. `measurement`는 decision-linked여야 하며 dashboard theater가 되면 안 된다.

---

## 5. v25 핵심 보강 축

### P0. Versioned replay and benchmark program

문제:

`v24`는 replay artifact를 만들었지만, repeatable benchmark program까지는 아니다.

보강 방향:

- representative task-family benchmark registry 정의
- replay suite를 versioned artifact로 정의
- scenario마다 expected route class, expected packet floor, expected failure class 기록
- mock-tool assertions, replay review, release gate를 하나의 eval program으로 연결

목표:

- “이번 버전이 더 낫다”를 서술이 아니라 repeatable replay와 benchmark evidence로 말할 수 있게 한다

### P0. Context engineering quality gate

문제:

현재 stack은 context doctrine은 강하지만, context quality 자체를 별도 quality surface로 측정하지 않는다.

보강 방향:

- context sufficiency / overload / stale-context regression을 별도 gate로 분리
- coding, research, orchestration, release review에서 `Context Pack` 품질 점검 기준 명시
- external docs, tool outputs, user brief, retrieved evidence, approval boundary가 누락되었는지 점검하는 review packet 추가

목표:

- 실패를 모델 능력 부족으로만 보지 않고 context packaging failure로도 진단한다

### P0. Reflection and no-gain-loop governance

문제:

reflection은 여러 문서에 있으나 critique quality와 stop condition이 scoreable surface로 분리돼 있지 않다.

보강 방향:

- critique quality rubric
- no-gain iteration detector
- reroute-after-critique evidence
- producer / critic contract integrity check

목표:

- reflection을 sophistication theater가 아니라 measurable improvement mechanism으로 만든다

### P1. Adaptation promotion and rollback governance

문제:

memory/adaptation doctrine은 강하지만 promotion threshold와 rollback threshold가 운영 수준으로 충분히 분리돼 있지 않다.

보강 방향:

- adaptation candidate lifecycle
- promotion threshold
- rollback threshold
- drift suspicion handling
- adaptation evidence bundle

목표:

- one-off success나 weak signal이 silent default mutation으로 이어지지 않게 한다

### P1. Route, prioritization, and exploration quality scoring

문제:

search/prioritization doctrine은 강하지만, route-quality와 prioritization-quality를 gate 가능한 scorecard로 다루지는 않는다.

보강 방향:

- route-quality rubric
- prioritization-quality rubric
- exploration-depth appropriateness rubric
- clarification-vs-exploration decision audit
- fallback efficiency review

목표:

- search quality를 “열심히 생각했다”가 아니라 “맞는 경로를 골랐다”로 평가한다

### P1. Repo-scale coding-agent proof surface

문제:

coding-agent briefing은 강하지만, CLI/terminal 현실을 반영한 repo-scale coding benchmark와 verification-running policy는 아직 약하다.

보강 방향:

- repo-scale coding scenario set
- verification execution expectations
- diff / audit / commit trail review bundle
- benchmark를 briefing quality, human gate, replay, test evidence와 연결

목표:

- coding-agent quality를 patch plausibility가 아니라 sustained engineering reliability로 본다

### P2. Measured operations and lightweight telemetry discipline

문제:

packet과 gate가 생겼지만, 장기 관찰에 필요한 최소 운영 지표 정의가 부족하다.

보강 방향:

- packet usage frequency
- omission rate
- replay coverage
- reviewer burden
- join failure incidence
- adaptation rollback incidence

목표:

- 운영 루프를 감시하되 metrics theater는 피한다

---

## 6. 신규 또는 확장 packet 계획

기존 packet 확장 유지:

- `Prompt-stack release review`
- `Safe trajectory artifact report`
- `Mock-tool evaluation report`
- `Packet compliance report`
- `Release evidence bundle memo`
- `Quality iteration checkpoint memo`
- `Learning-signal review memo`
- `Adaptation decision memo`

이번 라운드에서 신규 추가할 packet:

- `Benchmark registry memo`
- `Context sufficiency review memo`
- `Critique quality review memo`
- `Adaptation promotion review memo`
- `Route-quality scorecard`
- `Coding benchmark scenario memo`

packet 원칙:

- 신규 packet은 각각 distinct control problem을 가져야 한다
- 단순 rename이나 decorative wrapper는 금지한다
- example catalog와 example injection에 모두 연결한다

---

## 7. 문서군별 보강 계획

### 7.1 Runtime / guide layer

대상:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

반영 내용:

- benchmark / replay / context-quality / critique-governance / adaptation-promotion lookup 추가
- measured-state와 review-state 분리 강화
- coding-agent benchmark와 verification-running expectations 연결
- task family별 required packet floor를 운영 평가 surface와 연결

### 7.2 Governance layer

대상:

- `00_governance/PROMPT_guideline.md`

반영 내용:

- benchmark and replay program doctrine
- context engineering quality doctrine
- critique-loop governance doctrine
- adaptation promotion / rollback doctrine
- telemetry minimalism and decision-linked measurement doctrine

### 7.3 Base prompt layer

대상:

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`

반영 내용:

- compressed mode에서도 context-quality minimum 유지
- no-gain loop와 stale-context 경고 강화
- benchmark truthfulness: measured surface가 없는 상태에서 과한 비교 주장 금지
- coding path에서 verification-running policy와 briefing completeness 강조

### 7.4 Evaluation overlay

대상:

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

반영 내용:

- benchmark registry doctrine
- replay suite / eval program doctrine
- context-quality evaluation surface
- critique quality rubric
- adaptation-promotion gate
- route-quality scorecard 연결
- lightweight telemetry and cohort tagging guidance

### 7.5 Search / reasoning overlay

대상:

- `02_overlays/PROMPT_search_reasoning_overlay.md`

반영 내용:

- route-quality / prioritization-quality / exploration-quality 평가 기준
- clarification-vs-exploration audit
- no-gain exploration detector
- re-prioritization evidence packaging 강화

### 7.6 Memory / adaptation overlay

대상:

- `02_overlays/PROMPT_memory_adaptation_overlay.md`

반영 내용:

- adaptation candidate lifecycle
- promotion threshold and rollback threshold
- adaptation evidence bundle / review packet 연결
- evaluation-driven adaptation과 memory reuse의 분리 강화

### 7.7 Retrieval / grounding overlay

대상:

- `02_overlays/PROMPT_retrieval_grounding_overlay.md`

반영 내용:

- evidence sufficiency와 context sufficiency의 상호작용 점검
- retrieval plan revision의 quality review 강화
- consulted-source transparency와 context-pack readiness 연결

### 7.8 Multi-agent overlay

대상:

- `02_overlays/PROMPT_multi_agent_overlay.md`

반영 내용:

- delegation outcome benchmark
- join-quality measured review
- reviewer burden / join cost / saturation risk를 scoreable surface로 확장

### 7.9 Tool / guardrail overlay

대상:

- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`

반영 내용:

- mock-tool / dedicated harness / live-system boundary 명확화
- adaptation automation이나 self-improvement성 루프가 approval boundary를 우회하지 못하게 강화
- benchmark truthfulness와 destructive reality 분리

### 7.10 Example layer

대상:

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

반영 내용:

- 신규 packet 6종 entry 추가
- 기존 packet에 benchmark / context / critique / adaptation gate 항목 확장
- packet selection rule에 measurement-linked criteria 추가

### 7.11 Codex skill layer

대상:

- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

반영 내용:

- `eval-ops`: benchmark program, scorecard, adaptation gate, telemetry minimalism
- `grounded-research`: context/evidence sufficiency review, critique checkpoint, benchmarked research replay
- `coding-core`: repo-scale coding benchmark, verification-running policy, briefing completeness review
- `design-analysis`: route-quality scorecard, exploration-depth appropriateness review
- `orchestration-control`: delegation benchmark, join-quality measurement, reviewer burden control

---

## 8. 현재 상태 대비 구체 공백

이번 분석에서 확인한 실질 공백:

- `03_examples/PROMPT_example_catalog.md`에는 `Benchmark registry memo`, `Context sufficiency review memo`, `Critique quality review memo`, `Adaptation promotion review memo`, `Route-quality scorecard`가 아직 없다
- `codex/skills/eval-ops/SKILL.md`는 replay / packet / release gate는 다루지만 benchmark registry와 adaptation-promotion gate를 직접 owning하지 않는다
- `codex/CODEX_RUNTIME_GUIDE.md`와 `PROMPT_USER_GUIDE.md`는 기존 packet lookup은 강하지만 benchmark/context-quality/critique-governance lookup은 아직 부족하다
- `PROMPT_memory_adaptation_overlay.md`는 adaptation doctrine은 강하지만 promotion threshold / rollback threshold를 운영 gate 수준으로 직접 명시하지 않는다
- `PROMPT_search_reasoning_overlay.md`는 prioritization doctrine은 강하지만 route-quality scorecard나 clarification-vs-exploration audit packet까지는 직접 연결하지 않는다

즉 `v25`의 다음 보강은 doctrine 확대보다 “운영 패킷과 평가 기준의 미세 분리”가 핵심이다.

---

## 9. 완료 기준

`v25` 보강이 완료되었다고 보려면 최소 다음이 충족되어야 한다.

1. `v24`의 replay / packet compliance / release evidence surface가 유지된다.
2. benchmark and replay program이 versioned artifact로 정의된다.
3. context engineering quality가 별도 평가 surface가 된다.
4. reflection / critique quality와 no-gain stop condition이 scoreable해진다.
5. adaptation promotion / rollback governance가 문서적으로 분리된다.
6. route / priority / exploration quality가 rubric 또는 scorecard로 드러난다.
7. repo-scale coding benchmark와 verification-running expectations가 명시된다.
8. guide -> runtime -> overlay -> skill -> example lookup parity가 맞춰진다.
9. `99_original/*`는 계속 제외된다.

---

## 10. 검증 계획

문서 반영 후 최소 다음을 확인한다.

- active 22개 문서 전체 반영 여부
- `99_original/*` 미수정 여부
- 아래 용어/packet의 존재 여부
  - `Benchmark registry memo`
  - `Context sufficiency review memo`
  - `Critique quality review memo`
  - `Adaptation promotion review memo`
  - `Route-quality scorecard`
  - `Coding benchmark scenario memo`
  - `promotion threshold`
  - `rollback threshold`
  - `clarification-vs-exploration`
  - `verification-running policy`
  - `replay coverage`
  - `reviewer burden`
- example layer와 skill layer가 새 packet과 gate를 실제로 참조하는지 여부
- compressed variant가 새 doctrine를 과도하게 장황하게 만들지 않는지 여부

---

## 11. 금지할 안티패턴

- benchmark theater를 위해 decision quality와 무관한 숫자만 늘리는 것
- context engineering doctrine을 broad prose로만 반복하는 것
- reflection을 반복 횟수 자체로 정당화하는 것
- adaptation signal과 persistent default mutation을 혼동하는 것
- route-quality를 hindsight rationalization으로만 설명하는 것
- coding benchmark를 toy patch로 축소하는 것
- raw hidden reasoning replay를 요구하는 것

---

## 12. 실행 요약

`v24`는 packet, replay, release evidence를 operationalize한 버전이었다.

`v25`는 그 위에 다음을 얹는 버전이어야 한다.

- benchmarkized validation
- context-quality gate
- critique governance
- adaptation governance
- route/prioritization/exploration scoring
- repo-scale coding proof
- lightweight measured operations

이 방향으로 `prompt-stack/v25` 활성 문서 전체를 보강한다.
