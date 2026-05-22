# Provider Canary Attempts

OpenAI provider canary attempts are preserved under:

```text
evidence/beta-provider-canary-openai/attempts/
```

Attempt layout:
- `001-blocked-missing-credential`: preserves the original blocked result before the credentialed-run stage.
- `002-credentialed-run`: preserves the latest credentialed-run attempt, whether pass, fail, or blocked.
- `003-credentialed-rerun`: preserves the credentialed rerun attempt, whether pass, fail, or blocked.

The top-level files under `evidence/beta-provider-canary-openai/` remain the latest result. Historical attempts must not be overwritten.

API keys, authorization headers, raw secret-bearing requests, and full raw provider responses are not archived.
