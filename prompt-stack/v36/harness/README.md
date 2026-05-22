# V36 Harness Runners

이 디렉터리는 active package 검증 runner를 제공한다.

## 주요 명령
```powershell
node prompt-stack/v36/harness/validate_current_v36.mjs
node prompt-stack/v36/harness/validate_assembled_bundle.mjs
node prompt-stack/v36/harness/validate_codex_runtime.mjs
node prompt-stack/v36/harness/run_smoke_validation.mjs
```

## 운영 원칙
runner 성공은 구조 검증 결과다. 실제 작업 완료 claim은 task-specific verification과 함께 판단한다.
