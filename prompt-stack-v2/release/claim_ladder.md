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
- `telemetry-connected` is not `production-monitored`.
- `telemetry-connected` is not `production-ready`.
- `telemetry-connected` is not `stable`.
- `telemetry-connected` does not establish provider diversity.
- `telemetry-connected` does not verify local model execution.
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

## OpenAI Redteam Limited Execution Claim

`openai-redteam-limited-execution-completed` means the approved limited OpenAI provider redteam subset was executed with redacted evidence, store:false, bounded provider calls, no local model execution, no external side effects, and critical/high failure counts recorded as zero for that limited subset.

It allows:
- limited OpenAI redteam execution completed statement
- limited case result evidence recorded statement
- limited redacted trace evidence recorded statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-verified`
- `provider-diverse`

Additional rules:
- limited provider subset execution is not full redteam execution
- zero critical/high failures in the limited subset is not `redteam-passed`
- redacted traces recorded is not `containment-verified`
- OpenAI-only execution is not provider diversity
- limited execution pass is not `release-gated`

## OpenAI Redteam Limited Result Review Claim

`openai-redteam-limited-result-reviewed` means the limited OpenAI redteam execution result was reviewed and indexed, with canonical claim boundaries and blocker updates recorded.

It allows:
- limited redteam result review statement
- limited execution evidence indexed statement
- claim boundary audit statement
- blocker update statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- limited result reviewed is not `redteam-passed`
- 12/12 limited cases pass is not broad redteam coverage
- zero critical/high failures in selected subset is not containment proof
- blocker updated is not release gate passed
- evidence mirrored is not source-of-truth promotion unless indexed

## Broader Redteam Pass Gate Design Claim

`broader-redteam-pass-gate-designed` means broader redteam pass criteria, coverage matrix, remaining gaps, thresholds, and claim boundaries were designed without additional execution.

It allows:
- broader redteam pass gate design statement
- redteam coverage matrix draft statement
- redteam gap analysis statement
- redteam pass threshold draft statement

It does not allow:
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- broader pass gate designed is not `redteam-passed`
- coverage matrix drafted is not coverage complete
- gap analysis recorded is not gap resolved
- thresholds drafted is not thresholds satisfied
- limited execution pass is not containment proof
- skipped case review pending means `redteam-passed` remains blocked

## Skipped Redteam Case Review Claim

`skipped-redteam-cases-reviewed` means redteam cases skipped from mock runtime dry-run were reviewed and classified into future execution or coverage lanes without new execution.

It allows:
- skipped case review statement
- lane classification statement
- future execution lane draft statement
- skipped case blocker update statement

It does not allow:
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- skipped case review is not `redteam-passed`
- lane classification is not case execution
- future execution lane drafted is not gap resolved
- duplicate/covered classification requires evidence reference
- local lane remains blocked until local no-tool canary passes

## Additional OpenAI Redteam Preflight Claim

`additional-openai-redteam-preflight-completed` means additional OpenAI provider
redteam cases identified from skipped-case review were prepared for execution,
with approval gate, command plan, cost/stop/redaction/trace policies, and
preflight checks completed without provider execution.

It allows:
- additional OpenAI redteam preflight statement
- additional case subset selected statement
- approval packet generated statement
- command plan drafted statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`

Additional rules:
- additional provider redteam preflight is not execution
- case subset selected is not case passed
- approval packet generated is not approval granted
- command plan drafted is not command executed
- additional provider execution remains blocked until exact approval phrase

## Additional OpenAI Redteam Execution Claim

`additional-openai-redteam-execution-completed` means the 4 additional OpenAI
provider-compatible redteam cases selected from skipped-case review were
executed under the approved additional execution stage, with redacted evidence,
case results, severity summary, stop criteria, and claim impact recorded.

It allows:
- additional OpenAI provider redteam execution statement
- additional case results recorded statement
- additional redacted trace recorded statement
- additional execution severity summary statement

It does not allow:
- `redteam-executed`
- `redteam-passed`
- `containment-verified`
- `release-gated`
- `production-ready`
- `provider-verified`

