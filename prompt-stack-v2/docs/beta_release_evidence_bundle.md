# Beta Release Evidence Bundle Draft

Stage: `v2.0.0-beta-release-evidence-bundle-draft`

This draft indexes existing evidence from alpha, beta preflight, mock runtime,
OpenAI provider canaries, OpenAI canary replay suite, and local readiness
records. It does not execute a new provider call, local model call, endpoint
probe, redteam run, telemetry connection, or release gate.

The bundle claim level is `beta_evidence_bundle_draft`.

It allows only:
- `beta-release-evidence-bundle-drafted`
- `evidence-lineage-indexed`
- `claim-boundary-audited`
- `release-readiness-draft-assessed`
- `blocker-register-updated`

It does not allow `release-gated`, `production-ready`,
`production-monitored`, `replay-verified`, `provider-diverse`,
`provider-verified`, `adapter-checked`, `local-model-verified`, or
`integration-verified`.

Primary generated artifacts live under
`evidence/beta-release-evidence-bundle/`.
