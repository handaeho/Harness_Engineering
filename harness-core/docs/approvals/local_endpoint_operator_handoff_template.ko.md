# Local Endpoint 준비 완료 전달 템플릿

아래 내용을 채워서 에이전트에게 전달한다.

Local endpoint is ready.

Provider type:
- vllm | ollama

Endpoint URL:
-

Model name:
-

Auth required:
- yes | no

Auth method:
-

Supported API shape:
- OpenAI-compatible / Ollama-native / other

Allowed next stage:
v2.0.0-post-rc-local-endpoint-readiness-preflight

Constraints:
- Do not claim provider-diverse yet.
- Do not claim local-model-verified yet.
- Run readiness preflight before any local no-tool canary.
- Do not store raw local model responses.

한국어 정책:
- operator 준비 완료 신호 전에는 local endpoint probe를 수행하지 않는다.
- operator 준비 완료 신호 전에는 vLLM 또는 Ollama를 실행하지 않는다.
- operator 준비 완료 신호 전에는 local no-tool canary를 수행하지 않는다.
