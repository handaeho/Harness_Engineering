# Final Handoff

공식 프로젝트 이름은 HARNESS Core입니다.
현재 canonical directory/slug는 `harness-core`입니다.

## Current Terminal State

- Active scoped terminal archive is sealed.
- Final release dossier is recorded.
- Final dossier export is recorded.
- Bare `provider-verified` is open by release-grade provider gate evidence.
- Other bare/general release claims remain blocked.

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
- `provider-verified`

## Blocked Bare/General Claims

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
- Integrity checker: `node tools/checks/workspace/check_reference_baseline_integrity.mjs`
- Legacy reference source는 현재 운영 대상이 아니며 clean export/self-contained check에 필요하지 않습니다.

## Next Options

1. vLLM execution for adapter-checked final gate
2. adapter-checked future completion
3. general release approval after adapter-checked final gate
4. 현재 final dossier/export를 최종본으로 보관

vLLM 실행 후 제출/검토할 파일 목록은 아래 checker가 생성한다:

```bash
npm run check:release-grade-vllm-evidence-package
```

전체 vLLM evidence path의 첫 단계는 아래 환경 guard다:

```bash
npm run preflight:vllm-operator-env
```

검토 시 `evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json`의
`claim_promotion_readiness`와 `ordering_checks`를 우선 확인한다.

전체 vLLM adapter evidence path는 아래 명령이다:

```bash
npm run check:release-grade-vllm-operator-packet
npm run vllm-release-grade-evidence-gate
```

전체 release-grade reinforcement 상태는 아래 audit으로 확인한다:

```bash
npm run check:release-grade-completion-audit
```

`status: hold`이면 provider-verified는 열린 상태일 수 있지만, vLLM evidence 또는 general release approval 부족으로 전체 목표 완료는 아니다.
