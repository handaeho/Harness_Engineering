# v25 Augmentation Plan

## 1. 목적

`v25`의 목적은 `v24`가 달성한 문서-level operationalization을 넘어, `Agentic_Design_Patterns.pdf`의 전체 메시지를 실제 운영 증명, 지속 개선, benchmarkized validation, adoption telemetry 수준까지 끌어올리는 것이다.

기준선:

- `prompt-stack/v24/v24_Augmentation_Plan.md`
- `prompt-stack/v24/v24_Augmentation_Results.md`
- `Agentic_Design_Patterns.pdf`

`v24`는 다음을 문서에 심었다.

1. behavior replay and packet compliance
2. deep-research execution audit
3. delegation admission and join-quality review
4. human quality-gate lifecycle
5. release evidence bundle

하지만 `v24`의 한계는 아직 명확하다.

- behavior-level replay를 실제로 수행한 것은 아니다
- benchmark harness와 mock-tool test suite는 packet 차원에 머무르며 운영 루프로 승격되지 않았다
- packet usage frequency, omission rate, reviewer burden, replay coverage를 장기적으로 측정하는 telemetry가 없다
- prompt improvement feedback loop는 존재하지만 automated prompt optimization discipline까지는 올라가지 않았다
- PDF 전체가 말하는 context engineering, reflection loops, learning/adaptation, prioritization, exploration, CLI/benchmark reality를 장기 운영 모델로 통합하진 못했다

따라서 `v25`의 본질은 새 packet 몇 개를 더 추가하는 것이 아니라, `v24`가 만든 control surface를 실제로 측정하고 진화시키는 운영 체계를 prompt-stack 내부에 포함시키는 것이다.

---

## 2. v24 기준 진단

### 2.1 v24가 이미 달성한 것

- active `22`문서 전체에 replay/compliance/release-evidence surface가 반영돼 있다
- `Packet compliance report`, `Delegation admission memo`, `Join-quality review memo`, `Release evidence bundle memo`가 example layer에 존재한다
- guide -> runtime -> overlay -> skill -> example parity가 문서 수준에서는 성립한다

### 2.2 v25에서 남은 실질 공백

1. 문서에 있는 packet이 실제 task run에서 어느 정도 일관되게 사용되는지 측정하지 못한다.
2. representative task benchmark, replay suite, mock-tool assertion set이 versioned eval program으로 정착되지 않았다.
3. context engineering quality 자체를 평가하는 규칙이 아직 약하다.
4. reflection / critique loop의 품질과 stop condition을 장기적으로 평가하는 표준이 부족하다.
5. learning/adaptation surface는 있으나, promotion criteria와 rollback discipline이 여전히 가볍다.
6. prioritization / exploration / routing 품질을 release evidence와 연결하는 계층이 더 필요하다.
7. CLI/agent benchmark 현실을 반영한 repo-scale coding-eval surface가 아직 부족하다.

---

## 3. PDF 전체 관점에서 v25가 다뤄야 할 보강 축

### 3.1 Evaluation을 “artifact exists”에서 “measured program exists”로 끌어올려야 한다

PDF는 outcome-based evaluation, process-based evaluation, human evaluation, trajectory inspection, mock-tool testing을 함께 말한다.

`v24`는 artifact는 만들었지만, `v25`는 다음을 요구해야 한다.

- versioned replay suite
- task-family benchmark registry
- packet assertion inventory
- failure taxonomy and expected remediation
- human scoring rubric alignment

### 3.2 Context Engineering을 별도 quality surface로 승격해야 한다

PDF는 context engineering을 prompt phrasing보다 넓은 discipline으로 본다.

`v25`에서는 다음이 필요하다.

- context sufficiency review
- context overload / under-context failure mode
- external data, tool outputs, retrieved docs, user state의 packaging quality review
- context-pack regression detection

### 3.3 Reflection / Critique / Iteration의 품질을 직접 다뤄야 한다

PDF는 reflection을 execution 후 critique, refinement, iterative loops로 본다.

`v25`는 다음을 요구해야 한다.

- critique quality rubric
- iteration stop-condition review
- no-gain loop detector
- producer-critic contract regression checks
- reflection-driven reroute evidence

### 3.4 Learning / Adaptation은 promotion discipline까지 포함해야 한다

