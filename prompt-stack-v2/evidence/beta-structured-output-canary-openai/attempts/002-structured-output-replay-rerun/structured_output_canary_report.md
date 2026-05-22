# OpenAI Structured Output Canary Report

Status: pass

Stage: v2.0.0-beta-structured-output-canary-openai

- Mode: openai_structured_output_canary_no_tools
- Provider execution: true
- Structured output used: true
- Tools used: false
- Local model execution: false
- External side effects: false
- Store false enforced: true
- Strict JSON Schema used: true
- Ajv validation used: true
- Cases total: 5
- Cases passed: 5
- Cases failed: 0
- Schema validations passed: 5
- Schema validations failed: 0
- Trace events total: 34
- Redaction passed: true

## Claim Boundary

- Allows after pass: openai-structured-output-canary-executed, provider-structured-output-path-checked, json-schema-response-canary-validated, structured-output-trace-captured, structured-output-redaction-checked
- Does not allow: schema-output-verified, tool-call-verified, provider-verified, adapter-checked, integration-verified, release-gated, production-monitored
