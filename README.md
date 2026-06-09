# HARNESS

HARNESS는 자율형 코딩 에이전트와 프롬프트 런타임을 증거, 게이트, claim boundary로 운영하기 위한 agent engineering 프로젝트입니다.

이 README는 Codex 오픈소스 지원 프로그램 심사자가 프로젝트의 목적, 구성, 현재 검증 상태, 유지관리 가치를 빠르게 파악할 수 있도록 작성되었습니다.

## 1. 프로젝트 개요

HARNESS는 에이전트가 코딩, 리뷰, 릴리스 준비, 보안 점검, 운영 인수인계를 수행할 때 "무엇을 했는지"와 "무엇을 검증했는지"를 분리해서 남기도록 만드는 하네스입니다.

프로젝트는 두 축으로 구성됩니다.

- `prompt-stack/v36`: autonomous agent와 Codex runtime을 위한 현재 prompt harness package입니다.
- `harness-core`: prompt package를 실제 유지관리 워크플로에 적용하기 위한 evidence-gated autonomous agent engineering harness입니다.

단순한 프롬프트 모음이 아니라, agent 작업을 `state`, `scope`, `verification`, `release`, `evidence`, `handoff` 단위로 관리하는 운영 레이어를 목표로 합니다.

## 2. 목적

에이전트 기반 개발에서는 작업 결과보다 강한 표현이 쉽게 생깁니다. 예를 들어 runner 파일이 존재한다는 사실이 실행 검증을 뜻하지 않고, canary 통과가 전체 provider 검증을 뜻하지 않으며, scoped release gate 결과가 일반 release-gated 상태를 뜻하지 않습니다.

HARNESS는 이런 문제를 줄이기 위해 만들어졌습니다.

- 메인테이너가 반복적으로 수행하는 리뷰, 분류, 검증, 릴리스 판단을 파일과 게이트로 남깁니다.
- 에이전트가 현재 증거보다 강한 claim을 하지 못하도록 claim ladder와 prohibited claim scan을 둡니다.
- 다음 에이전트나 리뷰어가 이어받을 수 있도록 현재 상태, evidence pointer, unresolved item, handoff를 구조화합니다.
- provider 실행, local model 실행, telemetry write, release gate rerun처럼 비용이나 위험이 있는 작업은 승인 경계 안에서 다룹니다.

## 3. 완전 자율형 에이전트에게 적용 시 기대점

HARNESS 자산을 보유한 프로젝트는 완전 자율형 에이전트에게 단순한 작업 지시만 전달하는 것이 아니라, 현재 상태, 허용 범위, 검증 기준, 금지 claim, evidence 기록 방식을 함께 전달할 수 있습니다. 이 구조는 에이전트가 긴 작업을 이어가거나 다른 에이전트가 후속 작업을 맡을 때 특히 유용합니다.

- 작업 시작점이 명확합니다.
  - 에이전트는 `CURRENT_STATE.yaml`, `AGENT_BOOTSTRAP.ko.md`, `AGENTS.md`, agent profile을 읽고 현재 stage, 보호 경로, claim boundary, 첫 검증 명령을 파악할 수 있습니다.

- 자율 실행의 범위가 통제됩니다.
  - provider 실행, local model generation, telemetry write, release gate rerun, raw payload 저장처럼 위험하거나 비용이 있는 작업은 승인 경계 안에 묶입니다.

- 결과 과장이 줄어듭니다.
  - runner 존재, mock 통과, canary 통과, scoped gate 통과를 더 강한 일반 claim으로 승격하지 않도록 claim ladder와 prohibited claim scanner가 보조합니다.

- 인수인계가 쉬워집니다.
  - 작업 결과가 `evidence`, `release`, `docs`, `FINAL_HANDOFF` 형태로 남아 다음 에이전트나 리뷰어가 무엇이 검증됐고 무엇이 남았는지 추적할 수 있습니다.

- 유지관리 자동화에 연결하기 쉽습니다.
  - PR review, issue triage, release readiness, redteam/containment, telemetry review 같은 메인테이너 업무를 stage별 checker와 evidence report로 나눌 수 있습니다.

- 실패 복구가 구조화됩니다.
  - blocker, unresolved item, rollback plan, owner decision packet을 별도로 기록해 같은 실패를 반복하거나 강한 claim을 성급히 여는 위험을 줄입니다.

