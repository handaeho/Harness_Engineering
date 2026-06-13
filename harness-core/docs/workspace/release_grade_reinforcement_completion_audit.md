# Release-grade Reinforcement Completion Audit

This checker audits the current release-grade reinforcement state across HARNESS Core and the current prompt-stack package.

Run:

```bash
npm run check:release-grade-completion-audit
```

The checker does not perform provider calls, local model execution, endpoint probes, telemetry writes, or release approval actions. It reads existing evidence and classifies each requirement as:

- `complete`: current evidence proves the requirement at its intended scope.
- `hold`: the requirement is structurally prepared but missing explicit release
  approval, or a later version2 local-vLLM follow-up has not yet been executed.
- `fail`: a required asset or invariant is absent or contradicted.

The audit can return `status: hold` with exit code 0. That means claim gates are correctly preventing stronger claims, not that the release-grade goal is complete.

The audit includes a dedicated `claim_state_sync_control` requirement. That requirement is complete only when:

- `evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json` is `status: pass`
- `evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json` is `status: pass`
- `sync_required_after_apply` is `false`
- the sync expected claim flags match the current provider, Ollama adapter
  evidence package, and general release gate evidence

Output:

```text
evidence/release-grade-reinforcement-completion-audit/release_grade_reinforcement_completion_audit_report.json
```

Completion for the version1 path requires all audited requirements to be
`complete`, including SOR claim-state sync pass, Ollama evidence package pass,
and explicit approval-backed general release gate pass. The
`local-vllm-adapter-checked -> production-ready -> stable -> release-gated` path
is recorded as the version2 follow-up.
