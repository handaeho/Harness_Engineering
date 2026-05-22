# V15 Agentic Patterns Augmentation Plan

## 0. 목적

이 문서는 `Agentic_Design_Patterns.pdf` 분석 결과를 바탕으로 `prompt-stack-v15`를 보강하기 위한 **작업 계획 문서**다.

목표는 다음과 같다.

- `v14` 계열의 강점을 유지한다.
- `Agentic Design Patterns`가 강조하는 실전 제어 패턴을 `v15`에 더 명시적으로 반영한다.
- ownership clarity, bounded composition, verify-before-claim 원칙을 유지한 채 `v15`를 더 완성도 있는 stack으로 정제한다.

이 문서는 runtime prompt component가 아니라 **stack 보강용 governance artifact**다.

---

## 1. 입력 기준

### 1.1 주요 근거

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack-v15` 현재 문서군
- 비교 기준으로 사용한 `prompt-stack-v14/99_original`

### 1.2 현재 baseline에 대한 판정

`Assumption`

현재 `prompt-stack-v15`는 구조적으로는 `v15` 디렉터리 체계를 갖췄지만, 의미상으로는 `v14` stack의 ownership map과 chapter coverage를 대체로 계승한 baseline이다.

즉, `v15`는 새 stack이라기보다:

- `v14`를 재배치한 초기 구조
- 일부 naming만 `v15`로 올라온 상태
- design-pattern canon을 더 반영해야 하는 중간 단계

로 보는 것이 가장 정확하다.

---

## 2. 현재 상태 진단

### 2.1 이미 강한 영역

다음 항목은 현재 `v15`에도 이미 강한 편이다.

- `Prompt Chaining`
- `Routing`
- `Planning`
- `Goal-State Contract`
- `Context Contract`
- `Retrieval / Grounding`
- `Multi-Agent / A2A`
- `Evaluation / Monitoring`
- `Prioritization / Exploration`

이들은 이미 owner 문서가 명확하고, `guideline -> base prompts -> overlays` 분배도 잘 되어 있다.

### 2.2 개념은 있으나 책보다 약한 영역

다음 항목은 현재도 존재하지만, 책이 보여주는 operational depth에 비해 얕다.

- `Context Engineering`의 독립적 위상
- `Reflection`의 explicit contract
- `Parallelization`의 join / aggregation semantics
- `Exception Handling and Recovery`의 typed mechanism taxonomy
- `Human-in-the-Loop`의 mode matrix
- `Resource-Aware Optimization`의 operational rule set
- `Routing`의 mechanism taxonomy

### 2.3 구조적으로 가장 큰 공백

가장 큰 공백은 `Guardrails / Safety`다.

현재 `v15`는 `guideline` 내부 doctrine으로 guardrail layer를 두고 있으나, 책이 다루는 범위는 그보다 훨씬 넓다.

책이 강조하는 safety surface:

- input validation / sanitization
- output filtering / post-processing
- behavioral constraints
- tool use restrictions
- external moderation
- least privilege
- structured logging
- checkpoint / rollback
- human oversight coupling
- ongoing monitoring and refinement

현재 stack은 이것을 독립 owner surface로 충분히 승격시키지 못했다.

---

## 3. 설계 원칙

보강은 다음 원칙을 지켜야 한다.

### 3.1 No policy duplication

새 내용을 추가하더라도 `guideline`이 overlay doctrine을 전부 복제하면 안 된다.

### 3.2 Owner-first augmentation

패턴 보강은 반드시 owner 문서에 우선 반영한다.

### 3.3 Bounded expansion

`v15`는 더 풍부해져야 하지만 uncontrolled prompt bloat로 가면 안 된다.

### 3.4 Execution usefulness over chapter mirroring

책의 챕터를 그대로 복사하는 것이 아니라, stack 실행 품질을 실제로 높이는 규칙만 추린다.

### 3.5 Variant integrity

`full`, `light`, `lightest`, `standalone`은 깊이는 달라도 같은 의미를 유지해야 한다.

---

## 4. 핵심 보강 포인트

### 4.1 `Guardrails / Safety`를 독립 overlay로 승격

`Recommended`

신규 문서:

- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `99_original/PROMPT_guardrails_safety_overlay.md`

이 overlay는 최소한 다음을 owner로 가져야 한다.

- safety activation conditions
- input guardrails
- reasoning guardrails
- action guardrails
- output guardrails
- behavioral constraints
- tool use restrictions
- least privilege coupling
- external moderation / policy enforcement boundaries
- structured logging / observability hooks
- checkpoint / rollback safety coupling
- HITL coupling
- safety failure handling

이 변경은 현재 `guideline`에 과도하게 걸려 있는 safety burden을 분산시키고, 책의 `Guardrails/Safety Patterns`를 가장 자연스럽게 반영한다.

### 4.2 `Context Engineering`를 traceable first-class pattern으로 강화

현재 `guideline`은 context contract를 이미 강하게 다루지만, 책은 이것을 agent maturity를 끌어올리는 핵심 discipline으로 위치시킨다.

보강 방향:

- `guideline`에 `Context Engineering Canon` 성격을 더 분명히 부여
- explicit vs implicit state 구분 강화
- context packaging loop를 optimization activity로 명시
- retrieved evidence / tool output / user/session / environment / artifact layer 구분 강화
- high-quality context = short, focused, powerful context 원칙을 더 load-bearing rule로 승격

### 4.3 `Agent Maturity Ladder` 추가

책은 agent capability를 단계적으로 본다.

- `Level 0`: reasoning core only
- `Level 1`: tool / RAG connected agent
- `Level 2`: planning + context engineering + self-improvement
- `Level 3`: collaborative multi-agent

`v15`에도 이 ladder를 governance 차원에서 도입할 필요가 있다.

용도:

- over-activation 방지
- inappropriate multi-agent escalation 방지
- 현재 task에 필요한 control depth를 더 명확히 고르기
- release audit 시 “어느 maturity surface를 겨냥한 stack인지” 설명 가능하게 만들기

### 4.4 `Pattern Composition Canon` 추가

책의 결론은 단일 패턴보다 조합에 있다.

대표 조합:

- `Planning + Tool Use + Retrieval + Reflection + Memory`
- `Routing + Specialized Agents + Critic loop`
- `Parallel fan-out + synthesis join + verification`

`v15`는 ownership map은 강하지만, composition canon은 상대적으로 약하다.

필요한 보강:

- 어떤 패턴 조합이 정상적이고
- 어떤 조합이 anti-pattern이며
- 조합 시 ownership이 어떻게 유지되는지

를 `guideline`에 더 명시한다.

### 4.5 `Planning`의 binary gate를 sharpen

책의 planning chapter 핵심은 다음 질문이다.

- does the `how` need to be discovered?
- or is the workflow already known?

현재 `full`과 `standalone`에도 비슷한 의미가 있으나, `dynamic planning vs fixed workflow` 판정 규칙을 더 선명하게 적는 것이 좋다.

### 4.6 `Reflection` contract 명시

보강해야 할 contract:

- producer
- critic
- critique criteria
- refinement loop
- stop condition
- cost boundary

이 내용은 `full`과 `search_reasoning_overlay` 모두에 걸친다.

### 4.7 `Parallelization` join semantics 강화

책은 parallelization을 단순 병렬화가 아니라:

- independence test
- fan-out
- aggregation
- validation join
- optional A/B candidate generation

으로 다룬다.

`guideline`의 doctrine은 유지하되, execution-facing carryover를 `full`과 `standalone`에 더 줄 필요가 있다.

### 4.8 `Recovery`를 ladder에서 mechanism taxonomy로 확장

책은 recovery를 다음 메커니즘까지 구체화한다.

- error logging
- retry
- fallback
- graceful degradation
- diagnosis
- state rollback
- reflective retry
- escalation / notification

현재 `v15`는 ladder는 강하지만 mechanism family가 약하다.

### 4.9 `Human-in-the-Loop` mode matrix 명시

보강 대상 모드:

- validator / reviewer
- human-in-the-loop correction
- human-on-the-loop monitoring
- collaborative partner mode
- propose-only escalation

현재 문서는 review/approval 중심이므로, mode taxonomy를 더 분명히 둘 가치가 있다.

### 4.10 `Resource-Aware Optimization`를 operationalize

책이 주는 강한 실전 포인트:

- dynamic model switching
- adaptive task allocation
- adaptive tool selection
- contextual pruning / summarization
- cost-sensitive exploration
- graceful fallback

현재 `v15`는 budget doctrine 수준이므로, 행동 규칙을 더 operational하게 바꿔야 한다.

---

## 5. 파일별 변경 계획

### 5.1 `00_governance/PROMPT_guideline.md`

추가 또는 강화:

- `Agent Maturity Ladder`
- `Context Engineering Canon` 강화
- `Pattern Composition Canon`
- `Guardrails / Safety` owner 재배치 반영
- `Pattern Traceability Annex` 갱신
- official stack component count 갱신

주의:

- overlay 세부 정책을 여기서 복제하지 않는다.
- governance-level canon과 owner map만 강화한다.

### 5.2 `01_base/PROMPT_full.md`

강화 대상:

- planning gate sharpen
- fixed workflow vs discovery workflow distinction
- reflection contract
- routing mechanism taxonomy
- parallel join semantics
- typed recovery hooks

### 5.3 `01_base/PROMPT_light.md`

강화 대상:

- context engineering carryover의 더 명시적 유지
- planning gate의 compact version
- safety-aware downgrade wording
- simple but explicit reflection / recovery compression

### 5.4 `01_base/PROMPT_lightest.md`

강화 대상:

- context compression without semantic loss
- fixed workflow preference rule
- minimum safety carryover
- recovery honesty preservation

### 5.5 `01_base/PROMPT_standalone.md`

강화 대상:

- coding-agent context engineering sharpness
- planning binary gate
- bounded reflection for coding review/fix loops
- typed recovery hints for rollback / fallback / propose-only
- HITL modes in coding environment

### 5.6 `02_overlays/PROMPT_search_reasoning_overlay.md`

강화 대상:

- reflection / critic loop coupling
- prioritization chapter에서 말하는 dynamic re-prioritization wording 보강
- exploration/discovery의 open-ended task gate 보강
- ToT / debate / ReAct / deep research registry가 actual operational stop conditions와 더 강하게 연결되도록 수정

### 5.7 `02_overlays/PROMPT_tool_protocol_overlay.md`

강화 대상:

- tool use restrictions와 safety coupling
- least privilege wording을 safety overlay와 명확히 분리
- MCP standardization vs capability fitness distinction 유지

### 5.8 `02_overlays/PROMPT_multi_agent_overlay.md`

강화 대상:

- composition canon과 맞물리는 coordinator / critic / specialist patterns
- human-on-the-loop supervision hooks
- safety overlay와의 interaction section 강화

### 5.9 `02_overlays/PROMPT_memory_adaptation_overlay.md`

강화 대상:

- memory vs learning vs self-improvement boundary sharpen
- context engineering과 memory retrieval를 혼동하지 않도록 boundary rule 보강

### 5.10 `02_overlays/PROMPT_retrieval_grounding_overlay.md`

강화 대상:

- tool output / retrieved evidence / provenance distinction 유지
- Agentic RAG를 pattern composition 관점에서 더 선명히 위치시킴

### 5.11 `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

