# Local No-tool Claim Boundary

현재 local endpoint lane은 `ollama` / `qwen3:14b` / OpenAI-compatible `/v1` no-tool path에서만 evidence가 있다.

허용 가능한 표현:

- `post-stable-local-endpoint-readiness-preflight-passed`
- `post-stable-local-no-tool-canary-qwen3-14b-passed`
- `post-stable-local-no-tool-canary-qwen3-14b-result-reviewed`
- `post-stable-qwen3-thinking-behavior-recorded`
- `post-stable-local-no-tool-storage-redaction-reviewed`

계속 금지되는 표현:

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
