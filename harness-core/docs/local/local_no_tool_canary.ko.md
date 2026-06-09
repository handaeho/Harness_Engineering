# Local No-tool Canary

이 문서는 local endpoint readiness preflight가 통과한 뒤 실행하는 첫 local model execution 단계의 범위를 정의한다.

## Stage

```text
v2.0.0-post-rc-local-no-tool-canary
```

## 목적

- localhost-only endpoint를 통해 local model completion을 최소 범위로 실행한다.
- tools, structured output, redteam, telemetry sink write 없이 no-tool text path만 확인한다.
- response shape, output text 존재, tool call 부재, raw storage 부재를 검증한다.
- sanitized preview/hash/usage summary만 evidence로 기록한다.

## 선행 조건

- `v2.0.0-post-rc-local-endpoint-readiness-preflight` 통과
- 대상 모델이 `/v1/models`에 표시됨
- endpoint가 localhost 또는 127.0.0.1 범위임

## 금지되는 실행

- tool calling
- structured output
- redteam
- non-localhost endpoint call
- telemetry sink write
- raw request 또는 raw response 저장
- secret 또는 auth header 저장

## Claim Boundary

local no-tool canary 통과만으로 아래 claim은 허용되지 않는다.

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

통과 후에도 local model verification과 provider-diverse 관련 claim은 아직 차단되며, 별도 result review/gate 없이는 허용되지 않는다.