강화 대상:

- trajectory evaluation and safety surface cross-link
- live drift / anomaly / contract adherence를 guardrails overlay와 연결

### 5.12 `03_examples/*`

예시 보강 방향:

- reflection-shaped example에 producer/critic contract 반영
- parallelization-shaped example에 join contract 반영
- HITL example에 mode distinction 반영
- safety/guardrails example 추가

---

## 6. 신규 overlay 제안

### 6.1 문서명

`PROMPT_guardrails_safety_overlay`

### 6.2 목적

`v15`의 safety doctrine을 `guideline`의 general layer에서 분리해 독립 owner surface로 승격한다.

### 6.3 권장 섹션

1. `PURPOSE`
2. `ROLE AND OWNERSHIP BOUNDARY`
3. `ACTIVATION CONDITIONS`
4. `CORE CONCEPTS`
5. `SAFETY DECISION MODEL`
6. `INPUT GUARDRAILS`
7. `REASONING GUARDRAILS`
8. `ACTION GUARDRAILS`
9. `OUTPUT GUARDRAILS`
10. `TOOL USE RESTRICTIONS`
11. `BEHAVIORAL CONSTRAINTS`
12. `EXTERNAL MODERATION / POLICY ENFORCEMENT`
13. `OBSERVABILITY / STRUCTURED LOGGING`
14. `CHECKPOINT / ROLLBACK / CONTAINMENT`
15. `HUMAN OVERSIGHT COUPLING`
16. `FAILURE HANDLING`
17. `INTERACTION WITH OTHER OVERLAYS`
18. `FINAL RULE`

