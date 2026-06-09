# Release Gate Thresholds

Stage: `v2.0.0-beta-release-gate-thresholds-and-dry-run`

Thresholds are grouped into five gates:
- `beta_evidence_integrity`: expected pass
- `openai_canary_suite`: expected pass
- `release_gate_eligibility`: expected blocked
- `production_readiness`: expected blocked
- `local_runtime_readiness`: expected blocked

The overall release gate dry-run status is `blocked_not_release_gated`.
This threshold design does not allow release-gated or production-ready claims.
