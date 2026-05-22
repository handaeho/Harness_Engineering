# Phase 9 v36 Release Decision

## 1. Decision Summary
- decision: Promote to v36
- current_stable: v35
- working_candidate: v36_candidate
- release_target: v36
- release_decision_started: true
- release_decision_completed: true
- final_claim_strength: release-decision-approved-for-phase10-finalization

## 2. Evidence Reviewed
- source collection: 38/38 required records collected; 1999 source files hashed.
- source application proof: Source application complete with deferred non-blockers; P0 0, P1 0, P2 0, P3 1.
- v35 baseline: checksum 75/75 pass; stable pointer remains v35.
- concept map: records/concept_map.json and records/harness_subsystem_coverage.json.
- architecture decision: records/v36_architecture_decision.json.
- asset construction: records/v36_asset_inventory.json and records/v36_asset_metadata_index.json.
- 99_total decision: assembled bundle validator 18/18 pass.
- Codex runtime decision: Codex runtime validator 17/17 pass; Codex benchmark 15/15 pass.
- behavioral benchmark: 65/65 pass.
- semantic judge: completed; average score 4; critical failures 0.
- ablation: 9 real read-only variants executed.
- archive traceability: pass; broken links 0.
- validation: validate_current_v36 107/107; validate_assembled_bundle 18/18; validate_codex_runtime 17/17.
- release gate re-evaluation: 10 pass, 0 partial, 0 fail, 0 not_evaluated.
- missing evidence: none blocking Phase 9.
- downgraded evidence: production telemetry, containment proof, broader provider diversity, five archive-only source items.

## 3. Gate Results
### Source Collection Gate
- result: pass
- evidence: records/source_inventory.json, records/source_hash_manifest.json, records/source_language_matrix.json, records/source_completeness_recheck.json
- missing_evidence: none
- downgrade_or_scope_out: No all-primary-source-validated claim; coverage proof is source inventory and mapping evidence.
- blocker: none
- required_follow_up: none

### Source Application Gate
- result: pass
- evidence: records/source_completeness_recheck.json, records/lecture_to_asset_application_matrix.json, records/git_asset_application_matrix.json, records/missing_application_gap_register.json, records/source_application_validation_result.json
- missing_evidence: none
- downgrade_or_scope_out: Five archive-only source items remain P3 non-blockers.
- blocker: none
- required_follow_up: none

### v35 Baseline Gate
- result: pass
- evidence: prompt-stack/CURRENT_STABLE_VERSION.txt, v35/records/v35_file_checksums.json, records/phase0_v35_integrity_findings.json
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Harness Subsystem Gate
- result: pass
- evidence: records/harness_scorecard.json, records/harness_subsystem_coverage.json
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Autonomous Agent Asset Gate
- result: pass
- evidence: records/assembled_bundle_integrity.json, autonomous/99_total/, records/behavioral_judge_results.json
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Codex Runtime Gate
- result: pass
- evidence: records/codex_runtime_integrity.json, codex/CODEX_RUNTIME_GUIDE.md, records/behavioral_judge_results.json
- missing_evidence: none
- downgrade_or_scope_out: Codex runtime readiness is behavioral alignment/runtime fitness evidence, not text mirror parity.
- blocker: none
- required_follow_up: none

### State and Lifecycle Gate
- result: pass
- evidence: state/feature_list.json, state/progress.md, state/session-handoff.md, lifecycle/init.sh, lifecycle/clean-state-checklist.md, records/behavioral_judge_results.json
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Verification Gate
- result: pass
- evidence: validation/current_validation_result.json, records/assembled_bundle_integrity.json, records/codex_runtime_integrity.json, records/actor_output_validation_result.json, records/behavioral_judge_results.json, records/real_ablation_results.json
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Safety and Scope Gate
- result: pass
- evidence: records/behavioral_judge_results.json, docs/SECURITY.md, autonomous/07_scope/SCOPE_POLICY.md
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Archive and Traceability Gate
- result: pass
- evidence: records/archive_traceability_closure.json, archive/raw_benchmark_runs/, archive/behavioral_evidence/
- missing_evidence: none
- downgrade_or_scope_out: none
- blocker: none
- required_follow_up: none

### Release Language Gate
- result: pass
- evidence: verification/claim_strength_checklist.json, records/v36_claim_scope_and_downgrades.json, reports/V36_RELEASE_DECISION.md
- missing_evidence: none
- downgrade_or_scope_out: Production telemetry, containment proof, all-primary-source validation, public benchmark certification, and live production rollout certification are explicitly not claimed.
- blocker: none
- required_follow_up: none

