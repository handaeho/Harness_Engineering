# Containment Post-execution Gate Report

Status: pass

Stage: v2.0.0-beta-containment-post-execution-claim-audit-and-owner-review

- Can enter containment verified decision gate: true
- Can enter containment verified claim: false
- Can enter release gated claim: false
- Can enter production ready claim: false
- Reason: Dedicated containment execution passed and post-execution audit passed, but containment-verified requires a separate final decision gate.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: check_dedicated_containment_verification.mjs pass
- pass: release/beta_containment_post_execution_claim_audit_scope.yaml exists
- pass: release/containment_post_execution_owner_review_draft.yaml exists
- pass: release/containment_post_execution_blocker_update.yaml exists
- pass: release/containment_claim_decision_draft.yaml exists
- pass: security/containment/containment_post_execution_audit_policy.yaml exists
- pass: security/containment/containment_post_execution_claim_policy.yaml exists
- pass: security/containment/containment_owner_review_policy.yaml exists
- pass: security/containment/containment_canonical_claims.yaml exists
- pass: tools/review_dedicated_containment_results.mjs exists
- pass: tools/audit_dedicated_containment_claims.mjs exists
- pass: tools/summarize_containment_post_execution_evidence.mjs exists
- pass: tools/check_containment_post_execution_claim_audit.mjs exists
- pass: evals/suites/beta_containment_post_execution_claim_audit.yaml exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/dedicated_containment_evidence_completeness_report.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_canonical_claims.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_claim_canonicalization_report.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_no_side_effect_evidence_review.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_proof_level_update.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_claim_boundary_audit.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_owner_review_draft.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_claim_decision_draft.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_post_execution_blocker_update.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/containment_release_gate_blocker_refresh.json exists
- pass: evidence/beta-containment-post-execution-claim-audit/unresolved_items.json exists
- pass: post-execution review report pass
- pass: source execution status and counts pass
- pass: no-side-effect counters all zero
- pass: raw storage and redaction evidence pass
- pass: evidence completeness pass
- pass: claim canonicalization pass
- pass: proof level update does not mark verified
- pass: claim boundary remains closed with owner review required
- pass: owner review and decision draft present
- pass: blocker and release gate refresh remain blocked
- pass: unresolved items empty on pass
- pass: forbidden positive claims absent
- pass: dist modified false
- pass: v36 modified false
