# Next Local No-Tool Canary Plan

Next candidate stage: `v2.0.0-beta-local-no-tool-canary`

Entry conditions:

- User explicitly approves local model execution.
- A localhost-only vLLM or Ollama endpoint exists.
- Required environment variables are present.
- The runner enforces no tools, no structured output, no external network, and
  no file side effects.

Minimum checks:

- endpoint URL is localhost-only
- no provider API call
- no tool request
- no structured output request
- redacted trace capture
- raw response not stored

Passing this future canary would still not allow `provider-diverse`,
`local-model-verified`, `adapter-checked`, `replay-verified`, or
`release-gated`.
