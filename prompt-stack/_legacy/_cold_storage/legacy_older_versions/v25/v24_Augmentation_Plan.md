# v24 Augmentation Plan

## 1. 목적

`Agentic_Design_Patterns.pdf` 재분석과 `prompt-stack/v24/v23_Augmentation_Results.md`, 그리고 현재 `prompt-stack/v24` active prompt 문서 상태를 함께 기준선으로 삼아 `v24`에서 충족해야 할 보강점을 다시 정의한다.

이번 라운드의 핵심은 새 doctrine을 많이 추가하는 것이 아니다. `v23`에서 정렬한 operator-facing control surface를 실제 실행 검증, replay, omission detection, release evidence 수준까지 operational하게 끌어올리는 것이다.

`v23`가 문서-level parity를 달성했다면, `v24`는 다음 질문에 답해야 한다.

1. 문서에 정의된 packet이 실제 실행에서 빠지지 않는가
2. trajectory와 process quality를 behavior-level로 재검토할 수 있는가
3. deep research와 delegated execution을 audit 가능한 형태로 되돌아볼 수 있는가
4. human quality gate와 release gate가 prose가 아니라 stateful evidence로 남는가

---

## 2. 근거와 분석 범위

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack/v24/v23_Augmentation_Results.md`
- 현재 `prompt-stack/v24` active prompt 문서 전체

### 2.2 분석 대상 active 문서

이번 계획의 범위는 `v24` active 문서 `22`개 전체다.

- root/runtime
  - `AGENTS.md`
  - `PROMPT_USER_GUIDE.md`
  - `codex/CODEX_RUNTIME_GUIDE.md`
- governance
  - `00_governance/PROMPT_guideline.md`
- base prompts
  - `01_base/PROMPT_full.md`
  - `01_base/PROMPT_light.md`
  - `01_base/PROMPT_lightest.md`
  - `01_base/PROMPT_standalone.md`
- overlays
  - `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
  - `02_overlays/PROMPT_guardrails_safety_overlay.md`
  - `02_overlays/PROMPT_memory_adaptation_overlay.md`
  - `02_overlays/PROMPT_multi_agent_overlay.md`
  - `02_overlays/PROMPT_retrieval_grounding_overlay.md`
  - `02_overlays/PROMPT_search_reasoning_overlay.md`
  - `02_overlays/PROMPT_tool_protocol_overlay.md`
- example layer
  - `03_examples/PROMPT_example_catalog.md`
  - `03_examples/PROMPT_example_injection.md`
- Codex skills
  - `codex/skills/coding-core/SKILL.md`
  - `codex/skills/design-analysis/SKILL.md`
  - `codex/skills/eval-ops/SKILL.md`
  - `codex/skills/grounded-research/SKILL.md`
  - `codex/skills/orchestration-control/SKILL.md`

### 2.3 명시적 제외

- `99_original/*`
- raw hidden reasoning trace를 user-facing artifact로 승격하는 방향
- owner doctrine의 broad duplicate copy

---

## 3. PDF 재분석 요약

### 3.1 Chapter 19는 final answer뿐 아니라 outcome / process / trajectory를 함께 보라고 한다

PDF는 평가를 최종 답의 품질에만 한정하지 않는다. outcome-based evaluation, process-based evaluation, human evaluation, trajectory inspection을 함께 보라고 한다. 또한 non-deterministic system에서는 mock tools와 dedicated testing environment를 통해 key element를 검증하는 방식이 필요하다고 설명한다.

이 해석은 `v24`에서 다음을 요구한다.

- document parity와 behavior parity를 분리해서 평가할 것
- packet emission과 tool usage를 replay-safe하게 검토할 것
- trajectory quality를 example layer와 eval layer에서 직접 다룰 것

### 3.2 Appendix G는 coding-agent를 단순 patch executor가 아니라 briefing-driven 팀원으로 본다

PDF는 coding-agent collaboration에서 다음을 강조한다.

- complete briefing package
- external knowledge와 human brief의 명시적 큐레이션
- agent output은 proposal이며 human quality gate가 최종 권한을 갖는다는 점
- iterative dialogue와 reviewer feedback loop

