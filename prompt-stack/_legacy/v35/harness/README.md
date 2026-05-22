# V35 Harness

이 폴더는 현재 v35 검증 entrypoint를 포함합니다.

## 실행 방법
다음 명령을 `prompt-stack` 루트에서 실행합니다.

```bash
node v35/harness/validate_current_v35.mjs
```

## 검증 내용
`validate_current_v35.mjs`는 다음을 확인합니다.

- active v35 필수 파일 존재 여부
- active JSON record parse 가능 여부
- archive manifest와 checksum 존재 여부
- current-facing 문서의 required downgrade language 존재 여부
- 금지된 positive claim 부재 여부

## Claim Boundary
이 harness는 local current-state validation용입니다. production telemetry, containment proof, public benchmark certification, live production rollout certification을 검증하지 않습니다.
