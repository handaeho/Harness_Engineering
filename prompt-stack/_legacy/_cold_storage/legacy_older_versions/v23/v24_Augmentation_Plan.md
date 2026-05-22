# v24 Augmentation Plan

## 1. 목적

`v24`의 보강 목표는 `v23`에서 달성한 문서-level augmentation을 넘어, 실제 agentic behavior와 운영 검증까지 포함하는 실행 수준의 강화다.

기준선:

- `prompt-stack/v23/v23_Augmentation_Plan.md`
- `prompt-stack/v23/v23_Augmentation_Results.md`
- `Agentic_Design_Patterns.pdf`

`v23`는 다음 네 축을 문서 계층 전체에 연결했다.

1. coding-agent briefing fidelity
2. deep-research transparency
3. resource-aware concurrency control
4. release-grade carryover gating

하지만 `v23`의 한계도 명확하다.

- text-level parity는 확인됐지만 behavior-level eval은 없다
- live agent replay와 workflow audit는 별도 검증 루프가 없다
- packet이 실제 운영에서 얼마나 일관되게 사용되는지 adoption visibility가 부족하다
- guide/runtime/skill/example 간 연결은 강화됐지만 execution trace와 regression harness는 아직 약하다

따라서 `v24`의 주제는 새 doctrine을 많이 추가하는 것이 아니라, 이미 정의된 control surface를 실제 작동성과 검증 가능성까지 끌어올리는 것이다.

---

## 2. v23 기준 진단

### 2.1 v23가 이미 강한 부분

- coding-agent briefing, human quality gate, research transparency, resource-concurrency, release review가 문서 전 계층에 반영돼 있다
- `Coding-agent invocation pack`, `Source consultation ledger`, `Resource budget and route-choice memo`, `Prompt-stack release review`가 operator-facing artifact로 정착했다
- guide -> runtime -> skill -> example -> release gate parity가 문서 수준에서는 성립한다

### 2.2 v24에서 보강해야 할 핵심 공백

1. 문서에 있는 control packet이 실제 실행에서 자동으로 빠지지 않는지 검증하는 장치가 없다.
2. Deep Research나 coding-agent flow의 trajectory를 behavior-level로 평가하는 harness가 없다.
3. packet 사용 여부, 누락률, fallback 빈도, quality-gate 통과 경로를 측정하는 telemetry 관점이 약하다.
4. multi-agent / delegated path에서 join quality와 reviewer burden을 정량적으로 다루는 표준이 약하다.
5. release review는 강화됐지만 실제 release gate를 통과시키는 증거 패키지 형식이 더 operational해질 필요가 있다.

---

## 3. v24의 핵심 보강 축

### P0. Behavior-level evaluation and replay layer

#### 문제

`v23`는 문서와 packet 구조는 강하지만, 실제 실행이 그 구조를 충실히 따르는지 검증하는 behavior-level loop가 부족하다.

#### v24 보강 방향

- prompt-stack용 `behavior-level eval` surface를 별도 축으로 명시
- representative task set에 대해 packet emission, review gate, retrieval transparency, reroute behavior를 replay 기반으로 검증
- `document parity`와 `runtime behavior parity`를 분리해 평가

#### 필요 요소

- replay scenario specification
- packet emission checklist
- trajectory review rubric
- expected fallback / escalation path
- failure taxonomy for missing packet, silent reroute, silent approval collapse

#### 목표

- “문서에 있다”를 넘어서 “실제 실행에서 나온다”를 검증 가능하게 만든다

---

### P0. Packet compliance and omission detection

#### 문제

현재 packet family는 잘 정의돼 있지만, 어떤 작업에서 어떤 packet이 반드시 나와야 하는지에 대한 compliance view가 아직 약하다.

#### v24 보강 방향

- task family별 required / recommended / optional packet matrix 정의
- packet omission을 evaluation finding으로 직접 연결
- 특히 아래 packet에 대해 omission detector 강화

- `Coding-agent invocation pack`
- `Source consultation ledger`
- `Resource budget and route-choice memo`
- `Prompt-stack release review`

#### 목표

- operator가 “이 작업에서 무엇이 빠졌는지”를 빠르게 판정할 수 있게 한다

---

### P0. Deep-research execution audit hardening

#### 문제

`v23`는 source consultation transparency를 문서화했지만, 실제 research run에서 plan revision, source downgrade, query lineage drift를 감사하는 구조는 아직 약하다.

#### v24 보강 방향

- deep research 전용 execution audit packet 또는 review block 강화
- 다음 상태를 평가 가능하게 유지

- initial research plan vs final research path
- source inclusion / exclusion / downgrade rationale
- public/private source blend transition
- citation sufficiency vs consulted-source transparency sufficiency
- tool-step visibility when MCP or code execution materially shaped the answer

#### 목표

- research quality를 citation density 하나로 오판하지 않게 만든다

---

### P1. Delegation admission control and join-quality review

#### 문제

`v23`는 orchestration topology와 concurrency economics를 강화했지만, 실제로 언제 delegation을 허용하고 언제 막아야 하는지, fan-out 뒤 join quality를 어떻게 평가할지에 대한 기준은 더 명시될 수 있다.

#### v24 보강 방향

- delegation admission gate 강화
- join artifact quality 기준 강화
- reviewer burden과 merge ambiguity를 resource-aware control의 일부로 승격

#### 확장 포인트

- delegated task fitness check
- branch overlap risk
- reviewer load estimate
- synthesis integrity check
- join-failure recovery protocol

#### 목표

- parallelism이 throughput은 높이고 decision quality는 떨어뜨리는 상태를 조기에 감지한다

---

### P1. Human quality-gate operationalization

