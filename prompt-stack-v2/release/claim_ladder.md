# Claim Ladder

## Alpha Claims

- `harness-designed`: core spec and policy skeletons exist.
- `static-structure-created`: alpha files exist and static checks pass.
- `baseline-snapshotted`: v36 inventory and checksums exist.
- `adapter-skeleton-created`: OpenAI, vLLM, and Ollama adapter skeletons exist.
- `alpha-static-validated`: alpha static validator, prohibited claim scan, and baseline comparison pass.
- `dependency-static-validated`: YAML parsing uses the `yaml` package and JSON Schema validation uses Ajv without fallback.
- `adapter-dry-run-checked`: adapter fixtures and mapping logic passed dry-run checks without provider or local execution.
- `beta-preflight-prepared`: dependency validation, prohibited claim scan, baseline comparison, adapter dry-run, and beta entry gate are reproducible.
- `beta-mock-runtime-executed`: mock-only runtime harness executed deterministic fixtures and produced trace/evidence without provider or local execution.
- `mock-tool-routing-checked`: deterministic mock tool routing passed without real tool calls.
- `approval-boundary-smoke-tested`: blocked mock tools were denied before execution.
- `trace-schema-smoke-tested`: mock trace events validated against the local trace schema.
- `schema-contract-validated`: mock run request, result, trace, and state schemas validated for deterministic fixtures.
- `openai-provider-canary-executed`: OpenAI provider no-tool text-only canary call executed and produced redacted trace/evidence.
- `provider-no-tool-path-checked`: OpenAI Responses API text-only request/response path passed a canary without tools.
- `provider-trace-captured`: provider canary trace was captured in redacted form.
- `provider-redaction-checked`: provider canary request/response evidence passed redaction checks.
- `openai-structured-output-canary-executed`: OpenAI provider structured output canary executed through the Responses API `text.format` JSON Schema path and produced Ajv-validated, redacted evidence.
- `provider-structured-output-path-checked`: OpenAI Responses API structured output request/response path passed a no-tool canary.
- `json-schema-response-canary-validated`: structured output canary responses were parsed and validated against their case JSON Schemas with Ajv.
- `structured-output-trace-captured`: structured output canary trace was captured in redacted form.
- `structured-output-redaction-checked`: structured output canary evidence passed redaction checks.
- `openai-tool-calling-canary-executed`: OpenAI provider function/tool calling canary executed with deterministic mock tools only.
- `provider-tool-call-path-checked`: OpenAI Responses API function tool request/response path passed a canary.
- `tool-argument-schema-canary-validated`: model-generated tool arguments passed Ajv validation in canary cases.
- `mock-tool-output-reinjection-checked`: deterministic mock tool output was reinjected as `function_call_output` in canary cases.
- `tool-approval-boundary-canary-checked`: approval gate blocked non-allowlisted tool execution in canary cases.
- `tool-output-reclassification-checked`: mock tool output was reclassified as `untrusted_tool_output`.
- `tool-calling-trace-captured`: tool-calling canary trace was captured in redacted form.
- `tool-calling-redaction-checked`: tool-calling canary evidence passed redaction checks.
- `canary-matrix-summarized`: existing OpenAI provider canary evidence was summarized into a matrix without new provider/local execution.
- `local-readiness-documented`: local vLLM/Ollama readiness requirements and missing endpoint blockers are documented.
- `local-endpoint-blocker-recorded`: missing local vLLM/Ollama endpoints are recorded as blockers rather than failures.
- `openai-tool-calling-canary-rerun-executed`: existing OpenAI tool-calling canary was rerun under the same restricted mock-tool scope and compared against the prior pass attempt.
- `tool-calling-canary-consistency-checked`: restricted OpenAI tool-calling canary rerun matched the prior attempt's case, schema, safety, and redaction boundaries.
- `tool-calling-rerun-trace-captured`: rerun trace was captured in redacted form.
- `replay-evidence-recorded`: canary rerun evidence was recorded, without granting replay verification.
- `beta-release-evidence-bundle-drafted`: existing beta evidence was indexed into a release evidence draft without executing a release gate.
- `evidence-lineage-indexed`: evidence lineage was summarized from v36 baseline through beta evidence bundle draft.
- `claim-boundary-audited`: claim boundaries were audited against evidence, capability matrix, and release gate records.
- `release-readiness-draft-assessed`: release readiness was assessed as draft-only without production or release gate claims.
- `blocker-register-updated`: local runtime, provider diversity, telemetry, release gate, and redteam blockers were recorded.
- `release-gate-thresholds-drafted`: release gate thresholds were drafted without executing a real release gate.
- `release-gate-dry-run-executed`: release gate thresholds were evaluated against existing beta evidence and resulted in blocked_not_release_gated.
- `release-blockers-prioritized`: release blockers were assigned P0/P1 priorities with exit criteria.
- `owner-action-matrix-drafted`: blocker owner/action matrix was drafted.
- `rollback-plan-drafted`: rollback plan was drafted for release gate dry-run failures and claim downgrades.
- `release-decision-record-drafted`: release decision record was drafted with a do-not-release-gate decision.

