# Gemini Coding Core Reference

Use this reference only after `coding-core` activates and the task touches code, tests, diffs, logs, or Gemini API behavior.

## Lane

- Use `native_gemini_api` by default.
- Use `openai_compatibility` only when the user explicitly asks for an OpenAI-shaped path.
- Record the lane whenever code changes affect Gemini request/response behavior.

## Active Slice

- For native requests, preserve `systemInstruction`, `contents` with role-scoped `parts`, `tools.functionDeclarations`, `toolConfig.functionCallingConfig`, structured output schema, and `safetySettings`.
- Treat function calls as model requests. The runtime owns approval, execution, argument validation, redaction, and function-response reinjection.
- Validate structured JSON locally before treating it as machine-readable truth.
- Do not run live Gemini calls without credential, cost, data, network, and approval boundaries.

## Verification

- Prefer mapper unit tests, fixture dry-runs, schema validation, redaction checks, and static runtime validators before live canaries.
- Separate dry-run mapping from live provider execution.
- Report skipped live checks with the blocked gate.
