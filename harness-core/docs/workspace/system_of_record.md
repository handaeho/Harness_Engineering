# System of Record

`AGENTS.md` is the agent-facing System of Record index for this repository. It gives a new agent the shortest safe path to the harness contract, claim ladder, release gates, capability matrix, and evidence.

AGENTS.md is an index and operating guide, not the only source of truth.
Machine-readable gates and evidence remain authoritative for validation and claims.

## Source Roles

- `AGENTS.md` is the agent-facing System of Record index.
- `stack.yaml` is the machine-readable manifest.
- `core/spec/harness.spec.yaml` is the model-independent behavior contract.
- `release/claims/general/claim_ladder.md` is the claim strength contract.
- `release/gates/core-release/release_gate.yaml` is the release, stable, and production gate contract.
- `adapters/provider_capability_matrix.yaml` is the current capability contract.
- `evidence/**` is audit truth for execution, validation, review, and gate outcomes.
- `docs/**` is human-readable support, not primary evidence.

## Current Boundary

`containment-verified` is allowed only for the beta containment evidence scope. OpenAI-only rc.1 evidence work may proceed, but `stable`, `release-gated`, `production-ready`, `production-monitored`, `provider-diverse`, `provider-verified`, `adapter-checked`, `local-model-verified`, and `integration-verified` remain blocked.
