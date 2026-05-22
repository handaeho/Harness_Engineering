# Containment Boundary Mock Dry-run

Stage: `v2.0.0-beta-containment-boundary-mock-dry-run`

This stage executes the 18 containment fixtures in a deterministic mock
containment runtime. It records schema-validated results, redacted trace
samples, boundary summaries, severity aggregation, no-side-effect evidence, and
claim impact.

It does not call providers, local models, telemetry sinks, shell commands,
external networks, or real tools.