`v23`는 이 축을 문서에 이식했지만, `v24`에서는 approval event와 acceptance state를 더 세밀하게 operationalize해야 한다.

### 3.3 Deep Research는 citation만이 아니라 consulted-source transparency와 inspectable search path를 요구한다

PDF의 Deep Research 흐름은 다음을 함께 보여 준다.

- plan before execution
- iterative gap-driven search
- inline citations
- full consulted-source visibility
- public/private source blend
- intermediate step inspectability

`v23`는 `Source consultation ledger`를 추가했지만, `v24`에서는 plan revision, source downgrade, tool-step visibility, transparency sufficiency까지 audit 대상이 되어야 한다.

### 3.4 Chapter 16은 route switching보다 넓은 resource-aware control을 요구한다

PDF는 resource-aware optimization을 단순 cheaper fallback이나 stronger route trigger로만 보지 않는다.

- proactive resource prediction
- adaptive task allocation
- critique feedback into routing
- parallelization and distributed computing awareness
- graceful degradation

`v24`에서는 concurrency economics를 넘어 delegation admission, join burden, reviewer load, merge ambiguity까지 resource-aware control에 포함시켜야 한다.

### 3.5 Prompting an agent는 constitution + tools + constraints + process + example trajectory를 포함한다

PDF FAQ는 좋은 system prompt가 다음을 포함해야 한다고 본다.

- role and goal
- tool definitions
- constraints and rules
- process instructions
- example trajectories

이 해석은 `v24`에서 guide/runtime/example layer가 required packet, replay artifact, evidence bundle을 더 명시적으로 연결해야 함을 뜻한다.

---

## 4. 현재 v24 상태 진단

### 4.1 이미 강한 부분

`v24`는 `v23` 결과를 계승하고 있어 다음은 이미 강하다.

- coding-agent briefing fidelity
- deep-research transparency via `Source consultation ledger`
- resource-aware concurrency hints
- release-grade carryover gating
- `Safe trajectory artifact report`
- `Mock-tool evaluation report`
- `HITL approval packet`

즉 `v24`는 출발점이 빈 상태가 아니다. 기본 packet layer와 trajectory/eval surface는 이미 존재한다.

### 4.2 아직 남은 실제 공백

현행 `v24` 문서에서 다음 표현은 거의 없거나 매우 약하다.

1. task family별 `required / recommended / optional packet` 매트릭스
2. packet omission을 eval/release finding으로 직접 연결하는 규칙
3. `delegation admission`, `join-quality review`, `reviewer load estimate` 같은 fan-out governance
4. `accepted for merge`, `accepted for release`, `approval event`, `review owner`, `rejection loop` 같은 human gate lifecycle state
5. deep research의 `plan revision`, `source downgrade rationale`, `tool-step visibility`, `transparency sufficiency`
6. release review와 별도로 제출되는 `release evidence bundle`

즉 `v24`의 본질적 공백은 “새 packet이 아예 없다”가 아니라, 기존 packet family를 runtime compliance, replay audit, release evidence까지 끌어올리는 연결이 부족하다는 데 있다.

---

## 5. 보강 원칙

1. `22/22` active 문서를 범위에 포함한다.
2. `99_original/*`는 계속 제외한다.
3. 가능한 경우 새 packet을 무분별하게 추가하기보다 existing packet을 확장한다.
4. 새 packet은 truly distinct control problem일 때만 추가한다.
5. raw hidden reasoning, raw search transcript, raw polling trace는 계속 비목표다.
6. guide -> runtime -> skill -> example -> release/eval parity를 유지한다.
7. behavior-level evaluation은 document-level parity의 대체물이 아니라 별도 축으로 취급한다.

---

## 6. 핵심 보강 축

### P0. Behavior-level evaluation and replay hardening

#### 문제

현재 `v24`는 trajectory와 safe artifact를 말하지만, representative task replay를 통해 packet emission, reroute, review gate, research transparency를 behavior-level로 평가하는 구조는 아직 부족하다.

#### 보강 방향

