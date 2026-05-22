# v28 Augmentation Results

## 1. 상태

이 문서는 `prompt-stack/v28` 보강의 canonical results 문서다.

- 현재 파일은 본 패치 wave 이후 최신 반영 상태를 기준으로 작성되었다.
- late gap-fix가 추가되면 별도 addendum만 분리하지 않고 이 문서도 함께 갱신해야 한다.
- 아래 기록은 `반영 내용`, `검증 내용`, `미검증 / limitation`을 분리해 유지한다.

---

## 2. 반영 범위

수정 문서군:

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
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`
- `v28_Augmentation_Plan.md`
- `v28_Augmentation_Results.md`

미수정 범위:

- `99_original/*`

---

## 3. 레이어별 보강 요약

### 3.1 Guide / governance / runtime / AGENTS

반영 내용:

- `PROMPT_USER_GUIDE.md`에 operator-facing `Operational packet rule`을 보강했다.
- stronger artifact 우선, newer-compatible supersession, required packet floor downgrade, join 전 precedence / compatibility / freshness / completeness 확인, incompatible merge rejection, upstream source ID / `artifact_version` 보존을 직접 명시했다.
- `AGENTS.md`, `PROMPT_guideline.md`, `CODEX_RUNTIME_GUIDE.md`에 동일 vocabulary를 맞췄다.
- `AGENTS.md`와 `CODEX_RUNTIME_GUIDE.md`에 failure-flow vocabulary를 execution rule 수준으로 정렬했다.
- strict post-audit closure에서 `PROMPT_USER_GUIDE.md`, `PROMPT_guideline.md`, `01_base/*`, `PROMPT_guardrails_safety_overlay.md`, `PROMPT_example_catalog.md`에도 failure-flow 또는 shared-identity exemplar surface를 추가 정렬했다.

영향:

- user-guide 레이어가 runtime보다 약하지 않도록 정렬되었다.
- packet 존재와 operational proof의 차이가 governance와 operator-facing 문서 모두에서 같은 언어로 보인다.

### 3.2 Base

반영 내용:

- `PROMPT_full`, `light`, `lightest`, `standalone`에 `artifact_version`를 포함한 shared identity 문구를 추가했다.
- join failure 시 stronger claim을 합성하지 못하도록 downgrade rule을 추가했다.
- executed-vs-unexecuted honesty를 유지하면서 evidence-grade claim calibration을 더 직접적으로 만들었다.

영향:

- base 프롬프트만 읽어도 stronger proof 부재와 join 실패에 대한 downgrade 동작이 보이게 되었다.

### 3.3 Overlays

반영 내용:

- evaluation: `false-promotion`, `false-hold`, `drift-triggered review`, join governance
- memory: `rollback aftermath`, `false-hold`, `drift-triggered review`, controller join governance
- retrieval: `stale context`, `provenance drift`, `late clarification`, retrieval join governance
- search: `route-switch failure`, `late clarification`, `failed fallback timing`, route join governance
- tool: `runner readiness failure`, `partial completion`, `failed fallback timing`, tool-run join governance
- multi-agent: coordination artifact supersession, join precedence / compatibility / freshness / completeness, incompatible merge rejection
- safety: linked operational artifact visibility, safety-preserving join rejection, safety-relevant failure-flow visibility

영향:

- failure-flow가 exemplar 이름이 아니라 overlay 실행 규칙으로 올라왔다.
- coordination / replay / tool / retrieval surface에서 joined artifact integrity를 문서적으로 강제할 수 있게 되었다.

### 3.4 Examples

반영 내용:

- `PROMPT_example_injection.md`에 operational artifact supersession / join rule을 직접 보강했다.
- `PROMPT_example_catalog.md`에 `Operational artifact family rule`을 추가했다.
- operational artifact family 9종 exemplar에 shared identity와 failure diagnosis optional field를 노출했다.

영향:

- example layer가 artifact 이름만 보여주는 상태에서 lineage-aware exemplar 상태로 올라갔다.
- `artifact_version`이 exemplar family 안에 실제 field로 들어갔다.

### 3.5 Codex

반영 내용:

- `CODEX_RUNTIME_GUIDE.md`에 shared identity, join governance, failure-flow vocabulary를 추가 정렬했다.
- `coding-core`, `design-analysis`, `eval-ops`, `grounded-research`, `orchestration-control`에 각 task surface에 맞는 shared identity / downgrade / join rule을 추가했다.

영향:

- guide / governance에서 쓰는 vocabulary가 codex runtime / skill layer에서도 거의 동일하게 보인다.

---

## 4. late v27 carry-forward 반영 여부

### 4.1 Shared artifact identity baseline

상태: 반영

근거:

- `PROMPT_USER_GUIDE.md`
- `AGENTS.md`
- `PROMPT_guideline.md`
- `01_base/*`
- relevant overlays
- `CODEX_RUNTIME_GUIDE.md`
- `03_examples/PROMPT_example_catalog.md`

반영 포인트:

- `scenario_id`
- `run_id`
- `cohort_id`
- `trace_id`
- `artifact_version`

### 4.2 Guide-layer packet governance

상태: 반영

근거:

- `PROMPT_USER_GUIDE.md`의 `Operational packet rule`

반영 포인트:

- stronger artifact wins over weaker packet summary
- newer compatible artifact supersedes stale predecessor
- required packet floor 미달 시 claim downgrade
- join 전 precedence / compatibility / freshness / completeness 확인
- incompatible merge rejection
- joined artifact의 upstream source ID / `artifact_version` 보존

### 4.3 Failure-flow execution wording

상태: 반영

근거:

- evaluation overlay
- `PROMPT_USER_GUIDE.md`
- `PROMPT_guideline.md`
- `01_base/*`
- memory overlay
- retrieval overlay
- search overlay
- tool overlay
- `PROMPT_guardrails_safety_overlay.md`
- `AGENTS.md`
- `CODEX_RUNTIME_GUIDE.md`
- codex skills 일부
- `PROMPT_example_catalog.md`

반영 포인트:

- `false-promotion`
- `false-hold`
- `drift-triggered review`
- `rollback aftermath`
- `route-switch failure`
- `late clarification`
- `failed fallback timing`

### 4.4 Explicit join rule across coordination surfaces

상태: 반영

근거:

- `PROMPT_USER_GUIDE.md`
- `PROMPT_guideline.md`
- `AGENTS.md`
- evaluation / memory / retrieval / search / tool / multi-agent overlays
- `PROMPT_example_injection.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/orchestration-control/SKILL.md`

반영 포인트:

- precedence
- compatibility
- freshness
- completeness
- incompatible merge rejection
- stronger artifact weakening 금지 또는 downgrade
- upstream source ID / `artifact_version` 보존

### 4.5 Results-document integrity

상태: 반영

근거:

- `v28_Augmentation_Plan.md`
- `v28_Augmentation_Results.md`

반영 포인트:

- canonical results 문서 상태 명시
- addendum 분리 방치 금지
- 반영 내용 / 검증 / limitation 분리

---

## 5. verification 결과

### 5.1 수행한 검증

문자열/구조 기반 확인:

1. `scenario_id|run_id|cohort_id|trace_id|artifact_version` 전역 검색
2. `required packet floor`, `supersede`, `precedence, compatibility, freshness, completeness`, `incompatible merge`, `upstream source IDs` 전역 검색
3. `false-promotion|false-hold|drift-triggered review|rollback aftermath|route-switch failure|late clarification|failed fallback timing` 전역 검색
4. operational artifact family 9종 전역 검색

샘플 문맥 확인:

- `PROMPT_USER_GUIDE.md` operational packet rule
- `PROMPT_guideline.md` operational proof / minimum evidence floor 구간
- `AGENTS.md` v27 operational-evidence rule
- `CODEX_RUNTIME_GUIDE.md` operational packet block
- `PROMPT_example_catalog.md` operational artifact family rule 및 exemplar field

### 5.2 검증 결과 요약

- shared identity vocabulary는 guide / governance / base / overlay / example / codex에 모두 존재한다.
- `PROMPT_USER_GUIDE.md`에 packet governance가 직접 명시되어 runtime보다 약하지 않다.
- failure-flow vocabulary는 guide / governance / base / overlay / example / codex에서 execution-facing rule 또는 family rule 형태로 존재한다.
- operational artifact family 9종은 guide / governance / overlay / example / codex에서 lookup 가능하다.
- example layer에는 shared identity field와 `artifact_version`가 실제 exemplar field로 반영되었다.

---

## 6. 아직 미검증인 것

`Need Verification`:

- 문서 규칙이 실제 런타임 agent behavior에서 동일하게 강제되는지에 대한 end-to-end execution test는 수행하지 않았다.
- exemplar field 추가가 downstream example generation 품질에 어떤 영향을 주는지 실사용 시뮬레이션은 하지 않았다.
- `Agentic_Design_Patterns.pdf` 원문 chapter별 세부 문장 매핑 검증은 하지 않았고, 추출본과 기존 v27 carry-forward 해석을 기반으로 control surface를 정렬했다.

---

## 7. limitation

- 현재 작업은 문서군 정렬과 rule-surface 보강이다. benchmark harness나 replay runner 같은 실제 실행 substrate를 새로 구현한 것은 아니다.
- 작업 디렉터리가 git repository가 아니어서 git diff 기반 통계 검증은 수행하지 않았다.
- 일부 기존 문서는 과거 version label을 유지한 section title을 포함하고 있으며, 이번 패치는 그 구조를 보존한 채 요구된 operational rule만 최소 침습으로 보강했다.

---

## 8. 남은 gap

현재 기준으로 확인된 구조적 gap는 크게 남지 않았다.

다만 실운영 관점에서는 아래가 후속 확인 대상이다.

- 문서 규칙을 실제 prompt assembly나 runtime selection에서 어떻게 소비하는지
- example-layer shared identity field가 실제 생성물에서 consistently 채워지는지
- future late patch가 생길 때 이 canonical results 문서를 실제로 함께 갱신하는 workflow가 유지되는지
