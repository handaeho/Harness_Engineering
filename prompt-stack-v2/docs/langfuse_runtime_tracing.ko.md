# Langfuse Runtime Tracing

이 문서는 `prompt-stack-v2` mock runtime에 추가된 Langfuse tracing 코드 경로를 설명한다.

## 적용 범위

- 기본 실행은 기존 `executeMockRun`을 유지한다.
- Langfuse 전송 경로는 `executeMockRunWithLangfuse`에서만 사용한다.
- 기본 상태에서는 Langfuse SDK를 시작하지 않고 sink write를 수행하지 않는다.
- OpenAI provider 호출, local endpoint probe, local model 실행은 이 변경에 포함하지 않는다.

## 활성화 조건

실제 Langfuse sink write는 아래 조건이 모두 충족될 때만 시작된다.

- `LANGFUSE_TRACING_ENABLED=true`
- `LANGFUSE_PUBLIC_KEY` 존재
- `LANGFUSE_SECRET_KEY` 존재
- `LANGFUSE_BASE_URL` 또는 기존 repo 호환용 `LANGFUSE_HOST` 존재
- 별도 승인 env가 승인 문구와 정확히 일치

credential 값, authorization header, raw request, raw response, raw telemetry payload는 기록하지 않는다.

## 사용 경로

```js
import { executeMockRunWithLangfuse } from "../observability/langfuse/mock_runtime_tracer.mjs";

const { result, langfuse } = await executeMockRunWithLangfuse(runRequest);
```

`langfuse.trace_export_attempted`가 `false`이면 SDK가 시작되지 않은 상태이며, 일반 mock runtime 결과만 반환된다.

## 데이터 정책

- root observation input은 `run_id`, `case_id`, 안전한 input key 목록, mock response id 같은 요약만 포함한다.
- root observation output은 status, stage, trace event count, tool count, final output kind 같은 요약만 포함한다.
- trace event observation은 event id, event type, stage, redaction flag, payload key 목록과 일부 안전한 scalar summary만 포함한다.
- prompt, messages, raw body, secret, token, authorization header는 Langfuse payload에 포함하지 않는다.
