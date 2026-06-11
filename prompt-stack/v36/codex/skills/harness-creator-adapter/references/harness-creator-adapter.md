# Harness Creator Adapter Reference

Use this reference only after `harness-creator-adapter` activates and the task changes runtime harness assets.

## Owner Layer

- Codex runtime assets live under `codex/`.
- Shared package docs, records, validation, state, and lifecycle assets live under their active package directories.
- Evidence and raw run material belong in `_evidence/<current_package>/`.
- Do not place Codex runtime assets under `autonomous/99_total`.
- Do not mirror autonomous source prose into Codex runtime files.

## Artifact Rules

- Change the smallest artifact that closes the harness gap.
- Keep SKILL.md short and move detailed operating procedures to one-level `references/`.
- Keep validation expectations close to the files they validate.
- Add source ledgers for product or API claims.
- Record follow-ups instead of creating new skill names during fixed six-skill maintenance.

## Closeout

- Run relevant static runtime validators.
- Report changed artifact, subsystem, owner layer, validation result, claim boundary, and remaining risk.
- Do not claim release, production, containment, provider, or telemetry proof without matching executed evidence.