Additional rules:
- additional execution pass is not generic redteam pass
- 4/4 additional cases pass is not containment proof
- zero critical/high failures in this subset is not release-gated
- OpenAI-only execution remains not provider-diverse
- additional execution evidence does not resolve local runtime or telemetry blockers

## Containment Boundary Verification Design Claim

`containment-boundary-verification-designed` means containment boundary taxonomy, fixtures, policies, coverage matrix, claim boundary, and verification gate were designed without executing dedicated containment verification.

It allows:
- containment boundary verification design statement
- containment fixture authored statement
- containment coverage matrix draft statement
- containment verification gate designed statement

It does not allow:
- `containment-verified`
- `redteam-passed`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- containment design is not `containment-verified`
- smoke-tested boundary is not containment proof
- fixture authored is not fixture executed
- coverage matrix drafted is not coverage complete
- blocker updated is not blocker resolved

## Containment Boundary Mock Dry-run Claim

`containment-boundary-mock-dry-run-executed` means containment boundary fixtures were executed in deterministic mock containment runtime, validating result/trace schema, severity aggregation, no-side-effect boundaries, and redaction without provider/local/telemetry execution.

It allows:
- containment mock dry-run statement
- containment fixture execution path checked statement
- no-side-effect boundary checked statement
- result/trace schema validation statement

It does not allow:
- `containment-verified`
- `redteam-passed`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- containment mock dry-run is not `containment-verified`
- no-side-effect mock evidence is not production containment proof
- blocked action simulated is not real sandbox proof
- result schema validated is not release gate passed
- blocker updated is not blocker resolved

## Containment Verification Gate Refinement Claim

`containment-verification-gate-refined` means containment evidence was mapped to boundaries and proof levels, and the containment verification gate was refined without additional execution.

It allows:
- containment verification gate refinement statement
- containment evidence mapping statement
- proof level classification statement
- remaining criteria recorded statement

It does not allow:
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- gate refined is not containment verified
- proof levels classified is not proof completed
- evidence mapped is not evidence sufficient
- no boundary may be marked verified in this stage
- cross-suite audit remains required

## Cross-suite Storage Redaction Audit Claim

`cross-suite-storage-redaction-audit-executed` means existing cross-suite artifacts were scanned for raw request/response storage, secret/auth leakage, and redaction boundary violations without new execution.

It allows:
- cross-suite storage/redaction audit statement
- raw storage audit passed statement
- secret pattern audit passed statement
- allowed preview/hash/summary classification statement

It does not allow:
- `containment-verified`
- `telemetry-connected`
- `production-monitored`
- `production-ready`
- `release-gated`

Additional rules:
- storage/redaction audit pass is not containment verified
- no secret findings is not telemetry connected
- allowed preview/hash classification is not production monitoring
- audit pass resolves one criterion only, not full containment proof

## Dedicated Containment Verification Plan Claim

`dedicated-containment-verification-plan-drafted` means dedicated containment verification plan, runner contract, acceptance criteria, failure policy, risk acceptance policy, approval gate, and command plan were drafted without executing verification.

It allows:
- dedicated containment verification plan statement
- runner contract drafted statement
- acceptance criteria drafted statement
- verification gate designed statement

It does not allow:
- `containment-verified`
- `production-ready`
- `release-gated`
- `production-monitored`

Additional rules:
- dedicated plan is not dedicated execution
- acceptance criteria drafted is not criteria satisfied
- command plan drafted is not command executed
- risk acceptance policy drafted is not risk accepted
- execution pass would still require post-execution claim audit

## Dedicated Containment Verification Execution Claim

`dedicated-containment-verification-executed` means the approved dedicated containment verification runner executed containment fixtures in mock containment dedicated verification mode, recorded case results, redacted traces, no-side-effect evidence, schema validation, and severity aggregation.

It allows:
- dedicated containment verification execution statement
- dedicated containment case results recorded statement
- dedicated containment redacted traces recorded statement
- dedicated containment no-side-effect evidence recorded statement

It does not allow:
- `containment-verified`
- `production-ready`
- `release-gated`
- `production-monitored`

