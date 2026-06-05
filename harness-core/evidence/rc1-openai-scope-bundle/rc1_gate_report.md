# RC1 Gate Report

Status: pass

Stage: v2.0.0-rc.1-evidence-bundle-openai-scope

- Can enter OpenAI-scope release gate dry-run: true
- Can enter stable release: false
- Can enter release-gated claim: false
- Can enter production-ready claim: false
- Can enter provider-diverse claim: false
- Reason: OpenAI-only rc.1 evidence bundle is ready, but stable/release-gated/provider-diverse/production claims remain blocked.

## Checks

- pass: check_containment_post_execution_claim_audit.mjs pass
- pass: check_containment_verified_decision_gate.mjs pass
- pass: check_release_blocker_p0_p1_reevaluation.mjs pass
- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: release/rc1_openai_scope_bundle_scope.yaml exists
- pass: release/rc1_openai_scope_release_candidate.yaml exists
- pass: release/rc1_claim_boundary.yaml exists
- pass: release/rc1_blocker_snapshot.yaml exists
- pass: release/rc1_release_gate_readiness.yaml exists
- pass: release/rc1_not_stable_notice.yaml exists
- pass: tools/build_rc1_openai_scope_bundle.mjs exists
- pass: tools/summarize_rc1_evidence_lineage.mjs exists
- pass: tools/audit_rc1_claim_boundaries.mjs exists
- pass: tools/generate_rc1_bundle_manifest.mjs exists
- pass: tools/check_rc1_openai_scope_bundle.mjs exists
- pass: evals/suites/rc1_openai_scope_evidence_bundle.yaml exists
- pass: evals/reports/rc1_openai_scope_bundle_report.json exists
- pass: evals/reports/rc1_openai_scope_bundle_report.md exists
- pass: evals/reports/rc1_evidence_lineage_report.json exists
- pass: evals/reports/rc1_evidence_lineage_report.md exists
- pass: evals/reports/rc1_claim_boundary_report.json exists
- pass: evals/reports/rc1_claim_boundary_report.md exists
- pass: evals/reports/rc1_gate_report.json exists
- pass: evals/reports/rc1_gate_report.md exists
- pass: evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_bundle_manifest.md exists
- pass: evidence/rc1-openai-scope-bundle/rc1_bundle_checksums.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_evidence_index.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_evidence_index.md exists
- pass: evidence/rc1-openai-scope-bundle/rc1_evidence_lineage.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_openai_scope_summary.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_claim_boundary.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_capability_matrix_snapshot.yaml exists
- pass: evidence/rc1-openai-scope-bundle/rc1_release_gate_snapshot.yaml exists
- pass: evidence/rc1-openai-scope-bundle/rc1_blocker_snapshot.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_release_readiness_assessment.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_not_stable_notice.json exists
- pass: evidence/rc1-openai-scope-bundle/rc1_gate_report.json exists
- pass: evidence/rc1-openai-scope-bundle/unresolved_items.json exists
- pass: docs/rc1_openai_scope_bundle.md exists
- pass: docs/rc1_evidence_lineage.md exists
- pass: docs/rc1_claim_boundary.md exists
- pass: docs/rc1_remaining_blockers.md exists
- pass: docs/rc1_not_stable_notice.md exists
- pass: docs/next_release_gate_actual_plan.md exists
- pass: docs/next_strict_provider_diverse_path.md exists
- pass: docs/next_local_canary_plan.md exists
- pass: docs/next_telemetry_connection_plan.md exists
- pass: no new execution flags remain false
- pass: rc1 claim boundary is closed for release and production
- pass: readiness split is correct
- pass: blocker snapshot remains release-gated blocked
- pass: evidence index and lineage are populated
- pass: manifest and checksums populated
- pass: not stable notice blocks stronger claims
- pass: unresolved items empty
- pass: forbidden positive claims absent
- pass: dist modified false
- pass: v36 modified false
