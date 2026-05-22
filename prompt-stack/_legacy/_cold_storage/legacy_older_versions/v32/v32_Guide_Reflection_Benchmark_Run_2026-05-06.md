# v32 Guide Reflection Benchmark Run 2026-05-06

## Acknowledgment

`Agentic_Design_Patterns.pdf` 기준으로 `prompt-stack/v32`의 실제 프롬프트 문서군(`01_base`, `02_overlays`, `03_examples`, `codex`)에 대해 chapter-family benchmark를 실행하고, 질문-답변-검증-패치-재검증 루프를 수행했다.

## Analysis

- Benchmark registry: [v32_Guide_Reflection_Benchmark_Strategy.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Guide_Reflection_Benchmark_Strategy.md:1>)
- Guide scope:
  - core chapters 1-21
  - `Appendix A / Advanced Prompting Techniques`
- Verification boundary:
  - in-scope answer surface는 `01_base`, `02_overlays`, `03_examples`, `codex`만 인정
  - `00_governance`는 owner-boundary verification용 reference만 허용
- Live limitation:
  - 이 결과는 document-grounded benchmark run이다
  - assembled prompt replay, model-output cohort benchmark, runner-linked execution ledger는 아직 없음

### Iteration summary

- Iteration 1:
  - `Pass`: 19
  - `Soft Fail`: 3
  - `Fail`: 1
  - `Need Verification`: 0
- Iteration 2:
  - `Pass`: 23
  - `Soft Fail`: 0
  - `Fail`: 0
  - `Need Verification`: 1 global limitation only

### Patch log

- [CODEX_RUNTIME_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/CODEX_RUNTIME_GUIDE.md:204>)
  - added `Prompt-stack guide reflection / benchmark maintenance`
  - added `Guide chapter-family quick lookup`
  - corrected packet-floor owner to governance-owned matrix
- [eval-ops SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/skills/eval-ops/SKILL.md:27>)
  - added guide-reflection benchmark use case
  - added explicit benchmark loop and stop rule
- [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:6551>)
  - added `Guide reflection benchmark memo`
- [PROMPT_example_injection.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_injection.md:197>)
  - added guide-reflection / chapter-family parity benchmark activation cue

## Execution

### Benchmark verdict sheet

| ID | Family | Short answer summary from in-scope docs | Iteration 1 | Iteration 2 |
| --- | --- | --- | --- | --- |
| `BR-00` | Runtime owner integrity | runtime packet-floor audit는 governance-owned matrix를 참조해야 하고 operator-only guide를 owner로 쓰면 안 된다 | `Fail` | `Pass` |
| `BR-01` | Prompt Chaining | staged dependency가 reliability를 높일 때 chaining을 쓰되 stage boundary, dependency, validation을 explicit하게 유지한다 | `Soft Fail` | `Pass` |
| `BR-02` | Routing | correctness, evidence fit, safety, cost, dominant control problem으로 route를 고르고 필요시 reroute한다 | `Pass` | `Pass` |
| `BR-03` | Parallelization | independent work에만 fan-out하고 join artifact, validation step, parallelism cap을 남긴다 | `Pass` | `Pass` |
| `BR-04` | Reflection | bounded critique만 허용하고 no-gain loop가 되면 checkpoint, reroute, or stop 한다 | `Pass` | `Pass` |
| `BR-05` | Tool Use | read/write/destructive distinction, capability fit, partial state, semantic success를 분리한다 | `Pass` | `Pass` |
| `BR-06` | Planning | `Plan(optional)`이 기본이며 known path면 micro-plan, destructive/costly path면 visible approval checkpoint를 둔다 | `Pass` | `Pass` |
| `BR-07` | Multi-Agent | orchestration은 control gain이 있을 때만 쓰고 role, contract, join, accountability를 분명히 한다 | `Pass` | `Pass` |
| `BR-08` | Memory Management | continuity는 smallest relevant state만 보존하고 stale memory가 현재 instruction을 이기지 못한다 | `Pass` | `Pass` |
| `BR-09` | Learning and Adaptation | repeated judged signals는 `Learning-signal review memo`와 `Adaptation decision memo`로 분리 처리한다 | `Pass` | `Pass` |
| `BR-10` | MCP | capability discovery, contract shape, MCP handoff, operator reuse path를 별도 artifact로 보존한다 | `Pass` | `Pass` |
| `BR-11` | Goal Setting and Monitoring | goal-state contract, progress check, replan trigger, stop condition을 내부적으로 유지한다 | `Pass` | `Pass` |
| `BR-12` | Exception Handling and Recovery | recovery ladder와 localized rollback / safer fallback / propose-only escalation을 명시한다 | `Pass` | `Pass` |
| `BR-13` | Human-in-the-Loop | review_owner, approval_event, acceptance state를 분리하고 destructive/broad path는 stronger review를 건다 | `Pass` | `Pass` |
| `BR-14` | Knowledge Retrieval / RAG | evidence target first, provenance/freshness/conflict explicit, smallest evidence slice 사용 | `Pass` | `Pass` |
| `BR-15` | Inter-Agent Communication / A2A | task lifecycle state, handoff owner, task ID, async status, join readiness를 유지한다 | `Pass` | `Pass` |
| `BR-16` | Resource-Aware Optimization | complexity / risk / budget / graceful degradation으로 control depth와 route를 조정한다 | `Pass` | `Pass` |
| `BR-17` | Reasoning Techniques | decomposition, step-back, self-consistency, ReAct, bounded reasoning은 justified path에서만 쓴다 | `Pass` | `Pass` |
| `BR-18` | Guardrails / Safety | layered guardrails, containment, escalation, disclosure boundary, unsafe-path refusal을 유지한다 | `Pass` | `Pass` |
| `BR-19` | Evaluating and Monitoring | metric, threshold, owner, action과 prompt-stack reflection용 explicit benchmark loop를 유지한다 | `Soft Fail` | `Pass` |
| `BR-20` | Prioritization | next best action ranking, re-prioritization trigger, dependency-aware ordering을 유지한다 | `Pass` | `Pass` |
| `BR-21` | Exploration and Discovery | bounded frontier, stop condition, cheaper fallback, stronger-route trigger를 유지한다 | `Pass` | `Pass` |
| `BR-22` | Appendix A / Advanced Prompting | advanced prompting family는 runtime aid이며 policy owner가 아니고 structure-only reuse만 허용한다 | `Soft Fail` | `Pass` |

