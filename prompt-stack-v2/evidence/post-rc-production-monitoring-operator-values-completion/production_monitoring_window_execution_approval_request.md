# Production Monitoring Window Execution Approval Request

Stage requesting approval:
v2.0.0-post-rc-production-monitoring-window-execution

Required approval phrase:
I explicitly approve v2.0.0-post-rc-production-monitoring-window-execution

What will execute after approval:
- monitoring window collection/review
- Langfuse trace receipt continuity check
- redaction/secret violation check
- missing trace / error / latency threshold evaluation
- incident/rollback readiness review

What will not execute:
- OpenAI model API call
- local endpoint probe
- local model execution
- production deployment
- stable release

Passing this stage may support production monitoring window evidence, but does not automatically allow:
- production-ready
- stable
- provider-diverse
- local-model-verified
