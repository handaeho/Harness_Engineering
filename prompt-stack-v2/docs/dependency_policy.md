# Dependency Policy

`v2.0.0-beta-preflight` requires dependency-backed validation.

## Required Dependencies

- `yaml`: parses YAML manifests and adapter files with a real YAML parser.
- `ajv`: compiles and validates JSON Schema documents and YAML-loaded data.

## Why Required

The alpha-hardening internal YAML sanity parser and minimal schema checker were
enough to prove a skeleton existed, but not enough to support beta entry. Beta
preflight requires parser-backed validation so malformed YAML, invalid schema
documents, and schema/data mismatch are caught reproducibly.

## Failure Policy

If `yaml` or `ajv` is unavailable, beta entry is not allowed. Fallback validation
may be useful for diagnosis, but a fallback result cannot produce
`dependency-static-validated`.

## Lockfile Policy

`package-lock.json` is evidence for the dependency set used by the preflight
tools. The lockfile is part of the validation surface and must exist before beta
entry can pass.

## Boundary

Dependency-backed validation is still static validation. It does not prove
runtime execution, provider behavior, tool calling, replay, redteam, telemetry,
or model output reliability.
