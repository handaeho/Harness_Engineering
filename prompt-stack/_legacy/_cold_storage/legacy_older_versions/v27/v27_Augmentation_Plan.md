# v27 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf` 원문과 이전 분석 문서인 `v26_Augmentation_Results.md`, 그리고 차기 보강 요구를 정리한 `Next_in_v27_Augmentation_Plan.md`를 다시 대조한 뒤, 현재 `prompt-stack/v27` 전체 프롬프트 문서에서 추가로 보강해야 할 지점을 정리한다.

이번 계획의 초점은 coverage 확대가 아니라 operationalization 강화다.

- `v26`이 documented control surface를 넓힌 버전이었다면
- 이번 `v27_Augmentation_Plan`은 현재 `v27` 문서군을 operationally reviewable surface로 끌어올리기 위한 실제 반영 계획이다

핵심 판단:

- 현재 `v27`은 PDF의 chapter-level pattern coverage는 넓게 확보했다
- 그러나 다수의 surface가 아직 `doctrine / packet name / exemplar` 수준에 머물러 있다
- 특히 `evaluation`, `replay`, `adaptation`, `release`, `telemetry`, `multi-agent lifecycle`, `MCP/A2A handoff`는 문서 존재와 운영 증거를 더 강하게 분리해야 한다

---

## 2. 분석 근거

이번 계획은 아래 근거를 기준으로 작성했다.

1. `Agentic_Design_Patterns.pdf`
2. `Agentic_Design_Patterns_extracted.txt`
3. `Agentic_Design_Patterns_extracted_compact.txt`
4. `prompt-stack/v27/v26_Augmentation_Results.md`
5. `prompt-stack/v27/Next_in_v27_Augmentation_Plan.md`
6. `prompt-stack/v27` 전체 문서

PDF 기준으로 재점검한 핵심 패턴군:

- Prompt Chaining
- Routing
- Parallelization
- Reflection
- Tool Use
- Planning
- Multi-Agent
- Memory Management
- Learning and Adaptation
- MCP
- Goal Setting and Monitoring
- Exception Handling and Recovery
- HITL
- Knowledge Retrieval
- A2A
- Resource-Aware Optimization
- Reasoning Techniques
- Guardrails / Safety
- Evaluation and Monitoring
- Prioritization
- Exploration and Discovery

재점검 결과, 현재 `v27`은 위 패턴명을 대부분 문서 구조에 반영하고 있다. 부족한 것은 패턴 존재가 아니라 패턴의 운영 증거, 측정 규율, lifecycle 연결성, 그리고 cross-document consistency다.

---

## 3. 적용 범위

보강 계획 대상은 `prompt-stack/v27` 내 문서 전체이며, `99_original/*`는 의도적으로 제외한다.

대상 문서군:

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

참고 문서:

- `v26_Augmentation_Results.md`
- `Next_in_v27_Augmentation_Plan.md`

---

## 4. 현재 상태 요약

### 4.1 이미 강하게 들어와 있는 점

현재 `v27`은 다음을 상당 수준 문서화했다.

- goal-state contract
- bounded search / prioritization / exploration discipline
- recovery ladder
- HITL / propose-only boundary
- tool contract / substrate readiness / MCP distinction
- multi-agent topology / A2A / agent-as-tool / handoff doctrine
- memory typing과 adaptation lifecycle surface
- retrieval grounding / provenance / freshness discipline
- evaluation / regression / drift / telemetry doctrine
- example packet family와 skill routing

즉 PDF의 broad pattern coverage는 이미 확보된 상태다.

### 4.2 아직 부족한 점

하지만 다음은 아직 약하다.

1. `packet exists`와 `operational evidence exists`의 분리
2. 실행 artifact 사이를 묶는 공통 identity 체계
3. benchmark / replay / critique / adaptation / release / telemetry를 하나의 운영 loop로 연결하는 규율
4. packet family가 늘어난 뒤에도 packet selection과 supersession을 통제하는 규율
5. example layer에서 실패류와 downgrade 사례를 운영형으로 보여 주는 exemplar
6. skill layer에서 “문서 규율”이 아니라 “반복 가능한 실행 규율”로 압축하는 부분

