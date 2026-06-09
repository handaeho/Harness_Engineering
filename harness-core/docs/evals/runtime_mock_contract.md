# Runtime Mock Contract

The mock runtime loop is deterministic and fixture-backed.

Required loop:
- build a context packet from the run request
- select the mock-only route
- call the mock model adapter
- route requested mock tools
- block external or destructive tools at the approval gate
- execute only allowed mock tools
- reclassify tool output as `untrusted_tool_output`
- record state transitions
- emit trace events

Blocked tools must never execute:
- `blocked_external_post`
- `blocked_file_write`

Allowed mock tools:
- `safe_echo`
- `mock_retrieval`
- `mock_schema_formatter`

All trace events must set:
- `provider_execution: false`
- `local_model_execution: false`
- `external_side_effect: false`

This contract is a mock harness contract, not provider execution proof.
