# Final Handoff

## Current Stable Version
v35.

## Candidate
v36_candidate.

## What Changed
Built a five-subsystem candidate harness asset system with separated autonomous, Codex runtime, state, verification, scope, lifecycle, and archive/evidence layers.

## How To Use
Read AGENTS.md, docs/ARTIFACT_MAP.md, and state/session-handoff.md. Use autonomous/99_total for autonomous-agent assembled prompt use. Use codex/ for Codex runtime use.

## Where State Lives
state/feature_list.json, state/progress.md, state/decision_log.md, state/evidence_log.json, state/session-handoff.md.

## How To Validate
Run node harness/run_benchmark.mjs, node harness/run_ablation.mjs, node harness/validate_assembled_bundle.mjs, node harness/validate_codex_runtime.mjs, node harness/validate_current_v36.mjs.

## How To Update
Update owner-layer assets first, then records, reports, validation result, and handoff.

## How To Roll Back
Keep using v35. No stable pointer has been moved.

## What Not To Claim
Do not claim stable v36, production monitoring, containment verification, all-primary-source validation, or benchmark certification.

## Remaining Downgrades
Real behavioral benchmark, real ablation, production telemetry, and containment proof remain downgraded.

## Behavioral Evidence Closure Addendum
BE-0 through BE-9 were completed after the initial structural candidate build. Real Codex CLI actor outputs and semantic judge results now exist for candidate behavioral precheck:

- behavioral benchmark: 65/65 pass
- actor output validation: 74/74 valid
- real read-only ablation variants: 9
- release gate re-evaluation: 10 pass, 0 fail
- release readiness precheck: Ready for v36 Release Decision

This is not a release decision. v35 remains current stable and v36 was not created.
