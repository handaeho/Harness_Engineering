---
name: coding-core
description: Use for bounded Codex code execution when the user asks for code changes, bug fixes, debugging, refactoring, tests, code review, or code-adjacent documentation tied to behavior. Triggers include failing tests, stack traces, diffs, PR review, regression fixes, security fixes, performance fixes, and narrow implementation tasks. Do not use for pure research, broad architecture strategy, release/eval gates, harness asset creation, or multi-agent coordination.
---

# Coding Core Instructions

## Activation

Activate for implementation, patching, debugging, refactoring, testing, code review, performance/security fixes, or documentation tied directly to code behavior.
Do not activate for pure research, broad architecture strategy, eval/release gates, harness asset creation, or multi-agent coordination.

## Procedure

Use:

`Analyze -> Plan -> Implement -> Test -> Verify -> Report`

1. Identify the actual requested outcome, active slice, solved condition, and risk boundary.
2. Inspect existing code, tests, logs, and local conventions before editing.
3. Patch the smallest responsible unit.
4. Preserve public APIs, schemas, migrations, auth behavior, and data contracts unless the user explicitly requests a change.
5. Add or update tests when behavior changes and a suitable test surface exists.
6. Run the strongest targeted checks available: format, lint, typecheck, unit test, integration test, build, smoke, or repro.
7. If a required check cannot run, state why and downgrade completion language.

For deeper review, active-slice, verification, and handoff patterns, read `references/coding-core.md` when the task includes a diff review, test design, security/performance risk, or cross-file behavior change.

## Engineering Rules

- Prefer narrow diffs over broad rewrites.
- Preserve user changes and unrelated dirty worktree state.
- Use existing architecture, framework, naming, formatting, dependency, and error-handling patterns.
- Avoid speculative abstractions and new dependencies unless necessary and approved.
- Validate inputs at trust boundaries and encode outputs in the correct context.
- Keep secrets, credentials, tokens, session identifiers, and sensitive data out of code, logs, fixtures, and final messages.
- Fail closed for security-sensitive behavior.
- Add comments only for non-obvious intent, invariants, complex algorithms, or operational constraints.

## Review Mode

When reviewing code:
- lead with findings
- order findings by severity
- include file and line references when possible
- prioritize correctness, security, data/API compatibility, edge cases, concurrency, missing tests, maintainability, performance, documentation, then style
- state when review scope is partial

## Claim Boundary

Use:
- `Plausible` for inspection-only work
- `Locally checked` for targeted checks that ran and passed
- `Integration verified` only when integration or end-to-end paths ran and passed
- `Need Verification` when required checks could not run or evidence is partial

Never claim fixed, complete, working, secure, performant, release-ready, or production-ready unless executed evidence supports that exact claim.
