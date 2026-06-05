# HARNESS Core Final Precommit Convergence

이 문서는 `v2.0.0-harness-core-final-precommit-convergence-autopilot` 단계의 최종 수렴 범위를 기록한다.

이번 단계는 commit 실행 단계가 아니다. 목표는 owner approval phrase만 받으면 바로 commit할 수 있는 staged/validated 상태를 만드는 것이다.

## 운영 모드

Root workspace mode가 기본 운영 모드다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_current_state_alignment.mjs
node tools/check_reference_baseline_integrity.mjs
node tools/scan_prohibited_claims.mjs
node tools/validate_alpha.mjs
node tools/check_harness_core_final_precommit_convergence.mjs
```

Agent-ready export mode는 보조 전달/백업 모드다. clean export 압축 해제본에서 기본 health check는 아래 두 명령이다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_reference_baseline_integrity.mjs
```

`node tools/check_current_state_alignment.mjs`와 `node tools/check_harness_core_final_precommit_convergence.mjs`는 root workspace 전용이다.

## Reference Baseline

Active reference baseline은 `evidence/reference-baseline`이다. 이 단계는 snapshot checksum 재계산, source scan, refresh를 수행하지 않는다.

## Clean Export

Canonical agent-ready clean export는 `exports/harness-core-agent-ready.zip`이다. clean export에는 `node_modules`, `dist`, `.git`, `.DS_Store`, `archive`, old exports, raw payload, secret value를 포함하지 않는다.

## Git Boundary

최종 목표 상태는 `commit_ready: true`, `commit_performed: false`, `commit_approval_required: true`다.

실제 commit은 아래 승인 문구가 별도 메시지로 제공되기 전까지 수행하지 않는다.

```text
I approve committing the HARNESS Core rename and final surface cleanup.
```

## Claim Boundary

이번 단계에서 기록 가능한 claim은 precommit convergence와 command/export/git readiness에 관한 weak/stage claim뿐이다.

`provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`, bare `release-gated`는 계속 blocked다.
