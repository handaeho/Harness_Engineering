# Qwen3 Thinking Behavior Record

`qwen3:14b`는 thinking behavior가 활성화될 수 있는 모델이다.

초기 local no-tool canary에서 final content가 비어 있는 현상이 관찰됐고, Ollama OpenAI-compatible request에 `think: false`를 적용한 뒤 final content가 채워지고 canary가 통과했다.

이 기록은 no-tool canary pass를 설명하기 위한 것이다. 아래 claim을 허용하지 않는다.

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
