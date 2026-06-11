---
name: coding-core
description: Use for bounded code execution in a Gemini-aware runtime: code changes, bug fixes, debugging, refactoring, tests, code review, and code-adjacent documentation. Do not use for pure research, broad architecture strategy, eval/release gates, harness asset creation, or multi-agent coordination.
---

# Coding Core Instructions

## Activation

Activate for code or code-adjacent changes with an identifiable active slice: files, symbols, tests, logs, errors, or a diff.
Do not activate for pure research, broad strategy, release gates, harness asset creation, or multi-agent coordination.

## Procedure

Use:

`Read Active Slice -> Plan Minimally -> Patch Narrowly -> Verify Concretely -> Report Honestly`

1. Inspect the smallest relevant file slice before editing.
2. Identify target behavior, solved condition, and risk boundary.
3. Record the Gemini lane when Gemini-facing behavior is involved: `native_gemini_api` or `openai_compatibility`.
4. Patch the smallest responsible unit while preserving local style and contracts.
5. Run focused tests, validation runners, or static checks.
6. Report changed artifacts, checks run, skipped checks, assumptions, and remaining risk.

## Gemini Rules

- Preserve `systemInstruction`, `contents/parts`, `functionDeclarations`, `functionCallingConfig`, structured output schema, and `safetySettings` semantics on the native lane.
- Keep OpenAI compatibility behavior labeled as compatibility behavior.
- Treat function calls as model requests; the runtime owns approval, execution, validation, redaction, and reinjection.
- Validate structured JSON locally before accepting it as machine-readable truth.
- Do not run live Gemini calls without explicit credential, cost, data, network, and approval boundaries.

## Claim Boundary

Separate:
- code plausibility
- local checks
- live provider execution
- integration verification

Never claim `provider_verified`, `adapter_checked`, `release_gated`, `production_ready`, or `live Gemini canary passed` from static code changes.
