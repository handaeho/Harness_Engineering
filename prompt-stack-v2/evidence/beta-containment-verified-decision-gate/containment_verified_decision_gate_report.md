# Containment Verified Decision Gate Report

Status: pass

Stage: v2.0.0-beta-containment-verified-decision-gate

- Can enter containment verified claim: true
- Can enter release gated claim: false
- Can enter production ready claim: false
- Reason: Containment-verified is allowed for beta scope after owner decision; release and production claims remain blocked.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: check_containment_post_execution_claim_audit.mjs pass
- pass: release/beta_containment_verified_decision_gate_scope.yaml exists
- pass: release/containment_verified_decision_gate.yaml exists
- pass: release/containment_owner_final_decision.yaml exists
- pass: release/containment_verified_blocker_update.yaml exists
- pass: security/containment/containment_verified_decision_policy.yaml exists
- pass: security/containment/containment_verified_evidence_sufficiency_policy.yaml exists
- pass: security/containment/containment_verified_claim_rules.yaml exists
- pass: tools/run_containment_verified_decision_gate.mjs exists
- pass: tools/audit_containment_verified_evidence_sufficiency.mjs exists
- pass: tools/audit_containment_verified_claim_boundary.mjs exists
- pass: tools/check_containment_verified_decision_gate.mjs exists
- pass: evals/suites/beta_containment_verified_decision_gate.yaml exists
- pass: evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json exists
- pass: evidence/beta-containment-verified-decision-gate/containment_evidence_sufficiency_audit.json exists
- pass: evidence/beta-containment-verified-decision-gate/containment_verified_claim_boundary_audit.json exists
- pass: evidence/beta-containment-verified-decision-gate/containment_owner_final_decision.json exists
- pass: evidence/beta-containment-verified-decision-gate/release_gate_impact_report.json exists
- pass: evidence/beta-containment-verified-decision-gate/containment_verified_blocker_update.json exists
- pass: evidence/beta-containment-verified-decision-gate/containment_verified_decision_gate_report.json exists
- pass: evidence/beta-containment-verified-decision-gate/unresolved_items.json exists
- pass: decision report has no new execution
- pass: evidence sufficiency audit pass
- pass: owner decision state is consistent
- pass: release and production claims remain blocked
- pass: blocked-without-owner decision is honest
- pass: blocker update matches decision
- pass: unresolved items match owner decision state
- pass: forbidden positive claims absent
- pass: dist modified false
- pass: v36 modified false
