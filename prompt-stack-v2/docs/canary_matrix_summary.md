# Canary Matrix Summary

Stage: `v2.0.0-beta-canary-matrix-summary-and-local-readiness`

This stage summarizes existing OpenAI canary evidence only. It does not call a
provider, probe a local endpoint, run a local model, or start a server.

## Current Matrix

| Target | No-tool path | Structured output path | Tool-calling path | Claim level |
| --- | --- | --- | --- | --- |
| OpenAI | `canary_checked` | `canary_checked` | `canary_checked` | `canary_only` |
| vLLM | `blocked_by_missing_endpoint` | `not_executed` | `not_executed` | `not_executed` |
| Ollama | `blocked_by_missing_endpoint` | `not_executed` | `not_executed` | `not_executed` |

## Claim Boundary

OpenAI no-tool, structured output, and tool-calling canary pass evidence does
not allow `provider-verified`, `provider-diverse`, `adapter-checked`,
`tool-call-verified`, `schema-output-verified`, `replay-verified`, or
`release-gated`.
