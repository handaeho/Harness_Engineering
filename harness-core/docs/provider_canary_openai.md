# OpenAI Provider Canary

Stage: `v2.0.0-beta-provider-canary-openai-credentialed-rerun`

This stage opens only the OpenAI Responses API no-tool text path. It does not
open function calling, built-in tools, MCP, web search, file search, computer
use, structured output, local model execution, live telemetry, replay, or
release gate claims.

Required environment:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Optional environment:
- `OPENAI_BASE_URL`
- `OPENAI_TIMEOUT_MS`
- `OPENAI_MAX_OUTPUT_TOKENS`

The runner enforces `store: false` and records only redacted request/response
mapping evidence. API keys, authorization headers, full raw request bodies, and
full raw provider responses are not written to reports.

Run from the workspace root:

```powershell
node harness-core/tools/run_openai_provider_canary.mjs
node harness-core/tools/check_openai_credentialed_canary.mjs
```

If credentials or model are missing, the runner records an explicit blocked
status rather than a pass.
