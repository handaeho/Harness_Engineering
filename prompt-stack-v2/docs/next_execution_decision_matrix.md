# Next Execution Decision Matrix

- If exact OpenAI redteam approval phrase is present and operator PowerShell env will be verified at execution time, next candidate is `v2.0.0-beta-openai-redteam-limited-execution`; can start now: false.
- If exact telemetry approval phrase and one supported sink credential set are present, next candidate is `v2.0.0-beta-production-telemetry-connection`; can start now: false.
- If localhost-only vLLM or Ollama endpoint and required env are available, next candidate is `v2.0.0-beta-local-no-tool-canary`; can start now: false.
- If provider diversity, local runtime, redteam execution, telemetry connection, production readiness, rollback plan, and owner-action blockers are resolved, next candidate is `release gate execution`; can start now: false.
