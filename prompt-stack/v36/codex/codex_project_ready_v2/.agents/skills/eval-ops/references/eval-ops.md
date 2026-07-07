# Codex Evaluation Operations Reference

Use this reference only after `eval-ops` activates and Codex behavior or claims must be judged.

## Evidence Classes

- Instruction discovery evidence: Codex output showing active `AGENTS.md` sources.
- Skill discovery evidence: Codex output showing available skill names and paths.
- Command evidence: exact command, environment, exit status, and relevant output.
- Test evidence: exact test runner, scope, result, and skipped checks.
- CI evidence: pipeline identifier, commit, result, and relevant failing/passing jobs.

## Verdict

Use:
- `pass` when evidence satisfies the gate
- `fail` when evidence contradicts the gate
- `hold` when evidence is incomplete but not blocked
- `blocked` when required evidence cannot be collected in the current authority or environment

Downgrade static validation to local static proof.
Do not use `provider_verified`, `release_gated`, `production_ready`, or live canary language without matching executed evidence.
