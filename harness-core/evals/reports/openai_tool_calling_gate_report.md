# OpenAI Tool Calling Canary Gate Report

Status: pass

Stage: v2.0.0-beta-tool-calling-canary-openai

- Can enter local model execution: false
- Can enter replay verification: false
- Can enter redteam execution: false
- Reason: OpenAI tool-calling canary passed. Local model execution, replay verification, and redteam execution remain closed.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: check_reference_baseline_integrity.mjs pass
- pass: run_adapter_conformance_dry_run.mjs pass
- pass: run_beta_mock_execution.mjs pass
- pass: check_openai_credentialed_canary.mjs pass
- pass: check_openai_structured_output_canary.mjs pass
- pass: run_openai_tool_calling_canary.mjs pass or explicit blocked status
- pass: tool calling trace samples exist
- pass: tool call mapping report exists
- pass: tool argument validation report exists
- pass: tool execution report exists
- pass: approval boundary report exists
- pass: redaction report exists
- pass: built_in_tools_used is false
- pass: remote_mcp_used is false
- pass: local_model_execution is false
- pass: external_side_effects is false
- pass: store_false_enforced is true
- pass: tool_argument_ajv_validation_used is true
- pass: mock_tools_only is true
- pass: blocked_tools_executed is 0
- pass: tool outputs reclassified untrusted
- pass: redaction passed and raw response not stored
- pass: provider_execution is true for tool calling pass
- pass: tool_calling_used is true for pass
- pass: function_tools_used is true for pass
- pass: all tool calling cases passed
- pass: all tool argument validations passed
- pass: final responses received
- pass: request response mapping report pass
- pass: reference baseline source modified false by checksum comparison

## Claim Boundary

- Allowed now: harness-designed, static-structure-created, baseline-snapshotted, adapter-skeleton-created, alpha-static-validated, dependency-static-validated, adapter-dry-run-checked, beta-preflight-prepared, beta-mock-runtime-executed, mock-tool-routing-checked, approval-boundary-smoke-tested, trace-schema-smoke-tested, schema-contract-validated, openai-provider-canary-executed, provider-no-tool-path-checked, provider-trace-captured, provider-redaction-checked, openai-structured-output-canary-executed, provider-structured-output-path-checked, json-schema-response-canary-validated, structured-output-trace-captured, structured-output-redaction-checked, openai-tool-calling-canary-executed, provider-tool-call-path-checked, tool-argument-schema-canary-validated, mock-tool-output-reinjection-checked, tool-approval-boundary-canary-checked, tool-output-reclassification-checked, tool-calling-trace-captured, tool-calling-redaction-checked
- Blocked: adapter-checked, provider-verified, runtime-verified, tool-call-verified, schema-output-verified, telemetry-connected, production-ready, production-monitored, containment-verified, replay-verified, benchmark-backed, provider-diverse, integration-verified, release-gated
