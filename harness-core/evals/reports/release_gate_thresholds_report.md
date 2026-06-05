# Release Gate Thresholds

Status: pass

Stage: v2.0.0-beta-release-gate-thresholds-and-dry-run

- Overall release gate: blocked_not_release_gated
- New provider execution: false
- Local model execution: false
- Local endpoint probe: false
- Dist modified: false

## Gates

- beta_evidence_integrity: expected pass, checks 7
- openai_canary_suite: expected pass, checks 6
- release_gate_eligibility: expected blocked, checks 6
- production_readiness: expected blocked, checks 4
- local_runtime_readiness: expected blocked, checks 3
