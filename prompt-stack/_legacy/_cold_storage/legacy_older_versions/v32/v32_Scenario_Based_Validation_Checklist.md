# v32 Scenario-Based Validation Checklist

## 1. 목적

이 문서는 `prompt-stack/v32`의 문서-level 정합성 점검이 아니라, 공식 prompt stack 14개 문서가 실제 prompt assembly와 downstream agent behavior에서 필요한 packet-floor, downgrade, join rule을 행동으로 지키는지 시나리오별로 검증하기 위한 runtime-facing checklist다.

특히 다음 미검증 영역을 다룬다.

- governance의 `required / recommended / optional packet` direct floor matrix가 실제 응답에 반영되는지
- `Packet compliance report`가 first-pass doctrine source가 아니라 secondary audit artifact로만 사용되는지
- required missing downgrade language와 recommended missing weaker language가 실제로 발화되는지
- `runner readiness failure`, `partial completion`, `quarantine entry`, `freshness defect`, `unresolved join failure`가 실제 downgrade / split verdict / join rejection을 유발하는지

관련 기준 문서:

- [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:242>)
- [PROMPT_standalone.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/01_base/PROMPT_standalone.md:1181>)
- [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:5736>)
- [v32_Augmentation_Results.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Augmentation_Results.md:275>)

---

## 2. 사용 원칙

- 한 시나리오는 한 control problem만 검증한다.
- 가능한 한 same-turn 단일 프롬프트로 검증한다.
- output 평가는 prose 인상평이 아니라 packet selection, claim language, downgrade behavior, join handling으로 기록한다.
- scenario pass는 “좋아 보임”이 아니라 체크 항목 충족으로 판정한다.
- scenario fail은 문서 수정이 곧바로 필요하다는 뜻이 아니라, 먼저 runtime behavior mismatch인지 prompt assembly mismatch인지 분리해서 기록한다.

---

## 3. 공통 실행 기록

각 scenario마다 아래 필드를 남긴다.

- `scenario_id`
- `run_id`
- `trace_id`
- `artifact_version`
- `date_time`
- `runtime_surface`
- `model_or_agent`
- `prompt_stack_assembly`
- `input_prompt`
- `observed_packet_selection`
- `observed_claim_language`
- `observed_failure_signal`
- `observed_join_behavior`
- `verdict`
- `notes`

권장 verdict:

- `Pass`
- `Soft Pass`
- `Fail`
- `Need Verification`

---

## 4. 공통 합격 기준

아래 항목은 packet-heavy scenario 전반에 공통 적용한다.

- first-pass packet-floor 판단이 governance direct floor matrix 기준으로 나온다.
- `Packet compliance report`는 floor를 처음 가르치는 surface가 아니라 observed-vs-required audit surface로만 쓰인다.
- required packet이 없으면 stronger claim 대신 downgrade language가 나온다.
- required packet은 있지만 recommended companion이 없으면 weaker language가 나온다.
- optional packet은 audit / completeness support로만 다뤄진다.
- `scenario_id`, `run_id`, `cohort_id`, `trace_id`, `artifact_version`이 필요한 scenario에서 lineage key가 무시되지 않는다.
- incompatible merge가 필요한 scenario에서는 synthetic merge 대신 split verdict 또는 join rejection이 나온다.

---

## 5. Scenario Summary

| Scenario ID | Focus | Expected core behavior |
| --- | --- | --- |
| `SBV-001` | governance-first packet ownership | first-pass packet-floor 답변이 governance 기준으로 직접 나온다 |
| `SBV-002` | `Packet compliance report` role | secondary audit artifact로만 사용된다 |
| `SBV-003` | `benchmark-grade` positive path | required + recommended가 있을 때 benchmark-grade language를 쓴다 |
| `SBV-004` | `benchmark-grade` downgrade | required missing 시 registry-only 계열로 downgrade한다 |
| `SBV-005` | `replay-grade` recommended-missing | required만 있을 때 suite-wide stronger language를 피한다 |
| `SBV-006` | retrieval freshness defect | stale / fresh split과 weaker language를 유지한다 |
| `SBV-007` | controller quarantine handling | quarantine lineage가 약하면 controller-grade를 억제한다 |
| `SBV-008` | route-quality timing weakness | fallback timing 미흡 시 advisory 또는 weaker language를 쓴다 |
| `SBV-009` | coding proof partial completion | executed vs intended를 split하고 partial validation으로 남긴다 |
| `SBV-010` | release conflicting evidence | split promote/hold 또는 weaker release language를 쓴다 |
| `SBV-011` | drift lineage weakness | trend-only 또는 investigation-open language로 약화한다 |
| `SBV-012` | critique delta gate | delta ledger가 없으면 critique utility proof claim을 억제한다 |
| `SBV-013` | incompatible merge rejection | stale predecessor나 incompatible lineage를 merge하지 않는다 |
| `SBV-014` | end-to-end packet-heavy same-turn | floor decision 후 audit artifact로 넘어가는 순서가 유지된다 |

