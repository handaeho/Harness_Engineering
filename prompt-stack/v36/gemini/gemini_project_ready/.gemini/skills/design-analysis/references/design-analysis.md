# Gemini Design Analysis Reference

Use this reference only after `design-analysis` activates and a Gemini-aware technical route must be chosen.

## Decision Packet

- State whether the target is `native_gemini_api` or `openai_compatibility`.
- Name the API surface: system instruction, content parts, function calling, structured output, safety settings, CLI skill layout, or provider canary.
- Identify schema owner, tool execution owner, validation path, retry policy, fallback trigger, and claim boundary.

## Native Gemini Defaults

- Prefer native Gemini request semantics for Gemini-specific behavior.
- Keep project guardrails separate from request-level `safetySettings`.
- Keep function declaration, function-call response, tool approval, local execution, redaction, and reinjection responsibilities explicit.
- Keep compatibility evidence separate from native conformance.

## Handoff

- Hand code changes to `coding-core`.
- Hand source freshness questions to `grounded-research`.
- Hand provider/readiness verdicts to `eval-ops`.
