# Post-RC 작업 순서 임시 기록

이 문서는 현재 post-RC goal에서 수행할 작업 순서를 한국어로 임시 기록한다. 이 기록은 새 release claim을 자동으로 허용하지 않는다.

## 실행 순서

정렬 순서: telemetry first → local future lane → stable later.

1. 먼저 telemetry approval과 credentials가 별도로 제공된 뒤 telemetry connection을 진행한다.
2. 그 다음 local endpoint는 현재 goal에서 제외하고 future integration lane으로 문서화한다.
3. operator가 local endpoint 준비 완료를 알리면 local endpoint readiness preflight부터 진행한다.
4. 이후 local no-tool canary와 결과 review는 별도 future stage에서만 진행한다.
5. stable scope decision은 telemetry 결과와 local lane이 해결되거나 명시적으로 out-of-scope 처리된 뒤 별도 요청이 있을 때만 진행한다.

## 현재 goal에서 보류하는 작업

local endpoint는 operator가 준비 완료를 알릴 때까지 defer한다.

- local endpoint probe 금지
- vLLM 실행 금지
- Ollama 실행 금지
- local no-tool canary 금지
- stable claim 자동 허용 없음
- production-ready claim 자동 허용 없음
- provider-diverse claim 자동 허용 없음
- local-model-verified claim 자동 허용 없음

## 현재 유지되는 제한적 claim

- rc1-openai-scope-release-gated
- rc1-post-release-gate-review-completed
- rc1-openai-scope-frozen
- containment-verified

## 계속 금지되는 claim

- blocked: stable
- blocked: bare release-gated
- blocked: production-ready
- blocked: production-monitored
- blocked: telemetry-connected
- blocked: provider-diverse
- blocked: provider-verified
- blocked: adapter-checked
- blocked: local-model-verified
