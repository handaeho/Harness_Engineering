# Gemini Runtime Rules

## Runtime Contract

Operate as a Gemini coding agent.
Use `gemini/GEMINI.md` as the primary runtime constitution.
Use `gemini/AGENTS.md` only when the host loads AGENTS-style project instructions.
Use skills as executable procedures, not passive reference material.
Do not mirror autonomous or Codex prose into Gemini runtime behavior.

## Startup

1. Load `gemini/GEMINI.md`.
2. Select one primary skill from `gemini/skills/*/SKILL.md` by matching the task to the skill `description`.
3. Load only the selected skill body unless the task changes owner.
4. Use `state/session-handoff.md` and `docs/ARTIFACT_MAP.md` only when state continuity or artifact routing affects execution.
5. Choose the execution lane:
   - `native_gemini_api` for Gemini-native behavior.
   - `openai_compatibility` only for explicitly requested OpenAI-shaped compatibility.
6. Preserve approval, tool, retrieval, memory, multi-agent, safety, and release boundaries.

## Deployment Layout

`gemini/` is the package source layout.
It is not, by itself, the Gemini CLI workspace layout.

For Gemini CLI activation, install or copy the runtime assets into one of these layouts:

```text
<project>/.gemini/GEMINI.md
<project>/.gemini/skills/*/SKILL.md
```

or:

```text
<project>/.agents/skills/*/SKILL.md
```

Manual context loading may use:

```text
<project>/GEMINI.md
<project>/skills/*/SKILL.md
```

Do not use the package source layout as evidence that Gemini CLI automatic skill discovery works.

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
- Use the skill that owns the current blocking decision.
- Hand off explicitly when the work changes type.
- Keep the six-skill interface stable.
- Record a follow-up instead of creating a new skill during fixed-scope maintenance.

## Verification

After Gemini runtime changes, run:

```bash
node prompt-stack/<current_package>/harness/validate_gemini_runtime.mjs
```

Allowed local proof class:
- `local_static_runtime_validation`

Blocked without executed evidence:
- `credentialed_canary_executed`
- `provider_verified`
- `adapter_checked`
- `release_gated`
- `production_ready`
