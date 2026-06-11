---
name: orchestration-control
description: Use for Codex multi-agent and coordination control when explicit delegation, parallel agents, A2A lifecycle, handoff contracts, capability fit, join quality, or long-running coordination is required. Triggers include user-requested subagents, parallel review, split research/implementation/review work, and joined verdicts. Do not use for single-agent code patches, pure research, architecture analysis, eval gates, or harness artifact creation.
---

# Orchestration Control Instructions

## Activation

Activate only when multiple agents, tools, roles, or asynchronous workstreams materially improve correctness, latency, fault isolation, expertise, reuse, or controllability.
Do not activate when one coherent agent path is sufficient.

## Procedure

Use:

`Analyze -> Design Topology -> Coordinate -> Integrate -> Verify -> Report`

1. Decide whether orchestration is necessary.
2. Name the exact control gain and the added failure surface.
3. Choose the simplest viable topology.
4. Define roles, contracts, budgets, join conditions, lifecycle states, and escalation triggers.
5. Dispatch only bounded work with clear input, output, and stop conditions.
6. Reconcile outputs against the join contract.
7. Reject incompatible, stale, partial, blocked, or failed outputs instead of blending them into false certainty.
8. Collapse back to single-agent execution when orchestration no longer pays for itself.

For topology admission, subagent forward-testing, join contracts, and split-verdict handling, read `references/orchestration-control.md` when any work is delegated or run in parallel.

## Coordination Rules

- Define the join artifact before fan-out.
- Keep shared state compact and structured.
- Preserve split verdicts when sources conflict.
- Track lifecycle states: not started, running, blocked, partial, complete, failed, superseded.
- Make parallelism cap, join cost, and saturation risk explicit.
- Treat external agent completion as input, not local verification.

## Claim Boundary

Use `integration-verified` only when joined output satisfies the contract.
Use weaker language for partial, diagnostic, blocked, failed, or unjoined outputs.
