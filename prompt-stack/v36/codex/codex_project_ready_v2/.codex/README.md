# .codex Directory

This directory stores project-local Codex auxiliary assets.

It intentionally does not contain skills. Repository skills are stored in:

```text
<project>/.agents/skills/*/SKILL.md
```

For coding, refactoring, tests, API contracts, data contracts, and Java/Python implementation work, also apply:

```text
<project>/.codex/ENGINEERING_CONVENTION.md
```

Use `.codex/config.toml` only when you intentionally want project-local Codex configuration and the project is trusted.

Static validation does not prove live Codex loading, provider execution, release readiness, or production readiness.
