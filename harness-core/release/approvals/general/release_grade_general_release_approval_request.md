# Release-grade General Release Approval Request

Stage requesting approval:
v2.0.0-release-grade-general-release-gate

What will execute after approval:
- General release gate evaluation for `production-ready`, `stable`, and `release-gated`
- Claim-state sync against the gate-derived result
- Final precommit convergence check

What will not execute:
- OpenAI provider call
- Gemini provider call
- New local model execution
- Local endpoint probe
- Telemetry sink write
- Production deployment
- `bare release-gated` claim opening

Required approval phrase:

```text
I approve opening release-grade general production-ready, stable, and release-gated claims.
```

Approval handling:
- Provide the exact phrase in a separate owner message or as `RELEASE_GRADE_GENERAL_RELEASE_APPROVAL`.
- The gate stores approval presence and hashes only.
- The gate does not store the raw approval text.

Prerequisite evidence before approval is meaningful:
- `evidence/release-grade-provider-verified-gate/release_grade_provider_verified_gate_report.json` is `pass`.
- `evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json` is `pass`.
- `evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json` is `pass`.
- `evidence/harness-core-final-precommit-convergence/final_precommit_convergence_report.json` is `pass`.

Version sequencing:
- Version1 path: `ollama-adapter-checked -> production-ready -> stable -> release-gated`.
- Version2 follow-up path: `local-vllm-adapter-checked -> production-ready -> stable -> release-gated`.
