# Codex Runtime Rules

## Runtime Contract

Operate as a Codex coding agent.
Use `<project>/AGENTS.md` as the primary project instruction file.
Use skills as executable procedures, not passive reference material.
Do not mirror Gemini, autonomous, or other provider-specific prose into Codex runtime behavior unless it has been explicitly adapted into `AGENTS.md`.

## Startup

1. Load Codex instructions according to Codex `AGENTS.md` discovery order.
2. Select one primary skill from `<project>/.agents/skills/*/SKILL.md` by matching the task to the skill `description`.
3. Load only the selected skill body unless the task changes owner.
4. Use state, artifact maps, or handoff files only when state continuity or artifact routing affects execution.
5. Preserve approval, sandbox, tool, retrieval, memory, subagent, safety, and release boundaries.

## Deployment Layout

This package is intended to be installed into a Codex workspace as:

```text
<project>/AGENTS.md
<project>/.agents/skills/*/SKILL.md
<project>/.codex/CODEX_RUNTIME_GUIDE.md
<project>/.codex/validation/*
```

Do not rely on `.codex/skills` as the repository skill discovery path. Repository skills belong under `.agents/skills`.
Use `.codex` for project Codex configuration and auxiliary runtime assets.

## Codex Project Instructions

Codex builds an instruction chain from global and project `AGENTS.md` files.
Files closer to the current working directory appear later and can override earlier guidance.
Use `AGENTS.override.md` only for intentional temporary overrides.

## Skill Routing

- `coding-core`: bounded code execution, bug fixes, debugging, refactoring, tests, review, and code-adjacent documentation.
- `design-analysis`: architecture decisions, trade-offs, migration strategy, and implementation planning.
- `eval-ops`: evaluation design, regression review, benchmark comparison, drift, readiness, and claim boundaries.
- `grounded-research`: official-source synthesis, citations, freshness checks, and document investigation.
- `orchestration-control`: subagent topology, handoff contracts, lifecycle coordination, capability fit, and join quality.
- `harness-creator-adapter`: Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, and artifact-map work.

Routing rules:
- use the skill that owns the current blocking decision
- hand off explicitly when the work changes type
- keep the six-skill interface stable
- record a follow-up instead of creating a new skill during fixed-scope maintenance

## Verification

After Codex runtime layout changes, run the project-local validation command if available.

Minimum manual checks:

```text
codex --ask-for-approval never "Summarize the current instructions."
codex --ask-for-approval never "List available skills and their sources."
```

Allowed local proof classes:
- `local_static_runtime_validation`
- `repo_layout_created`

Blocked without executed evidence:
- `codex_instruction_loaded`
- `skill_discovery_confirmed`
- `commands_executed`
- `tests_passed`
- `ci_verified`
- `provider_verified`
- `release_gated`
- `production_ready`
