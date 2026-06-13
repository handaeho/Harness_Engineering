# HARNESS Core 정형 프로젝트 입력 템플릿

이 문서는 사용자가 새 프로젝트를 완전 자율형 에이전트에게 맡기기 전에 사용할 수 있는 선택형 입력 양식입니다.
HARNESS Core 안의 이 파일은 reference template입니다. canonical path는 `docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`입니다. 실제로 채운 입력은 새 프로젝트 루트의 `.harness/project/PROJECT_INPUT.md`에 저장하거나, 에이전트에게 보내는 요청 본문에 그대로 붙여 넣을 수 있습니다.

사용자가 반드시 이 양식을 채워야 하는 것은 아닙니다. 짧은 자연어 제품 요청만 받은 경우에도 에이전트는 필요한 값을 스스로 추출하거나 보수적으로 가정해서 `.harness/project/PROJECT_INPUT.md`, `.harness/project/PROJECT_BRIEF.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/scope.yaml`, `.harness/project/release/claim_boundary.yaml`, `.harness/project/evidence/`, `.harness/project/tools/`를 생성하거나 갱신해야 합니다.

사용자가 직접 이 양식을 작성하는 경우, 모르는 항목은 비워두지 말고 `미정`이라고 적습니다. 불필요한 항목은 `해당 없음`이라고 적습니다.

## 1. 빠른 입력 양식

아래 블록만 채워도 프로젝트 시작에 필요한 핵심 정보가 들어갑니다.

```text
프로젝트 이름:

한 줄 설명:

대상 사용자:

만들고 싶은 결과물:

기술 스택 또는 선호 프레임워크:

반드시 필요한 기능:
1.
2.
3.

사용자가 실제로 하게 될 주요 흐름:
1.
2.
3.

저장하거나 다루는 데이터:

반드시 지켜야 할 제약:

이번에 하지 않을 것:
1.
2.
3.

성공 기준:
1.
2.
3.

테스트/검증 방법:

외부 API, 계정, 결제, secret 필요 여부:

배포 또는 실행 환경:

추가로 중요한 맥락:
```

## 1.1. 템플릿 선택

자연어 요청만으로 시작할 때는 아래 중 하나를 사용합니다.

```text
MVP:
.harness/harness-core/templates/external-project/USER_COMMAND_TEMPLATE_MVP.ko.md

Production-grade:
.harness/harness-core/templates/external-project/USER_COMMAND_TEMPLATE_PRODUCTION.ko.md
```

Production-grade 요청은 아래 항목을 에이전트가 추출하거나 결정해서 `.harness/project/`에 기록해야 합니다.

```text
프레임워크/언어/런타임:
데이터베이스 종류:
schema/migration/seed 전략:
환경 변수와 secret 저장 방식:
로컬/테스트/운영 실행 명령:
인증/인가/권한 모델:
로그/health/readiness/관측성:
배포/백업/복구/rollback 전제:
unit/integration/db/smoke/security/acceptance test:
```

## 2. 완성 입력 양식

복잡한 프로젝트이거나 신뢰성, 보안, 운영 품질이 중요한 경우에는 아래 전체 양식을 사용합니다.

### 2.1. 프로젝트 정체성

```text
프로젝트 이름:

프로젝트 slug:

한 줄 설명:

프로젝트 유형:
예: Web app / API server / CLI / library / mobile app / data pipeline / internal tool

대상 사용자:

사용자가 얻는 가치:

현재 단계:
예: 새 프로젝트 / 기존 프로젝트 확장 / 프로토타입 / 운영 제품 개선
```

### 2.2. 문제와 목표

```text
해결하려는 문제:

왜 지금 필요한가:

최종적으로 동작해야 하는 모습:

완료 조건:
1.
2.
3.
```

### 2.3. 기능 요구사항

```text
핵심 기능:
1.
2.
3.

사용자 흐름:
1.
2.
3.

관리자 또는 운영자 흐름, 있으면:
1.
2.
3.

입력:

출력:

상태 변화:

오류 처리:
```

### 2.4. 데이터와 도메인

```text
주요 데이터/엔티티:
1.
2.
3.

각 데이터의 필수 필드:

저장 위치:
예: localStorage / SQLite / PostgreSQL / file / external service / 미정

데이터 보존 기간:

민감 정보 포함 여부:

개인정보 포함 여부:
```

### 2.5. 기술 스택과 구조

```text
선호 언어:

선호 프레임워크:

반드시 사용해야 하는 라이브러리:

사용하지 말아야 할 기술:

프로젝트 구조 요구:
예: Next.js app router 표준 / FastAPI 표준 / Cargo workspace / Go module

기존 코드나 기존 repo가 있는지:

호환해야 하는 환경:
예: Node version / Python version / browser / OS / runtime
```

### 2.6. 품질 요구사항

```text
성능 요구:

접근성 요구:

보안 요구:

관측성/로그/모니터링 요구:

오류 복구 요구:

확장성 요구:

유지보수 요구:
```

