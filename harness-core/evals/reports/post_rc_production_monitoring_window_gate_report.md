# Post-RC Production Monitoring Window Gate

Status: pass

- Stage: v2.0.0-post-rc-production-monitoring-window-execution
- Can claim telemetry-connected: true
- Can claim production-monitored: false
- Can claim production-ready: false
- Can enter stable release: false
- Reason: Monitoring window execution evidence was recorded, but production-monitored remains blocked until duration/sample requirements and final monitoring gate pass.

## Checks

- pass: check_post_rc_production_monitoring_operator_values_completion.mjs pass
- pass: run_post_rc_production_monitoring_window.mjs completed
- pass: audit_post_rc_monitoring_window_claims.mjs pass
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: release/post_rc_production_monitoring_window_execution_scope.yaml exists
- pass: release/post_rc_production_monitoring_window_claim_boundary.yaml exists
- pass: release/post_rc_production_monitoring_window_blocker_update.yaml exists
- pass: tools/run_post_rc_production_monitoring_window.mjs exists
- pass: tools/check_post_rc_production_monitoring_window.mjs exists
- pass: tools/audit_post_rc_monitoring_window_claims.mjs exists
- pass: evals/suites/post_rc_production_monitoring_window_execution.yaml exists
- pass: evals/reports/post_rc_production_monitoring_window_report.json exists
- pass: evals/reports/post_rc_production_monitoring_window_report.md exists
- pass: evidence/post-rc-production-monitoring-window/production_monitoring_window_report.json exists
- pass: evidence/post-rc-production-monitoring-window/production_monitoring_window_report.md exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_trace_continuity.json exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_threshold_evaluation.json exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_redaction_evaluation.json exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_incident_rollback_readiness.json exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_claim_boundary.json exists
- pass: evidence/post-rc-production-monitoring-window/monitoring_window_blocker_update.json exists
- pass: evidence/post-rc-production-monitoring-window/unresolved_items.json exists
- pass: docs/production_monitoring_window_execution.md exists
- pass: docs/production_monitoring_window_result_review.md exists
- pass: docs/next_production_monitored_final_gate_plan.md exists
- pass: operator values completion evidence passed
- pass: approval phrase verified
- pass: window report records execution evidence without granting production-monitored
- pass: incomplete window honestly records unmet duration or sample count
- pass: trace continuity review uses Langfuse receipt evidence without raw trace payload
- pass: threshold evaluation records insufficient sample state
- pass: redaction and secret review passed
- pass: incident and rollback readiness reviewed without live rollback monitoring claim
- pass: forbidden execution flags remain false
- pass: secret and raw payload flags remain false
- pass: production, stable, provider, and local-model claims remain blocked
- pass: claim boundary records allowed monitoring-window review claims only
- pass: blocker update records completion or final-gate pending state
- pass: unresolved items record next monitoring actions when incomplete
- pass: production-monitored / production-ready / stable / provider-diverse positive claims absent
- pass: guardrail paths remain clean
