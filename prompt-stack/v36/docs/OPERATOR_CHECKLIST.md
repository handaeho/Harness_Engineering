# Current Package Operator Checklist

## 시작 전
- current stable pointer가 `v36/`인지 확인한다.
- 작업이 autonomous asset인지 Codex runtime asset인지 구분한다.
- state, verification, lifecycle 영향 범위를 확인한다.

## 작업 중
- raw evidence를 active package에 다시 섞지 않는다.
- Codex runtime을 autonomous source stack mirror로 표현하지 않는다.
- 검증 전 완료 claim을 만들지 않는다.

## 종료 전
- 필요한 validation runner를 실행한다.
- state와 handoff를 갱신한다.
- 제한 사항과 follow-up을 기록한다.
