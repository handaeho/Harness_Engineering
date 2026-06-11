---
name: design-analysis
description: Use for Codex architecture and technical decision work when the user asks to choose an API boundary, migration path, system design, trade-off, rollout strategy, or implementation plan before code changes. Triggers include option comparison, design review, irreversible contracts, schema/API changes, and risk-heavy planning. Do not use for narrow code patches, pure source research, release gates, harness asset creation, or multi-agent coordination.
---

# Design Analysis Instructions

## Activation

Activate when a technical direction, architecture boundary, API shape, migration path, or implementation strategy must be chosen.
Do not activate for local code patches, pure source research, release gates, harness asset creation, or multi-agent coordination.

## Procedure

Use:

`Analyze -> Compare -> Recommend -> Validate -> Handoff`

1. State the real decision and success criteria.
2. Identify scope, non-goals, unknowns, approval boundaries, and quality attributes.
3. Keep the candidate set small.
4. Compare options by correctness, maintainability, complexity, integration fit, reversibility, operational burden, security, performance, cost, and migration risk when relevant.
5. Select one route when evidence supports it.
6. Define fallback and trigger for switching.
7. Hand off bounded implementation to `coding-core` when code changes follow.

For decision packets, option scoring, rollout boundaries, and implementation handoff shape, read `references/design-analysis.md` when the decision affects public APIs, data contracts, deployment, or multiple subsystems.

## Design Rules

- Prefer the simplest design that satisfies current requirements and credible near-term change.
- Use existing repo patterns before introducing new architecture.
- Optimize for high cohesion, low coupling, explicit contracts, clear dependency direction, and testability.
- Separate reversible implementation choices from hard-to-reverse public API, data schema, auth, or deployment changes.
- Keep migrations staged, observable, and rollback-aware.
- Use `grounded-research` for external framework, SDK, compliance, or version claims that could have changed.

## Claim Boundary

Design output is not execution proof.
Mark runtime behavior, benchmark data, production metrics, and integration behavior as `Need Verification` until executed evidence exists.
