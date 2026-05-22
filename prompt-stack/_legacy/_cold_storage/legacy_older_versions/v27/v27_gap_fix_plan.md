# v27 Gap Fix Plan

## 1. 목적

이 문서는 `v27_Augmentation_Plan.md` 대비 실제 반영 결과를 재검토한 뒤, `완전 달성` 기준에서 남아 있던 갭만 추려 후속 보강 계획으로 정리한다.

이번 갭 수정의 목표는 새 방향 추가가 아니라 다음 미달성 항목의 종료다.

- shared artifact identity에서 `artifact_version` 누락 보완
- `PROMPT_USER_GUIDE.md`의 packet selection / supersession / downgrade rule 명시화
- `false-hold`, `rollback aftermath`, `drift-triggered review`, `route-switch failure` 같은 failure flow의 실행형 명시성 강화
- `join rule`의 독립 규율 명시
- 결과 문서의 달성 표현을 실제 수정 상태와 다시 정렬

---

## 2. 남은 갭

### G1. Shared artifact identity incomplete

남은 문제:

- `scenario_id`, `run_id`, `cohort_id`, `trace_id`는 일부 반영됐지만 `artifact_version`은 사실상 빠져 있다.

수정 방향:

- runtime / governance / evaluation / guide에 `artifact_version`을 명시적으로 추가
- example artifact에도 version-aware linkage가 필요함을 보강

### G2. User-guide level packet governance incomplete

남은 문제:

- runtime guide에는 stronger-vs-weaker artifact rule이 있으나 `PROMPT_USER_GUIDE.md`에는 같은 수준의 operational proof / supersession guidance가 약하다.

수정 방향:

- `PROMPT_USER_GUIDE.md`에 stronger packet 우선, weaker packet supersession, packet floor downgrade rule 추가

### G3. Failure flow not explicit enough

남은 문제:

- `false-hold`, `rollback aftermath`, `drift-triggered review`, `route-switch failure`, `ignored-critique`는 일부 artifact 설명에는 있으나 실제 overlay rule로는 약하다.

수정 방향:

- evaluation, memory, search overlays와 관련 skill/example에 explicit failure-flow wording 추가

### G4. Join rule under-specified

남은 문제:

- 계획에서 `selection`, `supersession`, `join rule`을 같이 강화하라고 했지만 join rule은 신설 규율로 충분히 드러나지 않는다.

수정 방향:

- multi-agent / orchestration / guide 쪽에 stronger artifact join rule 명시
- 동일 control problem에서 artifact가 여러 개일 때 join precedence와 join integrity rule 추가

### G5. Results document needs post-fix synchronization

남은 문제:

- 기존 `v27_Augmentation_Results.md`는 gap-fix 이전 상태를 반영한다.

수정 방향:

- gap-fix 반영 항목과 완전 달성 기준 충족 여부를 결과 문서에 후속 반영

---

## 3. 수정 대상

- `PROMPT_USER_GUIDE.md`
- `AGENTS.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/skills/orchestration-control/SKILL.md`
- `v27_Augmentation_Results.md`

필요 시 최소 범위에서 인접 레이어도 함께 맞춘다.

---

## 4. 완료 조건

다음이 충족되면 gap-fix를 완료로 본다.

1. `artifact_version`이 shared artifact identity 체계에 명시된다.
2. `PROMPT_USER_GUIDE.md`에 packet selection / supersession / downgrade rule이 명확히 보인다.
3. `false-hold`, `rollback aftermath`, `drift-triggered review`, `route-switch failure`가 실행형 failure wording으로 보강된다.
4. `join rule`이 multi-agent / orchestration 관련 문서에서 독립적으로 읽힌다.
5. `v27_Augmentation_Results.md`가 gap-fix 이후 상태와 정렬된다.