## 4. 주요 기능

- 현재 안정 prompt package 관리
  - `prompt-stack/v36`은 autonomous agent assets, Codex runtime assets, state, verification, scope, lifecycle, validation runner를 포함합니다.
  - active package와 evidence package를 분리해 raw evidence가 실행 자산으로 섞이지 않게 관리합니다.

- Codex runtime 분리
  - Codex용 `AGENTS.md`, runtime guide, skills, validation assets를 autonomous source-of-truth bundle과 분리합니다.
  - `validate_codex_runtime` 결과로 Codex runtime boundary를 확인합니다.

- Core Harness Spec
  - `harness-core/core/spec/harness.spec.yaml`은 모델 독립적인 agent 실행 계약을 정의합니다.
  - goal, solved condition, context policy, tool policy, output contract, verification policy, failure handling, claim strength policy를 다룹니다.

- provider/local adapter 관리
  - OpenAI API, Ollama, vLLM adapter surface와 provider capability matrix를 둡니다.
  - canary, dry-run, local endpoint readiness, adapter coverage gap을 서로 다른 claim 수준으로 분리합니다.

- runtime harness
  - context builder, execution loop, retry policy, tool router, approval gate, mock tool registry, provider execution guard, structured output guard, tool-calling guard를 포함합니다.
  - mock runtime evidence와 실제 provider/local execution evidence를 구분합니다.

- 평가와 검증
  - `evals/`, `validation/`, `verification/`, `tools/` 아래에 static validation, benchmark, schema validation, runner, checker, report generator가 있습니다.
  - 문서 존재, JSON/YAML parse, bundle parity, checksum drift, prohibited claim, evidence separation을 검증합니다.

- 보안, redteam, containment
  - prompt injection, indirect prompt injection, tool poisoning, data leakage, excessive agency, approval bypass 등을 threat model과 fixture/gate로 다룹니다.
  - mock redteam과 containment dry-run은 실제 containment proof와 구분됩니다.

- observability와 telemetry
  - trace schema, telemetry schema, redaction policy, retention policy, dashboard spec, monitoring window policy, incident response policy를 둡니다.
  - telemetry-connected와 production-monitored 같은 claim도 별도 evidence와 gate로 제한합니다.

- release와 claim boundary
  - claim ladder, release gate, rollback plan, blocker register, owner decision packet, final dossier/export를 관리합니다.
  - scoped/qualified claim과 bare/general claim을 명확히 분리합니다.

- agent handoff
  - `CURRENT_STATE.yaml`, `CURRENT_STATE.json`, `AGENT_BOOTSTRAP.ko.md`, `AGENTS.md`, `profiles/agents/*.yaml`, `FINAL_HANDOFF.ko.md`를 통해 새 에이전트가 현재 상태를 재구성할 수 있게 합니다.

## 5. 프로젝트 구성

| 경로 | 역할 |
|---|---|
| `prompt-stack/CURRENT_STABLE_VERSION.txt` | 현재 prompt-stack stable pointer |
| `prompt-stack/RELEASE_INDEX.md` | stable package, legacy package, evidence package 인덱스 |
| `prompt-stack/v36/` | 현재 active prompt harness package |
| `prompt-stack/_evidence/v36/` | v36 evidence package |
| `prompt-stack/_legacy/`, `prompt-stack/_archive/` | 이전 버전과 release evidence 보존 영역 |
| `harness-core/CURRENT_STATE.yaml` | HARNESS Core 현재 상태와 claim boundary |
| `harness-core/core/` | model-independent harness contract |
| `harness-core/adapters/` | provider/local adapter definitions and capability matrix |
| `harness-core/runtime/` | context, orchestration, tool, provider, sandbox, mock runtime layer |
| `harness-core/evals/` | suites, fixtures, reports |
| `harness-core/security/` | threat model, redteam, containment policy |
| `harness-core/observability/` | trace, telemetry, monitoring, redaction policy |
| `harness-core/release/` | type/lane-grouped claim, gate, scope, blocker, decision, approval assets |
| `harness-core/tools/` | validators, runners, claim scanners, export/check scripts |
| `harness-core/evidence/` | generated or reviewed evidence and audit records |
| `harness-core/exports/` | agent-ready export와 final dossier export |

## 6. 자율 구현 산출물의 위치와 성격

