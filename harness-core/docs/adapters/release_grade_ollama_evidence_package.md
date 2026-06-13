# Release Grade Ollama Evidence Package

`node tools/checks/adapters/check_release_grade_ollama_evidence_package.mjs`
packages the version1 Ollama adapter evidence needed for:

- `adapter-checked`
- `production-ready`
- `stable`
- `release-gated`

The package requires the Ollama adapter preflight, local model verification,
structured output smoke, tool-calling mock smoke, replay regression, redaction
audit, adapter conformance, adapter coverage completion, adapter final gate, and
a refreshed general release gate.

It does not run provider calls, local model calls, endpoint probes, telemetry
writes, or release side effects.

```sh
npm run ollama-release-grade-evidence-gate
```

The general release claims still require explicit release approval:

```sh
export RELEASE_GRADE_GENERAL_RELEASE_APPROVAL="I approve opening release-grade general production-ready, stable, and release-gated claims."
npm run ollama-release-grade-evidence-gate
```

`local-vllm-adapter-checked` remains the version2 follow-up and is not a
version1 release blocker.
