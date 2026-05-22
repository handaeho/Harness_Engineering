# v32 Assembled Replay Runner Verdict 2026-05-06

## Acknowledgment

`v32-assembled-replay-2026-05-06-a` cohort에 대해 assembled bundle replay를 수동 constrained runner 방식으로 실행한 결과를 기록한다.

## Analysis

- `cohort_id`: `v32-assembled-replay-2026-05-06-a`
- `run_id`: `r1`
- `artifact_version`: `v1`
- `replay_scope`:
  - primary skill bundles 5개
  - fixed scenario intents 5개
  - guide reflection maintenance 관련 control boundary 확인
- `runner_execution_state`:
  - `preflight patch applied at r0`
  - `manual constrained assembled-bundle replay completed at r1`
  - `no isolated external runner harness`
  - `no model-separated baseline/candidate A-B harness`
  - `OCR spot-checks used only where guide expectation needed extra grounding`
- `run_linkage`:
  - manifest: [v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md:1>)
  - strategy: [v32_Guide_Reflection_Benchmark_Strategy.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Guide_Reflection_Benchmark_Strategy.md:1>)
- supersession state:
  - stronger behavior artifact now exists in [v32_External_Harness_Run_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_External_Harness_Run_2026-05-06.md:1>)

## Execution

- `replay_verdict`: `partial replay pass`

| `scenario_id` | `trace_id` | Replay prompt summary | Observed bundle behavior | Verdict |
| --- | --- | --- | --- | --- |
| `AR-S01` | `v32-ar-AR-S01-r1` | guide-reflection maintenance를 benchmark -> verify -> patch -> rerun 루프로 수행하되 speculation과 과한 구조를 피하라 | `eval-ops` 중심 route, retrieval only when evidence needed, fixed benchmark set 유지, stronger replay artifacts로 escalation 가능, limitation downgrade 유지 | `Pass` |
| `AR-S02` | `v32-ar-AR-S02-r1` | Prompt Chaining / Appendix A reflection을 evidence-first로 설명하고 limitation을 명시하라 | evidence target first, OCR/문서 근거 우선, provenance/conflict/freshness boundary 유지, advanced prompting을 runtime aid로만 취급 | `Pass` |
| `AR-S03` | `v32-ar-AR-S03-r1` | guide reflection maintenance에 multi-agent/A2A가 필요한지 결정하라 | single-agent sufficiency를 먼저 판정, no forced A2A, parallelization은 join artifact가 있을 때만 허용 | `Pass` |
| `AR-S04` | `v32-ar-AR-S04-r1` | operator-only owner defect가 있으면 narrow patch와 verification만 수행하라 | active slice 고정, minimal diff 선호, broad rewrite 회피, targeted search verification로 claim strength 제한 | `Pass` |
| `AR-S05` | `v32-ar-AR-S05-r1` | document-level benchmark에서 assembled replay로 escalation할지 cost/risk/budget 기준으로 비교하라 | small candidate set 유지, one best route + one fallback 제시, route escalation을 decision-linked하게 유지 | `Pass` |

### `r0` preflight finding

- finding class: `missing replay escalation artifact`
- observed gap:
  - guide-reflection maintenance route가 document-level benchmark artifact에는 충분했지만
  - actual assembled replay로 올라갈 때 `Benchmark cohort manifest`, `Replay runner verdict sheet`, `Replay suite verdict memo`로 어떻게 승격하는지가 direct하지 않았다
- patch applied:
  - [CODEX_RUNTIME_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/CODEX_RUNTIME_GUIDE.md:204>)
  - [eval-ops SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/skills/eval-ops/SKILL.md:362>)
  - [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:6551>)

### Reproducibility note

- scenario intent는 고정했다
- bundle order는 manifest 기준으로 고정했다
- verdict는 assembled docs를 근거로 한 수동 constrained replay다
- isolated harness, raw logs, separate model reruns는 없다

### Replay failure note

- `runner readiness failure`: 없음
- `partial completion`: 없음
- `unresolved join failure`: 없음
- `freshness defect`: guide는 local PDF 기준으로만 확인했으며 external freshness 문제는 없음

## Impact & Risk

- runner 차원에서는 5개 scenario 모두 의도한 control behavior를 보였다
- 다만 이 결과는 여전히 `partial replay`다
- 즉, “조립된 문서군이 그렇게 행동하도록 보인다”는 수준이지, “독립 harness에서도 같은 결과가 반복된다”까지는 아니다
- strongest remaining risk:
  - context leakage를 완전히 배제하지 못함
  - separate-run nondeterminism을 측정하지 못함

## Verification

- Check that runner state is explicit: `yes`
- Check that verdict is not stronger than the runner state: `yes`
- Check that preflight patch is separated from replay verdict: `yes`
