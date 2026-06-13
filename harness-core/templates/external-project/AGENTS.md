# Project Agent Constitution

This project uses HARNESS Core as the evidence-gated autonomous engineering harness.

## Project Root

Work from this project root. Product code follows the language and framework standard layout for this repository.

## HARNESS Core Reference

HARNESS Core lives at:

```text
.harness/harness-core/
```

Before broad, release-sensitive, or claim-sensitive work, read:

1. `.harness/project/AGENTS.md`
2. `.harness/project/PROJECT_INPUT.md`
3. `.harness/project/PROJECT_BRIEF.md`
4. `.harness/project/CURRENT_STATE.yaml`
5. `.harness/project/release/scope.yaml`
6. `.harness/project/release/claim_boundary.yaml`
7. `.harness/harness-core/AGENTS.md`
8. `.harness/harness-core/START_HERE_FOR_AGENTS.ko.md`
9. `.harness/harness-core/AGENT_BOOTSTRAP.ko.md`
10. `.harness/harness-core/release/claims/general/claim_ladder.md`

## Project Assets

Project state and evidence live in:

```text
.harness/project/PROJECT_INPUT.md
.harness/project/PROJECT_BRIEF.md
.harness/project/CURRENT_STATE.yaml
.harness/project/evidence/current-state/
.harness/project/evidence/runs/
.harness/project/evidence/gates/
.harness/project/evidence/checks/
.harness/project/release/
.harness/project/tools/
.harness/project/docs/
```

Project-specific checkers live in `.harness/project/tools/`. Do not add project-specific checkers under `.harness/harness-core/tools/`.

## Autonomous Product Build Mode

Invariant labels:

- `natural_language_product_request_supported`
- `derive_missing_project_fields`
- `bootstrap_only_is_not_complete`
- `local_mvp_required_without_live_access`
- `implementation_evidence_required`
- `production_grade_contract_required`
- `database_contract_required`
- `framework_runtime_contract_required`
- `environment_configuration_contract_required`
- `deployment_operations_contract_required`
- `security_privacy_contract_required`
- `test_quality_gate_contract_required`
- `observability_contract_required`

If the user describes software to build in natural language, treat it as a product-development request even when they did not fill `.harness/project/PROJECT_INPUT.md` or any structured form.

Do not ask the user to fill a long form before starting. Extract project name, users, product type, core features, user flows, data, constraints, success criteria, and verification needs from the request. If a value is missing, choose a conservative default and record it as `Assumption`. Ask a question only when a safe local MVP cannot be defined without the answer.

Bootstrap is only the setup step. Do not stop after creating `.harness/project/PROJECT_INPUT.md`, `.harness/project/PROJECT_BRIEF.md`, `.harness/project/CURRENT_STATE.yaml`, `.harness/project/release/*`, docs, or checker scaffolding unless the user explicitly asked for bootstrap only.

For product-development requests, the solved condition is:

1. product code implementing the requested user workflow exists
2. a local run path is documented
3. mock, fixture, or approved live data path is available
4. at least one project-specific test, smoke test, or checker exercises the requested workflow
5. relevant project checks and build/test/lint commands have been run
6. remaining external API, credential, deployment, or release blockers are recorded

When live external APIs, paid APIs, secrets, or credentials are not approved, implement a mock connector or fixture-backed MVP and record the live integration as a blocker. Do not treat the live blocker as permission to stop before implementing the local MVP.

## Production-Grade Mode

If the user asks for production-grade work, durable software, deployment-ready implementation, or anything equivalent, do not treat a mock MVP as sufficient unless the user explicitly narrows the goal back to MVP.

For production-grade requests, record and implement or explicitly hold each contract:

1. framework and language/runtime versions
2. database engine, schema, migration, seed, index, constraint, and test database strategy
3. environment configuration, env template, ports, process model, and package scripts
4. authentication, authorization, permissions, secret handling, privacy, and audit behavior
5. observability, structured logs, health/readiness checks, and error boundaries
6. deployment and operations assumptions, backup/restore, rollback, and migration order
7. test quality gates covering unit, integration, DB/migration, smoke, permission/security, secret/raw storage scan, and acceptance flow

`production-grade` is not the same as opening the `production-ready` claim. Do not claim `production-ready`, `stable`, or `release-gated` unless a project-specific gate has executed and passed with evidence.

## Guardrails

Do not modify without explicit approval:

```text
node_modules/**
dist/**
.harness/harness-core/evidence/reference-baseline/**
.harness/harness-core/dist/**
.harness/harness-core/node_modules/**
```

Do not perform without explicit approval:

```text
OpenAI model API call
OpenAI provider rerun
external paid API call
local model generation
telemetry sink write
npm install
npm ci
production deployment
release gate rerun
destructive command
```

Never store raw request, raw response, secret, API key, or authorization header content.

## Claim Boundary

Do not claim `provider-verified`, `adapter-checked`, `production-ready`, `stable`, or `release-gated` unless this project has a project-specific gate and evidence bundle for that claim.

## Verification

Run project checks from the project root:

```bash
node .harness/project/tools/check_project_current_state.mjs
node .harness/project/tools/check_project_claims.mjs
node .harness/project/tools/check_project_precommit.mjs
```

Run HARNESS Core health checks only when the HARNESS reference itself needs validation:

```bash
cd .harness/harness-core
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
cd ../..
```
