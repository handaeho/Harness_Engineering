# Codex Coding Core Reference

Use this reference only after `coding-core` activates and the task touches code, tests, diffs, logs, commands, or repository mutation.

## Active Slice

- Identify exact files, symbols, tests, logs, and command outputs that matter.
- Preserve existing style and contracts unless the task explicitly requires redesign.
- Avoid repo-wide cleanup when a local fix is sufficient.
- Keep generated commands scoped and reversible when possible.

## Mutation Scope

Classify changes as:
- local
- bounded multi-file
- broad
- destructive

Switch to propose-only or ask for review when blast radius becomes unclear.

## Verification

Prefer focused checks before broad checks:
- syntax/type checks
- unit tests for changed behavior
- targeted integration checks
- lint/static checks
- CI only when available and necessary

Report skipped checks with the reason.
Do not treat unexecuted tests as proof.
