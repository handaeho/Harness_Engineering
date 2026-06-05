# Agent Workflow

1. Read `AGENTS.md`.
2. Read `stack.yaml`.
3. Check current claim status.
4. Identify the relevant stage scope.
5. Modify only allowed paths.
6. Avoid `dist/` and `legacy-reference-source/`.
7. Run required validators.
8. Generate evidence.
9. Update claim boundary.
10. Update session handoff.

## Minimum Validation

```bash
node tools/validate_alpha.mjs
node tools/scan_prohibited_claims.mjs
node tools/check_reference_baseline_integrity.mjs
```

Run the task-specific `check_*.mjs` gate before reporting pass.

## Current Stage Boundary

This alignment stage performs System of Record documentation and validation only. It does not perform provider calls, local model execution, telemetry connection, redteam execution, containment execution, release gate actual execution, or production deployment.
