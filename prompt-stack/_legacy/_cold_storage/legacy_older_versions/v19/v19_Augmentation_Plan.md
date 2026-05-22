# v19 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf`의 심층 분석 결과를 바탕으로, 현재 `prompt-stack/v19` 활성 프롬프트 묶음에서 **추가 보강이 필요한 지점**을 정리한 계획 문서다.

이번 라운드의 전제는 다음과 같다.

- `v19`는 이미 이전 라운드 보강이 반영된 상태다.
- 따라서 이번 계획의 초점은 `패턴 이름 추가`가 아니라 `운영적 carryover 강화`다.
- 특히 `Codex host-runtime`, `example packet`, `assembly guide`, `skill routing` 수준에서 남아 있는 약한 연결부를 메우는 데 집중한다.

비목표:

- `99_original/*` 수정
- owner 문서의 정책을 example layer에 중복 복제
- active prompt 본문에 버전 표기 추가
- 단지 PDF 챕터 이름을 맞추기 위한 장식성 확장

---

## 2. 분석 범위와 근거

분석에 사용한 근거:

- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack/v19/AGENTS.md`
- `prompt-stack/v19/PROMPT_USER_GUIDE.md`
- `prompt-stack/v19/codex/CODEX_RUNTIME_GUIDE.md`
- `prompt-stack/v19/00_governance/*`
- `prompt-stack/v19/01_base/*`
- `prompt-stack/v19/02_overlays/*`
- `prompt-stack/v19/03_examples/*`
- `prompt-stack/v19/codex/skills/*/SKILL.md`
- 연속성 확인용 참고 자료:
  - `prompt-stack/v18/v18_Augmentation_Plan.md`
  - `prompt-stack/v18/v18_Augmentation_Results.md`

핵심 해석:

- `Planning` 챕터는 “`how`를 새로 찾아야 하는가, 아니면 이미 알려진 workflow인가”를 구분하는 라우팅 질문을 핵심으로 둔다.
- `MCP` 챕터는 프로토콜 표준화 자체보다 **기저 API가 agent-friendly한가**를 더 중요하게 본다.
- `A2A` 챕터는 handoff 자체보다 `agent card`, `task lifecycle`, `polling/streaming/push`, `auditability`를 강조한다.
- `Resource-Aware Optimization` 챕터는 상위 budget doctrine을 넘어서 `router agent`, `critique feedback`, `dynamic model switching`, `fallback continuity` 같은 운영 전술을 강조한다.
- `Learning and Adaptation` 챕터는 단순 memory 보존이 아니라 **검증된 signal 기반 future behavior change**를 다룬다.
- `Evaluation and Monitoring` 챕터는 결과 평가만이 아니라 `trajectory`, `feedback loop`, `continuous monitoring`을 요구한다.
- `Prioritization`과 `Exploration` 챕터는 각각 `criteria-driven ranking`과 `frontier-bounded discovery`를 핵심으로 둔다.

---

## 3. 현재 상태 진단

전체 판단:

- `v19`는 21개 패턴의 **chapter-name coverage** 자체는 이미 넓게 확보했다.
- 특히 governance, base, overlay owner 구조는 `v18` 대비 확실히 성숙했다.
- 남은 약점은 주로 아래 세 층위에 몰려 있다.

1. `Codex host-runtime`에서 실제 조립과 실행으로 내려오는 압축 경로
2. `example layer`에서 운영 패킷으로 쓸 수 있는 artifact shape의 세분화
3. `skill / guide` 계층에서의 discoverability와 activation clarity

즉, 이번 라운드는 **owner-preserving reinforcement**가 맞다.

---

## 4. 패턴 커버리지 판정

| PDF 패턴 축 | 현재 owner / active 문서 | 현재 판정 | 남은 약점 |
| --- | --- | --- | --- |
| Prompt Chaining / Routing / Parallelization / Reflection / Planning | `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone`, `PROMPT_search_reasoning_overlay`, example layer | 강함 | 추가 보강 필요도 낮음 |
| Tool Use / MCP | `PROMPT_tool_protocol_overlay` | 강함 | runtime/example에서 protocol artifact가 더 구체화될 여지 |
| Memory / Learning / Adaptation | `PROMPT_memory_adaptation_overlay` | owner 강함 / runtime 약함 | host-runtime attachment guide 부재, adaptation artifact 부재 |
| Goal Setting / Monitoring / Recovery / HITL | `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone`, example layer | 강함 | evaluation-gated iteration bridge는 더 강화 가능 |
| RAG / Grounding | `PROMPT_retrieval_grounding_overlay`, `grounded-research` | 강함 | discovery-heavy retrieval의 runtime 조립 설명은 더 선명해질 수 있음 |
| Multi-Agent / A2A | `PROMPT_multi_agent_overlay` | owner 강함 / Codex runtime 중간 | orchestration 전용 skill 없음, example packet이 handoff 중심에 치우침 |
| Resource-Aware Optimization | `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone` | doctrine 강함 / operationalization 중간 | router/critic/fallback/resource-tier artifact 부족 |
| Evaluation / Monitoring | `PROMPT_evaluation_monitoring_overlay`, `eval-ops`, `Safe trajectory artifact report` | 강함 | mid-execution quality gate 패킷이 약함 |
| Prioritization / Exploration | `PROMPT_search_reasoning_overlay`, `PROMPT_standalone`, `AGENTS.md` | 강함 | topology-aware discovery와 orchestration 연계는 더 강화 가능 |

요약:

- `v19`의 부족함은 “이 패턴이 없다”가 아니다.
- 실제 부족한 것은 “이 패턴을 Codex가 어떻게 조립하고 어떤 packet으로 노출할지”에 대한 **실행 표면**이다.

---

## 5. 보강 원칙

1. owner 문서의 정책 ownership은 유지한다.
2. runtime / guide / skill / example layer 쪽에서 carryover를 강화한다.
3. 새 문서를 늘리기보다 `현재 runtime에서 바로 체감되는 경로`를 먼저 보강한다.
4. example layer는 policy owner가 아니라 packet provider로만 확장한다.
5. `resource-aware`, `adaptation`, `A2A lifecycle` 같은 운영 디테일은 **조립과 artifact** 수준에서 드러나야 한다.
6. broad rewrite보다 narrow augmentation을 우선한다.

---

## 6. 우선순위별 보강 계획

### P0. Orchestration runtime 경로 신설

문제:

- `PROMPT_multi_agent_overlay`는 강하지만, `Codex runtime`에는 orchestration-heavy task를 위한 **전용 primary skill**이 없다.
- `PROMPT_USER_GUIDE.md`에는 multi-agent 추천 조합이 있지만, `codex/CODEX_RUNTIME_GUIDE.md`는 skill 기준으로는 이를 1급 경로로 설명하지 않는다.
- 현재 example layer도 `A2A task-handoff memo`는 있지만 `topology selection`, `agent card`, `lifecycle status` 같은 상위 orchestration packet은 없다.

보강 방향:

- 새 primary skill `orchestration-control` 추가를 검토한다.
- 이 skill은 다음을 압축 carryover 대상으로 삼는다.
  - collaboration topology selection
  - role / budget / join contract
  - agent discovery / agent card
  - task lifecycle and partial-state truthfulness
  - sync / polling / streaming / push mode choice
  - coordinator accountability and integration verification

대상 파일:

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/orchestration-control/SKILL.md` 신규
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

