# RC1 Evidence Index

Indexed groups: 22

## v36 baseline

- Status: pass
- Claim level: baseline_snapshot
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/v36-baseline/file_inventory.json`
  - present: `evidence/v36-baseline/checksums.json`

## alpha validation

- Status: pass
- Claim level: alpha_static_validation
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/alpha/validation_report.json`
  - present: `evidence/alpha/baseline_comparison.json`

## alpha hardening

- Status: pass
- Claim level: alpha_hardening_static
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/alpha/prohibited_claim_scan.json`
  - present: `evidence/alpha/unresolved_items.json`

## beta preflight

- Status: pass
- Claim level: beta_preflight
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-preflight/dependency_validation_report.json`
  - present: `evidence/beta-preflight/beta_entry_gate_report.json`

## beta mock execution

- Status: pass
- Claim level: mock_execution_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-mock-execution/execution_report.json`
  - present: `evidence/beta-mock-execution/beta_mock_gate_report.json`

## OpenAI no-tool canary

- Status: pass
- Claim level: openai_provider_canary_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-provider-canary-openai/provider_canary_report.json`
  - present: `evidence/beta-provider-canary-openai/provider_canary_gate_report.json`

## OpenAI structured output canary

- Status: pass
- Claim level: openai_structured_output_canary_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-structured-output-canary-openai/structured_output_canary_report.json`
  - present: `evidence/beta-structured-output-canary-openai/structured_output_gate_report.json`

## OpenAI tool-calling canary

- Status: pass
- Claim level: openai_tool_calling_canary_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-tool-calling-canary-openai/tool_calling_canary_report.json`
  - present: `evidence/beta-tool-calling-canary-openai/tool_calling_gate_report.json`

## OpenAI canary replay suite

- Status: pass
- Claim level: canary_suite_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-openai-canary-replay-suite/suite_replay_summary.json`
  - present: `evidence/beta-openai-canary-replay-suite/suite_gate_report.json`

## OpenAI limited redteam execution

- Status: pass
- Claim level: openai_limited_redteam_scope
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json`
  - present: `evidence/beta-openai-redteam-limited-execution/redteam_gate_report.json`

## OpenAI additional redteam execution

- Status: pass
- Claim level: openai_additional_redteam_scope
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_execution_report.json`
  - present: `evidence/beta-additional-openai-redteam-execution/additional_openai_redteam_gate_report.json`

## broader redteam pass gate design

- Status: drafted
- Claim level: design_only
- Required for OpenAI-only rc.1 scope: false
- Artifacts:
  - present: `evidence/beta-broader-redteam-pass-gate-design/broader_redteam_pass_gate_design_report.json`
  - present: `evidence/beta-broader-redteam-pass-gate-design/broader_redteam_pass_gate_design_gate_report.json`

## skipped redteam case review

- Status: pass
- Claim level: case_disposition_review
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-skipped-redteam-case-review/skipped_case_review_report.json`
  - present: `evidence/beta-skipped-redteam-case-review/skipped_case_review_gate_report.json`

## containment design

- Status: pass
- Claim level: design_only
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-containment-boundary-verification-design/containment_boundary_verification_design_report.json`
  - present: `evidence/beta-containment-boundary-verification-design/containment_coverage_matrix.json`

## containment mock dry-run

- Status: pass
- Claim level: mock_dry_run_passed
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-containment-boundary-mock-dry-run/containment_boundary_mock_dry_run_report.json`
  - present: `evidence/beta-containment-boundary-mock-dry-run/containment_mock_gate_report.json`

## containment gate refinement

- Status: pass
- Claim level: gate_refined_not_verified
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-containment-verification-gate-refinement/containment_verification_gate_refinement_report.json`
  - present: `evidence/beta-containment-verification-gate-refinement/containment_gate_refinement_gate_report.json`

## cross-suite storage/redaction audit

- Status: pass
- Claim level: storage_redaction_audit_passed
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_audit_report.json`
  - present: `evidence/beta-cross-suite-storage-redaction-audit/storage_redaction_gate_report.json`

## dedicated containment verification plan

- Status: pass
- Claim level: plan_ready_execution_pending_then_executed
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-dedicated-containment-verification-plan/dedicated_containment_verification_plan_report.json`
  - present: `evidence/beta-dedicated-containment-verification-plan/dedicated_containment_plan_gate_report.json`

## dedicated containment verification execution

- Status: pass
- Claim level: dedicated_containment_execution_passed
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-dedicated-containment-verification/dedicated_containment_verification_report.json`
  - present: `evidence/beta-dedicated-containment-verification/dedicated_containment_gate_report.json`

## containment post-execution claim audit

- Status: pass
- Claim level: post_execution_audit_passed
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-containment-post-execution-claim-audit/containment_post_execution_review_report.json`
  - present: `evidence/beta-containment-post-execution-claim-audit/containment_post_execution_gate_report.json`

## containment verified decision gate

- Status: pass
- Claim level: containment_verified_allowed_beta_scope
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-containment-verified-decision-gate/containment_verified_decision_report.json`
  - present: `evidence/beta-containment-verified-decision-gate/containment_verified_decision_gate_report.json`

## release blocker P0/P1 reevaluation

- Status: pass
- Claim level: openai_only_rc1_candidate
- Required for OpenAI-only rc.1 scope: true
- Artifacts:
  - present: `evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_reevaluation_report.json`
  - present: `evidence/beta-release-blocker-p0-p1-reevaluation/release_blocker_p0_p1_gate_report.json`

