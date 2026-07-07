# Codex Project Ready Manifest

## Install Layout

```text
<project>/AGENTS.md
<project>/.agents/skills/*/SKILL.md
<project>/.codex/CODEX_RUNTIME_GUIDE.md
<project>/.codex/validation/*
```

## Runtime Notes

- `AGENTS.md` is the project instruction entrypoint.
- `.agents/skills` is the repository skill discovery path.
- `.codex` contains auxiliary Codex runtime notes and validation fixtures.
- No live Codex execution is implied by this package.

## Suggested Verification

Run from the project root:

```text
codex --ask-for-approval never "Summarize the current instructions."
codex --ask-for-approval never "List available skills and their sources."
```
