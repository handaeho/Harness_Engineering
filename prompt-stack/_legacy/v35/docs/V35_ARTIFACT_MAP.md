# V35 Artifact Map

## 먼저 볼 문서
- `README.md`
- `PROMPT_USER_GUIDE.md`
- `docs/V35_CURRENT_STATE.md`
- `docs/V35_LIMITATIONS_AND_FOLLOWUPS.md`
- `docs/V35_OPERATING_GUIDE.md`

## Source-of-Truth Stack 위치
- `00_governance/`
- `01_base/`
- `02_overlays/`
- `03_examples/`
- `04_harness/`

## Assembled Bundle 위치
- `99_total/`: source-of-truth stack에서 재생성되는 실제 사용용 assembled prompt bundle.
- `99_total/codex/`: `codex/` 기준 bundled copy. Codex runtime 실행 기준은 `v35/codex/`입니다.

## Codex Runtime 위치
- `codex/AGENTS.md`
- `codex/CODEX_RUNTIME_GUIDE.md`
- `codex/skills/coding-core/SKILL.md`
- `codex/skills/design-analysis/SKILL.md`
- `codex/skills/eval-ops/SKILL.md`
- `codex/skills/grounded-research/SKILL.md`
- `codex/skills/orchestration-control/SKILL.md`

## Active Records
- `records/v35_current_state.json`
- `records/v35_release_manifest.json`
- `records/v35_file_checksums.json`
- `records/v35_limitations_register.json`
- `records/v35_followup_backlog.json`
- `records/v35_active_validation_summary.json`
- `records/v35_release_integrity_closure.json`

## Active Reports
- `reports/V35_CURRENT_STATE_SUMMARY.md`
- `reports/V35_VALIDATION_SUMMARY.md`
- `reports/V35_RELEASE_NOTES.md`
- `reports/V35_ROLLBACK_AND_MONITORING_PLAN.md`
- `reports/V35_CLEANUP_FINAL_REPORT.md`
- `reports/V35_RELEASE_INTEGRITY_CLOSURE_REPORT.md`

## Archived Evidence
세부 release evidence는 active v35 밖의 `_archive/v35_release_evidence_2026-05-19/`에 보존되어 있습니다.