Additional rules:
- dedicated containment execution pass is not `containment-verified`
- no-side-effect evidence is not release gate approval
- post-execution claim audit remains required
- release owner review remains required

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

## Production Telemetry Connection Preflight Claim

`production-telemetry-connection-preflight-completed` means telemetry connection preflight, approval packet, credential readiness check, payload shape validation, exporter guard, and command plan were prepared without live telemetry connection.

It allows:
- telemetry connection preflight statement
- credential readiness checked statement
- OTel/Langfuse payload shape validated statement
- telemetry connection command plan drafted statement

It does not allow:
- `telemetry-connected`
- `production-monitored`
- `production-ready`
- `release-gated`
- `integration-verified`

Additional rules:
- connection preflight is not telemetry connected
- payload shape validation is not live telemetry received
- credential readiness checked is not sink write
- command plan drafted is not command executed
- approval packet generated is not approval granted
- telemetry blocker updated is not blocker resolved

## Post-RC Telemetry Connected Claim

`telemetry-connected` means the post-RC telemetry sink connection succeeded with live trace receipt and secret/raw payload redaction checks.

It allows:
- telemetry-connected claim
- telemetry connection receipt statement
- live trace receipt statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`

Additional rules:
- `telemetry-connected` is not `production-monitored`
- `telemetry-connected` is not `production-ready`
- `telemetry-connected` is not `stable`
- `telemetry-connected` does not establish provider diversity
- `telemetry-connected` does not verify local model
- metric/event receipt absence does not allow production monitoring when the scoped gate records Langfuse trace receipt only

## Post-RC Telemetry Connection Result Review Claim

`post-rc-telemetry-connection-result-reviewed` means the passed post-RC Langfuse telemetry connection result was reviewed, receipt evidence was indexed, and secret/raw payload redaction evidence was checked without additional telemetry sink writes, OpenAI model API calls, local endpoint probes, or local model execution.

It allows:
- telemetry connection result review statement
- Langfuse receipt evidence index statement
- telemetry-connected claim boundary statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- result review is not production monitoring
- receipt indexing is not a monitoring window
- no-secret/no-raw-payload review is not incident response readiness
- telemetry-connected remains narrower than production readiness

## Post-RC Production Monitoring Readiness Claim

`post-rc-production-monitoring-readiness-assessed` means production monitoring readiness was evaluated after telemetry-connected evidence, and the result remained `blocked_not_production_monitored` because required monitoring controls and a monitoring window are missing.

It allows:
- production monitoring readiness assessment statement
- production monitoring blocker recorded statement
- remaining monitoring controls statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- production monitoring readiness assessment is not production monitoring
- blocker recorded is not blocker resolved
- local endpoint remains deferred until operator endpoint readiness
- provider diversity is not required for this readiness assessment, but remains a separate blocked claim

## Post-RC Production Monitoring Controls Design Claim

`post-rc-production-monitoring-controls-drafted` means dashboard, alerting, anomaly threshold, monitoring window, incident response, rollback linkage, retention, and production monitoring gate design artifacts exist without executing production monitoring.

It allows:
- production monitoring controls drafted statement
- production monitoring gate designed statement
- production monitoring claim boundary audited statement
- production monitoring blocker updated statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- controls drafted is not live monitoring
- gate designed is not gate executed
- monitoring window policy drafted is not monitoring window completed
- alerting policy drafted is not live alerts enabled
- rollback linkage drafted is not live rollback monitoring tested
- operator-defined values and owners remain pending before production-monitored

## Post-RC Production Monitoring Values Preflight Claim

`post-rc-production-monitoring-values-preflight-completed` means operator-defined production monitoring value templates, draft defaults, owner assignment templates, monitoring window preconditions, and a later-stage command plan are recorded without executing the monitoring window.

It allows:
- production monitoring values preflight statement
- recommended defaults drafted statement
- owner assignment template drafted statement
- monitoring window preconditions drafted statement
- monitoring window command plan drafted statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- values preflight is not live monitoring
- recommended defaults are not approved operator values
- owner assignment template is not owner assignment
- command plan drafted is not command execution
- monitoring window preconditions drafted is not monitoring window completed
- production monitoring final gate remains required before production-monitored
- local endpoint remains deferred until operator provides endpoint readiness

## Post-RC Production Monitoring Operator Values Completion Claim

`post-rc-production-monitoring-operator-values-completed` means operator-provided dashboard, alerting, threshold, monitoring window, retention, and owner values are recorded and the monitoring window can execute only after the required explicit approval phrase.

It allows:
- operator values completion statement
- threshold values recorded statement
- owner assignments recorded statement
- monitoring window execution preconditions satisfied statement
- monitoring window approval request generated statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- operator values complete is not monitoring window execution
- monitoring window can execute after approval is not monitoring window completed
- approval request generated is not approval granted
- threshold values recorded is not threshold pass evidence
- owner assignment recorded is not incident response exercise evidence
- production monitoring final gate remains required before production-monitored

## Post-RC Production Monitoring Window Execution Claim

`post-rc-production-monitoring-window-executed` means the approved production monitoring window evidence review was executed against Langfuse trace continuity, thresholds, redaction/secret handling, and incident/rollback readiness without OpenAI model API calls, local endpoint probes, local model execution, production deployment, or a production-monitored claim.

It allows:
- monitoring window execution evidence statement
- trace continuity review statement
- threshold evaluation statement
- redaction/secret review statement
- incident/rollback readiness review statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- monitoring window executed is not monitoring window completed when duration or sample count is insufficient
- incomplete monitoring window evidence is not `production-monitored`
- threshold values evaluated against insufficient samples do not establish production monitoring
- incident/rollback readiness review is not live rollback monitoring tested
- production monitoring final gate remains required before production-monitored

## Post-RC Production Monitoring Window Continuation Checkpoint Claim

`post-rc-production-monitoring-window-checkpoint-recorded` means the monitoring window continuation state was checkpointed from existing window execution evidence without synthetic traces, manual sample count changes, manual duration changes, telemetry sink writes, provider calls, local endpoint probes, local model execution, production deployment, or production monitoring claims.

It allows:
- monitoring window checkpoint statement
- monitoring window progress evaluated statement
- remaining duration and sample requirements statement
- redaction checkpoint statement

It does not allow:
- `production-monitored`
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- checkpoint recorded is not monitoring window completed
- remaining requirements recorded is not requirement satisfaction
- clean redaction checkpoint is not production monitoring
- result review remains required after duration and sample count are met
- production monitoring final gate remains required before production-monitored

## Execution Readiness Dashboard Claim

`execution-readiness-dashboard-drafted` means current blocked execution lanes, approval requirements, environment requirements, command plans, blocker resolution paths, and claim impacts were indexed without executing provider/local/telemetry actions.

It allows:
- execution readiness dashboard statement
- blocker resolution plan statement
- approval/environment requirements indexed statement
- path portability audit statement

It does not allow:
- `redteam-executed`
- `telemetry-connected`
- `local-model-verified`
- `provider-diverse`
- `production-monitored`
- `production-ready`
- `release-gated`

Additional rules:
- readiness dashboard is not execution approval
- approval phrase indexed is not approval granted
- env requirements indexed is not credentials present
- command plan indexed is not command executed
- blocker resolution plan is not blocker resolved
- path portability audit is not `release-gated`

## Containment Post-execution Audit Claim

`containment-post-execution-audit-completed` means dedicated containment verification results were reviewed, evidence completeness was audited, claim boundaries were checked, and owner review/decision draft was prepared without granting `containment-verified`.

It allows:
- containment post-execution audit statement
- containment evidence completeness audit statement
- containment owner review draft statement
- containment claim decision draft statement

It does not allow:
- `containment-verified`
- `release-gated`
- `production-ready`
- `production-monitored`

Additional rules:
- post-execution audit is not `containment-verified`
- owner review draft is not owner approval
- claim decision draft is not claim decision
- proof level update may not mark any boundary verified in this stage
- final containment decision gate remains required


## Containment Verified Decision Gate Claim

`containment-verified-decision-gate-executed` means final containment decision gate evaluated evidence sufficiency, owner decision, claim boundary, and release-gate impact without new execution.

It allows:
- containment decision gate execution statement
- containment evidence sufficiency audit statement
- owner final decision recorded statement
- claim boundary audit statement

It does not allow:
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`

