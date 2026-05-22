# Dependency Validation Report

Status: pass

Stage: v2.0.0-beta-preflight

## Parser Status

- YAML parser: yaml
- YAML fallback used: false
- JSON Schema validator: ajv
- JSON Schema fallback used: false

## Checks

- pass: required files exist
- pass: package lock exists
- pass: YAML parser dependency is active
- pass: JSON Schema validator dependency is active
- pass: all JSON files parse
- pass: all YAML files parse with yaml package
- pass: all JSON Schema files compile with Ajv
- pass: stack.yaml validates against schemas/stack.schema.json
- pass: AGENTS.md System of Record entrypoint is declared
- pass: adapter.yaml files validate against schemas/adapter.schema.json
- pass: provider_capability_matrix.yaml validates against schema
- pass: release_gate.yaml validates and blocks forbidden claims
- pass: observability schemas register with Ajv
- pass: schema copies register with Ajv
- pass: core/spec remains provider-neutral
- pass: dist boundary
- pass: provider capability matrix has no true or verified feature values

## Warnings

- none

## Errors

- none

## Execution Boundary

- Provider execution: false
- Local model execution: false
- Runtime execution loop implemented: false
- Live telemetry connected: false
- v36 runners re-executed: false
