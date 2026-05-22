# Prompt Stack v2

Status: `v2.0.0-beta-release-gate-thresholds-and-dry-run`

This package is the first alpha skeleton for the v2 prompt stack. The
beta-preflight step adds dependency-backed static validation and adapter
conformance dry-run checks. The beta-mock-execution step adds deterministic
mock-only runtime orchestration with trace evidence while keeping
`prompt-stack/v36` as a read-only baseline. The provider canary steps add a
guarded OpenAI no-tool text-only Responses API canary surface and separate
blocked, credentialed-run, and credentialed-rerun evidence attempts.
The structured-output canary step adds only the OpenAI Responses API
`text.format` JSON Schema path with Ajv revalidation.
The tool-calling canary step adds only the OpenAI Responses API function tool
path with deterministic local mock tools, approval checks, Ajv argument
validation, untrusted tool output reclassification, and redacted evidence.
The canary matrix summary step adds no new execution surface. It summarizes the
OpenAI canary evidence and records vLLM/Ollama local endpoint absence as a
readiness blocker.
The tool-calling replay rerun step reuses the existing OpenAI tool-calling
canary runner with the same restricted mock-tool scope and compares a rerun
attempt against the prior pass attempt.
The OpenAI canary replay suite step reuses the existing no-tool,
structured-output, and tool-calling canary surfaces. It reruns only the no-tool
and structured-output canaries, includes the existing tool-calling rerun
evidence, and keeps the result at canary-suite level.
The beta release evidence bundle draft step indexes existing evidence, audits
claim boundaries, records blockers, snapshots capability/release gate state,
and assesses release readiness as draft-only without new provider execution,
local execution, endpoint probing, or release gate approval.
The release gate thresholds and dry-run step drafts P0/P1/P2-style release
thresholds, evaluates the current evidence bundle against them, records blocker
priority and owner/action drafts, and keeps the result at
`blocked_not_release_gated`.

## Alpha Scope

Included:
- Core harness spec skeleton.
- OpenAI, vLLM, and Ollama adapter skeletons.
- Static validation suite definition.
- v36 baseline inventory, checksums, limitations, and migration map.
- Release claim ladder and rollback plan skeleton.
- Alpha validation tools and machine-readable evidence reports.
- Dependency-backed YAML and JSON Schema validation.
- Adapter conformance dry-run runner and beta entry gate report.

Excluded:
- Real provider or local-model runtime implementation.
- Live telemetry integration.
- Containment proof.
- Provider diversity verification.
- Anthropic, Gemini, HF Transformers, MCP, and AGENTS.md adapters.

## Source of Truth

The v2 source-of-truth starts with:
- `stack.yaml`
- `stack.schema.json`
- `core/spec/harness.spec.yaml`

Prompt bundles under `dist/` are generated artifacts. Do not edit generated
bundles by hand.

## Claim Scope

