# v30 Augmentation Plan

## 1. 목적

`prompt-stack/v30` 전 문서군을 대상으로, `Agentic_Design_Patterns.pdf`의 pattern crosswalk와 `v27` late gap-fix, `v28` strict post-audit closure, `v29` same-turn closure를 baseline으로 유지하면서 `guide-first completion`을 더 직접적으로 닫는다.

이번 라운드의 최우선 목표는 coverage 확장이 아니라 `PROMPT_USER_GUIDE` 계열의 operator action directness 강화다.

- guide가 runtime / governance / base / overlay / example / codex보다 약한 상태를 남기지 않는다.
- guide가 lookup-only 문서에 머무르지 않고 stronger artifact 선택, required packet floor downgrade, join rejection, split verdict 유지, failure-flow triage를 직접 수행할 수 있게 만든다.
- active 문서군에 남아 있는 version-fixed 규범 문구를 제거해 특정 버전 명칭이 규칙을 소유하는 것처럼 보이지 않게 한다.

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
- `prompt-stack/v29/v29_Augmentation_Plan.md`
- `prompt-stack/v29/v29_Augmentation_Results.md`

baseline 문서:

- `prompt-stack/v29/PROMPT_USER_GUIDE.md`
- `prompt-stack/v29/AGENTS.md`
- `prompt-stack/v29/00_governance/PROMPT_guideline.md`
- `prompt-stack/v29/01_base/*`
- `prompt-stack/v29/02_overlays/*`
- `prompt-stack/v29/03_examples/PROMPT_example_injection.md`
- `prompt-stack/v29/03_examples/PROMPT_example_catalog.md`
- `prompt-stack/v29/codex/CODEX_RUNTIME_GUIDE.md`
- `prompt-stack/v29/codex/skills/*/SKILL.md`

pattern crosswalk 해석 기준:

- planning, routing, parallelization, reflection, tool use, multi-agent, memory/adaptation, exception/recovery, retrieval, guardrails/safety, evaluation/monitoring, prioritization, exploration을 control surface로 유지한다.
- shared identity, packet governance, join rule, failure diagnosability는 chapter title이 아니라 operator-facing 실행 규칙 수준에서 보여야 한다.
- `99_original/*`는 계속 수정 대상에서 제외한다.

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

- `v30_Augmentation_Plan.md`
- `v30_Augmentation_Results.md`

---

## 4. v29 baseline 대비 v30 초점

`v29`는 문서-level strict audit 기준으로 shared identity / packet governance / join rule / failure-flow / operational artifact family 9종을 전 레이어에 대부분 정렬했다.

`v30`에서 새로 닫아야 할 핵심은 다음이다.

1. guide directness
   - `PROMPT_USER_GUIDE.md`는 operational packet rule을 이미 갖고 있지만, operator가 `light review memo / stronger packet / operational artifact` 사이에서 언제 더 강한 artifact를 따라야 하는지 더 직접적으로 보여야 한다.
2. artifact strength ladder parity
   - governance / example / codex runtime도 같은 ladder vocabulary를 공유해야 한다.
3. versionless rule language
   - active 규칙 문서에 남아 있는 `v26` / `v27` 기준 section title이나 규범 문구는 제거해야 한다.
4. canonical results integrity
   - same-turn closure가 생기면 `v30_Augmentation_Results.md` 하나가 최신 canonical 상태를 대표해야 한다.

---

## 5. 초기 audit 가설

first-pass 전 가설:

- `PROMPT_USER_GUIDE.md`는 핵심 packet governance는 갖고 있지만 operator action과 artifact strength ladder가 아직 충분히 직접적이지 않을 수 있다.
- governance / examples / codex runtime은 규칙 자체는 강하지만 `light review memo / stronger packet / operational artifact` 어휘를 공통 ladder로 소유하지 않을 수 있다.
- base / overlays는 의미상 적합할 가능성이 높지만, 일부 section title에 version-fixed 규범 문구가 남아 있을 수 있다.
- codex skills는 `v29` same-turn closure 이후 shared identity / packet floor / join governance / failure-flow가 대부분 정렬되어 있어 audit-only 확인으로 끝날 가능성이 높다.

이 가설은 strict audit으로 확인하고, 맞으면 narrow patch만 적용한다.

---

## 6. 보강 원칙

