# Decision Log

Metadata:
- asset_name: decision_log.md
- purpose: Persistent decision trail for active package operation.
- owner_layer: state
- harness_subsystems: State, Lifecycle
- claim_strength: current-local

## Current Decisions
- Decision: Operate from `prompt-stack/<current_package>/` as the current stable active package.
- Decision: Keep raw evidence outside the active package under `prompt-stack/_evidence/<current_package>/`.
- Decision: Keep autonomous agent assets and Codex runtime assets separate.
- Decision: Treat `autonomous/99_total` as the assembled autonomous bundle, not as a Codex runtime mirror.
- Decision: Require validation before making completion or release-quality claims about active package changes.
- Decision: Preserve limitation language for production telemetry, containment proof, and provider diversity follow-up items.

## Update Rule
Add new decisions only when they affect current package operation, validation, rollback, evidence handling, or runtime boundaries.
