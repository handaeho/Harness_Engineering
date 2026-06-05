# Current State Alignment

`CURRENT_STATE.yaml`은 final dossier/export 이후 새 에이전트가 먼저 읽는 machine-readable 현재 상태다.

이번 정렬은 상위 진입 문서가 오래된 RC1/OpenAI-only 상태에 머무르지 않도록 `AGENTS.md`, `README.md`, `stack.yaml`, `docs/session_handoff_latest.md`, `adapters/provider_capability_matrix.yaml`을 최신 final dossier/export 기준으로 맞춘다.

검증 기준은 `tools/check_current_state_alignment.mjs`이다.

계속 금지되는 bare/general claim:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`
