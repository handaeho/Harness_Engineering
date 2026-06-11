# Gemini Provider Readiness Review

Metadata:
- stage: gemini-provider-readiness-review
- owner_layer: harness-core provider runtime
- claim_strength: live_text_structured_and_tool_canary_checked
- generated_at: 2026-06-11T00:00:00.000Z

## 요약

Gemini는 더 이상 단순 roadmap provider가 아니다.

현재 상태:
- `adapters/api/gemini/` provider adapter skeleton과 mapper가 존재한다.
- `adapters/provider_capability_matrix.yaml`에는 `providers.gemini` entry가 있다.
- Gemini live text provider canary는 실행됐고 통과했다.
- Gemini live structured output canary는 실행됐고 통과했다.
- Gemini live tool calling canary는 실행됐고 통과했다.
- local dry-run은 request/response mapping, structured output local schema validation, function calling dry-run, safety fixture를 통과한다.

## Native Gemini Lane

Gemini provider lane은 native Gemini API를 1차 기준으로 한다.

사용 surface:
- `contents` and role-scoped `parts`
- `systemInstruction`
- `tools.functionDeclarations`
- `toolConfig.functionCallingConfig`
- `generationConfig.responseMimeType`
- `generationConfig.responseJsonSchema`
- per-request `safetySettings`

OpenAI compatibility는 native Gemini proof가 아니다.

## 산출물 상태

구현됨:
- `adapters/api/gemini/adapter.yaml`
- `adapters/api/gemini/request_mapper.mjs`
- `adapters/api/gemini/response_mapper.mjs`
- `adapters/api/gemini/structured_output_mapper.mjs`
- `adapters/api/gemini/tool_calling_mapper.mjs`
- `adapters/api/gemini/safety_mapper.mjs`
- `adapters/api/gemini/generate_content_client.mjs`
- `adapters/api/gemini/*_cases.jsonl`
- `tools/runners/providers/run_gemini_provider_canary.mjs`
- `tools/checks/providers/check_provider_canary_gemini.mjs`
- `tools/checks/providers/check_gemini_runtime_asset_pack.mjs`
- `evals/suites/beta_provider_canary_gemini.yaml`
- `release/scopes/beta/beta_provider_canary_gemini_scope.yaml`

## Evidence 상태

현재 통과:
- live no-tool text provider canary
- live structured output behavior
- live `generationConfig.responseJsonSchema` validation
- live function calling behavior
- live `functionResponse` reinjection with thought signature preservation
- provider trace capture
- request/response mapping dry-run
- structured output local Ajv validation
- function calling declaration/config mapping
- function argument Ajv validation
- deterministic mock tool execution
- `functionResponse` reinjection dry-run
- safety blocked-response fixture handling
- redaction report
- provider trace sample generation

현재 차단:
- live safety metadata behavior
- provider verification claim entry
- adapter verification claim entry

최근 live function calling 보강 기록:
- 첫 provider functionCall 반환, argument validation, mock tool execution, tool-output reclassification은 통과했다.
- 두 번째 `functionResponse` 요청에서 원래 model `functionCall` part의 `thoughtSignature` 보존이 누락되어 Gemini가 HTTP 400을 반환했다.
- runner는 `thoughtSignature`를 raw evidence로 저장하지 않고, in-memory로 보존해 final request에 재주입하도록 보강됐다.
- 보강 후 credentialed rerun에서 live cases 2/2, final responses 2/2, thought signature capture/reinjection 2/2로 통과했다.

추가된 실행 표면:
- `tools/runners/providers/run_gemini_structured_output_canary.mjs`
- `tools/checks/providers/check_gemini_structured_output_canary.mjs`
- `tools/runners/providers/run_gemini_tool_calling_canary.mjs`
- `tools/checks/providers/check_gemini_tool_calling_canary.mjs`
- `npm run gemini-full-provider-canary-gate`

## Prompt Stack과의 경계

prompt-stack Gemini package는 Gemini CLI/coding-agent context와 skills 자산이다.
`harness-core/adapters/api/gemini`는 완전 자율형 provider runtime 자산이다.

두 자산은 이름은 유사하지만 사용자가 다르다:
- prompt-stack: human-in-the-loop coding agent 지원
- harness-core: autonomous programming agent runtime/evidence/gate

## Claim Boundary

Allowed:
- `gemini-request-mapping-dry-run-checked`
- `gemini-structured-output-dry-run-checked`
- `gemini-tool-calling-dry-run-checked`
- `gemini-safety-fixture-checked`
- `gemini-provider-canary-executed`
- `gemini-provider-trace-captured`
- `gemini-structured-output-live-canary-executed`
- `gemini-provider-structured-output-path-checked`
- `gemini-json-schema-response-live-validated`
- `gemini-structured-output-trace-captured`
- `gemini-tool-calling-live-canary-executed`
- `gemini-provider-tool-call-path-checked`
- `gemini-tool-argument-schema-live-validated`
- `gemini-function-response-reinjection-live-checked`
- `gemini-tool-approval-boundary-checked`
- `gemini-tool-output-reclassification-checked`
- `gemini-tool-calling-trace-captured`
- `gemini-tool-calling-redaction-checked`

Not allowed:
- `provider_verified`
- `adapter_checked`
- `release_gated`
- `production_ready`
- `live Gemini canary passed`

## 다음 안전 단계

1. live safety metadata behavior를 별도 scope와 fixture로 검증한다.
2. provider-verified, adapter-checked, release-gated claim은 현재 blocked이며 별도 promotion gate에서만 판단한다.
