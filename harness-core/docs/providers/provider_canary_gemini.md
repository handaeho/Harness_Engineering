# Gemini Provider Canary

Stage: `v2.0.0-gemini-runtime-dry-run-provider-canary`

This stage prepares the native Gemini API provider lane for HARNESS Core.
It is not a prompt-stack coding-agent asset and it is not a Gemini CLI skill.

The canary includes:
- no-tool native `models.generateContent` request/response mapping
- structured output mapping with local Ajv validation
- function calling mapping with JSON Schema argument validation
- deterministic mock tool execution and `functionResponse` reinjection dry-run
- safety blocked-response fixture handling
- redacted trace and evidence reports

Separate live stages are available for:
- no-tool text provider canary
- structured output provider canary
- tool-calling provider canary with deterministic mock tools only

Current recorded evidence:
- no-tool text provider canary: pass
- structured output provider canary: pass
- tool-calling provider canary: pass

Tool-calling reinjection note:
- Gemini function-calling responses can include a model-side `thoughtSignature` on the returned `functionCall` part.
- The runner preserves that signature in memory and reinjects it on the final `functionResponse` request.
- Evidence records only presence/counts for this field; raw request bodies, raw responses, and raw thought signatures are not stored.

Required environment for live text canary:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_PROVIDER_CANARY_ENABLE_LIVE=1`
- `GEMINI_PROVIDER_CANARY_NETWORK_APPROVAL=1` after the separate network approval boundary is approved

Preflight before any live text canary:

```powershell
node harness-core/tools/checks/providers/check_gemini_live_canary_preflight.mjs
```

The preflight records whether credential/model/live-enable inputs are present,
whether a separate network approval boundary is recorded, and whether raw
request/response storage and redaction controls remain in force. It performs no
network call.

Structured output note:
- current target shape: `generationConfig.responseJsonSchema`
- required freshness sources before changing request shape:
  - `https://ai.google.dev/api/generate-content`
  - `https://ai.google.dev/gemini-api/docs/structured-output`
- live text canary does not validate live structured output or live tool calling.

Without those variables and approval marker, the runner records
`blocked_by_missing_credential`, `blocked_by_missing_model`,
`blocked_by_live_execution_not_enabled`, or
`blocked_by_network_approval_missing` and still executes the local dry-run
checks.

Run from the workspace root:

```powershell
node harness-core/tools/runners/providers/run_gemini_provider_canary.mjs
node harness-core/tools/checks/providers/check_provider_canary_gemini.mjs
node harness-core/tools/runners/providers/run_gemini_structured_output_canary.mjs
node harness-core/tools/checks/providers/check_gemini_structured_output_canary.mjs
node harness-core/tools/runners/providers/run_gemini_tool_calling_canary.mjs
node harness-core/tools/checks/providers/check_gemini_tool_calling_canary.mjs
node harness-core/tools/checks/providers/check_gemini_runtime_asset_pack.mjs
```

Or from `harness-core/`:

```powershell
npm run gemini-canary-gate
npm run gemini-full-provider-canary-gate
```

Passing the local dry-run allows only Gemini dry-run claims. Passing the live
text canary additionally allows `gemini-provider-canary-executed` and
`gemini-provider-trace-captured`. Passing the separate structured-output and
tool-calling live stages adds only their stage-specific canary claims.

It still does not allow `provider-verified`, `adapter-checked`,
`tool-call-verified`, `schema-output-verified`, `integration-verified`,
`production-ready`, or `release-gated` claims.