Conditional claim rule:

`containment-verified` is allowed only if:
- evidence_sufficiency_audit_passed == true
- owner_final_decision == approve_containment_verified
- release_gated_allowed == false
- production_ready_allowed == false

It does not allow:
- `release-gated`
- `production-ready`
- `production-monitored`


## Release Blocker Reevaluation Claim

`release-blockers-reevaluated` means release blockers were reevaluated after `containment-verified` was allowed for beta scope, and rc.1 readiness paths were assessed without executing release gate.

It allows:
- release blocker reevaluation statement
- rc.1 readiness assessment statement
- OpenAI-only rc.1 candidate path statement

It does not allow:
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

Additional rules:
- blocker reevaluation is not `release-gated`
- OpenAI-only rc.1 candidate is not `provider-diverse`
- `containment-verified` is not `production-ready`
- can_enter_openai_only_rc1_bundle is not stable release


## RC1 OpenAI Scope Evidence Bundle Claim

`rc1-openai-scope-evidence-bundle-drafted` means an OpenAI-only rc.1 evidence bundle was drafted from existing validated evidence without new execution.

It allows:
- OpenAI-only rc.1 evidence bundle statement
- rc.1 evidence lineage indexed statement
- rc.1 claim boundary audit statement
- OpenAI-only scope declaration

