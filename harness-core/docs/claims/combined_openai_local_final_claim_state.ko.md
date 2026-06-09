# Combined Final Claim State

허용된 scoped claim은 OpenAI-only post-RC scope와 Ollama qwen3 local lane에 한정한다.

Allowed:
- `post-rc-openai-only-stable`
- `post-rc-openai-only-production-ready`
- `production-monitored`
- `telemetry-connected`
- `containment-verified`
- `rc1-openai-scope-release-gated`
- `local-model-verified`

Blocked:
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- bare `release-gated`

Canonical rules:
- `post-rc-openai-only-stable`을 사용하고 bare `stable`은 사용하지 않는다.
- `post-rc-openai-only-production-ready`를 사용하고 bare `production-ready`는 사용하지 않는다.
- `rc1-openai-scope-release-gated`를 사용하고 bare `release-gated`는 사용하지 않는다.
- `local-model-verified`는 Ollama qwen3 local lane에만 사용한다.
