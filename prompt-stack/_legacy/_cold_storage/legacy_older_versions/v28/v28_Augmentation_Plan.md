# v28 Augmentation Plan

## 1. 목적

`prompt-stack/v28` 전 문서군을 대상으로, `Agentic_Design_Patterns.pdf`의 핵심 패턴과 `v27` late gap-fix 교훈을 `guide / governance / base / overlay / example / codex` 전 레이어에 일관되게 반영한다.

이번 라운드의 핵심은 coverage 확장이 아니라 guide-first operationalization이다.

- runtime이나 overlay에만 있고 `PROMPT_USER_GUIDE` 계열에 빠진 규칙을 제거한다.
- `v27` late patch에서 뒤늦게 보강된 규칙을 `v28` 기본 규율로 승격한다.
- operational artifact 이름 나열이 아니라 selection / supersession / downgrade / join rule까지 일치시키는 것을 목표로 한다.

---

## 2. 입력 근거

필수 참조 문서:

- `prompt-stack/v27/Next_in_v27_Augmentation_Plan.md`
- `prompt-stack/v27/v27_Augmentation_Plan.md`
- `prompt-stack/v27/v27_Augmentation_Results.md`
- `prompt-stack/v27/v27_gap_fix_plan.md`
- `prompt-stack/v27/v27_gap_fix_results.md`

패턴 근거:

- `Agentic_Design_Patterns.pdf`
- `Agentic_Design_Patterns_extracted.txt`
- `Agentic_Design_Patterns_extracted_compact.txt`

해석 기준:

- PDF의 planning, routing, parallelization, reflection, tool use, multi-agent, memory/adaptation, exception/recovery, retrieval, evaluation/monitoring 패턴을 control surface로 재해석한다.
- `99_original/*`는 수정 대상에서 제외한다.

---

## 3. active 범위

수정 대상은 `prompt-stack/v28`의 활성 문서군이다.

