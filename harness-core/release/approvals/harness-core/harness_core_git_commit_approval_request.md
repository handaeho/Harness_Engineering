# HARNESS Core Git Commit Approval Request

To remove legacy rename source paths from git status/diff output, an actual git commit is required.

Required approval phrase:

```text
I approve committing the HARNESS Core rename and final surface cleanup.
```

No commit is performed unless the owner provides that exact phrase in a separate message.

Precommit validation repair status is recorded by:

```bash
node tools/checks/workspace/check_harness_core_precommit_validation_repair.mjs
```

The git readiness checker runs in source workspaces with `.git` metadata. In clean export or uploaded zip contexts without `.git` metadata, it records `not_applicable_no_git_metadata` instead of blocking current-state alignment.
