# MASTER_PROMPT_ROUTER

Metadata:
- asset_name: MASTER_PROMPT_ROUTER.md
- purpose: Router for humans or autonomous agents assembling v36_candidate assets.
- owner_layer: autonomous_router
- harness_subsystems: Instructions
- claim_strength: candidate-local

## Autonomous Agent Use
Use autonomous/00_governance through autonomous/04_harness as source-of-truth. Use autonomous/99_total only as the generated assembled bundle.

## Codex Use
Use codex/AGENTS.md and codex/CODEX_RUNTIME_GUIDE.md. Do not load autonomous/99_total as a Codex runtime mirror.

## Operational Use
Use state/, verification/, lifecycle/, docs/, harness/, records/, reports/, archive/ to continue, verify, and close sessions.
