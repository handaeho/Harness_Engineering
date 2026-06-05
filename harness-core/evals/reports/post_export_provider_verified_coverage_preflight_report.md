# Post Export Provider-Verified Coverage Preflight Report

Status: blocked_by_missing_provider_coverage

- Stage: v2.0.0-post-export-provider-verified-coverage-completion-preflight
- Provider-diverse allowed: true
- Local-model-verified allowed: true
- Provider-verified allowed: false
- Can enter provider-verified final gate: false
- Missing or partial coverage: 8
- OpenAI: contract/execution/canary/redteam/redaction evidence exists; error handling and provider-level regression coverage remain partial.
- Ollama: local-model/redteam/replay smoke/structured smoke/tool mock evidence exists; provider-level error handling and final-gate coverage remain partial.