## Upgrade Rule

Evidence is required before claim elevation. A document, schema, runner, or
adapter skeleton existing is not enough to claim execution quality.

Hardening rules:
- Fixture exists is not test passed.
- Parser sanity passed is not runtime verified.
- Adapter skeleton exists is not adapter checked.
- Trace schema exists is not telemetry connected.
- Checksum snapshot exists is not containment proof.
- One provider design exists is not provider diversity.
- Local validation record exists is not release gate approval.
- `production-monitored` is never allowed without live telemetry evidence.
- Dry-run mapping pass is not provider execution pass.
- Dependency-backed static validation is not runtime execution.
- Ajv schema validation is not model output schema reliability.
- YAML parser pass is not semantic correctness.
- Beta entry preflight pass is not beta execution approval.
- Mock runtime execution is not real provider execution.
- Mock tool routing is not real tool calling verified.
- Schema contract validation is not model schema-output verified.
- Trace schema smoke test is not live telemetry connected.
- Approval boundary smoke test is not containment proof.
- Beta mock gate pass is not provider execution approval.
- Provider canary pass is not adapter checked.
- No-tool text path pass is not tool calling verified.
- Provider trace captured is not telemetry connected.
- One provider canary is not provider diversity.
- One canary run is not replay verified.
- OpenAI canary pass is not local model compatibility.
- Store false canary is not production privacy review.
- Credentialed OpenAI canary pass is not adapter checked.
- One OpenAI no-tool path pass is not provider verified.
- No structured output used is not schema output verified.
- One credentialed run is not replay verified.
- Structured output canary pass is not schema-output verified.
- Ajv validation on canary cases is not broad schema reliability.
- No-tool structured output pass is not tool calling verified.
- One provider structured output canary is not provider diversity.
- One credentialed structured output run is not replay verified.
- OpenAI structured output canary pass is not local model compatibility.
- Redacted trace captured is not telemetry connected.
- Tool calling canary pass is not tool-call verified.
- Deterministic mock tool pass is not external tool reliability.
- Approval boundary canary is not containment proof.
- Function call output reinjection pass is not integration verified.
- One provider tool path pass is not provider diversity.
- One credentialed tool canary run is not replay verified.
- OpenAI tool canary pass is not local model compatibility.
- OpenAI no-tool plus structured plus tool canary pass is not provider verified.
- OpenAI canary coverage is not provider diversity.
- Local readiness documented is not local model executed.
- Missing local endpoint must be recorded as blocker, not failure.
- Local blocked state cannot grant local-no-tool-canary-executed.
- Canary matrix summary is not replay verification.
- Canary rerun pass is not replay-verified.
- Same restricted case set pass is not broad replay coverage.
- OpenAI tool-calling rerun is not provider diversity.
- Deterministic mock tool rerun is not external tool reliability.
- Redacted trace captured in a rerun is not telemetry connected.
- Rerun evidence recorded is not release-gated.
- Evidence bundle draft is not release-gated.
- Canary replay suite is not replay-verified.
- OpenAI-only evidence is not provider diversity.
- Local blocker documented is not local model executed.
- Claim boundary audit pass is not production readiness.
- Release readiness draft is not release gate pass.
- Checksum bundle is not containment proof.
- Redacted trace evidence is not production telemetry.
- Release gate dry-run is not release-gated.
- Threshold coverage summary is not threshold pass.
- Blocker priority assigned is not blocker resolved.
- Rollback plan draft is not rollback plan finalized.
- Owner/action matrix draft is not operational readiness.
- Beta evidence bundle pass is not production readiness.

## Adapter Dry-run Claim

`adapter-dry-run-checked` means adapter fixture loading and mapping checks passed without provider API calls, local model calls, runtime orchestration, actual tool calls, replay, or telemetry.

It allows:
- adapter dry-run readiness statement

It does not allow:
- `adapter-checked`
- `integration-verified`
- `provider-diverse`
- `replay-verified`
- `production-monitored`

## Beta Mock Runtime Claim

`beta-mock-runtime-executed` means the mock-only runtime harness executed deterministic fixtures and produced trace/evidence without provider API calls, local model calls, external network calls, real tool side effects, replay, or live telemetry.

It allows:
- mock runtime readiness statement
- approval boundary smoke-tested statement
- trace schema smoke-tested statement

