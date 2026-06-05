# OpenAI Tool Calling Replay Rerun

Stage: `v2.0.0-beta-openai-tool-calling-replay-rerun`

This stage reruns the existing OpenAI tool-calling canary under the same
restricted scope and compares it against the prior pass attempt. It does not
add tool schemas, built-in tools, local model execution, redteam execution, or
live telemetry.

Required credentialed command:

```powershell
node harness-core/tools/run_openai_tool_calling_canary.mjs --attempt-id=002-tool-calling-replay-rerun
node harness-core/tools/compare_tool_calling_replay_attempts.mjs
node harness-core/tools/check_openai_tool_calling_replay_rerun.mjs
```

The result is canary rerun evidence only. It does not allow `replay-verified`
or `tool-call-verified`.
