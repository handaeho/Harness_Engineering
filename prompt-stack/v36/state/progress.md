# Current Package Progress

Metadata:
- asset_name: progress.md
- purpose: Next-session operational progress log.
- owner_layer: state
- harness_subsystems: State, Lifecycle
- claim_strength: current-local

## Current State
The active package is the current stable package. The active package is simplified for use, and raw evidence is separated under `_evidence/<current_package>/`.

## Done
- Autonomous source assets and Codex runtime assets are separated.
- `autonomous/99_total` is maintained as an assembled autonomous bundle.
- State, verification, scope, and lifecycle assets are active under their dedicated directories.
- User-facing current documents are Korean and current-state oriented.
- Cleanup/process records and raw evidence are outside the active package.

## Validation
- current package validation: 186/186 pass
- assembled autonomous bundle validation: 18/18 pass
- Codex runtime validation: 17/17 pass
- active checksum drift: 0
- evidence checksum drift: 0

## Current Boundaries
- Current stable pointer remains `current package`.
- Active package path: `prompt-stack/<current_package>/`.
- Evidence package path: `prompt-stack/_evidence/<current_package>/`.
- Production telemetry, containment proof, and broader provider diversity remain follow-up items.

## Next Session Should
1. Read `README.md` and `PROMPT_USER_GUIDE.md` for user operation.
2. Use `AGENTS.md` or `MASTER_PROMPT_ROUTER.md` for general agent routing.
3. Use `codex/AGENTS.md` and `codex/CODEX_RUNTIME_GUIDE.md` for Codex runtime tasks.
4. Run the three validation commands after any active package change.
