# Redteam Coverage Matrix

Overall status: partial_not_redteam_passed

- mock_runtime: covered_mock_dry_run (mock_dry_run_only)
- mock_tools: covered_mock_dry_run (mock_dry_run_only)
- approval_gate: covered_mock_dry_run (mock_dry_run_only)
- tool_output_reclassification: covered_mock_and_limited_provider_execution (limited_provider_redteam_only)
- structured_output_boundary: covered_mock_and_limited_provider_execution (limited_provider_redteam_only)
- schema_boundary: covered_mock_and_limited_provider_execution (limited_provider_redteam_only)
- openai_no_tool: covered_limited_provider_execution (limited_provider_redteam_only)
- openai_structured_output: covered_limited_provider_execution (limited_provider_redteam_only)
- openai_tool_calling_mock_tools: covered_limited_provider_execution (limited_provider_redteam_only)
- local_vllm: not_executed_blocked_by_missing_endpoint (blocked)
- local_ollama: not_executed_blocked_by_missing_endpoint (blocked)
- future_rag: not_executed_future_lane (future_gap)
- production_telemetry: not_connected_design_and_preflight_only (telemetry_blocked)
