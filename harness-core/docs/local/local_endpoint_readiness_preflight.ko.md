# Local Endpoint Readiness Preflight

이 문서는 operator가 local endpoint 준비 완료를 알린 뒤 실행하는 첫 검증 단계의 범위를 정의한다.

## Stage

```text
v2.0.0-post-rc-local-endpoint-readiness-preflight
```

## 목적

- endpoint URL이 localhost 범위인지 확인한다.
- provider type과 model name이 명시됐는지 확인한다.
- OpenAI-compatible `/v1/models` 응답에서 대상 모델이 보이는지 확인한다.
- raw request, raw response, auth header, secret 값을 evidence에 저장하지 않는다.
- local no-tool canary 진입 가능 여부만 판단한다.

## 허용되는 실행

- operator readiness signal 이후의 localhost-only endpoint probe
- OpenAI-compatible model list probe
- sanitized metadata evidence 기록

## 금지되는 실행

- local model completion 실행
- tool calling 실행
- structured output 실행
- redteam 실행
- telemetry sink write
- non-localhost endpoint probe
- raw request 또는 raw response 저장

## Claim Boundary

readiness preflight 통과만으로 아래 claim은 허용되지 않는다.

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-no-tool-canary-executed`
- `production-ready`
- `stable`

통과 후 가능한 다음 단계는 `v2.0.0-post-rc-local-no-tool-canary` 진입 검토뿐이다.
