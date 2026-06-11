---
name: eval-ops
description: Use for Codex evaluation and operational quality control when the user asks whether behavior, prompts, workflows, candidates, benchmark runs, regressions, drift signals, scorecards, or release/readiness claims satisfy a quality bar. Triggers include pass/fail/hold verdicts, claim-boundary review, benchmark comparison, replay evidence, and release language. Do not use for ordinary code patches, pure research, architecture design, harness asset creation, or multi-agent topology.
---

# Evaluation Operations Instructions

## Activation

Activate when the task asks whether behavior, prompts, workflows, candidates, releases, or operational signals satisfy an explicit quality bar.
Do not activate for ordinary code patches, pure research, architecture design, harness asset creation, or multi-agent topology.

## Procedure

Use:

`Analyze -> Define Gate -> Inspect Evidence -> Compare -> Verdict -> Report`

1. State the decision and requested claim strength.
2. Define candidate, baseline, scenario, run, cohort, trace, or artifact identifiers.
3. Define expected behavior, forbidden behavior, threshold, stop condition, and gate owner.
4. Inspect executed evidence, not only planned assets or documents.
5. Separate document completeness, benchmark registry, benchmark execution, replay verification, release gates, and production monitoring.
6. Downgrade unsupported claims before returning a verdict.
7. Return pass, fail, hold, or blocked with missing evidence and next required run.

For proof classes, gate records, replay/benchmark verdicts, and release-language downgrades, read `references/eval-ops.md` when the task asks for readiness, benchmark quality, or evidence sufficiency.

## Evaluation Rules

- Metrics must map to the decision.
- Baseline and candidate identifiers must remain reconstructible.
- Skipped checks, partial runs, substrate gaps, and stale evidence must stay visible.
- Release, stable, production, benchmark, replay, provider, adapter, telemetry, and monitoring language requires the matching executed evidence.
- Do not use harness creation as release judgment.

## Claim Boundary

Use weaker language when evidence is partial.
Do not collapse `prompt-reviewed`, `harness-designed`, `runner-executed`, `replay-verified`, `release-gated`, and `production-monitored` into one success claim.
