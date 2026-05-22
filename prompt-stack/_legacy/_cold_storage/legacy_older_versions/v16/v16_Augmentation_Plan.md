# v16 Augmentation Plan

## 0. 목적

`Agentic_Design_Patterns.pdf`를 다시 심층 대조한 결과를 바탕으로, 현재 `prompt-stack` 전체에 대해 **다음 단계 보강 포인트**를 정리한 계획 문서다.

이번 계획의 초점은 이미 반영된 1차 구조 보강을 반복하는 것이 아니라, 그 이후에도 남아 있는 **운영형 공백**을 메우는 데 있다.

핵심 목표:

- `prompt-stack` 본체를 더 강한 agent runtime constitution으로 끌어올린다.
- 프롬프트 문서 내부에서는 버전 문자열을 제거하고 **파일명 기준 참조만** 유지한다.
- system prompt 구성, leakage 방지, trajectory artifact, mock-eval, runtime environment class, codex sync를 명시적 doctrine으로 만든다.
- 새 문서를 무분별하게 늘리지 않고, 기존 owner 문서에 우선 반영한다.

---

## 1. 분석 근거

### 1.1 소스 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted_compact.txt`

### 1.2 이번 분석에서 특히 강하게 작동한 근거 축

1. 책의 21개 패턴 + Appendix 전체 구조  
   현재 `prompt-stack`가 이미 대부분의 chapter surface를 반영하고 있는지 확인하는 기준으로 사용.

2. FAQ 구간의 실무형 guidance  
   특히 다음 항목들이 이번 보강 포인트를 직접 밀어 올렸다.
   - 좋은 system prompt의 구성 요소
   - prompt leakage
   - plan approval
   - thought-action-observation trajectory
   - mock tool 기반 테스트

3. Appendix B/C/E/G의 운영 환경 관점  
   GUI, CLI, coding agent, framework, local context orchestrator, prompt library 같은 runtime packaging 관점을 보강 근거로 사용.

### 1.3 현재 `prompt-stack` 대조 결과

현재 스택은 이미 다음 1차 보강을 상당 부분 흡수한 상태다.

- `PROMPT_guideline`에 agent maturity ladder 존재
- `PROMPT_guideline`에 pattern composition canon 존재
- `PROMPT_guardrails_safety_overlay`가 별도 owner로 존재
- `PROMPT_evaluation_monitoring_overlay`에 trajectory evaluation 존재
- `PROMPT_tool_protocol_overlay`에 environment/auth/session discipline 존재
- `PROMPT_full`, `PROMPT_standalone`에 planning gate, reflection, recovery, safety coupling이 상당 부분 반영됨

즉, 이번 `v16` 계획은 “chapter coverage 부족”보다는 **runtime assembly와 operational doctrine 부족**을 겨냥해야 한다.

---

## 2. 현재 상태 진단

### 2.1 이미 강한 영역

현재 `prompt-stack`는 아래 영역에서 이미 높은 완성도를 보인다.

- planning / routing / retrieval / memory / multi-agent / evaluation의 기본 owner 분리
- guardrails, HITL, recovery, resource-aware, context engineering의 1차 내재화
- base prompt 계층화
- example layer와 overlay layer의 분리
- codex constitution의 별도 운용

### 2.2 남아 있는 핵심 공백

이번 재분석 기준으로 남아 있는 공백은 다음과 같다.

1. **Prompt assembly canon 부재**
2. **Prompt leakage / answer-surface separation 부재**
3. **Trajectory artifact canon 부재**
4. **Mock-tool / deterministic harness doctrine 부재**
5. **Runtime environment class matrix 부재**
6. **Plan approval / human checkpoint canon의 불충분한 명시**
7. **Coding-agent operational pack의 stack-level 흡수 부족**
8. **버전 문자열 hygiene 미완료**

### 2.3 중요한 해석

`Assumption`

현재 스택은 “무엇을 소유하는가”는 강하지만, “어떻게 조립하고 어떻게 검증하며 어떤 surface를 숨기고 어떤 artifact만 남길 것인가”는 아직 owner-level operationality가 더 필요하다.

이 차이가 이번 `v16` 보강의 핵심이다.

---

## 3. 보강 원칙

### 3.1 Versionless prompt rule

프롬프트 문서 본문에서는:

- `v14`
- `v15`
- `v16`
- `PROMPT_v14_*`
- `PROMPT_v15_*`
- `PROMPT_v16_*`

같은 표기를 사용하지 않는다.

프롬프트 문서는 다음처럼 **파일명 기준**으로만 참조한다.

- `PROMPT_guideline`
- `PROMPT_full`
- `PROMPT_guardrails_safety_overlay`

버전 표기는 계획 문서와 결과 문서에만 남긴다.

### 3.2 Owner-first augmentation