PDF는 adaptation을 단순 기억이 아니라 feedback-driven improvement로 본다.

`v24`는 adaptation surface를 갖고 있지만, `v25`는 다음을 명시해야 한다.

- adaptation candidate registry
- promotion threshold
- rollback threshold
- drift suspicion handling
- adaptation evidence bundle

### 3.5 Prioritization / Exploration / Routing 품질을 독립 평가 표면으로 확장해야 한다

PDF 전체 구조상 routing, prioritization, exploration은 단순 실행 heuristics가 아니라 평가 가능한 control quality다.

`v25`에서는 다음이 필요하다.

- route-quality benchmark
- prioritization-quality review
- exploration frontier discipline scoring
- clarification-vs-exploration decision audit
- fallback efficiency review

### 3.6 CLI/real coding benchmark reality를 반영한 coding-agent proof가 더 필요하다

PDF의 CLI appendix와 Terminal-Bench 논의는 실제 coding agent를 benchmark, repo context, test execution, auditable trail까지 포함해 봐야 한다는 점을 시사한다.

`v25`에서는 다음을 다뤄야 한다.

- repo-scale coding task benchmark shape
- test-running / verification-running policy surface
- commit / diff / audit trail review bundle
- coding-eval scenarios tied to briefing quality and human gate quality

---

## 4. v25 핵심 보강 축

### P0. Versioned replay and benchmark program

#### 문제

`v24`는 behavior replay artifact는 만들었지만, repeatable replay program과 benchmark registry는 아직 없다.

#### v25 보강 방향

- representative scenario catalog를 versioned eval program으로 승격
- task family별 replay suite 정의
- benchmark candidate, expected packet floor, expected route, expected failure class를 함께 기록

#### 목표

- “이 버전이 더 낫다”를 grep이 아니라 repeatable replay와 benchmark 결과로 말할 수 있게 한다

---

### P0. Context engineering quality gate

#### 문제

PDF는 context richness와 packaging quality를 핵심으로 보는데, 현재 stack는 context doctrine은 강하지만 context quality gate는 약하다.

#### v25 보강 방향

- context sufficiency / context overload / stale-context regression을 별도 gate로 정의
- coding, research, orchestration, release review에서 context-pack quality를 평가 가능하게 함

#### 목표

- bad answer를 model weakness로만 오판하지 않고 context engineering failure로도 잡아낸다

---

### P0. Reflection and no-gain-loop governance

#### 문제

reflection은 여러 문서에 있으나, critique quality와 iteration economics를 versioned quality surface로 운영하지는 않는다.

#### v25 보강 방향

- critique quality rubric
- no-gain iteration detector
- reroute-after-critique evidence
- producer-critic contract integrity check

#### 목표

- reflection이 sophistication theater가 아니라 measurable improvement mechanism이 되게 한다

---

### P1. Adaptation promotion and rollback discipline

#### 문제

learning/adaptation은 존재하지만, 어떤 signal이 실제 prompt-stack default를 바꿀 만큼 강한지에 대한 governance는 여전히 약하다.

#### v25 보강 방향

- adaptation candidate lifecycle
- promotion threshold
- rollback trigger
- adaptation evidence packet
- memory/adaptation separation audit

#### 목표

- one-off success가 silent default mutation으로 이어지지 않게 한다

---

### P1. Route, priority, and exploration quality scoring

#### 문제

route choice, next action ranking, exploration frontier control은 doctrine로는 있지만 scoreable quality surface는 충분히 분리돼 있지 않다.

#### v25 보강 방향

- route-quality rubric
- prioritization-quality rubric
- exploration-depth appropriateness rubric
- clarification-vs-exploration audit

#### 목표

- “맞는 답”뿐 아니라 “맞는 경로와 맞는 작업 선택”을 평가 대상으로 만든다

---

### P1. Repo-scale coding-agent proof surface

#### 문제

coding-agent briefing과 quality gate는 strong하지만, repo-scale coding benchmark와 verification-running policy는 더 선명해질 필요가 있다.

#### v25 보강 방향

- repo-scale coding scenario set
- verification execution expectations
- diff/audit/commit evidence surface
- coding benchmark tied to briefing quality, human gate, replay, and test evidence

#### 목표

