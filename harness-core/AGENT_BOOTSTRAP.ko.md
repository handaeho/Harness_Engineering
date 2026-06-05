# HARNESS Core Agent Bootstrap

## 목적

이 문서는 새 에이전트가 HARNESS Core 작업을 시작할 때 가장 먼저 읽는 적용 지침이다.
현재 canonical directory/slug는 `harness-core`다.

이 하네스는 프롬프트 묶음이 아니라, 에이전트가 claim을 과장하지 않고 evidence/gate 기반으로 작업하도록 만드는 운영 레이어입니다.

## 현재 상태 요약

- 현재 상태 파일: `CURRENT_STATE.yaml`
- dependency-free 현재 상태 파일: `CURRENT_STATE.json`
- 상태 라벨: `v2.0.0-rc.1-postrc-final-dossier`
- 범위: `active_scoped_final_dossier`
- 기본 운영 모드: root workspace mode
- 보조 전달/백업 모드: agent-ready export mode
- 전달/백업용 clean export: `exports/harness-core-agent-ready.zip`
- 최신 dossier evidence export: `exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`
- 최신 dossier evidence export SHA256: `4f863c921cf1e00098f88913ba0810e8808cfff1dca824a2feeb9d1a0a48c424`

기본 운영 방식은 이 디렉토리 자체를 에이전트 프로젝트 루트로 사용하는 것이다. 디렉토리명은 `harness-core/`이며 공식 프로젝트 이름은 HARNESS Core다. 다른 대화, 다른 머신, 외부 에이전트에게 넘겨야 하는 경우에만 `harness-core-agent-ready.zip`을 전달한다. Agent-ready export mode에서는 새 에이전트에게는 `harness-core-agent-ready.zip`을 전달한다. `v2.0.0-rc.1-postrc-final-dossier-export.zip`은 dossier evidence 보관용이며, clean export 내부에 포함되지 않을 수 있다.
정확한 clean export SHA-256은 archive 외부의 delivery metadata 또는 `evidence/clean-artifact-prune/agent_ready_clean_export_report.json`에서 확인한다. clean export 내부 문서에는 자기 자신의 SHA를 직접 고정하지 않는다.

## 운영 모드

### 1. Root workspace mode, 기본 모드

사용자가 HARNESS Core 루트 디렉토리 전체를 프로젝트 루트로 사용하는 경우입니다.
이때 에이전트는 루트에서 직접 시작합니다.
`.git` metadata가 있는 source workspace에서는 git readiness와 current-state alignment를 완전 검증할 수 있습니다.

첫 명령:

```bash
node tools/check_agent_ready_self_contained.mjs
```

Root workspace 전용 추가 검증:

```bash
node tools/check_current_state_alignment.mjs
node tools/check_reference_baseline_integrity.mjs
```

커밋 승인 직전 수렴 검증:

```bash
node tools/check_harness_core_final_precommit_convergence.mjs
```

### 2. Agent-ready export mode, 전달/백업 모드

다른 대화, 다른 머신, 외부 에이전트에게 넘길 때 사용하는 모드입니다.
이때는 `exports/harness-core-agent-ready.zip`을 전달합니다.
압축을 푼 디렉터리에는 `node_modules`와 `.git` metadata가 없습니다.
압축을 푼 뒤 첫 명령은 아래 명령입니다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_reference_baseline_integrity.mjs
```

Agent-ready export mode에서는 `node tools/check_current_state_alignment.mjs`를 기본 명령으로 사용하지 않습니다. 해당 checker는 root workspace mode 전용 검증 명령입니다.
`node tools/check_harness_core_final_precommit_convergence.mjs`도 root workspace mode 전용 precommit 검증 명령이며, clean export 압축 해제본의 기본 명령이 아닙니다.

## 반드시 읽을 파일

1. `START_HERE_FOR_AGENTS.ko.md`
2. `CURRENT_STATE.json`
3. `CURRENT_STATE.yaml`
4. `AGENTS.md`
5. `release/claim_ladder.md`
6. `release/current_state_claim_boundary.yaml`
7. 현재 작업 stage의 `release/*_scope.yaml`
8. 관련 `evidence/**` gate report

## Self-Contained Health Check

root workspace mode에서는 `harness-core/` 루트에서 아래 명령을 먼저 실행한다.

```bash
node tools/check_agent_ready_self_contained.mjs
```

agent-ready export mode에서는 clean export를 압축 해제한 직후, 압축 해제된 clean export 디렉터리 안에서 같은 명령을 실행한다.

이 명령은 Node.js built-in module만 사용한다. `npm install`, `npm ci`, `node_modules`, legacy reference source 접근을 요구하지 않는다.

`node tools/check_clean_export_self_contained.mjs`는 원본 workspace에서 `exports/harness-core-agent-ready.zip` archive 자체를 검사할 때만 사용하는 checker다. 루트 워크스페이스 작업이나 새 에이전트의 압축 해제본 내부 첫 검증 명령으로 사용하지 않는다.

## 작업 전 체크리스트

- `CURRENT_STATE.yaml`의 `allowed_claims`와 `blocked_claims`를 확인한다.
- 수정 가능 경로와 금지 경로를 확인한다.
- 작업 stage가 새 provider/local/telemetry execution을 요구하는지 확인한다.
- 필요한 checker와 evidence 위치를 먼저 정한다.
- bare/general claim을 열어야 한다면 별도 승인 없이는 중단한다.

## 작업 중 금지 사항

- OpenAI model API call
- OpenAI provider rerun
- 새 local model generation
- telemetry sink write
- redteam rerun
- adapter conformance rerun
- `npm install` 또는 `npm ci`
- `dist/**` 수정
- legacy reference source 수정
- `evidence/reference-baseline/**` refresh
- raw request/raw response/secret/API key/auth header 저장

## 작업 후 검증 명령

Root workspace mode:

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_current_state_alignment.mjs
node tools/scan_prohibited_claims.mjs
node tools/check_reference_baseline_integrity.mjs
node tools/check_harness_core_final_precommit_convergence.mjs
```

Agent-ready export mode:

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_reference_baseline_integrity.mjs
```

작업 성격에 따라 `node tools/validate_alpha.mjs`와 stage별 checker를 추가한다.
원본 workspace에서 clean export zip 자체를 다시 검증하는 작업일 때만 `node tools/check_clean_export_self_contained.mjs`를 추가한다.

## claim boundary 규칙

- `post-export-active-scoped-stable`은 bare `stable`이 아니다.
- `post-export-active-scoped-production-ready`는 bare `production-ready`가 아니다.
- `post-export-active-provider-lanes-verified`는 bare `provider-verified`가 아니다.
- `post-export-active-adapters-checked`는 bare `adapter-checked`가 아니다.
- `rc1-openai-scope-release-gated`는 bare `release-gated`가 아니다.

## 다음 작업 선택지

1. provider-verified future completion
2. adapter-checked future completion
3. bare production-ready/stable criteria redesign
4. current final dossier/export maintenance
