이 대화는 기존 harness-core 작업을 이어받는 새 대화입니다.
아래 내용을 현재 확정 상태로 사용해 주세요.

현재 최종 archive label:

```text
v2.0.0-rc.1+postrc.telemetry-connected+production-monitored+openai-only-production-ready+openai-only-stable
```

현재 scope:

```text
openai_only_post_rc
```

현재 상태:

```text
OpenAI-only post-RC scoped stable archive completed
```

허용 claim:

- post-rc-openai-only-stable
- post-rc-openai-only-production-ready
- production-monitored
- telemetry-connected
- containment-verified
- rc1-openai-scope-release-gated

금지 claim:

- stable
- production-ready
- release-gated
- provider-diverse
- provider-verified
- adapter-checked
- local-model-verified

중요한 claim 경계:

- bare stable 금지
- bare production-ready 금지
- bare release-gated 금지
- 허용되는 것은 post-rc-openai-only-stable, post-rc-openai-only-production-ready, rc1-openai-scope-release-gated 같은 scoped claim입니다.
- OpenAI-only archive는 provider-diverse, provider-verified, adapter-checked, local-model-verified를 증명하지 않습니다.

local endpoint deferred 상태:

```text
local_endpoint_status: deferred_until_operator_provides_endpoint
local_endpoint_probe: false
local_model_execution: false
local_no_tool_canary: deferred
```

사용자가 local endpoint 준비 완료를 알리기 전까지 local endpoint probe, vLLM/Ollama 실행, local no-tool canary를 수행하지 마세요.

파일 기준으로 확인해야 할 주요 gate:

```bash
cd harness-core
node tools/validators/evals/validate_alpha.mjs
node tools/scanners/release/scan_prohibited_claims.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
node tools/checks/openai/check_post_rc_openai_only_stable_final_handoff.mjs
node tools/checks/release/check_post_rc_new_conversation_handoff.mjs
cd ..
git status --short -- legacy-reference-source dist harness-core/evidence/reference-baseline
```

새 대화에서 임의로 진행하면 안 되는 작업:

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
- bare stable claim 금지
- bare production-ready claim 금지
- bare release-gated claim 금지
- provider-diverse claim 금지
- provider-verified claim 금지
- adapter-checked claim 금지
- local-model-verified claim 금지

다음 선택지:

1. final archive export/package
2. local endpoint readiness preflight after operator signal
3. strict provider-diverse path after local/second provider evidence

먼저 최신 파일 상태를 확인한 뒤, 아래 세 가지 중 어떤 방향으로 진행할지 물어봐 주세요.

1. final archive export/package
2. local endpoint readiness preflight after operator signal
3. strict provider-diverse path after local/second provider evidence
