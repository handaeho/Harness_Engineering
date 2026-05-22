# V35 Release Notes

## 1. Release Summary
v35 is finalized from v35_candidate after the Phase 5 release decision Promote to v35.

This release is validated under local runner and semantic judge evidence, not under production telemetry.

## 2. What Changed From v34 to v35
- PromptingGuide.ai-derived coverage was mapped into owner-scoped source-of-truth, example, harness, and evaluation surfaces.
- Native replay semantic judge evidence is complete for 73 required cases.
- Codex runtime semantic judge evidence is complete for 25 required tests.
- Release language is constrained by explicit downgrade boundaries.

## 3. PromptingGuide.ai Augmentation Summary
- Source extraction covered major PromptingGuide.ai section groups.
- Prompt Hub material is structure-only and not factual authority.
- External papers/tools remain separated from source-of-truth doctrine unless independently validated.
- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.

## 4. Harness Engineering Expansion Summary
- Harness contracts distinguish guide, sensor, runner, simulator, sandbox, telemetry, and gate surfaces.
- Trace captured and eval passed are kept separate.
- Missing substrate maps to downgrade language rather than stronger operational claims.

## 5. Codex Runtime Independence Handling
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.
- CODEX_RUNTIME_GUIDE is treated as a host-runtime entrypoint.
- Codex runtime readiness and source-of-truth stack readiness are recorded separately.

## 6. Evaluation Evidence Summary
- native_semantic_judge: 73/73 pass
- codex_runtime_semantic_judge: 25/25 pass
- actor_output_authenticity: 98/98 judgeable
- critical_failures: 0
- P0: 0
- release_blocking_P1: 0
- trace_missing: 0
- claim_strength_violations: 0

## 7. Gates Passed
- pass: 9
- partial_with_downgrade: 2
- fail: 0
- not_evaluated: 0
- partial_with_downgrade gates: Retrieval / RAG / Factuality Gate; Harness Gate

## 8. Downgraded Claims
- primary_source
- sandbox
- telemetry
- containment
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.

## 9. Prohibited Claims
- production-monitored
- containment-verified
- all primary-source items fully validated
- public benchmark certified
- live production rollout certified

## 10. Known Limitations
- Primary-source validation backlog remains deferred for current/model/API/tool factual claims.
- Sandbox existence is not containment proof.
- Local traces are not production telemetry.
- This release is not a live production rollout certification.

## 11. Follow-up Validation Items
- Primary-source validation backlog.
- Sandbox containment proof.
- Telemetry integration.
- Production rollout criteria if a later production rollout is requested.
- Public benchmark decision only if needed for a later certification claim.

## 12. Rollback Condition
Rollback to v34 if a P0 safety failure, release-blocking v34 regression, source/runtime boundary collapse, or load-bearing unsupported release claim is detected.