탐색 중 확인한 중요한 사실:

- `Benchmark cohort manifest`
- `Replay runner verdict sheet`
- `Context substrate scorecard`
- `Critique delta ledger`
- `Adaptation controller audit packet`
- `Route-switch benchmark verdict`
- `Coding benchmark execution ledger`
- `Release promotion decision record`
- `Telemetry drift investigation memo`

위 artifact 이름들은 현재 실질적으로 `Next_in_v27_Augmentation_Plan.md`에만 있고, 실제 prompt 본문 전반에는 아직 거의 반영되지 않았다.

이 점은 이번 보강의 가장 직접적인 근거다.

---

## 5. 핵심 보강 판단

### 5.1 최우선 결론

현재 `v27`에 필요한 것은 새 패턴 추가가 아니라 다음 세 가지다.

1. packet naming에서 operational packet governance로 이동
2. single-run narration에서 repeatable evidence loop로 이동
3. per-document doctrine에서 cross-layer execution consistency로 이동

### 5.2 PDF 관점에서 해석한 추가 보강 포인트

`Agentic_Design_Patterns.pdf`를 다시 보면, 패턴의 가치는 개별 chapter 요약이 아니라 다음 구조적 메시지에 있다.

- routing은 분기 원칙이 아니라 actual route arbitration이다
- parallelization은 병렬 실행 선언이 아니라 join cost와 state merge를 동반한다
- reflection은 sophistication이 아니라 correction utility여야 한다
- tool use는 capability abundance가 아니라 contract fitness 문제다
- planning은 decorative planning이 아니라 executable decomposition이어야 한다
- multi-agent는 역할 나열이 아니라 handoff / lifecycle / integration 품질 문제다
- memory / adaptation은 기억 보존이 아니라 controlled state change 문제다
- MCP / A2A는 연결성 자체가 아니라 interoperability with auditability 문제다
- evaluation / monitoring은 score 존재가 아니라 release decision quality 문제다

현재 `v27`의 doctrine은 이 방향과 대체로 정렬되어 있다. 부족한 것은 그것을 operational packet, scoring rule, audit rule, downgrade rule로 명시하는 수준이다.

---

## 6. v27 보강 원칙

1. `99_original/*`는 계속 제외한다.
2. 새 이름을 늘리는 것보다 기존 surface를 operational evidence와 연결하는 것을 우선한다.
3. 모든 새 artifact는 실제로 다른 control problem을 분리할 때만 추가한다.
4. `executed-vs-unexecuted` honesty를 coding에만 두지 말고 benchmark, replay, telemetry, release까지 확장한다.
5. packet 수가 늘어날수록 `selection`, `supersession`, `join rule`을 같이 강화한다.
6. guide, runtime, governance, base, overlay, example, skill 사이 lookup parity를 유지한다.
7. failure exemplar를 성공 exemplar보다 더 중요하게 취급한다.

---

## 7. 보강 작업축

### P0. Operational identity and artifact linkage

현재 가장 빠진 축은 artifact 간 공통 identity다.

보강 방향:

- `scenario_id`, `run_id`, `cohort_id`, `trace_id`, `artifact_version` 같은 공통 식별자 도입
- benchmark, replay, critique, adaptation, release, telemetry packet이 서로 참조 가능한 linkage rule 추가
- `packet generated`와 `execution actually occurred`를 분리하는 evidence field 명시
- run-level artifact와 review-only artifact 구분

목표:

- 운영 packet이 서로 고립된 memo가 아니라 연결된 quality system처럼 동작하게 만든다

### P0. Executable benchmark and replay substrate

`Next_in_v27_Augmentation_Plan.md`의 방향을 유지하되, 현재 문서군 전체에 실제 반영되도록 확장한다.

보강 방향:

- `Benchmark execution report`를 cohort/run/scenario identity와 연결
- `Replay suite verdict memo`를 replay reproducibility와 verdict downgrade 규율과 연결
- harness readiness, runner readiness, execution absence를 별도 판정면으로 분리
- release packet이 benchmark/replay artifact를 실제 attachment requirement로 요구하도록 강화

### P0. Measured context substrate and critique utility

