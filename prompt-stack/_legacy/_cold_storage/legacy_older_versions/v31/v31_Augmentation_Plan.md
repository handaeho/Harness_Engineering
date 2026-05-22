# v31 Augmentation Plan

## 1. 목적

`prompt-stack/v31` 전 문서군을 대상으로, `v30` strict audit 통과를 그대로 `guide saturation 완료`로 오독하지 않도록 남은 guide-level 직접성 갭만 닫는다.

이번 라운드의 최우선 목표:

- `PROMPT_USER_GUIDE.md`를 lower layer 요약문이 아니라 operator console 수준 문서로 올린다.
- operator가 guide만 읽고도 `artifact escalation`, `required packet floor`, `downgrade`, `incompatible merge rejection`, `split verdict`, `lineage preservation`, `failure-flow triage`를 control-surface별로 바로 판정할 수 있게 만든다.
- `v30`이 이미 닫은 guide-first directness, ladder vocabulary, versionless rule language, same-turn closure 성과를 후퇴시키지 않는다.
- runtime behavior 미검증 상태를 숨기지 않는다.

---

## 2. 입력 근거

필수 선행 확인 문서:

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
- `prompt-stack/v30/v30_Augmentation_Plan.md`
- `prompt-stack/v30/v30_Augmentation_Results.md`

`v30` baseline 문서:

- `prompt-stack/v30/PROMPT_USER_GUIDE.md`
- `prompt-stack/v30/AGENTS.md`
- `prompt-stack/v30/00_governance/PROMPT_guideline.md`
- `prompt-stack/v30/01_base/*`
- `prompt-stack/v30/02_overlays/*`
- `prompt-stack/v30/03_examples/PROMPT_example_injection.md`
- `prompt-stack/v30/03_examples/PROMPT_example_catalog.md`
- `prompt-stack/v30/codex/CODEX_RUNTIME_GUIDE.md`
- `prompt-stack/v30/codex/skills/*/SKILL.md`

Pattern crosswalk 해석 기준:

- `Agentic_Design_Patterns` 계열 문서는 reflection, routing, tool use, retrieval, memory/adaptation, multi-agent, evaluation/monitoring, HITL를 모두 control-surface 문제로 다룬다.
- 따라서 `v31`의 보강도 새 doctrine 추가가 아니라, 이미 존재하는 control surface를 guide operator block으로 직접 끌어올리는 방향이어야 한다.
- PDF 원본은 source artifact 자체를 로컬에서 직접 확인하고, 내용 crosswalk는 제공된 full/compact 추출본을 주 근거로 사용한다.

---

## 3. active 범위

우선 패치 대상:

- `PROMPT_USER_GUIDE.md`
- `AGENTS.md`
- `00_governance/PROMPT_guideline.md`
- `02_overlays/PROMPT_evaluation_monitoring_overlay.md`
- `02_overlays/PROMPT_guardrails_safety_overlay.md`
- `03_examples/PROMPT_example_injection.md`
- `03_examples/PROMPT_example_catalog.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

Audit-only 확인 대상:

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/PROMPT_memory_adaptation_overlay.md`
- `02_overlays/PROMPT_retrieval_grounding_overlay.md`
- `02_overlays/PROMPT_search_reasoning_overlay.md`
- `02_overlays/PROMPT_tool_protocol_overlay.md`
- `02_overlays/PROMPT_multi_agent_overlay.md`
- `codex/skills/design-analysis/SKILL.md`

산출물:

- `v31_Augmentation_Plan.md`
- `v31_Augmentation_Results.md`

수정 제외:

- `99_original/*`

---

## 4. v30 baseline 대비 v31 초점

`v30`이 이미 닫았다고 기록한 것:

- guide-first directness 강화
- `light review memo / stronger packet / operational artifact` ladder의 guide / governance / examples / codex runtime 정렬
- shared identity / packet governance / join rule / failure-flow / operational artifact family 9종의 전 레이어 유지
- active 규칙 문서의 version-fixed 규범 heading 제거
- canonical results 문서의 first pass + same-turn closure 반영

`v31`에서 아직 닫아야 할 것:

