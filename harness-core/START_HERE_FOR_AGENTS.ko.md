# Agent Start Rules

HARNESS Core를 autonomous programming-agent runtime/evidence/gate package로 다룬다.
canonical directory/slug는 `harness-core`다.
기본 운영 루트는 현재 디렉터리다.
zip을 풀지 말고 루트 워크스페이스에서 바로 시작한다.

## Read Order

1. `CURRENT_STATE.json`
2. `CURRENT_STATE.yaml`
3. `AGENT_BOOTSTRAP.ko.md`
4. `AGENTS.md`
5. `release/claims/general/claim_ladder.md`
6. 현재 작업 stage의 `release/scopes/**/<stage>_scope.yaml`
7. 관련 `evidence/**` gate report

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

커밋 승인 직전 수렴 상태만 확인할 때 실행한다:

```bash
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
```

## Agent-Ready Export Mode

다른 대화, 다른 머신, 외부 에이전트에게 전달해야 할 때만 `exports/harness-core-agent-ready.zip`을 사용한다.
`latest_dossier_export`는 최종 dossier 증거 보관용 export이며 clean export 내부에 포함되지 않을 수 있다.

clean export 압축 해제본에서는 기본 health check로 아래 두 명령만 실행한다:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

Agent-ready export mode에는 `.git` metadata와 `node_modules`가 없다.
`node tools/checks/workspace/check_current_state_alignment.mjs`는 root workspace mode 전용이다.
`node tools/checks/workspace/check_clean_export_self_contained.mjs`는 root workspace에서 clean export zip 자체를 검사할 때만 사용한다.
`node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs`는 root workspace 전용 precommit checker다.

## External Product Project Placement

새 제품 프로젝트에 HARNESS Core를 적용할 때는 제품 프로젝트 루트를 유지한다.
HARNESS Core는 `<new-project-root>/.harness/harness-core/` 아래에 둔다.
제품 코드, 프로젝트 상태, evidence, release boundary, project-specific checker는 `<new-project-root>`에 둔다.
HARNESS Core 내부에 프로젝트별 파일을 추가하지 않는다.

사용자 입력 reference는 `docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`다.
실제 입력은 새 프로젝트 루트의 `PROJECT_INPUT.md`에 둔다.
기본 템플릿은 `templates/external-project/`에 있다.

## Claim Boundary

강한 claim은 계속 닫혀 있다:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

승인 없이 실행하지 않는다:

- OpenAI API call
- local model generation
- telemetry write
- `npm install`
- `npm ci`
- legacy reference source 수정
- `dist` 수정
- `evidence/reference-baseline` refresh

`exports/harness-core-final-agent-ready.zip`은 과거 호환용 export artifact다.
새 전달용 canonical artifact로 사용하지 않는다.
