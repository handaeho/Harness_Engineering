# V36 Structure Normalization Dry-run

## 1. Current Structure
- root entries: directory:_archive, directory:_evidence, file:CURRENT_STABLE_VERSION.txt, directory:_legacy, directory:records, file:RELEASE_INDEX.md, directory:v36, directory:v36_candidate
- v36 active files: 126
- evidence files: 2463
- candidate files: 2517
- legacy files: 1967
- archive files: 771

## 2. v36 Active Cleanup Candidates
- records_to_move: v36/records/hard_cleanup_empty_dirs.json, v36/records/hard_cleanup_final_report.json, v36/records/hard_cleanup_inventory.json, v36/records/hard_cleanup_record_moves.json, v36/records/hard_cleanup_report_moves.json
- reports_to_move: v36/reports/HARD_CLEANUP_FINAL_REPORT.md, v36/reports/HARD_CLEANUP_INVENTORY.md
- keep_active: active runtime docs, autonomous/, codex/, state/, verification/, lifecycle/, harness/, validation/, current records, current reports
- review_needed: none for Option 1

## 3. Candidate Relocation Plan
- current: v36_candidate/
- proposed: _candidates/v36_candidate/
- references_to_update: RELEASE_INDEX.md, records/release_history.json
- approval_required: true

## 4. Legacy Structure Plan
- keep: _legacy/v35/, _legacy/v34/
- move_to_cold_storage: _legacy/99_original/, _legacy/v14/, _legacy/v15/, _legacy/v16/, _legacy/v17/, _legacy/v18/, _legacy/v19/, _legacy/v20/, _legacy/v21/, _legacy/v22/, _legacy/v23/, _legacy/v24/, _legacy/v25/, _legacy/v26/, _legacy/v27/, _legacy/v28/, _legacy/v29/, _legacy/v30/, _legacy/v31/, _legacy/v32/, _legacy/v33/
- approval_required: true

## 5. Archive / Evidence Plan
- keep_or_consolidate: keep _archive and _evidence separate for lowest risk; consolidate only after explicit approval
- proposed_moves: _archive/v35_release_evidence_2026-05-19/ -> _evidence/v35/release_evidence_2026-05-19/, _archive/v36_release_evidence_2026-05-20/ -> _evidence/v36/release_evidence_2026-05-20/
- references_to_update: records/release_history.json
- approval_required: true

## 6. Target Root Structure
- proposed_tree: CURRENT_STABLE_VERSION.txt, RELEASE_INDEX.md, records/release_history.json, v36/, _evidence/, _candidates/ optional, _legacy/v35, _legacy/v34, _legacy/_cold_storage/ optional

## 7. Performance Preservation Checks
- autonomous_risk: low if autonomous/ is untouched and assembled bundle validation passes
- codex_risk: low if codex/ is untouched and Codex runtime validation passes
- validation_risk: low for Option 1; medium for path relocation options
- evidence_risk: low for cleanup artifact moves; medium for archive consolidation

## 8. Recommended Execution Plan
- step_1: Option 1 minimal cleanup only: move hard cleanup records/reports to evidence and update artifact map/checksums
- step_2: Optional root cleanup: move candidate and older legacy only after pointer-impact approval
- step_3: Optional archive/evidence consolidation only after registry/checksum approval
- required_user_approvals: choose Option 1, Option 2, or Option 3

## 9. Recommendation
Recommendation:
Ready for structure normalization execution after user selects an option

Dry-run status: no files moved, no files deleted, no runtime assets modified.
