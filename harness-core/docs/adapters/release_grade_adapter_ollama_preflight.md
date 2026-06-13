# Release Grade Adapter Ollama Preflight

`node tools/checks/adapters/check_release_grade_adapter_ollama_preflight.mjs`
records whether the existing Ollama local lane evidence is ready to feed the
version1 adapter-checked final gate.

This preflight does not probe an endpoint and does not run a local model. It
reads already-recorded Ollama evidence for local model verification, structured
output smoke, tool-calling mock smoke, replay regression, redaction storage, and
adapter conformance.

`local-vllm-adapter-checked` is explicitly deferred to the version2 follow-up and
is not required before the version1 `release-gated` path.

```sh
npm run check:release-grade-adapter-ollama
npm run run:release-grade-adapter-coverage
npm run check:release-grade-adapter-coverage
npm run run:release-grade-adapter-checked-final
npm run check:release-grade-adapter-checked-final
```

The preflight itself opens no claim. `adapter-checked` may only open after the
adapter final gate and the Ollama evidence package pass.
