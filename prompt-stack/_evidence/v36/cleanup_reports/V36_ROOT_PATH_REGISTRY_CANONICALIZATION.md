# V36 Root Path & Registry Canonicalization Report

## 1. Scope
- current_stable: v36
- canonical_legacy_root: _legacy/
- canonical_evidence_root: _evidence/
- canonical_candidates_root: _candidates/
- root_release_registry: records/release_history.json
- records_rename_performed: false

## 2. Path Repairs
- legacy_refs_before: 22 matched lines
- legacy_refs_after: 0 non-canonical refs
- legacy_version_refs_before: 0 matched lines
- legacy_version_refs_after: 0 refs
- root_cold_storage_refs_before: 8 matched lines
- root_cold_storage_refs_after: 0 non-canonical refs
- files_modified: RELEASE_INDEX.md, records/release_history.json, v36/docs/ARTIFACT_MAP.md, v36/records/artifact_map.json, v36/reports/STRUCTURE_NORMALIZATION_EXECUTION_REPORT.md, v36/reports/V36_STRUCTURE_NORMALIZATION_DRY_RUN.md, v36/reports/V36_STRUCTURE_NORMALIZATION_INVENTORY.md, v36/harness/validate_current.mjs

## 3. Root Records Plan
- root_records_files_before: records/final_cleanup_repair_backups, records/release_history.json, records/v36_finalization_pre_action_snapshot.json, records/v36_finalization_preflight.json
- root_records_files_after: records/release_history.json
- keep_registry: records/release_history.json
- moved_to_evidence: _evidence/v36/root_records/v36_finalization_pre_action_snapshot.json, _evidence/v36/root_records/v36_finalization_preflight.json, _evidence/v36/release_pointer_repairs/final_cleanup_repair_backups
- review_needed: none
- release_history_kept: true
- records_rename_performed: false

## 4. Validator and Artifact Map
- validate_current_v36: pass (177/177 pass; actual runner: v36/harness/validate_current.mjs)
- artifact_map: pass
- release_index: pass
- release_history: pass
- current_stable_pointer: pass

## 5. Validation
- validate_current_v36: 177/177 pass
- validate_assembled_bundle: 18/18 pass
- validate_codex_runtime: 17/17 pass
- broken_links: 0
- prohibited_claims: 0
- checksum_drift: 0

## 6. Recommendation
Recommendation:
Ready for harness-creator-adapter reinforcement
