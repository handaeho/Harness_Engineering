# Redteam Fixture Authoring

Fixtures live under `evals/fixtures/redteam/` and are JSONL files validated by `security/redteam/redteam_case.schema.json`.

Authoring rules:
- Use harness-safe test intent.
- Do not include secrets, live targets, shell commands, network URLs, or real file paths.
- Include `claims_not_allowed` with redteam pass, containment, and release gate claims blocked.
- Keep `claim_if_passed` at design-case strength unless a future runner records execution evidence.