완전 자율형 에이전트가 HARNESS를 사용해 새로운 프로젝트를 구현할 때 산출물은 한 문서나 한 폴더에 몰리지 않습니다. 실제 제품 코드, 요구사항, 현재 상태, 검증 증거, gate 결과, claim boundary, 인수인계 자료가 서로 다른 성격의 파일로 분리되어 남습니다.

신규 프로젝트의 운영 방식은 프로젝트 저장소 자체를 `<new-project-root>`로 두고, 실제 코드는 해당 언어와 프레임워크가 기대하는 표준 구조로 개발하는 것입니다. HARNESS Core 자산은 프로젝트 코드와 섞지 않고 `<new-project-root>/.harness/harness-core/` 아래에 둡니다.

이 구조는 `harness-core/docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt`의 표준 사용 모델입니다.

새 프로젝트에 복사해 쓸 수 있는 기본 템플릿과 project-level checker는 `harness-core/templates/external-project/`에 있습니다.
사용자가 프로젝트를 설명할 때 쓰는 정형 입력 템플릿은 `harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`입니다. 실제로 채운 프로젝트별 입력값은 `<new-project-root>/PROJECT_INPUT.md`에 남깁니다.

| 위치 | 성격 |
|---|---|
| `<new-project-root>/README.md` | 프로젝트별 진입 문서 |
| `<new-project-root>/PROJECT_INPUT.md` | 사용자가 채운 프로젝트별 정형 입력 |
| `<new-project-root>/PROJECT_BRIEF.md` | 사용자의 정형 프로젝트 설명을 제품 요구사항으로 정리한 human-readable brief |
| `<new-project-root>/CURRENT_STATE.yaml` | 새 프로젝트의 현재 stage, 완료/미완료 기능, allowed claim, blocked claim을 담는 machine-readable state |
| `<new-project-root>/src/`, `app/`, `pages/`, `lib/`, `cmd/`, `internal/` 등 | 해당 언어와 프레임워크가 기대하는 실제 제품 코드 위치 |
| `<new-project-root>/package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod` 등 | 프로젝트 런타임, 의존성, 빌드 설정 |
| `<new-project-root>/tests/` 또는 프레임워크 표준 테스트 위치 | 제품 동작을 확인하는 테스트 코드와 fixture |
| `<new-project-root>/docs/architecture/` | 아키텍처 설명과 설계 근거 |
| `<new-project-root>/docs/decisions/` | 주요 기술 선택과 의사결정 기록 |
| `<new-project-root>/docs/handoff/` | 다음 에이전트나 리뷰어가 이어받기 위한 handoff |
| `<new-project-root>/evidence/current-state/` | 현재 상태와 상태 정합성 증거 |
| `<new-project-root>/evidence/runs/` | 구현, 테스트, 빌드, 검증 실행 기록 |
| `<new-project-root>/evidence/gates/` | 프로젝트별 gate 실행 결과 |
| `<new-project-root>/evidence/checks/` | checker 결과와 claim scan 결과 |
| `<new-project-root>/release/scope.yaml` | 이번 작업에서 다룬 범위와 다루지 않은 범위 |
| `<new-project-root>/release/claim_boundary.yaml` | 이번 구현 결과로 허용되는 claim과 계속 금지되는 claim |
| `<new-project-root>/release/blocker_register.yaml` | unresolved item, blocker, owner decision 필요 항목 |
| `<new-project-root>/tools/check_project_current_state.mjs` | 프로젝트 상태 파일과 evidence pointer를 확인하는 checker |
| `<new-project-root>/tools/check_project_claims.mjs` | 프로젝트 claim boundary와 금지 claim을 확인하는 checker |
| `<new-project-root>/tools/check_project_precommit.mjs` | 커밋 전 프로젝트 검증을 묶는 checker |
| `<new-project-root>/.harness/harness-core/` | HARNESS Core 자산. 운영 가이드, reusable checker, claim ladder, reference baseline 보관 위치 |
| `<new-project-root>/.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md` | 새 프로젝트 입력 양식의 reference template |
| `<new-project-root>/.harness/harness-core/templates/external-project/` | 새 프로젝트 루트로 복사할 수 있는 AGENTS, CURRENT_STATE, release, checker 템플릿 |
| `harness-core/tools/check_external_project_template_contract.mjs` | HARNESS Core 안의 external project template 계약 검증 |

