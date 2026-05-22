# Lifecycle Contract

Metadata:
- asset_name: LIFECYCLE_CONTRACT.md
- purpose: Autonomous-agent session lifecycle contract.
- owner_layer: autonomous_agent_assets
- harness_subsystems: Lifecycle
- claim_strength: candidate-local

## 1. Purpose

This contract defines how an autonomous agent starts, continues, verifies, and closes a session in the active package.

Lifecycle discipline prevents false readiness, lost context, stale handoff, and incomplete closeout.

## 2. Session Start

Start with:

- `lifecycle/session-start.md`
- `lifecycle/init.sh`
- `state/feature_list.json`
- `state/session-handoff.md`
- `docs/ARTIFACT_MAP.md`

When shell execution is available, run the initializer before claiming readiness:

```sh
sh lifecycle/init.sh
```

If the initializer cannot be run, mark readiness as unverified and continue only within a safe read or propose-only boundary.

## 3. Active Session Loop

Use this loop:

`Read State -> Select Scope -> Execute Narrowly -> Verify -> Update State -> Close or Handoff`

During the session:

- keep WIP within `state/feature_list.json`
- preserve exact changed artifacts
- record validation commands and results
- downgrade claims when validation is stale, skipped, or failed
- stop and replan if the task crosses owner-layer boundaries unexpectedly

## 4. Session Closeout

Close with:

- `lifecycle/session-closeout.md`
- `lifecycle/clean-state-checklist.md`
- `state/session-handoff.md`
- `state/progress.md`

Closeout must preserve:

- completed work
- changed artifacts
- validation run after edits
- failed or skipped validation
- unresolved blockers
- next safest action
- claim strength actually supported

## 5. Clean-State Checklist

Before claiming complete, confirm:

- `state/feature_list.json` reflects actual status
- `state/progress.md` reflects the current checkpoint
- `state/session-handoff.md` is sufficient to resume without chat history
- validation outputs are current or limitations are explicit
- no unrelated owner layer was modified silently
- no release-grade claim was made without matching evidence

## 6. Handoff Requirements

Write or update handoff when:

- the task is long-running
- work remains open
- validation failed or was skipped
- the next agent needs exact artifact paths
- the current session changed state, verification, scope, or lifecycle surfaces

Do not rely on chat history as the handoff mechanism.

## 7. Recovery Rules

When blocked:

1. Preserve the last known good state.
2. Record the blocker and affected artifact.
3. Narrow the next action.
4. Rerun only the relevant validation after repair.
5. If repair would exceed scope, stop with a limitation and next action.

## 8. Anti-Patterns

- claiming readiness without reading lifecycle startup assets
- skipping `state/session-handoff.md` on continuation work
- leaving validation output stale after edits
- treating closeout template existence as closeout completion
- closing a session without unresolved blockers or skipped checks
- making release-grade language from lifecycle compliance alone
