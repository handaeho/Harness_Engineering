# Start Here For Agents

이 프로젝트의 공식 이름은 HARNESS Core입니다.
현재 canonical directory/slug는 `harness-core`입니다.

이 디렉토리 자체가 기본 운영 루트입니다. 로컬 디렉토리명은 `harness-core/`이고 현재 canonical project name은 HARNESS Core입니다.
에이전트는 zip을 풀지 않고, 이 루트 디렉토리에서 바로 시작합니다.

다른 대화, 다른 머신, 외부 에이전트에게 전달해야 할 때만 `exports/harness-core-agent-ready.zip`을 사용합니다.

새 제품 프로젝트에 HARNESS Core를 적용할 때는 제품 프로젝트 루트를 따로 두고, 이 자산을 `<new-project-root>/.harness/harness-core/` 아래에 배치합니다. 제품 코드, 프로젝트 상태, evidence, release boundary, project-specific checker는 `<new-project-root>`에 두고, HARNESS Core 내부에는 추가하지 않습니다. 사용자의 정형 프로젝트 입력 reference는 `docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`이고, 실제로 채운 입력은 새 프로젝트 루트의 `PROJECT_INPUT.md`에 둡니다. 새 프로젝트용 기본 템플릿은 `templates/external-project/`에 있습니다.

처음 읽을 순서:

1. `CURRENT_STATE.json`
2. `CURRENT_STATE.yaml`
3. `AGENT_BOOTSTRAP.ko.md`
4. `AGENTS.md`
5. `release/claims/general/claim_ladder.md`
6. 현재 작업 stage의 `release/scopes/**/<stage>_scope.yaml`
7. 관련 `evidence/**` gate report

루트 워크스페이스에서 바로 실행할 첫 health check:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

루트 워크스페이스에서는 source workspace 전용 checker도 사용할 수 있다.

```bash
node tools/checks/workspace/check_current_state_alignment.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

커밋 승인 직전 수렴 상태를 확인할 때만 root workspace에서 아래 checker를 추가로 실행한다.

```bash
node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs
```

Agent-ready export mode에서는 clean export를 압축 해제한 뒤, 압축 해제된 디렉터리 안에서 아래 두 명령만 기본 health check로 실행한다.

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

Agent-ready export mode에는 `.git` metadata와 `node_modules`가 없으므로 `node tools/checks/workspace/check_current_state_alignment.mjs`를 기본 명령으로 사용하지 않는다. 이 명령은 root workspace mode 전용이다.

이 check는 Node.js built-in module만 사용하며 `npm install`, `npm ci`, `node_modules`, legacy reference source 접근을 요구하지 않는다.

Reference baseline integrity를 확인할 때는 아래 명령을 사용한다.

```bash
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

`node tools/checks/workspace/check_clean_export_self_contained.mjs`는 root workspace에서 clean export zip 자체를 검사할 때만 사용합니다. 일상적인 루트 워크스페이스 작업의 첫 명령은 아닙니다.
`node tools/checks/workspace/check_harness_core_final_precommit_convergence.mjs`도 root workspace 전용 precommit checker이며, agent-ready export mode의 기본 명령이 아닙니다.

`CURRENT_STATE.yaml`의 `operation_mode.primary`는 `root_workspace`다.
`agent_ready_export`는 전달/백업용 clean export를 의미한다.
`latest_dossier_export`는 최종 dossier 증거 보관용 export이며, clean export 내부에 포함되지 않을 수 있다.
`exports/harness-core-final-agent-ready.zip`은 과거 호환용 export artifact이며 새 전달용 canonical artifact가 아니다.

강한 claim은 계속 닫혀 있다: `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`.

금지된 작업은 별도 승인 없이 실행하지 않는다: OpenAI API call, local model generation, telemetry write, `npm install`, `npm ci`, legacy reference source 수정, `dist` 수정, `evidence/reference-baseline` refresh.
