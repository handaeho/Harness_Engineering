# V35 Release Notes

## Release Summary
v35는 평가된 prompt stack과 Codex runtime package의 current stable release입니다.

## Included Assets
- source-of-truth stack: `00_governance/`, `01_base/`, `02_overlays/`, `03_examples/`, `04_harness/`
- assembled prompt bundle: `99_total/`
- Codex runtime package: `codex/CODEX_RUNTIME_GUIDE.md`, `codex/skills/*`
- current validation entrypoint: `harness/validate_current_v35.mjs`

## Evaluation Evidence
- native semantic judge: 73/73 pass
- Codex runtime semantic judge: 25/25 pass
- actor output authenticity: 98/98 judgeable
- release gates: 9 pass, 2 partial with downgrade, 0 fail
- critical failures: 0

## Downgraded Claims
- primary-source deferred item은 downgrade 상태이며 release-grade current fact로 취급하지 않습니다.
- sandbox와 telemetry gap은 production-readiness claim을 제한합니다.
- containment proof가 생기기 전까지 containment는 downgrade 상태로 유지합니다.
- 이 release는 local runner와 semantic judge evidence 아래에서 검증되었으며 production telemetry 기반 검증이 아닙니다.
- Codex runtime readiness는 behavioral 기준으로 평가되었으며 `codex/skills`는 `00~04`의 textual mirror로 취급하지 않습니다.
- 이 release는 live production rollout certification이 아닙니다.

## Prohibited Claims
다음 상태는 주장하지 않습니다.

- `production-monitored`
- `containment-verified`
- `all-primary-source-validated`
- `public-benchmark-certified`
- `live-production-rollout-certified`

## Follow-Up Items
primary-source validation, sandbox / containment proof, telemetry integration, post-release drift monitoring은 후속 작업으로 유지합니다.
