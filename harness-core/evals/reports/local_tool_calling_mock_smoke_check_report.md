# Local Tool-calling Mock Smoke Canary Check

Status: pass

- Stage: v2.0.0-post-stable-local-tool-calling-mock-smoke-canary
- New local generation calls: 2
- Can proceed to replay/regression smoke: true
- Unresolved items: 0

## Checks

- pass: local_tool_calling_mock_smoke_report.json exists
- pass: local_tool_calling_mock_response_mapping.json exists
- pass: local_tool_calling_mock_redaction_report.json exists
- pass: local_tool_calling_mock_claim_boundary.json exists
- pass: local_tool_calling_mock_blocker_update.json exists
- pass: local_tool_calling_mock_gate_report.json exists
- pass: unresolved_items.json exists
- pass: stage matches
- pass: status pass
- pass: new local generation call count bounded
- pass: models covered
- pass: cases passed
- pass: tool calls present
- pass: no external tool execution
- pass: raw request/response not stored
- pass: redaction passed
- pass: protected paths unmodified
- pass: strong claims blocked
- pass: prohibited claim scan pass
- pass: local blocked positive claims absent
