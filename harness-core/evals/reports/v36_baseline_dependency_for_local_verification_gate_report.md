# V36 Baseline Dependency Gate For Local Verification

Status: ready_after_repair

- Compare status: pass
- Owner decision required: false
- Ready for owner decision: true
- Can claim local model verified: false
- Unresolved items: 0

- pass: evidence current_compare_v36_failure_snapshot.json exists
- pass: evidence v36_mismatch_inventory_for_local_verification.json exists
- pass: evidence v36_hash_source_comparison_for_local_verification.json exists
- pass: evidence previous_owner_approved_refresh_comparison.json exists
- pass: evidence v36_git_guardrail_status.json exists
- pass: evidence compare_script_path_cwd_analysis.json exists
- pass: evidence local_verification_gate_dependency_status.json exists
- pass: evidence local_model_verification_owner_packet_status_after_v36_triage.json exists
- pass: evidence v36_baseline_local_verification_decision_request.json exists
- pass: evidence v36_baseline_dependency_for_local_verification_gate_report.json exists
- pass: evidence unresolved_items.json exists
- pass: release/post_stable_v36_baseline_dependency_repair_for_local_verification_scope.yaml exists
- pass: release/post_stable_v36_baseline_local_verification_blocker_update.yaml exists
- pass: release/post_stable_v36_baseline_local_verification_decision_request.yaml exists
- pass: tools/triage_v36_baseline_dependency_for_local_verification.mjs exists
- pass: tools/check_v36_baseline_dependency_for_local_verification.mjs exists
- pass: evals/suites/post_stable_v36_baseline_dependency_repair_for_local_verification.yaml exists
- pass: evals/reports/v36_baseline_dependency_for_local_verification_report.json exists
- pass: evals/reports/v36_baseline_dependency_for_local_verification_report.md exists
- pass: evals/reports/v36_baseline_dependency_for_local_verification_gate_report.json exists
- pass: evals/reports/v36_baseline_dependency_for_local_verification_gate_report.md exists
- pass: docs/v36_baseline_dependency_for_local_verification.md exists
- pass: docs/v36_baseline_local_verification_decision_request.md exists
- pass: docs/next_local_model_verification_final_gate_plan.md exists
- pass: current compare failure snapshot captured
- pass: mismatch inventory recorded
- pass: hash source comparison recorded
- pass: previous owner approved refresh comparison recorded
- pass: guardrail status clean
- pass: compare script path/cwd analysis clean
- pass: local verification dependency status recorded
- pass: owner packet status after triage recorded
- pass: decision request recorded when blocked
- pass: forbidden execution and strong claims remain false
- pass: prohibited claim scan pass
