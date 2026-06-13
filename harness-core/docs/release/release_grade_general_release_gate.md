# Release Grade General Release Gate

`npm run general-release-grade-gate`

This gate is for `production-ready`, `stable`, and `release-gated` claims. It
does not run provider calls, local model calls, telemetry writes, or release side
effects. `bare release-gated` remains a separate blocked claim for the version1
Ollama release path.

The gate remains `hold` unless all of these are true:

- release-grade source ledger is `pass`
- release-grade provider gate is `pass`
- release-grade adapter final gate is `pass` from the Ollama-first version1 path
- current state has the prerequisite scoped and general evidence claims
- final precommit convergence is `pass`
- explicit release approval is present

Approval is supplied through an environment variable. The report stores only
approval presence and hashes, not the approval text.

Canonical approval request:

```text
release/approvals/general/release_grade_general_release_approval_request.md
```

```sh
export RELEASE_GRADE_GENERAL_RELEASE_APPROVAL="I approve opening release-grade general production-ready, stable, and release-gated claims."
npm run general-release-grade-gate
```

Without that exact approval and without `adapter-checked` final gate evidence,
the general claims remain blocked.