#### 문제

`v23`는 human quality gate를 control surface로 올렸지만, 실제로 어떤 검토자가 무엇을 승인했는지, proposal-shaped state가 어디서 acceptance로 전환되는지에 대한 audit granularity는 더 operational해질 수 있다.

#### v24 보강 방향

- review owner, approval event, acceptance condition, rejection loop를 더 구조화
- coding, research, orchestration path별 human gate 차이를 구분
- “reviewed”, “approved”, “accepted for merge”, “accepted for release”를 혼동하지 않게 state 분리

#### 목표

- human-in-the-loop가 단순 문구가 아니라 inspectable lifecycle state가 되게 만든다

---

### P1. Release evidence packet hardening

#### 문제

`Prompt-stack release review`는 좋아졌지만, release gate에 실제로 무엇을 첨부해야 충분한지에 대한 evidence packaging은 더 강화될 수 있다.

#### v24 보강 방향

- release review와 함께 제출해야 할 evidence bundle 규칙 강화
- 최소 bundle 예시:

- packet coverage snapshot
- representative behavior replay summary
- regression findings summary
- known limitations and downgraded claims
- unresolved high-risk gap list

#### 목표

- release decision이 더 이상 prose quality나 단편적 grep 확인에 의존하지 않게 만든다

---

## 4. v24에서 다뤄야 할 문서 계층

`v24`도 `v23`와 동일한 active 계층 전체를 대상으로 해야 한다.

- root/runtime
- governance
- base prompts
- overlays
- example layer
- Codex skills

추가로 `v24`에서는 다음 두 성격의 문서를 강화 대상으로 본다.

1. evaluation-driving documents
2. replay / audit / release evidence documents

즉 `v24`는 prompt doctrine만이 아니라 “검증용 artifact layer”까지 prompt-stack 내부에 포함시키는 방향이 적절하다.

---

## 5. 파일군별 예상 보강 방향

### 5.1 `AGENTS.md`

- packet omission과 review-state honesty를 더 강하게 명시
- behavior-level verification과 document-level verification을 분리
- acceptance language를 review state에 맞춰 더 엄격히 제한

### 5.2 `PROMPT_USER_GUIDE.md`

- task family별 required packet lookup 강화
- replay/eval/release bundle lookup 추가
- operator용 “what to verify next” 가이드 강화

### 5.3 `codex/CODEX_RUNTIME_GUIDE.md`

- runtime 중 packet emission expectation 추가
- behavior-level audit path와 replay path 연결
- delegation admission / join review를 runtime surface에 연결

### 5.4 `00_governance/PROMPT_guideline.md`

- packet compliance doctrine 추가
- behavior replay와 evidence bundle doctrine 추가
- approval-state naming discipline 강화

### 5.5 `01_base/*`

- compressed mode에서도 omission-sensitive minimum artifact rule 유지
- direct solve path에서도 required packet skip이 일어나지 않도록 하한선 명시

### 5.6 `02_overlays/*`

- retrieval overlay: research audit and source downgrade review 강화
- evaluation overlay: replay rubric, packet omission detector, release evidence gate 추가
- multi-agent overlay: delegation admission and join-quality review 강화
- guardrail overlay: silent approval collapse, silent reroute, silent source downgrade 같은 failure mode 명시
- memory overlay: audit artifact를 memory로 승격할지 여부의 기준 강화

### 5.7 `03_examples/*`

- replay review packet
- packet compliance report
- delegation admission memo
- join-quality review memo
- release evidence bundle memo

위와 같은 example entry가 추가 또는 확장될 가능성이 높다.

### 5.8 `codex/skills/*`

- `eval-ops`: replay-driven review와 packet omission detection 강화
- `grounded-research`: research audit packet 사용 규칙 강화
- `orchestration-control`: delegation admission / join-quality review 강화
- `coding-core`: acceptance-state and reviewer-event discipline 강화
- `design-analysis`: release evidence reasoning과 replay-based recommendation validation 강화

---

## 6. v24 완료 기준

`v24`가 완료됐다고 보려면 최소 다음이 충족돼야 한다.

1. `v23`의 네 축이 유지된다.
2. 문서-level parity뿐 아니라 behavior-level eval 관점이 명시된다.
3. task family별 required packet / optional packet 구분이 더 선명해진다.
4. packet omission이 release/eval finding으로 연결된다.
5. deep research에 대해 source transparency뿐 아니라 execution audit이 추가된다.
6. delegation path에 대해 admission gate와 join-quality review가 추가된다.
7. release review가 evidence bundle 중심으로 더 operational해진다.
8. `99_original/*`는 계속 제외된다.

---

## 7. 비목표

`v24`에서 의도적으로 하지 않을 것:

- packet family를 무제한 증식시키는 것
- raw hidden reasoning, raw search transcript, raw internal trace를 user-facing artifact로 승격하는 것
- broad rewrite 미학을 위해 owner doctrine을 반복 복사하는 것
- frontier-model preference를 특정 vendor 고정 규칙으로 바꾸는 것
- evaluation theater를 위해 실제 운영 가치가 낮은 scorecard만 늘리는 것

---

## 8. 최종 판단

`v23`의 본질은 “operator-facing execution artifacts”를 전 계층에 정렬한 것이다.

`v24`의 본질은 그 artifact들이 실제 실행에서:

- 빠지지 않고
- 검증 가능하며
- replay 가능하고
- release decision에 증거로 제출될 수 있도록

운영 검증 계층까지 확장하는 것이다.

즉 `v24`는 새 doctrine을 많이 만드는 버전이 아니라, `v23`의 doctrine을 operational proof 상태로 끌어올리는 버전이어야 한다.
