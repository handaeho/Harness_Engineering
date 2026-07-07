# Codex Project-Ready Package Notes

## Source

This package was created as a Codex-oriented counterpart to `gemini_project_ready.zip`.
Gemini-specific runtime language was adapted into Codex-native project instruction language.

## Key Adaptations

- `GEMINI.md` entrypoint replaced with root `AGENTS.md`.
- `.gemini/skills` replaced with `.agents/skills` for repository-scoped Codex skill discovery.
- `.codex` retained only for Codex auxiliary runtime material and validation fixtures.
- Gemini API fields such as `systemInstruction`, `contents/parts`, `functionDeclarations`, `functionCallingConfig`, and `safetySettings` were removed from the core Codex runtime contract.
- OpenAI/Codex evidence classes and repository mutation rules were preserved.

## Non-goals

- This package does not claim that Codex has executed or loaded the files.
- This package does not configure model, sandbox, approval, MCP, hooks, or permissions.
- This package does not include `.codex/skills` because repository skills are placed under `.agents/skills`.

## Expected Runtime Check

Run from the repository root:

```text
codex --ask-for-approval never "Summarize the current instructions and list available skills."
```
