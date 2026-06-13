# Release Grade Source Ledger

`core/source_authority/release_grade_source_ledger.json` is the official-source
ledger for release-grade provider and adapter checks.

The ledger is a static authority record. It does not execute provider calls,
local model generation, telemetry writes, redteam cases, or release gates.
Checker output is written to `evidence/release-grade-source-ledger/`.

Run:

```bash
node tools/checks/workspace/check_release_grade_source_ledger.mjs
```