It does not allow:
- `stable`
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

Additional rules:
- rc.1 evidence bundle is not stable release
- OpenAI-only rc.1 is not `provider-diverse`
- rc.1 readiness is not `release-gated`
- `containment-verified` is not `production-ready`
- no new execution in rc.1 bundle stage


## AGENTS.md System of Record Alignment Claim

`agents-md-root-entrypoint-added` means root `AGENTS.md` was added as the agent-facing System of Record index and aligned with `stack.yaml`, asset class manifest, directory roles, naming conventions, and agent workflow documentation.

It allows:
- AGENTS.md root entrypoint statement
- System of Record alignment statement
- asset class manifest statement
- directory role documentation statement

It does not allow:
- `stable`
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

Additional rules:
- AGENTS.md is an index, not a hard policy engine.
- AGENTS.md alignment does not replace machine-readable gates.
- asset class manifest does not grant release claims.
- System of Record alignment does not imply stable or release-gated.


## RC1 OpenAI-scope Release Gate Dry-run Claim

`rc1-release-gate-dry-run-executed` means OpenAI-only rc.1 release gate dry-run evaluated current evidence and deferred local/provider-diversity lanes without actual release gate execution.

It allows:
- OpenAI-only release gate dry-run statement
- local endpoint deferred statement
- provider diversity deferred statement
- release gate actual preconditions drafted statement

It does not allow:
- `stable`
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

Additional rules:
- release gate dry-run is not actual release gate execution
- local endpoint deferred is not `local-model-verified`
- provider diversity deferred is not `provider-diverse`
- OpenAI-only dry-run is not stable
- OpenAI-only dry-run can lead to actual gate preflight, not release-gated claim directly


## RC1 OpenAI-scope Actual Release Gate Preflight Claim

`rc1-release-gate-actual-preflight-completed` means actual OpenAI-only rc.1 release gate preflight was completed, with approval packet, command plan, rollback readiness, owner/action readiness, and local/provider-diversity deferrals recorded, without executing the release gate.

It allows:
- actual release gate preflight statement
- release approval packet generated statement
- release command plan drafted statement
- rollback readiness checked statement
- owner/action readiness checked statement

