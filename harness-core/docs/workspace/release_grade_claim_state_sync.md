# Release-grade Claim State Sync

This runner keeps the SOR claim state aligned with release-grade gate evidence.

Run a no-write check:

```bash
npm run run:release-grade-claim-state-sync
npm run check:release-grade-claim-state-sync
```

Apply the derived claim state after reviewing evidence:

```bash
npm run apply:release-grade-claim-state-sync
npm run check:release-grade-claim-state-sync
```

The runner derives only the release-grade claim set:

- `provider-verified`
- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`
- `bare release-gated`

It reads provider, Ollama adapter evidence package, and general release gate
reports. `local-vllm-adapter-checked` is recorded as the version2 follow-up and
is not required before the version1 `release-gated` path. It writes only:

- `CURRENT_STATE.yaml`
- `CURRENT_STATE.json`
- `evidence/post-active-scoped-final-release-dossier/final_release_claim_state.json`
- `docs/claims/final_release_claim_state.ko.md`

It does not perform provider calls, local endpoint probes, local model execution, telemetry writes, raw request/response storage, or secret storage.

Claim rule:

- `provider-verified` opens only when the provider-verified gate is `status: pass`.
- `adapter-checked` opens only when the adapter final gate and Ollama evidence package both pass.
- `production-ready`, `stable`, and `release-gated` open only when provider-verified, adapter-checked, the general release gate, and explicit approval all pass.
- `bare release-gated` remains blocked for the version1 Ollama release gate.

Output:

```text
evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json
evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json
```

`status: pass` means the SOR claim fields match current gate evidence. It is not a live provider, adapter, or general release execution claim.
