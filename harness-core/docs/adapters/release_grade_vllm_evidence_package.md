# Release-grade vLLM Evidence Package

This package is the operator-facing collection check for the version2
`local-vllm-adapter-checked -> production-ready -> stable -> release-gated`
follow-up path.

It is not required before the version1 Ollama `release-gated` path.

Run after a vLLM endpoint attempt:

```bash
npm run check:release-grade-vllm-evidence-package
```

For the complete vLLM evidence path, run:

```bash
npm run check:release-grade-vllm-operator-packet
npm run vllm-release-grade-evidence-gate
```

This full path starts with:

```bash
npm run preflight:vllm-operator-env
```

That guard fails early on malformed vLLM environment values such as smart-quoted model ids, non-localhost endpoints, or missing auth token presence when `VLLM_AUTH_REQUIRED=yes`.

Required environment:

```bash
export VLLM_ENDPOINT_URL="http://127.0.0.1:8000/v1"
export VLLM_MODEL="<exact id from GET /v1/models>"
export VLLM_AUTH_REQUIRED="no"
```

If the endpoint requires auth, set `VLLM_AUTH_REQUIRED="yes"` and `VLLM_API_KEY`, but never store the token in evidence.

The checker does not perform live provider calls, local model generation, or telemetry writes. It reads existing readiness, no-tool, adapter conformance, adapter coverage, adapter final gate, and general release gate artifacts.
It also requires `evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json` to be `status: pass`.

`status: pass` means the required vLLM execution artifacts are complete enough for
version2 `local-vllm-adapter-checked` review. `status: hold` means the version2
local-vLLM `adapter-checked`, `production-ready`, `stable`, and `release-gated`
follow-up remains blocked.

The general release gate must be refreshed after the adapter-checked final gate and before the first package check. That refresh can remain `hold`, but it must observe `adapter_checked_allowed: true` from the adapter final gate. Without that refresh, the package stays on `hold` even if vLLM execution artifacts were produced.

After this package reaches `status: pass`, run:

```bash
npm run apply:release-grade-claim-state-sync
npm run check:release-grade-claim-state-sync
```

That post-package sync is what updates `CURRENT_STATE.yaml`, `CURRENT_STATE.json`, and the final release claim state from package evidence. The full wrapper repeats the general gate and package check after sync so explicit release approval, if present, can open the general release claims before the final sync.

The package also records a `claim_promotion_readiness` object:

- `provider_verified`: mirrors the provider gate result.
- `adapter_checked`: opens only for the version2 local-vLLM follow-up when the vLLM evidence package and adapter final gate both pass.
- `general_release`: remains `awaiting_explicit_general_release_approval_or_general_gate_pass` unless the general release gate has explicit approval and `status: pass`.

The package enforces ordering with `ordering_checks`: `release-grade-general-release-gate` must have `generated_at` greater than or equal to the adapter final gate `generated_at`. This prevents stale general gate evidence from being treated as a post-adapter release decision.

The fixture regression checker verifies four no-live-execution cases:

```bash
npm run check:release-grade-vllm-evidence-package-regression
```

It covers adapter-only pass, approved general release pass, stale general gate hold, and missing vLLM no-tool evidence hold.
It also covers a missing operator environment guard hold.

The submission file list is written to:

```text
evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json
```
