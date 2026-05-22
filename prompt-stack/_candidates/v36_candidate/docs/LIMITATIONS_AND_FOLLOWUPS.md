# Limitations and Follow-ups

Metadata:
- asset_name: LIMITATIONS_AND_FOLLOWUPS.md
- purpose: Explicit downgrade register for v36_candidate.
- owner_layer: docs
- harness_subsystems: Verification, Lifecycle
- claim_strength: candidate-local

## Remaining Downgrades
- v36_candidate is not stable v36.
- Benchmark and ablation are deterministic local harness runs unless real agent traces are added.
- No production telemetry is present.
- No containment proof is present.
- Source collection is based on a clone plus web entrypoint observation; no claim is made that every public page was separately browser-rendered.

## Follow-ups
- Run real prompt-only vs minimal-harness agent trials.
- Run real multi-session continuity trials.
- Archive raw benchmark traces and rerun release gate.
