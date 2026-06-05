# HARNESS Core Precommit Validation Repair

이 문서는 `v2.0.0-post-rename-harness-core-precommit-validation-repair` 단계의 범위를 기록한다.

이번 단계는 commit 실행 단계가 아니다. 목적은 HARNESS Core rename 이후 precommit validation을 막던 reference baseline schema/fixture 불일치와 git metadata 없는 clean export 실행 모드 차이를 정리하는 것이다.

## 정리된 표면

- `evals/fixtures/static/required_files.json`은 canonical checker인 `tools/check_reference_baseline_integrity.mjs`를 요구한다.
- `stack.schema.json`과 `schemas/stack.schema.json`은 top-level `reference_baseline`을 요구한다.
- `project.legacy_names`는 빈 배열을 허용한다.
- `schemas/validation_report.schema.json`의 `runner_reexecution`은 `reference_baseline_runners_reexecuted: false`를 요구한다.
- `tools/check_harness_core_git_readiness.mjs`는 `.git` metadata가 없는 clean export/uploaded zip context에서 `not_applicable_no_git_metadata`를 기록하고 hard fail하지 않는다.

## 실행 위치

source workspace precommit에서는 git metadata가 있으므로 다음 checker가 실제 git readiness를 검사한다.

```bash
node tools/check_harness_core_git_readiness.mjs
```

clean export나 uploaded zip처럼 `.git` metadata가 없는 context에서는 같은 checker가 git readiness를 적용 대상 아님으로 기록한다. 이 모드는 source workspace의 precommit git readiness를 대체하지 않는다.

이번 repair evidence는 다음 명령으로 생성한다.

```bash
node tools/check_harness_core_precommit_validation_repair.mjs
```

## Claim Boundary

기록 가능한 claim은 `harness-core-precommit-validation-repair-recorded`, `precommit-validation-repair-checked`, `git-readiness-mode-awareness-recorded`에 한정한다.

`provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`는 계속 blocked 상태다.
