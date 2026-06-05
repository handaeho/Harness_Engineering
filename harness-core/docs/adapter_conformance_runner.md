# Adapter Conformance Runner

`tools/run_adapter_conformance_dry_run.mjs` performs a dry-run over adapter
fixtures.

## What It Does

- Loads `evals/fixtures/adapters/*.jsonl`.
- Validates each case against `schemas/conformance_case.schema.json`.
- Loads OpenAI, vLLM, and Ollama adapter skeletons.
- Validates adapter skeletons against `schemas/adapter.schema.json`.
- Checks that unsupported features have not been upgraded in the capability
  matrix.
- Writes dry-run reports.

## What It Does Not Do

- No provider API calls.
- No local model calls.
- No actual tool calls.
- No runtime orchestration.
- No replay verification.
- No telemetry connection.

## Claim Boundary

Passing this runner allows `adapter-dry-run-checked` only. It does not allow
`adapter-checked`, `integration-verified`, `provider-diverse`,
`replay-verified`, `production-monitored`, or `release-gated`.
