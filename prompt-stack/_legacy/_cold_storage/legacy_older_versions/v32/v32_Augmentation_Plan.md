# v32 Augmentation Plan

## 1. 목적

`prompt-stack/v32` 전체 문서군을 대상으로 `v31`을 baseline으로 삼아 마지막 guide-level externalization gap을 닫는다.

이번 라운드의 최우선 목표:

- `PROMPT_USER_GUIDE.md`가 operator에게 `required / recommended / optional packet` 관계를 guide 내부에서 직접 판정하게 만든다.
- `Packet compliance report`를 guide를 대체하는 doctrine source가 아니라 guide floor를 감사하는 secondary audit artifact로 재위치한다.
- `v31`의 실제 성과와 `v31` results 문서의 과잉 closure를 분리 기록한다.
- runtime behavior 강제는 검증하지 못한 상태라면 그대로 `Need Verification`으로 남긴다.

---

## 2. 기준선과 문제 정의

Baseline:

- 현재 단계의 기준선은 `v31`이다.

`v31`이 실제로 달성한 것:

- guide에 `Operator console block`을 올렸다.
- guide에 `Control-surface-specific escalation matrix`, `Failure triage map`, `Claim-language gate`, `Lineage / join checklist`를 직접 올렸다.
- `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, `unresolved join failure`를 guide-level triage 대상으로 끌어올렸다.
- governance / runtime / examples / relevant skills를 `v30` 이후 directness vocabulary에 맞춰 정렬했다.

`v31`이 남긴 핵심 gap:

- guide는 minimum floor와 downgrade language는 직접 보이지만 `required / recommended / optional packet` 전체 관계를 아직 완전히 직접 소유하지 못했다.
- guide lookup과 packet lookup 일부가 여전히 `Packet compliance report`를 packet-floor 판단용 external surface처럼 가리켰다.
- example layer는 sibling relation과 downgrade cue를 prose notes로는 보였지만 packet-floor relation을 structured metadata로 충분히 올리지 못했다.
- `v31_Augmentation_Results.md`는 문서-level strict audit 기준의 open gap이 없다고 적고 있어 packet-floor externalization gap을 과잉 종결했다.

---

## 3. 입력 근거

필수 선행 근거:

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
- `prompt-stack/v31/v31_Augmentation_Plan.md`
- `prompt-stack/v31/v31_Augmentation_Results.md`

필수 baseline 문서:

- `prompt-stack/v31/PROMPT_USER_GUIDE.md`
- `prompt-stack/v31/AGENTS.md`
- `prompt-stack/v31/00_governance/PROMPT_guideline.md`
- `prompt-stack/v31/01_base/*`
- `prompt-stack/v31/02_overlays/*`
- `prompt-stack/v31/03_examples/PROMPT_example_injection.md`
- `prompt-stack/v31/03_examples/PROMPT_example_catalog.md`
- `prompt-stack/v31/codex/CODEX_RUNTIME_GUIDE.md`
- `prompt-stack/v31/codex/skills/*/SKILL.md`

근거 사용 규칙:

- PDF source artifact는 직접 확인을 시도한다.
- PDF direct extraction이 환경 제약으로 실패하면 제공된 extracted companions를 primary text evidence로 사용하고 그 한계를 별도 기록한다.

---

## 4. Active 범위

우선 패치 대상:

- `PROMPT_USER_GUIDE.md`
- `00_governance/PROMPT_guideline.md`
- `AGENTS.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `03_examples/PROMPT_example_catalog.md`

Audit 중심 대상:

