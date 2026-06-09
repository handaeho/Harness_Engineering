# Next Local No-tool Multimodel Comparison Plan

다음 stage는 `qwen3:14b`와 `qwen3.6:27b`의 local no-tool evidence를 비교하는 것이다.

## Candidate Stage

`v2.0.0-post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b`

## Preconditions

- `qwen3:14b` readiness preflight pass
- `qwen3:14b` no-tool canary pass
- `qwen3:14b` result review pass
- `qwen3.6:27b` readiness preflight pass
- `qwen3.6:27b` no-tool canary pass
- `qwen3.6:27b` result review pass

## Comparison Scope

- Cases total / passed / failed
- Final content non-empty
- Tool calls absent
- Structured output absent
- Raw request/response storage absent
- Redaction pass
- Thinking or reasoning control required by model
- Endpoint and provider shape

## Out of Scope

- 새 local model generation
- 새 model pull
- tool-calling canary
- structured-output canary
- local redteam
- `provider-diverse` 미허용
- `local-model-verified` 미허용

## Claim Boundary

Multi-model no-tool comparison은 여러 local model의 no-tool text path를 비교하는 evidence다.
그 자체로 `local-model-verified`, `provider-diverse`, `provider-verified`, `adapter-checked`를 허용하지 않는다.
