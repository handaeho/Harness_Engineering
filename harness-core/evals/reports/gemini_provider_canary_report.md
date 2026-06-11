# Gemini Provider Canary Report

Status: pass

Stage: v2.0.0-gemini-runtime-dry-run-provider-canary

- Mode: gemini_native_generate_content_static_and_optional_live_canary
- API lane: native_gemini_api
- Provider execution: true
- Live execution enabled: true
- Local dry-run status: pass
- Text mapping status: pass
- Structured output status: pass
- Tool calling dry-run status: pass
- Safety fixture status: pass
- Redaction passed: true
- Trace events total: 18

## Claim Boundary

- Allows after dry-run: gemini-adapter-skeleton-created, gemini-request-mapping-dry-run-checked, gemini-response-mapping-dry-run-checked, gemini-structured-output-dry-run-checked, gemini-json-schema-local-validation-checked, gemini-tool-calling-dry-run-checked, gemini-tool-argument-schema-local-validation-checked, gemini-function-response-reinjection-dry-run-checked, gemini-safety-fixture-checked, gemini-redaction-dry-run-checked
- Allows after live pass only: gemini-provider-canary-executed, gemini-provider-trace-captured
- Does not allow: provider-verified, adapter-checked, release-gated, production-ready, live Gemini canary passed, tool-call-verified, schema-output-verified, integration-verified, provider-diverse, replay-verified, production-monitored
