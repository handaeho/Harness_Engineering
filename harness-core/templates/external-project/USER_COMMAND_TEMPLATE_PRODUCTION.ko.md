# HARNESS External Project Production-Grade 자연어 제품 개발 명령 템플릿

이 템플릿은 사용자가 짧은 자연어 제품 요청만 제공해도 에이전트가 production-grade 구현에 필요한 기술 계약을 스스로 도출하고, 실제 제품 코드와 검증 근거를 만들도록 하는 명령이다.

주의: 이 템플릿은 production-grade 구현 경로를 요구하지만, project-specific gate와 evidence 없이 `production-ready`, `stable`, `release-gated` claim을 열라는 뜻이 아니다.

불변조건:

- `natural_language_product_request_supported`
- `derive_missing_project_fields`
- `bootstrap_only_is_not_complete`
- `production_grade_contract_required`
- `database_contract_required`
- `framework_runtime_contract_required`
- `environment_configuration_contract_required`
- `deployment_operations_contract_required`
- `security_privacy_contract_required`
- `test_quality_gate_contract_required`
- `observability_contract_required`
- `implementation_evidence_required`
- `production_claim_requires_project_specific_gate`

## 사용자가 실제로 보내는 기본 명령

아래 블록에서 `요청:` 부분만 자기 말로 바꿔 보낸다. 데이터베이스, 프레임워크, 실행 환경, 운영 조건을 이미 알고 있으면 요청에 적고, 모르면 에이전트가 기존 repo와 요구사항을 기준으로 보수적으로 결정해 `Assumption`과 `Decision`으로 기록한다.

