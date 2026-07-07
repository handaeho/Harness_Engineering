---
name: orchestration-control
description: Use for Codex-aware subagent and coordination control when explicit delegation, parallel agents, lifecycle, handoff contracts, capability fit, join quality, or long-running coordination is required. Triggers include user-requested subagents, parallel research/design/review, and joined runtime verdicts. Do not use for single-agent code patches, pure research, architecture analysis, eval gates, or harness artifact creation.
---

# Orchestration Control Instructions

## Activation

Activate only when one coherent agent path is insufficient and coordination materially improves correctness, latency, fault isolation, expertise, reuse, or controllability.
Do not activate for single-agent code patches, pure research, architecture analysis, eval gates, or harness asset creation.

## Procedure

Use:

`Admit -> Design Topology -> Delegate -> Join -> Verify -> Close`

1. Confirm that single-agent execution is insufficient.
2. Select the smallest useful topology.
3. Define roles, inputs, outputs, stop conditions, budgets, and trust boundaries.
4. Assign ownership for research, design, implementation, review, and verification when split work exists.
5. Join outputs against a concrete contract.
6. Reject stale, partial, or incompatible outputs instead of blending them into false certainty.
7. Report lifecycle state and next owner.

For delegation authority, source-ledger handoffs, runtime evidence boundaries, and joined evidence quality, read `references/orchestration-control.md` when any work is delegated or run in parallel.

## Codex Coordination Rules

- Define whether any branch may run commands, network calls, or destructive actions before delegation.
- Require source ledgers for current Codex behavior claims.
- Require executed evidence before any branch uses provider, CI, release, or production readiness language.
- Keep tool execution and approval gates runtime-owned.
- Preserve ownership across handoffs.

## Claim Boundary

Coordination quality can be reported as planned, delegated, joined, or locally checked.
It does not upgrade Codex proof class unless the joined branches include executed evidence for that exact claim.
