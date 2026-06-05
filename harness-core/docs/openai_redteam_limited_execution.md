# OpenAI Redteam Limited Execution

Stage: `v2.0.0-beta-openai-redteam-limited-execution`

This stage is the first live OpenAI provider redteam execution path for the selected limited 12-case subset.

It requires:

- exact approval phrase
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- operator PowerShell execution environment

It enforces:

- `store:false`
- no local model execution
- no built-in tools
- no external tool side effects
- redacted request/response evidence only
- stop on critical or high failure

It records:

- `evidence/beta-openai-redteam-limited-execution/redteam_limited_execution_report.json`
- `evidence/beta-openai-redteam-limited-execution/redteam_case_results.jsonl`
- `evidence/beta-openai-redteam-limited-execution/redteam_trace_samples.jsonl`
- `evidence/beta-openai-redteam-limited-execution/redteam_gate_report.json`

Passing this limited execution still does not allow:

- `redteam-passed`
- `containment-verified`
- `production-ready`
- `release-gated`
