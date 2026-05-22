# Next Structured Output Plan

Structured output remains closed in the provider canary stage.

Suggested next scope:
1. Add a separate `v2.0.0-beta-openai-structured-output-canary` scope file.
2. Use one minimal JSON Schema case with no tools.
3. Keep `store: false`.
4. Validate only the structured output surface, not tool calling.
5. Continue blocking `schema-output-verified` until multiple cases and failure paths pass.

Required preconditions:
- OpenAI no-tool provider canary pass
- explicit operator approval for structured output execution
- redacted request/response evidence
- separate unresolved item handling
