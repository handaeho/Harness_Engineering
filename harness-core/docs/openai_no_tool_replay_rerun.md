# OpenAI No-Tool Replay Rerun

The no-tool replay rerun uses:

```text
node harness-core/tools/run_openai_provider_canary.mjs --attempt-id=004-no-tool-replay-rerun
node harness-core/tools/compare_openai_no_tool_replay_attempts.mjs
```

It compares `003-credentialed-rerun` against `004-no-tool-replay-rerun`.
Response text exact equality is not required. The comparison checks the case
set, expected containment pass state, no-tool request surface, redaction, raw
response storage policy, and required trace event coverage.
