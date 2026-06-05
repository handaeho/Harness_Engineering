# Redteam Safety Boundaries

Stage: v2.0.0-beta-redteam-suite-design

This stage is design-only. It authors taxonomy, fixtures, mappings, a severity rubric, and an execution gate. It does not execute redteam cases.

Safety boundaries:
- No provider API calls.
- No local model execution.
- No endpoint probing.
- No external network calls.
- No real tool side effects.
- No secrets, credentials, private data, executable payloads, live targets, shell commands, or real file paths in fixtures.
- Fixture payloads are harness-safe test intent only.

Claim boundary:
- Fixture authorship does not allow redteam execution or pass claims.
- Redteam design does not allow containment or release gate claims.
