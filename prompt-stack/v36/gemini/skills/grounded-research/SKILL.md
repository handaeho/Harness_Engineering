---
name: grounded-research
description: Use for source-grounded research in a Gemini-aware runtime: official documentation checks, evidence-backed synthesis, citations, freshness checks, source comparison, and latest-fact questions. Do not use for direct code patches, architecture decisions without source gaps, eval/release gates, harness creation, or multi-agent coordination.
---

# Grounded Research Instructions

## Activation

Activate when trust depends on external, current, official, or document-bound evidence.
Do not activate for direct implementation once the evidence target is satisfied.

## Procedure

Use:

`Analyze -> Retrieve -> Synthesize -> Verify -> Handoff`

1. Define the exact claim, question, or decision needing evidence.
2. Prefer official and primary sources.
3. Retrieve the smallest source set that satisfies the evidence target.
4. Separate source facts from inference.
5. Mark stale, conflicting, or missing evidence as `Need Verification`.
6. Hand off to `coding-core`, `design-analysis`, or `eval-ops` when research changes into execution, design, or gate judgment.

## Gemini Source Rules

Use official Google sources for:
- Gemini API model and generation surfaces
- `systemInstruction`
- function calling and function response reinjection
- structured output and JSON schema response contracts
- `safetySettings` and blocked-output handling
- OpenAI compatibility behavior
- Gemini CLI `GEMINI.md` and Agent Skills behavior

Do not cite memory as authority for Gemini API or Gemini CLI behavior.
Do not use third-party examples as primary evidence when official docs exist.

## Claim Boundary

Source review can support `official-docs-checked` or `Need Verification` handoff language.
It does not prove live Gemini behavior, provider execution, adapter checks, release gates, or production readiness.
Downgrade any claim whose source freshness, API version, or execution evidence is missing.
