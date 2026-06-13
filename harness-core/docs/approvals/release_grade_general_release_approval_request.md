# Release-grade General Release Approval Request

Canonical approval request:

```text
release/approvals/general/release_grade_general_release_approval_request.md
```

Required approval phrase:

```text
I approve opening release-grade general production-ready, stable, and release-gated claims.
```

This approval can open only the general `production-ready`, `stable`, and
`release-gated` claims after the Ollama-first adapter evidence package and final
precommit convergence are passing. It does not open `bare release-gated`, does
not run live provider or local model execution, and does not satisfy the
version2 local-vLLM follow-up evidence.
