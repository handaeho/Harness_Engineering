# v36_candidate Router

Metadata:
- asset_name: AGENTS.md
- purpose: Short root router for v36_candidate.
- owner_layer: root_router
- harness_subsystems: Instructions, State, Verification, Scope, Lifecycle
- claim_strength: candidate-local

This directory is v36_candidate, not stable v36. v35 remains the current stable baseline.

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
- Verification lives in verification/ and harness/.
- Lifecycle lives in lifecycle/.
- Evidence and release records live in records/, reports/, archive/.

## Boundaries
- Do not modify prompt-stack/v35.
- Do not call this candidate v36 until release gate passes.
- Do not mix Codex runtime with autonomous source-of-truth assets.
- Do not claim production monitoring, containment verification, or benchmark certification without matching evidence.

## Completion Rule
Completion requires concrete validation evidence. A trace, cloned source, or runner file alone is not enough.
