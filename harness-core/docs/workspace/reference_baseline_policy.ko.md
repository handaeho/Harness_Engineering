# Reference Baseline Policy

HARNESS Core의 active operating surface에서는 `reference baseline`이라는 이름을 사용한다.

`evidence/reference-baseline/`은 historical reference snapshot의 integrity 확인용 사본이다. 현재 운영 source of truth가 아니며, 새 에이전트가 별도 source directory를 갖고 있어야 한다는 요구도 아니다.

기본 검증 명령:

```bash
node tools/checks/workspace/check_reference_baseline_integrity.mjs
```

이 checker는 `evidence/reference-baseline/file_inventory.json`과 `evidence/reference-baseline/checksums.json`의 존재, snapshot metadata, `.DS_Store` path 부재, source rescan/checksum recalculation 미수행 상태를 확인한다.

precommit validation fixture와 schema에서도 active field는 `reference_baseline`이다. Validation report schema의 runner field는 `reference_baseline_runners_reexecuted: false`이며, 이 값은 historical reference snapshot runner를 재실행하지 않았다는 경계를 기록한다.

strong claim은 열지 않는다. 기록 가능한 claim은 `reference-baseline-deemphasized`, `reference-baseline-integrity-checked`, `legacy-reference-policy-recorded`, `active-docs-reference-name-aligned`, `harness-core-final-surface-checked`, `harness-core-git-readiness-recorded`, `harness-core-agent-ready-export-refreshed` 같은 weak/stage claim에 한정한다.
