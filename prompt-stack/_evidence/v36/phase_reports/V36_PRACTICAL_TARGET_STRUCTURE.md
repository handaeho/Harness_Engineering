# V36 Practical Target Structure

## Scope
- mode: dry-run target design
- active_package_path: v36/
- evidence_target_path: _evidence/v36/
- user_approval_required_before_move: true
- user_approval_required_before_rewrite: true

## Active Package Principle
v36 active package는 사용자가 실제로 읽는 현재 문서, 에이전트가 실제 실행에 쓰는 runtime 자산, 현재 state/lifecycle/verification 자산, validation runner와 compact current records만 포함하도록 설계한다.

## Active Structure
- root: README.md, PROMPT_USER_GUIDE.md, AGENTS.md, MASTER_PROMPT_ROUTER.md
- autonomous: 00_governance, 01_base, 02_overlays, 03_examples, 04_harness, 05_state, 06_verification, 07_scope, 08_lifecycle, 99_total
- codex: AGENTS.md, CODEX_RUNTIME_GUIDE.md, skills, validation, actor_packets/README.md
- state: feature_list.json, progress.md, decision_log.md, evidence_log.json, session-handoff.md, index.json
- verification: evaluator-rubric.md, behavioral_benchmark_suite.json, benchmark_suite.json, claim_strength_checklist.json, current_validation_suite.json, current_validation_result.json, validation_readme.md
- lifecycle: init.sh, clean-state-checklist.md, session-start.md, session-closeout.md, handoff-template.md
- docs: CURRENT_STATE.md, OPERATING_GUIDE.md, LIMITATIONS_AND_FOLLOWUPS.md, ARTIFACT_MAP.md, ARCHITECTURE.md, SECURITY.md, RELIABILITY.md, QUALITY_SCORE.md, PLANS.md
- harness: README.md, validate_current_v36.mjs, validate_assembled_bundle.mjs, validate_codex_runtime.mjs, run_smoke_validation.mjs
- validation: current_validation_suite.json, current_validation_result.json, validation_readme.md
- records: v36_current_state.json, v36_release_manifest.json, v36_file_checksums.json, v36_active_validation_summary.json, v36_limitations_register.json, v36_followup_backlog.json, v36_artifact_map.json
- reports: V36_CURRENT_STATE_SUMMARY.md, V36_VALIDATION_SUMMARY.md, V36_RELEASE_NOTES.md, V36_ROLLBACK_AND_MONITORING_PLAN.md, V36_FINAL_STATUS.md

## Evidence Structure
_evidence/v36/ should hold source_collection, source_clone, source_application, behavioral_benchmark, actor_outputs, semantic_judge, ablation, release_decision, validation_runs, archive_traceability, phase_reports, checksums, README.md, evidence_manifest.json, and evidence_checksums.json.

## Missing Target Items To Create After Approval
- reports/V36_FINAL_STATUS.md
- harness/run_smoke_validation.mjs
- verification/validation_readme.md
- records/v36_limitations_register.json
- records/v36_artifact_map.json
