# Local Runtime Readiness

Current status: `ollama_local_no_tool_canary_checked_qwen3_14b_and_qwen3_6_27b`

Local model execution is enabled only for completed Ollama no-tool canary evidence.

## vLLM

- Endpoint available: false
- Local no-tool canary: `blocked_by_missing_local_endpoint`
- Structured output canary: not executed
- Tool-calling canary: not executed

## Ollama

- Endpoint available: true, localhost-only OpenAI-compatible endpoint
- Models checked:
  - `qwen3:14b`
  - `qwen3.6:27b`
- Local no-tool canary: `canary_checked`
- Structured output canary: not executed
- Tool-calling canary: not executed
- `qwen3.6:27b` OpenAI-compatible no-tool canary required explicit reasoning disable controls:
  - `think: false`
  - `reasoning_effort: "none"`
  - `reasoning: { "effort": "none" }`

## Evidence

- `qwen3:14b` readiness evidence: `evidence/post-rc-local-endpoint-readiness-preflight/`
- `qwen3:14b` no-tool canary evidence: `evidence/post-rc-local-no-tool-canary/`
- `qwen3.6:27b` readiness evidence: `evidence/post-rc-local-endpoint-readiness-preflight-qwen3-6-27b/`
- `qwen3.6:27b` no-tool canary evidence: `evidence/post-rc-local-no-tool-canary-qwen3-6-27b/`

## Claim Boundary

Documented readiness and the completed no-tool canaries do not allow
`local-model-verified`, `vllm-no-tool-canary-executed`,
`ollama-no-tool-canary-executed`, or `provider-diverse`.

Allowed model-specific evidence language:

- `post-rc-local-no-tool-canary-completed`
- `post-rc-local-model-no-tool-path-checked`
- `post-rc-local-redaction-checked`
