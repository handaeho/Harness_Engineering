# RC1 Release Gate Actual Gate Report

Status: pass

Stage: v2.0.0-rc.1-release-gate-actual-openai-scope

- Can enter RC1 OpenAI-scope release-gated claim: true
- Can enter stable release: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false
- Local endpoint deferred: true
- Reason: OpenAI-only RC1 release gate passed; stable, production, provider-diverse, and local-model claims remain blocked.

## Checks

- pass: actual gate artifacts generated
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: release/rc1_release_gate_actual_openai_scope_scope.yaml exists
- pass: release/rc1_release_gate_actual_approval_record.json exists
- pass: release/rc1_release_gate_actual_openai_scope.yaml exists
- pass: release/rc1_release_gate_actual_blocker_update.yaml exists
- pass: release/rc1_release_gate_actual_claim_boundary.yaml exists
- pass: release/rc1_local_endpoint_deferred_final.yaml exists
- pass: release/rc1_provider_diversity_deferred_final.yaml exists
- pass: release/rc1_release_decision_record.yaml exists
- pass: release/rc1_release_decision_record.json exists
- pass: tools/run_rc1_release_gate_actual_openai_scope.mjs exists
- pass: tools/check_rc1_release_gate_actual_openai_scope.mjs exists
- pass: tools/audit_rc1_release_gate_actual_claims.mjs exists
- pass: tools/summarize_rc1_release_gate_actual_result.mjs exists
- pass: evals/suites/rc1_release_gate_actual_openai_scope.yaml exists
- pass: evals/reports/rc1_release_gate_actual_report.json exists
- pass: evals/reports/rc1_release_gate_actual_report.md exists
- pass: evals/reports/rc1_release_gate_actual_claim_boundary_report.json exists
- pass: evals/reports/rc1_release_gate_actual_claim_boundary_report.md exists
- pass: evals/reports/rc1_release_decision_record.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_report.md exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_criteria_results.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_claim_boundary.md exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_decision_record.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_local_endpoint_deferred_final.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_provider_diversity_deferred_final.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_not_stable_final_notice.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_blocker_update.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/rc1_release_gate_actual_approval_record.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope/unresolved_items.json exists
- pass: docs/rc1_release_gate_actual_openai_scope.md exists
- pass: docs/rc1_release_gate_actual_claim_boundary.md exists
- pass: docs/rc1_release_decision_record.md exists
- pass: docs/rc1_not_stable_final_notice.md exists
- pass: docs/next_rc1_post_release_gate_review.md exists
- pass: docs/next_local_canary_after_endpoint_ready.md exists
- pass: docs/next_telemetry_connection_plan.md exists
- pass: preflight was ready before approval
- pass: exact approval phrase present
- pass: actual gate report passed scoped OpenAI-only evaluation
- pass: criteria results pass
- pass: no provider/local/telemetry/production execution occurred
- pass: required prerequisite evidence passed
- pass: claim boundary records scoped release gate and blocks stronger claims
- pass: release decision record matches actual gate report
- pass: local and provider deferral final records pass
- pass: not-stable final notice and blocker update pass
- pass: unresolved items empty
- pass: forbidden positive claims absent
- pass: v36 modified false