1. broad rewrite보다 narrow, explicit patch를 우선한다.
2. shared identity vocabulary는 `scenario_id / run_id / cohort_id / trace_id / artifact_version`로 통일한다.
3. operator-facing ladder vocabulary는 `light review memo / stronger packet / operational artifact`로 통일한다.
4. packet governance vocabulary는 stronger artifact, weaker packet, required packet floor, supersession, join rule, incompatible merge rejection, upstream source IDs로 통일한다.
5. failure-flow vocabulary는 `false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, `failed fallback timing`을 기본 축으로 유지한다.
6. example에만 rule을 두고 guide / governance / codex에서 빠뜨리는 구조를 허용하지 않는다.
7. 특정 버전명을 규칙 소유자처럼 보이게 만드는 heading이나 문구를 남기지 않는다.

---

## 7. 레이어별 보강 계획

### 7.1 Guide / governance / runtime

- `PROMPT_USER_GUIDE.md`에 operator-facing artifact strength ladder를 직접 넣는다.
- guide에 `packet presence != operational proof`, stronger artifact activation 조건, weaker packet backgrounding, join rejection, split verdict, failure triage를 직접 적는다.
- `PROMPT_guideline.md`, `AGENTS.md`, `CODEX_RUNTIME_GUIDE.md`에 같은 ladder vocabulary와 downgrade rule을 맞춘다.
- active 규칙 문서에 남아 있는 version-fixed heading을 versionless wording으로 정리한다.

### 7.2 Base

- `full / light / lightest / standalone`에 있는 operational evidence note는 유지하되 section title을 versionless로 정리한다.
- executed-vs-unexecuted honesty, required packet floor downgrade, supersession, join failure stronger-claim 금지, failure-flow wording은 유지되는지 확인한다.

### 7.3 Overlays

- evaluation / memory / retrieval / search / tool / multi-agent / safety overlay 전부를 audit한다.
- control-surface별 failure-flow, join rule, lineage preservation 의미가 맞는지 확인한다.
- version-fixed operationalization heading은 versionless wording으로 정리한다.

### 7.4 Examples

- `PROMPT_example_injection.md`에 ladder와 operator-facing artifact activation을 family rule 수준에서 보강한다.
- `PROMPT_example_catalog.md` operational artifact family rule에 ladder, background-only weaker memo 처리, lineage vocabulary를 직접 맞춘다.
- operational artifact exemplar 9종의 shared identity field 유지 여부를 다시 확인한다.

### 7.5 Codex

- `CODEX_RUNTIME_GUIDE.md`는 guide/governance와 같은 ladder vocabulary, packet presence vs operational proof distinction, upstream lineage preservation을 직접 유지하도록 보강한다.
- 5개 skill 문서는 shared identity / required packet floor / join governance / failure-flow가 이미 유지되는지 audit-only로 확인하고, hidden late rule이 있으면 patch한다.

---

## 8. strict audit 계획

문서 패치 전후로 아래를 확인한다.

1. 전역 검색
   - `scenario_id|run_id|cohort_id|trace_id|artifact_version`
   - `required packet floor`
   - `supersede|superseded|stale predecessor`
   - `precedence, compatibility, freshness, completeness`
   - `incompatible merge`
   - `upstream source ID`
   - `false-promotion|false-hold|drift-triggered review|rollback aftermath|route-switch failure|late clarification|failed fallback timing`
   - operational artifact family 9종
2. versionless 규칙 확인
   - active 문서군에서 `v26|v27|v28|v29|v30` 규범 heading이 사라졌는지 확인한다.
3. 샘플 문맥 확인
   - guide의 ladder / downgrade / join rejection / lineage preservation / failure triage
   - governance의 packet strength ladder
   - base의 operational evidence note
   - overlays의 control-surface별 join governance / failure-flow
   - example injection / catalog의 ladder와 lineage rule
   - codex runtime와 skill의 packet floor / join governance / failure-flow
4. same-turn closure
   - strict audit에서 gap이 보이면 같은 턴 안에서 바로 patch하고 `v30_Augmentation_Results.md`를 canonical 상태로 갱신한다.

---

## 9. 완료 기준

다음 모두를 충족할 때만 완료로 본다.

1. guide / governance / base / overlay / example / codex 전 레이어에 shared identity, packet governance, failure-flow, join rule이 일관되게 존재한다.
2. `artifact_version`이 규칙과 exemplar 양쪽에 반영된다.
3. `PROMPT_USER_GUIDE.md`가 runtime보다 약하지 않고 operator action 문서로 기능한다.
4. `light review memo / stronger packet / operational artifact` ladder가 guide-first 체계로 정렬된다.
5. active 규칙 문서에서 version-fixed 규범 문구가 제거된다.
6. safety overlay를 포함한 overlay 전체가 strict audit을 통과한다.
7. example layer가 artifact identity, lineage preservation, failure diagnosis를 실제 family rule과 exemplar surface로 드러낸다.
8. codex runtime과 skill 문서에 hidden late rule이 남지 않는다.
9. `v30_Augmentation_Results.md`가 반영 내용 / verification / limitation / remaining gap을 분리하고 same-turn closure까지 반영된 canonical 상태를 대표한다.
