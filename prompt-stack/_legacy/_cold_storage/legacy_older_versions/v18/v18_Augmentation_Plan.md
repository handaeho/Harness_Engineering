# v18 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf`의 핵심 패턴을 기준으로 `prompt-stack/v18` 활성 프롬프트 묶음의 보강 우선순위를 정리한 계획 문서다.

분석 범위:

- `00_governance/*`
- `01_base/*`
- `02_overlays/*`
- `03_examples/*`
- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/skills/*/SKILL.md`

비범위:

- `99_original/*`는 보존용 참조본으로 간주하고 수정하지 않는다.
- 프롬프트 본문에는 버전 문자열을 추가하지 않는다.
- 버전 표기는 이 계획 문서와 향후 결과 문서에만 남긴다.

---

## 2. 분석 요약

전체 평가는 `광범위한 커버리지는 이미 확보`, `실행 계층으로 내려올수록 압축 손실이 발생`이다.

강점:

- `PROMPT_guideline.md`가 패턴-오너 매핑을 이미 갖고 있어 거버넌스는 강하다.
- `PROMPT_full.md`와 주요 overlay들은 문서상 패턴 커버리지가 높다.
- `tool / MCP`, `retrieval / RAG`, `multi-agent / A2A`, `guardrails`, `evaluation`은 구조적으로 잘 분리되어 있다.
- `example layer`도 chaining/routing/parallel artifact까지는 이미 반영되어 있다.

핵심 갭:

1. `AGENTS.md`와 `coding-core` 같은 Codex 실행 압축 계층에서 `routing`, `prioritization`, `resource-aware optimization`, `exploration frontier`의 carryover가 약하다.
2. `Parallelization`, `Exception Handling and Recovery`, `Resource-Aware Optimization`이 실행 문서보다 governance 쪽에 더 강하게 걸려 있어, 실제 런타임에서 체감되는 규칙 밀도가 불균형하다.
3. `PROMPT_example_catalog.md`에는 `goal-monitoring`, `resource-budget`, `prioritization`, `exploration frontier`, `HITL approval`, `MCP/A2A handoff`용 artifact shape가 부족하다.
4. `PROMPT_USER_GUIDE.md`는 조립 원칙은 좋지만, 패턴별 빠른 진입점과 Codex용 선택 규칙이 아직 거칠다.
5. 평가 레이어는 강하지만 `route quality`, `priority quality`, `budget adherence`, `exploration efficiency` 같은 패턴별 운영 지표를 더 명시할 여지가 있다.

---

## 3. 패턴 커버리지 판정

| PDF 패턴군 | 현재 주 소유 문서 | 판정 | 보강 초점 |
| --- | --- | --- | --- |
| Ch.1-3 Prompt Chaining / Routing / Parallelization | `PROMPT_full`, `PROMPT_guideline`, `PROMPT_standalone`, example layer | 부분 강함 | Codex 압축 계층과 example layer 확장 |
| Ch.4-6 Reflection / Tool Use / Planning | `PROMPT_full`, `PROMPT_tool_protocol_overlay`, `PROMPT_standalone` | 강함 | 큰 구조 변경 불필요, carryover만 정교화 |
| Ch.7-10 Multi-Agent / Memory / Adaptation / MCP | `PROMPT_multi_agent_overlay`, `PROMPT_memory_adaptation_overlay`, `PROMPT_tool_protocol_overlay` | 강함 | A2A/MCP artifact shape 보강 |
| Ch.11-13 Goal / Monitoring / Recovery / HITL | `PROMPT_full`, `PROMPT_guideline`, `PROMPT_standalone`, `AGENTS.md` | 중간 이상 | runtime artifact와 approval packet 보강 |
| Ch.14-15 RAG / A2A | `PROMPT_retrieval_grounding_overlay`, `PROMPT_multi_agent_overlay` | 강함 | guide/example 연계 보강 |
| Ch.16 Resource-Aware Optimization | `PROMPT_guideline`, `PROMPT_full`, `PROMPT_standalone` | 분산됨 | 최우선 보강 대상 |
| Ch.17 Reasoning Techniques | `PROMPT_search_reasoning_overlay`, base carryover | 강함 | frontier/stop/budget artifact 명시 강화 |
| Ch.18-19 Guardrails / Evaluation | `PROMPT_guardrails_safety_overlay`, `PROMPT_evaluation_monitoring_overlay` | 강함 | route/budget/discovery 관점의 지표 추가 |
| Ch.20-21 Prioritization / Exploration & Discovery | `PROMPT_search_reasoning_overlay` 중심 | owner는 강함, runtime는 약함 | `AGENTS.md`, `coding-core`, examples로 carryover 필요 |

판정상 가장 중요한 보강 축은 아래 네 가지다.

- `Codex runtime carryover 강화`
- `resource/prioritization/discovery 실행성 강화`
- `artifact shape 확장`
- `guide/traceability 개선`

---

## 4. 보강 원칙

1. 새 문서를 늘리기보다 기존 owner 문서를 우선 보강한다.
2. `99_original/*`는 절대 수정하지 않는다.
3. `PROMPT_guideline`의 ownership map을 깨지 않는다.
4. 실행 문서 보강은 `정책 복제`가 아니라 `압축 carryover`여야 한다.
5. example layer는 policy owner가 아니라 artifact shape provider로만 확장한다.
6. Codex 환경에서는 `AGENTS.md + base carryover + needed overlay + selected skill` 조합이 실제 체감 스택이므로 이 조합을 기준으로 보강 우선순위를 잡는다.

---

## 5. 우선순위별 보강 계획

### P0. Codex 실행 압축 계층 보강

대상:

- `AGENTS.md`
- `codex/skills/coding-core/SKILL.md`
- `PROMPT_USER_GUIDE.md`
- `01_base/PROMPT_standalone.md`

보강 내용:

- `AGENTS.md`
  - `routing/chaining activation rule`를 압축된 형태로 명시
  - `prioritization` 기준과 `dynamic reprioritization` 규칙 추가
  - `resource-aware optimization`을 별도 절로 추가
  - `exploration frontier / stop condition / local maximum risk`를 짧게 carryover
- `coding-core/SKILL.md`
  - ambiguous debugging, multi-file patch, partial-fix situations에서의 우선순위 결정 규칙 추가
  - `budget-aware narrow discovery`, `cheap reversible test first`, `graceful degradation` 규칙 추가
  - `known workflow vs discovery workflow` 분기 시 routing 기준을 더 명확히 함
- `PROMPT_standalone.md`
  - 이미 있는 `Resource Budgeting`, `Search and Exploration Rule`를 유지하되
  - `dynamic re-prioritization`, `critical-task first`, `resource-driven route choice`를 더 명시
- `PROMPT_USER_GUIDE.md`
  - coding agent bundle에 `search_reasoning_overlay`를 “debugging / discovery-heavy / large-repo search” 상황의 optional add-on으로 명시
  - `evaluation_monitoring_overlay`를 release/review path의 optional add-on으로 명시
  - pattern-to-file quick lookup 표를 추가

이 단계의 목적:

- 실제 Codex 사용 시 빠지는 패턴 압축 손실을 줄인다.
- PDF의 Ch.16, Ch.20, Ch.21 내용을 런타임 기본동작으로 끌어내린다.

### P1. owner 문서와 실행 문서의 연결 보강

대상:

- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`

보강 내용:

- `PROMPT_guideline.md`
  - `Pattern-to-owner summary` 아래에 `runtime carryover obligations` 성격의 짧은 보조 규칙 추가
  - 특히 `Parallelization`, `Exception Handling and Recovery`, `Resource-Aware Optimization`은 governance 소유이더라도 어떤 실행 문서에 최소 무엇이 살아 있어야 하는지 명시
- `PROMPT_full.md`
  - Resource section에 PDF 기반 요소를 추가:
    - `router agent / route by complexity and budget`
    - `critique feedback into routing`
    - `contextual pruning and summarization`
    - `cost-sensitive exploration`
    - `prioritization of critical tasks`
    - `graceful degradation / fallback`
- `PROMPT_search_reasoning_overlay.md`
  - `priority queue`, `re-prioritization trigger`, `frontier update`, `stop condition`을 artifact-friendly 하게 정리
  - exploration이 open-ended verbosity로 흐르지 않도록 `frontier + budget + stop` 삼각 규칙을 더 전면화
- `PROMPT_evaluation_monitoring_overlay.md`
  - `route quality`
  - `priority quality`
  - `budget adherence`
  - `exploration efficiency`
  - `fallback quality`
  를 평가 대상으로 추가하거나 더 선명하게 노출

이 단계의 목적:

- owner map은 유지하면서 실제 실행성도 높인다.
- PDF의 패턴 간 연결관계를 `governance -> runtime` 흐름으로 재정렬한다.

### P2. example layer의 후반부 패턴 확장

대상:

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

추가 후보 artifact:

1. `Goal-monitoring status memo`
2. `Recovery / escalation checkpoint memo`
3. `Resource budget and route-choice memo`
4. `Prioritization queue / next-action memo`
5. `Exploration frontier / hypothesis memo`
6. `HITL approval packet`
7. `MCP capability handoff memo`
8. `A2A task-handoff memo`

보강 내용:

- `PROMPT_example_catalog.md`
  - 위 artifact들을 기존 five-section geometry에 맞게 추가
  - 각 artifact의 `generalization_boundary`를 명시해 policy ownership 침범 방지
- `PROMPT_example_injection.md`
  - 위 artifact family를 언제 고르고 언제 거절하는지 activation rule 추가
  - `goal/recovery/resource/prioritization/discovery` artifact가 example layer에서 허용되는 범위를 명시

이 단계의 목적:

- PDF 후반부 패턴들이 실제 산출물 형식으로 재사용되게 한다.
- 현재 example layer가 앞단 패턴 중심으로 치우친 문제를 줄인다.

### P3. skill 계층 정합화

대상:

- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`

보강 내용:

- `design-analysis`
  - `priority and route comparison under resource budget`
  - `exploration frontier pruning`
  - `fallback recommendation under cost/risk pressure`
- `grounded-research`
  - `discovery-heavy retrieval`에서 frontier와 stop condition을 더 명시
  - freshness/authority 외에 `expected information gain` 우선순위 축 추가
- `eval-ops`
  - route selection quality, budget adherence, fallback quality, exploration efficiency 지표 추가

이 단계의 목적:

- runtime skill들이 새 carryover와 어긋나지 않게 한다.

---

## 6. 파일별 수정 우선순위

| 우선순위 | 파일 | 수정 초점 |
| --- | --- | --- |
| P0 | `AGENTS.md` | routing/prioritization/resource/discovery carryover |
| P0 | `codex/skills/coding-core/SKILL.md` | ambiguous coding task prioritization and budget-aware execution |
| P0 | `01_base/PROMPT_standalone.md` | resource-driven route choice, reprioritization |
| P0 | `PROMPT_USER_GUIDE.md` | pattern lookup, coding-bundle optional overlays |
| P1 | `00_governance/PROMPT_guideline.md` | runtime carryover obligations |
| P1 | `01_base/PROMPT_full.md` | richer resource-aware optimization doctrine |
| P1 | `02_overlays/PROMPT_search_reasoning_overlay.md` | priority/frontier/stop artifact sharpening |
| P1 | `02_overlays/PROMPT_evaluation_monitoring_overlay.md` | route/budget/discovery metrics |
| P2 | `03_examples/PROMPT_example_catalog.md` | missing artifact families 추가 |
| P2 | `03_examples/PROMPT_example_injection.md` | new artifact selection rules |
| P3 | `codex/skills/design-analysis/SKILL.md` | budgeted comparison and frontier pruning |
| P3 | `codex/skills/grounded-research/SKILL.md` | discovery-heavy retrieval carryover |
| P3 | `codex/skills/eval-ops/SKILL.md` | new pattern-aligned evaluation axes |

---

## 7. 구현 순서

권장 순서:

1. `AGENTS.md`
2. `PROMPT_standalone.md`
3. `coding-core/SKILL.md`
4. `PROMPT_USER_GUIDE.md`
5. `PROMPT_guideline.md`
6. `PROMPT_full.md`
7. `PROMPT_search_reasoning_overlay.md`
8. `PROMPT_evaluation_monitoring_overlay.md`
9. `PROMPT_example_catalog.md`
10. `PROMPT_example_injection.md`
11. 나머지 skill 정합화

이 순서를 권장하는 이유:

- 먼저 Codex runtime 체감 경로를 고친 뒤
- 그 다음 owner/runtime 정합성을 맞추고
- 마지막에 example/skill 확장으로 들어가는 편이 drift가 적다.

---

## 8. 검증 계획

구현 후 검증 항목:

1. `99_original/*`가 변경되지 않았는지 확인
2. active prompt 본문에 버전 문자열이 새로 들어가지 않았는지 확인
3. `PROMPT_guideline`의 pattern-to-owner summary와 실제 문서 내용이 충돌하지 않는지 확인
4. `AGENTS.md`가 `resource/prioritization/discovery` carryover를 실제로 가지는지 확인
5. `coding-core`가 ambiguous coding task에서 narrow discovery와 reprioritization을 지시하는지 확인
6. example layer의 신규 artifact가 policy owner처럼 행동하지 않는지 확인
7. `PROMPT_USER_GUIDE.md`가 Codex bundle 선택 규칙을 더 명확히 설명하는지 확인

추천 점검 방식:

- `rg`로 버전 문자열 점검
- `rg`로 신규 패턴 키워드 존재 여부 점검
- owner map과 target file를 수동 교차검토
- 결과는 향후 `v18_Augmentation_Result.md`에 기록

---

## 9. 완료 기준

아래가 충족되면 보강 완료로 본다.

- Codex 기본 실행 경로에서 `routing`, `prioritization`, `resource-aware optimization`, `exploration`이 더 이상 약한 암묵 규칙이 아니다.
- governance 소유 패턴과 runtime carryover의 연결이 명시적이다.
- example layer가 후반부 agentic pattern에도 대응하는 artifact shape를 가진다.
- guide가 pattern lookup과 bundle 선택을 더 빠르게 지원한다.
- 프롬프트 본문에는 버전 표기가 추가되지 않는다.
- `99_original/*`는 보존된다.

---

## 10. 메모

이번 보강은 `새 문서를 많이 추가하는 작업`보다 `실행 압축 계층의 누락을 줄이고, 후반부 패턴을 artifact와 runtime로 끌어내리는 작업`에 가깝다.

즉, 핵심은 다음이다.

- 문서 수 확대보다 `carryover 정밀화`
- 정책 복제보다 `owner-preserving reinforcement`
- 장식적 확장보다 `runtime utility 증가`
