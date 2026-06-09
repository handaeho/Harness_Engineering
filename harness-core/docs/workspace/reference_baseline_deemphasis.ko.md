# Reference Baseline Deemphasis

이번 단계는 기존 reference snapshot을 현재 운영 대상처럼 보이게 만드는 이름을 active HARNESS Core 표면에서 제거하는 작업이다.

변경 원칙:

- active docs와 profiles는 `reference baseline` 표현을 사용한다.
- 기본 검증 명령은 `node tools/checks/workspace/check_reference_baseline_integrity.mjs`다.
- `evidence/reference-baseline/`은 historical reference snapshot이며 source of truth가 아니다.
- snapshot checksum value는 재계산하지 않는다.
- legacy reference source를 다시 스캔하지 않는다.
- provider-verified, adapter-checked, production-ready, stable, release-gated는 계속 blocked다.
