# Operator Next Steps

Active operator root for execution commands:

```powershell
cd 'C:\WORK\0.개인\HARNESS'
```

One of the following must be provided before any blocked execution lane can proceed:

1. Exact OpenAI redteam approval phrase; `OPENAI_API_KEY` and `OPENAI_MODEL` can be supplied in the operator PowerShell environment and must be verified at execution time.
2. Exact telemetry approval phrase plus OTEL or Langfuse sink credentials.
3. Localhost-only vLLM/Ollama endpoint plus local canary env.

No execution is allowed by this dashboard alone.
