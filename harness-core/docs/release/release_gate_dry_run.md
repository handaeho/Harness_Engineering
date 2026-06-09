# Release Gate Dry-run

The release gate dry-run evaluates existing beta evidence only.

It does not:
- call OpenAI
- execute a local model
- probe a local endpoint
- connect production telemetry
- execute redteam tests
- modify `dist/`
- modify `legacy-reference-source`

Expected result: `blocked_not_release_gated`.