```text
프로젝트 루트 아래 `.harness/harness-core/`에 HARNESS Core 전체가 복사되어 있습니다.

아래 자연어 요청을 HARNESS external project production-grade 흐름으로 처리하세요. 내가 긴 입력 양식을 다시 채우는 방식으로 진행하지 마세요.
하네스 project state, release, evidence, checker는 프로젝트 루트가 아니라 `.harness/project/` 아래에 생성하거나 갱신하세요. 프로젝트 루트에는 실제 제품 코드와 제품 실행에 필요한 파일만 두세요.

요청:
<여기에 만들고 싶은 소프트웨어, 대상 사용자, 핵심 기능, 반드시 필요한 사양, 제약, 알려진 DB/프레임워크/구동 환경을 자연어로 적습니다. 모르는 항목은 생략해도 됩니다.>

실행 규칙:
1. 현재 repo 구조, 기존 언어, 프레임워크, package scripts, dependency, runtime 파일, DB 관련 파일, env 예시 파일, Docker/compose/CI 파일 존재 여부를 먼저 확인하세요.
2. 자연어 요청에서 프로젝트 이름, 대상 사용자, 결과물, 핵심 기능, 사용자 흐름, 데이터, 제약, 성공 기준을 추출하세요.
3. 누락된 값은 작업을 막지 말고 기존 repo와 요구사항을 기준으로 보수적으로 결정하고 `Assumption` 또는 `Decision`으로 기록하세요. 단, 보안/데이터 보존/외부 결제/실제 운영 배포처럼 위험한 선택은 blocker 또는 질문으로 남기세요.
4. `.harness/harness-core/templates/external-project/` 템플릿을 기준으로 `.harness/project/PROJECT_INPUT.md`, `.harness/project/PROJECT_BRIEF.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/scope.yaml`, `.harness/project/release/claim_boundary.yaml`, `.harness/project/release/blocker_register.yaml`를 생성하거나 병합하세요.
5. bootstrap이나 설계 문서에서 멈추지 말고 실제 제품 코드를 구현하세요.
6. 프로젝트별 checker는 `.harness/project/tools/` 아래에만 두고 `.harness/harness-core/tools/`는 수정하지 마세요.
7. raw request, raw response, auth header, API key, secret, 실제 개인정보, 실제 업무 데이터는 코드, 로그, evidence에 저장하지 마세요.

Production-grade 계약을 반드시 작성하고 구현에 반영하세요:
1. Framework contract
   - 선택한 프레임워크, 언어, 주요 라이브러리, 버전을 기록하세요.
   - 기존 repo 스택이 있으면 우선 따르세요. 없으면 선택 이유와 대안을 `Decision`으로 기록하세요.
   - routing, API boundary, state management, validation, error handling 구조를 명시하세요.
2. Runtime contract
   - 필요한 Node/Python/Go/Rust 등 런타임 버전, OS 전제, package manager, 실행 명령, build 명령, test 명령을 기록하세요.
   - `package.json` scripts 또는 해당 생태계의 표준 명령을 정리하세요.
   - port, host, worker/process model, resource assumption을 기록하세요.
3. Database contract
   - DB 종류를 명시하세요. 미정이면 SQLite/PostgreSQL 등 합리적 기본값을 선택하고 이유를 기록하세요.
   - schema, migration, seed/fixture, index, constraint, transaction boundary, connection 설정을 구현하거나 명확히 기록하세요.
   - 데이터 보존, 백업/복구, 삭제 정책, 테스트 DB 전략을 기록하세요.
4. Environment configuration contract
   - `.env.example` 또는 동등한 env template을 만들고 필수 env var, 기본값, secret 여부, 로컬/테스트/운영 차이를 기록하세요.
   - secret은 값이 아니라 이름과 저장 방식만 기록하세요.
5. Security and privacy contract
   - authentication, authorization, role/permission model, input validation, rate limit, audit log, PII/민감정보 처리, secret redaction 정책을 기록하고 가능한 범위에서 구현하세요.
   - 실제 외부 API credential이나 민감 데이터가 없으면 live 연동은 blocker로 기록하고 mock/fixture 또는 local provider를 구현하세요.
6. Observability contract
   - structured logging, error reporting boundary, health/readiness check, audit event, metric 후보를 기록하세요.
   - 로컬에서 확인 가능한 최소 health/smoke endpoint 또는 command를 구현하세요.
7. Deployment and operations contract
   - local run, build artifact, deploy target assumption, Docker/compose 필요 여부, migration 실행 순서, rollback/backup 고려사항을 기록하세요.
   - 실제 production deployment는 승인 전에는 수행하지 말고 blocker로 남기세요.
8. Test and quality gate contract
   - unit, integration, database/migration, API/CLI/UI smoke, permission/security, secret/raw storage scan 중 해당되는 검증을 구현하고 실행하세요.
   - lint/typecheck/build/test 명령이 없으면 합리적으로 추가하거나 `Assumption`과 blocker를 기록하세요.
   - 핵심 사용자 흐름과 실패/권한 거부 흐름을 최소 1개 이상 검증하세요.

필수 검증:
1. `node .harness/project/tools/check_project_current_state.mjs`
2. `node .harness/project/tools/check_project_claims.mjs`
3. `node .harness/project/tools/check_project_precommit.mjs`
4. 프로젝트별 install 없는 정적 검증, lint, typecheck, build, unit test, integration test, smoke test
5. DB migration/schema 검증 또는 명시적 hold
6. secret/raw storage scan
7. env template completeness check
8. 핵심 사용자 흐름 acceptance test

실패 처리:
1. 실패 원인을 stale evidence, checker invariant, 실제 구현 결함, dependency/environment blocker, 외부 승인/credential blocker로 분류하세요.
2. broad rewrite 없이 최소 수정 후 같은 검증을 다시 실행하세요.
3. 실행하지 않은 검증은 실행한 것처럼 보고하지 마세요.

최종 보고:
1. 구현된 기능
2. 실제 생성/수정한 제품 코드
3. framework/runtime/database/environment 계약
4. security/privacy/observability/deployment 계약
5. 로컬 실행 방법
6. 실행한 검증
7. 통과/실패/hold 항목
8. 남은 blocker
9. claim boundary

중요:
- “production-grade 구현”은 HARNESS release claim을 여는 행위와 다릅니다.
- project-specific release gate와 evidence 없이 `production-ready`, `stable`, `release-gated`를 열지 마세요.
- live 외부 연동, 실제 배포, 유료 API, secret 사용은 명시 승인 전에는 수행하지 마세요.
```

## production-grade 내부 상태 변환 규칙

에이전트는 자연어 요청을 받으면 `.harness/project/` 아래에 최소한 다음 항목을 반영한다.

- product scope
- feature acceptance criteria
- framework/runtime decision
- database decision
- schema/migration/seed strategy
- env var contract
- security/privacy model
- observability/health contract
- deployment/operations blocker
- test matrix
- executed validation evidence
- claim boundary
- unresolved blockers
