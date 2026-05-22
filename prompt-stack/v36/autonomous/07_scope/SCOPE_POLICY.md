# Scope Policy

Metadata:
- asset_name: SCOPE_POLICY.md
- purpose: WIP and scope boundary policy.
- owner_layer: autonomous_agent_assets
- harness_subsystems: Scope
- claim_strength: candidate-local

## 1. Purpose

This policy keeps autonomous-agent work bounded, owner-correct, and recoverable inside the active package.

Use WIP=1 unless an explicit operator plan grants parallel work.

## 2. Owner Layers

Keep these owner layers separate:

- source-of-truth autonomous prompt assets: `autonomous/`
- Codex runtime assets: `codex/`
- executable harness assets: `harness/`
- state assets: `state/`
- verification assets: `verification/` and `validation/`
- lifecycle assets: `lifecycle/`
- release records and reports: `records/` and `reports/`
- archived or external evidence: `_evidence/` and `_archive/`

Do not silently move content across owner layers.

## 3. WIP Rules

- Work on one feature, bounded slice, or failure class at a time.
- Use `state/feature_list.json` to identify the active feature and WIP limit.
- If multiple changes are needed, stage them by owner layer.
- Do not mix feature changes with cleanup, release-record regeneration, and unrelated runtime edits unless the operator explicitly requested that bundle.
- If baseline validation is broken, prioritize baseline recovery before new feature work.

## 4. Scope Admission

Before editing, identify:

- target artifact
- owner layer
- intended behavior change
- blast radius
- required validation
- files that must stay untouched
- rollback or recovery boundary

If any of these are unclear on a risky path, narrow first.

## 5. Allowed Narrow Scope Examples

- Translate `autonomous/04_harness` documents without changing Codex runtime doctrine.
- Strengthen `autonomous/05_state` through `08_lifecycle` contracts without editing unrelated prompt layers.
- Update `autonomous/99_total` copies only when required to preserve assembled-bundle parity.
- Regenerate validation outputs only when checks are run after edits.

## 6. Scope Escalation Rules

Escalate to explicit operator approval or propose-only mode when:

- a destructive filesystem or VCS action is required
- stable version pointers would change
- release status, certification, or production monitoring language would change
- evidence archives would be rewritten
- Codex runtime behavior would be backported into autonomous source doctrine
- multiple owner layers must change for a non-mechanical reason

## 7. Claim Scope

- Say which directory or artifact was changed.
- Say which validation was run after the change.
- Do not claim repository-wide correctness from a local document edit.
- Do not claim release readiness from contract text alone.
- Keep `v36` and any referenced future version distinct when paths conflict.

## 8. Anti-Patterns

- editing Codex runtime because autonomous source text changed
- updating release records to hide stale evidence
- widening from translation into doctrine redesign without need
- mixing cleanup with feature work
- treating a missing requested path as permission to create a new version directory
- using broad claims when only a bounded slice was checked
