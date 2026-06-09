# Provider-Verified Missing Coverage

Provider-verified를 열기 전 필요한 blocker입니다.

- openai_provider_error_handling_review_unknown_or_partial: Add a non-generative provider error-handling review or approved final-gate evidence packet before opening provider-verified.
- openai_provider_contract_regression_evidence_incomplete: Record provider-level regression evidence or explicitly scoped replay review for OpenAI.
- ollama_provider_error_handling_review_unknown_or_partial: Add non-generative error-handling review or approved provider final-gate evidence.
- ollama_provider_replay_or_regression_evidence_partial: Promote the smoke/regression evidence into an explicit provider-level final gate or record the missing coverage as blocker.
- ollama_structured_output_coverage_partial_smoke_only: Record structured-output provider coverage acceptance or keep this as partial coverage.
- ollama_tool_calling_coverage_partial_mock_only: Record provider-level tool-calling coverage or explicitly constrain the provider-verified scope.
- full_provider_verified_final_gate_not_executed: Do not open provider-verified in this stage; run a final gate only after the missing coverage is closed.
- owner_final_decision_required_after_coverage_completion: Prepare owner decision packet only after final-gate coverage is ready.