- `document parity`와 `runtime behavior parity`를 분리
- representative task family replay를 eval artifact로 승격
- trajectory review를 generic observation이 아니라 scenario-based replay review로 구체화

#### packet 전략

기존 packet 확장:

- `Safe trajectory artifact report` 확장
  - replay scenario id
  - expected path class
  - observed packet emission
  - omission findings
  - replay verdict
- `Mock-tool evaluation report` 확장
  - packet emission assertions
  - trajectory checkpoints
  - approval/research transparency assertions

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`

#### 목표

- “문서에 있다”가 아니라 “실제 실행에서 검토 가능하게 나온다”를 검증할 수 있게 만든다

---

### P0. Packet compliance and omission detection

#### 문제

현재 어떤 작업에서 어떤 packet이 반드시 나와야 하는지에 대한 compliance matrix가 약하다. 그래서 omission이 있어도 구조적으로 finding으로 잡히지 않는다.

#### 보강 방향

- task family별 `required / recommended / optional packet` 분리
- omission을 evaluation finding과 release finding으로 직접 연결
- direct solve path나 compressed mode에서도 minimum artifact floor를 명시

#### packet 전략

새 packet 추가 권장:

- `Packet compliance report`

기존 packet 확장:

- `Prompt-stack release review`
  - `packet_compliance_state`
  - `behavior_replay_state`
  - `release_evidence_state`

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`

#### 목표

- operator가 “무엇이 빠졌는지”를 즉시 볼 수 있게 만든다

---

### P0. Deep-research execution audit hardening

#### 문제

`Source consultation ledger`는 strong start이지만, 현재는 post-synthesis transparency 중심이다. research run 전체에서 plan delta, source downgrade, transparency sufficiency를 따지는 execution audit은 아직 약하다.

#### 보강 방향

- pre-plan / post-run delta를 함께 보게 만든다
- source consultation transparency와 execution audit을 분리한다
- public/private blend transition과 tool-step visibility를 review boundary로 만든다

#### packet 전략

기존 packet 확장:

- `Source consultation ledger`
  - initial plan state
  - final research path delta
  - source downgrade rationale
  - transparency sufficiency note
  - tool-step visibility note

새 packet 추가는 optional:

- distinct control problem으로 판단되면 `Research execution audit memo`

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`

#### 목표

- research quality를 citation density만으로 과대평가하지 않게 만든다

---

### P1. Delegation admission control and join-quality review

#### 문제

`v24`는 orchestration topology와 concurrency hints는 있지만, “언제 delegation을 허용해야 하는가”, “fan-out 후 join quality를 어떻게 판정하는가”는 아직 문서적으로 약하다.

#### 보강 방향

- delegation admission gate 추가
- join artifact quality를 evaluation object로 승격
- reviewer load와 merge ambiguity를 resource-aware economics의 일부로 취급

#### packet 전략

새 packet 추가 권장:

- `Delegation admission memo`
- `Join-quality review memo`

기존 packet 확장:

- `Resource budget and route-choice memo`
  - reviewer_load_estimate
  - branch_overlap_risk
  - join_failure_trigger
- `Safe trajectory artifact report`
  - join outcome
  - synthesis integrity note

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/orchestration-control/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`

#### 목표

- parallelism이 throughput은 높이고 decision quality는 떨어뜨리는 상태를 조기에 식별한다

---

### P1. Human quality-gate lifecycle operationalization

#### 문제

현재 `proposal-shaped`와 `quality-gate owner`는 있으나, 실제 lifecycle state는 충분히 세밀하지 않다. 특히 `reviewed`, `approved`, `accepted for merge`, `accepted for release`는 분리되어야 한다.

#### 보강 방향

- review owner와 approval event를 state로 남긴다
- rejection loop와 re-review state를 정의한다
- coding / research / orchestration path별 human gate 차이를 분리한다

#### packet 전략

기존 packet 확장:

- `HITL approval packet`
  - review_owner
  - approval_event
  - acceptance_state
  - rejection_loop
  - release_restriction
- `Coding-agent invocation pack`
  - review_state_expectation

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

#### 목표

