# Local Endpoint Readiness Preflight

Status: pass

- Stage: v2.0.0-post-rc-local-endpoint-readiness-preflight
- Provider: ollama
- Endpoint: http://127.0.0.1:11434/v1
- Model: qwen3:14b
- Local endpoint probe: true
- Local model execution: false
- Raw request stored: false
- Raw response stored: false
- Can enter local no-tool canary: true

## Checks

- pass: operator readiness signal is present
- pass: provider type is supported
- pass: model name is present
- pass: endpoint URL parses
- pass: endpoint is localhost-only
- pass: endpoint has no embedded credentials
- pass: endpoint has no query or hash
- pass: api shape is OpenAI-compatible
- pass: auth requirement is explicit
- pass: auth token presence matches auth requirement
- pass: timeout is bounded
- pass: models endpoint is reachable
- pass: models endpoint returns JSON data array
- pass: target model is available

## Claim Boundary

- Allows after pass: post-rc-local-endpoint-readiness-preflight-completed, post-rc-local-endpoint-probe-checked
- Still blocked: provider-diverse, provider-verified, adapter-checked, local-model-verified, local-no-tool-canary-executed, vllm-no-tool-canary-executed, ollama-no-tool-canary-executed, production-ready, stable, release-gated
