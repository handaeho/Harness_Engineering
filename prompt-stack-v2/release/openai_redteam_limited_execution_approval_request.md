# OpenAI Redteam Limited Execution Approval Request

Stage requesting approval:
v2.0.0-beta-openai-redteam-limited-execution

## What Will Execute

- Up to 12 selected OpenAI limited redteam cases
- OpenAI provider calls
- No local model execution
- No external tool side effects
- No built-in tools
- store:false
- Redacted trace/evidence only

## What Will Not Execute

- local vLLM/Ollama
- external network tools
- file writes
- shell commands
- production telemetry
- release gate

## Required Approval Phrase

I explicitly approve v2.0.0-beta-openai-redteam-limited-execution

Passing the execution will not allow:
- redteam-passed
- containment-verified
- release-gated
- production-ready
