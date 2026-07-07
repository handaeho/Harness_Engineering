---
name: coding-core
description: Use for bounded Codex code execution when the user asks for code changes, bug fixes, debugging, refactoring, tests, code review, mapper changes, or code-adjacent documentation. Triggers include failing tests, stack traces, diffs, narrow implementation tasks, repo-local commands, and verification reports. Do not use for pure research, broad architecture strategy, eval/release gates, harness asset creation, or subagent coordination.
---

# Coding Core Instructions

## Activation

Activate for code or code-adjacent changes with an identifiable active slice: files, symbols, tests, logs, errors, or a diff.
Do not activate for pure research, broad strategy, release gates, harness asset creation, or subagent coordination.

## Procedure

Use:

`Read Active Slice -> Plan Minimally -> Patch Narrowly -> Verify Concretely -> Report Honestly`

Before changing code, tests, API contracts, message contracts, or code-adjacent documentation, check and follow `.codex/ENGINEERING_CONVENTION.md` when it exists. If it conflicts with `AGENTS.md`, `AGENTS.md` wins.

1. Inspect the smallest relevant file slice before editing.
2. Identify target behavior, solved condition, and risk boundary.
3. Name the intended mutation scope before editing.
4. Patch the smallest responsible unit while preserving local style and contracts.
5. Run focused tests, validation runners, type checks, lint checks, or static checks when available.
6. Report changed artifacts, checks run, skipped checks, assumptions, and remaining risk.

For repo mutation scope, command evidence, local validation, and claim-boundary reporting, read `references/coding-core.md` when the task touches cross-file code paths, build/test behavior, or external state.

## Codex Rules

- Prefer local edits over broad rewrites.
- Treat shell and filesystem changes as external state interactions.
- Preserve approval, sandbox, and least-privilege boundaries.
- Validate command success semantically, not only by exit code.
- Do not run destructive commands or credentialed external calls without explicit authority.

## Claim Boundary

Separate:
- code plausibility
- local checks
- command execution
- test/CI verification
- integration verification

Never claim `tests_passed`, `ci_verified`, `provider_verified`, `release_gated`, or `production_ready` without matching executed evidence.
