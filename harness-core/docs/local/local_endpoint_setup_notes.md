# Local Endpoint Setup Notes

This document records prerequisites only. This stage does not start servers,
download models, pull models, or probe endpoints.

## vLLM Prerequisites

- A localhost-only OpenAI-compatible vLLM endpoint is running.
- `VLLM_BASE_URL` points to the localhost endpoint.
- `VLLM_MODEL` names the served model.
- The next local canary runner must reject non-localhost URLs by default.

## Ollama Prerequisites

- A localhost-only Ollama endpoint is running.
- `OLLAMA_BASE_URL` points to the localhost endpoint.
- `OLLAMA_MODEL` names the available local model.
- The next local canary runner must reject non-localhost URLs by default.

## Deferred Validation

Actual endpoint probing, local model execution, structured output checks, and
tool-calling checks are deferred until the local no-tool canary stage is
explicitly approved.
