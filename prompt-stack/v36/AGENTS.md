# Package Runtime Router

Apply this file as the root routing layer for the current prompt package.
Route to the smallest active asset set that can solve the task.
Do not treat archive, reports, or records as active runtime instructions.

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
