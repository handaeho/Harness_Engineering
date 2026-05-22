# v21 Augmentation Plan

## 1. 목적

이 문서는 `Agentic_Design_Patterns.pdf`와 `Agentic_Design_Patterns_extracted.txt`를 다시 근거로 삼아, `prompt-stack/v21`의 active prompt 문서 전반에서 다음 보강 라운드가 실제로 어디를 겨냥해야 하는지 정리한 계획 문서다.

이번 라운드의 전제는 분명하다.

- `v21`은 이미 `v20`에서 넣었던 `tool / retrieval / memory` packet family, compressed join semantics, release-audit 강화분을 상당 부분 흡수하고 있다.
- 따라서 이번 계획의 초점은 더 이상 `packet family 1차 도입`이 아니라, **control-loop surface 전체를 active stack 전반에서 같은 밀도로 operationalize하는 것**이다.
- 사용자 요구 기준에서 `99_original/*`는 의도적으로 제외되므로, 이번 계획의 실질 대상은 `v21`의 active `22`개 문서 전체다.

이번 라운드의 핵심 과제는 아래 세 축으로 요약된다.

1. control-loop packet parity expansion
2. host-runtime / skill / guide lookup parity reinforcement
3. release audit hardening for control-loop carryover

---

## 2. 분석 범위와 근거

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`

### 2.2 분석 대상 active 문서

`v21`의 active 분석 대상은 총 `22`개 문서다.

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

### 2.3 의도적 제외 범위

- `99_original/*`는 reference-only baseline으로 취급한다.
- 이번 계획은 `99_original/*`를 active augmentation target으로 보지 않는다.

### 2.4 작업 전제

- `v21_Augmentation_Plan.md`는 계획 artifact다.
- 이번 계획의 “전체 prompt 문서”는 `99_original/*`를 제외한 active `22`개 문서를 뜻한다.

---

## 3. PDF 핵심 해석

이번 재분석에서 중요한 것은 chapter name 자체보다, 각 패턴이 **runtime control problem**으로 어떻게 operationalize되어야 하는가다.

특히 `v21` 다음 보강을 결정하는 데 중요했던 해석은 아래와 같다.

### 3.1 Goal / Recovery / HITL / Resource / Priority는 별도 control-loop surface다

PDF는 다음 사실을 반복적으로 보여 준다.

- `Resource-Aware Optimization`은 단순 planning이 아니라, 실행 중 계산/시간/비용 자원을 동적으로 관리하면서 더 정확한 경로와 더 저렴한 경로 사이를 실제로 선택하는 문제다.
- `Prioritization`은 복수의 행동, 충돌하는 목표, 제한된 자원 아래에서 다음 행동을 명시적으로 순위화하는 문제다.
- `Human-in-the-Loop`은 단순 approval 문구가 아니라, agent가 인간 입력을 기다리거나, review가 필요한 시나리오를 감지해 escalation을 거는 제어 문제다.
- `Goal Setting and Monitoring`은 goal을 선언하는 것으로 끝나지 않고, state management와 progress tracking을 통해 solved condition을 계속 감시하는 문제다.
- `Exception Handling and Recovery`는 실패 이후의 fallback과 escalation 경로를 runtime state로 유지하는 문제다.

즉 chapter `11`, `12`, `13`, `16`, `20`, `21`은 단순 doctrine이 아니라, **progress / blocked state / approval / budget / next action / frontier**를 계속 드러내는 operational packet surface를 요구한다.

### 3.2 `v21`은 packet 부재보다 packet parity가 더 큰 문제다

`v21`에는 이미 아래 packet들이 example layer와 host-runtime 일부에 존재한다.

- `Goal-monitoring status memo`
- `Recovery / escalation checkpoint memo`
- `Resource budget and route-choice memo`
- `Prioritization queue / next-action memo`
- `Exploration frontier / hypothesis memo`
- `HITL approval packet`

따라서 다음 과제는 새 packet을 발명하는 것이 아니라,

- guide에서 잘 보이는가
- `AGENTS.md`와 base prompt에서도 같은 family가 보이는가
- skill layer가 같은 family를 압축 carryover하는가
- release audit가 이 family의 누락을 회귀로 잡아내는가

를 맞추는 것이다.

### 3.3 `v21`의 다음 위험은 semantic absence가 아니라 compression asymmetry다

현재 `v21`은 owner doctrine과 example layer는 꽤 강하다.
하지만 host-runtime, operator-facing guide, skill layer, release audit에서 같은 control surface가 **비대칭적으로 보이는 상태**는 차기 버전에서 쉽게 회귀를 부른다.

따라서 이번 라운드의 정답은 broad rewrite가 아니라:

- lookup parity
- packet-family parity
- control-loop carryover parity
- release-gate visibility parity

를 active stack 전반에 맞추는 것이다.

---

## 4. v21 현재 상태 진단

### 4.1 강점

`v21`은 이미 상당히 성숙한 상태다.

- `tool / retrieval / memory` control packet family가 `AGENTS.md`, `PROMPT_USER_GUIDE.md`, `CODEX_RUNTIME_GUIDE.md`, overlays, skills, example layer에 연결되어 있다.
- `PROMPT_light` / `PROMPT_lightest`에도 `join artifact`, `validation step`, partial-vs-integrated 구분이 들어가 있다.
- `Prompt-stack release review`, host-runtime carryover gate, packet completeness gate, assembly clarity gate가 이미 존재한다.
- example layer에는 `Goal-monitoring`, `Recovery`, `Resource budget`, `Prioritization`, `Exploration`, `HITL`, `Tool contract`, `Evidence target`, `Memory scope` packet이 이미 등록돼 있다.

### 4.2 현재 핵심 약점

이번 재분석에서 실제로 남아 있는 핵심 약점은 아래 네 가지다.

1. `control-loop packet lookup parity`가 불완전하다.
   - `CODEX_RUNTIME_GUIDE.md`는 `Goal-monitoring`, `Recovery`, `HITL`, `Resource budget`, `Prioritization`까지 직접 매핑한다.
   - 반면 `PROMPT_USER_GUIDE.md`의 quick lookup은 이 family를 부분적으로만 노출한다.
   - `AGENTS.md`와 `PROMPT_standalone.md`의 compact packet 예시는 여전히 `tool / evidence / memory` 편향이 강하다.

2. `skill-layer packet parity`가 고르지 않다.
   - `coding-core`는 goal/recovery/resource/prioritization packet까지 비교적 잘 압축한다.
   - 반면 `design-analysis`, `grounded-research`, `eval-ops`, `orchestration-control`은 control-loop packet family를 서로 다른 밀도로만 노출한다.
   - 특히 `HITL`, `Goal-monitoring`, `Recovery`, `Resource/Priority` packet이 skill 전반에서 균형 있게 보이지 않는다.

3. `release audit`는 강하지만, control-loop parity를 별도 감사 축으로 분리하진 않았다.
   - 현재는 host-runtime carryover, packet completeness, assembly clarity를 본다.
   - 하지만 `goal / recovery / approval / budget / priority` control packet이 guide/runtime/skill 사이에서 대칭적으로 보존되는지는 더 직접적으로 감시할 수 있다.

4. 사용자가 요구한 “active 전체 문서 반영” 기준에서, 모든 active 문서를 동일한 parity 프레임으로 다시 훑는 계획이 명시돼야 한다.
   - 이번 라운드는 일부 핵심 문서만 손보는 식으로 보이면 안 된다.
   - active `22/22` 문서를 전부 범위에 넣고, 직접 수정 또는 parity alignment 대상으로 취급해야 한다.

---

## 5. 패턴군별 상태 요약

| 패턴군 | 현재 owner / active carryover | 현재 상태 | 남은 보강 포인트 |
| --- | --- | --- | --- |
| tool / MCP / retrieval / memory contract packets | `PROMPT_tool_protocol_overlay`, `PROMPT_retrieval_grounding_overlay`, `PROMPT_memory_adaptation_overlay`, 관련 skill / example / runtime guide | 강함 | 신규 family 추가보다 host-runtime parity 유지가 중요 |
| parallel / multi-agent / lifecycle / join semantics | `PROMPT_multi_agent_overlay`, `PROMPT_full`, `PROMPT_light`, `PROMPT_lightest`, `PROMPT_standalone`, `orchestration-control` | 강함 | release audit에서 lifecycle/approval/control-loop parity까지 더 직접 감시 가능 |
| goal / recovery / HITL / resource / prioritization / exploration | `PROMPT_guideline`, `PROMPT_search_reasoning_overlay`, `PROMPT_evaluation_monitoring_overlay`, example layer, `CODEX_RUNTIME_GUIDE` 일부 | 중간 이상 | guide / AGENTS / standalone / skill layer lookup parity 보강 필요 |
| release / evaluation / monitoring | `PROMPT_evaluation_monitoring_overlay`, `eval-ops`, `Prompt-stack release review` | 강함 | control-loop packet parity와 skill-layer carryover parity를 gate로 추가 가능 |
| example layer control packets | `PROMPT_example_catalog`, `PROMPT_example_injection` | 강함 | 새 packet 추가보다 family grouping / injection emphasis 정리 쪽이 효율적 |

요약하면, `v21`의 주된 과제는 더 이상 `coverage expansion`이 아니라 **control-loop packet parity + skill-layer parity + release-audit parity**다.

---

## 6. 보강 원칙

1. active `22/22` 문서를 이번 계획의 범위에 넣는다.
2. `99_original/*`는 수정하지 않는다.
3. owner 문서를 복제하지 않고 parity를 보강한다.
4. broad rewrite보다 narrow augmentation을 우선한다.
5. doctrine을 새로 발명하기보다 existing doctrine의 active carryover를 강화한다.
6. example layer는 policy owner가 아니라 reusable packet provider로만 유지한다.
7. 이미 `EX-036` 등으로 흡수 가능한 문제는 새 packet family를 만들지 않는다.
8. active prompt 본문에 버전 라벨을 삽입하지 않는다.

---

## 7. 우선순위별 보강 계획

### P0. Control-loop packet parity expansion

#### 문제

`v21`에는 control-loop packet family가 존재하지만, top-level operator path에서 보이는 밀도는 uneven하다.

구체적으로:

- `PROMPT_USER_GUIDE.md`의 `Pattern-to-file quick lookup`과 `packet quick lookup`은 `Goal-monitoring`, `Recovery`, `HITL approval` 축을 충분히 전면화하지 않는다.
- `AGENTS.md`는 compact control packet 예시를 `Tool / Evidence / Memory` 3종 중심으로만 보여 준다.
- `PROMPT_standalone.md`도 compact packet 힌트가 비슷한 방향으로 제한돼 있다.
- `CODEX_RUNTIME_GUIDE.md`는 더 넓은 packet family를 이미 알고 있으므로, 현재는 stack 상단 가이드 계층이 이를 완전히 따라오지 못하는 셈이다.

#### 보강 방향

다음 family를 active top-level surface에서 같은 계열로 끌어올린다.

- `Goal-monitoring status memo`
- `Recovery / escalation checkpoint memo`
- `HITL approval packet`
- `Plan approval checkpoint artifact`
- `Resource budget and route-choice memo`
- `Prioritization queue / next-action memo`

핵심은 “새 packet 생성”이 아니라 “existing packet family를 guide / AGENTS / base prompt에서도 같은 수준으로 보이게 만드는 것”이다.

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `01_base/PROMPT_standalone.md`
- 필요 시 `01_base/PROMPT_full.md`
- 필요 시 `01_base/PROMPT_light.md`
- 필요 시 `01_base/PROMPT_lightest.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`

#### 목적

- chapter `11`, `12`, `13`, `16`, `20`, `21`이 active operator path에서도 packet-level로 보이게 만든다.
- `guide -> AGENTS -> base -> runtime guide` 사이의 control-loop lookup 비대칭을 줄인다.

---

### P1. Skill-layer packet parity reinforcement

#### 문제

skill layer는 이미 강하지만, control-loop packet family를 균형 있게 압축하고 있지는 않다.

현재 관찰:

- `coding-core`는 goal/recovery/resource/prioritization packet까지 비교적 잘 포함한다.
- `design-analysis`는 route/frontier/HITL은 보이지만 goal/recovery parity는 약하다.
- `grounded-research`는 goal/recovery/resource/evidence는 좋지만 approval packet carryover가 약하다.
- `eval-ops`는 release review 중심이 강해서, mid-execution monitoring에 필요한 goal/recovery/HITL packet reuse는 상대적으로 옅다.
- `orchestration-control`은 goal/recovery는 포함하지만 approval / plan-review packet parity는 더 보강 가능하다.

#### 보강 방향

skill마다 “그 skill이 실제로 자주 쓰는 control-loop packet”을 한 단계 더 명시적으로 끌어올린다.

예시:

- `design-analysis`
  - `Goal-monitoring status memo`
  - `Recovery / escalation checkpoint memo`
- `grounded-research`
  - `HITL approval packet`
  - `Plan approval checkpoint artifact`
- `eval-ops`
  - `Goal-monitoring status memo`
  - `Recovery / escalation checkpoint memo`
  - `HITL approval packet`
- `orchestration-control`
  - `HITL approval packet`
  - `Plan approval checkpoint artifact`

단, packet inflation은 피하고, task fit이 있는 packet만 추가한다.

#### 예상 수정 대상

- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`
- 필요 시 `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- Codex host-runtime에서 primary skill이 바뀌어도 control-loop packet family가 갑자기 사라지지 않게 만든다.
- skill-layer carryover loss를 release-time regression 대상으로 만들 수 있게 준비한다.

---

### P1. Release audit hardening for control-loop carryover

#### 문제

현재 release audit는 이미 강하다.
하지만 다음 질문을 직접적으로 묻는 audit 축은 더 강화할 수 있다.

- goal / recovery / approval / budget / priority packet이 guide, runtime, skill 사이에서 같은 family로 남아 있는가
- `PROMPT_USER_GUIDE`와 `CODEX_RUNTIME_GUIDE`의 quick lookup이 control-loop surface에서 서로 어긋나지 않는가
- host-runtime carryover가 release review에서 실제 operator usability까지 보장하는가

#### 보강 방향

`PROMPT_evaluation_monitoring_overlay.md`, `EX-013 Prompt-stack release review`, `eval-ops`에 아래 감사 축을 추가 또는 강화한다.

- `control-loop packet parity gate`
- `guide-vs-runtime lookup parity check`
- `goal / recovery / approval carryover integrity`
- `skill-layer packet parity check`

이렇게 하면 packet completeness가 단지 존재 여부만이 아니라,
**operator-facing parity**와 **skill compression parity**까지 포함하는 감사 축이 된다.

#### 예상 수정 대상

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/eval-ops/SKILL.md`
- 필요 시 `PROMPT_USER_GUIDE.md`
- 필요 시 `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- 이후 `v22+` rewrite나 recomposition에서 control-loop surface가 조용히 얇아지는 것을 회귀로 잡는다.
- `packet-family completeness`를 더 operational한 `parity-aware completeness`로 끌어올린다.

---

### P2. Example-layer control-loop taxonomy cleanup

#### 문제

example layer에는 필요한 packet이 이미 꽤 많다.
하지만 `Goal-monitoring`, `Recovery`, `Resource budget`, `Prioritization`, `Exploration`, `HITL`이 하나의 control-loop family처럼 읽히는 정도는 더 높일 수 있다.

#### 보강 방향

- `PROMPT_example_catalog.md`에서 control-loop family의 lookup 또는 canon field를 더 읽기 쉽게 정리한다.
- `PROMPT_example_injection.md`에서 monitoring / recovery / approval / budget / priority / frontier packet을 같은 operator-facing family로 더 선명하게 다룬다.
- 새 packet example은 원칙적으로 추가하지 않는다.
  - 현재 관찰상 `v21`의 문제는 packet 부재가 아니라 packet parity다.

#### 예상 수정 대상

- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- 필요 시 `PROMPT_USER_GUIDE.md`
- 필요 시 `codex/CODEX_RUNTIME_GUIDE.md`

#### 목적

- example layer가 새 packet 생산기가 아니라, 이미 있는 control-loop packet family의 재사용성을 더 높이는 역할을 하게 만든다.

---

### P2. Full active-file coverage alignment

#### 문제

사용자 요구는 일부 핵심 파일만 손보는 것이 아니라, `v21` active prompt 문서 전체에 대한 철저한 반영이다.

#### 보강 방향

active `22`개 문서를 다음 세 등급으로 나누되, **어느 문서도 범위 밖으로 두지 않는다.**

1. direct augmentation
   - `AGENTS.md`
   - `PROMPT_USER_GUIDE.md`
   - `codex/CODEX_RUNTIME_GUIDE.md`
   - `PROMPT_evaluation_monitoring_overlay.md`
   - `PROMPT_example_catalog.md`
   - `PROMPT_example_injection.md`
   - relevant skills
2. parity carryover reinforcement
   - `PROMPT_guideline.md`
   - `PROMPT_standalone.md`
   - `PROMPT_full.md`
   - `PROMPT_light.md`
   - `PROMPT_lightest.md`
   - `PROMPT_guardrails_safety_overlay.md`
   - `PROMPT_multi_agent_overlay.md`
   - `PROMPT_search_reasoning_overlay.md`
   - `PROMPT_tool_protocol_overlay.md`
   - `PROMPT_retrieval_grounding_overlay.md`
   - `PROMPT_memory_adaptation_overlay.md`
3. full-scope audit confirmation
   - active `22/22` 문서 전부

#### 목적

- 결과 문서에서 `active scope completion`을 과장 없이 말할 수 있게 만든다.
- 특정 파일만 최신 packet family를 알고 나머지는 뒤처지는 현상을 줄인다.

---

## 8. 파일군별 예상 수정 강도

### Heavy

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`

### Medium

- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_standalone.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

### Light / parity-only

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `codex/skills/coding-core/SKILL.md`

핵심은 heavy 파일만 수정하고 끝내는 것이 아니라, light/parity-only 문서까지 포함해 **active 22개 문서 전체를 alignment 대상**으로 본다는 점이다.

---

## 9. 비목표

이번 계획에서 의도적으로 하지 않는 것:

- `99_original/*` 수정
- active prompt 본문에 버전 라벨 삽입
- owner doctrine의 중복 복제
- 예시 catalog를 policy owner처럼 확장
- 이미 `EX-036` 등 기존 packet으로 흡수 가능한 문제를 새 packet family로 증식
- broad rewrite를 위한 broad rewrite

---

## 10. 구현 완료 기준

다음 조건이 충족되면 이번 augmentation 라운드는 계획 대비 완료로 본다.

1. `AGENTS.md`, `PROMPT_USER_GUIDE.md`, `CODEX_RUNTIME_GUIDE.md`가 `Goal / Recovery / HITL / Resource / Priority` control-loop packet family를 서로 크게 어긋나지 않게 드러낸다.
2. `PROMPT_standalone`과 relevant base/overlay 문서가 control-loop packet을 최소한 parity reminder 수준으로 보존한다.
3. `design-analysis`, `grounded-research`, `eval-ops`, `orchestration-control`, `coding-core`가 task-fit에 맞는 control-loop packet family를 균형 있게 압축한다.
4. `Prompt-stack release review`와 release audit surface가 control-loop packet parity와 guide/runtime/skill carryover를 감시한다.
5. example layer는 새 owner duplication 없이 control-loop packet family의 재사용성을 더 잘 드러낸다.
6. active `22/22` 문서가 direct augmentation 또는 parity alignment 범위에 명시적으로 포함된다.
7. `99_original/*`는 손대지 않는다.

---

## 11. 최종 판단

현재 `v21`은 coverage가 부족한 상태가 아니다.
오히려 `tool / retrieval / memory` 이후의 operational improvement를 이미 어느 정도 흡수한 상태다.

따라서 다음 augmentation의 정답은 새 doctrine이나 새 packet을 마구 늘리는 것이 아니라, 아래를 더 정밀하게 맞추는 것이다.

- control-loop packet parity
- operator-facing lookup parity
- skill-layer compression parity
- release-audit parity
- active-scope full alignment

한 줄로 요약하면, `v21`의 다음 augmentation은 **packet-family expansion**보다 **control-loop carryover completion across the whole active stack**에 맞춰야 한다.