### Detailed fail-to-pass notes

- `BR-00`
  - Question: 실제 runtime 문서가 packet-floor owner를 어디에 두는가?
  - Iteration 1 answer: `CODEX_RUNTIME_GUIDE`에 `PROMPT_USER_GUIDE.md` owner 문장이 남아 있었다.
  - Verification: user objection과 guide reflection 목표에 직접 충돌. operator-only 문서가 runtime owner처럼 보였다.
  - Patch: `PROMPT_guideline` direct packet floor matrix owner로 교정.
  - Iteration 2 answer: `Packet compliance report`는 audit-only, first-pass owner는 governance matrix로 정리됨.

- `BR-01`
  - Question: Codex layer에서 prompt chaining family를 바로 찾을 수 있는가?
  - Iteration 1 answer: base prompt에는 강하지만 codex layer에는 direct lookup이 거의 없었다.
  - Verification: scoped folders 전체 기준에서는 의미 coverage가 있었지만 `codex` carryover가 약했다.
  - Patch: `CODEX_RUNTIME_GUIDE`에 guide chapter-family quick lookup과 maintenance bundle 추가.
  - Iteration 2 answer: codex layer에서도 `Prompt Chaining / Planning` family가 direct maintenance surface로 노출된다.

- `BR-19`
  - Question: guide reflection 자체를 위한 benchmark loop가 actual prompt docs에 직접 있는가?
  - Iteration 1 answer: 일반 release/eval doctrine은 있었지만 chapter-family Q/A/rerun loop는 직접적이지 않았다.
  - Verification: current task를 future runtime이 반복 수행할 때 indirect 조합에 의존했다.
  - Patch: `eval-ops`에 guide-reflection benchmark loop와 stop rule 추가, `CODEX_RUNTIME_GUIDE`에 maintenance route 추가.
  - Iteration 2 answer: question-set fixation, answerability check, patch/rerun doctrine이 runtime-facing 문장으로 직접 보인다.

- `BR-22`
  - Question: advanced prompting appendix family를 benchmark-maintenance context에서 안정적으로 구조화할 수 있는가?
  - Iteration 1 answer: Appendix A family 자체는 반영되어 있었지만 guide-reflection benchmark용 stable artifact는 없었다.
  - Verification: maintenance task에서 advanced-family reflection을 기록하는 geometry가 indirect했다.
  - Patch: `Guide reflection benchmark memo` 추가, example injection activation cue 추가.
  - Iteration 2 answer: appendix-family reflection도 benchmark artifact로 직접 기록 가능해졌다.

### Final stop-rule check

- core chapters 1-21: `Pass`
- `Appendix A / Advanced Prompting Techniques`: `Pass`
- operator-only dependency for required runtime behavior: 제거됨
- stale owner in scoped runtime docs: 제거됨
- remaining limitation: isolated harness 기반 benchmark execution은 아직 부재

## Impact & Risk

- 현재 v32는 guide chapter-family를 document-grounded benchmark 기준으로는 직접 반영한다고 볼 수 있다.
- 이번 패치는 broad rewrite가 아니라 `codex`와 `examples`의 maintenance carryover를 보강하는 좁은 diff였다.
- 가장 중요한 개선은 “guide를 읽은 사람이 수동으로 해석해야만 되는 상태”에서 “runtime docs가 guide-reflection benchmark 작업 자체를 직접 수행할 수 있는 상태”로 바뀐 점이다.
- 남은 위험은 behavior-level evidence 부재다. 즉, 문서 reflection은 통과했지만 실제 assembled prompt를 모델에 먹여 반복 replay한 것은 아니다.

## Verification

- Document-level verdict: `Pass`
- Behavior-level verdict: `Promote` at bounded frozen release-gate scope
- Strongest behavior artifact:
  - [v32_Release_Gate_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Release_Gate_2026-05-06.md:1>)
  - frozen cohort aggregate: [release-gate-r01-r07-aggregate.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/freezes/rg-2026-05-06-a/runs/release-gate-r01-r07-aggregate.json:1>)
- Background replay artifacts only:
  - [v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md:1>)
  - [v32_Assembled_Replay_Runner_Verdict_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Runner_Verdict_2026-05-06.md:1>)
  - [v32_Assembled_Replay_Suite_Verdict_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Suite_Verdict_2026-05-06.md:1>)
- Release-gate supersession:
  - strongest behavior artifact is now [v32_Release_Gate_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Release_Gate_2026-05-06.md:1>)
  - frozen cohort aggregate: [release-gate-r01-r07-aggregate.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/freezes/rg-2026-05-06-a/runs/release-gate-r01-r07-aggregate.json:1>)
  - current behavior-level status: `Promote` at bounded frozen release-gate scope
  - stronger remaining gaps are now broader cohort expansion, cross-model / cross-provider reproducibility, and independent external eval service equivalence
- Strongest remaining validation gap:
  1. broader cohort expansion
  2. repeated separate-run stability 미측정
  3. release-grade promotion evidence는 아직 없음
