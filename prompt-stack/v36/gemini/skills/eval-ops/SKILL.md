---
name: eval-ops
description: Use for Gemini-aware evaluation and operational quality control when the user asks whether Gemini runtime behavior, prompts, provider canaries, mapper fixtures, regression results, benchmark runs, drift signals, or release/readiness claims satisfy a quality bar. Triggers include live canary verdicts, structured-output/tool-calling proof, provider evidence review, and claim-boundary downgrades. Do not use for ordinary code patches, pure research, architecture design, harness asset creation, or multi-agent topology.
---

# Evaluation Operations Instructions

## Activation

Activate when the task asks whether behavior, prompts, workflows, candidates, or operational signals satisfy an explicit quality bar.
Do not activate for ordinary code patches, source research, architecture decisions, harness creation, or multi-agent topology.

## Procedure

Use:

`Define Gate -> Inspect Evidence -> Compare -> Downgrade Unsupported Claims -> Verdict`

1. Define the decision, gate owner, acceptance threshold, and stop conditions.
2. Inspect executed evidence, not planned assets.
3. Separate document completeness, static validation, dry-run mapping, live canary execution, provider verification, adapter checks, release gates, and production monitoring.
4. Downgrade unsupported claims before reporting.
5. Return pass, fail, hold, or blocked with the next required evidence.

For Gemini proof classes, live canary evidence, structured-output/tool-calling criteria, and blocked claim language, read `references/eval-ops.md` when evaluating Gemini readiness or provider claims.

## Gemini Proof Classes

- `local_static_runtime_validation`: runtime files and static checks passed.
- `credentialed_canary_executed`: a live Gemini call ran under explicit approval.
- `provider_verified`: the provider lane met the required live evidence set.
- `adapter_checked`: adapter conformance checks passed across required cases.
- `release_gated`: an explicit release gate passed.
- `production_ready`: production criteria and monitoring evidence are present.

## Gemini Evaluation Rules

- Keep native Gemini API evidence separate from OpenAI compatibility evidence.
- Require response metadata or blocked-output evidence before upgrading safety behavior claims.
- Require argument validation, approval boundary, tool result reinjection, and redaction/storage review for function-calling claims.
- Do not promote static source alignment to live provider proof.
