# RUNBOOK v35

## 1. Stable Status

- current_stable_version: v35
- previous_stable_baseline: v34
- candidate_source: v35_candidate
- release_decision: Promote to v35
- final_status: v35 release finalized.
- traceability: checksum / manifest based
- git_repository_available: false

## 2. Release Scope

v35 is the current stable release of the evaluated prompt stack and Codex runtime package.

Included stable surfaces:

- source-of-truth stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`
- Codex runtime package: `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/*`
- harness contracts and local runner evidence
- Phase 5 release evidence
- v35 release manifest, checksum record, release notes, rollback plan, and closeout status

## 3. Evidence Floor

- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: pass=9, partial_with_downgrade=2, fail=0, not_evaluated=0
- critical_failures: 0
- P0: 0
- release_blocking_P1: 0
- trace_missing: 0
- claim_strength_violations: 0

## 4. Allowed Claims

- v35 is the current stable release of the evaluated prompt stack and Codex runtime package.
- v35 was promoted from v35_candidate after release gate evaluation.
- v35 passed local runner, actor-output, semantic-judge, and release-gate evidence checks.
- v35 includes explicit downgrade language and rollback/monitoring plan.

## 5. Prohibited Claims

- Do not claim v35 as production-monitored.
- Do not claim v35 as containment-verified.
- Do not claim all primary-source items as fully validated.
- Do not claim v35 as public benchmark certified.
- Do not claim v35 as live production rollout certified.

## 6. Downgrade Boundaries

- Primary-source deferred items remain downgraded and must not be treated as release-grade current facts.
- Sandbox and telemetry gaps limit production-readiness claims.
- Containment remains downgraded unless containment proof is produced.
- This release is validated under local runner and semantic judge evidence, not under production telemetry.
- Codex runtime readiness was evaluated behaviorally; codex/skills are not treated as textual mirrors of 00~04.
- This release is not a live production rollout certification.

## 7. Follow-up Backlog

- Primary-source validation: track deferred items and keep current/latest model/API/tool claims downgraded until official-source validation exists.
- Sandbox / containment: keep sandbox partial and containment downgrade separate.
- Telemetry: keep local traces distinct from production telemetry.
- Codex runtime watch: manage codex/skills as independent runtime packages and route changes through validation plus backport review.
- Drift monitoring: watch prompt injection resistance, approval boundary, destructive action boundary, retrieval/factuality, example boundary, technique over-activation, verify-before-claim, claim strength language, and Codex runtime routing.

## 8. Key Artifacts

- `v35/records/v35_release_manifest.json`
- `v35/reports/V35_RELEASE_MANIFEST.md`
- `v35/records/v35_file_checksums.json`
- `v35/reports/V35_RELEASE_NOTES.md`
- `v35/reports/V35_ROLLBACK_AND_MONITORING_PLAN.md`
- `v35/reports/V35_RELEASE_FINALIZATION_REPORT.md`
- `v35/records/v35_release_closeout_status.json`
- `v35/reports/V35_RELEASE_CLOSEOUT_STATUS.md`
- `RELEASE_INDEX.md`
- `CURRENT_STABLE_VERSION.txt`
- `records/release_history.json`

## 9. Stop Rule

No further release action is required unless the user requests post-release validation, primary-source validation, containment proof, telemetry integration, or v36 planning.
