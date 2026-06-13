# System of Record Alignment

This stage adds a root `AGENTS.md` entrypoint and aligns it with `stack.yaml`, `MANIFEST.asset_classes.yaml`, directory-role documentation, naming conventions, and agent workflow documentation.

## Alignment Points

- `stack.yaml` declares `agent_entrypoint.path: AGENTS.md`.
- `stack.yaml` declares `asset_class_manifest.path: MANIFEST.asset_classes.yaml`.
- `source_of_truth.agent_index` includes `AGENTS.md`.
- `source_of_truth.machine_manifest` includes `stack.yaml` and `stack.schema.json`.
- `source_of_truth.core_contract` includes `core/spec/harness.spec.yaml`.
- `source_of_truth.release_contract` includes `release/claims/general/claim_ladder.md` and `release/gates/core-release/release_gate.yaml`.
- `source_of_truth.capability_contract` includes `adapters/provider_capability_matrix.yaml`.
- `source_of_truth.evidence_truth` includes `evidence/`.

## Claim Boundary

The alignment allows System of Record and documentation claims only. It does not itself allow `stable`, `release-gated`, `production-ready`, `production-monitored`, `provider-diverse`, `adapter-checked`, `local-model-verified`, or `integration-verified`.

Bare `provider-verified` is controlled separately by the release-grade provider-verified gate. It is allowed only when `evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json` has `status: pass` and `provider_verified_allowed: true`.