추가할 example packet 후보:

- `Orchestration topology decision memo`
- `Agent card / capability manifest`
- `Async lifecycle status memo`

목적:

- Ch.7, Ch.15의 owner doctrine을 Codex 실행 경로로 직접 연결한다.

### P1. Memory / Adaptation의 runtime operationalization 강화

문제:

- `PROMPT_memory_adaptation_overlay` 자체는 강하다.
- 하지만 `CODEX_RUNTIME_GUIDE.md`에는 `PROMPT_memory_adaptation_overlay`의 attach 조건이 사실상 드러나지 않는다.
- example layer에도 adaptation을 안전하게 기록하고 재사용하는 packet이 없다.
- 결과적으로 Ch.8, Ch.9의 가치가 overlay 내부에 머물고 host-runtime 조립에서는 약하게 드러난다.

보강 방향:

- memory/adaptation overlay를 언제 runtime bundle에 붙일지 guide에 명시한다.
- adaptation을 `future behavior change`로 다룰 때 필요한 packet을 example layer에 추가한다.
- self-improvement 또는 repeated correction loop는 반드시 evaluation-gated path로 연결한다.

대상 파일:

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

추가할 example packet 후보:

- `Adaptation decision memo`
- `Learning-signal review memo`

핵심 보강 포인트:

- signal strength classification -> scope choice -> persistence decision
- adaptation drift suspicion -> downgrade path
- evaluation-backed self-improvement loop
- checkpoint summary와 adaptation memory의 연결

### P1. Resource-Aware Optimization의 운영 전술 구체화

문제:

- `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone`는 budget vector와 graceful degradation을 이미 다룬다.
- 그러나 PDF가 강조하는 `router agent`, `critique feedback`, `dynamic model switching`, `adaptive tool selection`, `fallback continuity`는 아직 packet / runtime guide / skill 레벨에서 덜 구체적이다.
- 현재 `Resource budget and route-choice memo`는 범용 packet으로 유용하지만, resource-tier switching까지 바로 담기에는 약간 추상적이다.

