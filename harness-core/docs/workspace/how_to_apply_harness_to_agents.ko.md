# 하네스를 에이전트에 적용하는 방법

## 이 하네스가 무엇인지

HARNESS Core는 프롬프트 묶음이 아니라 에이전트 작업을 evidence, gate, claim boundary로 제어하는 운영 레이어다. 핵심 목적은 에이전트가 현재 증거보다 강한 claim을 하지 않게 하고, 작업 결과를 다음 에이전트가 이어받을 수 있는 형태로 남기는 것이다.
`harness-core`는 legacy name이며 과거 evidence/reference에서만 사용한다.

## 에이전트에 어떻게 적용되는지

에이전트는 루트의 `CURRENT_STATE.yaml`로 현재 허용 claim, 금지 claim, 최신 export, 보호 경로를 먼저 읽는다. 그 다음 `AGENT_BOOTSTRAP.ko.md`와 `AGENTS.md`를 읽고, 작업 stage의 scope/gate/evidence를 확인한다. 작업 후에는 checker와 scanner를 실행해 claim boundary가 유지됐는지 확인한다.

## 운영 모드

### Root workspace mode

기본 방식입니다. `harness-core/` 디렉토리 자체를 에이전트 프로젝트 루트로 사용합니다.
로컬 디렉토리명이 legacy name으로 남아 있어도 공식 프로젝트 이름은 HARNESS Core입니다. 에이전트는 zip을 풀지 않고 루트 워크스페이스에서 바로 시작합니다.

첫 명령:

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

### Agent-ready export mode

보조 방식입니다. 다른 환경으로 전달할 때 `exports/harness-core-agent-ready.zip`을 사용합니다.
압축을 푼 뒤에도 첫 명령은 동일합니다.

```bash
node tools/checks/workspace/check_agent_ready_self_contained.mjs
```

`node tools/checks/workspace/check_clean_export_self_contained.mjs`는 root workspace에서 clean export zip 자체를 검사할 때만 사용합니다.
일상적인 루트 워크스페이스 작업의 첫 명령은 아닙니다.

## Codex goal에서 어떻게 사용하는지

Codex goal executor는 `profiles/agents/codex_goal_executor.yaml`을 적용한다. 시작 시 `CURRENT_STATE.yaml`, `AGENT_BOOTSTRAP.ko.md`, `AGENTS.md`, `release/claims/general/claim_ladder.md`를 읽고, 종료 전 `node tools/checks/workspace/check_current_state_alignment.mjs`, `node tools/scanners/release/scan_prohibited_claims.mjs`, `node tools/checks/workspace/check_reference_baseline_integrity.mjs`를 실행한다.

## ChatGPT 리뷰어가 어떻게 사용하는지

ChatGPT 리뷰어는 `profiles/agents/chatgpt_reviewer.yaml`을 적용한다. 리뷰 대상 산출물이 `CURRENT_STATE.yaml`의 claim boundary와 충돌하지 않는지 확인하고, scoped claim과 bare claim을 혼동한 표현을 finding으로 남긴다.

## 기대 효과

- 새 에이전트가 최신 final dossier/export 상태를 빠르게 파악한다.
- allowed claim과 blocked claim의 기준점이 하나로 모인다.
- stale top-level 문서 때문에 작업 방향을 잘못 잡는 위험이 줄어든다.
- reference baseline, dist, raw payload, secret 저장 경계가 명확해진다.
- handoff와 gate report가 같은 현재 상태를 가리킨다.

## 자동화되지 않는 것

- provider execution, local model generation, telemetry sink write는 자동화되지 않는다.
- bare/general claim 승격은 자동화되지 않는다.
- release gate rerun은 자동화되지 않는다.
- 사람이 승인해야 하는 owner decision은 자동으로 대체되지 않는다.

## claim boundary가 필요한 이유

하네스에는 OpenAI-only, local-model, provider-diverse, active scoped readiness처럼 서로 다른 범위의 증거가 공존한다. claim boundary가 없으면 scoped evidence가 bare/general claim으로 과장될 수 있다. 이 파일과 checker는 그 승격을 막는다.

## scoped claim과 bare claim의 차이

`post-export-active-scoped-stable`은 active scoped evidence 범위에서만 쓸 수 있다. bare `stable`은 전체 일반 안정성 claim이므로 별도 gate가 필요하다. 같은 방식으로 `post-export-active-scoped-production-ready`, `post-export-active-provider-lanes-verified`, `post-export-active-adapters-checked`, `rc1-openai-scope-release-gated`는 각각 대응하는 bare claim을 열지 않는다.

## 현재 구조를 유지해야 하는 이유

기존 `release/`, `tools/`, `evidence/`, `evals/`, `docs/`, `adapters/`, `runtime/`, `security/`, `observability/` 구조는 증거 기반 하네스 계층으로 유지한다. 이번 개선은 하위 구조를 갈아엎는 것이 아니라, 새 에이전트가 최신 상태를 바로 읽도록 상단 적용 계층을 추가하는 것이다.

## 추가된 agent application layer의 역할

- `CURRENT_STATE.yaml`: machine-readable 현재 상태.
- `AGENT_BOOTSTRAP.ko.md`: 새 에이전트 시작 지침.
- `profiles/agents/*.yaml`: 에이전트 유형별 적용 프로필.
- `tools/checks/workspace/check_current_state_alignment.mjs`: 상위 문서와 final dossier/export 정렬 검증.
- `tools/checks/workspace/check_reference_baseline_integrity.mjs`: historical reference snapshot 무결성 검증.
- `evidence/current-state/**`: 현재 상태 정렬 evidence와 gate report.
