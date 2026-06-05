# Local Tool-calling Mock Smoke Canary

Status: pass

- Stage: v2.0.0-post-stable-local-tool-calling-mock-smoke-canary
- Models: qwen3:14b, qwen3.6:27b
- New local generation calls: 2
- Cases passed: 2/2
- External tool executed: false
- Raw request stored: false
- Raw response stored: false
- Redaction passed: true

## Claim Boundary

- Allows after pass: post-stable-local-tool-calling-mock-smoke-canary-completed, post-stable-local-tool-calling-mock-schema-checked, post-stable-local-tool-calling-mock-redaction-checked
- Still blocked: local-model-verified, provider-diverse, provider-verified, adapter-checked, tool-call-verified, production-ready, stable, release-gated
