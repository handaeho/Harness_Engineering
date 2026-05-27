---
name: orchestration-control
description: Use for multi-agent and coordination control: delegation topology, A2A lifecycle, handoff contracts, agent capability fit, join quality, and long-running coordination. Do not use for single-agent code patches, pure research, architecture analysis, eval gates, or harness artifact creation.
---

# Orchestration Control Skill

## Purpose

Use this skill when the central problem is how multiple agents, tools, roles, or asynchronous workstreams should be coordinated safely. It selects the smallest useful topology, defines contracts, tracks lifecycle state, and verifies integration quality.

This skill should reduce coordination risk. It must not add orchestration vocabulary to work that one coherent agent can handle.

## When to use

Use `orchestration-control` when:

- delegation structure, specialist roles, A2A lifecycle, or handoff quality materially affects correctness
- agent discovery, agent-card review, capability fit, or trust boundary matters
- long-running asynchronous coordination needs explicit status and ownership
- bounded parallel fan-out, sequential handoff, supervisor patterns, or join contracts are needed
- partial-state truthfulness and integration quality are central to completion

Do not use it as primary owner when:

- a single-agent path is sufficient
- the task is mainly local code execution; use `coding-core`
- the task is mainly source-backed research; use `grounded-research`
- the task is mainly architecture option comparison; use `design-analysis`
- the task is mainly eval, release, benchmark, or drift judgment; use `eval-ops`
- the task is mainly harness artifact creation; use `harness-creator-adapter`

## Inputs

Collect:

- overall goal and solved condition
- candidate agents, tools, skills, capabilities, trust levels, and constraints
- workstreams that are independent or dependent
- return contracts, join artifact, quality gate, and validation owner
- lifecycle states: not started, running, blocked, partial, complete, failed, superseded
- budget, latency, saturation, approval, and escalation constraints

## Workflow

Use this flow:

`Analyze -> Plan -> Coordinate -> Integrate -> Verify -> Report`

1. Analyze
   - Decide whether orchestration is necessary.
   - Name the exact gain: quality, latency, fault isolation, expertise, reuse, or controllability.
   - Name the added cost and failure surface.

2. Plan
   - Choose the simplest viable topology.
   - Define roles, contracts, budgets, join conditions, and escalation triggers.
   - Avoid fan-out until the join artifact is defined.

3. Coordinate
   - Dispatch only bounded work with clear input, output, and stop conditions.
   - Track lifecycle state and partial completion honestly.
   - Keep shared state compact and structured.

4. Integrate
   - Reconcile outputs against the join contract.
   - Reject incompatible or stale outputs rather than blending them into false certainty.
   - Preserve split verdicts when sources conflict.

5. Verify
   - Check topology fit, contract fit, lifecycle fit, and integration fit.
   - Collapse back to a single-agent path if orchestration no longer pays for itself.

6. Report
   - State topology, participants, lifecycle state, integrated result, gaps, and next action.

## Engineering rules

- Prefer no orchestration unless it materially improves the result.
- Sequential handoff fits dependent stages.
- Bounded parallel fan-out fits independent tasks with a clear join.
- Supervisor fits centralized assignment and conflict resolution.
- Critic/reviewer loops fit high-risk work where challenge materially improves quality.
- Agent-as-tool fits narrow callable contracts.
- Remote opaque agents require local supervision and explicit trust boundaries.
- Do not integrate outputs whose lifecycle state, scope, or freshness is unclear.
- Make parallelism cap, join cost, and saturation risk visible.

## Verification

Check:

- single-agent sufficiency was considered
- topology choice has a named control gain
- each role has a bounded contract
- join artifact and validation owner are explicit
- lifecycle state is accurate
- partial, blocked, failed, superseded, or stale outputs are visible
- final result is integration-verified, not merely collected

Use weaker language when integration is incomplete:

- `partial`: some outputs returned, not fully joined
- `blocked`: a required workstream cannot proceed
- `diagnostic`: useful but not enough for completion
- `integration-verified`: joined output satisfies the contract

## Constraints

- Do not delegate merely because a tool exists.
- Do not create specialists without real specialization boundaries.
- Do not use parallel work when the join cost exceeds expected gain.
- Do not let orchestration hide uncertainty or failed workstreams.
- Do not treat external agent completion as local verification.
- Do not use this skill to replace domain skills; combine only when coordination is the real problem.

## Output

Report:

- topology and why it was chosen
- roles and contracts
- lifecycle state by workstream
- join artifact and integration result
- unresolved gaps, conflicts, or blocked states
- validation owner and next action

## Examples

- "Coordinate research, implementation, and review agents for a long-running migration."
  - Use `orchestration-control`.
  - Define sequential or parallel stages and join criteria.

- "Fix this local failing test."
  - Use `coding-core`, not `orchestration-control`.

- "Compare two architecture options."
  - Use `design-analysis` unless multiple specialists must be coordinated.

## Checklist

- [ ] Single-agent sufficiency checked.
- [ ] Orchestration gain outweighs overhead.
- [ ] Topology is the simplest viable one.
- [ ] Roles, contracts, budgets, and join conditions are explicit.
- [ ] Lifecycle states are tracked.
- [ ] Partial and failed work are visible.
- [ ] Integrated result is verified before completion language.