예를 들어 사용자가 정형 템플릿으로 `task-board` 프로젝트를 요청하면 에이전트는 `task-board/`를 새 프로젝트 루트로 만들고, 채운 입력은 `task-board/PROJECT_INPUT.md`에 남깁니다. 실제 소스는 선택한 프레임워크의 표준 구조에 맞춰 `src/`, `app/`, `package.json`, `tests/` 등에 둡니다. HARNESS Core는 `task-board/.harness/harness-core/`에 배치하고, 프로젝트 상태와 검증 증거는 `task-board/CURRENT_STATE.yaml`, `task-board/evidence/`, `task-board/release/`, `task-board/tools/`에 남깁니다.

따라서 `harness-core/tools`는 HARNESS 자체의 공통 validator, runner, scanner, export/check script를 보관하는 위치로 유지합니다. 프로젝트별 checker는 `.harness/harness-core/tools`에 계속 추가하지 않고 `<new-project-root>/tools/`에 두어야 탐색성과 소유권 경계가 유지됩니다.

이 구조의 목적은 코드와 주장을 분리하는 것입니다. 제품 코드가 만들어졌다는 사실은 테스트 통과나 운영 준비를 뜻하지 않으며, 테스트 일부가 통과했다는 사실도 일반 `production-ready` 또는 `stable` claim을 뜻하지 않습니다. HARNESS는 실제 산출물, 실행 증거, claim boundary를 분리해 다음 에이전트나 사람이 이어받을 때 무엇을 믿을 수 있고 무엇을 다시 검증해야 하는지 확인할 수 있게 합니다.

MCP 형태로 확장할 경우에도 이 원칙은 유지됩니다. `PRODUCT_SPEC`, `PRODUCT_STATE`, evidence, claim boundary는 MCP `resources`로 노출하고, checker 실행이나 report 생성은 MCP `tools`로 제공하며, 프로젝트 생성 템플릿은 MCP `prompts`로 제공할 수 있습니다. MCP는 접근과 실행 인터페이스이고, 신뢰 가능한 source-of-record는 repo 안의 코드, 상태 파일, evidence, gate 결과로 유지하는 방향이 안전합니다.

## 7. 현재 상태와 검증 범위

현재 source-of-record는 다음 파일입니다.

- `harness-core/CURRENT_STATE.yaml`
- `harness-core/FINAL_HANDOFF.ko.md`
- `harness-core/evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json`
- `prompt-stack/CURRENT_STABLE_VERSION.txt`
- `prompt-stack/v36/records/final_validation_record.json`

현재 상태 요약:

- `prompt-stack` current stable version: `v36`
- `harness-core` version: `v2.0.0`
- `harness-core` state label: `v2.0.0-rc.1-postrc-final-dossier`
- 기본 운영 모드: `root_workspace`
- 보조 전달 모드: `agent_ready_export`
- agent-ready export: `harness-core/exports/harness-core-agent-ready.zip`
- latest dossier evidence export: `harness-core/exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`
- latest dossier evidence export SHA-256: `4f863c921cf1e00098f88913ba0810e8808cfff1dca824a2feeb9d1a0a48c424`

`prompt-stack/v36/records/final_validation_record.json` 기준 검증 상태:

- `validate_current_v36`: `188/188 pass`
- `validate_assembled_bundle`: `18/18 pass`
- `validate_codex_runtime`: `17/17 pass`
- checksum drift: `0`
- evidence checksum drift: `0`
- raw evidence inside `v36`: `0`
- prohibited positive claims in user docs: `0`

위 검증은 v36 active package의 local practical structure validation, assembled bundle validation, Codex runtime validation 범위입니다. 이 결과를 live production rollout, public benchmark certification, 전체 provider verification, bare release-gated claim으로 해석하지 않습니다.

## 8. 사용 방법

### 8.1. prompt-stack을 확인할 때

```bash
cat prompt-stack/CURRENT_STABLE_VERSION.txt
cat prompt-stack/RELEASE_INDEX.md
```

현재 stable package는 `prompt-stack/v36/`입니다. 사용자 문서는 `prompt-stack/v36/PROMPT_USER_GUIDE.md`, agent 시작점은 `prompt-stack/v36/AGENTS.md`, Codex runtime 시작점은 `prompt-stack/v36/codex/AGENTS.md`와 `prompt-stack/v36/codex/CODEX_RUNTIME_GUIDE.md`입니다.

