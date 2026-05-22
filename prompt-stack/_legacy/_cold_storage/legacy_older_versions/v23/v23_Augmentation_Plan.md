# v23 Augmentation Plan

## 1. 목적

`Agentic_Design_Patterns.pdf`와 로컬 추출본,

- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`

그리고 이전 라운드 분석 결과인

- `prompt-stack/v23/v22_Augmentation_Results.md`

를 근거로, `prompt-stack/v23` active prompt 문서 전체를 다시 점검하고 다음 보강 라운드의 초점을 정리한다.

이번 계획의 전제는 분명하다.

- `v23`는 이미 `v22` 라운드에서 도입한 `Operational substrate readiness memo`, `Lifecycle event / audit trail memo`, topology taxonomy 확장, resource-aware switching parity, release-audit gate 확장을 상당 부분 흡수한 상태다.
- 따라서 이번 라운드의 초점은 `v22` 축의 재반복이 아니라, PDF 원문이 추가로 강조하는 `코딩 에이전트 브리핑 품질`, `딥리서치 투명성`, `자원-병렬성 결합 제어`, `human quality gate`를 `owner -> base -> overlay -> guide -> Codex runtime -> skill -> example -> release audit` 전 경로에 더 operational하게 연결하는 것이다.
- `99_original/*`는 이번에도 augmentation target이 아니다.

이번 라운드의 중심 과제는 아래 네 축으로 요약된다.

1. coding-agent briefing and human quality-gate hardening
2. deep-research transparency and source-ledger carryover
3. resource-aware concurrency and route-feedback reinforcement
4. release-audit gate extension for the new control surfaces

---

## 2. 분석 범위와 근거

### 2.1 근거 문서

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack/v23/v22_Augmentation_Results.md`

`Assumption`:
- 로컬 추출본은 첨부 PDF의 분석 가능한 텍스트 표현으로 간주한다.

### 2.2 분석 대상 active 문서

이번 계획의 범위는 `v23` active 문서 총 `22`개다.

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

- `99_original/*`
- broad rewrite를 위한 broad rewrite
- owner doctrine의 중복 복사
- raw hidden chain-of-thought 또는 raw query trace dump를 허용하는 방향의 보강

---

## 3. PDF 재분석 핵심 해석

이번 재분석의 핵심은 기존 `v22`가 이미 잡아낸 Chapter 15/16/18/19 축을 확인하는 데서 멈추지 않고, PDF 전체가 실제로 어떤 운영 제어면을 요구하는지 다시 묶는 것이다.

### 3.1 Foreword / Thought Leader 서문은 여전히 substrate + supervision 압력을 유지한다

서문과 Thought Leader 파트는 다음 메시지를 반복한다.

- autonomy는 substrate quality 위에서만 안전하다
- messy systems 위에 agent를 얹으면 plausible garbage가 증폭된다
- clear problem framing, supervision, verification, accountability가 필수다

이 축은 `v22` 라운드에서 readiness / auditability 쪽으로 상당 부분 흡수됐고, `v23`에도 carryover돼 있다.

즉 이번 라운드는 이 축을 새로 만드는 문제가 아니라, 뒤쪽 장과 부록이 이 substrate 철학을 어떤 operator-facing artifact로 확장하는지 보강하는 문제다.

### 3.2 Appendix G는 coding-agent 운영을 별도 discipline으로 밀어 올린다

Appendix G는 일반론을 넘어 coding-agent 협업을 다음 원칙으로 정리한다.

- human-led orchestration
- primacy of context
- complete briefing package
- direct model access
- ultimate quality gate
- iterative dialogue

특히 아래 문장이 중요하다.

- developer is the team lead, architect, and final decision-maker
- automated black-box context retrieval is avoided
- complete codebase / external knowledge / human brief를 명시적으로 curate해야 한다
- agent output is always a proposal, never a command

현재 `v23`는 coding discipline과 active-slice discipline은 강하지만, 이 Appendix G의 coding-team semantics가 `AGENTS -> CODEX runtime -> coding-core -> example packet`까지 명시적 packet/lookup parity로 연결돼 있지는 않다.

### 3.3 Chapter 6 Deep Research 사례는 citation만이 아니라 transparency를 요구한다

Planning chapter의 Deep Research 사례와 OpenAI Deep Research API 예시는 다음을 함께 강조한다.

- multi-point research plan
- user review and modification before execution
- iterative gap-driven search
- inline citations
- full list of searched / consulted sources
- inspectable intermediate steps such as search calls and code execution
- public-web + private-source blending via MCP

현재 `v23`의 retrieval stack은 `Evidence Target`, citation-grounded synthesis, deep research mode, plan approval checkpoint를 이미 지원한다.
하지만 다음은 아직 약하다.

- consulted-source inventory를 별도 artifact로 남기는 규율
- search/query lineage를 compact하게 요약하는 규율
- public/private source blend 상태를 inspectable하게 남기는 규율
- citation은 있으나 source-consultation transparency는 약한 상태

즉 `grounding`은 강하지만 `research transparency surface`는 아직 덜 구조화돼 있다.

### 3.4 Chapter 16은 resource-aware를 route switching보다 더 넓게 본다

기존 `v22` 분석은 Chapter 16을 `runtime route switching discipline`으로 잘 흡수했다.
이번 재분석에서 더 남는 메시지는 다음이다.

- adaptive task allocation
- adaptive tool use and selection
- critique-agent feedback into routing logic
- proactive resource prediction
- cost-sensitive exploration
- parallelization & distributed computing awareness
- graceful degradation and fallback

현재 `v23`는 cheaper fallback / stronger-route trigger / contextual pruning / cost-sensitive exploration은 반영돼 있다.
그러나 다음은 상대적으로 약하다.

- parallel branch count와 join cost를 resource doctrine과 직접 연결하는 규율
- concurrency saturation risk를 packet-level로 남기는 규율
- critique feedback이 routing/resource policy를 조정하는 경로를 더 명시하는 규율

즉 resource-aware control이 `which route`에는 강하지만, `how much concurrency / join overhead / feedback-adjusted allocation`에는 아직 덜 operational하다.

### 3.5 Chapter 19와 Appendix G를 합치면 release gate도 달라져야 한다

Evaluation and Monitoring 파트는 outcome/process/trajectory를 보라고 하고, Appendix G는 coding-agent collaboration의 briefing quality와 human quality gate를 강조한다.

이 둘을 합치면 release-grade review는 최소 다음을 추가로 봐야 한다.

- coding briefing fidelity가 살아 있는가
- research transparency surface가 살아 있는가
- resource-aware concurrency control이 parity를 유지하는가
- human quality gate가 prose가 아니라 control surface로 남아 있는가

현재 `Prompt-stack release review`는 readiness / lifecycle / topology / resource-switching parity까지는 본다.
이번 라운드에서는 그 위에 새 네 축을 얹는 것이 맞다.

---

## 4. v23 현재 상태 진단

### 4.1 강점

`v23`는 이미 다음을 상당 수준 충족한다.

- `AGENTS.md`가 standalone-style constitution과 compact packet family를 유지한다.
- `PROMPT_guideline.md`와 base prompts가 search / retrieval / HITL / recovery / resource-aware doctrine을 폭넓게 갖고 있다.
- `PROMPT_multi_agent_overlay.md`는 `network`, `supervisor`, `supervisor-as-tool`, coordination substrate, polling / streaming / push를 이미 반영했다.
- `PROMPT_retrieval_grounding_overlay.md`와 `grounded-research` skill은 `Evidence Target`, deep research mode, citation-grounded synthesis를 이미 강하게 다룬다.
- `PROMPT_evaluation_monitoring_overlay.md`는 output / process / system surface, trajectory, regression, drift, release gate를 이미 갖고 있다.
- example layer에는 `Coding-agent invocation pack`, `Prompt-stack release review`, `Operational substrate readiness memo`, `Lifecycle event / audit trail memo`가 이미 존재한다.

### 4.2 남아 있는 약점

이번 라운드에서 실제로 남아 있는 약점은 아래 네 가지다.

1. coding-agent briefing discipline이 generic context doctrine에 묻혀 있다.
   - context engineering과 coding active-slice 규율은 있다.
   - 그러나 Appendix G가 요구하는 `complete briefing package`, `human brief`, `external knowledge inputs`, `quality gate owner`, `iterative dialogue`가 coding-layer packet과 guide lookup에 충분히 드러나지 않는다.

2. deep-research transparency가 citation 중심에 머문다.
   - `v23`는 citation-grounded synthesis와 evidence pack에는 강하다.
   - 하지만 `consulted source inventory`, `query lineage summary`, `public/private source blend`, `intermediate step transparency`를 operator-facing compact artifact로 남기는 규율은 약하다.

3. resource-aware control이 concurrency/join economics까지는 덜 내려왔다.
   - route switching, fallback, trigger, pruning은 있다.
   - 그러나 `parallelism cap`, `join cost`, `saturation risk`, `feedback-adjusted allocation`은 guide/runtime/example/skill 전반에서 약하다.

4. release review가 새 축을 별도 gate로 보지 않는다.
   - 현재 release review는 readiness / lifecycle / topology / resource switching을 본다.
   - 하지만 `coding_briefing_state`, `research_transparency_state`, `resource_concurrency_state`, `human_quality_gate_state`는 아직 없다.

---

## 5. 보강 원칙

1. `22/22` active 문서를 모두 범위에 포함한다.
2. `99_original/*`는 수정하지 않는다.
3. owner-preserving carryover를 유지하고 owner doctrine을 복제하지 않는다.
4. 가능하면 기존 packet을 확장하고, 실제로 빈 control problem에만 새 packet을 추가한다.
5. raw hidden reasoning 공개 대신 compact inspectable artifact를 선호한다.
6. guide / runtime / skill / example / release-review까지 lookup parity를 같이 맞춘다.
7. coding-agent 보강도 broad rewrite가 아니라 bounded execution discipline으로 압축한다.

---

## 6. 우선순위별 보강 계획

### P0. Coding-agent briefing and human quality-gate hardening

#### 문제

Appendix G는 coding-agent 협업을 단순 patch protocol이 아니라 명시적 briefing discipline으로 다룬다.

현재 `v23`에 이미 있는 것:

- `Context Pack`
- `Active Slice`
- `Coding-agent invocation pack`
- coding active-slice discipline
- review / approval / verification doctrine

하지만 아직 약한 것:

- complete briefing package 관점
- `external knowledge`와 `human brief`를 coding packet 안에서 별도 필드로 보이게 하는 것
- `agent output is a proposal, never a command`를 coding-human collaboration rule로 선명하게 두는 것
- reviewer/critic feedback를 iterative dialogue로 다루는 것
- human quality gate owner를 packet과 skill에서 lookup 가능하게 만드는 것

#### 보강 방향

새 packet을 과도하게 늘리기보다 아래를 우선한다.

- existing `Coding-agent invocation pack` 확장
- `coding-core` skill에 briefing-quality / human quality-gate / iterative-dialogue 규율 보강
- `AGENTS.md`와 `CODEX_RUNTIME_GUIDE.md`에 coding-agent orchestration lookup 보강
- 필요 시 `orchestration-control`과 `design-analysis`에도 coding-team boundary reminder 추가

확장 필드 후보:

- `briefing_scope`
- `external_knowledge_inputs`
- `human_brief_contract`
- `quality_gate_owner`
- `iteration_protocol`
- `model_access_boundary`

#### 예상 수정 대상

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`
- 필요 시 `codex/skills/design-analysis/SKILL.md`

#### 목적

- Appendix G의 coding-team semantics를 `v23` host runtime 전체에 carryover한다.
- coding-agent 협업에서 context quality와 human quality gate를 prose가 아닌 control surface로 만든다.

---

### P0. Deep-research transparency and source-ledger carryover

#### 문제

Chapter 6 Deep Research 사례와 OpenAI Deep Research API 예시는 다음을 동시에 보여준다.

- plan before execution
- inline citations
- consulted source transparency
- query/tool-step inspectability
- MCP를 통한 private/public source blend

현재 `v23`는 citation과 evidence-pack에는 강하지만, 다음은 약하다.

- 어떤 source set을 실제로 consulted했는지 요약하는 artifact
- 어떤 retrieval/query path가 최종 synthesis에 기여했는지 compact하게 남기는 artifact
- public source와 private source의 혼합 상태를 분리해 보는 artifact

#### 보강 방향

이번 축은 기존 `Evidence target / retrieval-mode memo`만으로는 부족하다.
pre-retrieval boundary와 post-research transparency가 다른 control problem이기 때문이다.

권장안:

- 새 packet `Source consultation ledger` 추가

이 packet은 raw reasoning trace가 아니라 아래만 남긴다.

- `research_goal`
- `plan_state`
- `consulted_source_groups`
- `public_private_source_mix`
- `query_lineage_summary`
- `citation_state`
- `excluded_or_downgraded_sources`

동시에 아래를 보강한다.

- `PROMPT_retrieval_grounding_overlay.md`
- `grounded-research` skill deep research mode
- guide/runtime lookup
- evaluation/release review에서 research transparency gate

#### 예상 수정 대상

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- 필요 시 `AGENTS.md`

#### 목적

- deep research의 transparency를 citation padding 수준이 아니라 inspectable operator artifact로 끌어올린다.
- evidence authority와 research process transparency를 분리해 유지한다.

---

### P1. Resource-aware concurrency and route-feedback reinforcement

#### 문제

기존 `v23`는 resource-aware switching에 강하다.
그러나 PDF Chapter 16이 요구하는 자원 제어는 route switching보다 더 넓다.

아직 약한 것:

- concurrency 자체를 비용 변수로 다루는 방식
- branch fan-out / join cost / saturation risk를 명시적으로 기록하는 방식
- critique/eval feedback가 routing/resource allocation에 반영되는 방식
- adaptive task allocation과 parallelization awareness를 같은 control surface에서 보는 방식

#### 보강 방향

새 packet을 추가하기보다 기존 packet을 확장하는 쪽이 맞다.

- existing `Resource budget and route-choice memo` 확장

확장 필드 후보:

- `concurrency_mode`
- `parallelism_cap`
- `join_cost_state`
- `saturation_risk`
- `feedback_adjustment_trigger`
- `graceful_degradation_mode`

동시에 아래 층에 resource-concurrency parity를 연결한다.

- base prompt
- `PROMPT_search_reasoning_overlay.md`
- `PROMPT_multi_agent_overlay.md`
- `PROMPT_evaluation_monitoring_overlay.md`
- `design-analysis`, `eval-ops`, `orchestration-control`

#### 예상 수정 대상

- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

#### 목적

- resource-aware doctrine을 route switching에서 concurrency economics까지 확장한다.
- coordination cost와 search cost를 같은 운영 제어면에서 다루게 만든다.

---

### P1. Release-audit gate extension

#### 문제

이번 라운드에서 보강할 새 control surface가 release review에 직접 gate되지 않으면, 다음 압축 또는 재조립에서 다시 조용히 빠질 수 있다.

현재 release review가 강한 것은 맞지만, 아래는 아직 별도 상태 필드가 없다.

- coding briefing fidelity
- research transparency
- resource-aware concurrency control
- human quality-gate carryover

#### 보강 방향

existing `Prompt-stack release review`를 확장한다.

추가 상태 필드 후보:

- `coding_briefing_state`
- `research_transparency_state`
- `resource_concurrency_state`
- `human_quality_gate_state`

함께 강화할 gate:

- coding-briefing carryover gate
- research-transparency gate
- resource-concurrency parity gate
- human-quality-gate carryover gate

#### 예상 수정 대상

- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/eval-ops/SKILL.md`

#### 목적

- 이번 augmentation이 일회성 prose 추가로 끝나지 않게 한다.
- 이후 `v24+` 개편에서도 regression detector로 작동하게 만든다.

---

## 7. 파일군별 예상 수정 강도

### Heavy

- `PROMPT_USER_GUIDE.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`

### Medium

- `AGENTS.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `codex/skills/orchestration-control/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`

### Light / parity-only

- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`

---

## 8. 비목표

이번 계획에서 의도적으로 하지 않는 것:

- `99_original/*` 수정
- 새 packet family를 불필요하게 증식시키는 일
- raw hidden reasoning, raw search transcript, raw polling trace를 표준 artifact로 승격하는 일
- owner 문서의 내용을 guide/skill/example에 중복 복사하는 일
- coding-agent 보강을 명분으로 broad repo rewrite doctrine을 강화하는 일
- “frontier model” 선호를 특정 벤더 고정 규칙으로 바꾸는 일

---

## 9. 구현 완료 기준

이번 라운드가 완료됐다고 보려면 최소 다음이 만족되어야 한다.

1. `Coding-agent invocation pack`이 briefing quality, human brief, quality gate owner, iterative dialogue를 담을 수 있게 확장된다.
2. `Source consultation ledger`가 example layer와 retrieval/research/runtime lookup까지 연결된다.
3. `Resource budget and route-choice memo`가 concurrency / join / saturation / feedback-adjustment 축을 담을 수 있게 확장된다.
4. `Prompt-stack release review`에 `coding_briefing_state`, `research_transparency_state`, `resource_concurrency_state`, `human_quality_gate_state`가 반영된다.
5. 위 축이 guide -> runtime -> skill -> example -> release gate까지 lookup parity를 유지한다.
6. `99_original/*`는 계속 untouched 상태로 남는다.

---

## 10. 검증 계획

문서 반영 후 다음 수준의 검증이 필요하다.

- `rg --files prompt-stack/v23`로 active 문서 목록 재확인
- `rg` 기반 검색으로 `Source consultation ledger`, `coding_briefing_state`, `research_transparency_state`, `resource_concurrency_state`, `human_quality_gate_state` 존재 확인
- `Coding-agent invocation pack`, `Prompt-stack release review`, `Resource budget and route-choice memo` 관련 example entry 슬라이스 직접 확인
- `PROMPT_retrieval_grounding_overlay.md`, `grounded-research` skill, `coding-core` skill, `CODEX_RUNTIME_GUIDE.md`에서 새 lookup parity 확인

`Limitation`:
- 이번 계획 문서는 augmentation 실행 전 계획 문서다.
- behavior-level eval, live agent replay, benchmark harness 검증은 별도 라운드가 필요하다.

---

## 11. 최종 판단

`v23`는 이미 `v22` 라운드의 핵심 보강을 잘 흡수했다.
따라서 이번 라운드의 올바른 방향은 foundation 재작업이 아니라 다음 네 축의 정밀 보강이다.

1. coding-agent briefing fidelity
2. deep-research transparency
3. resource-aware concurrency control
4. release-grade carryover gating

즉 `v23`의 다음 augmentation은 “더 많은 doctrine”이 아니라, PDF가 뒤쪽 장과 부록에서 요구한 `operator-facing execution artifacts`를 더 촘촘하게 연결하는 일이어야 한다.
