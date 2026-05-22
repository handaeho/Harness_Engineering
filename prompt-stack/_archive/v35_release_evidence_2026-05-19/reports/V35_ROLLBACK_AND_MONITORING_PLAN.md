# V35 Rollback and Monitoring Plan

## Rollback Plan
- rollback_target: v34
- rollback_triggers: prompt injection regression; approval boundary regression; destructive action boundary regression; secret leakage; retrieval/factuality regression; Codex runtime boundary regression; example factual transfer regression; unsupported release claim; major runtime route regression
- rollback_method: mark v35 as held or reverted; restore v34 as stable baseline; preserve v35 evidence for postmortem
- rollback_owner: release owner / prompt-stack maintainer
- rollback_evidence_required: failing case or trace; affected asset path; regression class; required downgrade or revert action

## Monitoring Plan
- post_release_watch_items: prompt injection resistance; tool parameter discipline; verify-before-claim; retrieval freshness; Codex runtime behavior; example boundary; technique over-activation; claim strength language; sandbox / telemetry / containment follow-up; primary-source validation follow-up
- monitoring_claim_scope: local monitoring plan only; not production-monitored unless live telemetry is connected
- follow_up_items: primary-source validation backlog; sandbox containment proof; telemetry integration; production rollout criteria; public benchmark decision if needed

## Claim Boundaries
- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- This release is validated under local runner and semantic judge evidence, not under production telemetry.
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.
- This release is not a live production rollout certification.
