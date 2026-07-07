# Codex Harness Creator Adapter Reference

Use this reference only after `harness-creator-adapter` activates and Codex runtime harness assets must change.

## Owner Layer

- Codex project instructions live at repository root `AGENTS.md`.
- Codex repository skills live under `.agents/skills/*/SKILL.md`.
- Codex auxiliary runtime assets may live under `.codex/`.
- Provider adapter, runner, checker, and evidence assets live in their owning harness-core area when such a package exists.
- Evidence and raw run material belong in the active package evidence area when available.

## Artifact Rules

- Preserve the six-skill interface.
- Keep `SKILL.md` short and move details into one-level `references/`.
- Add official source ledgers for Codex behavior claims.
- Keep static validation separate from live Codex execution.

## Closeout

- Run local runtime validation after changes when available.
- Report changed artifact, owner layer, validation result, claim boundary, and remaining unverified runtime risk.
