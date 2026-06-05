# qwen3.6:27b Local No-tool Canary Result Review

이 문서는 `qwen3.6:27b` local no-tool canary 결과를 post-stable result review evidence로 정리한다.

Stage: `v2.0.0-post-stable-local-no-tool-canary-result-review-qwen3-6-27b`

## 확인 범위

- Provider: `ollama`
- Endpoint: `http://127.0.0.1:11434/v1`
- Model: `qwen3.6:27b`
- API shape: OpenAI-compatible chat completions
- Tool calling: not used
- Structured output: not used
- Raw request/response storage: not allowed and not recorded
- Telemetry sink write: not used

## Result

- Readiness preflight: pass
- No-tool canary: pass
- Cases passed: 2/2
- Redaction: pass
- Final content: non-empty
- Tool calls present: false
- Structured output present: false

Evidence:

- `evidence/post-rc-local-endpoint-readiness-preflight-qwen3-6-27b/local_endpoint_readiness_gate_report.json`
- `evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_no_tool_canary_gate_report.json`
- `evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_response_mapping_report.json`
- `evidence/post-rc-local-no-tool-canary-qwen3-6-27b/local_no_tool_redaction_report.json`
- `evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review/local_no_tool_canary_qwen3_6_27b_result_review.json`
- `evidence/post-stable-local-no-tool-canary-qwen3-6-27b-result-review/local_no_tool_canary_qwen3_6_27b_gate_report.json`

## Thinking Control Note

첫 no-tool canary attempt에서는 `think: false`만으로 final content가 생성되지 않았다.
최종 pass run은 Ollama OpenAI-compatible `/v1/chat/completions` request에 아래 제어를 같이 적용했다.

- `think: false`
- `reasoning_effort: "none"`
- `reasoning: { "effort": "none" }`

이 조건에서 `qwen3.6:27b`는 256 max tokens 안에서 final text를 반환했다.

## Gate

- Review runner: `tools/review_local_no_tool_canary_qwen3_6_27b.mjs`
- Claim audit: `tools/audit_local_no_tool_canary_qwen3_6_27b_claims.mjs`
- Gate checker: `tools/check_local_no_tool_canary_qwen3_6_27b_result_review.mjs`
- Eval suite: `evals/suites/post_stable_local_no_tool_canary_qwen3_6_27b_result_review.yaml`

## Claim Boundary

이번 result review는 `qwen3.6:27b`의 local no-tool text path evidence만 정리한다.

아래 claim은 계속 차단된다.

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

다음 비교 단계는 operator가 더 큰 모델 설치와 준비 완료를 알린 뒤에만 시작한다.
