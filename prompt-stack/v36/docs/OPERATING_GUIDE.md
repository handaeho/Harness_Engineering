# Current Package 운영 가이드

## 기본 운영 규칙
- active package는 `<current_package>/` 현재 상태만 설명한다.
- raw evidence는 `_evidence/<current_package>/`에 보존한다.
- autonomous asset과 Codex runtime asset을 섞지 않는다.
- 완료 claim은 검증 결과와 같은 강도로만 표현한다.

## 수정 전 확인
1. 수정 대상이 active runtime인지 evidence인지 구분한다.
2. Codex runtime 문서와 autonomous source stack의 경계를 확인한다.
3. state, verification, lifecycle 영향 범위를 확인한다.
4. 수정 후 validation runner를 실행한다.

## 상태 관리
현재 진행 상태는 `state/progress.md`, `state/feature_list.json`, `state/session-handoff.md`를 기준으로 유지한다.

## 검증 관리
검증은 `verification/`, `validation/`, `harness/`를 함께 사용한다. runner 실행 성공과 task 성공을 혼동하지 않는다.

## evidence 관리
대량 evidence는 active package로 되돌리지 않는다. 필요한 경우 `docs/ARTIFACT_MAP.md`에서 evidence package 위치만 확인한다.
