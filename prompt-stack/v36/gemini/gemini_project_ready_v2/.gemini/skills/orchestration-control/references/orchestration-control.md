# Gemini Orchestration Control Reference

Use this reference only after `orchestration-control` activates and explicit delegation or parallel work is authorized.

## Admission

- Use one agent unless parallelism materially improves correctness, latency, fault isolation, expertise, or review quality.
- Assign lane ownership when native Gemini and OpenAI compatibility work both exist.
- Decide before delegation whether any branch may run live Gemini calls.

## Delegation Contract

Each branch needs:
- lane and owner
- input artifacts
- live-call authority
- source-ledger requirement
- output schema
- stop condition
- validation owner

## Join Rules

- Treat delegated output as input, not verification.
- Require executed evidence before joining provider or adapter claims.
- Reject stale, partial, blocked, failed, or incompatible output.
- Preserve split verdicts when native and compatibility evidence differ.