Allowed alpha claims:
- `harness-designed`
- `static-structure-created`
- `baseline-snapshotted`
- `adapter-skeleton-created`
- `alpha-static-validated`
- `dependency-static-validated`
- `adapter-dry-run-checked`
- `beta-preflight-prepared`
- `beta-mock-runtime-executed`
- `mock-tool-routing-checked`
- `approval-boundary-smoke-tested`
- `trace-schema-smoke-tested`
- `schema-contract-validated`
- `openai-provider-canary-executed`
- `provider-no-tool-path-checked`
- `provider-trace-captured`
- `provider-redaction-checked`
- `openai-structured-output-canary-executed`
- `provider-structured-output-path-checked`
- `json-schema-response-canary-validated`
- `structured-output-trace-captured`
- `structured-output-redaction-checked`
- `openai-tool-calling-canary-executed`
- `provider-tool-call-path-checked`
- `tool-argument-schema-canary-validated`
- `mock-tool-output-reinjection-checked`
- `tool-approval-boundary-canary-checked`
- `tool-output-reclassification-checked`
- `tool-calling-trace-captured`
- `tool-calling-redaction-checked`
- `canary-matrix-summarized`
- `local-readiness-documented`
- `local-endpoint-blocker-recorded`
- `openai-tool-calling-canary-rerun-executed`
- `tool-calling-canary-consistency-checked`
- `tool-calling-rerun-trace-captured`
- `replay-evidence-recorded`
- `openai-canary-replay-suite-executed`
- `openai-no-tool-canary-rerun-executed`
- `openai-structured-output-canary-rerun-executed`
- `openai-canary-suite-consistency-checked`
- `canary-suite-replay-evidence-recorded`
- `canary-suite-trace-comparison-recorded`
- `beta-release-evidence-bundle-drafted`
- `evidence-lineage-indexed`
- `claim-boundary-audited`
- `release-readiness-draft-assessed`
- `blocker-register-updated`
- `release-gate-thresholds-drafted`
- `release-gate-dry-run-executed`
- `release-blockers-prioritized`
- `owner-action-matrix-drafted`
- `rollback-plan-drafted`
- `release-decision-record-drafted`
- `redteam-suite-designed`
- `redteam-fixtures-authored`
- `redteam-taxonomy-mapped`
- `redteam-severity-rubric-drafted`
- `redteam-execution-gate-designed`
- `redteam-blocker-updated`
- `redteam-mock-dry-run-executed`
- `redteam-fixture-execution-path-checked`
- `redteam-result-schema-validated`
- `redteam-severity-aggregation-checked`
- `mock-redteam-trace-captured`
- `mock-redteam-gate-checked`
- `openai-redteam-limited-execution-plan-drafted`
- `openai-redteam-case-subset-selected`
- `openai-redteam-execution-guard-designed`
- `openai-redteam-cost-bound-drafted`
- `openai-redteam-stop-criteria-drafted`
- `openai-redteam-redaction-policy-drafted`
- `openai-redteam-trace-policy-drafted`
- `openai-redteam-limited-execution-preflight-completed`
- `openai-redteam-approval-packet-generated`
- `openai-redteam-credential-readiness-checked`
- `openai-redteam-command-plan-drafted`
- `openai-redteam-execution-preconditions-validated`
- `production-telemetry-design-drafted`
- `otel-genai-mapping-drafted`
- `langfuse-integration-plan-drafted`
- `telemetry-dashboard-spec-drafted`
- `telemetry-anomaly-thresholds-drafted`
- `telemetry-claim-gate-designed`
- `telemetry-blocker-updated`

The OpenAI provider, structured-output, tool-calling canary, and tool-calling
rerun claims require their corresponding provider call pass. The OpenAI canary
replay suite claims require no-tool and structured-output rerun attempts plus
suite comparison pass. If credentials or model are missing, the runner records a
blocked status and those canary claims are not elevated.

These claims do not allow `adapter-checked`, `provider-verified`,
`runtime-verified`, `tool-call-verified`,
`schema-output-verified`, `provider-verified`, `provider-diverse`,
`replay-verified`, `production-monitored`, or `release-gated`.

Existing records/reports were inspected, but v36 runners were not re-executed
in this step.

## Static Validation

Run from the repository root:

```powershell
node prompt-stack-v2/tools/scan_prohibited_claims.mjs
node prompt-stack-v2/tools/compare_v36_baseline.mjs
node prompt-stack-v2/tools/validate_alpha.mjs
node prompt-stack-v2/tools/run_adapter_conformance_dry_run.mjs
node prompt-stack-v2/tools/check_beta_entry.mjs
node prompt-stack-v2/tools/run_beta_mock_execution.mjs
node prompt-stack-v2/tools/check_beta_mock_execution.mjs
node prompt-stack-v2/tools/run_openai_provider_canary.mjs
node prompt-stack-v2/tools/check_provider_canary_openai.mjs
node prompt-stack-v2/tools/check_openai_credentialed_canary.mjs
node prompt-stack-v2/tools/run_openai_structured_output_canary.mjs
node prompt-stack-v2/tools/check_openai_structured_output_canary.mjs
node prompt-stack-v2/tools/run_openai_tool_calling_canary.mjs
node prompt-stack-v2/tools/check_openai_tool_calling_canary.mjs
node prompt-stack-v2/tools/summarize_canary_matrix.mjs
node prompt-stack-v2/tools/check_canary_matrix_summary.mjs
node prompt-stack-v2/tools/run_openai_tool_calling_canary.mjs --attempt-id=002-tool-calling-replay-rerun
node prompt-stack-v2/tools/compare_tool_calling_replay_attempts.mjs
node prompt-stack-v2/tools/check_openai_tool_calling_replay_rerun.mjs
node prompt-stack-v2/tools/run_openai_provider_canary.mjs --attempt-id=004-no-tool-replay-rerun
node prompt-stack-v2/tools/compare_openai_no_tool_replay_attempts.mjs
node prompt-stack-v2/tools/run_openai_structured_output_canary.mjs --attempt-id=002-structured-output-replay-rerun
node prompt-stack-v2/tools/compare_openai_structured_output_replay_attempts.mjs
node prompt-stack-v2/tools/summarize_openai_canary_replay_suite.mjs
node prompt-stack-v2/tools/check_openai_canary_replay_suite.mjs
node prompt-stack-v2/tools/build_beta_release_evidence_bundle.mjs
node prompt-stack-v2/tools/summarize_evidence_lineage.mjs
node prompt-stack-v2/tools/audit_claim_boundaries.mjs
node prompt-stack-v2/tools/check_beta_release_evidence_bundle.mjs
node prompt-stack-v2/tools/build_release_gate_thresholds.mjs
node prompt-stack-v2/tools/run_release_gate_dry_run.mjs
node prompt-stack-v2/tools/audit_release_blockers.mjs
node prompt-stack-v2/tools/summarize_release_threshold_coverage.mjs
node prompt-stack-v2/tools/check_release_gate_dry_run.mjs
node prompt-stack-v2/tools/build_redteam_suite_design.mjs
node prompt-stack-v2/tools/validate_redteam_fixtures.mjs
node prompt-stack-v2/tools/summarize_redteam_mappings.mjs
node prompt-stack-v2/tools/check_redteam_suite_design.mjs
node prompt-stack-v2/tools/run_redteam_mock_runtime_dry_run.mjs
node prompt-stack-v2/tools/summarize_redteam_mock_runtime_results.mjs
node prompt-stack-v2/tools/check_redteam_mock_runtime_dry_run.mjs
node prompt-stack-v2/tools/select_openai_limited_redteam_cases.mjs
node prompt-stack-v2/tools/validate_openai_redteam_execution_plan.mjs
node prompt-stack-v2/tools/check_openai_redteam_limited_execution_plan.mjs
node prompt-stack-v2/tools/run_openai_redteam_limited_execution_preflight.mjs
node prompt-stack-v2/tools/check_openai_redteam_limited_execution_preflight.mjs
node prompt-stack-v2/tools/build_production_telemetry_design.mjs
node prompt-stack-v2/tools/validate_telemetry_design.mjs
node prompt-stack-v2/tools/check_production_telemetry_design.mjs
```