It does not allow:
- `runtime-verified`
- `tool-call-verified`
- `schema-output-verified`
- `provider-verified`
- `adapter-checked`
- `integration-verified`
- `provider-diverse`
- `replay-verified`
- `production-monitored`
- `release-gated`

## OpenAI Provider Canary Claim

`openai-provider-canary-executed` means an OpenAI provider no-tool text-only canary call executed and produced redacted trace/evidence.

It allows:
- OpenAI provider canary execution statement
- no-tool request/response mapping smoke statement
- provider trace captured statement

It does not allow:
- `adapter-checked`
- `provider-verified`
- `tool-call-verified`
- `schema-output-verified`
- `integration-verified`
- `provider-diverse`
- `replay-verified`
- `production-monitored`
- `release-gated`

## OpenAI Structured Output Canary Claim

`openai-structured-output-canary-executed` means an OpenAI provider structured output canary executed through the Responses API `text.format` JSON Schema path and produced Ajv-validated, redacted evidence.

It allows:
- OpenAI structured output canary execution statement
- JSON Schema response canary validation statement
- structured output trace captured statement

It does not allow:
- `schema-output-verified`
- `tool-call-verified`
- `provider-verified`
- `adapter-checked`
- `integration-verified`
- `provider-diverse`
- `replay-verified`
- `production-monitored`
- `release-gated`

## OpenAI Tool Calling Canary Claim

`openai-tool-calling-canary-executed` means an OpenAI provider function/tool calling canary executed through the Responses API with deterministic mock tools only, Ajv-validated tool arguments, approval boundary checks, untrusted tool output reclassification, and redacted evidence.

It allows:
- OpenAI tool calling canary execution statement
- function tool request/response path canary statement
- mock tool output reinjection canary statement
- tool argument schema canary validation statement
- approval boundary canary statement

It does not allow:
- `tool-call-verified`
- `provider-verified`
- `adapter-checked`
- `integration-verified`
- `provider-diverse`
- `replay-verified`
- `production-monitored`
- `release-gated`

## Canary Matrix Summary Claim

`canary-matrix-summarized` means existing OpenAI provider canary evidence was summarized into a matrix without new provider API calls, local endpoint probes, local model execution, replay, redteam, or telemetry.

It allows:
- current canary coverage summary
- explicit blocked local readiness statement
- local endpoint blocker statement

It does not allow:
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- `local-no-tool-canary-executed`
- `vllm-no-tool-canary-executed`
- `ollama-no-tool-canary-executed`
- `replay-verified`
- `integration-verified`
- `release-gated`

## OpenAI Tool Calling Canary Rerun Claim

`openai-tool-calling-canary-rerun-executed` means the existing OpenAI tool-calling canary was rerun under the same restricted mock-tool scope and compared against the prior pass attempt.

It allows:
- canary rerun evidence statement
- consistency check statement for the restricted OpenAI tool-calling canary
- replay evidence recorded statement

It does not allow:
- `replay-verified`
- `tool-call-verified`
- `provider-verified`
- `adapter-checked`
- `provider-diverse`
- `integration-verified`
- `release-gated`
- `production-monitored`

## OpenAI Canary Replay Suite Claim

`openai-canary-replay-suite-executed` means OpenAI no-tool, structured output, and tool-calling canaries have canary-level rerun or rerun-comparison evidence under restricted scopes.

It allows:
- OpenAI canary replay suite evidence statement
- canary suite consistency statement
- canary-level replay evidence recorded statement

It does not allow:
- `replay-verified`
- `tool-call-verified`
- `schema-output-verified`
- `provider-verified`
- `adapter-checked`
- `provider-diverse`
- `integration-verified`
- `release-gated`
- `production-monitored`

Additional rules:
- canary replay suite pass is not `replay-verified`
- canary replay evidence is not broad regression coverage
- OpenAI-only replay suite is not provider diversity
- restricted canary pass is not adapter checked
- structured output rerun is not `schema-output-verified`
- tool-calling rerun is not `tool-call-verified`
- redacted trace captured is not telemetry connected
- suite summary is not release-gated

## Beta Release Evidence Bundle Draft Claim

`beta-release-evidence-bundle-drafted` means existing beta evidence was indexed, claim boundaries were audited, blockers were recorded, and release readiness was assessed as draft-only without executing a release gate.

It allows:
- beta evidence bundle draft statement
- evidence lineage indexed statement
- claim boundary audit statement
- blocker register updated statement

It does not allow:
- `release-gated`
- `production-ready`
- `production-monitored`
- `replay-verified`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- `integration-verified`

Additional rules:
- evidence bundle draft is not `release-gated`
- canary replay suite is not `replay-verified`
- OpenAI-only evidence is not provider diversity
- local blocker documented is not local model executed
- claim boundary audit pass is not production readiness
- release readiness draft is not release gate pass
- checksum bundle is not containment proof
- redacted trace evidence is not production telemetry

