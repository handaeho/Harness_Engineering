# Coding Core Reference

Use this reference only after `coding-core` activates and the task has code, tests, logs, or a diff as the active slice.

## Active Slice

- Start from the narrowest files, symbols, failing tests, logs, or diff hunks that can explain the behavior.
- Preserve unrelated dirty work and avoid broad rewrites.
- Prefer repo-local helpers, patterns, test harnesses, and validation commands over invented structure.
- Keep public APIs, schemas, auth behavior, data migrations, and compatibility behavior unchanged unless the user explicitly asks for the change.

## Review Mode

- Lead with findings when the task asks for review.
- Rank findings by correctness, security, data/API compatibility, edge cases, concurrency, missing tests, maintainability, performance, docs, then style.
- Use tight file/line references when available.
- If no findings are found, say so and name the residual test or integration risk.

## Verification

- Run the smallest command that exercises the changed behavior first.
- Expand to lint, typecheck, build, integration, smoke, or repro only when the risk justifies it.
- Treat generated output, snapshots, and caches as verification artifacts only after checking semantic behavior.
- Report skipped checks with the reason and the weaker completion language.

## Report Shape

- State changed files or units.
- State behavior fixed or reviewed.
- State commands run and results.
- State remaining risk and whether the result is inspection-only, locally checked, or integration verified.
