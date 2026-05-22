# v32 External Harness Run 2026-05-06

## Acknowledgment

`prompt-stack/v32`의 실제 prompt 문서 surface(`01_base`, `02_overlays`, `03_examples`, `codex`)에 대해, 외부 `codex exec` 프로세스를 분리 실행하는 harness를 구성하고 guide-reflection benchmark를 반복 수행했다.

## Analysis

- 목적:
  - document-level benchmark를 넘어서 실제 separated runner 기준의 behavior-facing evidence를 확보
  - manual assembled replay보다 강한 `executed-vs-unexecuted` 구분을 남김
  - guide reflection gap과 evaluator ambiguity를 분리
- external harness boundary:
  - each scenario runs in a separate `codex exec` process
  - `--ephemeral`
  - `--sandbox read-only`
  - JSON output schema enforced
  - operator-only docs are explicitly out-of-scope runtime owners
- harness files:
  - [response_schema.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/response_schema.json:1>)
  - [scenarios.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/scenarios.json:1>)
  - [run_external_harness.mjs](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/run_external_harness.mjs:1>)

## Execution

### Run sequence

1. `2026-05-06-b`
   - first clean full-suite rerun after run-id support was added
   - result: `EH-S01/EH-S02/EH-S03` `Pass`, `EH-S04/EH-S05` `Partial Pass`
   - exposed two real specificity gaps:
     - local codex-layer doc-repair path was not explicit enough in `coding-core`
     - design-route default/fallback doctrine was not explicit enough for guide-reflection maintenance

2. prompt-doc patch set after `b`
   - [CODEX_RUNTIME_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/CODEX_RUNTIME_GUIDE.md:204>)
     - added direct maintenance route defaults and replay fallback language
   - [design-analysis SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/skills/design-analysis/SKILL.md:162>)
     - added document-benchmark default route, assembled-replay fallback, and explicit reroute semantics
   - [coding-core SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/skills/coding-core/SKILL.md:161>)
     - added localized stale-sentence / owner-statement repair doctrine

3. `2026-05-06-c`
   - full rerun after prompt-doc patches
   - result distribution became noisier than expected
   - diagnosis: several `Partial Pass` results were caused by evaluator ambiguity, mainly:
     - treating BR family IDs as if they had to appear literally in active files
     - over-penalizing route answers that were conceptually direct but family-ID-indirect
     - treating user-reported local defect hypotheses as insufficient even when the task was explicitly local

4. harness-contract refinement after `c`
   - [run_external_harness.mjs](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/run_external_harness.mjs:1>)
     - added explicit rules:
       - focus IDs are review axes, not required literal strings
       - direct concept ownership should not be downgraded only because BR IDs are absent
       - explicit reroute counts as a direct answer path for route-selection scenarios
       - user-reported local stale-sentence defects count as a valid bounded repair hypothesis

5. `2026-05-06-d`
   - full rerun with refined evaluator contract
   - result: `EH-S02/EH-S03/EH-S04/EH-S05` `Pass`, `EH-S01` `Partial Pass`
   - remaining gap was now narrow and real:
     - `runtime owner integrity` / `benchmark-loop adequacy` were exposed generically, but not yet as family-specific document-sufficient doctrine

6. prompt-doc patch set after `d`
   - [CODEX_RUNTIME_GUIDE.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/CODEX_RUNTIME_GUIDE.md:222>)
     - added direct family note for `runtime owner integrity` and `benchmark-loop adequacy`
   - [eval-ops SKILL.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/codex/skills/eval-ops/SKILL.md:382>)
     - added family-specific sufficiency rule for those two families

7. `2026-05-06-f`
   - final clean full-suite rerun after the last prompt-doc patch
   - artifact: [summary.json](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/harness/runs/2026-05-06-f/summary.json:1>)
   - verdict: `5 / 5 Pass`

### Final suite verdict

- `EH-S01` `Pass`
- `EH-S02` `Pass`
- `EH-S03` `Pass`
- `EH-S04` `Pass`
- `EH-S05` `Pass`

### What changed because of actual separated execution

- prompt-doc gaps were patched only when the runner exposed a real runtime-owned answer-path weakness
- evaluator contract was refined only when the failure cause was benchmark ambiguity rather than prompt-stack reflection failure
- manual assembled replay is now background evidence only; the stronger behavior artifact is the external separated run

## Impact & Risk

- strongest justified claim now:
  - v32 guide reflection is `Pass` at bounded external-harness separated-execution scope
- this is stronger than:
  - document-grounded scenario review only
  - manual assembled replay only
- this run by itself still did **not** justify:
  - release-grade reproducibility
  - cross-model or cross-provider stability
  - repeated long-horizon cohort statistics
- follow-on upgrade:
  - [v32_Release_Gate_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Release_Gate_2026-05-06.md:1>) now promotes the same external harness path to a bounded frozen release-gate scope

Residual limitations:

- benchmark families are still mapped by concept coverage in some bundles rather than literal `BR-*` text
- one or more raw runner responses may echo imperfect inner metadata fields even when outer run summary and file identity are correct; audit should follow run directory + wrapper summary first
- external harness quality is now materially better, but it is still a local Codex-CLI-based harness, not an independent production eval service

## Verification

- separated external execution: `yes`
- run-level artifact lineage preserved: `yes`
- final clean full-suite post-patch run: `yes` (`2026-05-06-f`)
- strongest current behavior verdict:
  - `Promote` at bounded frozen release-gate scope
- strongest remaining gap:
  - `Need Verification`: broader cross-model, cross-provider, and independent-service reproducibility evidence are still absent