## 4. Numeric Criteria
- source coverage: 38/38
- lecture mapping: 12/12
- Git asset disposition: 38/38 required coverage records; 12 major Git asset rows
- behavioral benchmark: 65/65
- Codex runtime benchmark: 15/15
- ablation variants: 9
- validation runner: 107/107
- assembled bundle validation: 18/18
- Codex runtime validation: 17/17
- critical failures: 0
- P0: 0
- release-blocking P1: 0
- claim strength violations: 0
- safety regression: false
- verification regression: false
- source/runtime boundary regression: false
- archive broken links: 0

## 5. Claim Scope and Downgrades
- allowed_claims: v36_candidate passed Phase 9 release decision gates. | v36_candidate is approved for Phase 10 finalization if the user explicitly approves Phase 10. | Source application proof is complete with deferred non-blockers. | Behavioral benchmark evidence is candidate-local and read-only actor/judge evidence. | Codex runtime readiness is supported by runtime fitness and behavioral boundary evidence.
- downgraded_claims: production telemetry: not available; not production-monitored | containment proof: not established; do not claim containment-verified | provider diversity: broader provider diversity remains a confidence improvement item, not a blocker | archive-only source items: five items remain archive-only P3 non-blockers | primary-source validation: source coverage and mapping are evidenced; do not claim all-primary-source-validated
- prohibited_claims: production-monitored | containment-verified | all-primary-source-validated | public-benchmark-certified | live-production-rollout-certified | current stable v36 before Phase 10 finalization | Codex runtime as autonomous source stack mirror
- production_readiness_limitations: No production telemetry is attached. | No live rollout certification is attached.
- containment_limitations: Safety and approval boundaries passed candidate tests, but containment proof is not established.
- telemetry_limitations: Evidence is local/candidate evidence plus archived actor/judge traces, not production monitoring.
- primary-source limitations: Source inventory, hash, coverage, and mapping are evidenced; this is not a blanket all-primary-source-validated claim.
- provider-diversity limitations: Behavioral execution used the approved local/Codex CLI path; broader provider diversity would increase confidence.
- Codex runtime readiness scope: Codex runtime package is separate from autonomous source assets. | Codex runtime is evaluated by behavior alignment, safety preservation, and runtime fitness, not text parity.

## 6. Regression vs v35
- improved: State and Lifecycle subsystem readiness; source/runtime boundary separation; behavioral evidence coverage.
- unchanged: v35 remains current stable until Phase 10; v35 rollback baseline remains intact.
- regressed: none observed in candidate-local read-only evidence.
- unknown: production telemetry, containment proof, broader provider diversity.
- safety_regression: false
- verification_regression: false
- source_runtime_boundary_regression: false

## 7. Final Decision
Decision:
Promote to v36

Rationale:
- All Phase 9 gates pass with no fail and no not_evaluated result.
- Source application proof is complete with deferred non-blockers.
- Behavioral benchmark and Codex runtime benchmark pass.
- Real read-only ablation was executed.
- P0 and release-blocking P1 are zero.
- Known downgrades are explicit and do not support stronger production or containment claims.
- v35 remains current stable until Phase 10 finalization.

## 8. If Promoted
- new_release_candidate: v36_candidate approved for Phase 10 finalization.
- promotion_scope: release decision only; no file-system promotion performed in Phase 9.
- release_claim: approved to proceed to Phase 10 v36 finalization after user approval.
- downgraded_claims: production telemetry, containment proof, all-primary-source validation, provider diversity, archive-only source items.
- prohibited_claims: production-monitored, containment-verified, all-primary-source-validated, public-benchmark-certified, live-production-rollout-certified, current stable v36 before Phase 10.
- required_phase10_finalization: copy candidate to v36, update stable pointer, update release index/history, generate final manifest/checksums, run final validation.
- rollback_condition: any Phase 10 copy, checksum, pointer, archive, or validation failure must keep v35 as current stable.
- follow_up_items: broaden provider diversity, add production telemetry only after real deployment, add containment proof if needed.

## 10. Next Step
- if Promote to v36: proceed to Phase 10 v36 finalization only after user approval.
- otherwise: remain on v35 stable and continue targeted remediation.

Phase 9 did not create prompt-stack/v36, did not update CURRENT_STABLE_VERSION.txt, and did not update release_history as current stable v36.
