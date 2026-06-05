# RC1 Release Gate Dry-run Gate Report

Status: pass

Stage: v2.0.0-rc.1-release-gate-dry-run-openai-scope

- Can enter actual OpenAI-scope release gate preflight: true
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false
- Local endpoint deferred: true
- Reason: OpenAI-only release gate dry-run passed, local endpoint is explicitly deferred, and release-gated/stable claims remain blocked until actual release gate preflight/execution.

## Checks

- pass: rc1 OpenAI bundle prerequisite files exist before checker
- pass: check_rc1_openai_scope_bundle.mjs pass
- pass: dry-run artifacts generated
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_evidence_index.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_gate_report.json exists
- pass: release/rc1_release_gate_dry_run_openai_scope_scope.yaml exists
- pass: release/rc1_release_gate_dry_run_openai_scope.yaml exists
- pass: release/rc1_openai_scope_release_decision_draft.yaml exists
- pass: release/rc1_local_endpoint_deferred_policy.yaml exists
- pass: release/rc1_strict_provider_diverse_deferred_policy.yaml exists
- pass: release/rc1_release_gate_actual_preconditions.yaml exists
- pass: tools/run_rc1_release_gate_dry_run_openai_scope.mjs exists
- pass: tools/audit_rc1_release_gate_claim_boundaries.mjs exists
- pass: tools/summarize_rc1_release_gate_readiness.mjs exists
- pass: tools/check_rc1_release_gate_dry_run_openai_scope.mjs exists
- pass: evals/suites/rc1_release_gate_dry_run_openai_scope.yaml exists
- pass: evals/reports/rc1_release_gate_dry_run_report.json exists
- pass: evals/reports/rc1_release_gate_dry_run_report.md exists
- pass: evals/reports/rc1_release_gate_claim_boundary_report.json exists
- pass: evals/reports/rc1_release_gate_claim_boundary_report.md exists
- pass: evals/reports/rc1_release_gate_readiness_report.json exists
- pass: evals/reports/rc1_release_gate_readiness_report.md exists
- pass: evals/reports/rc1_release_gate_dry_run_gate_report.json exists
- pass: evals/reports/rc1_release_gate_dry_run_gate_report.md exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_report.md exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_criteria_matrix.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_claim_boundary.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_readiness_assessment.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_local_endpoint_deferred_record.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_provider_diversity_deferred_record.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_decision_draft.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_actual_preconditions.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_gate_report.json exists
- pass: evidence/rc1-release-gate-dry-run-openai-scope/unresolved_items.json exists
- pass: docs/rc1_release_gate_dry_run_openai_scope.md exists
- pass: docs/rc1_release_gate_claim_boundary.md exists
- pass: docs/rc1_local_endpoint_deferred.md exists
- pass: docs/rc1_provider_diversity_deferred.md exists
- pass: docs/rc1_release_gate_actual_preconditions.md exists
- pass: docs/next_rc1_release_gate_actual_plan.md exists
- pass: docs/next_local_canary_after_endpoint_ready.md exists
- pass: dry-run report flags are non-execution
- pass: OpenAI scope gate passed and local endpoint deferred
- pass: provider diversity and strict path deferred
- pass: release and production claims remain blocked
- pass: release decision draft and actual preconditions are ready
- pass: unresolved items empty
- pass: forbidden positive claims absent
- pass: dist modified false
- pass: v36 modified false
