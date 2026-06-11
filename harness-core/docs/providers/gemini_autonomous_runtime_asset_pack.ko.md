# Gemini Autonomous Runtime Asset Pack

Metadata:
- owner_layer: harness-core provider runtime
- target_agent: fully autonomous programming agent
- provider_lane: native_gemini_api
- claim_strength: live_text_structured_and_tool_canary_checked

## 목적

이 문서는 HARNESS Core에서 완전 자율형 프로그래밍 에이전트가 Gemini provider lane을 사용할 때 필요한 자산 표면을 정의한다.

이 자산은 prompt-stack의 Gemini coding-agent 자산과 다르다.

- prompt-stack Gemini package: Gemini CLI/Coding Agent용 context와 `SKILL.md` 자산
- `harness-core/adapters/api/gemini`: 완전 자율형 runtime의 provider adapter, mapper, runner, checker, evidence 자산

## 현재 포함 자산

- adapter metadata: `adapters/api/gemini/adapter.yaml`
- no-tool request mapper: `adapters/api/gemini/request_mapper.mjs`
- response mapper: `adapters/api/gemini/response_mapper.mjs`
- structured output mapper: `adapters/api/gemini/structured_output_mapper.mjs`
- function calling mapper: `adapters/api/gemini/tool_calling_mapper.mjs`
- safety mapper: `adapters/api/gemini/safety_mapper.mjs`
- REST client skeleton: `adapters/api/gemini/generate_content_client.mjs`
- fixtures: `adapters/api/gemini/*_cases.jsonl`
- tool schemas: `adapters/api/gemini/tool_schemas/*.schema.json`
- runner: `tools/runners/providers/run_gemini_provider_canary.mjs`
- checker: `tools/checks/providers/check_provider_canary_gemini.mjs`
- structured output live runner/checker: `tools/runners/providers/run_gemini_structured_output_canary.mjs`, `tools/checks/providers/check_gemini_structured_output_canary.mjs`
- tool calling live runner/checker: `tools/runners/providers/run_gemini_tool_calling_canary.mjs`, `tools/checks/providers/check_gemini_tool_calling_canary.mjs`
- asset-pack checker: `tools/checks/providers/check_gemini_runtime_asset_pack.mjs`
- suite: `evals/suites/beta_provider_canary_gemini.yaml`
- scope: `release/scopes/beta/beta_provider_canary_gemini_scope.yaml`
- evidence: `evidence/beta-provider-canary-gemini/`

## OpenAI/local model 대비 상태

OpenAI/local model과 같은 수준의 산출물 표면은 갖췄다:
- adapter skeleton
- mapper
- fixtures
- runner
- checker
- suite manifest
- scope file
- evidence report
- capability matrix entry
- claim boundary

하지만 OpenAI/local model과 같은 전체 실행 증거 수준은 아직 아니다.

현재 Gemini 상태:
- local dry-run: pass
- live no-tool text provider execution: pass
- live structured output execution: pass
- live tool calling execution: pass
- execution evidence equivalent to OpenAI/local: true
- provider-verified: false
- adapter-checked: false
- production-ready: false

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

Blocked:
- `provider-verified`
- `adapter-checked`
- `tool-call-verified`
- `schema-output-verified`
- `integration-verified`
- `release-gated`
- `production-ready`

## 다음 증거 단계

provider-verified, adapter-checked, release-gated claim은 현재 blocked이며 별도 promotion gate에서만 판단한다. live safety metadata behavior와 replay-grade coverage는 아직 별도 후속 검증 대상이다.
