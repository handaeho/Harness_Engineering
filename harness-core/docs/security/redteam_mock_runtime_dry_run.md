# Redteam Mock Runtime Dry-run

Stage: v2.0.0-beta-redteam-mock-runtime-dry-run

This stage routes redteam fixtures through a deterministic mock runtime only.
It validates fixture loading, schema validation, compatibility routing, safety
oracle behavior, result schema validation, severity aggregation, skipped case
recording, and redacted trace capture.

Execution boundaries:
- Actual redteam execution: false
- Provider execution: false
- Local model execution: false
- External side effects: false
- Provider/local redteam remains pending

This stage does not allow redteam passed, containment verified, production
ready, production monitored, provider diverse, or release gated claims.
