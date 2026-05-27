# CODEX_RUNTIME_GUIDE

Metadata:
- asset_name: CODEX_RUNTIME_GUIDE.md
- purpose: Codex host-runtime router for v36.
- owner_layer: codex_runtime
- harness_subsystems: Instructions, Verification, Scope, Lifecycle
- claim_strength: current-stable-local-release

## Status
This is the Codex runtime package for v36. It is not a textual mirror of autonomous prompt assets.

## Startup
1. Read codex/AGENTS.md.
2. Select one primary skill from codex/skills/ by matching the task to the skill `description`.
3. Read state/session-handoff.md and docs/ARTIFACT_MAP.md when current state or artifact routing matters.
4. Preserve approval, tool, retrieval, memory, multi-agent, and release boundaries from the runtime constitution.

## Skill Routing
- `coding-core`: bounded code execution, bug fixes, debugging, refactoring, tests, review, and code-adjacent documentation. Do not use for pure research, broad strategy, release gates, harness creation, or multi-agent coordination.
- `design-analysis`: architecture, technical decisions, trade-off comparison, and strategic implementation planning. Do not use for narrow patches or release verdicts.
- `eval-ops`: evaluation design, scorecards, regression review, drift, benchmark comparison, and release-readiness. Do not use for ordinary code fixes or harness artifact creation.
- `grounded-research`: source-backed synthesis, citations, freshness checks, document investigation, and latest-fact questions. Do not use for direct implementation once evidence is sufficient.
- `orchestration-control`: multi-agent topology, handoff contracts, lifecycle coordination, capability-fit review, and join quality. Do not use when one coherent agent path is enough.
- `harness-creator-adapter`: create or adapt harness artifacts for Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, or clean-state work. Do not use it for ordinary code patches, release decisions, pure research, or copying autonomous source assets into Codex runtime.

Routing rules:
- Keep `codex/AGENTS.md` as the always-on constitution. Put task-specific executable procedures in `codex/skills/*/SKILL.md`.
- Keep the six existing skills as the stable routing interface. If a new skill seems necessary, record it as a follow-up candidate rather than creating it during fixed-scope maintenance.
- If a task spans domains, choose the skill that owns the current blocking decision, then hand off explicitly when the work changes type.

## Verification
Run harness/validate_codex_runtime.mjs after Codex runtime changes. Validate runtime fitness and safety preservation, not parity with autonomous source text.
