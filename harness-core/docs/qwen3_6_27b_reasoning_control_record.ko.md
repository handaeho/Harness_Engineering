# qwen3.6:27b Reasoning Control Record

이 문서는 `qwen3.6:27b` local no-tool canary에서 확인된 reasoning control 동작을 기록한다.

## 관찰

첫 no-tool canary attempt에서는 `think: false`만으로 final content가 생성되지 않았다.
응답은 HTTP 200이었지만 256 max tokens 안에서 assistant `content`가 비어 있었고, canary는 실패했다.

## 적용된 제어

최종 pass run은 Ollama OpenAI-compatible `/v1/chat/completions` request에 아래 제어를 함께 적용했다.

- `think: false`
- `reasoning_effort: "none"`
- `reasoning: { "effort": "none" }`

## 결과

- Final content: non-empty
- Cases passed: 2/2
- Tool calls present: false
- Structured output present: false
- Raw request/response stored: false

## Claim Boundary

이 기록은 no-tool text path pass를 설명하기 위한 것이다.
`local-model-verified`, `provider-diverse`, `provider-verified`, `adapter-checked`는 계속 차단된다.
