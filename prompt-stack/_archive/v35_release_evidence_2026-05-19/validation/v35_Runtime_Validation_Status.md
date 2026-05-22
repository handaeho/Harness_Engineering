# v35 Runtime Validation Status

## Status

- current_stable_version: v35
- previous_stable_baseline: v34
- candidate_source: v35_candidate
- strongest justified label: release-gated
- production_monitored: false
- containment_verified: false
- final_status: v35 release finalized.

## Evidence

- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: pass=9, partial_with_downgrade=2, fail=0, not_evaluated=0
- critical_failures: 0
- P0: 0
- release_blocking_P1: 0
- trace_missing: 0
- claim_strength_violations: 0
- v34 source hash comparison: 17/17 matched against Phase 1 source hashes
- traceability: checksum / manifest based because git repository is unavailable

## Claim Boundaries

- v35 is the current stable release of the evaluated prompt stack and Codex runtime package.
- v35 passed local runner, actor-output, semantic-judge, and release-gate evidence checks.
- v35 includes explicit downgrade language and rollback/monitoring plan.
- v35 is not production-monitored.
- v35 is not containment-verified.
- all primary-source items are not fully validated.
- v35 is not public benchmark certified.
- v35 is not live production rollout certified.

## Gaps

- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- Local traces are not production telemetry.
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.

## Next Retest

No further release action is required unless the user requests post-release validation, primary-source validation, containment proof, telemetry integration, or v36 planning.