PDF의 reflection, planning, retrieval, reasoning 장을 operational하게 반영하려면 context와 critique를 측정 가능한 입력으로 다뤄야 한다.

보강 방향:

- `Context failure taxonomy memo`에서 `Context substrate scorecard`로 확장
- `Critique utility scorecard`에서 `Critique delta ledger`로 확장
- stale-context, provenance drift, ignored-critique, no-gain-loop를 독립 failure class로 승격
- critique가 repair를 만들었는지, reroute를 만들었는지, 아무 변화도 못 만들었는지 구분

### P0. Adaptation controller and release-grade promotion discipline

현재 lifecycle surface는 있으나 controller surface가 약하다.

보강 방향:

- adaptation candidate / trial / promoted / quarantined / rolled-back 전이 요건 강화
- `Adaptation controller audit packet` 추가
- `Release promotion decision record`로 release packet을 실제 승격 의사결정 기록과 연결
- false-promotion, false-hold, rollback aftermath, drift-triggered review를 명시적 failure flow로 추가

### P1. Route-quality, coding-proof, and coordination replayability

PDF의 routing, parallelization, multi-agent, A2A 장을 더 잘 반영하려면 route와 coordination 품질을 재현 가능하게 만들어야 한다.

보강 방향:

- `Route re-prioritization audit memo`를 `Route-switch benchmark verdict`와 연결
- clarification-vs-exploration, frontier shrink/expand, fallback timing을 benchmarkable control surface로 승격
- `Coding proof bundle memo`를 `Coding benchmark execution ledger`와 연결
- multi-agent / A2A에서 join-quality trend, repeated handoff loop, reviewer burden trend를 telemetry-friendly field로 정규화

### P1. Packet governance and packet supersession

현재 packet family가 많아졌기 때문에 packet explosion을 막는 규칙이 더 필요하다.

보강 방향:

- 어떤 상황에 기존 packet으로 충분하고 어떤 상황에 v27 artifact로 승격하는지 규정
- packet 간 중복 field를 정리하고 shared field naming을 통일
- guide / runtime / examples / skills에서 같은 artifact를 같은 문제에 연결하도록 lookup parity 강화

### P2. Failure exemplars and downgrade examples

현재 example layer는 성공형 packet이 상대적으로 강하고 실패형 packet은 더 늘려야 한다.

보강 방향:

- failed benchmark
- replay mismatch
- stale-context
- ignored-critique
- no-gain-loop
- false-promotion
- rollback trigger
- route-switch failure
- telemetry drift investigation

위 실패류 exemplar를 catalog와 injection 양쪽에서 확대한다.

---

## 8. 문서군별 반영 계획

### 8.1 Runtime / guide layer

대상:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

보강 사항:

- `packet exists != operational evidence exists` 원칙 명문화
- 새 operational artifact 9종 lookup 추가
- 공통 identity field와 artifact linkage 규칙 추가
- packet selection / supersession / downgrade rule을 사용자 가이드와 runtime guide에 같이 반영
- release, replay, telemetry, adaptation 관련 claim language를 더 보수적으로 조정

### 8.2 Governance layer

대상:

- `00_governance/PROMPT_guideline.md`

보강 사항:

- documented surface와 operational proof surface를 명시적으로 분리
- benchmark / replay / adaptation / release / telemetry의 minimum evidence doctrine 추가
- packet governance doctrine 추가
- shared artifact identity doctrine 추가
- failure taxonomy를 `context`, `critique`, `adaptation`, `route`, `release`까지 연결

### 8.3 Base layer