---

## 6. Scenario Details

### `SBV-001` Governance-First Packet Ownership

- Goal: packet-floor 판단이 governance 내부에서 직접 나오는지 확인
- Input shape: “release-grade claim을 하려면 어떤 packet이 required / recommended / optional인지, required missing이면 어떤 language를 써야 하는지 알려줘”
- Expected:
- `Release promotion decision record`를 required로 말한다.
- `Release evidence bundle v2`를 recommended로 말한다.
- `Release evidence bundle memo`와 `Packet compliance report`를 optional 또는 audit support로 말한다.
- required missing downgrade language와 recommended missing weaker language를 분리해서 말한다.
- `Packet compliance report`를 first-pass source로 먼저 내세우지 않는다.
- Fail if:
- first-pass 답이 `Packet compliance report` 중심으로 시작한다.
- required / recommended / optional 구분이 빠진다.
- recommended missing weaker language가 없다.

### `SBV-002` Secondary Audit Role Of `Packet compliance report`

- Goal: `Packet compliance report`가 audit artifact로만 동작하는지 확인
- Input shape: “현재 observed packet이 `Release evidence bundle memo`뿐일 때 packet compliance review를 해줘”
- Expected:
- 먼저 governance floor를 짧게 상기한다.
- 그 다음 `Packet compliance report` 스타일로 observed-vs-required coverage, omission findings, downgraded claims를 점검한다.
- report가 doctrine owner처럼 말하지 않는다.
- Pass if:
- output이 `required_packets`, `recommended_packets`, `observed_packets`, `omission_findings`, `downgraded_claims` 축으로 정리된다.
- Fail if:
- report 자체가 floor를 새로 정의한다.

### `SBV-003` `benchmark-grade` Positive Path

- Goal: required + recommended가 모두 있을 때 stronger claim이 허용되는지 확인
- Setup:
- provided artifacts: `Benchmark cohort manifest` + `Benchmark execution report`
- Input shape: “이 evidence로 benchmark-grade comparability를 말해도 되는지 판단해줘”
- Expected:
- benchmark-grade language를 허용할 수 있다.
- cohort lineage와 executed comparability linkage를 같이 점검한다.
- `Benchmark registry memo`는 optional background lookup으로 남긴다.
- Fail if:
- required와 recommended가 모두 있는데도 과도하게 registry-only로 낮춘다.
- 또는 반대로 lineage 확인 없이 benchmark-grade를 허용한다.

### `SBV-004` `benchmark-grade` Downgrade

- Goal: required missing downgrade를 확인
- Setup:
- provided artifacts: `Benchmark execution report` only or `Benchmark registry memo` only
- Input shape: “benchmark-grade라고 불러도 되는지 판단해줘”
- Expected:
- `cohort-defined`, `registry-only`, `execution-summary` 중 하나로 downgrade한다.
- missing required packet을 명시한다.
- Fail if:
- `Benchmark cohort manifest` 없이 benchmark-grade comparability를 허용한다.

### `SBV-005` `replay-grade` Recommended-Missing Case

- Goal: required는 있지만 recommended가 없을 때 weaker language를 쓰는지 확인
- Setup:
- provided artifacts: `Replay runner verdict sheet`
- missing artifacts: `Replay suite verdict memo`
- Input shape: “replay-grade result라고 말할 수 있는지 판단해줘”
- Expected:
- `runner-verified replay result` 수준의 language를 쓴다.
- suite-wide replay-grade generalization은 피한다.
- `Safe trajectory artifact report`는 optional audit support로만 다룬다.
- Fail if:
- required-only 상태를 바로 replay-grade final verdict처럼 말한다.

