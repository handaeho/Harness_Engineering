# V36 Practical File Classification

## Scope
- mode: dry-run classification only
- total_files_classified: 2546
- files_moved: 0
- docs_rewritten: 0

## Summary By Classification
| classification | count |
|---|---:|
| archive_only | 1 |
| keep_active | 79 |
| keep_runtime_agent_doc | 8 |
| move_to_evidence | 2434 |
| review_needed | 6 |
| rewrite_korean_current_doc | 18 |

## Summary By Proposed Action
| proposed_action | count |
|---|---:|
| archive | 1 |
| keep | 87 |
| move | 2434 |
| no_op | 6 |
| rewrite | 18 |

## Korean Current-doc Rewrite Candidates
| path | proposed location | reason |
|---|---|---|
| docs/ARCHITECTURE.md | docs/ARCHITECTURE.md | Human-facing current doc should be Korean and current-only. |
| docs/ARTIFACT_MAP.md | docs/ARTIFACT_MAP.md | Human-facing current doc should be Korean and current-only. |
| docs/CURRENT_STATE.md | docs/CURRENT_STATE.md | Human-facing current doc should be Korean and current-only. |
| docs/LIMITATIONS_AND_FOLLOWUPS.md | docs/LIMITATIONS_AND_FOLLOWUPS.md | Human-facing current doc should be Korean and current-only. |
| docs/OPERATING_GUIDE.md | docs/OPERATING_GUIDE.md | Human-facing current doc should be Korean and current-only. |
| docs/PLANS.md | docs/PLANS.md | Human-facing current doc should be Korean and current-only. |
| docs/QUALITY_SCORE.md | docs/QUALITY_SCORE.md | Human-facing current doc should be Korean and current-only. |
| docs/RELIABILITY.md | docs/RELIABILITY.md | Human-facing current doc should be Korean and current-only. |
| docs/SECURITY.md | docs/SECURITY.md | Human-facing current doc should be Korean and current-only. |
| harness/README.md | harness/README.md | Harness user doc should be Korean and current-only. |
| operator_checklist.md | docs/OPERATOR_CHECKLIST.md | Operational checklist is useful, but should be Korean and placed under docs if kept active. |
| PROMPT_USER_GUIDE.md | PROMPT_USER_GUIDE.md | Primary user-facing doc should be Korean and current-only. |
| README.md | README.md | Primary user-facing doc should be Korean and current-only. |
| reports/V36_CURRENT_STATE_SUMMARY.md | reports/V36_CURRENT_STATE_SUMMARY.md | Human-facing current document should be Korean and current-only. |
| reports/V36_RELEASE_NOTES.md | reports/V36_RELEASE_NOTES.md | Human-facing current document should be Korean and current-only. |
| reports/V36_ROLLBACK_AND_MONITORING_PLAN.md | reports/V36_ROLLBACK_AND_MONITORING_PLAN.md | Human-facing current document should be Korean and current-only. |
| reports/V36_VALIDATION_SUMMARY.md | reports/V36_VALIDATION_SUMMARY.md | Human-facing current document should be Korean and current-only. |
| validation/validation_readme.md | validation/validation_readme.md | Validation user doc should be Korean and current-only. |

## Evidence Move Candidate Sample
| path | proposed evidence location | reason |
|---|---|---|
| 04_upgraded_prompt_assets/README.md | _evidence/v36/phase_reports/04_upgraded_prompt_assets/README.md | Construction-stage asset copy/metadata, not active runtime structure. |
| 04_upgraded_prompt_assets/v36_asset_metadata_index.json | _evidence/v36/phase_reports/04_upgraded_prompt_assets/v36_asset_metadata_index.json | Construction-stage asset copy/metadata, not active runtime structure. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-codex_without_runtime_guide.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-codex_without_runtime_guide.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-codex_without_skill_selection_rule.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-codex_without_skill_selection_rule.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-full_harness.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-full_harness.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_clean_state_checklist.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_clean_state_checklist.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_evaluator_rubric.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_evaluator_rubric.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_progress.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_progress.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_scope_policy.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_scope_policy.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_session_handoff.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_session_handoff.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/ablation/PKT-ABL-remove_state_feature_list.json | _evidence/v36/actor_outputs/ablation/PKT-ABL-remove_state_feature_list.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-001.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-001.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-002.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-002.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-003.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-003.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-004.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-004.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-005.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-005.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-006.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-006.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-007.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-007.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-008.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-008.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-009.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-009.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-010.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-010.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-011.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-011.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-012.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-012.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-013.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-013.json | Raw behavioral evidence should be separated from active package. |
| archive/behavioral_evidence/actor_outputs/autonomous/PKT-AUTO-014.json | _evidence/v36/actor_outputs/autonomous/PKT-AUTO-014.json | Raw behavioral evidence should be separated from active package. |

## Classification Verdict
분류 결과는 dry-run이며 실제 이동이나 rewrite는 수행하지 않았다. 전체 파일별 세부 disposition은 records/v36_practical_file_classification.json에 기록했다.