- coding-agent quality를 단일 patch plausibility가 아니라 sustained engineering reliability로 본다

---

## 5. v25에서 우선 확장할 가능성이 높은 packet

기존 packet 우선 확장:

- `Safe trajectory artifact report`
- `Mock-tool evaluation report`
- `Packet compliance report`
- `Release evidence bundle memo`
- `Quality iteration checkpoint memo`
- `Learning-signal review memo`
- `Adaptation decision memo`

distinct control problem일 때만 추가 고려:

- `Benchmark registry memo`
- `Context sufficiency review memo`
- `Critique quality review memo`
- `Adaptation promotion review memo`
- `Route-quality scorecard`

원칙:

- 새 packet을 늘리기 전에 기존 packet이 담을 수 있는지 먼저 본다
- 새 packet은 benchmark / adaptation / context-quality처럼 genuinely separate surface일 때만 추가한다

---

## 6. 파일군별 예상 보강 방향

### `AGENTS.md`

- context-quality gate
- replay/benchmark truthfulness
- adaptation promotion caution
- review-state와 measured-state 분리 강화

### `PROMPT_USER_GUIDE.md`

- benchmark / replay / context sufficiency lookup 추가
- task family별 eval pack guidance 강화
- operator용 “what to measure next” 가이드 추가

### `codex/CODEX_RUNTIME_GUIDE.md`

- runtime benchmark attachment
- replay-to-release bridge
- context-pack review path
- reflection-governance path

### `00_governance/PROMPT_guideline.md`

- context engineering quality doctrine
- adaptation promotion doctrine
- benchmark and replay program doctrine

### `01_base/*`

- compressed mode에서도 context-quality and packet-floor minimum 유지
- no-gain loop and stale-context warnings 보강

### `02_overlays/*`

- evaluation overlay: benchmark registry, scoring rubric, adaptation gate
- search/reasoning overlay: route-quality, exploration-quality scoring
- memory/adaptation overlay: promotion/rollback governance
- retrieval overlay: context-evidence interaction quality
- multi-agent overlay: benchmarkized join and delegation outcomes

### `03_examples/*`

- benchmark registry
- context sufficiency review
- critique quality review
- adaptation promotion review
- route-quality scorecard

### `codex/skills/*`

- `eval-ops`: benchmark program, scoring rubric, adaptation gate
- `grounded-research`: context/evidence sufficiency review
- `orchestration-control`: measured delegation and join outcomes
- `coding-core`: repo-scale coding-eval path
- `design-analysis`: route-quality and benchmark-backed recommendation

---

## 7. v25 완료 기준

`v25`가 완료되었다고 보려면 최소 다음이 충족돼야 한다.

1. `v24`의 replay/compliance/release-evidence surface가 유지된다.
2. benchmark and replay program이 versioned artifact로 정의된다.
3. context engineering quality가 별도 평가 표면이 된다.
4. reflection / critique loop quality와 no-gain stop condition이 scoreable해진다.
5. adaptation promotion / rollback governance가 명시된다.
6. route / priority / exploration quality가 scorecard나 rubric 형태로 드러난다.
7. repo-scale coding-agent proof surface가 강화된다.
8. `99_original/*`는 계속 제외된다.

---

## 8. 비목표

`v25`에서 의도적으로 하지 않을 것:

- raw hidden reasoning trace를 user-facing artifact로 승격하는 것
- packet 수만 늘리고 운영 가치가 낮은 memo를 증식하는 것
- benchmark theater를 위해 실제 decision quality와 무관한 숫자만 늘리는 것
- vendor-specific model preference를 stack core doctrine으로 고정하는 것
- owner 문서를 broad duplicate copy로 퍼뜨리는 것

---

## 9. 최종 판단

`v23`는 execution artifact를 전 계층에 심는 버전이었다.

`v24`는 그것을 replay/compliance/release-evidence surface까지 operationalize한 버전이었다.

`v25`는 그 위에서 다음을 해야 한다.

- measured proof
- benchmarkized validation
- context-quality governance
- adaptation governance
- route/prioritization/exploration quality scoring

즉 `v25`의 본질은 “문서가 맞다”를 넘어서 “장기 운영과 반복 검증에서 계속 맞는지”를 보장하는 버전이어야 한다.
