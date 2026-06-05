# OpenAI Canary Replay Suite

Stage: `v2.0.0-beta-openai-canary-replay-suite`

This suite groups the restricted OpenAI canary surfaces that already exist:

- no-tool text canary
- structured output canary
- function/tool calling canary with deterministic mock tools only

The suite reruns no-tool and structured-output canaries under the same existing
scopes, then includes the existing tool-calling rerun comparison evidence. It is
canary-suite evidence only. It does not allow `replay-verified`,
`provider-diverse`, `adapter-checked`, `tool-call-verified`,
`schema-output-verified`, `integration-verified`, or `release-gated`.
