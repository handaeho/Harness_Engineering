# OpenAI Provider Canary Report

Status: fail

Stage: v2.0.0-beta-provider-canary-openai-credentialed-rerun

- Mode: openai_provider_canary_no_tools_no_structured_output
- Provider execution: true
- Local model execution: false
- External side effects: false
- Tools used: false
- Structured output used: false
- Store false enforced: true
- Cases total: 5
- Cases passed: 0
- Cases failed: 5
- Trace events total: 24
- Redaction passed: true

## Claim Boundary

- Allows after pass: openai-provider-canary-executed, provider-no-tool-path-checked, provider-trace-captured, provider-redaction-checked
- Does not allow: adapter-checked, provider-verified, runtime-verified, tool-call-verified, schema-output-verified, telemetry-connected, production-ready, production-monitored, containment-verified, replay-verified, benchmark-backed, provider-diverse, integration-verified, release-gated
