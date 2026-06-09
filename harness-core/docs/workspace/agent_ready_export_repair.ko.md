# Agent-Ready Export Repair

이번 단계는 `v2.0.0-post-final-dossier-agent-ready-export-repair`이다.

목적은 기존 final dossier/export 이후 추가된 current-state/application layer를 새 export zip에 포함해, 새 에이전트가 zip 하나만 받아도 현재 final dossier 상태와 하네스 적용법을 읽을 수 있게 만드는 것이다.

생성 대상 export:

- `exports/v2.0.0-rc.1-postrc-final-dossier-agent-ready-export.zip`

이 단계는 새 provider 실행, local model generation, telemetry sink write, release gate rerun, redteam rerun, adapter conformance rerun을 수행하지 않는다.

계속 금지되는 strong claim:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`

검증 기준:

```bash
node tools/refresh/workspace/refresh_agent_ready_export_with_current_state_layer.mjs
node tools/checks/workspace/check_export_contains_current_state_layer.mjs
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/scanners/release/scan_prohibited_claims.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```
