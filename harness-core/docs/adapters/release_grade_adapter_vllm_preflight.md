# Release Grade Adapter vLLM Preflight

`node tools/checks/adapters/check_release_grade_adapter_vllm_preflight.mjs`
is retained for the version2 `local-vllm-adapter-checked` follow-up.

This preflight does not probe a vLLM endpoint. It records whether the adapter
manifest and evidence surface are ready for a future execution-backed adapter
gate. vLLM execution evidence is not required before the version1 Ollama
`release-gated` path.

## Execution Evidence Path

Use these commands only after a local vLLM OpenAI-compatible endpoint is running.
The endpoint must be localhost-only. Raw request bodies, raw response bodies,
auth headers, and secrets must not be stored.

```sh
export VLLM_ENDPOINT_URL="http://127.0.0.1:8000/v1"
export VLLM_MODEL="<served-model-id>"
export VLLM_AUTH_REQUIRED="no"

npm run preflight:vllm-live-canary
npm run canary:vllm-no-tool
npm run check:vllm-no-tool
npm run run:vllm-adapter-conformance
npm run check:vllm-adapter-conformance
npm run run:release-grade-adapter-coverage
npm run check:release-grade-adapter-coverage
npm run check:release-grade-adapter-vllm
```

The version2 follow-up must not be used as proof that the version1 Ollama
release gate is stronger than its recorded evidence.
