# Final Handoff

공식 프로젝트 이름은 HARNESS Core입니다.
현재 canonical directory/slug는 `harness-core`입니다.

## Current Terminal State

- Active scoped terminal archive is sealed.
- Final release dossier is recorded.
- Final dossier export is recorded.
- Bare/general claims remain blocked.

## Allowed Scoped/Qualified Claims

- `provider-diverse`
- `local-model-verified`
- `post-export-active-provider-lanes-verified`
- `post-export-active-adapters-checked`
- `post-export-active-scoped-production-ready`
- `post-export-active-scoped-stable`
- `post-rc-openai-only-stable`
- `post-rc-openai-only-production-ready`
- `production-monitored`
- `telemetry-connected`
- `containment-verified`
- `rc1-openai-scope-release-gated`

## Blocked Bare/General Claims

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`

## Final Export

- Path: `exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`
- SHA256: `4f863c921cf1e00098f88913ba0810e8808cfff1dca824a2feeb9d1a0a48c424`

## Agent-Ready Export

- Path: `exports/harness-core-agent-ready.zip`
- SHA256: `evidence/clean-artifact-prune/agent_ready_clean_export_report.json` 또는 외부 delivery metadata에서 확인

## Reference Baseline

- Path: `evidence/reference-baseline`
- Integrity checker: `node tools/check_reference_baseline_integrity.mjs`
- Legacy reference source는 현재 운영 대상이 아니며 clean export/self-contained check에 필요하지 않습니다.

## Next Options

1. provider-verified future completion
2. adapter-checked future completion
3. bare production-ready/stable criteria redesign
4. 현재 final dossier/export를 최종본으로 보관