## Release Gate Dry-run Claim

`release-gate-dry-run-executed` means release gate thresholds were drafted and evaluated against existing beta evidence, resulting in blocked_not_release_gated status.

It allows:
- release gate dry-run statement
- release blocker priority statement
- owner/action matrix draft statement
- rollback plan draft statement

It does not allow:
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `replay-verified`
- `provider-verified`
- `adapter-checked`
- `integration-verified`

Additional rules:
- release gate dry-run is not `release-gated`
- threshold coverage summary is not threshold pass
- blocker priority assigned is not blocker resolved
- rollback plan draft is not rollback plan finalized
- owner/action matrix draft is not operational readiness
- OpenAI canary suite pass is not provider diversity
- beta evidence bundle pass is not production readiness

## Redteam Suite Design Claim

`redteam-suite-designed` means redteam taxonomy, fixtures, severity rubric, mappings, and execution gate were designed without executing redteam cases.

It allows:
- redteam suite design statement
- redteam fixture authored statement
- redteam taxonomy mapped statement
- redteam execution gate designed statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- redteam fixtures authored is not `redteam-executed`
- redteam suite designed is not `redteam-passed`
- severity rubric drafted is not `containment-verified`
- OWASP/NIST/MITRE mapping is not security certification
- redteam execution gate designed is not release gate passed
- blocker updated is not blocker resolved

## Redteam Mock Runtime Dry-run Claim

`redteam-mock-dry-run-executed` means redteam fixtures were run through deterministic mock runtime only, validating result schema, severity aggregation, trace capture, and safety-boundary handling without provider/local execution.

It allows:
- mock redteam dry-run statement
- redteam fixture execution path checked statement
- redteam result schema validated statement
- severity aggregation checked statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- mock redteam dry-run is not live redteam execution
- mock runtime safety pass is not `containment-verified`
- fixture execution path checked is not `redteam-passed`
- severity aggregation pass is not `release-gated`
- provider/local redteam remains pending

## OpenAI Redteam Limited Execution Plan Claim

`openai-redteam-limited-execution-plan-drafted` means a limited OpenAI provider redteam execution plan, case subset, execution guard, cost bound, stop criteria, redaction policy, and trace policy were drafted without executing provider redteam cases.

It allows:
- OpenAI limited redteam execution plan statement
- selected case subset statement
- provider redteam guard designed statement
- cost/stop/redaction/trace policy drafted statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- provider redteam plan is not provider redteam execution
- case subset selected is not `redteam-passed`
- execution guard designed is not `containment-verified`
- cost bound drafted is not production readiness
- redaction policy drafted is not production telemetry
- execution readiness is not `release-gated`

## OpenAI Redteam Limited Execution Preflight Claim

`openai-redteam-limited-execution-preflight-completed` means preflight validation, approval packet, credential readiness check, selected case subset validation, and command plan were prepared for limited OpenAI redteam execution without executing provider calls.

It allows:
- limited redteam execution preflight statement
- approval packet generated statement
- credential readiness checked statement
- command plan drafted statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- execution preflight is not redteam execution
- approval packet generated is not approval granted
- credential readiness checked is not provider execution
- command plan drafted is not command executed
- selected case subset ready is not `redteam-passed`
- preflight pass is not `containment-verified`

## Production Telemetry Design Claim

`production-telemetry-design-drafted` means production telemetry schema, event taxonomy, metric catalog, OTel mapping, Langfuse integration plan, dashboard spec, anomaly thresholds, and telemetry claim gate were drafted without live telemetry connection.

It allows:
- production telemetry design statement
- OTel GenAI mapping drafted statement
- Langfuse integration plan drafted statement
- telemetry dashboard/anomaly threshold draft statement

It does not allow:
- `telemetry-connected`
- `production-monitored`
- `production-ready`
- `release-gated`

Additional rules:
- telemetry design is not telemetry connected
- OTel mapping drafted is not live export
- Langfuse integration plan is not Langfuse API connected
- dashboard spec drafted is not dashboard available
- anomaly thresholds drafted is not thresholds active
- telemetry blocker updated is not blocker resolved

## Later Claims

- `runner-executed`: relevant runner executed and result is recorded.
- `replay-verified`: replay was rerun with lineage and verdict.
- `integration-verified`: provider/runtime/tool/retrieval path was exercised.
- `release-gated`: explicit threshold, owner, rollback path, and gate pass exist.
- `production-monitored`: live telemetry and anomaly response are connected.

## Blocked in Alpha

The alpha package must not describe itself as having later-claim evidence unless
the corresponding evidence artifact exists.