새 doctrine은 가능한 한 기존 owner 문서에 먼저 넣는다.

기본 원칙:

- assembly -> `PROMPT_guideline` 우선
- leakage / answer-surface safety -> `PROMPT_guardrails_safety_overlay` 우선
- environment class / capability exposure -> `PROMPT_tool_protocol_overlay` 우선
- trajectory artifact / mock-eval -> `PROMPT_evaluation_monitoring_overlay` 우선

### 3.3 No decorative expansion

새 문서를 추가하는 것은 예외다.  
기본 전략은 **새 component 추가가 아니라 기존 owner 강화**다.

### 3.4 Safe trajectory principle

trajectory를 강화하더라도 raw hidden chain-of-thought를 강제하지 않는다.

대신 남겨야 할 것은:

- step intent
- selected action
- tool call summary
- observation summary
- recovery event
- stop reason

같은 **observable and auditable artifact**다.

### 3.5 Documentation vs runtime separation

문서가 풍부해지는 것과 runtime prompt가 비대해지는 것은 다르다.

보강은 다음을 지켜야 한다.

- governance는 canon을 정의
- base prompt는 실행 posture만 유지
- overlay는 owner doctrine만 소유
- examples는 structure만 제공
- user guide는 assembly 사용법만 안내

---

## 4. 우선순위별 보강 포인트

## 4.1 High Priority

### A. Prompt Assembly Canon 정립

`Agentic Design Patterns`의 FAQ는 좋은 agent system prompt가 다음을 포함해야 한다고 본다.

- role and goal
- tool definitions
- constraints and rules
- process instructions
- example trajectories

현재 `prompt-stack`는 이 요소들이 여러 문서에 분산돼 있으나, **정식 assembly canon**은 약하다.

필요 보강:

- runtime assembly load order
- required vs optional component boundary
- component conflict resolution
- minimal valid bundle rules
- “one base only”를 넘는 상위 조립 원칙
- example layer가 언제 붙고 언제 빠지는지
- codex / chat / research / multi-agent 시나리오별 조립 규칙

주 대상:

- `PROMPT_guideline`
- `PROMPT_USER_GUIDE`
- `codex/AGENTS.md`

기대 효과:

- stack가 pattern library를 넘어 **predictable prompt assembly system**이 된다.

### B. Prompt Leakage / Answer-Surface Separation 명시

책은 prompt leakage를 명시적으로 다룬다.  
tool definitions나 internal instructions가 최종 응답으로 새어 나가는 문제는 현재 스택에서도 doctrine-level로 분리하는 편이 맞다.

필요 보강:

- internal instruction disclosure 금지
- tool schema / policy rule / hidden control text 노출 금지
- reasoning surface vs final answer surface 분리
- “reasoning용 구성 정보”와 “user-facing answer”의 분리 규칙
- prompt injection이 disclosure로 이어지는 경로 차단

주 대상:

- `PROMPT_guardrails_safety_overlay`
- `PROMPT_full`
- `PROMPT_standalone`
- `PROMPT_tool_protocol_overlay`
- `PROMPT_example_injection`

기대 효과:

- safety가 “행동 제한”을 넘어 **instruction containment**까지 소유하게 된다.

### C. Safe Trajectory Artifact Canon

책은 trajectory를 debugging과 evaluation의 핵심으로 본다.  
현재 스택에도 trajectory evaluation은 있지만, **어떤 artifact를 trajectory로 남길지**가 충분히 정형화되어 있지 않다.

필요 보강:

- trajectory artifact 최소 필드 정의
- thought-action-observation 계열을 safe artifact로 재해석
- raw private reasoning 비강제 원칙
- branch / join / retry / rollback / escalation event 표현
- final answer가 좋아도 path가 나쁘면 감점되는 기준

주 대상:

- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
- `PROMPT_tool_protocol_overlay`
- `PROMPT_example_catalog`

기대 효과:

- process eval, debug, regression review가 더 일관된 surface를 갖게 된다.

### D. Mock Tool / Deterministic Harness Doctrine

책은 non-deterministic agent를 검증할 때 mock tool과 dedicated testing environment를 강조한다.  
현재 스택은 eval과 monitoring은 강하지만, **mock-tool 기반 검증 canon**은 약하다.

필요 보강:

- mock tool 사용 시점
- tool-call parameter assertion
- final answer element assertion
- sandboxed eval environment rule
- outcome-based eval과 process-based eval의 분리
- deterministic checks와 judge-based checks의 역할 분리

주 대상:

- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_tool_protocol_overlay`
- `codex/skills/eval-ops/SKILL.md`
- `PROMPT_example_catalog`

기대 효과:

- 평가 체계가 “결과 점수” 중심에서 **reproducible agent test discipline**으로 확장된다.

### E. Runtime Environment Class Matrix

책의 Appendix는 chat-only 환경을 넘어 GUI, CLI, coding agent, framework, real-world interface를 모두 다룬다.  
현재 스택은 environment boundary는 있지만, **environment class taxonomy**는 약하다.

필요 보강:

- chat-only
- retrieval/read-only
- tool-call read/write
- CLI / local filesystem
- IDE / coding agent
- browser / GUI / computer-use
- real-world proxy / high-stakes external action

각 class마다 정의:

- typical capability set
- expected risk profile
- default approval boundary
- preferred verification mode
- allowed autonomy level

주 대상:

- `PROMPT_tool_protocol_overlay`
- `PROMPT_guardrails_safety_overlay`
- `PROMPT_guideline`
- `codex/AGENTS.md`

기대 효과:

- capability discipline이 도구 단위에서 **runtime surface 단위**로 확장된다.

## 4.2 Medium Priority

### F. Plan Approval and Human Checkpoint Canon

책 FAQ는 multi-step plan을 사용자에게 먼저 보여주고 승인받는 것을 좋은 practice로 본다.  
현재 스택에도 HITL과 approval은 있지만, **plan approval checkpoint**는 더 선명하게 만들 수 있다.

필요 보강:

- 언제 plan approval을 요구하는가
- 언제 tool-use confirmation이 필요한가
- 언제 ambiguity resolution을 사람에게 넘기는가
- 언제 final output review를 요구하는가

주 대상:

- `PROMPT_guideline`
- `PROMPT_full`
- `PROMPT_standalone`
- `PROMPT_tool_protocol_overlay`

### G. Coding-Agent Operational Pack 흡수

Appendix G는 coding agent 운영을 다음 요소로 구체화한다.

- human-led orchestration
- local context orchestrator
- version-controlled prompt library
- specialized agent invocation prompts
- git-hook 연계 review loop

현재 `codex`는 이미 강하지만, 이 운영 관점을 stack-level doctrine으로 더 흡수할 수 있다.

필요 보강:

- coding-agent invocation pack 기준
- context pack construction 규칙
- reviewer/tester/documenter style specialist invocation examples
- pre-commit / review gate에 연결되는 eval posture

주 대상:

- `codex/AGENTS.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `PROMPT_USER_GUIDE`

### H. Version Hygiene 완료

현재 prompt 본체는 상당수 정리되어 있지만, `PROMPT_USER_GUIDE.md`에는 아직 버전 표기가 남아 있다.

이 항목은 작아 보이지만 중요하다.

- user-facing assembly guide가 versionless rule을 깨면 전체 규칙이 약해진다.
- 실제 운영에서 복사/조립 실수 가능성이 커진다.

필요 보강:

- `PROMPT_USER_GUIDE.md`의 `v15` 표기 제거
- 폴더 트리 예시에서 version 문자열 제거
- prompt body / codex docs / examples에 대한 잔존 audit

---

## 5. 파일별 적용 계획

### 5.1 `00_governance/PROMPT_guideline.md`

추가/강화 대상:

- prompt assembly canon
- load order and minimal valid bundle
- component conflict resolution
- plan approval checkpoint canon
- environment class의 상위 분류 개요

주의:

- governance가 runtime prompt 본문처럼 비대해지지 않도록 canon 중심으로 유지

### 5.2 `01_base/PROMPT_full.md`

추가/강화 대상:

- reasoning surface vs final answer surface separation
- plan approval trigger
- safe trajectory summary rule
- tool/use/output disclosure 제한

### 5.3 `01_base/PROMPT_standalone.md`

추가/강화 대상:

- coding-agent 환경에서의 leakage 방지
- plan approval과 mutation approval 경계의 분리
- trajectory artifact를 간결하게 남기는 규칙

### 5.4 `01_base/PROMPT_light.md` / `PROMPT_lightest.md`

추가/강화 대상:

- 위 doctrine의 boundary-level carryover만 반영
- 무거운 운영 규칙을 직접 복제하지 않음

### 5.5 `02_overlays/PROMPT_guardrails_safety_overlay.md`

추가/강화 대상:

- prompt leakage policy
- instruction disclosure containment
- answer-surface filtering
- hidden control text non-disclosure
- prompt injection -> disclosure path 차단

### 5.6 `02_overlays/PROMPT_tool_protocol_overlay.md`

추가/강화 대상:

- runtime environment class matrix
- capability exposure contract
- mock tool discipline
- tool definition packaging rule
- read/write/high-impact surface별 approval/verification rule

### 5.7 `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

추가/강화 대상:

- trajectory artifact schema
- process artifact vs final outcome 분리
- deterministic harness doctrine
- mock-tool eval examples
- tool-call assertion / answer-element assertion / path-quality assertion

### 5.8 `02_overlays/PROMPT_search_reasoning_overlay.md`

