# Threat Model

Alpha threat model scope:
- Prompt injection.
- Indirect prompt injection.
- Tool poisoning.
- Data leakage.
- Excessive agency.
- Approval boundary bypass.
- Supply-chain drift in adapter dependencies.

Controls expected in later phases:
- Tool allow/deny policy.
- Approval gate.
- Tool-output reclassification as untrusted input.
- Redteam cases.
- Trace-linked safety events.

This alpha only creates the threat model placeholder and does not claim
containment proof.

## Beta Redteam Design Update

`v2.0.0-beta-redteam-suite-design` maps the existing threat model into a
design-only redteam suite. The suite covers prompt injection, indirect prompt
injection, system prompt leakage, sensitive information disclosure, excessive
agency, approval boundary bypass, tool poisoning, tool output trust abuse,
structured output abuse, schema boundary abuse, retrieval context poisoning,
refusal boundary handling, unbounded consumption, and canary surface regression.

The design maps internal categories to OWASP GenAI/LLM risks, NIST GenAI
Profile functions, and MITRE ATLAS tactics. It creates fixtures, a severity
rubric, pass/fail policy, and an execution gate, but it does not execute
redteam cases and does not claim containment proof.

## Beta Redteam Mock Runtime Dry-run Update

`v2.0.0-beta-redteam-mock-runtime-dry-run` routes mock-compatible redteam
fixtures through a deterministic mock runtime. Provider-only, local-only, and
future RAG cases are recorded as `skipped_not_mock_compatible`.

This dry-run validates the fixture execution path, result schema, severity
aggregation, trace capture, approval boundary, tool output trust boundary, and
structured/schema boundaries in mock mode only. It does not perform live model
redteam execution and does not claim redteam pass, containment, production
readiness, or release gate status.

## OpenAI Limited Redteam Plan Update

`v2.0.0-beta-openai-redteam-limited-execution-plan` selects a high-signal,
low-risk subset for a future OpenAI provider redteam run. The subset is capped
at 12 cases and covers prompt injection, system prompt leakage, sensitive
information disclosure, refusal boundary, structured/schema boundary, tool
output trust boundary, and canary regression probes.

The stage drafts execution guard, cost bounds, stop criteria, redaction policy,
and trace policy. It does not execute provider calls and does not claim redteam
execution, redteam pass, containment, production readiness, provider
verification, or release gate status.

## Containment Boundary Verification Design Update

`v2.0.0-beta-containment-boundary-verification-design` separates containment
into approval, tool execution, external side effect, file write, shell
execution, network, raw storage, trace redaction, and tool output trust
boundaries.

The stage authors design-only containment fixtures and result/trace schemas for
a future mock containment dry-run. Existing mock runtime, OpenAI canary, limited
redteam, and additional redteam evidence is treated as smoke or observed
evidence only. It does not execute containment verification and does not claim
containment proof, redteam pass, production readiness, or release gate status.

## Containment Boundary Mock Dry-run Update

`v2.0.0-beta-containment-boundary-mock-dry-run` executes the containment
fixtures in a deterministic mock runtime only. It validates result schema, trace
schema, severity aggregation, action blocking, raw storage prevention,
redaction, and no-side-effect counters without provider calls, local model
calls, telemetry sink writes, external network calls, shell execution, or real
tool side effects.

This mock dry-run strengthens execution-path evidence, but it remains mock-only
and does not claim containment proof, redteam pass, production readiness, or
release gate status.
