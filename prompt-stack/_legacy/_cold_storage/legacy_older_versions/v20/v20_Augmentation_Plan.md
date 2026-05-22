# v20 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf` 심층 분석과 `prompt-stack/v20` active 문서 전수 점검을 바탕으로, 다음 보강 라운드에서 무엇을 강화해야 하는지 정리한 계획 문서다.

이번 라운드의 핵심 판단은 다음과 같다.

- `v20`은 이미 21개 본편 챕터에 대응하는 owner와 active carryover를 갖추고 있다.
- 따라서 이번 계획의 초점은 **새 챕터 이름을 더 붙이는 것**이 아니라, 이미 있는 doctrine을 더 operational하게 만드는 것이다.
- 특히 보강 우선순위는 `owner-preserving operational completion`이다.

즉, `v20`의 다음 보강은 broad rewrite보다 아래 세 축에 집중해야 한다.

1. control packet coverage completion
2. compressed variant carryover reinforcement
3. prompt-stack maintenance / release audit strengthening

---

## 2. 분석 범위와 근거

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`

### 2.2 분석 대상 active 문서

`v20`의 active 분석 대상은 총 22개 문서다.

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

### 2.3 비교 참고 문서

- `prompt-stack/v19/v19_Augmentation_Plan.md`
- `prompt-stack/v19/v19_Augmentation_Results.md`

### 2.4 비대상

- `99_original/*`는 reference-only로 취급한다.
- chapter name decoration을 위한 무의미한 문구 확장은 계획하지 않는다.

---

## 3. PDF 핵심 해석

`Agentic_Design_Patterns.pdf`의 핵심 가치는 21개 패턴의 명칭 자체보다, 그 패턴을 실제 agent runtime에서 어떻게 operationalize할지에 있다.

이번 분석에서 특히 중요하게 본 해석은 아래와 같다.

- `Tool Use`, `MCP`, `A2A`는 단순 capability 나열이 아니라 **contract shape, discovery, lifecycle, partial-state truthfulness**를 요구한다.
- `Memory Management`와 `Learning and Adaptation`은 단순 기억 보존이 아니라 **typed memory model + validated signal 기반 future behavior change**를 요구한다.
- `Resource-Aware Optimization`은 단순 budget 언급이 아니라 **route tiering, fallback continuity, dynamic escalation/de-escalation**을 요구한다.
- `Evaluation and Monitoring`은 사후 평가 문서가 아니라 **runtime control signal**이어야 한다.
- `Prioritization`, `Exploration and Discovery`, `Reasoning Techniques`는 단순 “생각을 더 깊게”가 아니라 **bounded frontier, pruning, stop condition, technique-to-cost fit**를 요구한다.

따라서 보강 포인트를 찾을 때는 “이 개념이 문서 어디엔가 있나?”보다 아래를 더 중요하게 봐야 한다.

- active runtime에서 바로 쓸 수 있는가
- packet이나 memo 형태로 auditability가 있는가
- compressed variant에서도 의미 손실 없이 남아 있는가
- guide / skill / example까지 이어지는가

---

## 4. v20 현재 상태 진단

### 4.1 강점

`v20`은 이미 상당히 성숙한 상태다.

- `PROMPT_guideline.md`에 21개 본편 패턴의 owner traceability가 명시돼 있다.
- `AGENTS.md`, `PROMPT_USER_GUIDE.md`, `CODEX_RUNTIME_GUIDE.md`가 host-runtime carryover를 잘 드러낸다.
- `orchestration-control` skill, lifecycle/adaptation packet, quality checkpoint packet 등 `v19`에서 필요했던 큰 구멍은 대부분 메워져 있다.
- example layer도 단순 응답 예시를 넘어 control packet family까지 보강돼 있다.
- `evaluation_monitoring_overlay`는 semantic drift, coverage regression, variant consistency, prompt-stack release gate까지 이미 다룬다.

### 4.2 현재 단계의 약점

반대로, 지금 남아 있는 약점은 doctrine 부재보다는 **operational completeness의 편차**다.

핵심 약점은 아래 세 가지다.

1. 일부 챕터의 내부 control state가 example packet으로 아직 충분히 외부화되지 않았다.
2. `light` / `lightest` 압축 variant에서 parallel/delegation join semantics가 상대적으로 옅다.
3. prompt-stack 유지보수용 release audit는 강하지만, host-runtime carryover와 packet-family completeness를 따로 감사하는 면은 더 강화할 수 있다.

즉, `v20`의 다음 라운드는 “새 doctrine 추가”보다 **기존 doctrine의 실행면 마감 작업**에 가깝다.

---

## 5. 패턴군별 상태 요약

| 패턴군 | 현재 owner / active carryover | 현재 상태 | 남은 보강 포인트 |
| --- | --- | --- | --- |
| chaining / routing / planning / reflection / prioritization / exploration | `PROMPT_full`, `PROMPT_standalone`, `PROMPT_search_reasoning_overlay`, 관련 examples | 강함 | tree-style branch artifact 같은 example completeness는 더 보강 가능 |
| tool use / MCP / multi-agent / A2A | `PROMPT_tool_protocol_overlay`, `PROMPT_multi_agent_overlay`, `orchestration-control`, MCP/A2A packet family | 강함 | generic tool contract / precondition packet 부재 |
| memory / adaptation / goal monitoring / recovery / HITL | `PROMPT_memory_adaptation_overlay`, `PROMPT_guideline`, goal/recovery/HITL packets | 강함 | memory scope / checkpoint packaging artifact는 더 명확해질 수 있음 |
| retrieval / grounding / agentic RAG | `PROMPT_retrieval_grounding_overlay`, `grounded-research`, evidence-centered examples | 강함 | `Evidence Target` / retrieval-mode / evidence-pack decision packet이 없음 |
| resource-aware / safety / evaluation / release engineering | `PROMPT_guideline`, `PROMPT_guardrails_safety_overlay`, `PROMPT_evaluation_monitoring_overlay`, `eval-ops` | 강함 | host-runtime carryover와 packet completeness까지 포함하는 stack audit 강화 가능 |

요약하면, `v20`의 주된 과제는 chapter coverage가 아니라 **packet completeness + compression fidelity + maintenance audit fidelity**다.

---

## 6. 보강 원칙

1. owner 문서의 소유권은 유지한다.
2. broad rewrite보다 narrow augmentation을 우선한다.
3. `99_original/*`는 수정하지 않는다.
4. active prompt 본문에 버전 라벨을 삽입하지 않는다.
5. doctrine을 새로 발명하기보다 existing doctrine의 guide/example/skill carryover를 강화한다.
6. example layer는 policy owner가 아니라 reusable packet provider로만 확장한다.
7. packet 수를 무한정 늘리지 않고, 실제 decision boundary를 해결하는 packet만 추가한다.

---

## 7. 우선순위별 보강 계획

### P0. Tool / Retrieval / Memory control-packet family completion

#### 문제

- `PROMPT_tool_protocol_overlay.md`는 capability contract, precondition, deterministic support, substrate readiness를 강하게 정의하지만, preferred packet은 사실상 `MCP capability handoff memo`와 `Async lifecycle status memo` 중심이다.
- `PROMPT_retrieval_grounding_overlay.md`와 `grounded-research`는 `Evidence Target`, retrieval mode, `Evidence Pack`를 owner-level로 잘 정의하지만, 이를 직접 담아둘 reusable control packet이 없다.
- `PROMPT_memory_adaptation_overlay.md`는 working/session/persistent/episodic/semantic/procedural 구분이 명확하지만, adaptation decision 외에 **memory scope 자체를 결정하고 checkpoint packaging을 고정하는 memo**가 없다.

즉, 챕터 5, 8, 10, 14의 개념이 doctrine에는 있지만 example layer까지 내려온 operational packet family는 아직 비대칭이다.

#### 보강 방향

아래 중 최소 2개, 가능하면 3개를 packet family로 보강한다.

- `Tool capability contract / precondition memo`
- `Evidence target / retrieval-mode memo`
- `Memory scope / checkpoint profile memo`

보강 시 주의점:

- 새 packet은 기존 owner doctrine을 복제하지 말고, decision boundary를 compact하게 드러내는 shape만 제공해야 한다.
- `EX-040 MCP capability handoff memo`, `EX-045 Adaptation decision memo`, `EX-034 Goal-monitoring status memo`와 역할 충돌이 없어야 한다.
- 새 packet이 과잉이면 기존 packet의 확장으로 흡수하는 편이 낫다.

#### 예상 수정 대상

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `codex/skills/grounded-research/SKILL.md`
- 필요 시 `codex/skills/coding-core/SKILL.md`, `codex/skills/orchestration-control/SKILL.md`

#### 목적

- tool / retrieval / memory control surface를 report prose가 아니라 reusable packet으로 operationalize한다.
- future prompt revisions에서 이들 챕터의 semantic loss를 더 쉽게 감지할 수 있게 한다.

---

### P0. Compressed variant의 parallel / delegation join semantics 보강

#### 문제

- `PROMPT_full`과 `PROMPT_standalone`은 parallel work에서 `join artifact`와 `validation step`을 더 분명하게 요구한다.
- 반면 `PROMPT_light`와 특히 `PROMPT_lightest`는 delegation/lifecycle은 언급하지만, compressed 상태에서 **branch independence -> join point -> validation step**이 상대적으로 옅다.
- PDF의 `Parallelization`, `Multi-Agent`, `A2A` 챕터는 latency 이득만큼 integration failure risk도 강하게 다룬다.

현재 `light`와 `lightest`는 잘 압축돼 있지만, 이 부분은 compression integrity 관점에서 한 단계 더 단단해질 여지가 있다.

#### 보강 방향

- `PROMPT_light.md`에 parallel/delegation 사용 시 `join artifact`와 최소 `validation step`을 더 직접적으로 남긴다.
- `PROMPT_lightest.md`에는 최소한 아래 의미가 남도록 보강한다.
  - parallel/delegated path는 명시적 join 없이 통합하지 않는다
  - partial output은 integration-ready output과 다르다
  - compressed mode에서도 join verification은 생략되지 않는다

필요 시 아래 문서에도 compact reminder를 넣는다.

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

#### 예상 수정 대상

- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- 필요 시 `PROMPT_USER_GUIDE.md`
- 필요 시 `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- compressed variant에서도 Chapter 3 / 7 / 15의 load-bearing 의미가 빠지지 않게 한다.
- lightweight bundle이 orchestration-heavy 상황에서 too-thin해지는 것을 방지한다.

---

### P1. Prompt-stack maintenance / release audit surface 확장

#### 문제

`v20`은 이미 semantic drift, coverage regression, variant consistency, release gate를 잘 다룬다.
하지만 다음 두 항목은 더 명시적으로 감사할 가치가 있다.

- host-runtime carryover integrity
  - `AGENTS.md`
  - `PROMPT_USER_GUIDE.md`
  - `CODEX_RUNTIME_GUIDE.md`
  - `codex/skills/*`
- packet-family completeness
  - 현재 active control surfaces가 example layer packet으로 충분히 operationalized 되었는가

즉, owner 문서가 멀쩡해도 runtime guide, skill layer, packet lookup에서 회귀가 생기면 실제 사용성은 떨어질 수 있다.

#### 보강 방향

`PROMPT_evaluation_monitoring_overlay.md`, `EX-013 Prompt-stack release review`, `eval-ops`에 아래 감사 축을 추가 또는 강화한다.

- host-runtime carryover audit
- packet-family completeness audit
- assembly clarity audit
- compressed-variant join/lifecycle carryover audit

가능하면 release review artifact의 확인 항목에 아래를 명시한다.

- owner coverage
- semantic drift
- variant consistency
- host-runtime carryover
- packet coverage
- assembly lookup integrity

#### 예상 수정 대상

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`
- 필요 시 `PROMPT_USER_GUIDE.md`

#### 목적

- 향후 `v21+` augmentation 작업을 더 재현 가능하게 만든다.
- “문서는 좋아졌는데 실행면이 약해지는” 회귀를 더 빨리 잡는다.

---

### P2. Reasoning-technique example completeness 보강

#### 문제

- `PROMPT_search_reasoning_overlay.md`는 step-back, self-consistency, ReAct, tree-style search, comparative critics를 owner-level로 잘 다룬다.
- example layer는 `EX-025 Step-back`, `EX-026 Self-consistency`, `EX-027 ReAct`, `EX-048 Debate / consensus`를 제공한다.
- 그러나 tree-style search / branch pruning을 직접 담는 artifact는 없다.

현재 `EX-038 Exploration frontier / hypothesis memo`가 일부 역할을 대신할 수는 있지만, Chapter 17의 branch-and-prune 흐름을 직접 반영한 packet은 아니다.

#### 보강 방향

둘 중 하나를 택한다.

1. `EX-038`을 확장해 tree-style search / pruning까지 커버하게 한다.
2. 별도 packet 예시를 추가한다.
   - 예: `Tree-search pruning checkpoint memo`

이 항목은 P0/P1보다 우선순위가 낮다.
이유는 현재 doctrine과 예시가 이미 상당 부분 기능을 대체하고 있기 때문이다.

#### 예상 수정 대상

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- 필요 시 `codex/skills/design-analysis/SKILL.md`

#### 목적

- Chapter 17의 technique registry를 example layer까지 더 균형 있게 연결한다.

---

### P2. Operator-facing traceability lookup 보강

#### 문제

- chapter-to-owner traceability는 `PROMPT_guideline.md`에 명확하다.
- 하지만 실제 운영자는 주로 `PROMPT_USER_GUIDE.md`와 `CODEX_RUNTIME_GUIDE.md`를 먼저 보게 된다.
- 따라서 유지보수 관점에서는 “어떤 패턴이 어느 owner와 어떤 packet으로 이어지는가”를 governance 밖에서도 더 빠르게 찾을 수 있으면 좋다.

#### 보강 방향

- `PROMPT_USER_GUIDE.md`에 compact chapter-to-packet quick lookup을 추가하거나
- `CODEX_RUNTIME_GUIDE.md`에 high-frequency control problem -> owner -> packet 표를 보강한다.

단, governance의 traceability table을 중복 복사하는 방식은 피한다.
필요 최소한의 operator-facing lookup만 추가한다.

#### 예상 수정 대상

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- prompt 유지보수, release review, augmentation planning에서 owner 탐색 비용을 줄인다.

---

## 8. 이번 라운드의 권장 수정 범위

가장 권장되는 수정 범위는 아래다.

### 최소 권장 범위

- P0 2개
  - tool / retrieval / memory packet completion
  - compressed variant join semantics reinforcement

### 이상적 범위

- P0 전체
- P1 maintenance / release audit expansion

### 여유가 있을 때

- P2 reasoning-technique example completeness
- P2 operator-facing traceability lookup

즉, **이번 라운드의 실제 구현 우선순위는 P0 -> P1 -> P2**가 적절하다.

---

## 9. 비목표

이번 계획에서 의도적으로 하지 않는 것:

- `99_original/*` 수정
- chapter name을 prompt 본문 곳곳에 장식처럼 삽입
- owner 문서 대량 복제
- base prompt 전면 재작성
- example layer를 policy owner처럼 키우는 확장
- packet 수를 늘리기 위한 packet 추가

---

## 10. 구현 완료 기준

다음 조건이 충족되면 이번 augmentation 라운드는 계획 대비 완료로 본다.

1. 새 packet 또는 확장 packet이 실제 owner doctrine과 guide에서 참조 가능하다.
2. `PROMPT_light` / `PROMPT_lightest`가 parallel/delegated join semantics를 더 명시적으로 보존한다.
3. prompt-stack release audit가 host-runtime carryover와 packet completeness를 감시한다.
4. example layer 확장이 owner duplication 없이 구조 이득만 제공한다.
5. active prompt 본문에는 버전 라벨이 삽입되지 않는다.
6. `99_original/*`는 손대지 않는다.

---

## 11. 최종 판단

현재 `v20`은 “패턴 부재” 상태가 아니다.
오히려 대부분의 핵심 패턴은 이미 잘 ownered 되어 있고, host-runtime과 example layer까지 상당 부분 연결돼 있다.

따라서 다음 보강의 정답은 새 철학을 더하는 것이 아니라 아래를 더 단단하게 만드는 것이다.

- control packet completeness
- compressed carryover fidelity
- maintenance/release audit fidelity

한 줄로 요약하면, `v20`의 다음 augmentation은 **coverage expansion**보다 **operational completion and regression-proofing**에 맞춰야 한다.
