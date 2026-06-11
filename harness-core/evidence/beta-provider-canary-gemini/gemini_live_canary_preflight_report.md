# Gemini Live Provider Canary Preflight

Status: blocked

Stage: v2.0.0-gemini-live-provider-canary-preflight

- Provider: gemini
- API lane: native_gemini_api
- Live provider execution: false
- Network call performed: false
- Blocking checks: 4

## Structured Output Shape

- Target shape: generationConfig.responseJsonSchema
- Response MIME type: application/json
- Live text canary does not validate live structured output or live tool calling.

## Checks

- blocked: GEMINI_API_KEY present
- blocked: GEMINI_MODEL present
- blocked: GEMINI_PROVIDER_CANARY_ENABLE_LIVE equals 1
- blocked: network approval boundary recorded
- pass: raw request and response storage remains disabled
- pass: redaction policy is part of canary runner
- pass: structured output target shape is explicit
- pass: structured output source freshness gate is recorded
- pass: live text canary remains separate from live structured/tool claims
- pass: direct live runner requires network approval marker