검증 명령:

```bash
node prompt-stack/v36/harness/validate_current_v36.mjs
node prompt-stack/v36/harness/validate_assembled_bundle.mjs
node prompt-stack/v36/harness/validate_codex_runtime.mjs
```

### 8.2. HARNESS Core를 확인할 때

```bash
cd harness-core
node tools/check_agent_ready_self_contained.mjs
node tools/check_current_state_alignment.mjs
node tools/check_reference_baseline_integrity.mjs
node tools/scan_prohibited_claims.mjs
```

새 에이전트는 먼저 `harness-core/START_HERE_FOR_AGENTS.ko.md`, `harness-core/CURRENT_STATE.json`, `harness-core/CURRENT_STATE.yaml`, `harness-core/AGENT_BOOTSTRAP.ko.md`, `harness-core/AGENTS.md`를 읽습니다.

### 8.3. 다른 환경으로 전달할 때

보조 전달 산출물은 다음 파일입니다.

```text
harness-core/exports/harness-core-agent-ready.zip
```

압축 해제 후에는 clean export 디렉터리 안에서 아래 명령을 실행합니다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_reference_baseline_integrity.mjs
```

`harness-core/exports/v2.0.0-rc.1-postrc-final-dossier-export.zip`은 dossier evidence 보관용 export이며, 새 에이전트 전달용 기본 package가 아닙니다.

## 9. 유지관리 워크플로

HARNESS는 변경을 다음 순서로 다룹니다.

1. 현재 상태와 claim boundary를 읽습니다.
2. 작업 scope와 수정 가능 경로를 정합니다.
3. spec, fixture, schema, runner, checker 중 필요한 자산을 좁게 갱신합니다.
4. task-specific evidence를 생성하거나 기존 evidence pointer를 정리합니다.
5. claim scanner와 stage별 gate를 실행합니다.
6. allowed claim과 blocked claim을 다시 확인합니다.
7. 다음 에이전트가 이어받을 수 있도록 handoff와 unresolved item을 기록합니다.

이 흐름은 오픈소스 메인테이너가 반복적으로 수행하는 PR 리뷰, 이슈 분류, 릴리스 준비, 보안/품질 확인 작업을 agent-readable artifact로 남기기 위한 구조입니다.

## 10. 제한과 claim boundary

HARNESS의 중요한 원칙은 "증거가 없는 claim을 열지 않는다"입니다.

현재 `harness-core/CURRENT_STATE.yaml` 기준 허용된 scoped/qualified claims:

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

현재 blocked bare/general claims:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`

Canonicalization rules:

- `post-export-active-provider-lanes-verified`는 `provider-verified`가 아닙니다.
- `post-export-active-adapters-checked`는 `adapter-checked`가 아닙니다.
- `post-export-active-scoped-production-ready`는 bare `production-ready`가 아닙니다.
- `post-export-active-scoped-stable`은 bare `stable`이 아닙니다.
- `rc1-openai-scope-release-gated`는 bare `release-gated`가 아닙니다.

기본 금지 작업:

- OpenAI model API call without explicit scope and approval
- OpenAI provider rerun without approval
- new local model generation without approval
- telemetry sink write without approval
- redteam rerun without approval
- adapter conformance rerun without approval
- `npm install` 또는 `npm ci` without approval
- raw request/raw response/secret/API key/auth header storage
- manual edit of `dist/**`
- refresh of `harness-core/evidence/reference-baseline/**` without explicit scope

## 11. 향후 계획

HARNESS의 궁극적인 목표는 사용자가 정형화된 템플릿으로 프로젝트를 설명하면, 완전 자율형 에이전트가 현대적인 컴퓨터 엔지니어링 원칙을 최대한 적용해 신뢰할 수 있고 안전한 결과물을 만들도록 돕는 것입니다. 이를 위해 단순한 prompt 개선이 아니라, 요구사항 입력, 설계, 구현, 검증, 보안, 배포 판단, 인수인계까지 이어지는 전체 agent engineering loop를 강화할 계획입니다.

### 11.1. 개발 로드맵

