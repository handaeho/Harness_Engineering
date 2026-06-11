# Gemini Provider Canary Gate Report

Status: pass

Stage: v2.0.0-gemini-runtime-dry-run-provider-canary-gate

- API lane: native_gemini_api
- Can enter provider-verified claim: false
- Can enter adapter-checked claim: false
- Can enter release-gated claim: false
- Reason: Gemini live text canary and local dry-run checks passed, but stronger release claims remain blocked.

## Checks

- pass: run_gemini_provider_canary.mjs pass or explicit blocked status
- pass: local dry-run status pass
- pass: request/response mapping pass
- pass: structured output local schema validation pass
- pass: tool calling dry-run pass
- pass: safety fixture pass
- pass: redaction report pass
- pass: provider trace samples exist
- pass: no local model execution
- pass: no external side effects
- pass: forbidden claims are not allowed
- pass: unresolved items match live provider block state

## Claim Boundary

- Allowed now: gemini-provider-canary-executed, gemini-provider-trace-captured
- Blocked: provider-verified, adapter-checked, release-gated, production-ready, live Gemini canary passed
