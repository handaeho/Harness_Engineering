# v35 Augmentation Plan

## 1. Status

- release_version: v35
- previous_stable_baseline: v34
- candidate_source: v35_candidate
- release_decision: Promote to v35
- finalization_status: finalized

This document is the v35 stable augmentation overview. The older v34 augmentation plan remains preserved under `v34/`; this v35 document records the stable state after PromptingGuide.ai augmentation, behavior verification, semantic judge, release gate, and finalization.

## 2. Augmentation Scope

v35 incorporates PromptingGuide.ai-derived material as mapped coverage, not as unbounded policy import.

In-scope augmentation surfaces:

- source-of-truth prompt stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`
- Prompt Hub structure-only example handling
- retrieval / RAG / factuality discipline
- tool and function-calling boundaries
- safety and misuse boundaries
- evaluation and release-gate evidence discipline
- Codex runtime package independence

## 3. Evidence Summary

- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gate: pass=9, partial_with_downgrade=2, fail=0, not_evaluated=0
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- trace missing: 0
- claim-strength violations: 0

## 4. Downgraded Claims

- primary_source: deferred items remain downgraded and are not release-grade current facts.
- sandbox: sandbox existence is not containment proof.
- telemetry: local traces are not production telemetry.
- containment: containment remains downgraded unless proof exists.

## 5. Prohibited Claims

- production-monitored
- containment-verified
- all primary-source items fully validated
- public benchmark certified
- live production rollout certified

## 6. Follow-up Backlog

- Validate deferred primary-source items before stronger current/model/API/tool claims.
- Collect containment proof before containment-verified language.
- Connect live telemetry before production-monitored language.
- Retest Codex runtime changes before backport or source-of-truth promotion.
