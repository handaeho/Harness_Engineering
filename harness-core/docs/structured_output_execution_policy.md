# Structured Output Execution Policy

Structured output execution is closed by default.

The OpenAI structured output canary stage allows only:
- OpenAI Responses API request
- text-only input
- `text.format.type: json_schema`
- `text.format.strict: true`
- no tools or tool choice
- `store: false`
- Ajv validation of the returned JSON object
- redacted evidence only

The guard blocks execution when:
- `OPENAI_API_KEY` is missing
- `OPENAI_MODEL` is missing
- the stage is not `v2.0.0-beta-structured-output-canary-openai`
- tool, function, built-in tool, MCP, web, file, or computer-use fields are present
- `text.format` is missing or is not `json_schema`
- `strict` is not true
- `store` is not false
- max output tokens are not bounded

Structured output canary evidence is canary-scoped. It is not broad schema
reliability evidence and does not permit `schema-output-verified`.
