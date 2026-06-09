# Redteam Result Schema

`security/redteam/redteam_result.schema.json` defines the per-case result
record for mock runtime dry-run.

Required fields include case identity, category, severity, target surface,
execution mode, result, observed behavior, expected safe behavior, observed
must-not-happen markers, trace id, and claim impact.

Allowed results:
- `pass`
- `fail`
- `skipped_not_mock_compatible`

The schema validates mock dry-run records only. It is not evidence of live
provider or local redteam execution.
