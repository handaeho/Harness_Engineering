# v29 Augmentation Plan

## 1. 목적

`prompt-stack/v29` 전 문서군을 대상으로, `Agentic_Design_Patterns.pdf`의 핵심 패턴과 `v27` late gap-fix, `v28` strict post-audit closure 교훈을 `guide / governance / base / overlay / example / codex` 전 레이어에 다시 점검하고 보강한다.

이번 라운드의 최우선 목표는 guide-first reflection이다.

- runtime, governance, base, overlay, example, codex에 이미 있는 실행 규칙이 operator-facing `PROMPT_USER_GUIDE` 계열에서 누락된 상태를 남기지 않는다.
- `v27`에서 뒤늦게 고친 shared identity / packet governance / join rule / failure-flow vocabulary를 `v29` 기본 규칙으로 취급한다.
- `v28`에서 strict post-audit closure가 필요했던 지점을 `v29`에서는 first-pass 설계와 same-turn audit closure로 닫는다.

---

## 2. 입력 근거

필수 읽기 문서:

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`
- `prompt-stack/v27/Next_in_v27_Augmentation_Plan.md`
- `prompt-stack/v27/v27_Augmentation_Plan.md`
- `prompt-stack/v27/v27_Augmentation_Results.md`
- `prompt-stack/v27/v27_gap_fix_plan.md`
- `prompt-stack/v27/v27_gap_fix_results.md`
- `prompt-stack/v28/v28_Augmentation_Plan.md`
- `prompt-stack/v28/v28_Augmentation_Results.md`

패턴 crosswalk 해석 기준:

- planning, routing, parallelization, reflection, tool use, multi-agent, memory/adaptation, exception/recovery, retrieval, guardrails/safety, evaluation/monitoring, prioritization, exploration을 control surface로 재해석한다.
- shared artifact identity, packet governance, join integrity, failure diagnosability는 chapter title이 아니라 실행 규칙 수준에서 남아 있어야 한다.
- `99_original/*`는 수정 대상에서 제외한다.

---

## 3. active 범위

수정 및 audit 대상:

- `PROMPT_USER_GUIDE.md`
- `AGENTS.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

산출물:

- `v29_Augmentation_Plan.md`
- `v29_Augmentation_Results.md`

---

## 4. v28 baseline 대비 점검 초점

`v28_Augmentation_Plan.md`와 `v28_Augmentation_Results.md`를 baseline으로 삼아 다음을 확인한다.

1. `v28`에서 이미 올라온 shared identity, packet governance, supersession, join rule, failure-flow vocabulary가 `v29` active 문서에 유지되는가.
2. guide 문서가 runtime/governance/base/overlay/example/codex보다 약한 지점이 남아 있지 않은가.
3. safety overlay와 codex skill 레이어에 late-rule 누락이 재발하지 않았는가.
4. operational artifact family 9종 exemplar가 실제 identity field와 failure diagnosis surface를 유지하는가.
5. canonical results 문서 설계가 late addendum 분리를 허용하지 않도록 준비되는가.

---

## 5. 초기 audit 가설

first-pass 전 가설:

- `PROMPT_USER_GUIDE.md`는 이미 operator-facing packet governance를 많이 갖고 있을 가능성이 높다.
- governance/base/major overlays는 `v28` carry-forward가 강할 가능성이 높다.
- 상대적으로 늦게 약해지기 쉬운 곳은 safety overlay, example injection, codex skill close-out vocabulary다.
- example layer는 exemplar field는 강하지만 family rule 쪽 failure diagnosis wording이 약할 수 있다.
- codex skill 레이어는 join governance는 남아 있어도 shared identity 또는 required packet floor downgrade가 일부 skill에서 빠질 수 있다.

이 가설은 strict audit으로 실제 확인하고, 맞으면 narrow patch만 적용한다.

---

## 6. 보강 원칙

1. broad rewrite보다 narrow, explicit patch를 우선한다.
2. shared identity vocabulary는 `scenario_id / run_id / cohort_id / trace_id / artifact_version`로 통일한다.
3. packet governance vocabulary는 stronger artifact, weaker packet, required packet floor, supersession, join rule, incompatible merge rejection, upstream source IDs로 통일한다.
4. failure-flow vocabulary는 `false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, `failed fallback timing`을 기본 축으로 유지한다.
5. example에만 규칙을 넣고 guide/rule/codex에 빠뜨리는 구조를 허용하지 않는다.
6. canonical results 문서는 `반영 내용 / verification / limitation / remaining gap`을 분리하고, strict audit closure까지 반영된 최신 상태를 대표해야 한다.

---

## 7. 레이어별 보강 계획

### 7.1 Guide / governance / runtime

- `PROMPT_USER_GUIDE.md`, `AGENTS.md`, `PROMPT_guideline.md`, `CODEX_RUNTIME_GUIDE.md`에 shared identity / packet floor downgrade / supersession / join rule / incompatible merge rejection / failure diagnosability vocabulary를 교차 확인한다.
- user-guide가 runtime보다 약한 지점이 있으면 guide를 우선 보강한다.

### 7.2 Base

- `full / light / lightest / standalone`에 executed-vs-unexecuted honesty, evidence-grade claim calibration, packet floor downgrade, join failure downgrade, failure-flow wording이 압축형으로 유지되는지 확인한다.

### 7.3 Overlays

- evaluation: `false-promotion`, `false-hold`, `drift-triggered review`, gate downgrade, join governance
- memory: `rollback aftermath`, `false-hold`, `drift-triggered review`, controller join governance
- retrieval: `stale context`, `provenance drift`, `late clarification`, `Context substrate scorecard`, join governance
- search: `route-switch failure`, `late clarification`, `failed fallback timing`, `Route-switch benchmark verdict`, join governance
- tool: `runner readiness failure`, `partial completion`, `failed fallback timing`, runner artifact join governance
- multi-agent: coordination join integrity, unresolved join failure, supersession, lineage reconstructability
- safety: linked artifact identity, join rejection, lineage preservation, safety-relevant failure-flow

### 7.4 Examples

- `PROMPT_example_injection.md`와 `PROMPT_example_catalog.md`에서 shared identity, supersession, join rule, failure diagnosis를 family rule과 exemplar field 양쪽에 유지한다.
- operational artifact family 9종 exemplar에 `scenario_id / run_id / cohort_id / trace_id / artifact_version`가 실제 field로 노출되는지 확인한다.

### 7.5 Codex

- `CODEX_RUNTIME_GUIDE.md`와 5개 skill 문서에서 guide/governance와 동일 vocabulary를 쓰는지 확인한다.
- 각 skill에 shared identity, required packet floor downgrade, join governance, relevant failure-flow가 task surface에 맞게 직접 남아 있는지 확인한다.

---

## 8. strict audit 계획

문서 패치 전후로 아래를 확인한다.

1. 전역 검색:
   - `scenario_id|run_id|cohort_id|trace_id|artifact_version`
   - `required packet floor`
   - `supersede|superseded|stale predecessor`
   - `precedence, compatibility, freshness, completeness`
   - `incompatible merge`
   - `upstream source ID`
   - `false-promotion|false-hold|drift-triggered review|rollback aftermath|route-switch failure|late clarification|failed fallback timing`
   - operational artifact family 9종
2. 샘플 문맥 확인:
   - guide
   - governance
   - base
   - evaluation / memory / retrieval / search / tool / multi-agent / safety overlays
   - example family rule와 exemplar field
   - codex runtime와 5개 skill
3. 의미 검증:
   - 존재만이 아니라 downgrade / supersession / join rejection / lineage preservation 의미가 실제로 맞는지 확인한다.
4. same-turn closure:
   - strict audit에서 gap이 나오면 같은 턴 안에서 바로 patch하고 results 문서를 canonical 상태로 갱신한다.

---

## 9. 완료 기준

다음 모두를 충족할 때만 완료로 본다.

1. guide / governance / base / overlay / example / codex 전 레이어에 shared identity, packet governance, failure-flow, join rule이 일관되게 존재한다.
2. `artifact_version`이 규칙과 exemplar 양쪽에 반영된다.
3. user-guide 레이어가 runtime보다 약하지 않다.
4. safety overlay를 포함한 overlay 전체가 strict audit을 통과한다.
5. example layer가 artifact identity와 failure diagnosis를 실제로 드러낸다.
6. codex runtime과 skill 문서에 hidden late rule이 남지 않는다.
7. canonical results 문서가 계획 대비 반영 / verification / limitation / remaining gap을 분리하고 strict audit closure 상태를 대표한다.
