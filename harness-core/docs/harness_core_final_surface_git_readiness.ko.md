# HARNESS Core Final Surface / Git Readiness

이 단계는 rename 이후 active surface와 git readiness를 정리한다.

- canonical name: `HARNESS Core`
- slug: `harness-core`
- clean export: `exports/harness-core-agent-ready.zip`
- canonical reference checker: `node tools/check_reference_baseline_integrity.mjs`
- no-legacy surface checker: `node tools/check_harness_core_no_legacy_surface.mjs`
- git readiness checker: `node tools/check_harness_core_git_readiness.mjs`

commit은 owner approval phrase가 별도 메시지로 제공된 경우에만 수행한다.
그 전까지 git status/diff는 rename source path를 표시할 수 있으며, 이는 commit readiness blocker가 아니라 commit 필요 상태다.

source workspace처럼 `.git` metadata가 있는 context에서는 git readiness checker가 git tracked path와 commit approval 상태를 실제로 검사한다.
clean export나 uploaded zip처럼 `.git` metadata가 없는 context에서는 같은 checker가 `not_applicable_no_git_metadata`를 기록하고 hard fail하지 않는다. 이 no-git mode는 source workspace precommit git readiness를 대체하지 않는다.
