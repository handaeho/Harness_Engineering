# Current Package Validation

`validation/`은 현재 validation suite와 실행 결과를 보관한다.

## 포함 자산
- `current_validation_suite.json`
- `current_validation_result.json`
- actor output / semantic judge schema

## 사용법
```powershell
node prompt-stack/v36/harness/validate_current_v36.mjs
```

validation run history는 active package가 아니라 `_evidence/v36/validation_runs/`에 보존한다.
