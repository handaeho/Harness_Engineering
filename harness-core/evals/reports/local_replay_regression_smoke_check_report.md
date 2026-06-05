# Local Replay/Regression Smoke Check

Status: pass

- Stage: v2.0.0-post-stable-local-replay-regression-smoke
- Can proceed to redaction/storage audit: true
- Unresolved items: 0

## Checks

- pass: local_replay_regression_smoke_report.json exists
- pass: local_replay_regression_items.json exists
- pass: local_replay_regression_claim_boundary.json exists
- pass: local_replay_regression_blocker_update.json exists
- pass: local_replay_regression_gate_report.json exists
- pass: unresolved_items.json exists
- pass: stage matches
- pass: status pass
- pass: no new local generation
- pass: required surfaces summarized
- pass: regression items passed
- pass: raw request/response not stored
- pass: protected paths unmodified
- pass: strong claims blocked
- pass: prohibited claim scan pass
- pass: local blocked positive claims absent
