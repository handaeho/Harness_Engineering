# Gemini Tool Calling Canary Report

Status: pass

Stage: v2.0.0-gemini-tool-calling-live-canary

- Mode: gemini_tool_calling_live_canary_mock_tools_only
- Provider execution: true
- Tool calling used: true
- Function tools used: true
- Built-in tools used: false
- Local model execution: false
- External side effects: false
- Store false enforced: true
- Mock tools only: true
- Cases total: 3
- Cases passed: 3
- Cases failed: 0
- Tool calls total: 2
- Mock tools executed: 2
- Blocked tools requested: 1
- Blocked tools executed: 0
- Final responses received: 2
- Trace events total: 13
- Redaction passed: true

## Claim Boundary

- Allows after live pass: gemini-tool-calling-live-canary-executed, gemini-provider-tool-call-path-checked, gemini-tool-argument-schema-live-validated, gemini-function-response-reinjection-live-checked, gemini-tool-approval-boundary-checked, gemini-tool-output-reclassification-checked, gemini-tool-calling-trace-captured, gemini-tool-calling-redaction-checked
- Does not allow: tool-call-verified, provider-verified, adapter-checked, integration-verified, provider-diverse, replay-verified, release-gated, production-ready, production-monitored
