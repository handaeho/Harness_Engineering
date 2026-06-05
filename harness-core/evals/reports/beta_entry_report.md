# Beta Entry Report

Status: pass

Stage: v2.0.0-beta-preflight

Can enter beta execution: false

Reason: Preflight passed, but beta execution still requires explicit operator approval.

## Checks

- pass: dependency-backed validate_alpha.mjs pass
- pass: prohibited claim scan pass
- pass: compare_v36_baseline.mjs pass
- pass: run_adapter_conformance_dry_run.mjs pass
- pass: unresolved_items.json is empty
- pass: provider_capability_matrix.yaml has no unverified true values
- pass: release_gate.yaml blocks forbidden claims
- pass: package-lock.json exists
- pass: v36 modified false by checksum comparison

## Claim Boundary

- Allowed: harness-designed, static-structure-created, baseline-snapshotted, adapter-skeleton-created, alpha-static-validated, dependency-static-validated, adapter-dry-run-checked, beta-preflight-prepared
- Blocked: adapter-checked, provider-verified, runtime-verified, tool-call-verified, schema-output-verified, telemetry-connected, production-ready, production-monitored, containment-verified, replay-verified, benchmark-backed, provider-diverse, integration-verified, release-gated