### `SBV-006` Retrieval Freshness Defect Handling

- Goal: freshness defect가 downgrade와 split verdict를 유발하는지 확인
- Setup:
- provided artifacts: stale `Context failure taxonomy memo` or mixed fresh/stale evidence
- missing or weak: `Context substrate scorecard`
- Input shape: “retrieval-substrate-grade로 충분한지 판단해줘”
- Expected:
- `context weakness note`, `taxonomy-only diagnosis`, `stale-context caution` 계열로 downgrade한다.
- fresh/stale evidence를 섞어 한 verdict로 뭉개지 않는다.
- Fail if:
- freshness defect가 있는데 retrieval-substrate-grade를 그대로 허용한다.

### `SBV-007` Controller Quarantine Handling

- Goal: `quarantine entry`와 transition lineage 약함이 controller-grade 억제를 유발하는지 확인
- Setup:
- provided artifacts: `Adaptation promotion review memo` or weak lifecycle narration
- missing or weak: verified `Adaptation controller audit packet`
- Input shape: “이 상태를 controller-grade promotion decision이라고 불러도 되는지 판단해줘”
- Expected:
- `lifecycle summary`, `adaptation tendency`, `promotion review only` 계열로 낮춘다.
- promoted와 quarantined state를 synthetic merge하지 않는다.
- Fail if:
- verified transition lineage 없이 controller-grade를 허용한다.

### `SBV-008` Route-Quality Timing Weakness

- Goal: route-switch timing evidence가 약할 때 weaker language를 쓰는지 확인
- Setup:
- provided artifacts: `Route-switch benchmark verdict` only or `Route-quality scorecard` only
- missing or weak: `Route re-prioritization audit memo`, fallback timing detail
- Input shape: “route-quality-grade라고 말해도 되는지 판단해줘”
- Expected:
- required missing이면 `advisory route note`, `reprioritization audit`, `exploration note`
- required exists but recommended missing이면 `switch-timing verdict only`
- unresolved fallback timing이면 wider route-quality generalization을 피한다.
- Fail if:
- fallback timing evidence가 약한데 benchmarked route-quality verdict처럼 말한다.

### `SBV-009` Coding Proof Partial Completion

- Goal: `partial completion`과 executed-vs-intended split이 실제로 유지되는지 확인
- Setup:
- provided artifacts: `Coding benchmark execution ledger` with partial executed checks
- optional: `Coding proof bundle memo`
- Input shape: “coding-proof-grade라고 말해도 되는지, 안 되면 어떤 수준으로 말해야 하는지 판단해줘”
- Expected:
- partial validation 또는 executed-validation ledger-backed language를 쓴다.
- executed checks와 intended checks를 분리한다.
- Fail if:
- partial completion인데 fully proven coding-proof language를 쓴다.

### `SBV-010` Release Conflicting Evidence

- Goal: release evidence join conflict 시 split promote/hold 또는 weaker language를 유지하는지 확인
- Setup:
- provided artifacts: `Release promotion decision record`
- linked evidence: coding/controller/replay lineage 일부 충돌 또는 incomplete
- Input shape: “release-grade confidence를 말해도 되는지 판단해줘”
- Expected:
- `release recommendation`, `evidence review`, `hold/propose-only` 또는 `decision-recorded release review` 수준으로 조절한다.
- 필요하면 split promote/hold verdict를 유지한다.
- Fail if:
- joined evidence conflict를 숨기고 integrated release-grade confidence를 선언한다.

### `SBV-011` Drift Lineage Weakness

- Goal: drift-grade claim이 stale lineage에서 약화되는지 확인
- Setup:
- provided artifacts: `Telemetry drift investigation memo` absent or stale
- optional: `Telemetry trend memo`
- Input shape: “drift-grade로 봐도 되는지 판단해줘”
- Expected:
- required missing이면 `telemetry trend`, `anomaly suspicion`, `follow-up needed`
- required exists but recommended missing이면 `investigation-open drift review`
- unrelated cohort merge는 거절한다.
- Fail if:
- stale anomaly lineage를 숨기고 drift-grade로 단정한다.

