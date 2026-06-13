# OpenAI Canary Replay Suite Gate Report

Status: pass

Stage: v2.0.0-beta-openai-canary-replay-suite

- Can enter replay-verified claim: false
- Can enter provider diversity claim: false
- Can enter release gate: false
- Can enter local no-tool canary: false
- Reason: OpenAI canary replay suite passed at canary-suite level. Replay-verified and stronger claims remain closed.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: check_reference_baseline_integrity.mjs pass
- pass: check_openai_credentialed_canary.mjs pass
- pass: check_openai_structured_output_canary.mjs pass
- pass: check_openai_tool_calling_canary.mjs pass
- pass: check_openai_tool_calling_replay_rerun.mjs pass
- pass: no_tool_replay_comparison_report.json exists
- pass: structured_output_replay_comparison_report.json exists
- pass: tool_calling_replay_comparison_report.json exists
- pass: suite_replay_summary.json exists
- pass: suite_trace_comparison.json exists
- pass: suite_redaction_report.json exists
- pass: all required surfaces passed
- pass: local_model_execution is false
- pass: external_side_effects is false
- pass: raw_response_stored is false
- pass: redaction passed
- pass: suite trace comparison pass
- pass: no_tool_text required trace events present
- pass: structured_output required trace events present
- pass: tool_calling required trace events present
- pass: no replay/provider-diverse/release-gated claims allowed
- pass: reference baseline source modified false by checksum comparison
