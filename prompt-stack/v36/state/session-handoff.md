# Current Package Session Handoff

Metadata:
- asset_name: session-handoff.md
- purpose: 다음 세션이 v36 current stable 상태를 대화 이력 없이 이어받기 위한 handoff packet.
- owner_layer: state
- harness_subsystems: State, Lifecycle
- claim_strength: current-local-validation

## Current Stable
The active package is the current stable package.

## Active Package
- 사용자 문서: `README.md`, `PROMPT_USER_GUIDE.md`, `docs/`
- autonomous assets: `autonomous/`
- Codex runtime assets: `codex/`
- state assets: `state/`
- verification assets: `verification/`
- lifecycle assets: `lifecycle/`
- validation runners: `harness/`, `validation/`

## Evidence Package
Raw source clone, actor outputs, semantic judge records, ablation evidence, release decision evidence, and validation run history are stored under `_evidence/v36/`.

## Resume Steps
1. Run `lifecycle/init.sh`.
2. Inspect `state/feature_list.json` and `state/progress.md`.
3. Select the correct execution domain: `autonomous/` or `codex/`.
4. Run the relevant validation runner before completion claims.

## Claim Boundaries
- Do not claim operational telemetry is connected.
- Do not claim containment proof is produced.
- Do not claim public benchmark certification.
- Do not claim all primary sources are fully validated beyond the recorded evidence.

## Next Action
Operate from active package. Use `_evidence/v36/` only when release evidence or raw trace review is explicitly needed.
