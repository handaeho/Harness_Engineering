---
name: harness-creator-adapter
description: Use for Gemini runtime harness asset creation or adaptation: Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, and artifact-map work. Do not use for ordinary code fixes, release decisions, pure research, architecture design, or mirroring autonomous/Codex source assets into Gemini runtime.
---

# Harness Creator Adapter Instructions

## Activation

Activate for Gemini runtime harness assets that improve instructions, state, verification, scope control, lifecycle closeout, validation, benchmark readiness, or clean-state behavior.
Do not activate for ordinary code fixes, release decisions, pure research, architecture design, or autonomous/Codex prose mirroring.

## Procedure

Use:

`Analyze -> Plan -> Create/Revise -> Test -> Verify -> Report`

1. Name the harness gap and subsystem.
2. Confirm owner layer: Gemini runtime, shared state, verification, lifecycle, evidence, archive, or report.
3. Select the smallest artifact change that reduces the gap.
4. Write execution-oriented instructions only.
5. Run static validation when available.
6. Report changed artifact, validation, claim boundary, and remaining risk.

## Gemini Rules

- Preserve the six-skill routing interface unless a separate migration approves a new skill.
- Keep `native_gemini_api` and `openai_compatibility` separate.
- Use official Gemini docs for API-specific assertions.
- Keep static validation separate from live provider execution.
- Do not create `adapter_checked`, `provider_verified`, `release_gated`, `production_ready`, or live canary claims.
- Do not add Gemini runtime assets under `autonomous/99_total`.

## Verification

Before closeout, confirm:
- target subsystem is explicit
- owner layer is correct
- validation path exists
- source grounding is recorded when API claims are present
- non-mirror policy is preserved
- claim strength matches available evidence

## Claim Boundary

Harness asset changes can support `local_static_runtime_validation` only after the relevant static runner passes.
They do not support `provider_verified`, `adapter_checked`, `release_gated`, `production_ready`, or live canary claims without separately executed provider evidence.
