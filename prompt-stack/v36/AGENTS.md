# Current Package Router

Metadata:
- asset_name: AGENTS.md
- purpose: Short root router for v36.
- owner_layer: root_router
- harness_subsystems: Instructions, State, Verification, Scope, Lifecycle
- claim_strength: current-stable-local-release

This directory is the current stable current harness package.

## Startup
1. Read docs/CURRENT_STATE.md.
2. Read docs/ARTIFACT_MAP.md.
3. Read state/feature_list.json.
4. Read state/session-handoff.md.
5. Use lifecycle/init.sh before claiming readiness when shell execution is available.

## Routing
- Autonomous agent prompt assets live in autonomous/.
- Codex runtime assets live in codex/.
- State lives in state/.
- Verification lives in verification/, validation/, and harness/.
- Lifecycle lives in lifecycle/.
- Release evidence lives in records/, reports/, and archive/.

## Boundaries
- Keep Codex runtime separate from autonomous source-of-truth assets.
- Treat archive and release evidence as records, not active instructions.
- Do not claim production monitoring, containment verification, all-primary-source validation, or public benchmark certification without matching evidence.

## Completion Rule
Completion requires concrete validation evidence. A trace, cloned source, or runner file alone is not enough.
