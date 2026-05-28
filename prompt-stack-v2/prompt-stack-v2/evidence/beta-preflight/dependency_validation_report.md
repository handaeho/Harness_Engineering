# Dependency Validation Report

Status: fail

Stage: v2.0.0-beta-preflight

## Parser Status

- YAML parser: yaml
- YAML fallback used: false
- JSON Schema validator: ajv
- JSON Schema fallback used: false

## Checks

- fail: required files exist
- fail: package lock exists
- pass: YAML parser dependency is active
- pass: JSON Schema validator dependency is active
- fail: all JSON files parse
- fail: all YAML files parse with yaml package
- fail: all JSON Schema files compile with Ajv
- fail: stack.yaml validates against schemas/stack.schema.json
- fail: AGENTS.md System of Record entrypoint is declared
- fail: adapter.yaml files validate against schemas/adapter.schema.json
- fail: provider_capability_matrix.yaml validates against schema
- fail: release_gate.yaml validates and blocks forbidden claims
- fail: observability schemas register with Ajv
- fail: schema copies register with Ajv
- fail: core/spec remains provider-neutral
- fail: dist boundary
- fail: provider capability matrix has no true or verified feature values

## Warnings

- none

## Errors

- required files exist: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\evals\fixtures\static\required_files.json'
- package lock exists: package.json missing
- all JSON files parse: ENOENT: no such file or directory, scandir 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2'
- all YAML files parse with yaml package: ENOENT: no such file or directory, scandir 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2'
- all JSON Schema files compile with Ajv: ENOENT: no such file or directory, scandir 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas'
- stack.yaml validates against schemas/stack.schema.json: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas\stack.schema.json'
- AGENTS.md System of Record entrypoint is declared: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\stack.yaml'
- adapter.yaml files validate against schemas/adapter.schema.json: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas\adapter.schema.json'
- provider_capability_matrix.yaml validates against schema: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas\capability_matrix.schema.json'
- release_gate.yaml validates and blocks forbidden claims: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\release\release_gate.yaml'
- observability schemas register with Ajv: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\observability\trace.schema.json'
- schema copies register with Ajv: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas\trace.schema.json'
- core/spec remains provider-neutral: ENOENT: no such file or directory, scandir 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\core\spec'
- dist boundary: ENOENT: no such file or directory, scandir 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\dist'
- provider capability matrix has no true or verified feature values: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\adapters\provider_capability_matrix.yaml'
- validation report schema check failed: ENOENT: no such file or directory, open 'C:\Users\CodexSandboxOffline\.codex\.sandbox\cwd\71d4072ae3b8fd1a\prompt-stack-v2\schemas\validation_report.schema.json'

## Execution Boundary

- Provider execution: false
- Local model execution: false
- Runtime execution loop implemented: false
- Live telemetry connected: false
- v36 runners re-executed: false
