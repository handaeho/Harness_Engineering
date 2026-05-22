# CODEX_RUNTIME_GUIDE

Metadata:
- asset_name: CODEX_RUNTIME_GUIDE.md
- purpose: Codex host-runtime router for v36_candidate.
- owner_layer: codex_runtime
- harness_subsystems: Instructions, Verification, Scope, Lifecycle
- claim_strength: candidate-local

## Status
This is the Codex runtime package for v36_candidate. It is not a textual mirror of autonomous/00_governance through autonomous/04_harness.

## Startup
1. Read codex/AGENTS.md.
2. Select one primary skill from codex/skills/.
3. Read state/session-handoff.md and docs/ARTIFACT_MAP.md when working on this candidate.
4. Preserve approval, tool, retrieval, memory, multi-agent, and release boundaries from the runtime constitution.

## Skill Routing
- coding-core: code edits, debugging, bounded implementation.
- design-analysis: architecture, trade-off, route decisions.
- eval-ops: validation, release gates, benchmark, ablation, scorecards.
- grounded-research: source-backed synthesis and freshness-sensitive claims.
- orchestration-control: multi-agent or lifecycle topology design.
- harness-creator-adapter: adapt Learn Harness Engineering patterns without copying them as source-of-truth.

## Verification
Run harness/validate_codex_runtime.mjs after Codex runtime changes. Validate runtime fitness and safety preservation, not parity with autonomous source text.
