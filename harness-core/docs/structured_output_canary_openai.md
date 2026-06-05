# OpenAI Structured Output Canary

Stage: `v2.0.0-beta-structured-output-canary-openai`

This stage opens only the OpenAI Responses API structured output path using
`text.format` with `type: json_schema` and `strict: true`.

Allowed:
- text-only canary input
- structured output through JSON Schema response format
- Ajv validation of returned JSON
- `store: false`
- redacted trace and mapping evidence

Still closed:
- function calling
- tool calling
- built-in tools
- MCP, web search, file search, computer use
- local model execution
- replay verification
- live telemetry

Required environment:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Run from the workspace root:

```powershell
node harness-core/tools/run_openai_structured_output_canary.mjs
node harness-core/tools/check_openai_structured_output_canary.mjs
```

Passing this canary does not allow `schema-output-verified`,
`tool-call-verified`, `provider-verified`, `adapter-checked`, replay,
provider diversity, production monitoring, or release gate claims.
