# Local Endpoint Readiness Preflight

Status: fail

- Stage: v2.0.0-post-rc-local-endpoint-readiness-preflight
- Provider: vllm
- Endpoint: http://127.0.0.1:8000/v1
- Model: missing
- Local endpoint probe: false
- Local model execution: false
- Raw request stored: false
- Raw response stored: false
- Can enter local no-tool canary: false

## Checks

- pass: operator readiness signal is present
- pass: provider type is supported
- fail: model name is present
- pass: endpoint URL parses
- pass: endpoint is localhost-only
- pass: endpoint has no embedded credentials
- pass: endpoint has no query or hash
- pass: api shape is OpenAI-compatible
- pass: auth requirement is explicit
- pass: auth token presence matches auth requirement
- pass: timeout is bounded

## Claim Boundary

- Allows after pass: none
- Not opened by this preflight: provider-diverse, provider-verified, local-model-verified
- Still blocked: adapter-checked, local-no-tool-canary-executed, vllm-no-tool-canary-executed, ollama-no-tool-canary-executed, production-ready, stable, release-gated
