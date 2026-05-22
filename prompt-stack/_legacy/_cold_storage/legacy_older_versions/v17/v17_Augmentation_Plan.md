# v17 Augmentation Plan

## 0. 목적

`Agentic_Design_Patterns.pdf`를 다시 심층 분석한 뒤, 현재 `prompt-stack/v17` 전체 프롬프트가 이미 강하게 커버하고 있는 agentic surface와 아직 운영 doctrine이 약한 surface를 분리해서 정리한다.

이번 `v17` 계획의 초점은 다음과 같다.

- chapter coverage를 다시 넓히는 것보다, 이미 들어온 패턴을 더 운영 가능하게 만드는 것
- `v16`에서 반영된 assembly / leakage / trajectory / mock-tool / environment-class 보강을 반복하지 않는 것
- 책이 특히 강조하는 runtime constitution, substrate readiness, measurable goals, coding-agent context layout, long-run supervision 쪽의 남은 공백을 좁히는 것

---

## 1. 근거와 판단 프레임

### 1.1 분석 근거

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack/v17/*`
- 비교 참고:
  - `prompt-stack/v15/v15_AGENTIC_PATTERNS_AUGMENTATION_RESULTS.md`
  - `prompt-stack/v16/v16_Augmentation_Plan.md`
  - `prompt-stack/v16/v16_Augmentation_Results.md`

### 1.2 Limitation / Assumption

- `Limitation`: 이번 재분석은 로컬 PDF parser 제약 때문에 `Agentic_Design_Patterns_extracted_compact.txt`를 PDF 유도 추출본으로 사용했다.
- `Assumption`: 추출본은 현재 첨부 PDF의 핵심 본문과 FAQ를 실무 판단에 쓸 정도로 충실하게 반영한다.
- `Need Verification`: 실제 보강 실행 단계에서 `99_original`을 계속 mirror sync할지, 아니면 `v17`부터 archive/frozen baseline으로 둘지는 한 번 더 결정해야 한다.

### 1.3 이번 재분석에서 다시 중요하게 확인한 책의 신호

1. 에이전트는 단순 질의응답이 아니라 `perceive -> decide -> act -> adapt` 루프를 가진다.
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:20-22, 28`

2. agent maturity는 `Level 0 -> Level 3`로 올라가며, tool / retrieval / planning / multi-agent가 단계적으로 붙는다.
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:32, 36`

3. 좋은 agent system prompt는 보통 다음을 명시한다.
   - `Role and Goal`
   - `Tool Definitions`
   - `Constraints and Rules`
   - `Process Instructions`
   - `Example Trajectories`
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:962-964`

4. HITL은 전면 개입이 아니라 critical checkpoint 중심이어야 하며, plan approval과 sensitive tool use confirmation이 특히 중요하다.
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:958-960`

5. 책은 prompt/agent 자체보다도 agent가 올라갈 substrate 품질을 매우 강하게 요구한다.
   - messy systems + agents = disaster
   - clean data / consistent metadata / well-defined APIs 필요
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:18`

6. SICA 사례는 long-running coding agent에서 다음을 강조한다.
   - structured context window layout
   - `System Prompt + Core Prompt + Assistant Messages`의 분리
   - `open files + directory map + diff-only updates`
   - `overseer`, `callgraph`, `event stream`, `stagnation/loop detection`
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:318-320, 328`

7. Goal Setting and Monitoring은 단순 progress note가 아니라 clear, measurable objective와 control loop를 요구한다.
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:368, 384, 390`

8. future-facing signal로는 deep personalization과 proactive goal discovery가 제시되지만, 이것은 기본 stack에 바로 강제할 surface는 아니다.
   - 근거: `Agentic_Design_Patterns_extracted_compact.txt:40`

---

## 2. 현재 v17 커버리지 진단

### 2.1 이미 강한 영역

현재 `v17`는 책의 21개 pattern 중 상당수를 이미 first-class owner surface로 정리해 두었다.

- runtime prompt assembly canon:
  - `00_governance/PROMPT_guideline.md:191`
- pattern-to-owner summary:
  - `00_governance/PROMPT_guideline.md:1191`
- deterministic support / MCP / runtime environment classes:
  - `02_overlays/PROMPT_tool_protocol_overlay.md:397`
  - `02_overlays/PROMPT_tool_protocol_overlay.md:433`
  - `02_overlays/PROMPT_tool_protocol_overlay.md:659`
- A2A / agent discovery / agent card / sync-polling-streaming-push:
  - `02_overlays/PROMPT_multi_agent_overlay.md:494`
  - `02_overlays/PROMPT_multi_agent_overlay.md:542`
  - `02_overlays/PROMPT_multi_agent_overlay.md:615`
- trajectory evaluation + safe trajectory artifact schema:
  - `02_overlays/PROMPT_evaluation_monitoring_overlay.md:601`
  - `02_overlays/PROMPT_evaluation_monitoring_overlay.md:630`
- prioritization / exploration / bounded discovery:
  - `02_overlays/PROMPT_search_reasoning_overlay.md:194`
- bounded personalization:
  - `02_overlays/PROMPT_memory_adaptation_overlay.md:632`
- base prompt carryover:
  - `01_base/PROMPT_full.md:209`
  - `01_base/PROMPT_full.md:600`
  - `01_base/PROMPT_full.md:617`
  - `01_base/PROMPT_full.md:704`
  - `01_base/PROMPT_full.md:746`
- Codex host-runtime carryover:
  - `AGENTS.md:94-97`
  - `AGENTS.md:424`
  - `AGENTS.md:446`

### 2.2 종합 판단

현재 `v17`의 약점은 “pattern 부재”보다 “운영 계약이 충분히 응축되지 않은 부분”에 가깝다.

즉, 지금 필요한 것은 다음이다.

- pattern을 더 추가로 나열하는 것
- 이미 있는 pattern을 더 정밀한 execution contract로 다듬는 것
- long-running / coding / high-autonomy / deployment-adjacent use case에서 failure surface를 줄이는 것

### 2.3 남아 있는 공백 유형

1. present but diffuse
   - 여러 문서에 신호는 퍼져 있지만 하나의 doctrine으로 고정되지 않은 영역

2. present but under-operationalized
   - 개념은 있으나 runtime contract나 precondition이 약한 영역

3. intentionally absent but now worth optional treatment
   - 기본 stack에는 없었지만, low-priority optional doctrine으로 둘 가치는 있는 영역

---

## 3. 우선순위별 보강 계획

## 3.1 High Priority

### A. Runtime Constitution Contract

문제:

- `v17`는 assembly order는 강하다.
- 하지만 책이 말한 “좋은 agent system prompt의 최소 구성요소”를 하나의 first-class contract로 묶어 두지는 않았다.
- 지금 구조에서는 role/goal, tool definitions, constraints, process, example trajectories가 여러 owner 문서에 분산되어 있다.

왜 필요한가:

- 책의 FAQ는 이것을 agent prompting의 핵심 구성으로 본다.
- 현재 stack는 조립 원칙은 분명하지만, “조립된 runtime constitution이 최소 무엇을 포함해야 하는가”가 한 번 더 요약되면 실사용 적합성이 높아진다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:962-964`

편집 대상:

- `00_governance/PROMPT_guideline.md`
- `PROMPT_USER_GUIDE.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`

보강 내용:

- `Runtime Constitution Contract` 또는 `Minimum Agent Bundle Contract` 신설
- 최소 슬롯:
  - `Role`
  - `Goal`
  - `Capabilities / Tools`
  - `Constraints / Guardrails`
  - `Execution Process`
  - `Approval / Escalation Boundary`
  - `Trajectory / Example policy`
- assembly canon과 중복하지 않고, “assembled prompt가 최소 무엇을 포함해야 하는가”만 소유

기대 효과:

- runtime bundle 설명력이 올라간다
- system prompt / constitution 설계가 문서 조립과 실행 contract 사이에서 더 단단히 연결된다

### B. Agentic Substrate Readiness Doctrine

문제:

- 현재 `v17`는 tool 호출 이후의 safety, capability fit, deterministic support는 강하다.
- 그러나 agent를 올릴 기반이 애초에 “agent-friendly”한지에 대한 readiness doctrine은 거의 없다.

왜 필요한가:

- 책은 가장 강한 경고를 여기서 한다.
- clean data, consistent metadata, well-defined APIs 없이 agent를 얹으면 plausible garbage가 전체 프로세스를 오염시킬 수 있다고 본다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:18`

편집 대상:

- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `PROMPT_USER_GUIDE.md`

보강 내용:

- `Substrate Readiness` 또는 `Agentic Environment Readiness` doctrine 추가
- readiness 체크 항목:
  - data quality
  - metadata consistency
  - API contract clarity
  - auth/session stability
  - rollbackability
  - observability availability
  - shared ontology quality
- agentization 이전 precondition과 runtime recovery를 분리
- “tool exists”와 “tool substrate is ready”를 명확히 구분

기대 효과:

- tool/MCP/A2A surface가 더 production-oriented해진다
- agent deployment readiness를 prompt stack 차원에서 설명할 수 있다

### C. Goal Quality and Termination Contract

문제:

- 현재 `Goal`, `Solved Condition`, `Progress Check`, `Stop Condition`은 잘 있다.
- 하지만 goal 자체의 quality requirements와 measurable termination surface는 충분히 정식화되어 있지 않다.
- 특히 SMART-like measurability, loop upper bound, stagnation threshold, escalation threshold가 분리되어 있지 않다.

왜 필요한가:

- 책은 clear, measurable objective와 monitoring loop를 goal-driven agent의 핵심으로 본다.
- monitoring이 약하면 endless process, self-judging illusion, fake completion 문제가 커진다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:368, 384, 390`

편집 대상:

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_standalone.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

보강 내용:

- `Goal Quality Canon` 추가
- minimum goal spec:
  - objective
  - solved condition
  - measurable success signals
  - failure / stagnation signals
  - max iteration or budget bound
  - escalation trigger
- `progress`와 `true goal advancement` 구분
- self-monitoring이 weak할 때 더 빨리 review/escalate하는 규칙 추가

기대 효과:

- long-running planning, deep research, coding loops에서 더 빨리 멈추고 더 정확히 재계획할 수 있다

## 3.2 Medium Priority

### D. Coding-Agent Context Surface / Working-Set Layout

문제:

- 현재 `v17`는 context engineering general doctrine은 강하다.
- 그러나 책의 coding-agent 사례가 보여주는 `System Prompt / Core Prompt / Assistant Messages / open files / directory map / diff-only state` 수준의 working-set contract는 없다.

왜 필요한가:

- coding agent는 generic assistant보다 context-window failure에 훨씬 취약하다.
- 파일 트리, 열린 파일, 최근 diff, tool outputs, checkpoints를 어떻게 패키징할지 명확해야 long-run edit 품질이 안정된다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:318-320, 328`

편집 대상:

- `01_base/PROMPT_standalone.md`
- `AGENTS.md`
- `codex/skills/coding-core/SKILL.md`
- 필요 시 `01_base/PROMPT_full.md`

보강 내용:

- `Coding Working Set Layout` doctrine 추가
- 최소 coding context slots:
  - problem statement
  - active files
  - directory map
  - recent diffs only
  - relevant logs/errors
  - current checkpoint
  - unresolved blockers
- raw conversation replay 대신 compact state 우선
- large repo에서는 full-file fan-in보다 active-slice + diff pack 우선

기대 효과:

- coding runtime이 Appendix G / SICA 계열 설계에 더 잘 맞는다
- context-window churn과 repeated work를 줄일 수 있다

### E. Supervisor / Stagnation / Long-Run Control

문제:

- 현재 `v17`는 monitoring, checkpoint, trajectory, escalation을 다룬다.
- 하지만 long-running autonomous run을 감시하는 `overseer/watchdog/supervisor` class의 doctrine은 독립적으로 정리되어 있지 않다.

왜 필요한가:

- 책의 SICA 사례는 loop, stagnation, pathological deviation, cancellation, event stream supervision을 매우 강하게 다룬다.
- 이것은 일반 monitoring보다 더 강한 “runaway control” surface다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:318-320`

편집 대상:

- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`

보강 내용:

- `Supervisor / Watchdog` doctrine 추가
- 감시 신호 예:
  - repeated identical action
  - no-information-gain loop
  - repeated tool failure with no strategy update
  - escalating cost with flat progress
  - delegation churn with no integration gain
- 대응:
  - notify
  - checkpoint
  - replan
  - downgrade capability
  - cancel / stop
- raw chain-of-thought 대신 safe event taxonomy 사용

기대 효과:

- long-running multi-step agents의 pathological behavior를 더 일찍 제어할 수 있다

## 3.3 Low Priority / Optional

### F. Safe Proactivity Boundary

문제:

- 현재 `v17`는 bounded personalization은 있지만 proactive goal discovery doctrine은 거의 없다.
- 이는 현재 stack이 의도적으로 reactive/contained하게 설계되었기 때문이다.

왜 optional인가:

- 책은 이것을 future direction으로 본다.
- 하지만 generic stack에 바로 강하게 넣으면 scope creep와 silent autonomy expansion 위험이 있다.

근거:

- `Agentic_Design_Patterns_extracted_compact.txt:40`

편집 대상:

- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `01_base/PROMPT_full.md`
- `00_governance/PROMPT_guideline.md`

보강 내용:

- opt-in only doctrine
- proactive assist는 다음일 때만 허용:
  - explicit user intent cluster가 충분히 strong
  - blast radius가 낮음
  - approval boundary를 넘지 않음
  - recommendation is reversible
- latent goal inference는 `Assumption` 또는 suggestion 수준으로만 남기고, autonomous commitment로 전환하지 않음

기대 효과:

- personalization과 proactivity를 분리해 future-ready path를 열어 둔다

---

## 4. 파일별 편집 지도

### 4.1 Governance

`00_governance/PROMPT_guideline.md`

- `Runtime Constitution Contract`
- `Substrate Readiness Doctrine`
- `Goal Quality Canon`
- `Supervisor / Watchdog Boundary`
- 기존 owner map, assembly canon, disclosure boundary와 충돌하지 않도록 유지

### 4.2 Base prompts

`01_base/PROMPT_full.md`

- goal quality / termination carryover
- constitution slots compact carryover
- optional supervisor-aware monitoring note

`01_base/PROMPT_light.md`

- measurable goal / stop threshold compact carryover만 추가

`01_base/PROMPT_standalone.md`

- coding working-set layout
- diff-first context packaging
- stagnation / repeated-work detection

### 4.3 Overlays

`02_overlays/PROMPT_tool_protocol_overlay.md`

- substrate/API/data readiness gate
- capability-fit 이전의 environment-preparedness check

`02_overlays/PROMPT_retrieval_grounding_overlay.md`

- corpus readiness / provenance surface quality / stale metadata risk note

`02_overlays/PROMPT_evaluation_monitoring_overlay.md`

- goal metric / stagnation / supervisor signal surface
- loop-detection and cancellation-oriented alerts

`02_overlays/PROMPT_guardrails_safety_overlay.md`

- supervisor-triggered containment / stop behavior
- silent autonomy expansion과 proactivity boundary coupling

`02_overlays/PROMPT_multi_agent_overlay.md`

- overseer of coordinator runs
- no-progress delegation churn / integration deadlock signals

`02_overlays/PROMPT_memory_adaptation_overlay.md`

- personalization vs proactive goal discovery separation

### 4.4 User / host-runtime layer

`PROMPT_USER_GUIDE.md`

- minimum agent bundle checklist
- substrate readiness checklist
- optional proactivity opt-in note

`AGENTS.md`

- coding runtime working-set guidance
- stagnation / repeated-work / stop signal carryover

`codex/skills/coding-core/SKILL.md`

- coding-context packaging refinement
- long-run coding-loop supervision note

### 4.5 Example layer

`Need Verification`

현재 example layer는 이미 assembly memo, plan approval, safe trajectory, mock-tool evaluation을 갖고 있다.

따라서 `v17` 보강에서는 example 추가를 최소화하는 편이 좋다.

추가가 필요하다면 후보는 다음 둘만 검토한다.

- `goal_monitoring_contract_artifact`
- `coding_working_set_memo`

---

## 5. 실행 순서

### Phase 1

- `PROMPT_guideline`
- `PROMPT_full`
- `PROMPT_standalone`
- `PROMPT_USER_GUIDE`

이 단계에서 constitution contract, readiness, goal quality의 뼈대를 먼저 고정한다.

### Phase 2

- `PROMPT_tool_protocol_overlay`
- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_guardrails_safety_overlay`
- `PROMPT_multi_agent_overlay`
- `PROMPT_memory_adaptation_overlay`
- `PROMPT_retrieval_grounding_overlay`

이 단계에서 overlay owner별 carryover를 정밀화한다.

### Phase 3

- `AGENTS.md`
- `codex/skills/coding-core/SKILL.md`
- 필요 시 example layer

이 단계에서 Codex runtime과 coding surface를 sync한다.

---

## 6. 검증 계획

1. owner-boundary audit
   - 새 doctrine이 기존 owner를 침범하지 않는지 확인

2. duplication audit
   - `guideline`에서 owner canon을 만들고, detail은 owner 문서에만 남는지 확인

3. versionless reference audit
   - prompt 본문에서 versioned 문서명 재유입이 없는지 확인

4. trajectory safety audit
   - supervisor / observability 보강이 raw hidden chain-of-thought 노출로 미끄러지지 않는지 확인

5. scenario walkthrough
   - long-running coding task
   - iterative research task
   - high-risk tool execution
   - A2A specialist delegation
   - personalization without proactive overreach

6. mirror policy check
   - `99_original` sync 여부를 구현 전에 확정

---

## 7. 비목표

- 기존 chapter-to-owner map을 다시 크게 뒤엎지 않는다.
- raw chain-of-thought를 logging/trajectory 명목으로 노출하지 않는다.
- proactivity를 기본 동작으로 승격하지 않는다.
- example layer를 불필요하게 비대화하지 않는다.
- broad rewrite aesthetics를 위해 문서를 재구성하지 않는다.

---

## 8. 최종 권고

`v17`는 이미 `Agentic Design Patterns`의 주요 pattern surface를 꽤 성숙하게 흡수했다.

따라서 다음 보강은 “coverage expansion”보다 아래 세 축에 집중하는 것이 ROI가 가장 높다.

1. `Runtime Constitution Contract`
2. `Agentic Substrate Readiness Doctrine`
3. `Goal Quality and Termination Contract`

그 다음으로 `Coding-Agent Context Surface`와 `Supervisor / Stagnation Control`을 붙이면, `v17`는 generic agent stack이면서도 long-running coding/runtime use case까지 더 설득력 있게 커버하는 버전이 된다.
