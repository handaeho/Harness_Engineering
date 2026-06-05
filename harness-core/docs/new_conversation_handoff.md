# 새 대화용 핸드오프

## 1. 현재 최종 상태

현재 최종 상태: OpenAI-only post-RC scoped stable archive completed

이번 문서는 새 execution, 새 release gate, 새 provider 검증이 아닙니다. 현재까지 완료된 OpenAI-only post-RC scoped archive 상태를 새 대화에서 그대로 이어받기 위한 handoff 문서입니다.

## 2. 최종 archive label

```text
v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable
```

최종 scope:

```text
openai_only_post_rc
```

## 3. 현재 허용 claim

아래 scoped claim만 유지 허용합니다.

- `post-rc-openai-only-stable`
- `post-rc-openai-only-production-ready`
- `production-monitored`
- `telemetry-connected`
- `containment-verified`
- `rc1-openai-scope-release-gated`

## 4. 계속 금지 claim

아래 claim은 계속 금지합니다. 특히 bare stable 금지, bare production-ready 금지, bare release-gated 금지 상태를 유지합니다.

- `stable`
- `production-ready`
- `release-gated`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`

허용되는 표현은 scoped claim입니다.

- `post-rc-openai-only-stable`
- `post-rc-openai-only-production-ready`
- `rc1-openai-scope-release-gated`

## 5. 완료된 주요 단계

1. AGENTS.md / System of Record alignment 완료
2. Harness Asset Boundary Record 완료
3. reference baseline owner-approved refresh 완료
4. RC1 OpenAI-only release-gated 완료
5. RC1 post-release review / scope freeze 완료
6. RC1 final handoff 완료
7. Langfuse telemetry-connected 완료
8. production-monitored 완료
9. post-rc-openai-only-production-ready 완료
10. post-rc-openai-only-stable 완료
11. OpenAI-only stable final handoff/archive 완료

## 6. local endpoint future lane

```text
local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
```

사용자가 local endpoint 준비 완료를 알리기 전까지 local endpoint probe, vLLM/Ollama 실행, local no-tool canary를 수행하지 않는다.

local endpoint lane이 열리기 전까지 아래 claim은 계속 차단됩니다.

- `local-model-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

## 7. provider-diverse / strict path 상태

strict provider-diverse path는 아직 blocked/deferred 상태입니다. OpenAI-only scoped archive는 provider diversity, provider verification, adapter checking, local model verification을 증명하지 않습니다.

provider-diverse path는 local endpoint 또는 second provider evidence가 준비된 뒤 별도 gate로만 시작할 수 있습니다.

## 8. reference baseline owner-approved refresh 상태

reference baseline compare는 pass 상태입니다. 다만 아래 파일이 기존 owner-approved refresh 결과로 working tree에서 modified 상태일 수 있습니다.

- `harness-core/evidence/reference-baseline/checksums.json`
- `harness-core/evidence/reference-baseline/file_inventory.json`

이번 handoff 단계에서는 additional evidence/reference-baseline refresh를 수행하지 않았습니다.

## 9. 다음 선택지

```text
1. final archive export/package
   - 현재 OpenAI-only scoped archive를 export/package로 묶는다.

2. local endpoint readiness preflight after operator signal
   - 사용자가 local endpoint 준비 완료와 endpoint 정보를 제공한 뒤에만 시작한다.

3. strict provider-diverse path after local/second provider evidence
   - local endpoint 또는 second provider evidence가 준비된 뒤 별도 strict path로 시작한다.
```

권장 기본값은 stop 또는 archive/export package입니다.

## 10. 새 대화에서 가장 먼저 확인할 명령

workspace root에서 시작했다면 먼저 아래 순서로 확인합니다.

```bash
cd harness-core
node tools/validate_alpha.mjs
node tools/scan_prohibited_claims.mjs
node tools/check_reference_baseline_integrity.mjs
node tools/check_post_rc_openai_only_stable_final_handoff.mjs
node tools/check_post_rc_new_conversation_handoff.mjs
cd ..
git status --short -- legacy-reference-source dist harness-core/evidence/reference-baseline
```

## 11. 절대 하면 안 되는 작업

아래 작업은 새 대화 handoff만으로 수행하면 안 됩니다.

- OpenAI model API call
- OpenAI provider call
- telemetry sink write
- local endpoint probe
- local model execution
- vLLM/Ollama execution
- redteam rerun
- containment rerun
- production deployment
- release gate rerun
- legacy-reference-source modification
- dist modification
- additional evidence/reference-baseline refresh
- bare stable 주장
- bare production-ready 주장
- bare release-gated 주장
- provider-diverse 주장
- provider-verified 주장
- adapter-checked 주장
- local-model-verified 주장
