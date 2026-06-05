# HARNESS Core Precommit Doc/Export Consistency Repair

이 문서는 `v2.0.0-post-rename-harness-core-precommit-doc-export-consistency-repair` 단계의 범위를 기록한다.

이번 단계는 commit 실행 단계가 아니다. 목적은 root workspace mode와 agent-ready export mode에서 실행할 명령을 분리하고, `.git` metadata가 없는 archive context에서 precommit repair checker가 hard fail하지 않게 하는 것이다.

## Root Workspace Mode

HARNESS Core project root에서 작업하는 기본 모드다. `.git` metadata가 있는 source workspace에서는 current-state alignment와 git readiness를 완전 검증할 수 있다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_current_state_alignment.mjs
node tools/check_reference_baseline_integrity.mjs
```

## Agent-Ready Export Mode

다른 대화, 다른 머신, 외부 에이전트에게 전달하는 clean export 모드다. 압축 해제본에는 `node_modules`와 `.git` metadata가 없다.

```bash
node tools/check_agent_ready_self_contained.mjs
node tools/check_reference_baseline_integrity.mjs
```

Agent-ready export mode에서는 `node tools/check_current_state_alignment.mjs`를 기본 명령으로 사용하지 않는다. 해당 checker는 root workspace mode 전용이다.

## No-Git Mode

업로드 zip 또는 clean export context에 `.git` metadata가 없으면 git readiness는 `not_applicable_no_git_metadata`로 기록한다. 이 상태는 source workspace precommit git readiness를 대체하지 않는다.

## Claim Boundary

기록 가능한 claim은 `harness-core-precommit-doc-export-consistency-repair-recorded`, `root-vs-export-command-policy-recorded`, `no-git-precommit-checker-mode-recorded`, `clean-export-command-surface-checked`에 한정한다.

`provider-verified`, `adapter-checked`, `production-ready`, `stable`, `release-gated`는 계속 blocked 상태다.
