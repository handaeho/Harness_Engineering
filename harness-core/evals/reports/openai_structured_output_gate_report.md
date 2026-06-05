# OpenAI Structured Output Canary Gate Report

Status: pass

Stage: v2.0.0-beta-structured-output-canary-openai

- Can enter tool calling execution: false
- Can enter local model execution: false
- Can enter replay verification: false
- Reason: OpenAI structured output canary passed. Tool calling, local model execution, and replay verification remain closed.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: run_adapter_conformance_dry_run.mjs pass
- pass: run_beta_mock_execution.mjs pass
- pass: check_openai_credentialed_canary.mjs pass
- pass: run_openai_structured_output_canary.mjs pass or explicit blocked status
- pass: structured output trace samples exist
- pass: structured output mapping report exists
- pass: schema validation report exists
- pass: redaction report exists
- pass: tools_used is false
- pass: local_model_execution is false
- pass: external_side_effects is false
- pass: store_false_enforced is true
- pass: strict_json_schema_used is true
- pass: ajv_validation_used is true
- pass: redaction passed and raw response not stored
- pass: provider_execution is true for structured output pass
- pass: structured_output_used is true for pass
- pass: all structured output cases passed
- pass: all Ajv schema validations passed
- pass: request response mapping report pass
- pass: v36 modified false by checksum comparison

## Claim Boundary

- Allowed now: harness-designed, static-structure-created, baseline-snapshotted, adapter-skeleton-created, alpha-static-validated, dependency-static-validated, adapter-dry-run-checked, beta-preflight-prepared, beta-mock-runtime-executed, mock-tool-routing-checked, approval-boundary-smoke-tested, trace-schema-smoke-tested, schema-contract-validated, openai-provider-canary-executed, provider-no-tool-path-checked, provider-trace-captured, provider-redaction-checked, openai-structured-output-canary-executed, provider-structured-output-path-checked, json-schema-response-canary-validated, structured-output-trace-captured, structured-output-redaction-checked
- Blocked: adapter-checked, provider-verified, runtime-verified, tool-call-verified, schema-output-verified, telemetry-connected, production-ready, production-monitored, containment-verified, replay-verified, benchmark-backed, provider-diverse, integration-verified, release-gated