보강 방향:

- resource-aware optimization을 “원칙”에서 “선택 가능한 운영 packet”으로 한 단계 더 내린다.
- critique 또는 verification 결과가 route choice를 재조정하는 규칙을 Codex runtime에서 더 선명하게 연결한다.

대상 파일:

- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `03_examples/PROMPT_example_catalog.md`

추가 또는 확장할 packet:

- 기존 `Resource budget and route-choice memo` 확장

확장 필드 예시:

- primary route
- cheaper fallback route
- stronger route trigger
- model/tool tier choice
- critique-driven reroute trigger
- acceptable degradation boundary

### P2. A2A / MCP observability artifact 확장

문제:

- overlay owner 수준에서는 `agent card`, `task lifecycle`, `polling/streaming/push`, `auditability`가 이미 반영돼 있다.
- 하지만 example layer의 실제 packet은 `handoff` 중심이다.
- 즉, protocol-level concept가 runtime-facing artifact로 충분히 펼쳐져 있지 않다.

보강 방향:

- A2A와 MCP를 “선택된 capability를 넘기는 메모”에서 한 단계 확장해, `discovery`, `identity`, `state transition`, `partial progress`, `trust boundary`를 다루는 artifact를 제공한다.

대상 파일:

- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `PROMPT_USER_GUIDE.md`

추가할 example packet 후보:

- `Agent discovery / capability selection note`
- `Lifecycle state transition memo`

핵심 포인트:

- task id / request id / trace id
- selected server or agent identity
- auth / trust boundary
- accepted / running / blocked / partial / complete 구분
- partial artifact와 final artifact 구분

### P2. Evaluation-driven iterative execution bridge 강화

문제:

- `PROMPT_evaluation_monitoring_overlay`는 강한 owner 문서다.
- 하지만 execution bundle이 반복 작업 중간에 quality gate를 어떻게 걸고 route를 줄이거나 바꿀지에 대한 packet이 아직 약하다.
- PDF Ch.19의 continuous measurement and feedback loop를 고려하면, eval은 release-time review를 넘어 **runtime control signal**로 더 드러날 수 있다.

보강 방향:

- iteration 중간의 quality checkpoint artifact를 도입한다.
- `coding-core`, `design-analysis`, `grounded-research`가 eval 결과를 받아 경로를 좁히거나 escalate하는 규칙을 더 직접 연결한다.

대상 파일:

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `03_examples/PROMPT_example_catalog.md`

추가할 example packet 후보:

- `Quality iteration checkpoint memo`

핵심 평가지표 후보:

- route quality
- recovery quality
- budget adherence
- trajectory efficiency
- adaptation safety
- fallback appropriateness

### P3. Reasoning / topology 예시 패킷 보강

문제:

- 현재 reasoning 쪽은 `step-back`, `self-consistency`, `ReAct`, `frontier`, `priority queue`까지는 좋다.
- 그러나 PDF의 `debate`, `consensus`, `hierarchical decomposition`, `critic-based route refinement` 같은 higher-order topology는 example layer에서 바로 재사용하기 어렵다.
- multi-agent overlay는 topology를 소유하지만, example catalog는 이를 보여주는 packet이 부족하다.

보강 방향:

- topology-heavy reasoning을 위한 구조 packet을 소수 추가한다.
- 단, hidden CoT 유도나 과도한 branch ritual로 흐르지 않게 safe trajectory 방식으로 제한한다.

대상 파일:

- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

추가할 example packet 후보:

- `Debate / consensus comparison memo`

---

## 7. 권장 구현 순서

