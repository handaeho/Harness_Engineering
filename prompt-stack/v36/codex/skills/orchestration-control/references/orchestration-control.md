# Orchestration Control Reference

Use this reference only after `orchestration-control` activates and explicit delegation or parallel work is authorized.

## Admission

- Use one agent unless parallelism materially improves correctness, latency, fault isolation, expertise, or review quality.
- Name the coordination gain and the added failure surface.
- Define the join artifact before fan-out.
- Keep write scopes disjoint for implementation branches.

## Delegation Contract

Each delegated task needs:
- role and scope
- input artifacts
- forbidden assumptions
- allowed writes or read-only status
- stop condition
- output schema
- validation owner

## Join Rules

- Treat subagent output as input, not verification.
- Preserve split verdicts when branches conflict.
- Reject stale, partial, blocked, failed, or incompatible output.
- Collapse back to single-agent execution when coordination no longer pays for itself.
