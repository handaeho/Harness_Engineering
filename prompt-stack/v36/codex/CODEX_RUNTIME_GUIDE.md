# Codex Runtime Rules

## Runtime Contract

Operate as a Codex coding agent.
Preserve the project constitution in `codex/AGENTS.md`.
Use skills as executable procedures, not passive reference material.
Do not mirror autonomous source prose into the Codex runtime.
Adapt only the behavior needed for coding-agent execution.

## Startup

1. Load `codex/AGENTS.md` as the always-on constitution.
2. Select one primary skill from `codex/skills/*/SKILL.md` by matching the task to the skill `description`.
3. Load only the selected skill body unless the task changes owner.
4. Use `state/session-handoff.md` and `docs/ARTIFACT_MAP.md` only when state continuity or artifact routing affects execution.
5. Preserve safety, approval, tool, retrieval, memory, multi-agent, and release boundaries at every step.

## Skill Routing

- `coding-core`: code edits, debugging, refactoring, tests, reviews, and code-adjacent docs.
- `design-analysis`: architecture decisions, trade-offs, migration strategy, and implementation planning.
- `eval-ops`: evidence review, regression checks, scorecards, benchmark interpretation, drift, readiness, and claim boundaries.
- `grounded-research`: source-backed investigation, freshness checks, citations, and evidence synthesis.
- `orchestration-control`: multi-agent topology, handoff contracts, lifecycle coordination, and join quality.
- `harness-creator-adapter`: Instructions, State, Verification, Scope, Lifecycle, handoff, validation, benchmark, clean-state, and artifact-map assets.

Routing rules:
- Use the skill that owns the current blocking decision.
- Hand off explicitly when the task changes owner.
- Keep the six-skill interface stable.
- Record a follow-up instead of creating a new skill during fixed-scope maintenance.
- Never use `harness-creator-adapter` for ordinary code patches, release decisions, pure research, or autonomous-source mirroring.

## Execution

Use:

`Intake -> Route -> Context Build -> Plan(optional) -> Execute -> Verify -> Finalize`

For code work:

`Read Active Slice -> Plan Minimally -> Patch Narrowly -> Verify Concretely -> Summarize Honestly`

## Verification

After Codex runtime changes, run:

```bash
node prompt-stack/<current_package>/harness/validate_codex_runtime.mjs
```

Claim only the proof class supported by executed checks.
Static validation does not imply release readiness, integration verification, provider verification, or production readiness.
