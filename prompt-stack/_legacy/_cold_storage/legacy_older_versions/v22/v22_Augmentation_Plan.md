# v22 Augmentation Plan

## 1. 목적

`Agentic_Design_Patterns.pdf`와 로컬 추출본

- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`

을 근거로, `prompt-stack/v22`의 active prompt 문서 전체를 다시 점검하고 다음 보강 라운드의 초점을 정리한다.

이번 계획의 전제는 분명하다.

- `v22`는 이미 `goal / recovery / approval / budget / prioritization` packet parity, trajectory-safe evaluation, async lifecycle honesty, release review surface를 상당 수준 흡수한 상태다.
- 따라서 이번 라운드의 핵심은 chapter coverage 확대가 아니라, PDF가 요구하는 에이전틱 운영 제어면을 `owner -> base -> overlay -> guide -> Codex runtime -> skill -> example -> release audit` 전 경로에 더 operational하게 연결하는 것이다.
- 특히 `99_original/*`는 의도적으로 제외된 reference baseline이므로, 이번 계획은 `prompt-stack/v22`의 active 문서 전체만을 augmentation target으로 본다.

이번 라운드의 중심 과제는 아래 다섯 축으로 요약된다.

1. substrate readiness의 reusable packet화
2. event-grade auditability / lifecycle trace 강화
3. topology taxonomy와 coordination substrate 세분화
4. resource-aware switching parity 보강
5. release-audit gate와 operator lookup parity 확장

---

## 2. 분석 범위와 근거

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`

### 2.2 분석 대상 active 문서

이번 계획의 범위는 `v22` active 문서 총 `22`개다.

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
  - `02_overlays/PROMPT_memory_adaptation_overlay.md`
  - `02_overlays/PROMPT_tool_protocol_overlay.md`
  - `02_overlays/PROMPT_multi_agent_overlay.md`
  - `02_overlays/PROMPT_search_reasoning_overlay.md`
  - `02_overlays/PROMPT_retrieval_grounding_overlay.md`
  - `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
  - `02_overlays/PROMPT_guardrails_safety_overlay.md`
- example layer
  - `03_examples/PROMPT_example_injection.md`
  - `03_examples/PROMPT_example_catalog.md`
- Codex skills
  - `codex/skills/coding-core/SKILL.md`
  - `codex/skills/design-analysis/SKILL.md`
  - `codex/skills/eval-ops/SKILL.md`
  - `codex/skills/grounded-research/SKILL.md`
  - `codex/skills/orchestration-control/SKILL.md`

### 2.3 제외 범위

- `99_original/*`는 이번 augmentation target이 아니다.
- broad rewrite를 위한 broad rewrite는 하지 않는다.
- owner doctrine을 다른 문서로 복제하는 방식은 피한다.

---

## 3. PDF 핵심 해석

이번 분석에서 중요한 것은 chapter name을 많이 옮기는 일이 아니라, PDF가 실제로 무엇을 runtime control problem으로 다루는지를 보는 일이다.

### 3.1 Foreword와 Thought Leader 서문의 압력

PDF의 앞부분은 단순한 미사여구가 아니다. 다음을 강하게 요구한다.

- clear problem framing
- supervised execution
- clean or interpretable data surfaces
- consistent metadata and identifiers
- well-defined APIs
- trustworthy verification and accountability

즉, 좋은 agent는 더 많은 autonomy 자체가 아니라, **더 좋은 substrate + 더 좋은 supervision + 더 좋은 auditability** 위에서만 안전하게 작동한다.

### 3.2 Chapter 15 / 18 / 19의 공통 메시지

`A2A`, `Guardrails`, `Evaluation and Monitoring`은 공통적으로 아래를 요구한다.

- lifecycle state를 숨기지 말 것
- state transition을 재구성 가능하게 남길 것
- partial state와 complete state를 구분할 것
- observability를 prose가 아니라 operational artifact로 다룰 것

현재 `v22`는 `Async lifecycle status memo`와 `A2A task-handoff memo`를 이미 갖고 있지만, ordered event trail이나 audit-style transition artifact는 아직 약하다.

### 3.3 Chapter 7과 Chapter 15의 topology 압력

PDF의 multi-agent 관련 설명은 단순히 sequential / parallel / hierarchical만 말하지 않는다.

- single-agent sufficiency
- network
- supervisor
- supervisor as a tool
- hierarchical
- custom / hybrid

즉 topology 선택은 aesthetic choice가 아니라, communication structure와 control distribution의 문제다.

현재 `v22`의 `PROMPT_multi_agent_overlay.md`는 강하지만, topology taxonomy는 더 압축되어 있어 PDF의 세부 topology semantics를 전부 드러내지는 않는다.

### 3.4 Chapter 16의 resource-aware optimization 압력

PDF에서 `Resource-Aware Optimization`은 단순 budget 경고가 아니다.

- dynamic model or control-depth switching
- adaptive task or tool selection
- contextual pruning
- cost-sensitive exploration reduction
- graceful fallback

즉 resource-aware control은 static budget note가 아니라 **runtime route switching discipline**이다.

`v22` governance와 `PROMPT_full`에는 이 흔적이 이미 있으나, guide/runtime/skill/example parity는 아직 불균등하다.

---

## 4. v22 현재 상태 진단

### 4.1 강점

`v22`는 이미 다음을 상당 수준 충족한다.

- `AGENTS.md`, `PROMPT_USER_GUIDE.md`, `CODEX_RUNTIME_GUIDE.md`가 host-runtime carryover를 분명히 보여준다.
- `Goal-monitoring status memo`, `Recovery / escalation checkpoint memo`, `Resource budget and route-choice memo`, `Prioritization queue / next-action memo`가 top-level guide와 example layer에 이미 연결되어 있다.
- `PROMPT_multi_agent_overlay.md`는 lifecycle, polling, streaming, push, shared ontology, coordination cost를 이미 다룬다.
- `PROMPT_tool_protocol_overlay.md`는 substrate readiness, partial state, capability fit, MCP distinction을 owner 수준에서 다룬다.
- `PROMPT_evaluation_monitoring_overlay.md`는 trajectory, regression, coverage, release gate를 이미 owner 수준으로 운영한다.
- example layer에는 `Prompt-stack release review`, `A2A task-handoff memo`, `Async lifecycle status memo`, `Tool capability contract / precondition memo`, `Memory scope / checkpoint profile memo`가 이미 존재한다.

### 4.2 현재 약점

이번 라운드에서 실제로 남아 있는 약점은 아래 다섯 가지다.

1. `substrate readiness`가 doctrine으로는 강하지만 reusable packet으로는 약하다.
   - governance와 tool overlay에는 readiness doctrine이 있다.
   - 그러나 example layer에는 substrate 자체를 점검하는 packet이 없다.
   - guide/runtime/skills도 readiness를 prose로는 말하지만, operator가 재사용할 compact artifact가 부족하다.

2. auditability가 snapshot 중심이다.
   - `Async lifecycle status memo`는 current-state snapshot에 강하다.
   - 하지만 tool/MCP/A2A/safety event의 ordered transition trail, trace identifier, state-change audit surface는 약하다.
   - PDF의 `audit logs`, `structured logging`, `state transitions` 압력에 비해 아직 memo-level compression이 부족하다.

3. topology taxonomy가 PDF보다 좁다.
   - 현재 overlay와 orchestration skill은 sequential / parallel / hierarchical / critic / agent-as-tool 중심이다.
   - `network`, `supervisor`, `supervisor-as-tool`, `custom/hybrid`에 대한 operational guidance가 약하다.
   - shared scratchpad/message-bus류 coordination substrate도 명시적 owner 표현이 약하다.

4. resource-aware switching이 owner 문서에 비해 carryover가 약하다.
   - `PROMPT_guideline.md`와 `PROMPT_full.md`에는 dynamic switching, adaptive task allocation, contextual pruning이 이미 있다.
   - 그러나 `PROMPT_USER_GUIDE.md`, `CODEX_RUNTIME_GUIDE.md`, relevant skills, example layer에서 이 축이 packet-level로 충분히 operationalized 되지 않았다.

5. release audit가 위 네 축을 직접 gate로 보지는 않는다.
   - prompt-stack integrity audit는 이미 강하다.
   - 하지만 substrate-readiness carryover, event-audit trail, topology taxonomy coverage, resource-switching parity를 별도 gate로 보강할 여지가 있다.

---

## 5. 보강 원칙

1. `22/22` active 문서를 모두 범위에 포함한다.
2. `99_original/*`는 건드리지 않는다.
3. owner 문서를 복제하지 않고, owner-preserving carryover만 강화한다.
4. 가능하면 기존 packet을 확장하고, 진짜 빈 control problem에만 새 packet을 추가한다.
5. broad rewrite보다 narrow augmentation과 parity alignment를 우선한다.
6. guide/runtime/skill/example/release-review까지 operator-facing usability를 같이 맞춘다.

---

## 6. 우선순위별 보강 계획

### P0. Operational substrate readiness packetization

#### 문제

`v22`에는 substrate readiness doctrine이 이미 있다.

- `PROMPT_guideline.md`는 `clean data`, `consistent metadata`, `well-defined APIs`, `logs or audit signals`, `shared ontology quality`를 말한다.
- `PROMPT_tool_protocol_overlay.md`는 substrate readiness를 tool-owner 수준에서 정의한다.

하지만 operator가 바로 재사용할 compact packet은 없다.

현재의 `Tool capability contract / precondition memo`는 capability contract에는 강하지만, 아래 전체를 한 번에 다루기엔 범위가 좁다.

- data quality
- metadata/schema quality
- API failure semantics
- auth/session boundary
- observability signals
- rollback/checkpoint readiness
- shared ontology readiness

#### 보강 방향

다음 새 packet family를 도입하는 쪽이 가장 타당하다.

- `Operational substrate readiness memo`

이 packet은 다음 경계가 실제 의사결정을 바꿀 때만 사용한다.

- autonomy level 결정
- tool/MCP/A2A adoption 가능성 판단
- high-impact design recommendation
- release/readiness review

#### 예상 수정 대상

- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`
- 필요 시 `AGENTS.md`
- 필요 시 `01_base/PROMPT_standalone.md`

#### 목적

- PDF 서문과 Chapter 10/15/16/18/19의 substrate pressure를 active stack에서 reusable artifact로 operationalize한다.
- “agent-ready enough?”라는 질문을 prose가 아니라 packet으로 묻도록 만든다.

---

### P0. Event-grade auditability and lifecycle trace hardening

#### 문제

현재 `v22`는 partial-state honesty에는 강하지만, event trail에는 약하다.

이미 있는 것:

- `A2A task-handoff memo`
- `Async lifecycle status memo`
- `Safe trajectory artifact report`

부족한 것:

- ordered state-transition trail
- audit or trace identifier carryover
- async tool/MCP/A2A/safety event를 한 줄기 timeline으로 재구성하는 compact artifact

즉 지금은 “현재 상태”는 잘 보이지만, “어떤 transition을 거쳐 여기까지 왔는가”는 덜 구조화되어 있다.

#### 보강 방향

가능한 최소 변경 경로는 아래 둘 중 하나다.

1. `Async lifecycle status memo` 확장
2. 새 packet 추가

이번 계획 기준의 권장안은 다음이다.

- existing `Async lifecycle status memo`는 snapshot packet으로 유지
- 별도 `Lifecycle event / audit trail memo`를 추가

이 packet은 raw verbose logs가 아니라 아래만 남긴다.

- task / request identifier
- ordered state transitions
- important events only
- approval / restriction changes
- blocker / recovery event
- integration-relevant partial artifact reference

#### 예상 수정 대상

- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/orchestration-control/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- 필요 시 `AGENTS.md`
- 필요 시 `01_base/PROMPT_standalone.md`

#### 목적

- Chapter 15/18/19의 `audit logs`, `structured logging`, `lifecycle transitions` 압력을 release-safe packet으로 흡수한다.
- snapshot honesty를 event-trail auditability까지 확장한다.

---

### P1. Topology taxonomy and coordination substrate expansion

#### 문제

현재 `PROMPT_multi_agent_overlay.md`와 `orchestration-control`은 강하지만, topology map은 PDF보다 압축되어 있다.

현재 강한 것:

- sequential handoffs
- parallel processing
- hierarchical delegation
- debate and consensus
- expert team
- critic-reviewer
- agent-as-tool

상대적으로 약한 것:

- network
- supervisor
- supervisor-as-tool
- custom / hybrid topology
- shared scratchpad / message-bus / coordination substrate guidance

즉 지금의 v22는 “topology를 고르는 규칙”은 좋지만, “어떤 topology family가 어떤 communication substrate와 함께 맞는가”는 더 세밀해질 수 있다.

#### 보강 방향

새 packet family를 크게 늘리기보다는 아래를 우선한다.

- `PROMPT_multi_agent_overlay.md` topology map 확장
- `orchestration-control` skill의 topology selection discipline 확장
- existing `Orchestration topology decision memo` 확장

특히 아래 필드를 topology decision packet에 추가하거나 강화하는 방향이 좋다.

- `candidate_topologies` canonical labels
- `communication_surface`
- `shared_state_contract`
- `supervision_mode`
- `fallback_topology`

#### 예상 수정 대상

- `02_overlays/PROMPT_multi_agent_overlay.md`
- `codex/skills/orchestration-control/SKILL.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- 필요 시 `00_governance/PROMPT_guideline.md`
- 필요 시 `02_overlays/PROMPT_memory_adaptation_overlay.md`

#### 목적

- Chapter 7과 Chapter 15의 topology granularity를 active stack에 반영한다.
- coordinator-specialist 일변도 압축을 줄이고, communication structure 자체를 auditable decision surface로 만든다.

---

### P1. Resource-aware switching parity reinforcement

#### 문제

`PROMPT_guideline.md`와 `PROMPT_full.md`에는 이미 다음이 보인다.

- `dynamic model or control-depth switching`
- `adaptive task allocation`
- `contextual pruning`
- `cost-sensitive exploration reduction`
- `graceful fallback`

하지만 이 축은 아직 owner 쪽이 가장 강하다.
guide, Codex runtime, relevant skills, example layer에서는 packet-level operational parity가 부족하다.

특히 부족한 부분은 아래다.

- model/tool/runtime tier를 언제 낮추거나 올릴지
- cheaper fallback과 stronger-route trigger를 어떻게 노출할지
- cost-sensitive exploration reduction을 언제 stop condition으로 연결할지

#### 보강 방향

새 packet을 무리하게 늘리기보다 아래를 한다.

- existing `Resource budget and route-choice memo` 확장
- `PROMPT_USER_GUIDE.md`와 `CODEX_RUNTIME_GUIDE.md` lookup 강화
- relevant skills에서 route-tier switching과 fallback trigger를 더 명시

관련 primary skill은 특히 아래다.

- `design-analysis`
- `grounded-research`
- `orchestration-control`
- `eval-ops`

필요 시 `coding-core`에도 boundary reminder를 추가한다.

#### 예상 수정 대상

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`
- 필요 시 `AGENTS.md`

#### 목적

- Chapter 16의 resource-aware control을 owner doctrine에만 남기지 않고 active runtime bundle 전체에서 보이게 만든다.
- “budget awareness”를 “runtime switching discipline”으로 끌어올린다.

---

### P1. Release-audit and lookup parity extension

#### 문제

현재 `v22`는 release review가 이미 강하지만, 이번에 보강하려는 네 축을 명시적 gate로 보지는 않는다.

즉 앞으로 문서가 다시 압축되거나 재구성될 때 아래가 조용히 사라질 수 있다.

- substrate readiness packet carryover
- lifecycle event audit trail
- topology taxonomy granularity
- resource-aware switching parity

#### 보강 방향

`Prompt-stack release review`와 `eval-ops` 계열에 다음 gate를 추가하거나 강화한다.

- substrate-readiness carryover gate
- lifecycle auditability gate
- topology taxonomy coverage gate
- resource-switching parity gate
- guide/runtime/skill/example lookup parity gate

#### 예상 수정 대상

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `codex/skills/eval-ops/SKILL.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- 이번 augmentation이 일회성 prose 추가로 끝나지 않게 한다.
- 이후 `v23+` 개편에서 regression detector 역할을 하게 만든다.

---

## 7. 파일군별 예상 수정 강도

### Heavy

- `00_governance/PROMPT_guideline.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

### Medium

- `AGENTS.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

### Light / parity-only

- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `codex/skills/coding-core/SKILL.md`

---

## 8. 비목표

이번 계획에서 의도적으로 하지 않는 것:

- `99_original/*` 수정
- active prompt 본문에 버전 문자열을 과잉 주입하는 일
- owner doctrine의 중복 복사
- packet family를 과도하게 증식시키는 일
- topology나 auditability를 명분으로 decorative structure를 늘리는 일
- raw hidden chain-of-thought 또는 raw polling trace dump를 정당화하는 일

---

## 9. 구현 완료 기준

다음 조건이 충족되면 이번 augmentation round는 계획 대비 완료로 본다.

1. `Operational substrate readiness memo`가 owner, guide, runtime, skill, example layer에서 일관된 control surface로 보인다.
2. lifecycle/event/audit trail 압력이 `tool / MCP / A2A / safety / evaluation` 경로에 snapshot 이상으로 반영된다.
3. topology taxonomy가 `network`, `supervisor`, `supervisor-as-tool`, `custom/hybrid`까지 boundary-level로 보강된다.
4. existing `Orchestration topology decision memo`가 communication surface와 shared-state contract까지 더 분명히 드러낸다.
5. `Resource budget and route-choice memo`가 dynamic switching and fallback trigger까지 더 operational하게 확장된다.
6. `Prompt-stack release review`가 위 네 축을 regression gate로 검사한다.
7. active `22/22` 문서가 direct augmentation 또는 parity alignment 범위에 명시적으로 포함된다.
8. `99_original/*`는 여전히 untouched 상태로 유지된다.

---

## 10. 최종 판단

`v22`는 이미 약한 버전이 아니다.
현재 부족한 것은 큰 패턴의 부재가 아니라, PDF가 후반부에서 강하게 요구하는 운영 디테일의 마지막 1단계다.

즉 이번 라운드의 정답은 다음을 더 추가하는 데 있다.

- 더 많은 doctrine

가 아니라 아래를 더 operational하게 만드는 데 있다.

- substrate readiness
- event-grade auditability
- topology granularity
- resource-aware switching
- release-time regression protection

한 줄로 요약하면, `v22`의 다음 augmentation은 **chapter coverage expansion**이 아니라 **agentic operationalization completion across the whole active stack**에 맞춰져야 한다.