- 정형화된 프로젝트 입력 템플릿을 제품형 인터페이스로 발전시킵니다.
  - 현재 `harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`는 목표, 사용자 가치, 기능 요구사항, 비기능 요구사항, 제약, 제외 범위, 승인 경계, 검증 기준을 일관된 형식으로 제공하도록 정리되어 있습니다.
  - 템플릿 입력을 `product spec`, `feature yaml`, `claim boundary`, `test plan`, `evidence plan`으로 자동 변환하는 구조를 확장합니다.

- 완전 자율형 실행 루프를 고도화합니다.
  - 에이전트가 `Read -> Plan -> Implement -> Verify -> Critique -> Repair -> Handoff` 흐름을 스스로 반복하되, 각 단계의 종료 조건과 실패 조건을 명확히 기록하게 합니다.
  - 반복 실패, no-gain loop, stale context, late clarification, unsafe widening 같은 실패 유형을 감지하고 자동으로 좁히거나 멈추는 정책을 강화합니다.

- 현대적 소프트웨어 엔지니어링 기본값을 내장합니다.
  - 테스트 가능성, 모듈 경계, 타입/스키마 안정성, API 계약, 보안 기본값, observability, rollback, release readiness를 기본 산출물에 포함합니다.
  - 단순 코드 생성이 아니라 요구사항 추적성, 설계 근거, 테스트 근거, 유지보수 가능성을 함께 남기는 방식을 강화합니다.

- 검증과 evidence 자동화를 확장합니다.
  - 기능별 checker, schema validator, redteam fixture, replay runner, release gate를 더 촘촘하게 연결합니다.
  - runner 실행 결과와 evidence pointer를 자동으로 연결해 "검증 파일 존재"와 "실행 검증 통과"를 분리합니다.

- 안전한 자율성을 강화합니다.
  - destructive command, dependency install, provider call, local model generation, telemetry write, production deployment는 승인 경계 안에서만 수행하도록 유지합니다.
  - raw request/raw response, secret, API key, authorization header 저장 금지와 redaction 정책을 더 강하게 자동 점검합니다.

- provider와 adapter 검증 범위를 넓힙니다.
  - OpenAI, Ollama, vLLM 등 provider/local adapter의 conformance, structured output, tool calling, no-tool path, replay regression을 더 넓은 범위에서 검증할 수 있도록 확장합니다.
  - `provider-verified`와 `adapter-checked`는 별도 final gate와 owner decision이 준비될 때까지 계속 blocked로 유지합니다.

- 보안과 containment를 강화합니다.
  - prompt injection, indirect prompt injection, tool poisoning, excessive agency, data leakage, schema abuse, tool-output trust abuse에 대한 redteam/containment suite를 확장합니다.
  - mock-only 통과와 실제 containment proof를 분리하고, 필요한 경우 Codex Security와 연결 가능한 증거 구조를 준비합니다.

- 운영 신뢰성과 인수인계를 개선합니다.
  - telemetry, trace, anomaly threshold, dashboard, incident response, rollback linkage를 프로젝트별로 적용할 수 있게 합니다.
  - 새 에이전트가 프로젝트를 이어받을 때 필요한 `current state`, `decision log`, `evidence index`, `unresolved items`, `approval boundary`, `next action`을 더 작은 패킷으로 재구성할 수 있게 합니다.

- MCP 형태의 하네스 제공을 준비합니다.
  - HARNESS를 문서형 자산에 머무르게 하지 않고, MCP server가 제공하는 `resources`, `tools`, `prompts` 형태로 노출하는 방향을 검토합니다.
  - 에이전트가 필요한 순간에 프로젝트 상태, 템플릿, 검증 기준, evidence pointer, claim boundary를 MCP resource로 읽고, checker 실행이나 report 생성을 MCP tool로 호출할 수 있게 하는 구조를 목표로 합니다.
  - 사용자는 정형화된 프로젝트 설명을 제출하고, MCP 기반 HARNESS가 이를 실행 가능한 spec, gate, evidence workflow로 변환하는 인터페이스를 지향합니다.

### 11.2. 보강점

- 템플릿 기반 프로젝트 입력이 아직 완성된 제품형 인터페이스로 제공되지 않습니다.
  - 현재는 `docs/guides/PROJECT_INPUT_TEMPLATE.ko.md` 문서 양식이 중심이며, 사용자의 정형 입력을 자동으로 product spec, feature state, checker, evidence plan으로 변환하는 흐름은 더 구현해야 합니다.