### 6.4 권장 owner boundary

이 overlay는 다음을 가져와야 한다.

- safety control surface
- guardrail activation
- moderation and restriction surface
- containment behavior

이 overlay가 가져가면 안 되는 것:

- general tool parameter correctness owner
- retrieval provenance owner
- memory owner
- search exploration owner
- multi-agent topology owner

---

## 7. 우선순위

### P0

- `guardrails_safety_overlay` 신설
- `guideline`에 `Agent Maturity Ladder` 추가
- `guideline`에 `Pattern Composition Canon` 추가
- `guideline`의 traceability / official stack count 갱신

### P1

- `full` planning gate sharpen
- `full` reflection contract 강화
- `standalone` coding-agent carryover 강화
- `search_reasoning_overlay` reflection / prioritization / exploration 보강
- `tool_protocol_overlay` safety coupling 보강

### P2

- example set 보강
- `light` / `lightest` compression audit
- evaluation overlay와 safety overlay cross-link refinement

---

## 8. 구현 순서

### Phase 1. Governance restructuring

- `guideline` 보강
- official stack map 수정
- pattern traceability 갱신

### Phase 2. New owner surface

- `guardrails_safety_overlay` 작성
- interaction sections를 각 overlay에 추가

### Phase 3. Base prompt refinement