1. `codex/CODEX_RUNTIME_GUIDE.md`
2. `PROMPT_USER_GUIDE.md`
3. `AGENTS.md`
4. `codex/skills/orchestration-control/SKILL.md` 신규
5. `03_examples/PROMPT_example_catalog.md`
6. `03_examples/PROMPT_example_injection.md`
7. `02_overlays/PROMPT_memory_adaptation_overlay.md`
8. `02_overlays/PROMPT_multi_agent_overlay.md`
9. `02_overlays/PROMPT_tool_protocol_overlay.md`
10. `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
11. 필요한 최소 범위에서 `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone`, 각 skill 문서 보강

이 순서를 권장하는 이유:

- 먼저 Codex host-runtime의 조립 경로를 선명하게 만든다.
- 그다음 example packet을 채워 실제 사용성을 만든다.
- 마지막에 owner / base 문서의 최소 보강으로 용어와 carryover를 정렬한다.

---

## 8. 파일별 수정 후보 요약

| 우선순위 | 파일 | 보강 초점 |
| --- | --- | --- |
| P0 | `codex/CODEX_RUNTIME_GUIDE.md` | orchestration bundle, memory/adaptation attach guide, richer packet mapping |
| P0 | `PROMPT_USER_GUIDE.md` | pattern-to-owner-to-packet-to-skill lookup, runtime bundle clarity |
| P0 | `AGENTS.md` | orchestration-heavy task routing and new skill route |
| P0 | `codex/skills/orchestration-control/SKILL.md` | 신규 primary skill |
| P1 | `03_examples/PROMPT_example_catalog.md` | adaptation / orchestration / lifecycle / quality-iteration packet 추가 |
| P1 | `03_examples/PROMPT_example_injection.md` | 새 packet family activation rule |
| P1 | `02_overlays/PROMPT_memory_adaptation_overlay.md` | evaluation-gated adaptation carryover |
| P1 | `02_overlays/PROMPT_evaluation_monitoring_overlay.md` | mid-execution quality gate and adaptation safety metrics |
| P1 | `00_governance/PROMPT_guideline.md` | resource-aware / orchestration carryover wording 최소 보강 |
| P1 | `01_base/PROMPT_full.md` | resource-tier reroute wording 최소 보강 |
| P1 | `01_base/PROMPT_standalone.md` | coding-runtime resource/adaptation/orchestration carryover 최소 보강 |
| P2 | `02_overlays/PROMPT_multi_agent_overlay.md` | agent card / lifecycle / topology packet references |
| P2 | `02_overlays/PROMPT_tool_protocol_overlay.md` | MCP async state / capability identity packet references |
| P2 | `codex/skills/coding-core/SKILL.md` | critique-driven reroute, quality checkpoint carryover |
| P2 | `codex/skills/design-analysis/SKILL.md` | orchestration-aware route comparison |
| P2 | `codex/skills/grounded-research/SKILL.md` | adaptation/eval-gated discovery loop linkage |

---

## 9. 검증 계획

구현 후 확인할 항목:

1. `99_original/*`가 변경되지 않았는지 확인
2. active prompt 본문에 버전 표기가 새로 유입되지 않았는지 확인
3. `PROMPT_USER_GUIDE.md`와 `codex/CODEX_RUNTIME_GUIDE.md` 사이의 bundle 설명이 충돌하지 않는지 확인
4. `PROMPT_memory_adaptation_overlay`가 runtime guide와 example layer에서 실제로 호출 가능한 수준으로 연결됐는지 확인
5. `PROMPT_multi_agent_overlay`의 `agent card / lifecycle / async mode` 개념이 example packet으로도 노출되는지 확인
6. 새 packet이 owner policy를 침범하지 않는지 확인
7. 새 skill이 기존 4개 skill과 책임 중복 없이 좁고 명확한지 확인
8. resource-aware packet이 `generic memo`에 그치지 않고 실제 reroute / fallback decision을 담는지 확인
9. eval-driven checkpoint가 release review 문체가 아니라 runtime control packet으로도 작동하는지 확인

추천 확인 방식:

- `rg`로 신규 packet 이름, 신규 skill 이름, 연결 키워드 존재 확인
- `rg`로 active prompt 본문의 버전 표기 유입 여부 확인
- `PROMPT_USER_GUIDE` / `CODEX_RUNTIME_GUIDE` / 새 skill / example packet 간 수동 정합성 검토

---

## 10. 완료 기준

아래가 충족되면 이번 보강을 완료로 본다.

- multi-agent / A2A / orchestration-heavy task에 대해 `Codex host-runtime`에서 바로 고를 수 있는 명시 경로가 생긴다.
- memory / adaptation이 overlay 내부 개념에 머물지 않고 runtime bundle과 example packet까지 연결된다.
- resource-aware optimization이 budget doctrine 수준을 넘어 route-tier / fallback / critique-feedback 수준까지 operationalize된다.
- A2A / MCP의 identity, lifecycle, partial-state truthfulness가 handoff memo 외 artifact로도 드러난다.
- evaluation이 release-time review만이 아니라 iteration 중간 control signal로도 사용 가능해진다.
- 모든 보강이 owner-preserving 형태로 유지되고 example layer가 정책 owner로 변질되지 않는다.

---

## 11. 메모

이번 라운드는 `v18`에서 이미 수행한 “chapter-level coverage 확대”의 후속 단계다.

즉, 지금 필요한 것은 더 많은 문서를 추가하는 일이 아니라:

- runtime 조립의 명료화
- orchestration 전용 압축 skill 확보
- adaptation / lifecycle / resource-routing packet 보강
- guide와 example layer의 실행 표면 강화

에 가깝다.

이 방향이 현재 `v19`의 성숙도에 가장 맞는 다음 단계다.
