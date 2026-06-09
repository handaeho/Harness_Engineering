# Local Model Verification Execution Plan

Stage: v2.0.0-post-stable-local-model-verification-gate-design

## Required Surfaces

- Multi-model no-tool comparison
- Structured-output smoke canary
- Tool-calling mock smoke canary
- Replay/regression smoke
- Redaction/storage cross-suite audit
- Local redteam coverage
- Adapter conformance dependency-backed validation
- Owner final decision before any strong local verification claim

## Autopilot Boundary

Autopilot may run structured-output smoke, tool-calling mock smoke, replay/regression smoke, and redaction/storage audit for `qwen3:14b` and `qwen3.6:27b`.

Autopilot must stop before enabling any strong local verification claim.
