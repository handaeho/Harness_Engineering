# Local Runtime Readiness

Current status: `blocked_by_missing_local_endpoint`

No local model execution is enabled in this stage.

## vLLM

- Endpoint available: false
- Local no-tool canary: `blocked_by_missing_local_endpoint`
- Structured output canary: not executed
- Tool-calling canary: not executed

## Ollama

- Endpoint available: false
- Local no-tool canary: `blocked_by_missing_local_endpoint`
- Structured output canary: not executed
- Tool-calling canary: not executed

## Claim Boundary

Documented readiness does not allow `local-model-verified`,
`local-no-tool-canary-executed`, `vllm-no-tool-canary-executed`,
`ollama-no-tool-canary-executed`, or `provider-diverse`.
