# HARNESS External Project Template

이 템플릿은 새 프로젝트 루트에서 HARNESS Core를 `.harness/harness-core/`에 vendored reference로 두고, 프로젝트별 하네스 상태를 `.harness/project/` 아래에 둘 때의 최소 프로젝트 자산이다.

사용자가 프로젝트 요구사항을 처음 정리할 때는 `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`를 참조할 수 있다. 실제 프로젝트 입력과 상태는 `.harness/project/PROJECT_INPUT.md`, `.harness/project/PROJECT_BRIEF.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/*`, `.harness/project/evidence/*`로 관리한다.

## 사용 방법

새 프로젝트 루트에서 실행한다.

```bash
mkdir -p .harness/project
cp -R .harness/harness-core/templates/external-project/. .harness/project/
node .harness/project/tools/check_project_current_state.mjs
node .harness/project/tools/check_project_claims.mjs
```

`.harness/project/PROJECT_INPUT.md`는 프로젝트별로 채운 입력값이나 자연어 요청에서 추출한 값을 보관하는 파일이다. `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`는 reference template로 유지하고 직접 수정하지 않는다.

이미 `.harness/project/AGENTS.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/*`, `.harness/project/tools/check_*`가 있으면 덮어쓰기 전에 병합한다.

## 사용자 명령 템플릿

사용자가 “이런 기능을 가진 소프트웨어를 개발해줘”라고 요청할 때는 아래 템플릿 중 하나를 사용한다. 이 템플릿들은 긴 양식 입력용이 아니라 짧은 자연어 요청을 하네스가 스스로 구조화하고 구현까지 진행하게 하는 명령이다.

- `USER_COMMAND_TEMPLATE.ko.md`: MVP/production-grade 템플릿 선택 가이드
- `USER_COMMAND_TEMPLATE_MVP.ko.md`: 빠른 로컬 MVP, mock/fixture 검증, blocker 기록
- `USER_COMMAND_TEMPLATE_PRODUCTION.ko.md`: DB, 프레임워크, 런타임, 환경, 보안, 운영, 테스트 계약을 포함하는 production-grade 구현 흐름

중요한 구분:

- `cp -R .harness/harness-core/templates/external-project/. .harness/project/`는 프로젝트별 하네스 상태와 checker를 `.harness/project/` 아래에 준비하는 bootstrap 명령이다.
- 사용자가 `.harness/project/PROJECT_INPUT.md` 양식을 직접 채우지 않아도, 에이전트는 자연어 요청에서 필요한 값을 추출하고 부족한 값은 `Assumption`으로 기록해야 한다.
- 제품 개발 요청의 완료 조건은 bootstrap이 아니라 실제 동작하는 소프트웨어 구현, 실행 방법 기록, 검증 통과, 남은 blocker 기록이다.
- 외부 API나 secret이 승인되지 않아 live 연동이 막혀도, 에이전트는 mock connector 또는 fixture 기반으로 사용 가능한 MVP를 구현해야 한다.
- production-grade 요청에서는 DB schema/migration, framework/runtime, env template, security/privacy, observability, deployment/operations, test quality gate를 명시하고 검증해야 한다.
- 제품 코드와 사용자 흐름 검증 없이 문서와 checker만 만든 상태는 완료가 아니다.
- project-specific evidence 없이 `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`를 열면 안 된다.

## 소유권 경계

- 제품 코드와 제품 실행 파일은 새 프로젝트 루트의 프레임워크 표준 위치에 둔다.
- HARNESS Core 자산은 `.harness/harness-core/` 아래에 둔다.
- 프로젝트별 하네스 state, release, evidence, checker는 `.harness/project/` 아래에 둔다.
- 프로젝트별 checker를 `.harness/harness-core/tools/`에 추가하지 않는다.