It does not allow:
- `stable`
- `release-gated`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`

Additional rules:
- actual release gate preflight is not actual release gate execution
- approval packet generated is not approval granted
- command plan drafted is not command executed
- OpenAI-only actual gate preflight is not stable
- local endpoint deferred remains deferred until operator provides endpoint


## RC1 OpenAI-scope Actual Release Gate Claim

`rc1-openai-scope-release-gated` means OpenAI-only RC1 actual release gate passed using existing evidence, with local endpoint and provider diversity explicitly deferred.

It allows:
- OpenAI-only RC1 release-gated statement
- OpenAI-only release decision record statement

It does not allow:
- `stable`
- `production-ready`
- `production-monitored`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`

Additional rules:
- OpenAI-only release-gated is not stable
- OpenAI-only release-gated is not production-ready
- OpenAI-only release-gated is not provider-diverse
- local endpoint remains deferred until operator provides endpoint
- telemetry remains disconnected unless separately approved and executed


## Production-Monitored Claim

`production-monitored` means Langfuse telemetry is connected, monitoring controls and operator values are defined, monitoring window duration/sample requirements passed, thresholds passed, redaction/secret checks passed, and the production monitoring final gate approved the monitored claim.

It allows:
- `production-monitored` claim for the defined post-RC Langfuse monitoring scope

It does not allow:
- `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`

Additional rules:
- `production-monitored` is not `production-ready`
- `production-monitored` is not `stable`
- `production-monitored` does not establish provider diversity
- `production-monitored` does not verify local endpoint
- `production-monitored` does not allow bare `release-gated`

## OpenAI-Only Production-Ready Scoped Claim

`post-rc-openai-only-production-ready` means the post-RC OpenAI-only scope passed its scoped readiness decision gate after the owner explicitly scoped local endpoint, provider diversity, and local-model verification out of this decision.

It allows:
- `post-rc-openai-only-production-ready` claim only for the OpenAI-only post-RC scope

It does not allow:
- bare `production-ready`
- `stable`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`
- strict provider-diverse production-ready scope

Additional rules:
- bare `production-ready` remains blocked
- `post-rc-openai-only-production-ready` is not `stable`
- `post-rc-openai-only-production-ready` does not establish provider diversity
- `post-rc-openai-only-production-ready` does not verify a local endpoint
- `post-rc-openai-only-production-ready` does not allow bare `release-gated`

## OpenAI-Only Stable Scoped Claim

`post-rc-openai-only-stable` means the post-RC OpenAI-only scope passed its scoped stable decision gate after the owner explicitly scoped local endpoint, provider diversity, local-model verification, provider verification, adapter checking, and bare release-gated out of this decision.

It allows:
- `post-rc-openai-only-stable` claim only for the OpenAI-only post-RC scope

It does not allow:
- bare `stable`
- bare `production-ready`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`
- bare `release-gated`
- strict provider-diverse stable scope

Additional rules:
- bare `stable` remains blocked
- bare `production-ready` remains blocked
- `post-rc-openai-only-stable` does not establish provider diversity
- `post-rc-openai-only-stable` does not verify a local endpoint
- `post-rc-openai-only-stable` does not verify a provider or adapter
- `post-rc-openai-only-stable` does not allow bare `release-gated`

## OpenAI-Only Stable Final Handoff Claim

`post-rc-openai-only-stable-final-handoff-recorded` means the OpenAI-only post-RC scoped stable handoff/archive packet was recorded with final claim state, evidence pointer index, deferred paths, and next options.

It allows:
- final handoff statement
- archive manifest statement
- final claim state statement
- deferred paths registry statement

It does not allow:
- bare `stable`
- bare `production-ready`
- bare `release-gated`
- `provider-diverse`
- `provider-verified`
- `adapter-checked`
- `local-model-verified`

## Later Claims

- `runner-executed`: relevant runner executed and result is recorded.
- `replay-verified`: replay was rerun with lineage and verdict.
- `integration-verified`: provider/runtime/tool/retrieval path was exercised.
- `release-gated`: explicit threshold, owner, rollback path, and gate pass exist.
- `production-monitored`: live telemetry and anomaly response are connected.

## Blocked in Alpha

The alpha package must not describe itself as having later-claim evidence unless
the corresponding evidence artifact exists.