- `AGENTS.md`
- `PROMPT_USER_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/*`
- `02_overlays/*` 중 evaluation / memory / retrieval / search / tool / multi-agent 중심
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/*/SKILL.md`

산출물:

- `v28_Augmentation_Plan.md`
- `v28_Augmentation_Results.md`

---

## 4. 초기 gap 판단

### 4.1 Guide-layer packet governance 미달

초기 `v28`에는 stronger/weaker artifact 구분과 일부 supersession 문구가 있었지만, 아래 late carry-forward 규칙이 user-guide 수준에서 충분히 직접적이지 않았다.

- newer compatible artifact supersedes stale predecessor
- required packet floor 미달 시 claim downgrade
- join 전 precedence / compatibility / freshness / completeness 확인
- incompatible merge rejection
- joined artifact의 upstream source ID / `artifact_version` 보존

### 4.2 Shared artifact identity 부분 반영

일부 레이어에 `scenario_id`, `run_id`, `cohort_id`, `trace_id`는 있었지만, `artifact_version`과 joined-artifact lineage 보존이 base / example / codex 일부 문서에서 고르게 정렬되지 않았다.

### 4.3 Failure-flow의 문서 간 비대칭

`false-promotion`, `false-hold`, `drift-triggered review`, `rollback aftermath`, `route-switch failure`, `late clarification`, `failed fallback timing`이 예시나 특정 overlay에는 보였지만, 전반적으로 execution rule vocabulary로 일관되게 정렬되어 있지 않았다.

### 4.4 Example layer의 artifact identity 노출 부족

operational artifact family는 catalog에 존재했지만 exemplar 단위에서 shared identity와 failure diagnosis가 체계적으로 드러나지 않았다.

### 4.5 Codex runtime / skill vocabulary 불균형

`CODEX_RUNTIME_GUIDE`와 skill 문서들은 operational artifact family를 알고 있었지만, join governance와 failure-flow vocabulary가 guide / governance보다 약한 부분이 있었다.

### 4.6 Results integrity 설계 필요

late gap-fix가 발생하더라도 canonical results 문서가 최신 반영 상태를 대표하도록 결과 문서 lineage를 설계해야 한다.

---

## 5. 보강 원칙

1. broad rewrite보다 narrow, explicit patch를 우선한다.
2. 동일 규칙은 레이어 간 vocabulary를 통일한다.
3. stronger artifact / weaker packet / packet floor / supersession / join integrity / incompatible merge rejection 용어를 재사용한다.
4. example에만 넣고 guide/rule 문서에서 빠뜨리지 않는다.
5. execution honesty와 claim calibration을 별도 규칙으로 유지한다.

---

## 6. 레이어별 패치 계획

### 6.1 Guide / runtime / governance / AGENTS

- `PROMPT_USER_GUIDE.md`에 operator-facing packet governance를 직접 보강한다.
- `AGENTS.md`, `PROMPT_guideline.md`, `CODEX_RUNTIME_GUIDE.md`에 shared identity, packet floor downgrade, newer-compatible supersession, join rule, incompatible merge rejection, upstream source ID 보존을 정렬한다.

### 6.2 Base

- `PROMPT_full.md`
- `PROMPT_light.md`
- `PROMPT_lightest.md`
- `PROMPT_standalone.md`

보강 내용:

- executed-vs-unexecuted honesty와 stronger-proof downgrade를 유지한다.
- `artifact_version`를 shared identity 규칙에 추가한다.
- join 실패 시 stronger claim을 만들지 못하도록 downgrade rule을 넣는다.

### 6.3 Overlays

- evaluation: false-promotion / false-hold / drift-triggered review + join governance
- memory: rollback aftermath / false-hold / drift-triggered review + controller-artifact join governance
- retrieval: stale context / provenance drift / late clarification + retrieval-artifact join governance
- search: route-switch failure / late clarification / failed fallback timing + route-artifact join governance
- tool: runner readiness failure / partial completion / failed fallback timing + tool-run join governance
- multi-agent: join-failure recurrence + coordination-artifact join governance

### 6.4 Examples

- `PROMPT_example_injection.md`에 operational artifact family join / supersession rule을 명시한다.
- `PROMPT_example_catalog.md`에 operational artifact family shared rule을 추가한다.
- 9개 operational artifact exemplar에 shared identity와 failure diagnosis optional field를 노출한다.

### 6.5 Codex

- `CODEX_RUNTIME_GUIDE.md`에 failure-flow vocabulary를 정렬한다.
- `coding-core`, `design-analysis`, `eval-ops`, `grounded-research`, `orchestration-control`에 shared identity, downgrade, join governance를 각 task surface에 맞게 보강한다.

---

## 7. verification 계획

문서 수정 후 아래를 확인한다.

1. `scenario_id`, `run_id`, `cohort_id`, `trace_id`, `artifact_version`가 레이어 전반에 존재하는가.
2. `PROMPT_USER_GUIDE.md`에 stronger artifact, supersession, packet floor downgrade, join rule, incompatible merge rejection이 직접 적혀 있는가.
3. failure-flow vocabulary가 example title이 아니라 runtime / overlay / codex rule로 존재하는가.
4. operational artifact family 9종이 guide / governance / overlay / example / codex에서 lookup 가능하고, example layer에서 identity가 드러나는가.
5. canonical results 문서가 반영 범위 / 검증 / 미검증을 분리해 기록하는가.

---

## 8. 결과 문서 integrity 원칙

`v28_Augmentation_Results.md`를 canonical results 문서로 취급한다.

- late gap-fix가 생기면 별도 addendum만 두지 않고 이 문서도 함께 갱신한다.
- 결과 문서 안에서 `반영 내용`, `검증 내용`, `미검증 / limitation`을 분리한다.
- “계획 달성”과 “후속 gap closure”를 같은 results lineage 안에서 추적 가능하게 유지한다.