- human gate를 문구가 아니라 inspectable lifecycle contract로 만든다

---

### P1. Release evidence bundle hardening

#### 문제

`Prompt-stack release review`는 좋아졌지만, release gate가 어떤 증거 묶음을 요구하는지 아직 약하다. 지금 상태로는 grep 확인과 prose review에 과도하게 기대기 쉽다.

#### 보강 방향

- release review와 evidence bundle을 분리하지만 연결한다
- representative replay, packet compliance, high-risk gaps를 evidence bundle로 묶는다

#### packet 전략

새 packet 추가 권장:

- `Release evidence bundle memo`

기존 packet 확장:

- `Prompt-stack release review`
  - `packet_compliance_state`
  - `behavior_replay_state`
  - `delegation_join_state`
  - `approval_lifecycle_state`
  - `release_evidence_state`

#### 예상 수정 대상

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`

#### 목표

- release decision을 evidence-bound, audit-ready artifact로 만든다

---

## 7. 파일군별 예상 보강 강도

### Heavy

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

### Medium

- `AGENTS.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`

### Light / parity-only

- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`

---

## 8. 신규 또는 확장 가능성이 높은 control packet

### 우선 확장할 existing packet

- `Safe trajectory artifact report`
- `Mock-tool evaluation report`
- `Source consultation ledger`
- `HITL approval packet`
- `Coding-agent invocation pack`
- `Resource budget and route-choice memo`
- `Prompt-stack release review`

### distinct control problem일 때만 추가할 packet

- `Packet compliance report`
- `Delegation admission memo`
- `Join-quality review memo`
- `Release evidence bundle memo`
- optional `Research execution audit memo`

원칙:

- existing packet으로 충분하면 확장한다
- 새 packet은 control problem이 실제로 분리될 때만 추가한다

---

## 9. 구현 완료 기준

이번 라운드가 완료되었다고 보려면 최소 다음이 충족되어야 한다.

1. `v23`의 네 축이 유지된다.
2. behavior-level evaluation과 replay 관점이 guide/runtime/eval/example까지 연결된다.
3. task family별 required / recommended / optional packet 구분이 operator-facing하게 보인다.
4. packet omission이 evaluation finding과 release finding으로 연결된다.
5. deep research에 대해 source transparency뿐 아니라 execution audit surface가 반영된다.
6. delegation path에 대해 admission gate와 join-quality review surface가 반영된다.
7. human quality gate가 lifecycle state로 더 세분된다.
8. release review와 evidence bundle이 연결된다.
9. `99_original/*`는 untouched 상태로 유지된다.

---

## 10. 검증 계획

문서 반영 후 최소 다음 검증이 필요하다.

- `rg --files prompt-stack/v24`로 active 문서 목록 확인
- `rg` 기반 검색으로 아래 항목 존재 확인
  - `required packet`
  - `recommended packet`
  - `optional packet`
  - `packet compliance`
  - `behavior replay`
  - `delegation admission`
  - `join-quality`
  - `accepted for merge`
  - `accepted for release`
  - `release evidence bundle`
  - `source downgrade`
  - `plan revision`
- `PROMPT_example_catalog.md`에서 신규/확장 entry 존재 직접 확인
- `PROMPT_evaluation_monitoring_overlay.md`, `grounded-research`, `eval-ops`, `orchestration-control`, `CODEX_RUNTIME_GUIDE.md`에서 parity 확인

`Limitation`:

- 이번 계획 문서는 augmentation 실행 전 계획 문서다
- behavior-level replay, benchmark harness, live agent run 검증은 실제 반영 후 별도 결과 문서에서 다시 검증해야 한다

---

## 11. 최종 판단

`v23`의 본질은 operator-facing execution artifact를 전 계층에 심는 것이었다.

`v24`의 본질은 그 artifact가 실제 실행에서:

- 누락되지 않고
- replay 가능하며
- compliance와 omission이 평가 가능하고
- release evidence로 제출될 수 있도록

검증 계층까지 끌어올리는 것이다.

즉 `v24`는 doctrine 확장 라운드가 아니라, control surface operationalization 라운드여야 한다.
