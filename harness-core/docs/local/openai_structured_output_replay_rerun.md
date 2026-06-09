# OpenAI Structured Output Replay Rerun

The structured output replay rerun uses:

```text
node harness-core/tools/runners/openai/run_openai_structured_output_canary.mjs --attempt-id=002-structured-output-replay-rerun
node harness-core/tools/comparisons/openai/compare_openai_structured_output_replay_attempts.mjs
```

It compares `001-structured-output-canary` against
`002-structured-output-replay-rerun`. Exact JSON value equality is not required.
The comparison checks schema validation, strict JSON Schema use, no-tool request
surface, redaction, raw response storage policy, and trace event coverage.
