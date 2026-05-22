# PROMPT_USER_GUIDE

## 0. 목적

이 문서는 현재 폴더의 prompt stack을 실제 사용 기준으로 빠르게 조립하기 위한 사용자 가이드다.

핵심 목적:

- 어떤 문서가 무엇을 소유하는지 빠르게 파악
- 한 번에 모든 문서를 넣지 않고 필요한 조합만 선택
- base / overlay / example / host-runtime layer를 섞을 때 조립 순서를 명확히 유지
- coding, research, design, evaluation 같은 대표 사용 시나리오별 기본 묶음을 바로 선택

---

## 1. 공식 스택

이 스택의 공식 prompt 문서는 14개다.

### 1.1 Governance

- `00_governance/PROMPT_guideline.md`

### 1.2 Base prompts

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`

### 1.3 Overlays

- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`

### 1.4 Example layer

- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`

### 1.5 Pattern-to-file quick lookup

- prompt chaining / routing / planning -> base prompts, especially `PROMPT_full` and `PROMPT_standalone`
- search / prioritization / exploration / reasoning depth -> `PROMPT_search_reasoning_overlay`
- prioritization / next action / competing workstreams -> `PROMPT_search_reasoning_overlay` + `Prioritization queue / next-action memo`
- tool use / MCP / external interaction -> `PROMPT_tool_protocol_overlay`
- tool contract / precondition / substrate readiness -> `PROMPT_tool_protocol_overlay` + `Tool capability contract / precondition memo`
- substrate quality / agent-ready surface / autonomy-fit check -> `PROMPT_tool_protocol_overlay` + `Operational substrate readiness memo`
- retrieval / evidence / RAG -> `PROMPT_retrieval_grounding_overlay`
- evidence target / retrieval mode / evidence-pack boundary -> `PROMPT_retrieval_grounding_overlay` + `Evidence target / retrieval-mode memo`
- consulted source groups / public-private source mix / query lineage -> `PROMPT_retrieval_grounding_overlay` + `Source consultation ledger`
- multi-agent / A2A / handoff -> `PROMPT_multi_agent_overlay`
- orchestration / coordinator / lifecycle / agent card -> `PROMPT_multi_agent_overlay` + `orchestration-control`
- topology family / supervision mode / communication substrate -> `PROMPT_multi_agent_overlay` + `Orchestration topology decision memo`
- goal progress / solved-signal tracking -> `PROMPT_full` + `Goal-monitoring status memo`
- blocked state / recovery / escalation -> `PROMPT_guideline` + `Recovery / escalation checkpoint memo`
- human review / approval boundary / reversible gate -> `PROMPT_guardrails_safety_overlay` + `HITL approval packet` or `Plan approval checkpoint artifact`
- memory / continuity / adaptation -> `PROMPT_memory_adaptation_overlay`
- memory scope / checkpoint packaging -> `PROMPT_memory_adaptation_overlay` + `Memory scope / checkpoint profile memo`
- resource budget / route tier / model-tool tradeoff -> `PROMPT_guideline` + `Resource budget and route-choice memo`
- coding-agent briefing / human quality gate / iteration protocol -> `PROMPT_standalone` + `Coding-agent invocation pack`
- parallel branch budget / join-cost tradeoff / saturation risk -> `PROMPT_guideline` + `Resource budget and route-choice memo`
- evaluation / monitoring / regression / release gate -> `PROMPT_evaluation_monitoring_overlay`
- release audit for coding briefing / research transparency / resource concurrency / human quality gate -> `PROMPT_evaluation_monitoring_overlay` + `Prompt-stack release review`
- task family packet floor / required vs optional packet -> `PROMPT_guideline` + `Packet compliance report`
- behavior replay / trajectory-backed gate review -> `PROMPT_evaluation_monitoring_overlay` + `Safe trajectory artifact report`
- benchmark registry / replay suite / cohort-ready comparison -> `PROMPT_evaluation_monitoring_overlay` + `Benchmark registry memo`
- context sufficiency / overload / stale-context review -> `PROMPT_guideline` + `Context sufficiency review memo`
- critique quality / no-gain loop / reroute-after-critique review -> `PROMPT_evaluation_monitoring_overlay` + `Critique quality review memo`
- adaptation promotion / rollback / drift suspicion review -> `PROMPT_memory_adaptation_overlay` + `Adaptation promotion review memo`
- route-quality / prioritization-quality / exploration-depth scoring -> `PROMPT_search_reasoning_overlay` + `Route-quality scorecard`
- repo-scale coding benchmark / verification-running expectation -> `PROMPT_standalone` + `Coding benchmark scenario memo`
- delegation admission / reviewer-load check -> `PROMPT_multi_agent_overlay` + `Delegation admission memo`
- join integrity / synthesis-ready review -> `PROMPT_multi_agent_overlay` + `Join-quality review memo`
- release evidence bundle / gate attachment set -> `PROMPT_evaluation_monitoring_overlay` + `Release evidence bundle memo`
- benchmark execution result / executed cohort verdict -> `PROMPT_evaluation_monitoring_overlay` + `Benchmark execution report`
- replay execution verdict / scenario run result -> `PROMPT_evaluation_monitoring_overlay` + `Replay suite verdict memo`
- context failure classification / substrate diagnosis -> `PROMPT_guideline` + `Context failure taxonomy memo`
- critique utility / refinement delta scoring -> `PROMPT_evaluation_monitoring_overlay` + `Critique utility scorecard`
- adaptation lifecycle / quarantine / rollback state -> `PROMPT_memory_adaptation_overlay` + `Adaptation lifecycle state memo`
- route re-prioritization audit / route-switch review -> `PROMPT_search_reasoning_overlay` + `Route re-prioritization audit memo`
- engineering proof bundle / executed-vs-unexecuted coding proof -> `PROMPT_standalone` + `Coding proof bundle memo`
- integrated promotion evidence / confidence-classed release packet -> `PROMPT_evaluation_monitoring_overlay` + `Release evidence bundle v2`
- telemetry trend / cohort-aware drift review -> `PROMPT_evaluation_monitoring_overlay` + `Telemetry trend memo`
- benchmark cohort definition / run linkage -> `PROMPT_evaluation_monitoring_overlay` + `Benchmark cohort manifest`
- replay runner execution sheet / verdict linkage -> `PROMPT_evaluation_monitoring_overlay` + `Replay runner verdict sheet`
- measured context substrate scoring -> `PROMPT_guideline` + `Context substrate scorecard`
- critique delta and no-gain logging -> `PROMPT_evaluation_monitoring_overlay` + `Critique delta ledger`
- adaptation controller audit / quarantine / rollback review -> `PROMPT_memory_adaptation_overlay` + `Adaptation controller audit packet`
- route-switch benchmark verdict / clarification-vs-exploration review -> `PROMPT_search_reasoning_overlay` + `Route-switch benchmark verdict`
- coding execution ledger / repo-scale proof linkage -> `PROMPT_standalone` + `Coding benchmark execution ledger`
- promotion-grade release record / false-promotion review -> `PROMPT_evaluation_monitoring_overlay` + `Release promotion decision record`
- telemetry-triggered drift investigation -> `PROMPT_evaluation_monitoring_overlay` + `Telemetry drift investigation memo`
- safety / containment / approval-sensitive restriction -> `PROMPT_guardrails_safety_overlay`
- example geometry / artifact shape -> `PROMPT_example_injection` + `PROMPT_example_catalog`
- Codex runtime carryover -> `AGENTS.md` + `codex/skills/*/SKILL.md`

Operational packet rule:

- if the live issue is operational proof, prefer the stronger linked artifact over the lighter summary packet
- if a stronger artifact is emitted, treat the weaker packet as superseded rather than parallel-equal by default
- if two artifacts are compatible and one is newer within the same lineage, supersede the stale predecessor explicitly rather than keeping both active
- keep `scenario_id`, `run_id`, `cohort_id`, `trace_id`, and `artifact_version` stable when benchmark, replay, adaptation, release, or telemetry packets must remain linked
- if the required packet floor is not met, downgrade the conclusion before using promotion-grade, drift-grade, or controller-grade language
- if multiple artifacts must be combined, check precedence, compatibility, freshness, and completeness before the join rather than letting linkage remain implicit
- if a merge would weaken a stronger artifact, reject the incompatible merge or keep a split verdict instead of forcing a synthetic summary
- preserve upstream source IDs and `artifact_version` in any joined artifact that survives reconciliation
- keep failure classes such as `false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, and `failed fallback timing` independently diagnosable when operator-facing packet review is the active task

---

## 2. 가장 중요한 조립 원칙

### 2.1 Base prompt는 항상 하나만 선택

다음 중 하나만 base execution prompt로 쓴다.

- `PROMPT_full`
- `PROMPT_light`
- `PROMPT_lightest`
- `PROMPT_standalone`

여러 base prompt를 동시에 섞지 않는다.

### 2.2 Overlay는 필요한 control surface만 추가

overlay는 전부 다 붙이는 것이 아니라 필요한 surface만 붙인다.

대표 예:

- evidence / citations / freshness -> `PROMPT_retrieval_grounding_overlay`
- search / prioritization / branch control -> `PROMPT_search_reasoning_overlay`
- tool / MCP / external action -> `PROMPT_tool_protocol_overlay`
- memory / continuity / adaptation -> `PROMPT_memory_adaptation_overlay`
- delegation / role topology / handoff -> `PROMPT_multi_agent_overlay`
- eval / regression / drift / release gate -> `PROMPT_evaluation_monitoring_overlay`
- safety / containment / approval-sensitive restriction -> `PROMPT_guardrails_safety_overlay`

### 2.3 Example layer는 구조 이득이 있을 때만 추가

examples는 구조를 돕기 위한 layer다.

- `PROMPT_example_injection` = controller
- `PROMPT_example_catalog` = immutable structural data

examples는:

- 사실을 결정하지 않는다
- 도구 선택을 결정하지 않는다
- 안전 규칙을 대체하지 않는다
- approval boundary를 우회하지 않는다

### 2.4 Host-runtime layer는 환경이 요구할 때만 추가

실제 실행 환경이 Codex류 coding runtime이면:

- `AGENTS.md`
- `codex/skills/*/SKILL.md`

같은 host/runtime layer를 같이 쓴다.

이 layer는 stack ownership을 바꾸는 것이 아니라, 해당 runtime에 맞게 압축 carryover 하는 역할이다.

host-runtime에서 추가로 점검할 것:

- 어떤 primary skill이 실제 실행 owning layer인가
- `memory/adaptation`, `evaluation`, `multi-agent`가 정말 attach-worthy한가
- long-running loop라면 checkpoint / packet 경로가 충분히 보이는가
- coding-agent path라면 human brief, external knowledge inputs, and quality-gate owner가 briefing surface에 실제로 보이는가

---

## 3. Canonical Assembly Order

권장 조립 순서는 다음과 같다.

1. `PROMPT_guideline`로 governance와 owner boundary를 확인
2. 정확히 하나의 base prompt 선택
3. 필요한 overlays만 추가
4. 구조 이득이 있을 때만 example layer 추가
5. Codex 같은 실행 환경이면 `AGENTS.md`와 skill layer 추가

즉:

`guideline -> one base -> needed overlays -> optional example layer -> optional host-runtime layer`

### 3.1 Minimum runtime bundle

If the assembled runtime is expected to execute rather than only explain, keep at least these slots legible:

- `Role and Goal`
- `Capabilities / Tools`
- `Constraints / Guardrails`
- `Execution Process`
- `Approval / Escalation Boundary`
- `Trajectory / Example Policy` when examples or trajectory control are active

Pre-run screening:

1. Is the runtime bundle legible on role, tools, constraints, process, and approval boundary?
2. Are the data, metadata, API, and tool surfaces agent-ready enough for the intended autonomy level?
3. If substrate readiness is weak, should the path be narrowed, wrapped with deterministic support, or kept propose-only?
4. If the task can loop, are solved signals, stagnation signals, and escalation triggers visible enough to stop weak persistence?

추가 규칙:

- one base only
- overlays는 needed surface only
- example layer는 structure only
- host-runtime layer는 execution environment fit only

---

## 4. Base Prompt 선택 가이드

### `PROMPT_full`

사용 시점:

- 복합 설계
- 고위험 판단
- 여러 control surface가 동시에 중요한 작업
- 깊은 planning / reflection / verification이 필요한 작업

### `PROMPT_light`

사용 시점:

- 일반적인 실무형 assistant 작업
- 기술 설명
- 보통 난이도 분석
- 적당한 verification이 필요한 기본 답변

### `PROMPT_lightest`

사용 시점:

- 매우 단순한 작업
- 강한 압축이 필요한 환경
- fallback 모드

### `PROMPT_standalone`

사용 시점:

- coding agent
- IDE patch agent
- bounded code edit
- diff-first, verify-before-claim posture가 중요한 작업

---

## 5. 추천 조합

### 5.1 General assistant

- `PROMPT_light`
- `PROMPT_retrieval_grounding_overlay` if evidence-sensitive
- `PROMPT_tool_protocol_overlay` if tool use is needed

### 5.2 Coding agent

- `PROMPT_standalone`
- `PROMPT_tool_protocol_overlay`
- `PROMPT_guardrails_safety_overlay` when mutation risk is meaningful
- `PROMPT_example_injection`
- `PROMPT_example_catalog`
- `AGENTS.md`
- `coding-core`

추가로 다음 상황이면 overlay를 더 붙인다.

- repo exploration, ambiguous debugging, path comparison, discovery-heavy investigation -> `PROMPT_search_reasoning_overlay`
- regression review, release check, judge/rubric workflow, repeatable quality gate -> `PROMPT_evaluation_monitoring_overlay`
- long-running, checkpoint-heavy, repeated-correction coding loop -> `PROMPT_memory_adaptation_overlay`

권장 packet:
- `Coding-agent invocation pack` when the coding task needs a briefing package, human brief, or explicit quality gate

### 5.3 Grounded research

- `PROMPT_light`
- `PROMPT_retrieval_grounding_overlay`
- `PROMPT_search_reasoning_overlay`
- `PROMPT_guardrails_safety_overlay` if disclosure boundary matters
- `grounded-research`

추가로 다음 상황이면 overlay를 더 붙인다.

- tool-mediated retrieval, MCP capability reuse, or internal source access -> `PROMPT_tool_protocol_overlay`
- multi-round research with reusable checkpoint continuity -> `PROMPT_memory_adaptation_overlay`
- repeated retrieval quality comparison or intermediate research gate -> `PROMPT_evaluation_monitoring_overlay`

권장 packet:
- `Evidence target / retrieval-mode memo` before retrieval escalation
- `Source consultation ledger` when consulted-source transparency, public/private source mix, or query lineage must remain inspectable

### 5.4 Design analysis

- `PROMPT_full`
- `PROMPT_search_reasoning_overlay`
- `PROMPT_retrieval_grounding_overlay`
- `design-analysis`

추가로 다음 상황이면 overlay를 더 붙인다.

- repeated comparison checkpoints or reusable decision defaults -> `PROMPT_memory_adaptation_overlay`
- topology, A2A, or delegation structure가 recommendation의 핵심 -> `PROMPT_multi_agent_overlay`
- recommendation 자체를 mid-flight quality gate로 다뤄야 함 -> `PROMPT_evaluation_monitoring_overlay`

### 5.5 Multi-agent / orchestration

- `PROMPT_full`
- `PROMPT_multi_agent_overlay`
- `PROMPT_tool_protocol_overlay`
- `PROMPT_retrieval_grounding_overlay`
- `PROMPT_guardrails_safety_overlay` if coordination risk is meaningful
- `AGENTS.md`
- `orchestration-control`

추가로 다음 상황이면 overlay를 더 붙인다.

- long-running async collaboration, lifecycle reuse, or bounded coordination-default carryover -> `PROMPT_memory_adaptation_overlay`
- coordination quality, join fidelity, or lifecycle checkpoint review가 중요 -> `PROMPT_evaluation_monitoring_overlay`

### 5.6 Eval / release review

- `PROMPT_full`
- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
- `PROMPT_tool_protocol_overlay` if tool workflows are being evaluated
- `eval-ops`

### 5.7 Memory / adaptation-heavy runtime

- `PROMPT_light` or `PROMPT_full`
- `PROMPT_memory_adaptation_overlay`
- `PROMPT_evaluation_monitoring_overlay` if persistent change depends on judged quality
- `AGENTS.md`
- one owning skill selected by task family

---

## 6. Assembly 체크포인트

실제 조립 전에 최소한 다음을 점검한다.

1. base prompt를 정확히 하나만 골랐는가
2. overlay가 실제로 필요한 control surface를 소유하는가
3. example layer가 구조 이득만 주고 policy ownership을 침범하지 않는가
4. tool / safety / eval / search가 서로 owner boundary를 깨지 않는가
5. destructive / costly path라면 plan approval checkpoint가 필요한가
6. mutation-capable runtime surface라면 `PROMPT_guardrails_safety_overlay`가 필요한가
7. `PROMPT_light` 또는 `PROMPT_lightest`로 delegated/parallel path를 다룬다면 `join artifact`, `validation step`, partial-vs-integrated state가 여전히 보이는가
8. tool / retrieval / memory 경계가 실제 핵심 이슈라면 대응되는 compact packet이 loose prose 대신 준비돼 있는가
9. guide / runtime / skill layer가 `Goal / Recovery / HITL / Resource / Priority` control-loop packet family를 크게 어긋나지 않게 보여 주는가
10. coding-agent path라면 `briefing scope / human brief / quality gate owner`가 실제로 보이는가
11. deep research path라면 `consulted source groups / query lineage / public-private source mix`가 필요한 수준으로 inspectable한가
12. bounded parallel path라면 `parallelism cap / join cost / saturation risk`가 route choice와 같이 보이는가
13. packet-heavy path라면 `required / recommended / optional packet` 구분이 실제로 보이는가
14. evaluation path라면 `behavior replay / observed packet emission / omission findings`가 reviewable한가
15. delegated path라면 `delegation admission / reviewer load / join readiness`가 숨어 있지 않은가
16. release path라면 `release evidence bundle`이 prose summary와 분리된 evidence surface로 보이는가

---

## 7. 예시 레이어 사용 원칙

example layer는 다음 때만 붙이는 편이 좋다.

- 구조가 복잡하다
- verification section shape가 중요하다
- scorecard / memo / report / workflow artifact가 필요하다
- coding answer에서 local patch framing이나 verification framing이 유용하다

example layer를 빼는 편이 좋은 경우:

- direct answer가 충분하다
- 구조보다 내용 정확성이 더 중요하다
- example이 오히려 ceremony만 늘린다
- task가 너무 작다

packet quick lookup:

- route/budget decision -> `Resource budget and route-choice memo`
- next-step ranking -> `Prioritization queue / next-action memo`
- goal progress / stagnation / escalation -> `Goal-monitoring status memo`
- blocked-state recovery / controlled fallback -> `Recovery / escalation checkpoint memo`
- review gate / approval-sensitive execution -> `HITL approval packet`
- destructive / costly / hard-to-reverse plan review -> `Plan approval checkpoint artifact`
- open-ended discovery -> `Exploration frontier / hypothesis memo`
- tool contract / precondition boundary -> `Tool capability contract / precondition memo`
- evidence boundary / retrieval escalation -> `Evidence target / retrieval-mode memo`
- consulted-source transparency / query lineage / public-private source blend -> `Source consultation ledger`
- memory scope / checkpoint packaging -> `Memory scope / checkpoint profile memo`
- orchestration topology choice -> `Orchestration topology decision memo`
- agent identity / trust boundary -> `Agent card / capability manifest`
- async state tracking -> `Async lifecycle status memo`
- ordered lifecycle transitions / traceable partial-state history -> `Lifecycle event / audit trail memo`
- operational substrate readiness review -> `Operational substrate readiness memo`
- adaptation persistence decision -> `Adaptation decision memo`
- signal-strength review -> `Learning-signal review memo`
- mid-execution quality gate -> `Quality iteration checkpoint memo`
- coding-agent briefing / human quality gate -> `Coding-agent invocation pack`
- required / recommended / optional packet matrix -> `Packet compliance report`
- replay-safe process review -> `Safe trajectory artifact report`
- delegation allow / block decision -> `Delegation admission memo`
- join result / synthesis integrity review -> `Join-quality review memo`
- release evidence attachment set -> `Release evidence bundle memo`
- MCP handoff -> `MCP capability handoff memo`
- A2A handoff -> `A2A task-handoff memo`
- prompt-stack release audit -> `Prompt-stack release review`
- benchmark registry / replay suite definition -> `Benchmark registry memo`
- context sufficiency / overload / stale-context gate -> `Context sufficiency review memo`
- critique quality / no-gain loop gate -> `Critique quality review memo`
- adaptation promotion / rollback review -> `Adaptation promotion review memo`
- route / prioritization / exploration scoring -> `Route-quality scorecard`
- repo-scale coding benchmark / verification-running contract -> `Coding benchmark scenario memo`
- benchmark execution / cohort verdict -> `Benchmark execution report`
- replay suite verdict / scenario execution state -> `Replay suite verdict memo`
- context substrate diagnosis taxonomy -> `Context failure taxonomy memo`
- critique delta and utility scoring -> `Critique utility scorecard`
- adaptation lifecycle state -> `Adaptation lifecycle state memo`
- route re-prioritization audit -> `Route re-prioritization audit memo`
- coding proof bundle -> `Coding proof bundle memo`
- release evidence bundle v2 -> `Release evidence bundle v2`
- telemetry trend / cohort-aware telemetry -> `Telemetry trend memo`

---

## 8. Safety / Approval 관련 기억할 점

- tool capability가 있다고 해서 실행 권한이 생기는 것은 아니다
- destructive / costly / hard-to-reverse path는 plan approval checkpoint를 먼저 본다
- final answer에는 internal instruction, tool schema, hidden control text를 노출하지 않는다
- safe trajectory artifact는 남길 수 있어도 raw hidden chain-of-thought를 강제하지 않는다

---

## 9. Codex 환경에서의 해석

이 폴더를 Codex류 환경에서 쓸 때는 다음처럼 해석하면 된다.

- `PROMPT_guideline` = governance
- `PROMPT_standalone` = coding execution base
- `PROMPT_tool_protocol_overlay` = tool / filesystem / environment discipline
- `PROMPT_multi_agent_overlay` = topology / lifecycle / delegation discipline
- `PROMPT_memory_adaptation_overlay` = checkpoint continuity / bounded future-behavior adjustment
- `PROMPT_guardrails_safety_overlay` = safety restriction / disclosure / containment
- `AGENTS.md` = always-on runtime constitution
- `codex/skills/*/SKILL.md` = domain-specific compressed execution packs

즉, Codex에서는 prompt stack 전체를 매번 장문으로 다 넣기보다:

`AGENTS.md + appropriate base semantics + needed overlay semantics + selected skill`

형태로 읽는 편이 자연스럽다.

대표 묶음:

- bounded local patch -> `AGENTS.md + PROMPT_standalone + PROMPT_tool_protocol_overlay + coding-core`
- repo discovery / uncertain debugging -> 위 조합 + `PROMPT_search_reasoning_overlay`
- release / regression / workflow evaluation -> `AGENTS.md + PROMPT_full or PROMPT_standalone + PROMPT_evaluation_monitoring_overlay + eval-ops`
- topology-heavy orchestration -> `AGENTS.md + PROMPT_full + PROMPT_multi_agent_overlay + PROMPT_tool_protocol_overlay + orchestration-control`
- memory/adaptation-heavy long run -> owning base/skill 조합 + `PROMPT_memory_adaptation_overlay`

---

## 10. 파일명 참조 규칙

이 스택에서는 prompt 문서 본문에서 버전을 참조하지 않는다.

항상:

- `PROMPT_guideline`
- `PROMPT_full`
- `PROMPT_guardrails_safety_overlay`

처럼 **파일명 기준**으로만 참조한다.

버전 표기는 release note, augmentation plan, augmentation results 같은 별도 artifact에만 남긴다.

---

## 11. 최종 요약

이 스택은 “모든 문서를 항상 한 번에 넣는 구조”가 아니다.

정리하면:

1. `PROMPT_guideline`으로 owner와 조립 원칙을 본다
2. base prompt 하나를 고른다
3. 필요한 overlay만 붙인다
4. example layer는 구조 이득이 있을 때만 붙인다
5. Codex 같은 runtime이면 `AGENTS.md`와 skill layer를 추가한다

핵심은 문서 수가 아니라 **올바른 조립과 owner boundary 유지**다.
