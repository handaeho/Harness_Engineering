# Gemini Structured Output Canary Report

Status: pass

Stage: v2.0.0-gemini-structured-output-live-canary

- Mode: gemini_structured_output_live_canary_no_tools
- Provider execution: true
- Structured output used: true
- Tools used: false
- Local model execution: false
- External side effects: false
- Store false enforced: true
- Ajv validation used: true
- Cases total: 2
- Cases passed: 2
- Cases failed: 0
- Schema validations passed: 2
- Schema validations failed: 0
- Trace events total: 9
- Redaction passed: true

## Claim Boundary

- Allows after live pass: gemini-structured-output-live-canary-executed, gemini-provider-structured-output-path-checked, gemini-json-schema-response-live-validated, gemini-structured-output-trace-captured, gemini-structured-output-redaction-checked
- Does not allow: schema-output-verified, tool-call-verified, provider-verified, adapter-checked, integration-verified, release-gated, production-ready, production-monitored