1. guide에는 generic ladder와 generic packet rule은 있지만 control-surface-specific operator matrix가 없다.
2. guide에는 9개 operational artifact family별 lighter predecessor / stronger packet / active operational artifact / required packet floor / downgrade trigger / join caution / relevant failure-flow를 one-pass로 판정하는 표가 없다.
3. guide에는 `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, `unresolved join failure`가 overlay 수준의 triage rule로만 남아 있다.
4. guide는 `required / recommended / optional packet`을 말하지만 claim-language별 minimum packet floor를 직접 gate로 보여주지 않는다.
5. guide 규칙이 분산돼 있어 operator가 join rejection, split verdict, lineage preservation을 한 번에 결정하기 어렵다.
6. `v30_Augmentation_Results.md`의 strict audit 통과 기록은 유지하되, 그것이 곧 guide saturation closure는 아니라는 점을 `v31`에서 분리 기록해야 한다.

---

## 5. 초기 audit 가설

- `PROMPT_USER_GUIDE.md`는 `Operational artifact strength ladder`와 `Operational packet rule`을 이미 보유하지만, operator matrix / claim-language gate / triage map이 빠져 있을 가능성이 높다.
- overlay는 상세 failure-flow를 이미 가지고 있을 가능성이 높고, 문제는 guide uplift와 safety/runtime/example/codex alignment일 가능성이 높다.
- example layer는 family rule 수준의 ladder는 보유하지만 exemplar notes가 sibling relation을 충분히 직접 드러내지 않을 수 있다.
- codex skill layer는 대부분 audit-only로 끝날 수 있지만, `artifact_version` 보존이나 newly promoted failure-flow directness는 좁게 보강이 필요할 수 있다.
- 이번 라운드도 verification은 문서-level strict audit이며 runtime behavior 강제는 여전히 `Need Verification` 상태로 남는다.

---

## 6. 보강 원칙

1. guide saturation이지 doctrine expansion이 아니다.
2. first pass는 반드시 `PROMPT_USER_GUIDE.md`부터 시작한다.
3. broad rewrite 대신 narrow, explicit patch를 우선한다.
4. guide가 runtime / overlay / codex보다 약한 실행 규칙을 갖는 상태를 허용하지 않는다.
5. `scenario_id / run_id / cohort_id / trace_id / artifact_version` shared identity를 유지한다.
6. `required packet floor`, supersession, join rule, incompatible merge rejection, split verdict, lineage preservation vocabulary를 전 레이어에서 일관되게 맞춘다.
7. active 규칙 문서에는 버전명을 규범 소유자처럼 재도입하지 않는다.
8. `v27` late gap-fix, `v28` strict post-audit closure, `v29` same-turn closure, `v30` guide-first directness를 모두 carry-forward한다.

---

## 7. 레이어별 보강 계획

### 7.1 Guide

- 9개 operational artifact family 전체를 커버하는 control-surface-specific escalation matrix를 추가한다.
- `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, `unresolved join failure` triage map을 guide에 직접 올린다.
- `benchmark-grade`, `replay-grade`, `controller-grade`, `coding-proof-grade`, `release-grade`, `drift-grade`, `route-quality-grade`, `retrieval-substrate-grade` claim-language gate를 direct floor summary로 추가한다.
- lineage / join checklist를 guide에 통합 블록으로 넣는다.

### 7.2 Governance / AGENTS / runtime

- guide에 올라온 operator semantics와 governance doctrine이 충돌하지 않도록 정렬한다.
- `AGENTS.md`와 `CODEX_RUNTIME_GUIDE.md`에 claim-language floor와 promoted failure-flow directness를 맞춘다.
- lower layer가 guide보다 더 직접적인 실행 규칙을 단독 소유하지 않게 한다.

### 7.3 Base

- executed-vs-unexecuted honesty, packet floor downgrade, supersession, join failure stronger-claim 금지, failure-flow wording이 유지되는지 audit한다.
- 의미 mismatch가 없으면 patch 없이 유지한다.

### 7.4 Overlays

- evaluation / safety overlay에 guide로 승격된 operator triage language가 실제로 반영되는지 확인한다.
- memory / retrieval / search / tool / multi-agent는 세부 failure-flow wording이 이미 있는지 audit한다.

### 7.5 Examples

- example family rule에 sibling relation, minimum packet floor, promoted failure-flow directness를 추가한다.
- 9개 exemplar의 notes에 lighter sibling / stronger sibling / downgrade cue / split verdict cue를 짧게라도 노출한다.

### 7.6 Codex skills

- `coding-core`, `eval-ops`, `grounded-research`, `orchestration-control`에서 promoted failure-flow와 lineage 보존 문구가 충분히 직접적인지 확인한다.
- `design-analysis`는 route-quality directness가 이미 유지되는지 audit-only로 확인한다.

---

## 8. strict audit 계획

전역 검색:

1. `scenario_id|run_id|cohort_id|trace_id|artifact_version`
2. `required packet floor`
3. `supersede|superseded|stale predecessor`
4. `precedence, compatibility, freshness, completeness`
5. `incompatible merge`
6. `upstream source ID`
7. `false-promotion|false-hold|drift-triggered review|rollback aftermath|route-switch failure|late clarification|failed fallback timing`
8. `runner readiness failure|partial completion|quarantine entry|freshness defect|unresolved join failure`
9. operational artifact family 9종

직접 열어볼 샘플 문맥:

- guide의 generic ladder
- guide의 control-surface-specific escalation matrix
- guide의 claim-language gate
- guide의 failure triage map
- guide의 lineage / join checklist
- overlay별 promoted failure-flow 문맥
- example family rule과 exemplar notes
- runtime guide와 relevant skill close-out rules

versionless 규칙 확인:

- active 규칙 문서군에서 `v26|v27|v28|v29|v30|v31` 검색 결과가 비어 있는지 확인한다.

same-turn closure:

- strict audit에서 gap이 보이면 같은 턴 안에서 즉시 patch하고 `v31_Augmentation_Results.md`를 canonical 최신 상태로 갱신한다.

---

## 9. 완료 기준

1. guide / governance / base / overlay / example / codex 전 레이어에 shared identity, packet governance, failure-flow, join rule이 일관되게 존재한다.
2. `artifact_version`이 규칙과 exemplar 양쪽에 반영된다.
3. `PROMPT_USER_GUIDE.md`가 runtime보다 약하지 않고 operator console 수준으로 동작한다.
4. guide 안에 control-surface-specific escalation matrix가 직접 존재한다.
5. guide 안에 claim-language별 minimum packet floor summary가 직접 존재한다.
6. guide가 `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, `unresolved join failure`를 operator triage 대상으로 직접 다룬다.
7. example layer가 sibling relation / downgrade / lineage preservation / failure diagnosis를 실제 rule과 exemplar notes에서 드러낸다.
8. safety overlay를 포함한 overlay 전체가 strict audit 범위에서 의미 충돌 없이 유지된다.
9. active 규칙 문서에서 version-fixed 규범 문구가 보이지 않는다.
10. results 문서가 `v30`의 strict-audit closure와 `v31`의 guide saturation closure를 분리해 기록한다.
11. runtime behavior 미검증 상태를 `limitation`과 `remaining gap`에서 숨기지 않는다.
