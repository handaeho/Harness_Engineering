# Alpha Validation

`v2.0.0-alpha-hardening` adds reproducible static validation for the alpha
skeleton.

## Commands

Run from the repository root:

```powershell
node harness-core/tools/scanners/release/scan_prohibited_claims.mjs
node harness-core/tools/checks/workspace/check_reference_baseline_integrity.mjs
node harness-core/tools/validators/evals/validate_alpha.mjs
```

## Evidence

The commands write:

- `evidence/alpha/prohibited_claim_scan.json`
- `evidence/alpha/baseline_comparison.json`
- `evidence/alpha/unresolved_items.json`
- `evidence/alpha/validation_report.json`
- `evidence/alpha/validation_report.md`

## Boundaries

This validation is static. It does not execute provider APIs, local models,
runtime orchestration, tool calls, replay, redteam, or live telemetry.

External YAML and JSON Schema libraries are used only if they are already
available. If unavailable, the validator records the fallback parser or minimal
checker used.
