# v32 Scenario Validation Run - 2026-05-06

## 1. Scope Correction

- This run now evaluates **prompt-performance-affecting documents only**.
- Included surface:
  - `00_governance/PROMPT_guideline.md`
  - `01_base/*`
  - `02_overlays/*`
  - `03_examples/*`
- Excluded from the core v32 prompt-performance verdict:
  - `PROMPT_USER_GUIDE.md`
  - `codex/CODEX_RUNTIME_GUIDE.md`
  - `AGENTS.md`
  - `codex/skills/*`

Reason:

- `PROMPT_USER_GUIDE.md` and `CODEX_RUNTIME_GUIDE.md` are operator-facing or host-runtime-facing documents.
- They may improve discoverability or Codex-side ergonomics, but they do not by themselves define the core v32 prompt stack behavior.
- Therefore they must not be used as primary authority when claiming v32 prompt performance.

## 2. External Guide Grounding

Source:

- `Agentic_Design_Patterns.pdf`

OCR-grounded pages consulted:

- p.0 TOC: chapter map
- p.183: goal setting and monitoring
- p.199: exception handling and recovery with ordered fallback
- p.206, p.208: HITL / human oversight
- p.217: agentic RAG and source validation
- p.232: A2A agent discovery
- p.247: resource-aware routing across model tiers
- p.271: reasoning/action loop
- p.290: guardrail structured output validation
- p.309, p.322: evaluation, monitoring, trajectory, qualitative judging

## 3. Main Correction

The previous validation method was too guide-dependent.

Actual performance gap:

- first-pass packet-floor ownership was described most directly in non-runtime documents
- this was not sufficient to guarantee prompt behavior from the official 14-document stack alone

Runtime-affecting fix applied:

- [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:866>)
  - added a governance-owned `Direct packet floor matrix / claim-language gate`
  - made `Packet compliance report` explicitly secondary to that governance-owned floor
- [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:5736>)
  - changed `Packet compliance report` doctrine owner from `PROMPT_USER_GUIDE` to `PROMPT_guideline`
  - aligned operational exemplar inheritance to the governance-owned floor
- [v32_Scenario_Based_Validation_Checklist.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Scenario_Based_Validation_Checklist.md:1>)
  - removed the non-performance `SBV-000` operator-doc scenario
  - re-scoped the checklist to the official prompt stack

## 4. Final Verdict

### P0

- `SBV-001` `Pass`
- `SBV-002` `Pass`
- `SBV-005` `Pass`
- `SBV-009` `Pass`
- `SBV-010` `Pass`
- `SBV-013` `Pass`
- `SBV-014` `Pass`

### P1

- `SBV-003` `Pass`
- `SBV-004` `Pass`
- `SBV-006` `Pass`
- `SBV-007` `Pass`
- `SBV-008` `Pass`
- `SBV-011` `Pass`
- `SBV-012` `Pass`

## 5. Why These Passes Now Count

### Ownership and audit split

`SBV-001`, `SBV-002`, `SBV-014` now rest on performance-affecting documents:

- governance first-pass packet-floor doctrine in [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:866>)
- packet-floor matrix rows in [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:879>)
- secondary-audit-only `Packet compliance report` structure in [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:5736>)

### Claim-surface-specific packet floors

`SBV-003` to `SBV-012` now rest on two runtime surfaces:

- governance matrix in [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:879>)
- operational exemplars with inherited fields such as `required_packet_floor`, `recommended_companions`, `optional_companions`, `downgrade_language`, and `join_caution` in [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:7600>)

### Failure-flow and join behavior

`partial completion`, `quarantine entry`, `freshness defect`, and incompatible-join handling remain visible in:

- [PROMPT_guideline.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/00_governance/PROMPT_guideline.md:254>)
- [PROMPT_evaluation_monitoring_overlay.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/02_overlays/PROMPT_evaluation_monitoring_overlay.md:1217>)
- [PROMPT_example_catalog.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/03_examples/PROMPT_example_catalog.md:7623>)

## 6. Residual Limitation

- `Need Verification`: this scenario run itself is still a document-grounded validation, not an isolated-harness benchmark replay with measured model outputs.
- Follow-on evidence now exists:
  - strongest behavior artifact: [v32_Release_Gate_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Release_Gate_2026-05-06.md:1>)
  - predecessor external harness run: [v32_External_Harness_Run_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_External_Harness_Run_2026-05-06.md:1>)
  - [v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Cohort_Manifest_2026-05-06.md:1>)
  - [v32_Assembled_Replay_Runner_Verdict_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Runner_Verdict_2026-05-06.md:1>)
  - [v32_Assembled_Replay_Suite_Verdict_2026-05-06.md](</c:/WORK/0.개인/PROMPT/prompt-stack/v32/v32_Assembled_Replay_Suite_Verdict_2026-05-06.md:1>)
- `Need Verification`: bounded frozen release-gate reproducibility now exists, but broader cross-model / cross-provider reproducibility is still absent.
- `Need Verification`: full 482-page PDF semantic diff was not executed page-by-page.
- Strong claim justified:
  - the official 14-document prompt stack now directly owns the packet-floor and downgrade doctrine required by the current scenario checklist
- Stronger claim not yet justified:
  - end-to-end measured behavior superiority across repeated live runs
