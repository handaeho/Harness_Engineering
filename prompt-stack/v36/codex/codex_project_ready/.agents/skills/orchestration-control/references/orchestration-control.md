# Codex Orchestration Control Reference

Use this reference only after `orchestration-control` activates and explicit delegation or parallel work is authorized.

## Admission

- Use one agent unless parallelism materially improves correctness, latency, fault isolation, expertise, or review quality.
- Assign ownership when research, design, implementation, review, and verification work are split.
- Decide before delegation whether any branch may run commands, network calls, or destructive actions.

## Delegation Contract

Each branch needs:
- owner
- input artifacts
- command/network/write authority
- source-ledger requirement
- output schema
- stop condition
- validation owner

## Join Rules

- Treat delegated output as input, not verification.
- Require executed evidence before joining provider, CI, release, or production claims.
- Reject stale, partial, blocked, failed, or incompatible output.
- Preserve split verdicts when evidence differs.
