# Evaluation Operations Reference

Use this reference only after `eval-ops` activates and a quality bar or claim must be judged.

## Evidence Classes

- `prompt-reviewed`: instructions or prompts were inspected.
- `harness-designed`: validation assets or runners exist.
- `runner-executed`: a local runner actually ran.
- `replay-verified`: replay evidence exists for the named scenario.
- `release-gated`: an explicit release gate passed.
- `production-monitored`: production telemetry exists and was inspected.

## Gate Record

- Name candidate, baseline, scenario, run, cohort, trace, artifact, and gate owner when available.
- State expected behavior, forbidden behavior, threshold, stop condition, skipped checks, and stale evidence.
- Return pass, fail, hold, or blocked.
- Downgrade unsupported release, stable, production, benchmark, replay, provider, adapter, telemetry, and monitoring language.

## Common Downgrades

- Static validation is not integration verification.
- Benchmark registry is not benchmark execution.
- Local dry-run is not live provider proof.
- Review memo is not release approval.
- Telemetry plan is not production monitoring.
