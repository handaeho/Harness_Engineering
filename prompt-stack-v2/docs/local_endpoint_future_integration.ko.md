# Local Endpoint Future Integration 계획

이 문서는 현재 post-RC goal에서 local endpoint를 실행하지 않고, 향후 operator가 endpoint 준비 완료를 알렸을 때 안전하게 연결하기 위한 계획이다.

## 현재 상태

현재 local endpoint는 준비되지 않았다.

local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
local-model-verified: blocked
provider-diverse: blocked

## 현재 goal에서 하지 않는 작업

아래 작업은 현재 goal에서 수행하지 않는다.

- local endpoint probe
- localhost health check
- vLLM 실행
- Ollama 실행
- local no-tool canary
- local structured output canary
- local redteam
- local-model-verified claim 금지
- provider-diverse claim 금지

## 나중에 operator가 제공해야 할 정보

operator가 local endpoint 준비 완료를 알릴 때 아래 정보를 제공해야 한다.

- provider type: vllm 또는 ollama
- endpoint URL
- model name
- supported chat/template mode
- expected API shape
- auth 필요 여부
- timeout/retry 정책
- 실행 가능한 테스트 범위
- 허용된 local canary stage

## 향후 진행 순서

local endpoint가 준비되면 다음 순서로 진행한다.

1. v2.0.0-post-rc-local-endpoint-readiness-preflight
2. v2.0.0-post-rc-local-no-tool-canary
3. v2.0.0-post-rc-local-no-tool-canary-result-review
4. 필요 시 local structured output/tool/redteam 확장
5. provider-diverse 또는 local-model-verified blocked claim gate 검토

## claim boundary

local endpoint 준비만으로 아래 claim은 허용되지 않는다.

- local-model-verified
- provider-diverse
- provider-verified
- adapter-checked
- production-ready
- stable

각 claim은 별도 gate와 evidence가 필요하다.
