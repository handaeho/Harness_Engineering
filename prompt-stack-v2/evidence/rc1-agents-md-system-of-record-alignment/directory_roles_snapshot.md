# Directory Roles

| Path | Class | Role | Edit Policy | Validation Requirement |
|---|---|---|---|---|
| `core/` | core source | Model-independent harness contracts and policy surfaces. | Editable with validation. | `validate_alpha.mjs` and relevant schema checks. |
| `adapters/` | core source | Provider and local runtime adapter specs and capability matrix. | Editable with validation. | Capability matrix schema and claim boundary checks. |
| `runtime/` | core source | Runtime harness, sandbox, execution, and state assets. | Editable with validation. | Task-specific runner/checker plus alpha validation. |
| `schemas/` | core source | Shared JSON schemas used by validators and reports. | Editable with validation. | Ajv compile through `validate_alpha.mjs`. |
| `tools/` | core source | Validators, runners, scanners, gates, and report generators. | Editable with validation. | `node --check` for changed tools and relevant gate execution. |
| `evals/suites/` | core source | Suite definitions for stage or regression gates. | Editable with validation. | YAML parse and task-specific checker. |
| `evals/fixtures/` | core source | Test fixtures and static validation inputs. | Editable with validation. | Fixture-specific schema or runner validation. |
| `evals/reports/` | evidence | Generated or reviewed evaluation reports. | Generated or review-record only. | Produced by runner/checker and scanned for claims. |
| `release/` | core source | Claim ladder, gates, blockers, rollback, and release policies. | Editable with validation. | Release gate schema and prohibited-claim scan. |
| `security/` | core source | Threat model, redteam, containment, raw storage, and redaction policies. | Editable with validation. | Security-specific checkers and claim scanner. |
| `observability/` | core source | Trace, telemetry, redaction, OTel, and Langfuse policies. | Editable with validation. | Trace/telemetry schema validation. |
| `evidence/` | evidence | Generated evidence, gate reports, audit records, and review records. | Generated or review-record only. | Checker-generated JSON plus claim scan. |
| `docs/` | human docs | Human-readable plans, explanations, and next-stage notes. | Editable with claim boundary check. | Claim scan plus relevant gate. |
| `dist/` | generated | Generated output only. | Do not edit manually. | Dist boundary check in `validate_alpha.mjs`. |
| `node_modules/` | generated/ignored | Installed dependency output, not a source asset. | Do not edit manually. | Excluded from scanners and manifests. |
