---
name: eval-ops
description: Use for Codex-aware evaluation and operational quality control when the user asks whether prompts, workflows, patches, regression results, benchmark runs, command output, CI evidence, drift signals, or release/readiness claims satisfy a quality bar. Do not use for ordinary code patches, pure research, architecture design, harness asset creation, or subagent topology.
---

# Evaluation Operations Instructions

## Activation

Activate when the task asks whether behavior, prompts, workflows, candidates, patches, or operational signals satisfy an explicit quality bar.
Do not activate for ordinary code patches, source research, architecture decisions, harness creation, or subagent topology.

## Procedure

Use:

`Define Gate -> Inspect Evidence -> Compare -> Downgrade Unsupported Claims -> Verdict`

1. Define the decision, gate owner, acceptance threshold, and stop conditions.
2. Inspect executed evidence, not planned assets.
3. Separate document completeness, static validation, command execution, test results, CI results, provider verification, release gates, and production monitoring.
4. Downgrade unsupported claims before reporting.
5. Return pass, fail, hold, or blocked with the next required evidence.

For proof classes, command/test evidence, readiness criteria, and blocked claim language, read `references/eval-ops.md` when evaluating Codex readiness or repository claims.

## Codex Proof Classes

- `local_static_runtime_validation`: files and static checks passed.
- `repo_layout_created`: expected files were created in the repository layout.
- `codex_instruction_loaded`: Codex reported loading the intended instruction file.
- `skill_discovery_confirmed`: Codex reported discovering the intended skills.
- `commands_executed`: commands ran in the target environment.
- `tests_passed`: relevant tests passed in the target environment.
- `ci_verified`: CI or build pipeline passed.
- `release_gated`: an explicit release gate passed.
- `production_ready`: production criteria and monitoring evidence are present.

## Evaluation Rules

- Static file presence does not prove Codex loaded the files.
- A successful command proves only that exact command in that exact environment.
- A passing unit test does not prove untested integration behavior.
- Do not promote static layout checks to live runtime proof.
