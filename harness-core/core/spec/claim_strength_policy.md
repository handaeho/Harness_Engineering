# Claim Strength Policy

## Alpha Allowed Claims

- `harness-designed`: core contract and policy skeleton exist.
- `static-structure-created`: required alpha files exist and parse checks passed.
- `baseline-snapshotted`: historical reference inventory and checksums were generated without editing the legacy reference source.
- `adapter-skeleton-created`: adapter skeleton files exist with unverified capabilities marked as such.

## Upgrade Rule

No claim may be upgraded without evidence from the required control surface.

Examples:
- A schema file existing does not prove reliable structured output.
- A runner file existing does not prove runner execution.
- A trace schema existing does not prove live telemetry.
- A local validation record does not prove provider diversity.

## Deferred Claims

The following labels remain blocked until their evidence requirements are met:
- `runner-executed`
- `replay-verified`
- `integration-verified`
- `release-gated`
- `production-monitored`