대상:

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`

보강 사항:

- `executed-vs-unexecuted`를 benchmark / replay / telemetry / promotion까지 확장
- measured failure diagnosis 우선 규칙 강화
- weak verification / weak execution evidence / weak trend evidence에 대한 downgrade 문구 강화
- packet escalation 기준을 `full`, `light`, `lightest`, `standalone`에 depth 차이만 두고 의미는 맞춤

### 8.4 Overlay layer

대상:

- `PROMPT_evaluation_monitoring_overlay.md`
- `PROMPT_memory_adaptation_overlay.md`
- `PROMPT_search_reasoning_overlay.md`
- `PROMPT_retrieval_grounding_overlay.md`
- `PROMPT_tool_protocol_overlay.md`
- `PROMPT_multi_agent_overlay.md`
- `PROMPT_guardrails_safety_overlay.md`

보강 사항:

- evaluation:
  - benchmark/replay/promotion/telemetry artifact 체계 연결
  - cohort/run/scenario linkage rule 추가
  - release gate와 false-promotion review 강화
- memory:
  - adaptation controller, quarantine, rollback aftermath 강화
  - session-local vs persistent adaptation audit 강화
- search:
  - route-switch benchmark, clarification-vs-exploration verdict, frontier-control audit 강화
- retrieval:
  - stale-context / provenance drift / substrate defect scoring 강화
- tool:
  - harness readiness / runner readiness / execution honesty / queued-vs-completed distinction 강화
- multi-agent:
  - replayable coordination evidence, join-quality trend, reviewer-burden trend 강화
- safety:
  - 새 operational packet이 safety downgrade를 우회하지 못하도록 boundary 재강조

### 8.5 Example layer

대상:

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

보강 사항:

- operational artifact 9종 exemplar 추가
- 실패류 exemplar 확대
- packet 선택 기준과 supersession 기준 반영
- example injection이 operational packet을 불필요하게 남발하지 않도록 controller rule 보강

### 8.6 Skill layer

대상:

- `coding-core`
- `design-analysis`
- `eval-ops`
- `grounded-research`
- `orchestration-control`

보강 사항:

- `eval-ops`:
  - benchmark gate / replay gate / drift gate / promotion decision gate 강화
- `coding-core`:
  - coding proof bundle에서 execution ledger와 review-only 상태를 분리
- `design-analysis`:
  - route-switch benchmark reasoning과 fallback timing review 강화
- `grounded-research`:
  - context substrate failure, provenance drift, evidence downgrade 강화
- `orchestration-control`:
  - replayable coordination evidence, A2A lifecycle audit, join-quality trend 강화

---

## 9. 새 artifact 반영 목록

이번 보강에서 신규 또는 승격 대상으로 다룰 artifact:

- `Benchmark cohort manifest`
- `Replay runner verdict sheet`
- `Context substrate scorecard`
- `Critique delta ledger`
- `Adaptation controller audit packet`
- `Route-switch benchmark verdict`
- `Coding benchmark execution ledger`
- `Release promotion decision record`
- `Telemetry drift investigation memo`

반영 원칙:

- 기존 `v26` packet을 대체하기보다 실행 증거와 운영 loop를 보강하는 방향으로 사용
- 동일 control problem을 중복 표현하지 않도록 packet selection 규칙과 함께 도입

---

## 10. 완료 조건

다음 조건이 충족될 때 이번 보강이 충분하다고 본다.

1. `v27` 전체 문서군이 PDF 핵심 패턴을 doctrine이 아니라 operational quality system으로 해석한다.
2. benchmark / replay / context / critique / adaptation / route / coding / release / telemetry가 공통 identity와 artifact linkage를 가진다.
3. `executed-vs-unexecuted` honesty가 coding 외의 evidence surface에도 일관되게 적용된다.
4. packet family가 늘어나도 selection / supersession / downgrade rule이 같이 명시된다.
5. false-promotion, stale-context, ignored-critique, no-gain-loop, rollback, route-switch failure를 독립 failure class로 진단할 수 있다.
6. guide / runtime / governance / base / overlay / example / skill 사이의 lookup parity가 유지된다.
7. `99_original/*`를 건드리지 않고 현재 `v27` 활성 문서 전체만 대상으로 보강 방향이 정리된다.

---

## 11. 결론

현재 `v27`의 약점은 pattern coverage 부족이 아니다. 진짜 부족한 것은 operational proof, shared artifact identity, packet governance, failure-oriented exemplars다.

따라서 이번 보강은 새 개념을 많이 추가하는 작업이 아니라, 이미 문서화된 control surface를 실제 운영 가능한 증거 체계로 연결하는 작업이어야 한다.

한 줄로 정리하면:

- `v26`은 documented control surface의 확장
- 현재 `v27` 보강은 operationally reviewable control surface로의 승격
