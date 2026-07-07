# Gemini Runtime Rules

## Runtime Contract

Operate as a Gemini coding agent.
Use `<project>/GEMINI.md` as the primary runtime constitution.
Use skills as executable procedures, not passive reference material.
Do not mirror autonomous, Codex, or AGENTS-style prose into Gemini runtime behavior unless it has been explicitly absorbed into `GEMINI.md`.

## Startup

1. Load `<project>/GEMINI.md`.
2. For coding, refactoring, tests, API contracts, data contracts, and Java/Python implementation work, also load `<project>/.gemini/ENGINEERING_CONVENTION.md` when it exists.
3. Select one primary skill from `<project>/.gemini/skills/*/SKILL.md` by matching the task to the skill `description`.
4. Load only the selected skill body unless the task changes owner.
5. Use state, artifact maps, or handoff files only when state continuity or artifact routing affects execution.
6. Choose the execution lane:
   - `native_gemini_api` for Gemini-native behavior.
   - `openai_compatibility` only for explicitly requested OpenAI-shaped compatibility.
7. Preserve approval, tool, retrieval, memory, multi-agent, safety, and release boundaries.

## Deployment Layout

This package is intended to be installed into a Gemini CLI workspace as:

```text
<project>/GEMINI.md
<project>/.gemini/ENGINEERING_CONVENTION.md
<project>/.gemini/skills/*/SKILL.md
<project>/.gemini/GEMINI_RUNTIME_GUIDE.md
<project>/.gemini/validation/*
```

Do not rely on a source package layout such as `gemini/skills/*/SKILL.md` as evidence that Gemini CLI automatic skill discovery works.

## Native Gemini API

Use `native_gemini_api` by default.

Required mapping discipline:
- system behavior -> `systemInstruction`
- conversation state -> `contents` with role-scoped `parts`
- callable tools -> `functionDeclarations`
- function-calling control -> `functionCallingConfig`
- structured machine output -> structured output schema plus local validation
- request-level safety controls -> `safetySettings`

Do not treat source alignment, schema shape, dry-run mapping, or static validation as live provider execution.

## OpenAI Compatibility

Use `openai_compatibility` only when explicitly required.

Rules:
- label compatibility work as compatibility work
- preserve Gemini-native differences in the risk boundary
- never use compatibility behavior as native Gemini conformance evidence

## Skill Routing

- `coding-core`: bounded code execution, bug fixes, debugging, refactoring, tests, review, and code-adjacent documentation.
- `design-analysis`: architecture decisions, trade-offs, migration strategy, and implementation planning.
- `eval-ops`: evaluation design, regression review, benchmark comparison, drift, readiness, and claim boundaries.
- `grounded-research`: official-source synthesis, citations, freshness checks, and document investigation.
- `orchestration-control`: multi-agent topology, handoff contracts, lifecycle coordination, capability fit, and join quality.
- `harness-creator-adapter`: Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, and artifact-map work.

Routing rules:
- use the skill that owns the current blocking decision
- hand off explicitly when the work changes type
- keep the six-skill interface stable
- record a follow-up instead of creating a new skill during fixed-scope maintenance

## Verification

After Gemini runtime changes, run the project-local validation command if available.

Allowed local proof class:
- `local_static_runtime_validation`

Blocked without executed evidence:
- `credentialed_canary_executed`
- `provider_verified`
- `adapter_checked`
- `release_gated`
- `production_ready`
