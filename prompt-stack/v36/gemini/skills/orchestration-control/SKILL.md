---
name: orchestration-control
description: Use for Gemini-aware multi-agent and coordination control when explicit delegation, parallel agents, A2A lifecycle, handoff contracts, capability fit, join quality, or long-running coordination is required. Triggers include user-requested subagents, parallel Gemini API research/design/review, native-vs-compatibility split work, and joined provider/runtime verdicts. Do not use for single-agent code patches, pure research, architecture analysis, eval gates, or harness artifact creation.
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
4. Assign lane ownership when Gemini-native and compatibility work both exist.
5. Join outputs against a concrete contract.
6. Reject stale, partial, or incompatible outputs instead of blending them into false certainty.
7. Report lifecycle state and next owner.

For Gemini lane-owned delegation, live-call authority, source-ledger handoffs, and joined evidence boundaries, read `references/orchestration-control.md` when any work is delegated or run in parallel.

## Gemini Coordination Rules

- Define whether any branch may run live Gemini calls before delegation.
- Require source ledgers for Gemini API claims.
- Require executed evidence before any branch uses provider or adapter verification language.
- Keep tool execution and approval gates runtime-owned.
- Preserve lane ownership across handoffs.

## Claim Boundary

Coordination quality can be reported as planned, delegated, joined, or locally checked.
It does not upgrade Gemini runtime proof class unless the joined branches include executed evidence for that exact claim.
