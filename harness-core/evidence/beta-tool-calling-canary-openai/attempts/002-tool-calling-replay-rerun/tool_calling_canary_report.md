# OpenAI Tool Calling Canary Report

Status: pass

Stage: v2.0.0-beta-tool-calling-canary-openai

- Mode: openai_tool_calling_canary_mock_tools_only
- Provider execution: true
- Tool calling used: true
- Function tools used: true
- Built-in tools used: false
- Remote MCP used: false
- Local model execution: false
- External side effects: false
- Store false enforced: true
- Tool argument Ajv validation used: true
- Mock tools only: true
- Cases total: 7
- Cases passed: 7
- Cases failed: 0
- Tool calls total: 6
- Mock tools executed: 6
- Blocked tools requested: 1
- Blocked tools executed: 0
- Tool outputs reclassified untrusted: 6
- Final responses received: 6
- Trace events total: 72
- Redaction passed: true

## Claim Boundary

- Allows after pass: openai-tool-calling-canary-executed, provider-tool-call-path-checked, tool-argument-schema-canary-validated, mock-tool-output-reinjection-checked, tool-approval-boundary-canary-checked, tool-output-reclassification-checked, tool-calling-trace-captured, tool-calling-redaction-checked
- Does not allow: tool-call-verified, provider-verified, adapter-checked, integration-verified, provider-diverse, replay-verified, release-gated, production-monitored