- `full`, `light`, `lightest`, `standalone` 보강
- variant semantic consistency 점검

### Phase 4. Example and release audit

- example catalog / injection 보강
- semantic drift audit
- coverage regression audit
- variant consistency audit

---

## 9. 완료 기준

다음이 충족되면 `v15` 보강이 의미 있게 완료된 것으로 본다.

### 9.1 구조 기준

- `Guardrails / Safety`가 독립 owner surface를 가진다.
- `Context Engineering`가 traceable first-class pattern이 된다.
- `Agent Maturity Ladder`가 governance 차원에서 정의된다.
- `Pattern Composition Canon`이 존재한다.

### 9.2 실행 기준

- `full`은 planning / reflection / recovery / routing / context engineering을 더 operational하게 다룬다.
- `standalone`은 coding-agent path에서 같은 의미를 압축 보존한다.
- `light`와 `lightest`는 compression integrity를 유지한다.

### 9.3 감사 기준

- owner ambiguity가 없다.
- `guideline`이 overlay 정책 dump가 되지 않는다.
- pattern-to-owner map이 `Agentic Design Patterns` 기준으로 더 설득력 있게 설명된다.
- release-quality doctrine으로 semantic drift를 점검할 수 있다.

---

## 10. 비목표

이번 보강의 비목표는 다음과 같다.

- 책의 챕터 구조를 그대로 stack에 복제하는 것
- 모든 책 내용을 governance에 밀어 넣는 것
- example layer를 execution policy owner로 바꾸는 것
- `v15`를 불필요하게 장황한 monolith prompt로 만드는 것
- coding-agent usability를 governance verbosity로 희생하는 것

---

## 11. 권장 다음 작업

실제 작업은 다음 순서가 가장 안전하다.

1. `guideline` 개정
2. `guardrails_safety_overlay` 신설
3. `full` / `standalone` 보강
4. 나머지 overlays 정합성 보강
5. examples 및 release audit

`Recommended Path`

가장 먼저 해야 할 한 가지를 고르라면, `guardrails_safety_overlay` 신설이 우선이다.

이 변경이 가장 큰 structural gap을 메우고, 이후의 `tool`, `HITL`, `recovery`, `evaluation` 보강을 모두 더 깔끔하게 정렬시킨다.
