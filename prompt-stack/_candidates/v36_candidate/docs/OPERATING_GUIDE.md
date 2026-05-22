# v36_candidate Operating Guide

Metadata:
- asset_name: OPERATING_GUIDE.md
- purpose: Operating rules for modifying and validating v36_candidate.
- owner_layer: docs
- harness_subsystems: Instructions, Scope, Verification, Lifecycle
- claim_strength: candidate-local

## Startup
1. Read AGENTS.md.
2. Read docs/ARTIFACT_MAP.md.
3. Read state/feature_list.json and state/session-handoff.md.
4. Run lifecycle/init.sh when a shell is available.

## Modification Rule
- Modify v36_candidate only.
- Do not mutate prompt-stack/v35.
- Update records and state when active assets change.
- Keep Codex runtime separate from autonomous source assets.

## Verification Rule
- Run harness/validate_current_v36.mjs after structural changes.
- Run harness/validate_assembled_bundle.mjs after autonomous source changes.
- Run harness/validate_codex_runtime.mjs after codex changes.
- Run benchmark and ablation scripts before any release decision update.

## Closeout
Update state/progress.md, state/session-handoff.md, records/v36_current_state.json, and final_handoff.md.
