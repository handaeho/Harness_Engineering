# Current Package 제한과 후속 항목

## 현재 제한
- 운영 telemetry는 연결되어 있지 않다.
- containment proof는 별도 산출되어 있지 않다.
- provider 다양성 검증은 추가 신뢰도 개선 항목이다.
- 일부 source item은 archive reference로만 보존된다.
- post-release drift monitoring은 운영 시 별도 추적이 필요하다.

## claim 제한
`<current_package>/`은 current stable package이며 local validation, assembled bundle validation, Codex runtime validation, 보존된 evidence 기준으로 설명한다. 운영 환경 관측이나 containment 검증이 완료된 것처럼 표현하지 않는다.

## 후속 관리
후속 항목은 `records/followup_backlog.json`에서 관리한다. 작업 시작 전에는 active scope와 validation 기준을 먼저 정한다.