### 2.7. 범위와 금지 사항

```text
이번 범위에 포함:
1.
2.
3.

이번 범위에서 제외:
1.
2.
3.

절대 하면 안 되는 일:
1.
2.
3.

수정 가능 경로, 기존 프로젝트인 경우:

수정 금지 경로, 기존 프로젝트인 경우:
```

### 2.8. 외부 의존성과 승인 경계

```text
새 dependency 설치 허용 여부:
예: 불가 / 승인 후 가능 / 자유롭게 가능

외부 API 호출 필요 여부:

외부 API 호출 승인 상태:
예: 미승인 / 승인됨 / 해당 없음

secret, API key, token 필요 여부:

결제나 비용 발생 가능성:

네트워크 접근 필요 여부:

배포 작업 포함 여부:
```

### 2.9. 검증 기준

```text
반드시 통과해야 하는 테스트:

빌드 명령:

테스트 명령:

수동 확인이 필요한 항목:

자동 checker가 확인해야 하는 항목:

실패하면 blocker로 기록해야 하는 조건:
```

### 2.10. 산출물 기대치

```text
사용자 문서 필요 여부:

개발자 문서 필요 여부:

아키텍처 문서 필요 여부:

handoff 문서 필요 여부:

evidence report 필요 수준:
예: 간단 / 표준 / 상세

최종 보고에서 꼭 보고받고 싶은 내용:
```

### 2.11. claim boundary

아래 strong claim은 프로젝트별 gate와 evidence가 없으면 기본적으로 금지됩니다.

```text
계속 blocked:
- provider-verified
- adapter-checked
- production-ready
- stable
- release-gated
- bare release-gated

이번 작업으로 허용 가능한 약한 claim:
예:
- project-<project-slug>-<feature-id>-implemented
- project-<project-slug>-<feature-id>-tested
- project-<project-slug>-<feature-id>-gate-passed
```

### 2.12. 에이전트 자율성 설정

```text
자율 진행 수준:
예: 낮음 / 표준 / 높음

사용자에게 반드시 물어봐야 하는 경우:
1.
2.
3.

자동으로 결정해도 되는 경우:
1.
2.
3.

실패 시 자동 수리 허용 범위:
예: 1회까지 / 테스트 실패만 / 금지

커밋 허용 여부:
예: 금지 / 승인 후 가능
```

## 3. 최소 예시

```text
프로젝트 이름:
Task Board

한 줄 설명:
브라우저에서 보드, 컬럼, 카드를 관리하는 로컬 Kanban 앱

대상 사용자:
개인 작업을 간단히 정리하려는 사용자

만들고 싶은 결과물:
React + TypeScript 기반 웹 앱

기술 스택 또는 선호 프레임워크:
React + TypeScript + Vite

반드시 필요한 기능:
1. 보드 생성
2. 컬럼 생성/수정/삭제
3. 카드 생성/수정/삭제
4. 카드 이동
5. localStorage 저장

사용자가 실제로 하게 될 주요 흐름:
1. 보드를 만든다.
2. 컬럼을 만든다.
3. 카드를 만들고 컬럼 사이로 이동한다.

저장하거나 다루는 데이터:
board, column, card

반드시 지켜야 할 제약:
외부 서버 없음, secret 없음, 브라우저 localStorage 사용

이번에 하지 않을 것:
1. 로그인
2. 서버 DB
3. 실시간 협업

성공 기준:
1. 핵심 기능 테스트 통과
2. 빌드 통과
3. README에 실행법 포함

테스트/검증 방법:
npm test, npm run build, project checker

외부 API, 계정, 결제, secret 필요 여부:
해당 없음

배포 또는 실행 환경:
로컬 개발 서버

추가로 중요한 맥락:
UI는 복잡한 대시보드보다 간단하고 빠른 작업 도구 느낌이 좋다.
```

## 4. 에이전트가 이 입력에서 생성해야 하는 산출물

에이전트는 이 입력을 받으면 최소한 아래 산출물을 만들어야 합니다.

```text
.harness/project/PROJECT_BRIEF.md
.harness/project/PROJECT_INPUT.md
.harness/project/CURRENT_STATE.yaml
.harness/project/release/scope.yaml
.harness/project/release/claim_boundary.yaml
.harness/project/release/blocker_register.yaml
.harness/project/evidence/current-state/
.harness/project/evidence/runs/
.harness/project/evidence/gates/
.harness/project/evidence/checks/
.harness/project/tools/check_project_current_state.mjs
.harness/project/tools/check_project_claims.mjs
.harness/project/tools/check_project_precommit.mjs
.harness/project/docs/handoff/
```

제품 코드는 프로젝트 언어와 프레임워크의 표준 구조에 둡니다. HARNESS Core는 `.harness/harness-core/` 아래에 둔 reference이며, 프로젝트별 하네스 상태나 checker를 그 안에 추가하지 않습니다.
