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

1. `AGENTS.md`
2. `PROJECT_INPUT.md`
3. `PROJECT_BRIEF.md`
4. `CURRENT_STATE.yaml`
5. `release/scope.yaml`
6. `release/claim_boundary.yaml`
7. `.harness/harness-core/AGENTS.md`
8. `.harness/harness-core/START_HERE_FOR_AGENTS.ko.md`
9. `.harness/harness-core/AGENT_BOOTSTRAP.ko.md`
10. `.harness/harness-core/release/claims/general/claim_ladder.md`

## Project Assets

Project state and evidence live in:

```text
PROJECT_INPUT.md
PROJECT_BRIEF.md
CURRENT_STATE.yaml
evidence/current-state/
evidence/runs/
evidence/gates/
evidence/checks/
release/
tools/
docs/
```

Project-specific checkers live in `tools/`. Do not add project-specific checkers under `.harness/harness-core/tools/`.

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
node tools/check_project_current_state.mjs
node tools/check_project_claims.mjs
node tools/check_project_precommit.mjs
```

Run HARNESS Core health checks only when the HARNESS reference itself needs validation:

```bash
cd .harness/harness-core
node tools/checks/workspace/check_agent_ready_self_contained.mjs
node tools/checks/workspace/check_reference_baseline_integrity.mjs
cd ../..
```
