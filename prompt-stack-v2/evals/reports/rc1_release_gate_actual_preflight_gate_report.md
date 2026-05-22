# RC1 Release Gate Actual Preflight Gate Report

Status: blocked

Stage: v2.0.0-rc.1-release-gate-actual-openai-scope-preflight

- Preflight status: ready_but_blocked_by_missing_explicit_approval
- Can enter actual release gate execution: false
- Can enter release-gated claim: false
- Can enter stable release: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false
- Local endpoint deferred: true
- Reason: Actual release gate preflight is ready, but explicit user approval is required before release gate execution.

## Checks

- pass: check_rc1_release_gate_dry_run_openai_scope.mjs pass
- pass: actual preflight artifacts generated
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: release/rc1_release_gate_actual_openai_scope_preflight_scope.yaml exists
- pass: release/rc1_release_gate_actual_approval_gate.yaml exists
- pass: release/rc1_release_gate_actual_approval_request.md exists
- pass: release/rc1_release_gate_actual_command_plan.yaml exists
- pass: release/rc1_release_gate_actual_preflight_policy.yaml exists
- pass: release/rc1_release_decision_record_preflight.yaml exists
- pass: release/rc1_rollback_readiness.yaml exists
- pass: release/rc1_owner_action_readiness.yaml exists
- pass: release/rc1_local_endpoint_deferred_confirmation.yaml exists
- pass: release/rc1_provider_diversity_deferred_confirmation.yaml exists
- pass: tools/run_rc1_release_gate_actual_preflight_openai_scope.mjs exists
- pass: tools/audit_rc1_actual_gate_readiness.mjs exists
- pass: tools/audit_rc1_rollback_owner_readiness.mjs exists
- pass: tools/check_rc1_release_gate_actual_preflight_openai_scope.mjs exists
- pass: evals/suites/rc1_release_gate_actual_openai_scope_preflight.yaml exists
- pass: evals/reports/rc1_release_gate_actual_preflight_report.json exists
- pass: evals/reports/rc1_release_gate_actual_preflight_report.md exists
- pass: evals/reports/rc1_actual_gate_readiness_report.json exists
- pass: evals/reports/rc1_actual_gate_readiness_report.md exists
- pass: evals/reports/rc1_rollback_owner_readiness_report.json exists
- pass: evals/reports/rc1_rollback_owner_readiness_report.md exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_report.md exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_readiness.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_claim_boundary.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_actual_gate_evidence_readiness.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_rollback_readiness.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_owner_action_readiness.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_local_endpoint_deferred_confirmation.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_provider_diversity_deferred_confirmation.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_decision_record_preflight.json exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_command_plan_snapshot.yaml exists
- pass: evidence/rc1-release-gate-actual-openai-scope-preflight/unresolved_items.json exists
- pass: docs/rc1_release_gate_actual_openai_scope_preflight.md exists
- pass: docs/rc1_release_gate_actual_approval_request.md exists
- pass: docs/rc1_release_gate_actual_command_plan.md exists
- pass: docs/rc1_rollback_readiness.md exists
- pass: docs/rc1_owner_action_readiness.md exists
- pass: docs/next_rc1_release_gate_actual_execution.md exists
- pass: docs/next_local_canary_after_endpoint_ready.md exists
- pass: preflight report status is ready but approval-blocked
- pass: new execution flags remain false
- pass: evidence readiness pass
- pass: rollback and owner readiness pass
- pass: explicit approval remains absent and actual gate cannot execute
- pass: claim boundary remains closed
- pass: local endpoint and provider diversity remain deferred
- pass: actual execution stage scripts were not created
- pass: unresolved items empty
- pass: forbidden positive claims absent
- pass: v36 modified false