추가/강화 대상:

- safe thought-action-observation reinterpretation
- trajectory checkpoints와 artifact surface 연결
- search/reasoning trace를 공개 응답과 분리하는 규칙

### 5.9 `03_examples/PROMPT_example_injection.md`

추가/강화 대상:

- example trajectories 사용 조건
- leakage-safe example injection rule
- assembly-aware example attachment rule

### 5.10 `03_examples/PROMPT_example_catalog.md`

추가/강화 대상:

- system prompt assembly example family
- plan approval checkpoint example family
- mock-tool eval example family
- safe trajectory artifact example family
- coding-agent invocation pack example family

### 5.11 `PROMPT_USER_GUIDE.md`

추가/강화 대상:

- versionless naming 정리
- assembly guide를 canonical load order에 맞게 재기술
- chat / research / codex / multi-agent 별 조립 예시 갱신

### 5.12 `codex/AGENTS.md`

추가/강화 대상:

- assembly/load-order awareness
- leakage-safe answer surface
- environment class awareness
- coding-agent operational pack
- mock-eval / review gate awareness

### 5.13 `codex/skills/*/SKILL.md`

추가/강화 대상:

- `coding-core`: mutation-safe approval and leakage-safe execution
- `grounded-research`: plan approval and trajectory artifact separation
- `design-analysis`: plan proposal / review checkpoint discipline
- `eval-ops`: mock-tool, deterministic harness, trajectory scoring

### 5.14 `99_original/*`

원칙:

- active prompt에 반영한 구조적 변경은 `99_original`에도 동기화
- 단, 예시/운영 설명이 아니라 owner doctrine 변경만 선택적으로 동기화할지 여부는 작업 시작 전에 다시 판단

---

## 6. 실행 순서

### Phase 1. Governance and guide

- `PROMPT_guideline`
- `PROMPT_USER_GUIDE`

먼저 assembly canon과 versionless rule을 고정한다.

### Phase 2. Safety and tool surface

- `PROMPT_guardrails_safety_overlay`
- `PROMPT_tool_protocol_overlay`

leakage, capability exposure, environment class를 먼저 고정한다.

### Phase 3. Evaluation and reasoning surface

- `PROMPT_evaluation_monitoring_overlay`
- `PROMPT_search_reasoning_overlay`
- examples

trajectory artifact와 mock-eval을 정형화한다.

### Phase 4. Base prompt carryover

- `PROMPT_full`
- `PROMPT_standalone`
- 필요 시 `PROMPT_light`, `PROMPT_lightest`

상위 doctrine을 base prompt에 경량 carryover 한다.

### Phase 5. Codex sync

- `codex/AGENTS.md`
- `codex/skills/*/SKILL.md`

stack-level doctrine을 coding runtime에 맞게 압축 반영한다.

### Phase 6. Mirror and audit

- `99_original/*`
- version-string audit

마지막에 잔존 버전 문자열과 참조 정합성을 확인한다.

---

## 7. 완료 기준

다음 조건을 만족하면 `v16` 보강이 완료된 것으로 본다.

1. prompt 문서 본문에 버전 문자열이 남아 있지 않다.
2. `PROMPT_USER_GUIDE.md`도 versionless 규칙을 따른다.
3. assembly canon이 `PROMPT_guideline`과 guide에 명시된다.
4. prompt leakage / answer-surface separation이 safety owner에 명시된다.
5. trajectory artifact canon이 evaluation surface에 명시된다.
6. mock-tool / deterministic harness doctrine이 eval/tool surface에 명시된다.
7. environment class matrix가 tool/safety/codex layer에 반영된다.
8. codex constitution과 skills가 상위 보강과 정합적이다.
9. 필요한 범위의 `99_original` mirror가 동기화된다.

---

## 8. 비권장 접근

다음 방식은 피한다.

- chapter 이름만 늘어놓는 표면적 보강
- 새 문서를 계속 추가해 official stack를 과도하게 비대화하는 방식
- trajectory 강화를 이유로 raw chain-of-thought 노출을 요구하는 방식
- example catalog를 factual content repository처럼 키우는 방식
- versionless 원칙을 깨는 이름 되돌리기
- codex 계층을 나중에 따로 맞추겠다는 식의 분리 작업

---

## 9. 최종 판단

이번 재분석 기준으로 `prompt-stack`는 이미 1차 pattern coverage는 충분히 강하다.  
다음 단계는 새 pattern 이름을 더 붙이는 작업이 아니라, 아래 5개를 정식 doctrine으로 끌어올리는 작업이다.

- assembly
- leakage containment
- safe trajectory artifact
- mock-tool evaluation
- runtime environment classes

즉, `v16`의 본질은 **chapter coverage 확대**가 아니라 **runtime reliability architecture 강화**다.