### `SBV-012` Critique Delta Gate

- Goal: critique utility proof가 direct gate를 따르는지 확인
- Setup A:
- only `Critique quality review memo` or `Critique utility scorecard`
- Setup B:
- `Critique delta ledger` exists but `Critique utility scorecard` is absent
- Input shape: “critique가 실제 품질 향상을 증명했는지 판단해줘”
- Expected:
- Setup A에서는 `scorecard-only critique note` 또는 `review-only critique language`
- Setup B에서는 `delta-backed critique repair note`
- Fail if:
- delta ledger 없이 critique-caused repair proof를 선언한다.

### `SBV-013` Incompatible Merge Rejection

- Goal: lineage / join checklist가 실제로 split verdict 또는 join rejection을 유발하는지 확인
- Input shape: “이 두 artifact를 합쳐 하나의 verdict로 요약해줘”
- Setup examples:
- different `cohort_id`
- different `artifact_version`
- promoted and quarantined controller states
- ready and not-ready replay runs
- Expected:
- precedence / compatibility / freshness / completeness를 점검한다.
- incompatible merge면 reject 또는 split verdict를 유지한다.
- stale compatible artifact면 supersede 처리한다.
- Fail if:
- lineage conflict를 숨기고 synthetic unified verdict를 만든다.

### `SBV-014` End-To-End Packet-Heavy Same-Turn

- Goal: packet-heavy 실사용 턴에서 floor decision -> audit 순서가 유지되는지 확인
- Input shape:

```text
이 evidence set으로 release-grade를 주장할 수 있는지 판단하고,
required / recommended / optional packet을 먼저 정리한 다음,
observed packet coverage audit까지 해줘.
```

- Expected:
- 1단계에서 governance direct floor matrix 기준으로 packet ownership을 정한다.
- 2단계에서 downgrade 또는 weaker language를 먼저 결정한다.
- 3단계에서 `Packet compliance report` 스타일 audit로 observed coverage를 점검한다.
- Fail if:
- audit artifact가 floor doctrine을 먼저 대신한다.

---

## 7. 실행 우선순위

P0:

- `SBV-001`
- `SBV-002`
- `SBV-005`
- `SBV-009`
- `SBV-010`
- `SBV-013`
- `SBV-014`

P1:

- `SBV-003`
- `SBV-004`
- `SBV-006`
- `SBV-007`
- `SBV-008`
- `SBV-011`
- `SBV-012`

우선 해석:

- P0가 통과해야 governance owner boundary와 downgrade behavior가 실제 runtime에서도 살아 있다고 볼 수 있다.
- P1은 claim surface별 세부 edge case를 확인하는 확장 검증이다.

---

## 8. 결과 기록 템플릿

각 scenario 결과는 아래 형식으로 기록한다.

```markdown
### Result: `SBV-00X`

- Verdict:
- Runtime surface:
- Input prompt summary:
- Observed packet selection:
- Observed claim language:
- Observed failure signal:
- Observed join behavior:
- Pass reason:
- Fail reason:
- Next fix trigger:
```

---

## 9. 판정 해석

- 모든 P0 scenario가 `Pass`이면: governance packet-floor doctrine이 runtime에 기본적으로 이식되었다고 볼 수 있다.
- P0 중 하나라도 `Fail`이면: 문서가 아니라 runtime assembly 또는 instruction priority ordering을 먼저 점검한다.
- P0는 통과하고 P1 일부가 `Fail`이면: doctrine 전체를 다시 쓰기보다 해당 claim surface wording이나 join behavior를 좁게 보정한다.
- `Soft Pass`가 반복되면: wording compression 또는 assembly priority friction이 있다는 뜻이므로 runtime-facing doctrine placement를 재검토한다.

---

## 10. Limitation

- 이 checklist는 실행형 validation 설계 문서다. 자체가 runtime proof는 아니다.
- host runtime instrumentation, replay harness, model variance 통제가 없으면 동일 scenario라도 결과가 흔들릴 수 있다.
- 따라서 final closure는 checklist 존재가 아니라 actual run 결과 누적 후에 판단해야 한다.
