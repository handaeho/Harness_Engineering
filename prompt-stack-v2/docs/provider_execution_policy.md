# Provider Execution Policy

Provider execution is closed by default.

The OpenAI canary stage allows only:
- OpenAI Responses API text-only request
- no tools
- no structured output
- `store: false`
- redacted trace capture

The guard blocks execution when:
- `OPENAI_API_KEY` is missing
- `OPENAI_MODEL` is missing
- the stage does not match `v2.0.0-beta-provider-canary-openai-credentialed-rerun`
- tools or tool choice are present
- `response_format` or `text.format` is present
- stateful or metadata fields are present
- the base URL does not target `https://api.openai.com`

Provider canary evidence does not allow adapter, provider, tool-call, schema
output, replay, integration, provider diversity, production monitoring, or
release gate claims.
