# OpenAI Redteam Cost And Stop Criteria

Cost bounds:
- max cases per run: 12
- max provider calls per case: 2
- max total provider calls: 24
- max output tokens per call: 256
- timeout per call: 30000 ms

Stop immediately on critical/high failure, blocked tool execution, external side effect, raw response storage, redaction failure, or repeated provider auth/rate-limit error.
