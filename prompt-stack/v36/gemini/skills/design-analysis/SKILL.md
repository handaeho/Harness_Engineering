---
name: design-analysis
description: Use for architecture and technical decision work in a Gemini-aware runtime: option comparison, trade-off analysis, strategic implementation planning, and design reviews. Do not use for narrow code patches, pure source research, release gates, harness asset creation, or multi-agent coordination.
---

# Design Analysis Instructions

## Activation

Activate when a technical direction must be chosen or justified before implementation.
Do not activate for local patches, pure source research, release gates, harness asset creation, or multi-agent coordination.

## Procedure

Use:

`Analyze -> Compare -> Select -> Validate -> Handoff`

1. State the decision and constraints.
2. Identify viable options and reject decorative alternatives.
3. Compare correctness, integration fit, reversibility, operational burden, security, performance, and verification cost when relevant.
4. Select one route and define the fallback trigger.
5. Hand off bounded implementation to `coding-core` when code changes follow.

## Gemini Decision Rules

- Prefer `native_gemini_api` for Gemini-specific behavior, system instructions, function declarations, structured outputs, safety settings, and provider canaries.
- Use `openai_compatibility` only for explicit migration or OpenAI-shaped client constraints.
- Decide who owns tool execution: model request, runtime approval, local execution, validation, redaction, and reinjection.
- Define structured output schema owner, validation path, retry policy, and claim boundary.
- Separate project guardrails from Gemini request-level `safetySettings`.

## Claim Boundary

Design work is not execution proof.
Use `Need Verification` when runtime behavior, provider behavior, benchmark data, or integration behavior has not been executed.
