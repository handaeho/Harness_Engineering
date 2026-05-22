# Blocker Resolution Plan

Stage: v2.0.0-beta-execution-readiness-dashboard-and-blocker-resolution-plan

## BRP-001

- Lane: openai_limited_redteam_execution
- Priority: P0
- Blocker: missing_explicit_user_approval
- Credential note: n/a
- Owner: human
- Next action: Provide exact approval phrase.
- Exit criteria: User message contains exact required approval phrase.
- Evidence needed: approval_gate updated, provider redteam execution report

## BRP-002

- Lane: openai_limited_redteam_execution
- Priority: P0
- Blocker: missing_explicit_user_approval
- Credential note: OPENAI_API_KEY and OPENAI_MODEL are not present in the agent environment, but the user can provide them in a separate PowerShell execution environment.
- Owner: human
- Next action: Provide exact approval phrase, then run the approved command plan from a PowerShell session with OPENAI_API_KEY and OPENAI_MODEL set.
- Exit criteria: PowerShell execution report shows OPENAI_API_KEY and OPENAI_MODEL present without logging secret values, and provider redteam limited execution completes under approved scope.
- Evidence needed: credential readiness report, redaction report, openai limited redteam execution report

## BRP-003

- Lane: production_telemetry_connection
- Priority: P1
- Blocker: missing_telemetry_connection_approval
- Credential note: n/a
- Owner: human
- Next action: Provide exact telemetry approval phrase.
- Exit criteria: User message contains exact required telemetry approval phrase.
- Evidence needed: telemetry approval gate update, telemetry connection report

## BRP-004

- Lane: production_telemetry_connection
- Priority: P1
- Blocker: missing_telemetry_sink_credentials
- Credential note: n/a
- Owner: human
- Next action: Provide either OTEL or Langfuse env vars.
- Exit criteria: Credential readiness report shows configured sink credentials present.
- Evidence needed: credential readiness report, live trace receipt, live metric receipt

## BRP-005

- Lane: local_no_tool_canary
- Priority: P0
- Blocker: missing_local_endpoint
- Credential note: n/a
- Owner: human
- Next action: Start localhost-only vLLM or Ollama endpoint and provide required env.
- Exit criteria: Local no-tool canary passes for at least one target.
- Evidence needed: local canary report, local trace samples, local redaction report

## BRP-006

- Lane: release_gate
- Priority: P0
- Blocker: release_gate_eligibility_blocked
- Credential note: n/a
- Owner: human_or_agent
- Next action: Resolve provider diversity, local runtime, redteam execution, telemetry connection, production readiness, and finalized rollback/owner-action blockers.
- Exit criteria: Release gate dry-run inputs and final gate thresholds all pass with required evidence.
- Evidence needed: provider diversity evidence, redteam execution evidence, telemetry connection evidence, final rollback plan, release gate report