Passing the OpenAI provider canary does not approve tool calling, structured
output, local model execution, provider diversity, replay, or release gate
claims.
Passing the structured output canary does not approve tool calling, local model
execution, broad schema-output verification, provider diversity, replay, or
release gate claims.
Passing the tool-calling canary does not approve external tool reliability,
local model execution, replay, provider diversity, integration verification,
production monitoring, or release gate claims.
Passing the canary matrix summary does not approve local model execution,
provider diversity, replay verification, integration verification, production
monitoring, or release gate claims.
Passing the OpenAI tool-calling rerun does not approve `replay-verified`,
`tool-call-verified`, provider diversity, integration verification, production
monitoring, or release gate claims.
Passing the OpenAI canary replay suite does not approve `replay-verified`,
provider diversity, local model execution, integration verification, production
monitoring, or release gate claims.
Passing the beta release evidence bundle draft does not approve
`release-gated`, `production-ready`, `production-monitored`,
`replay-verified`, provider diversity, local model execution, integration
verification, or provider verification claims.
Passing the release gate dry-run does not approve `release-gated`,
`production-ready`, `production-monitored`, provider diversity, replay
verification, local model execution, production telemetry, or stable release
claims.
Passing the redteam suite design gate does not approve `redteam-executed`,
`redteam-passed`, `containment-verified`, `release-gated`,
`production-ready`, `production-monitored`, provider diversity, replay
verification, local model execution, or production telemetry claims.
Passing the redteam mock runtime dry-run does not approve `redteam-executed`,
`redteam-passed`, `containment-verified`, `release-gated`,
`production-ready`, `production-monitored`, provider/local redteam execution,
provider diversity, local model execution, or production telemetry claims.
Passing the OpenAI redteam limited execution plan does not approve
`redteam-executed`, `redteam-passed`, `containment-verified`,
`release-gated`, `production-ready`, `production-monitored`, provider
verification, provider diversity, provider redteam execution, local model
execution, or production telemetry claims.
Passing or blocking honestly at the OpenAI redteam limited execution preflight
does not approve `redteam-executed`, `redteam-passed`,
`containment-verified`, `release-gated`, `production-ready`,
`production-monitored`, provider verification, provider diversity, provider
redteam execution, local model execution, or production telemetry claims.
Passing the production telemetry design gate does not approve
`telemetry-connected`, `production-monitored`, `production-ready`,
`release-gated`, provider verification, provider diversity, redteam pass,
local model execution, or production deployment claims.

## Dependency Artifact Boundary

`node_modules/` is install output, not a source artifact or evidence artifact.
It is excluded by `.gitignore` and file walkers. `package-lock.json` remains the
dependency evidence artifact.