- `01_base/PROMPT_full.md`
- `01_base/PROMPT_light.md`
- `01_base/PROMPT_lightest.md`
- `01_base/PROMPT_standalone.md`
- `02_overlays/*`
- `03_examples/PROMPT_example_injection.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

수정 제외:

- `99_original/*`

---

## 5. 작업 원칙

- broad rewrite보다 narrow, explicit patch를 우선한다.
- first pass는 반드시 `PROMPT_USER_GUIDE.md`부터 시작한다.
- guide가 먼저 직접 말한 semantics를 governance / runtime / examples / codex가 반사하게 만든다.
- active 규칙 문서에는 version-fixed 규범 heading을 재도입하지 않는다.
- `artifact_version`과 lineage vocabulary는 rule과 exemplar 양쪽에 유지한다.
- runtime behavior 검증을 수행하지 않았다면 문서-level closure와 분리해서 기록한다.

---

## 6. 레이어별 실행 계획

### 6.1 `PROMPT_USER_GUIDE.md`

- `Direct packet floor matrix` 또는 동등한 직접 lookup block을 guide 내부에 추가한다.
- 최소 8개 claim surface에 대해 다음을 guide 안에 직접 적는다.
- `required packet(s)`
- `recommended companion packet(s)`
- `optional packet(s)`
- required missing 시 downgrade language
- required는 있으나 recommended가 없을 때의 weaker language
- optional packet의 audit / completeness 역할
- `Packet compliance report`를 secondary audit artifact로 직접 재정의한다.
- quick lookup, packet quick lookup, assembly-facing reminder를 새 owner boundary에 맞춘다.

### 6.2 `00_governance`

- guide-owned first-pass packet-floor doctrine을 명시한다.
- `Packet compliance report`가 doctrine owner처럼 보이지 않도록 낮춘다.
- required-only가 아니라 recommended-missing weaker language까지 반영한다.

### 6.3 `01_base`

- executed-vs-unexecuted honesty
- required packet floor downgrade
- recommended companion absence 시 stronger claim 완화
- join failure stronger-claim 금지
- failure-flow wording

위 다섯 항목을 audit하고 의미 mismatch가 있을 때만 좁게 패치한다.

### 6.4 `02_overlays`

- evaluation / safety / memory / retrieval / search / tool / multi-agent 전부 audit한다.
- guide보다 더 direct한 packet-floor owner surface가 남지 않게 본다.
- 충돌이 없으면 audit-only로 종료한다.

### 6.5 `03_examples`

- `Packet compliance report` exemplar를 guide floor audit artifact로 재정의한다.
- operational artifact family shared rule에 structured inheritance field를 올린다.
- operational artifact exemplar 9종에 최소 다음 metadata를 직접 올린다.
- `required_packet_floor`
- `recommended_companions`
- `optional_companions`
- `downgrade_language`
- `weaker_language_if_recommended_missing`
- `join_caution`

### 6.6 `codex`

- `CODEX_RUNTIME_GUIDE.md`를 guide owner boundary에 맞춘다.
- skills는 최소 audit하고 direct conflict가 있을 때만 패치한다.

---

## 7. Strict audit 계획

전역 검색:

1. `Packet compliance report`
2. `required / recommended / optional packet`
3. `required packet floor`
4. `recommended_companions`
5. `optional_companions`
6. `scenario_id|run_id|cohort_id|trace_id|artifact_version`
7. `supersede|superseded|stale predecessor`
8. `precedence, compatibility, freshness, completeness`
9. `incompatible merge`
10. `runner readiness failure|partial completion|quarantine entry|freshness defect|unresolved join failure`
11. operational artifact family 9종

직접 열어볼 샘플 문맥:

- guide의 `Operator console block`
- guide의 `Control-surface-specific escalation matrix`
- guide의 `Direct packet floor matrix / claim-language gate`
- guide의 packet quick lookup
- guide의 assembly-facing reminder
- example catalog의 `Packet compliance report`
- example catalog의 operational artifact family shared rule
- operational artifact exemplar 9종의 structured packet-floor fields
- `CODEX_RUNTIME_GUIDE.md`의 `Packet compliance report` 관련 문맥

versionless audit:

- `AGENTS.md`
- `00_governance/PROMPT_guideline.md`
- `01_base/*`
- `02_overlays/*`
- `03_examples/*`
- `codex/*`

위 active 규칙 문서군에 `v26|v27|v28|v29|v30|v31|v32` version-fixed 규범 문구가 남지 않는지 확인한다.

same-turn closure:

- strict audit에서 gap이 보이면 같은 턴에서 즉시 patch한다.
- canonical output은 `v32_Augmentation_Results.md` 한 장에 최신 closure 상태를 반영한다.

---

## 8. 완료 기준

- guide 안에 `required / recommended / optional packet` direct floor matrix가 존재한다.
- guide가 packet floor 판단을 위해 operator를 `Packet compliance report`로 내보내지 않는다.
- `Packet compliance report`는 guide floor의 secondary audit/check artifact로 재위치된다.
- guide quick lookup / packet quick lookup / assembly-facing reminder가 새 direct floor semantics와 일관된다.
- 8개 claim surface에 대해 required/recommended/optional relation과 downgrade language가 guide에 직접 존재한다.
- operational artifact family 9종과 example layer가 guide의 packet-floor semantics를 structured rule로 반영한다.
- governance / runtime / overlays / codex가 guide owner boundary를 어기지 않는다.
- `artifact_version`이 rule과 exemplar 양쪽에 유지된다.
- active 규칙 문서에 version-fixed 규범 문구가 남지 않는다.
- `v32_Augmentation_Results.md`가 `v31`의 성과와 `v31`의 남은 gap을 분리해 기록한다.
- runtime behavior 미검증 상태를 숨기지 않는다.
