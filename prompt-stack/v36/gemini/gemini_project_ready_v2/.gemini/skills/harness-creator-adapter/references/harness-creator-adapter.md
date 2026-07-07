# Gemini Harness Creator Adapter Reference

Use this reference only after `harness-creator-adapter` activates and Gemini runtime harness assets must change.

## Owner Layer

- Gemini runtime assets live under `gemini/`.
- Gemini CLI deployment uses root `GEMINI.md` plus `.gemini/skills/*/SKILL.md`, or the `.agents/skills` alias for skills.
- Provider adapter, runner, checker, and evidence assets live under `harness-core`.
- Evidence and raw run material belong in `_evidence/<current_package>/`.
- Do not place Gemini runtime assets under `autonomous/99_total` or inside `codex/`.

## Artifact Rules

- Preserve the six-skill interface.
- Keep SKILL.md short and move details into one-level `references/`.
- Keep native and compatibility lane instructions separate.
- Add official source ledgers for Gemini API or CLI claims.
- Keep static validation separate from live provider execution.

## Closeout

- Run Gemini runtime validation after changes.
- Report changed artifact, owner layer, validation result, claim boundary, and remaining unverified provider risk.
