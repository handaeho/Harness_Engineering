# Engineering Convention

## 1. Purpose

This document defines repository-wide engineering conventions for code written or changed by Codex.

It is intentionally language-aware but not AIEngine-specific. Apply it to Python, Java, API contracts, workflow/message contracts, database code, tests, scripts, and code-adjacent documentation.

If this document conflicts with `AGENTS.md`, `AGENTS.md` wins. If a narrower component document gives stricter rules for a specific subsystem, follow the stricter local rule unless it conflicts with `AGENTS.md`.

## 2. Universal Design Rules

- Prefer small, reversible changes over broad rewrites.
- Keep public contracts stable; make additive optional changes before breaking changes.
- Separate domain logic, transport/framework code, persistence, and external clients.
- Avoid import-time or class-load side effects that start workers, load models, open network connections, read large files, or mutate state.
- Do not hide important behavior in generic `utils`, `common`, or `helper` modules when a domain-specific name is possible.
- Keep dependency direction clear: contracts and pure helpers should not import runtime-heavy services.
- Represent structured data with schemas, DTOs, records, dataclasses, or typed models instead of ad hoc dictionaries or string parsing when practical.
- Treat timeouts, retries, idempotency, partial failure, and observability as part of external integration design.
- Keep generated files, runtime caches, model weights, and temporary outputs outside tracked source unless the repository explicitly owns them.

## 3. Public Contracts

- Name the owner of each public API, message, artifact, database table, and payload schema.
- Contract changes must preserve backward compatibility unless the task explicitly authorizes a breaking change.
- Prefer additive fields with defaults or optional semantics.
- Document enum and string-literal additions where downstream systems branch on them.
- Preserve existing artifact paths, result field names, and polling semantics unless a migration plan exists.
- Keep failure payloads machine-readable: include stable error code, human-readable message, source stage, and retryability when the surrounding system supports it.

## 4. Python Rules

- Keep package `__init__.py` lightweight. Do not import model runtimes, Celery apps, database sessions, web apps, or external clients there unless that is the package's explicit purpose.
- Keep FastAPI route handlers thin: validate input, call service code, return response.
- Keep Celery task entrypoints thin: decode message, call runtime/service code, emit events.
- Keep Pydantic models in contract/schema modules and avoid importing runtime-heavy modules from schema modules.
- Keep settings loading centralized and avoid reading environment variables throughout domain code.
- Prefer explicit typed functions over broad dictionaries at module boundaries; when dictionaries are required for compatibility, normalize at the boundary.
- Make filesystem, network, database, model, and clock dependencies injectable or isolated enough to test without the real external system.
- Unit tests should not require GPU, model weights, network, a live broker, or a production database unless they are explicitly integration tests.

## 5. Java Rules

- Keep controller, service, repository, client, and DTO responsibilities separate.
- Do not expose persistence entities as external API DTOs unless the project explicitly owns that contract and accepts the coupling.
- Keep transaction boundaries in service/application layers, not in controllers or low-level utilities.
- Wrap external systems behind client interfaces so tests can use fakes or stubs.
- Use stable exception categories for validation, dependency, timeout, conflict, and unexpected errors.
- Avoid static initialization that opens files, network connections, database pools, or expensive runtime resources.
- Prefer immutable DTOs or records for request/response style data when supported by the Java version in use.
- Keep nullability, optional fields, and defaulting rules explicit at API boundaries.

## 6. Database And Persistence

- Treat schema changes as migrations, not incidental model edits.
- Keep application-level compatibility when a migration may be deployed before or after code.
- Avoid changing column meanings without a backfill or read compatibility plan.
- Store ledger/audit records with enough context to reconstruct the workflow state.
- Keep large payloads, artifacts, and binary outputs in storage paths when the database is only meant to reference them.

## 7. External Integration

- Every external call should have a timeout.
- Retries must be bounded and should be safe for the operation's idempotency.
- Keep credentials out of logs, artifacts, and test snapshots.
- Convert provider-specific errors into repository-owned error codes at the boundary.
- Separate connection/readiness checks from business workflow execution.
- Do not make request-by-request probe/fallback loops when a startup or cached capability probe can decide the route.

## 8. Testing

- Match tests to risk: unit tests for local logic, contract tests for schemas/messages, integration tests for cross-service behavior, smoke tests for deployment paths.
- Update tests when a contract changes; do not preserve stale tests just because they encode historical behavior.
- Prefer small fixtures and fake clients over real services for fast contract checks.
- Test both allowed and rejected inputs for source, auth, filesystem, and payload validation rules.
- Report skipped or blocked tests with the concrete missing dependency or environment condition.
- A passing unit test proves only the tested behavior in that environment; do not claim CI, provider, or production readiness from local tests.

## 9. Documentation

- Keep docs current-state oriented. Remove or label obsolete plans when they would mislead implementation.
- Document behavior and contracts, not internal speculation.
- Use exact names for files, fields, endpoints, task names, queues, error codes, and environment variables.
- When implementation and documentation disagree, inspect code and tests before editing either.

## 10. Refactoring Policy

- Refactor only inside the active slice unless the task explicitly asks for a broader cleanup.
- Prefer preparatory refactors that reduce immediate implementation risk.
- Do not mix formatting-only churn with behavior changes unless a formatter is already part of the local workflow.
- Preserve behavior with focused tests before and after non-trivial refactors.
- Stop and re-scope if a cleanup expands across ownership boundaries or requires migration decisions.
