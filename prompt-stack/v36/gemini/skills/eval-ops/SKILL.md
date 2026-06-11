---
name: eval-ops
description: Use for evaluation and operational quality control in a Gemini-aware runtime: scorecards, regression review, drift/anomaly analysis, benchmark comparison, release-readiness, and prompt/workflow quality gates. Do not use for ordinary code patches, pure research, architecture design, harness asset creation, or multi-agent topology.
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
