# Evals

The alpha eval surface is static only. `v2.0.0-alpha-hardening` adds executable
static validation tools and design-only adapter fixtures.

Included:
- Required file existence checks.
- Manifest and schema parse checks.
- Adapter skeleton parse checks.
- Generated `dist/` boundary check.
- Prohibited positive claim checklist.
- v36 baseline comparison explanation.
- Adapter conformance design fixtures.

Deferred:
- Behavioral regression eval.
- Adapter conformance eval.
- Redteam eval.
- Replay eval.

## Commands

```powershell
node harness-core/tools/scanners/release/scan_prohibited_claims.mjs
node harness-core/tools/compare_v36_baseline.mjs
node harness-core/tools/validators/evals/validate_alpha.mjs
```

Fixture presence does not mean a test passed.
