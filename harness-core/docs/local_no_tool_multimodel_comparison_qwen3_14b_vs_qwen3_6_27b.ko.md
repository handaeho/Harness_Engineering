# qwen3:14b vs qwen3.6:27b Local No-tool Comparison

이 문서는 두 local model의 no-tool text path evidence를 비교하는 stage 기록이다.

Stage: `v2.0.0-post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b`

## Scope

- `qwen3:14b` 기존 readiness/no-tool/result-review evidence
- `qwen3.6:27b` 기존 readiness/no-tool/result-review evidence
- 새 local generation 없음
- OpenAI model API call 없음
- raw request/response 저장 없음

## Comparison Points

- Cases total / passed / failed
- Final content non-empty
- Tool calls absent
- Structured output absent
- Reasoning control requirement
- Redaction/storage status

## Boundary

이 comparison은 local no-tool text path 비교 evidence다.
`local-model-verified`, `provider-diverse`, `provider-verified`, `adapter-checked`는 계속 미허용이다.

## Generated Evidence

- `evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_no_tool_multimodel_comparison_report.json`
- `evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/reasoning_control_comparison.json`
- `evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/storage_redaction_comparison.json`
- `evidence/post-stable-local-no-tool-multimodel-comparison-qwen3-14b-vs-qwen3-6-27b/local_model_verification_preconditions.json`
