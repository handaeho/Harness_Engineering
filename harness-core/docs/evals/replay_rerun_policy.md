# Replay Rerun Policy

Canary rerun evidence is weaker than replay verification.

This stage may say that a restricted OpenAI tool-calling canary was rerun and
compared against a prior pass attempt. It must not say `replay-verified`.

Rules:

- Same restricted case set pass is not broad replay coverage.
- Deterministic mock tool rerun is not external tool reliability.
- Redacted trace captured is not telemetry connected.
- Rerun evidence recorded is not release-gated.
- Provider diversity remains blocked because only OpenAI is exercised.
