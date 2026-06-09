# Provider-Verified Coverage Matrix

OpenAI와 Ollama qwen3 local lane을 분리해 coverage를 기록했습니다.

- OpenAI: contract, execution/canary, limited redteam, canary-suite replay, capability matrix, storage redaction evidence는 존재합니다.
- OpenAI gap: provider-level error handling review, provider-level regression/replay acceptance.
- Ollama: contract, local-model-verified execution, bounded redteam, local replay/regression smoke, structured-output smoke, tool-calling mock smoke, capability matrix, storage redaction evidence는 존재합니다.
- Ollama gap: provider-level error handling review, replay/regression final-gate coverage, structured-output/tool-calling coverage의 provider-level acceptance.
