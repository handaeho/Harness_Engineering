# Telemetry Payload Shape Report

Status: pass

Stage: v2.0.0-beta-production-telemetry-connection-preflight

- Validation mode: redacted dry payload only
- Sink write performed: false
- Exporter network call performed: false
- Raw payload stored: false
- OTel payload shape valid: true
- Langfuse payload shape valid: true

## Checks

- pass: otel_otlp otel payload validates with Ajv
- pass: otel_otlp otel dry payload has no secret-looking values
- pass: otel_otlp otel payload redacted
- pass: langfuse langfuse payload validates with Ajv
- pass: langfuse langfuse dry payload has no secret-looking values
- pass: langfuse langfuse payload redacted
