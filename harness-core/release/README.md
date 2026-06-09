# HARNESS Core Release Assets

`release/` contains HARNESS Core claim, gate, scope, blocker, decision, and approval assets.

The root of this directory is intentionally kept free of release asset files. Release assets are grouped by artifact type first, then by lifecycle lane or domain:

```text
release/
  approvals/<lane>/
  blockers/<lane>/
  claims/<lane>/
  commands/<lane>/
  decisions/<lane>/
  drafts/<lane>/
  gates/<lane>/
  manifests/<lane>/
  matrices/<lane>/
  paths/<lane>/
  plans/<lane>/
  policies/<lane>/
  preconditions/<lane>/
  readiness/<lane>/
  records/<lane>/
  requirements/<lane>/
  scopes/<lane>/
```

Common lanes include `core-release`, `rc1`, `beta`, `post-rc`, `post-export`, `post-stable`, `openai`, `local`, `redteam`, `containment`, `telemetry`, `providers`, and `adapters`.

Use this directory by artifact intent:

- `claims/`: claim boundaries, claim ladder, final claim state, and claim impact surfaces.
- `gates/`: release gate policies, owner gates, approval gates, and scoped final gates.
- `scopes/`: explicit task or stage scope boundaries.
- `blockers/`: blocker matrices, blocker updates, and blocked lane records.
- `approvals/`: owner approval requests and approval records.
- `commands/`: command plans and command plan indexes.
- `decisions/`: owner decisions, decision records, decision matrices, and next-option records.
- `manifests/`: archive/export manifests.
- `matrices/`: coverage and cross-lane matrices when the matrix itself is the primary asset.
- `paths/`: strict path and deferred path records.
- `plans/`: rollback, repair, and future completion plans.
- `policies/`: release, preflight, and deferred execution policies.
- `preconditions/`: execution precondition records.
- `readiness/`: readiness assessments and dashboards.
- `records/`: non-decision execution records.
- `requirements/`: proof, environment, coverage, and redteam requirements.

For new external projects, do not put project-specific release assets here. Project-specific release state belongs in the project root `release/` directory, while vendored HARNESS Core remains under `.harness/harness-core/release/`.
