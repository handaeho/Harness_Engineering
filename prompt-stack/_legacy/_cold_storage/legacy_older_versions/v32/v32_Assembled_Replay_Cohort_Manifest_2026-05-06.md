# v32 Assembled Replay Cohort Manifest 2026-05-06

## Acknowledgment

`Agentic_Design_Patterns.pdf` 반영 수준을 문서-level parity에서 한 단계 올려 보기 위해, `prompt-stack/v32`의 실제 조립 가능한 prompt bundle들을 대상으로 bounded assembled replay cohort를 정의한다.

## Analysis

- `cohort_goal`:
  - guide reflection이 실제 assembled bundle에서 어떻게 행동 경계로 나타나는지 확인
  - 문서 반영과 조립 후 carryover를 분리 검증
  - 과도한 orchestration이나 speculative patch를 억제하는지 함께 확인
- `cohort_id`: `v32-assembled-replay-2026-05-06-a`
- `run_id_policy`:
  - preflight patch round: `r0`
  - replay round after patch: `r1`
- `artifact_version_policy`:
  - `artifact_version=v1` for initial replay cohort
- `shared_identity_summary`:
  - guide source: `Agentic_Design_Patterns.pdf`
  - runtime surface: `01_base`, `02_overlays`, `03_examples`, `codex`
  - excluded as runtime owner: operator-only docs outside the scoped folders

### Scenario identity summary

| `scenario_id` | Primary bundle | Replay focus | Mapped benchmark families |
| --- | --- | --- | --- |
| `AR-S01` | `AGENTS.md -> PROMPT_full -> PROMPT_evaluation_monitoring_overlay -> PROMPT_search_reasoning_overlay -> PROMPT_retrieval_grounding_overlay -> eval-ops -> Guide reflection benchmark memo` | guide-reflection maintenance route | `BR-00`, `BR-02`, `BR-04`, `BR-19` |
| `AR-S02` | `AGENTS.md -> PROMPT_light -> PROMPT_retrieval_grounding_overlay -> PROMPT_search_reasoning_overlay -> grounded-research` | evidence-first chapter reflection | `BR-01`, `BR-14`, `BR-17`, `BR-22` |
| `AR-S03` | `AGENTS.md -> PROMPT_full -> PROMPT_multi_agent_overlay -> PROMPT_tool_protocol_overlay -> orchestration-control` | anti-over-orchestration and A2A sufficiency | `BR-03`, `BR-07`, `BR-13`, `BR-15` |
| `AR-S04` | `AGENTS.md -> PROMPT_standalone -> PROMPT_tool_protocol_overlay -> coding-core` | narrow patch behavior for runtime carryover defects | `BR-05`, `BR-06`, `BR-12`, `BR-16` |
| `AR-S05` | `AGENTS.md -> PROMPT_full -> PROMPT_search_reasoning_overlay -> design-analysis` | replay escalation route choice under cost/risk/budget | `BR-02`, `BR-16`, `BR-20`, `BR-21` |

### Failure class targets

- `stale-owner`
- `operator-only dependency`
- `over-orchestration`
- `speculative patch widening`
- `missing replay escalation artifact`
- `missing limitation downgrade`
- `route-switch failure`
- `late clarification`

## Execution

- `expected_artifact_contract`:
  - preflight: identify whether assembled replay requires stronger operational artifacts beyond document-level benchmark memo
  - if yes, patch only the relevant runtime docs
  - run the fixed scenario cohort without swapping scenario intent
  - preserve `scenario_id`, `run_id`, `cohort_id`, `trace_id`, and `artifact_version`
  - record runner state as `partial replay` unless a stronger isolated harness actually exists
- `trace_id` policy:
  - `trace_id` format: `v32-ar-<scenario_id>-<run_id>`
- `expected_verdict_classes`:
  - `Pass`
  - `Partial Pass`
  - `Fail`
  - `Need Verification`

## Impact & Risk

- 이 cohort는 실제 external replay harness를 대체하지 않는다.
- 이 cohort는 “assembled bundle을 기준으로 reasoning and control carryover를 수동 constrained replay로 점검”하는 수준이다.
- 따라서 `behavior-grade release evidence`나 `model-isolated reproducibility`를 주장하지 않는다.
- 대신 document-grounded benchmark보다 강한 질문은 할 수 있다:
  - bundle이 과한 overlay를 붙이는가
  - multi-agent를 불필요하게 정당화하는가
  - patch를 broad rewrite로 확대하는가
  - replay artifact 승격이 필요한데 memo 수준에 머무는가

## Verification

- Check by:
  1. 각 scenario가 고정 bundle과 고정 질문 의도를 유지하는지 확인한다.
  2. `r0` preflight finding과 `r1` replay verdict를 분리 기록한다.
  3. runner state가 `partial replay`를 넘는 claim을 하지 않는지 확인한다.
