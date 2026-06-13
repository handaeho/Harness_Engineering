# Release-grade vLLM Operator Environment Guard

This no-live guard checks the operator environment before vLLM execution evidence can be collected.

Run the non-strict form during source preflight:

```bash
npm run check:vllm-operator-env
```

Run the strict form before live vLLM evidence collection:

```bash
npm run preflight:vllm-operator-env
```

Required environment:

```bash
export VLLM_ENDPOINT_URL="http://127.0.0.1:8000/v1"
export VLLM_MODEL="<exact id from GET /v1/models>"
export VLLM_AUTH_REQUIRED="no"
```

If the local endpoint requires auth, use:

```bash
export VLLM_AUTH_REQUIRED="yes"
export VLLM_API_KEY="<local endpoint token>"
```

Rules enforced:

- `VLLM_ENDPOINT_URL` must be localhost-only and OpenAI-compatible, with no credentials, query, or hash.
- `VLLM_MODEL` must be present in strict mode and must not contain smart quotes, embedded shell quotes, or control characters.
- `VLLM_AUTH_REQUIRED` must be exactly `yes` or `no`.
- If `VLLM_AUTH_REQUIRED=yes`, an API key must be present, but its value must never be written to evidence.

The guard does not probe the endpoint, call a model, call an external provider, write telemetry, or store raw requests/responses.

Output:

```text
evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json
```

The vLLM evidence package requires this report to be `status: pass` before bare `adapter-checked` can open.
