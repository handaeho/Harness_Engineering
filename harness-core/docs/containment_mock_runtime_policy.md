# Containment Mock Runtime Policy

The mock runtime loads only fixtures from `evals/fixtures/containment/` and
emits evidence under `evidence/beta-containment-boundary-mock-dry-run/` and
`evals/reports/`.

All boundary actions are simulated or blocked. Runtime counters must remain
zero for provider calls, local model calls, telemetry writes, shell commands,
external network calls, real file writes outside evidence/report paths, and real
tool side effects.
