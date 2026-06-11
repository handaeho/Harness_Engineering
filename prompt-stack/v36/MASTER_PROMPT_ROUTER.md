# MASTER_PROMPT_ROUTER

Metadata:
- asset_name: MASTER_PROMPT_ROUTER.md
- purpose: Router for humans or autonomous agents assembling current package assets.
- owner_layer: autonomous_router
- harness_subsystems: Instructions
- claim_strength: current-stable-local-release

## Autonomous Agent Use
Use autonomous/00_governance through autonomous/04_harness as source-of-truth. Use autonomous/99_total as the generated assembled bundle.

## Codex Use
Use codex/AGENTS.md and codex/CODEX_RUNTIME_GUIDE.md. Do not load autonomous/99_total as a Codex runtime package.

## Gemini Use
Use gemini/GEMINI.md and gemini/GEMINI_RUNTIME_GUIDE.md for Gemini CLI. Use gemini/AGENTS.md only as an AGENTS-style compatibility entrypoint. Place skills under .gemini/skills/ or .agents/skills/ for Gemini CLI automatic skill discovery. Use native_gemini_api as the primary Gemini lane and openai_compatibility only as a compatibility lane. Do not load autonomous/99_total as a Gemini runtime package.

## Operational Use
Use state/, verification/, lifecycle/, docs/, harness/, records/, reports/, and archive/ to continue, verify, and close sessions.
