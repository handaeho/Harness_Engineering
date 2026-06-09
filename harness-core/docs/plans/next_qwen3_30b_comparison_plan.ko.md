# Next qwen3:30b Comparison Plan

`qwen3:30b` 비교는 자동으로 시작하지 않는다.

## 시작 조건

- operator가 `qwen3:30b` 설치와 준비 완료를 명시한다.
- readiness preflight가 `/v1/models`에서 `qwen3:30b`를 확인한다.
- no-tool canary는 raw request/response를 저장하지 않는다.
- Qwen3 thinking behavior가 관찰되면 `think:false` 정책을 적용한다.

## 계속 차단되는 claim

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
