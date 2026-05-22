# V35 Current State

## 상태
- current_stable_version: `v35`
- release_scope: 평가된 prompt stack과 Codex runtime package.
- validation_scope: local runner, actor-output, semantic-judge, release-gate evidence.
- production_autonomy_certified: false.

## Core Asset
- source_of_truth_stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`
- assembled_bundle: `99_total/`
- codex_runtime_assets: `codex/AGENTS.md`, `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/*/SKILL.md`
- current_harness_entrypoint: `harness/validate_current_v35.mjs`

## Integrity Closure State
- source_to_99_total_parity: 17/17 pass
- codex_to_99_total_codex_parity: 7/7 pass
- archive_checksum: 588/588 pass
- current_validation: 137/137 pass
- validation_checksum_policy: `validation/current_validation_result.json` and `validation/runs/*.json` are mutable outputs excluded from the immutable checksum manifest.

## Validation State
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: 9 pass, 2 partial with downgrade, 0 fail
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- trace missing: 0
- claim strength violations: 0

## Downgrade State
- primary_source: downgrade follow-up backlog
- sandbox: downgrade
- telemetry: downgrade
- containment: downgrade

## Follow-Up State
현재 follow-up은 `records/v35_followup_backlog.json`에 기록되어 있고, 사람이 읽는 요약은 `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`에 있습니다.
