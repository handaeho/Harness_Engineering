# Next Provider Execution Plan

Provider or local model execution remains closed until explicitly approved.

Recommended next opening order:

1. Open one provider path only, preferably the OpenAI adapter, with no external tools enabled.
2. Run adapter conformance against a real provider response shape.
3. Validate structured output with deterministic cases before enabling tool calls.
4. Keep local model execution closed until a separate vLLM or Ollama approval boundary is recorded.
5. Keep `provider-diverse`, `runtime-verified`, `tool-call-verified`, and `release-gated` blocked until the relevant execution evidence exists.

Minimum preconditions before provider execution:
- `check_beta_mock_execution.mjs` pass
- explicit operator approval for provider execution
- provider credentials handled outside committed files
- no real external side-effect tools enabled
- trace capture for provider execution events
