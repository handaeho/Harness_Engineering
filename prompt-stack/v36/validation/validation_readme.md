# Current Package Validation

`validation/`은 현재 validation suite와 실행 결과를 보관한다.

## 포함 자산
- `current_validation_suite.json`
- `current_validation_result.json`
- actor output / semantic judge schema

## 사용법
```powershell
node prompt-stack/<current_package>/harness/validate_current.mjs
```

validation run history는 active package가 아니라 `_evidence/<current_package>/validation_runs/`에 보존한다.
