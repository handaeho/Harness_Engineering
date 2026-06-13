# HARNESS External Project 사용자 명령 템플릿 선택 가이드

이 파일은 새 프로젝트에서 어떤 사용자 명령 템플릿을 쓸지 고르는 라우터다.

HARNESS Core 전체는 프로젝트 루트의 `.harness/harness-core/`에 복사되어 있어야 한다.
프로젝트별 하네스 state, release, evidence, checker는 `.harness/project/` 아래에 둔다.
프로젝트 루트에는 실제 제품 코드와 제품 실행에 필요한 파일만 둔다.

## 템플릿 선택

- 빠른 로컬 MVP, mock/fixture 검증, live 연동 blocker 기록이 목표라면:
  - `USER_COMMAND_TEMPLATE_MVP.ko.md`
- production-grade 구현을 목표로 하고, DB/프레임워크/런타임/환경/운영/보안/테스트 계약까지 요구하려면:
  - `USER_COMMAND_TEMPLATE_PRODUCTION.ko.md`

## 공통 불변조건

- `natural_language_product_request_supported`
- `derive_missing_project_fields`
- `bootstrap_only_is_not_complete`
- `implementation_evidence_required`
- `.harness/project/`

## MVP 불변조건

- `local_mvp_required_without_live_access`
- `mock_or_fixture_flow_required`

## Production-Grade 불변조건

- `production_grade_contract_required`
- `database_contract_required`
- `framework_runtime_contract_required`
- `environment_configuration_contract_required`
- `deployment_operations_contract_required`
- `security_privacy_contract_required`
- `test_quality_gate_contract_required`
- `observability_contract_required`
- `production_claim_requires_project_specific_gate`

## 사용 규칙

1. 사용자는 두 템플릿 중 하나를 골라 에이전트에게 붙여 넣는다.
2. 사용자는 `요청:` 부분만 자연어로 바꾼다.
3. 에이전트는 긴 입력 양식을 다시 요구하지 않는다.
4. 부족한 값은 합리적으로 결정하고 `Assumption`으로 기록한다.
5. 안전한 구현이나 production-grade 계약 정의가 불가능한 경우에만 질문한다.
6. `production-ready`, `stable`, `release-gated` claim은 project-specific evidence와 gate 없이 열지 않는다.
