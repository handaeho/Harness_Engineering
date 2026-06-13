# HARNESS External Project MVP 자연어 제품 개발 명령 템플릿

이 템플릿은 사용자가 긴 입력 양식을 채우지 않고, 짧은 자연어로 “어떤 기능을 가진 어떤 소프트웨어를 누가 쓰고 무엇이 꼭 필요하다” 정도만 말해도 에이전트가 HARNESS 자산을 사용해 로컬 MVP 구현과 검증까지 진행하게 하는 명령이다.

불변조건:

- `natural_language_product_request_supported`
- `derive_missing_project_fields`
- `bootstrap_only_is_not_complete`
- `local_mvp_required_without_live_access`
- `mock_or_fixture_flow_required`
- `implementation_evidence_required`

## 사용자가 실제로 보내는 기본 명령

아래 블록에서 `요청:` 부분만 자기 말로 짧게 바꿔 보낸다. `.harness/project/PROJECT_INPUT.md` 양식을 먼저 채울 필요가 없다.

```text
프로젝트 루트 아래 `.harness/harness-core/`에 HARNESS Core 전체가 복사되어 있습니다.

아래 자연어 요청을 HARNESS external project MVP 흐름으로 처리하세요. 내가 긴 입력 양식을 다시 채우는 방식으로 진행하지 마세요.
하네스 project state, release, evidence, checker는 프로젝트 루트가 아니라 `.harness/project/` 아래에 생성하거나 갱신하세요. 프로젝트 루트에는 실제 제품 코드와 제품 실행에 필요한 파일만 두세요.

요청:
<여기에 2~8문장 정도로 만들고 싶은 소프트웨어, 대상 사용자, 핵심 기능, 사양, 꼭 필요한 제약을 자연어로 적습니다.>

실행 규칙:
1. 먼저 현재 repo 구조와 기존 스택을 확인하세요.
2. 내 자연어 요청에서 프로젝트 이름, 대상 사용자, 결과물, 핵심 기능, 사용자 흐름, 데이터, 제약, 성공 기준을 스스로 추출하세요.
3. 부족한 값은 작업을 막지 말고 합리적인 기본값으로 결정한 뒤 `Assumption`으로 기록하세요. 안전한 로컬 MVP도 만들 수 없을 때만 질문하세요.
4. `.harness/harness-core/templates/external-project/` 템플릿을 기준으로 `.harness/project/PROJECT_INPUT.md`, `.harness/project/PROJECT_BRIEF.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/scope.yaml`, `.harness/project/release/claim_boundary.yaml`, `.harness/project/release/blocker_register.yaml`를 생성하거나 병합하세요.
5. bootstrap이나 문서 정리에서 멈추지 말고 실제 제품 코드를 구현하세요.
6. 외부 API, 유료 API, secret, 실제 계정 접근이 필요하지만 승인이나 credential이 없으면 live 연동은 blocker로 기록하고 mock connector 또는 fixture 기반으로 로컬 MVP를 구현하세요.
7. raw request, raw response, auth header, API key, secret 값은 코드, 로그, evidence에 저장하지 마세요.
8. 프로젝트별 checker는 `.harness/project/tools/` 아래에만 두고 `.harness/harness-core/tools/`는 수정하지 마세요.
9. 구현된 사용자 흐름을 검증하는 test, smoke test, checker 중 최소 하나 이상을 추가하고 실행하세요.
10. 최종 완료 조건은 “로컬에서 실행 가능한 소프트웨어 + 실행 방법 + 실행된 검증 결과 + 남은 blocker 기록”입니다.

필수 검증:
1. `node .harness/project/tools/check_project_current_state.mjs`
2. `node .harness/project/tools/check_project_claims.mjs`
3. `node .harness/project/tools/check_project_precommit.mjs`
4. 프로젝트별 build/test/lint/smoke 명령

실패 처리:
1. 실패 원인을 stale evidence, checker invariant, 실제 구현 결함, 외부 승인/credential blocker로 분류하세요.
2. broad rewrite 없이 최소 수정 후 같은 검증을 다시 실행하세요.

최종 보고:
1. 구현된 기능
2. 실제 생성/수정한 제품 코드
3. 로컬 실행 방법
4. 실행한 검증
5. 통과/실패/hold 항목
6. 남은 blocker
7. claim boundary

중요:
- “bootstrap 완료”는 최종 완료가 아닙니다.
- “문서와 경계 설계 완료”도 최종 완료가 아닙니다.
- live 외부 연동이 막혀 있어도 mock/fixture 기반 MVP 구현은 완료해야 합니다.
- project-specific evidence 없이 `provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`를 열지 마세요.
```

## 팀 업무 도움 챗봇 MVP 예시

```text
프로젝트 루트 아래 `.harness/harness-core/`에 HARNESS Core 전체가 복사되어 있습니다.

아래 자연어 요청을 HARNESS external project MVP 흐름으로 처리하세요. 내가 긴 입력 양식을 다시 채우는 방식으로 진행하지 마세요.
하네스 project state, release, evidence, checker는 프로젝트 루트가 아니라 `.harness/project/` 아래에 생성하거나 갱신하세요. 프로젝트 루트에는 실제 제품 코드와 제품 실행에 필요한 파일만 두세요.

요청:
팀 내 업무 도움 챗봇을 개발해줘. 팀원이 자연어로 질문하면 메일 내용, 첨부파일, 일정에서 관련 정보를 찾아 요약해 주는 소프트웨어야. 사용자는 팀 구성원과 팀 리드이고, 꼭 필요한 기능은 메일/첨부/일정 통합 검색, 요약, 근거 표시, 권한 경계, secret 저장 금지야. 실제 Microsoft 365나 Google Workspace 연동은 나중에 할 거라 지금은 mock 데이터로 로컬에서 실행 가능한 MVP가 필요해. raw 업무 데이터나 auth header, API key는 evidence에 저장하면 안 돼.

실행 규칙:
1. 현재 repo 구조와 기존 스택을 확인하세요.
2. 내 자연어 요청에서 필요한 프로젝트 상태 파일을 `.harness/project/` 아래에 스스로 생성/갱신하세요.
3. bootstrap에서 멈추지 말고 실제 챗봇 MVP를 구현하세요.
4. live API는 blocker로 기록하고 mock connector 또는 fixture 기반으로 검색/요약 흐름을 구현하세요.
5. 실행 방법과 검증 결과를 기록하세요.
6. project-specific evidence 없이 `production-ready`, `stable`, `release-gated`를 열지 마세요.
```
