# Post-RC Production Monitoring Values Preflight Gate Report

Status: fail

- Stage: v2.0.0-post-rc-production-monitoring-values-owner-and-window-preflight
- Operator values required: true
- Monitoring window can execute: false
- Can claim telemetry-connected: false
- Can claim production-monitored: false
- Can claim production-ready: false
- Can enter stable release: false
- Reason: Production monitoring values preflight failed.

## Checks

- pass: build_post_rc_production_monitoring_values_preflight.mjs completed
- pass: check_post_rc_production_monitoring_controls.mjs pass
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: release/post_rc_production_monitoring_values_owner_preflight_scope.yaml exists
- pass: release/post_rc_production_monitoring_values_owner_gate.yaml exists
- pass: release/post_rc_production_monitoring_window_preconditions.yaml exists
- pass: release/post_rc_production_monitoring_values_approval_request.md exists
- pass: release/post_rc_production_monitoring_window_command_plan.yaml exists
- pass: observability/production_monitoring_operator_values_template.yaml exists
- pass: observability/production_monitoring_recommended_defaults.yaml exists
- pass: observability/production_monitoring_owner_assignment_template.yaml exists
- pass: observability/production_monitoring_window_execution_policy.yaml exists
- pass: observability/production_monitoring_final_gate_policy.yaml exists
- pass: evals/suites/post_rc_production_monitoring_values_preflight.yaml exists
- pass: evals/reports/post_rc_production_monitoring_values_preflight_report.json exists
- pass: evals/reports/post_rc_production_monitoring_values_preflight_report.md exists
- pass: evals/reports/post_rc_production_monitoring_values_gate_report.json exists
- pass: evals/reports/post_rc_production_monitoring_values_gate_report.md exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_preflight_report.json exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_operator_values_template_snapshot.yaml exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_recommended_defaults_snapshot.yaml exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_owner_assignment_template_snapshot.yaml exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_window_preconditions.json exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_claim_boundary.json exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_blocker_update.json exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_window_command_plan_snapshot.yaml exists
- pass: evidence/post-rc-production-monitoring-values-preflight/production_monitoring_values_gate_report.json exists
- pass: evidence/post-rc-production-monitoring-values-preflight/unresolved_items.json exists
- pass: docs/production_monitoring_values_owner_preflight.md exists
- pass: docs/production_monitoring_operator_values_template.md exists
- pass: docs/production_monitoring_recommended_defaults.md exists
- pass: docs/production_monitoring_window_execution_plan.md exists
- pass: docs/production_monitoring_values_approval_request.md exists
- pass: docs/next_monitoring_window_execution_plan.md exists
- pass: values preflight report is blocked by missing operator values
- pass: no new execution or forbidden execution occurred
- pass: operator values template matches required shape
- pass: recommended defaults require operator approval
- pass: owner assignment template remains pending
- pass: monitoring window preconditions block execution
- pass: window execution policy is preflight-only
- pass: final gate policy remains unexecuted
- pass: command plan is not executable in this stage
- fail: window execution scripts were not created
- pass: claim boundary keeps stronger claims blocked
- pass: blocker updated to operator values required
- pass: unresolved items record missing operator values
- pass: production-monitored / production-ready / stable / provider-diverse positive claims absent
- pass: guardrail paths remain clean
