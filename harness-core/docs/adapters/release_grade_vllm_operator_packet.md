# Release-grade vLLM Operator Packet

`npm run check:release-grade-vllm-operator-packet`

This no-live checker validates the operator packet used to collect and submit
vLLM adapter evidence for the version2
`local-vllm-adapter-checked -> production-ready -> stable -> release-gated`
follow-up. It does not probe the endpoint, call a model, call a provider, write
telemetry, or open any claim.

It checks that:

- package scripts contain the expected vLLM evidence sequence
- the full command runs local-vLLM adapter evidence, a general gate snapshot,
  package check, claim-state sync, final precommit check, refreshed general
  gate, package check, then final claim-state sync and final precommit check
- the evidence package exposes the required environment fields
- manual commands are complete and ordered
- the submission file list is complete
- redaction policy forbids raw request, raw response, and secret storage
- the related operator docs exist

Run it before asking an operator to execute vLLM evidence:

```bash
npm run check:release-grade-vllm-evidence-package
npm run check:release-grade-vllm-operator-packet
```

If it passes, the operator can use:

```bash
export VLLM_ENDPOINT_URL="http://127.0.0.1:8000/v1"
export VLLM_MODEL="<exact id from GET /v1/models>"
export VLLM_AUTH_REQUIRED="no"

npm run vllm-release-grade-evidence-gate
```

If auth is required, set `VLLM_AUTH_REQUIRED="yes"` and `VLLM_API_KEY`, but do
not store the token in any evidence file.

Output:

```text
evidence/release-grade-vllm-operator-packet/vllm_operator_packet_report.json
```

`status: pass` means the packet is coherent enough for version2 vLLM evidence
collection. It does not mean `local-vllm-adapter-checked`, `production-ready`,
`stable`, or `release-gated` is open.
