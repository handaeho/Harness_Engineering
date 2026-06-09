# Naming Conventions

## Stage Prefixes

- `alpha` for alpha validation and static structure stages.
- `beta` for beta evidence, canary, redteam, containment, telemetry, and blocker stages.
- `rc1` for release-candidate evidence bundle and release-candidate gate preparation stages.
- `stable` only for final stable release records after the required gates; stable is currently blocked.

## File Suffixes

- `*_scope.yaml` for stage scope and execution boundary.
- `*_gate.yaml` for gate definitions.
- `*_policy.yaml` for policy definitions.
- `*_schema.json` for JSON schemas.
- `*_report.json` for machine-readable reports.
- `*_report.md` for human-readable reports.
- `*_blocker_update.json` for blocker transitions.
- `*_snapshot.yaml` and `*_snapshot.json` for immutable stage snapshots.

## Evidence Directories

- `evidence/beta-*` for beta-stage evidence.
- `evidence/rc1-*` for release-candidate evidence.
- `evidence/reference-baseline` for the read-only baseline snapshot.

## Claim Names

- Use lowercase kebab-case.
- Do not create aliases unless recorded in a claim canonicalization report.
- Stronger claims require explicit gate evidence.
- `stable`, `release-gated`, `production-ready`, `production-monitored`, `provider-diverse`, `provider-verified`, `adapter-checked`, `local-model-verified`, and `integration-verified` remain blocked in this stage.
