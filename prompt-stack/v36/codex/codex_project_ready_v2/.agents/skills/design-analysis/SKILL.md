---
name: design-analysis
description: Use for Codex-aware architecture and technical decision work when the user asks to choose an implementation strategy, migration route, repository design, API/schema boundary, tool boundary, approval/sandbox posture, or irreversible technical direction. Do not use for narrow code patches, pure source research, release gates, harness asset creation, or subagent coordination.
---

# Design Analysis Instructions

## Activation

Activate when a technical direction must be chosen or justified before implementation.
Do not activate for local patches, pure source research, release gates, harness asset creation, or subagent coordination.

## Procedure

Use:

`Analyze -> Compare -> Select -> Validate -> Handoff`

1. State the decision and constraints.
2. Identify viable options and reject decorative alternatives.
3. Compare correctness, integration fit, reversibility, operational burden, security, performance, and verification cost when relevant.
4. Select one route and define the fallback trigger.
5. Hand off bounded implementation to `coding-core` when code changes follow.

For repository architecture, command/tool ownership, approval/sandbox posture, fallback criteria, and evidence boundaries, read `references/design-analysis.md` when the decision affects implementation or operating contracts.

## Codex Decision Rules

- Prefer the simplest repository-local change that satisfies the requirement.
- Keep tool execution, approval, sandbox, and rollback responsibilities explicit.
- Define schema owner, validation path, retry policy, and claim boundary when machine-readable contracts are involved.
- Do not use source research as a substitute for implementation verification.

## Claim Boundary

Design work is not execution proof.
Use `Need Verification` when runtime behavior, command behavior, CI behavior, benchmark data, or integration behavior has not been executed.
