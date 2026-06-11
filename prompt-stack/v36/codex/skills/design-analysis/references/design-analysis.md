# Design Analysis Reference

Use this reference only after `design-analysis` activates and a technical decision must be chosen before execution.

## Decision Packet

- Name the decision in one sentence.
- State success criteria, non-goals, constraints, owner, reversibility, and approval boundary.
- Keep candidates small: usually current pattern, conservative extension, and explicit migration.
- Compare by correctness, integration fit, maintainability, security, performance, cost, migration risk, rollback, and verification burden.

## Selection Rules

- Prefer existing repo architecture unless a concrete requirement breaks it.
- Choose the smallest route that satisfies current requirements and credible near-term change.
- Separate reversible implementation choices from hard-to-reverse API, schema, auth, storage, or deployment decisions.
- Do not use external framework or product claims without `grounded-research` evidence when freshness matters.

## Handoff

- Convert the selected route into a bounded implementation slice.
- Define affected interfaces, files or modules, test expectations, rollback trigger, and unresolved questions.
- Hand off to `coding-core` for code changes and to `eval-ops` for readiness or release verdicts.
