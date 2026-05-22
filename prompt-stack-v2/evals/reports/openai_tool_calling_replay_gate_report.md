# OpenAI Tool Calling Replay Rerun Gate Report

Status: pass

Stage: v2.0.0-beta-openai-tool-calling-replay-rerun

- Can enter replay-verified claim: false
- Can enter provider diversity claim: false
- Can enter release gate: false
- Reason: OpenAI tool-calling canary rerun passed under the same restricted mock-tool scope. Replay-verified and stronger claims remain closed.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: check_openai_credentialed_canary.mjs pass
- pass: check_openai_structured_output_canary.mjs pass
- pass: check_openai_tool_calling_canary.mjs pass
- pass: attempt 001 exists
- pass: attempt 002 exists or comparison is blocked
- pass: replay comparison report exists
- pass: replay trace comparison exists
- pass: replay redaction report exists
- pass: both attempts pass
- pass: same case set
- pass: same tool schema set
- pass: blocked_tools_executed is 0
- pass: built_in_tools_used is false
- pass: remote_mcp_used is false
- pass: local_model_execution is false
- pass: external_side_effects is false
- pass: raw_response_stored is false
- pass: redaction passed
- pass: required trace events present
- pass: no replay or stronger claims allowed
- pass: v36 modified false by checksum comparison
