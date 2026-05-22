# V35 Validation

## 실행 방법
`prompt-stack` 루트에서 다음 명령을 실행합니다.

```bash
node v35/harness/validate_current_v35.mjs
```

## 결과 위치
검증 결과는 `validation/current_validation_result.json`에 기록됩니다.

## 검증 범위
이 validation은 active v35 구조, JSON parse 가능 여부, archive metadata 존재 여부, downgrade language 보존, 금지 positive claim 부재 여부를 확인합니다.

## 검증하지 않는 것
production telemetry, containment proof, public benchmark certification, live production rollout certification은 이 validation의 범위가 아닙니다.
