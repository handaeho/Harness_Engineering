# Agent Bootstrap Rules

HARNESS Core를 evidence-gated autonomous agent engineering harness로 실행한다.
canonical directory/slug는 `harness-core`다.
프롬프트 묶음으로 취급하지 않는다.
claim은 evidence와 gate 없이 강화하지 않는다.

## State

- 현재 상태 파일: `CURRENT_STATE.yaml`
- dependency-free 현재 상태 파일: `CURRENT_STATE.json`
- 상태 라벨: `v2.0.0-rc.1-postrc-final-dossier`
- 범위: `active_scoped_final_dossier`
- 기본 운영 모드: root workspace mode
- 보조 전달/백업 모드: agent-ready export mode
- 전달/백업용 clean export: `exports/harness-core-agent-ready.zip`
- 최신 dossier evidence export: `exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`
- 최신 dossier evidence export SHA256: `4f863c921cf1e00098f88913ba0810e8808cfff1dca824a2feeb9d1a0a48c424`

기본 운영 방식은 이 디렉토리 자체를 에이전트 프로젝트 루트로 사용하는 것이다.
새 에이전트에게는 `harness-core-agent-ready.zip`을 전달한다.
`v2.0.0-rc.1-postrc-final-dossier-export.zip`은 dossier evidence 보관용이며 clean export 내부에 포함되지 않을 수 있다.
clean export 내부 문서에는 자기 자신의 SHA를 직접 고정하지 않는다.

## Read Order

1. `START_HERE_FOR_AGENTS.ko.md`
2. `CURRENT_STATE.json`
3. `CURRENT_STATE.yaml`
4. `AGENTS.md`
5. `release/claims/general/claim_ladder.md`
6. `release/claims/general/current_state_claim_boundary.yaml`
7. 현재 작업 stage의 `release/scopes/**/<stage>_scope.yaml`
8. 관련 `evidence/**` gate report

## Root Workspace Mode

먼저 실행한다:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

source workspace 전용 검증이 필요하면 실행한다:

```bash
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

커밋 승인 직전 수렴 검증만 필요할 때 실행한다:

```bash
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
```

## Agent-Ready Export Mode

clean export 압축 해제본에서는 아래 명령을 기본 health check로 실행한다:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

`node tools/checks/workspace/check_current_state_alignment.mjs`는 root workspace mode 전용이다.
`node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs`는 root workspace mode 전용 precommit 검증 명령이다.
`node tools/checks/workspace/check_clean_export_self_contained.mjs`는 원본 workspace에서 `exports/harness-core-agent-ready.zip` archive 자체를 검사할 때만 사용한다.

## External Product Project Placement

새 제품 프로젝트에 적용할 때는 제품 프로젝트 루트를 `<new-project-root>`로 유지한다.
HARNESS Core는 `<new-project-root>/.harness/harness-core/` 아래에 둔다.
제품 코드와 프로젝트별 evidence/checker는 `<new-project-root>`에 둔다.
HARNESS Core 내부에는 추가하지 않는다.
사용자의 정형 프로젝트 입력 reference는 `docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`다.
실제 입력은 새 프로젝트 루트의 `PROJECT_INPUT.md`에 둔다.
새 프로젝트용 템플릿과 project-level checker는 `templates/external-project/`에 있다.

## Pre-Work Checks

- `CURRENT_STATE.yaml`의 `allowed_claims`와 `blocked_claims`를 확인한다.
- 수정 가능 경로와 금지 경로를 확인한다.
- 작업 stage가 provider, local model, telemetry execution을 요구하는지 확인한다.
- 필요한 checker와 evidence 위치를 먼저 정한다.
- bare/general claim을 열어야 하면 별도 승인 없이는 중단한다.

## Forbidden Without Approval

- OpenAI model API call
- OpenAI provider rerun
- 새 local model generation
- telemetry sink write
- redteam rerun
- adapter conformance rerun
- `npm install`
- `npm ci`
- `dist/**` 수정
- legacy reference source 수정
- `evidence/reference-baseline/**` refresh
- raw request/raw response/secret/API key/auth header 저장

## Post-Work Validation

Root workspace mode:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/scanners/release/scan_prohibited_claims.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
node tools/checks/workspace/check_asset_purpose_boundaries.mjs
```

Agent-ready export mode:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

작업 성격에 따라 `node tools/validators/evals/validate_alpha.mjs`와 stage별 checker를 추가한다.

## Claim Boundary

- `post-export-active-scoped-stable`은 bare `stable`이 아니다.
- `post-export-active-scoped-production-ready`는 bare `production-ready`가 아니다.
- `post-export-active-provider-lanes-verified`는 bare `provider-verified`가 아니다.
- `post-export-active-adapters-checked`는 bare `adapter-checked`가 아니다.
- `rc1-openai-scope-release-gated`는 bare `release-gated`가 아니다.