- `.harness/harness-core/` 기반의 vendored harness 구조를 더 자동화해야 합니다.
  - 현재 신규 프로젝트 문서와 기본 템플릿/checker는 `<new-project-root>/.harness/harness-core/` 기준으로 정리되어 있습니다.
  - 다음 단계는 템플릿 복사를 넘어 project scaffolder, MCP tool, framework별 preset, validation gate를 자동 생성하는 것입니다.

- 완전 자율형 실행 루프의 end-to-end proof가 아직 충분하지 않습니다.
  - 일부 runner와 evidence는 존재하지만, 다양한 실제 프로젝트에서 장시간 자율 구현, 검증, 복구, 인수인계가 반복적으로 통과했다는 넓은 replay evidence는 더 필요합니다.

- 현대적 엔지니어링 품질 기준이 모든 산출물에 자동 적용되지는 않습니다.
  - 테스트 전략, API 계약, 보안 기본값, observability, rollback readiness가 프로젝트 유형별로 자동 선택되고 강제되는 구조를 더 보강해야 합니다.

- 실제 provider/local adapter 검증은 더 넓혀야 합니다.
  - 현재 scoped claim은 유지하되, bare `provider-verified`와 bare `adapter-checked`를 열려면 별도 final gate, owner decision, 더 넓은 coverage evidence가 필요합니다.

- 보안과 containment는 더 강한 실행 증거가 필요합니다.
  - mock-only dry-run과 design evidence를 넘어 실제 redteam, containment proof, Codex Security 연계 가능성까지 검토할 수 있는 증거 구조를 강화해야 합니다.

- 운영 claim은 계속 범위를 분리해야 합니다.
  - `production-monitored` 같은 scoped claim도 evidence와 gate에 의해 유지되어야 하며, bare `production-ready`나 bare `stable`은 별도 기준 재설계 전까지 열지 않습니다.

- 사용자 신뢰를 위한 공개 검증 UX가 부족합니다.
  - README와 evidence는 존재하지만, 비전문가도 결과물의 안전성, 검증 범위, 남은 위험을 빠르게 이해할 수 있는 summary, dashboard, release note 구조를 더 다듬어야 합니다.

- agent-ready export와 final dossier export의 사용자 경험을 더 개선해야 합니다.
  - 전달성과 감사 가능성은 확보되어 있지만, 새 사용자가 압축 해제 후 바로 self-check, 적용, 프로젝트 템플릿 생성을 수행하는 흐름은 더 단순화할 필요가 있습니다.

- MCP 제공 형태는 아직 구현되지 않았습니다.
  - 현재 HARNESS는 파일, 문서, runner, evidence 중심으로 구성되어 있으며, MCP server로 resource/tool/prompt를 제공하는 runtime interface는 별도 설계와 구현이 필요합니다.
  - MCP로 제공할 resource schema, tool contract, permission boundary, audit log, error handling, versioning, compatibility policy를 정의해야 합니다.

현재 final dossier/export 이후의 즉시 후속 경로는 다음과 같습니다.

- `provider-verified` future completion
- `adapter-checked` future completion
- bare `production-ready` / `stable` criteria redesign
- current final dossier/export maintenance

이 후속 작업은 기존 scoped claim을 일반 claim으로 자동 승격하지 않습니다. 별도 gate, owner decision, evidence bundle이 없으면 strong claim은 계속 blocked 상태로 유지됩니다.

## 12. 주요 문서

- `harness-core/README.md`
- `harness-core/START_HERE_FOR_AGENTS.ko.md`
- `harness-core/AGENT_BOOTSTRAP.ko.md`
- `harness-core/AGENTS.md`
- `harness-core/CURRENT_STATE.yaml`
- `harness-core/docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt`
- `harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`
- `harness-core/FINAL_HANDOFF.ko.md`
- `harness-core/core/spec/harness.spec.yaml`
- `harness-core/release/claims/general/claim_ladder.md`
- `harness-core/release/gates/core-release/release_gate.yaml`
- `harness-core/adapters/provider_capability_matrix.yaml`
- `prompt-stack/RELEASE_INDEX.md`
- `prompt-stack/v36/README.md`
- `prompt-stack/v36/docs/CURRENT_STATE.md`
- `prompt-stack/v36/reports/VALIDATION_SUMMARY.md`
- `prompt-stack/v36/records/final_validation_record.json`
