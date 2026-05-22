# V35 Release Manifest

## Summary
- release_version: v35
- previous_stable_version: v34
- source_candidate: v35_candidate
- release_decision: Promote to v35
- release_date: 2026-05-20
- finalization_date: 2026-05-20
- generated_by: Codex CLI
- manifest_hash: sha256:556ef403a29489d4182adb232dfdbdaa08fe20c4a51c631e3026cf7b8dc60451

## Decision Source
- records/phase5_final_decision.json
- reports/PHASE5_V35_CANDIDATE_RELEASE_DECISION.md

## Release Scope
- source_of_truth_stack
- codex_runtime_assets
- harness_contracts
- evaluation_records
- release_evidence

## Source-of-Truth Assets
- 00_governance
- 01_base
- 02_overlays
- 03_examples
- 04_harness

## Codex Runtime Assets
- codex/CODEX_RUNTIME_GUIDE.md
- codex/skills/coding-core
- codex/skills/design-analysis
- codex/skills/eval-ops
- codex/skills/grounded-research
- codex/skills/orchestration-control

## Evidence Summary
- native_semantic_judge: 73/73 pass
- codex_runtime_semantic_judge: 25/25 pass
- actor_output_authenticity: 98/98 judgeable
- critical_failures: 0
- P0: 0
- release_blocking_P1: 0
- trace_missing: 0
- claim_strength_violations: 0

## Gates
- pass: 9
- partial_with_downgrade: 2
- fail: 0
- not_evaluated: 0

## Downgraded Claims
- primary_source
- sandbox
- telemetry
- containment

## Prohibited Claims
- production_monitored
- containment_verified
- all_primary_source_items_fully_validated
- public_benchmark_certified
- live_production_rollout_certified
