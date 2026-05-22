# RC1 Bundle Manifest

Status: pass

Stage: v2.0.0-rc.1-evidence-bundle-openai-scope

- Scope: openai_only_rc1
- New execution: false
- Bundle files: 18
- Evidence groups: 22

## Evidence Groups

- v36 baseline: pass (baseline_snapshot)
- alpha validation: pass (alpha_static_validation)
- alpha hardening: pass (alpha_hardening_static)
- beta preflight: pass (beta_preflight)
- beta mock execution: pass (mock_execution_only)
- OpenAI no-tool canary: pass (openai_provider_canary_only)
- OpenAI structured output canary: pass (openai_structured_output_canary_only)
- OpenAI tool-calling canary: pass (openai_tool_calling_canary_only)
- OpenAI canary replay suite: pass (canary_suite_only)
- OpenAI limited redteam execution: pass (openai_limited_redteam_scope)
- OpenAI additional redteam execution: pass (openai_additional_redteam_scope)
- broader redteam pass gate design: drafted (design_only)
- skipped redteam case review: pass (case_disposition_review)
- containment design: pass (design_only)
- containment mock dry-run: pass (mock_dry_run_passed)
- containment gate refinement: pass (gate_refined_not_verified)
- cross-suite storage/redaction audit: pass (storage_redaction_audit_passed)
- dedicated containment verification plan: pass (plan_ready_execution_pending_then_executed)
- dedicated containment verification execution: pass (dedicated_containment_execution_passed)
- containment post-execution claim audit: pass (post_execution_audit_passed)
- containment verified decision gate: pass (containment_verified_allowed_beta_scope)
- release blocker P0/P1 reevaluation: pass (openai_only_rc1_candidate)
