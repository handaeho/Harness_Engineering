# v33 Assembled Replay Cohort Manifest 2026-05-18

## Acknowledgment

`v33`에서는 old manual assembled replay를 standalone authority로 두지 않고, separated external harness와 frozen release gate를 중심으로 assembled-bundle behavior cohort를 정의한다.

## Analysis

- `cohort_id`: `v33-assembled-replay-2026-05-18-a`
- runtime surface:
  - [AGENTS.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/AGENTS.md:1>)
  - [01_base](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/01_base:1>)
  - [02_overlays](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/02_overlays:1>)
  - [03_examples](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/03_examples:1>)
  - [codex](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/codex:1>)
- execution artifacts:
  - single-run harness: [v33_External_Harness_Run_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_External_Harness_Run_2026-05-18.md:1>)
  - repeated gate: [v33_Release_Gate_2026-05-18.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/v33_Release_Gate_2026-05-18.md:1>)

### Scenario identity summary

| `scenario_id` | Primary bundle | Replay focus | Mapped benchmark families |
| --- | --- | --- | --- |
| `AR-S01` | `AGENTS.md -> PROMPT_full -> eval overlay -> search overlay -> retrieval overlay -> eval-ops` | document benchmark vs stronger replay artifact ladder | `BR-00`, `BR-19` |
| `AR-S02` | `AGENTS.md -> PROMPT_light -> retrieval overlay -> search overlay -> grounded-research` | prompt chaining / Appendix A / official-source freshness | `BR-01`, `BR-14`, `BR-17`, `BR-22` |
| `AR-S03` | `AGENTS.md -> PROMPT_full -> multi-agent overlay -> tool overlay -> orchestration-control` | anti-over-orchestration and single-agent sufficiency | `BR-03`, `BR-07`, `BR-13`, `BR-15` |
| `AR-S04` | `AGENTS.md -> PROMPT_standalone -> tool overlay -> guardrails overlay -> coding-core` | smallest-safe repair path for prompt-package defects | `BR-05`, `BR-06`, `BR-12`, `BR-16` |
| `AR-S05` | `AGENTS.md -> PROMPT_full -> search overlay -> retrieval overlay -> design-analysis` | route choice under cost / risk / evidence-strength constraints | `BR-02`, `BR-16`, `BR-20`, `BR-21` |

### Failure class targets

- `runtime-owner regression`
- `official-source omission`
- `external-data instruction bleed`
- `over-orchestration`
- `speculative patch widening`
- `verification-loop omission`
- `missing stronger-artifact route`

## Verification

- source scenario registry:
  - [scenarios.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/harness/scenarios.json:1>)
- frozen version:
  - [manifest.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v33/harness/freezes/rg-2026-05-18-a/manifest.json:1>)
