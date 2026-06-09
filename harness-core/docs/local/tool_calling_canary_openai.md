# OpenAI Tool Calling Canary

Stage: `v2.0.0-beta-tool-calling-canary-openai`

This canary opens only the OpenAI Responses API function tool path. It uses
deterministic local mock tools and does not allow built-in tools, remote MCP,
external API calls, file writes, shell commands, local model execution, live
telemetry, redteam execution, replay verification, or release gate claims.

Run from the workspace root with credential environment variables set:

```powershell
node harness-core/tools/runners/openai/run_openai_tool_calling_canary.mjs
node harness-core/tools/checks/openai/check_openai_tool_calling_canary.mjs
```

If credentials are missing, the runner writes `blocked_by_missing_credential`
or `blocked_by_missing_model` evidence and performs no provider call.

Passing this canary allows only canary-level statements such as
`openai-tool-calling-canary-executed`. It does not allow
`tool-call-verified`, `adapter-checked`, `provider-verified`,
`integration-verified`, `provider-diverse`, `replay-verified`,
`production-monitored`, or `release-gated`.
