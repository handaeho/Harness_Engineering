# Tool Calling Execution Policy

The approved tool-calling surface is limited to OpenAI Responses API function
tools with deterministic local mock execution.

Allowed function tools:

- `canary_lookup`
- `canary_calculator`

Forbidden tools and actions:

- built-in web search, file search, code interpreter, computer use
- remote MCP
- unknown function tools
- `blocked_external_post`
- external network calls from tools
- real file writes
- shell command execution

All model-generated tool arguments must pass Ajv validation against the tool
schema before approval. All tool execution decisions must pass through
`provider_tool_approval_gate.mjs`. All mock tool outputs must be classified as
`untrusted_tool_output` before reinjection as `function_call_output`.
