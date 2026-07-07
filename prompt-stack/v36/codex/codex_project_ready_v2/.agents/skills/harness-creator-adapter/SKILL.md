---
name: harness-creator-adapter
description: Use for Codex runtime harness asset creation or adaptation when the work changes Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, artifact-map, source-ledger, or skill assets. Triggers include AGENTS.md changes, Codex layout assets, validation fixtures, benchmark cases, source ledgers, and active/evidence separation repairs. Do not use for ordinary code fixes, release decisions, pure research, architecture design, or mirroring Gemini/autonomous source assets into Codex runtime.
---

# Harness Creator Adapter Instructions

## Activation

Activate for Codex runtime harness assets that improve instructions, state, verification, scope control, lifecycle closeout, validation, benchmark readiness, or clean-state behavior.
Do not activate for ordinary code fixes, release decisions, pure research, architecture design, or Gemini/autonomous prose mirroring.

## Procedure

Use:

`Analyze -> Plan -> Create/Revise -> Test -> Verify -> Report`

1. Name the harness gap and subsystem.
2. Confirm owner layer: Codex runtime, shared state, verification, lifecycle, evidence, archive, or report.
3. Select the smallest artifact change that reduces the gap.
4. Write execution-oriented instructions only.
5. Run static validation when available.
6. Report changed artifact, validation, claim boundary, and remaining risk.

For Codex owner-layer routing, source-ledger assets, repo layout validation, evidence separation, and validator updates, read `references/harness-creator-adapter.md` when adding or changing Codex runtime harness assets.

## Codex Rules

- Preserve the six-skill routing interface unless a separate migration approves a new skill.
- Use `AGENTS.md` for project instructions.
- Use `.agents/skills/*/SKILL.md` for repository skills.
- Use official Codex docs for Codex-specific assertions.
- Keep static validation separate from live Codex execution.
- Do not create `provider_verified`, `release_gated`, `production_ready`, or live canary claims.

## Verification

Before closeout, confirm:
- target subsystem is explicit
- owner layer is correct
- validation path exists
- source grounding is recorded when Codex claims are present
- non-mirror policy is preserved
- claim strength matches available evidence

## Claim Boundary

Harness asset changes can support `local_static_runtime_validation` only after the relevant static runner passes.
They do not support `codex_instruction_loaded`, `skill_discovery_confirmed`, `provider_verified`, `release_gated`, or `production_ready` without separately executed evidence.
