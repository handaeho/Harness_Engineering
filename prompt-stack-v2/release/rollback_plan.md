# Rollback Plan

## Alpha Rollback Boundary

`prompt-stack/v36` remains the stable baseline. If v2 alpha work is invalid,
remove or replace only `prompt-stack-v2` artifacts. Do not modify v36 to repair
v2.

## Recovery Steps

1. Preserve the failing validation output.
2. Identify the invalid alpha artifact.
3. Restore the last valid v2 alpha file or regenerate baseline evidence from
   read-only v36.
4. Rerun the static checks only.
5. Keep claim strength at alpha level unless stronger evidence exists.

## Stable Fallback

Use `prompt-stack/v36` for current stable operation until v2 reaches a later
verified milestone.

## Beta Release Gate Dry-run Draft

The release gate dry-run adds draft rollback targets only. Draft status does not finalize rollback authority or allow release-gated status.

Current draft triggers:
- Canary replay suite fails after previously passing.
- Claim scanner detects a prohibited positive claim.
- Required bundle evidence is missing from the evidence index.

Each trigger requires preserving the failing report, restoring or regenerating
the last valid evidence artifact, rerunning the relevant gate, and downgrading
claims until evidence is restored.

## RC1 Actual Gate Preflight Rollback Boundary

The RC1 OpenAI-only actual gate preflight can proceed to an approval request only
when rollback readiness is recorded separately from release approval.

Rollback owner: `agent`

Release approval owner: `operator`

Rollback targets:
- last passing `evidence/rc1-openai-scope-bundle/rc1_gate_report.json`
- last passing `evidence/rc1-release-gate-dry-run-openai-scope/rc1_release_gate_dry_run_gate_report.json`
- current `evidence/rc1-release-gate-actual-openai-scope-preflight/rc1_release_gate_actual_preflight_gate_report.json`

Claim downgrade rules:
- remove `rc1-release-gate-actual-preflight-completed` if preflight evidence fails
- remove `rc1-release-gate-approval-packet-generated` if the approval gate is missing or open without the exact approval phrase
- remove `rc1-release-gate-command-plan-drafted` if the command plan is missing or executable in the preflight stage
- keep `release-gated`, `stable`, `production-ready`, `production-monitored`, and `provider-diverse` blocked unless later actual gate evidence explicitly allows a narrower claim

Required rollback evidence:
- failing gate report
- corrected claim boundary report
- restored or regenerated evidence readiness record
- updated session handoff with downgraded claim state
