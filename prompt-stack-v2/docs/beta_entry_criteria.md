# Beta Entry Criteria

Minimum criteria before beta work starts:

- `tools/validate_alpha.mjs` exits pass.
- Dependency-backed validation uses `yaml` and Ajv without fallback.
- Prohibited claim scan exits pass.
- Baseline comparison has no unexplained items.
- Adapter fixture files exist.
- Adapter dry-run report exits pass.
- `evals/suites/adapter_conformance_design.yaml` exists.
- `adapters/provider_capability_matrix.yaml` has no unverified `true` values.
- `release/release_gate.yaml` blocks forbidden claims.
- `package-lock.json` exists.
- v36 modified 여부 false.

## Beta Mock Execution Gate

The beta-mock-execution step adds these additional preconditions before any
provider or local model surface can be proposed:

- `tools/run_beta_mock_execution.mjs` exits pass.
- `tools/check_beta_mock_execution.mjs` exits pass.
- `blocked_tools_executed == 0`.
- `provider_execution == false`.
- `local_model_execution == false`.
- `external_side_effects == false`.
- `evidence/beta-mock-execution/trace_samples.jsonl` exists.
- `evidence/beta-mock-execution/unresolved_items.json` is an empty array.
- `.gitignore` excludes `node_modules/`.

Passing this gate still does not approve provider execution or local model
execution.

## OpenAI Provider Canary Gate

The provider canary step adds a narrowly approved provider surface:

- `tools/run_openai_provider_canary.mjs` exits pass or explicit blocked status.
- `tools/check_provider_canary_openai.mjs` exits pass or blocked.
- `tools_used == false`.
- `structured_output_used == false`.
- `local_model_execution == false`.
- `external_side_effects == false`.
- `store_false_enforced == true`.
- `evidence/beta-provider-canary-openai/provider_trace_samples.jsonl` exists.
- `evidence/beta-provider-canary-openai/redaction_report.json` exists.

Passing this gate still does not approve tool calling, structured output, local
model execution, replay, provider diversity, production monitoring, or release
gate claims.

## OpenAI Structured Output Canary Gate

The structured output canary step adds only the Responses API JSON Schema
response path:

- `tools/run_openai_structured_output_canary.mjs` exits pass or explicit blocked status.
- `tools/check_openai_structured_output_canary.mjs` exits pass or blocked.
- `structured_output_used == true` when pass.
- `tools_used == false`.
- `local_model_execution == false`.
- `external_side_effects == false`.
- `store_false_enforced == true`.
- `strict_json_schema_used == true`.
- `ajv_validation_used == true`.
- `schema_validations_failed == 0` when pass.
- `evidence/beta-structured-output-canary-openai/structured_output_trace_samples.jsonl` exists.
- `evidence/beta-structured-output-canary-openai/schema_validation_report.json` exists.

Passing this gate still does not approve tool calling, local model execution,
replay verification, provider diversity, production monitoring, or
`schema-output-verified`.

## OpenAI Tool Calling Canary Gate

The tool-calling canary step adds only the Responses API function tool path
with deterministic local mock tools:

- `tools/run_openai_tool_calling_canary.mjs` exits pass or explicit blocked status.
- `tools/check_openai_tool_calling_canary.mjs` exits pass or blocked.
- `tool_calling_used == true` when pass.
- `function_tools_used == true` when pass.
- `built_in_tools_used == false`.
- `remote_mcp_used == false`.
- `local_model_execution == false`.
- `external_side_effects == false`.
- `store_false_enforced == true`.
- `tool_argument_ajv_validation_used == true`.
- `mock_tools_only == true`.
- `blocked_tools_executed == 0`.
- `tool_outputs_reclassified_untrusted >= mock_tools_executed`.
- `evidence/beta-tool-calling-canary-openai/tool_calling_trace_samples.jsonl` exists.
- `evidence/beta-tool-calling-canary-openai/tool_argument_validation_report.json` exists.
- `evidence/beta-tool-calling-canary-openai/approval_boundary_report.json` exists.

Passing this gate still does not approve local model execution, replay
verification, redteam execution, provider diversity, production monitoring,
release gate claims, or `tool-call-verified`.

## Canary Matrix Summary and Local Readiness Gate

The canary matrix summary stage does not open a new execution surface:

- `tools/summarize_canary_matrix.mjs` reads existing OpenAI canary evidence.
- `tools/check_canary_matrix_summary.mjs` exits pass when summary evidence and
  local readiness blockers are present.
- `provider_execution_performed_in_this_stage == false`.
- `local_model_execution_performed_in_this_stage == false`.
- vLLM local no-tool canary is `blocked_by_missing_local_endpoint`.
- Ollama local no-tool canary is `blocked_by_missing_local_endpoint`.
- `evidence/beta-canary-matrix-summary/local_readiness_blockers.json` exists.
- `evidence/beta-canary-matrix-summary/claim_status_report.json` blocks
  `provider-diverse`, `local-model-verified`, and local no-tool canary claims.

Passing this gate still does not approve local model execution, provider
diversity, replay verification, integration verification, production
monitoring, or release gate claims.

## OpenAI Tool Calling Replay Rerun Gate

The tool-calling replay rerun stage reuses the existing OpenAI tool-calling
canary runner and compares a second attempt against `001-tool-calling-canary`:

- `tools/run_openai_tool_calling_canary.mjs --attempt-id=002-tool-calling-replay-rerun` exits pass or explicit blocked status.
- `tools/compare_tool_calling_replay_attempts.mjs` exits pass or blocked.
- `tools/check_openai_tool_calling_replay_rerun.mjs` exits pass or blocked.
- `attempts/001-tool-calling-canary` exists.
- `attempts/002-tool-calling-replay-rerun` exists when the rerun is executed.
- same case set and same tool schema set are required when both attempts pass.
- built-in tools, remote MCP, local model execution, and external side effects remain false.
- `blocked_tools_executed == 0`.
- raw responses are not stored.

Passing this gate still does not approve `replay-verified`,
`tool-call-verified`, provider diversity, integration verification, production
monitoring, or release gate claims.

## OpenAI Canary Replay Suite Gate

The OpenAI canary replay suite groups the no-tool, structured-output, and
tool-calling canary surfaces without opening new provider features:

- `tools/run_openai_provider_canary.mjs --attempt-id=004-no-tool-replay-rerun`
  exits pass or explicit blocked status.
- `tools/compare_openai_no_tool_replay_attempts.mjs` exits pass or blocked.
- `tools/run_openai_structured_output_canary.mjs --attempt-id=002-structured-output-replay-rerun`
  exits pass or explicit blocked status.
- `tools/compare_openai_structured_output_replay_attempts.mjs` exits pass or
  blocked.
- Existing tool-calling rerun comparison evidence is included.
- `tools/summarize_openai_canary_replay_suite.mjs` creates suite summary,
  trace comparison, and redaction reports.
- `tools/check_openai_canary_replay_suite.mjs` exits pass only when all required
  surfaces pass.
- Local model execution, endpoint probing, provider diversity, live telemetry,
  and release gate claims remain closed.

Passing this gate still does not approve `replay-verified`,
`tool-call-verified`, `schema-output-verified`, provider diversity,
integration verification, production monitoring, or release gate claims.

## Beta Release Evidence Bundle Draft Gate

The beta release evidence bundle draft stage indexes existing evidence and does
not open a new execution surface:

- `tools/build_beta_release_evidence_bundle.mjs` exits pass.
- `tools/summarize_evidence_lineage.mjs` exits pass.
- `tools/audit_claim_boundaries.mjs` exits pass.
- `tools/check_beta_release_evidence_bundle.mjs` exits pass.
- `evidence/beta-release-evidence-bundle/evidence_index.json` exists.
- `evidence/beta-release-evidence-bundle/claim_status_report.json` exists.
- `evidence/beta-release-evidence-bundle/claim_boundary_audit.json` exists.
- `evidence/beta-release-evidence-bundle/evidence_lineage.json` exists.
- `evidence/beta-release-evidence-bundle/release_readiness_assessment.json` exists.
- `evidence/beta-release-evidence-bundle/blockers_and_gaps.json` exists.
- `evidence/beta-release-evidence-bundle/bundle_manifest.json` exists.
- `evidence/beta-release-evidence-bundle/bundle_checksums.json` exists.
- New provider execution in this stage is false.
- Local model execution in this stage is false.
- Local endpoint probe in this stage is false.
- Release gate passed is false.
- Production ready is false.
- Provider diversity established is false.
- Local model execution verified is false.

Passing this gate still does not approve `release-gated`,
`production-ready`, `production-monitored`, `replay-verified`, provider
diversity, local model execution, integration verification, or provider
verification claims.

## Release Gate Thresholds and Dry-run Gate

The release gate thresholds and dry-run stage drafts release thresholds and
evaluates the current beta evidence bundle without granting release gate status:

- `tools/build_release_gate_thresholds.mjs` exits pass.
- `tools/run_release_gate_dry_run.mjs` exits pass with `blocked_not_release_gated`.
- `tools/audit_release_blockers.mjs` exits pass.
- `tools/summarize_release_threshold_coverage.mjs` exits pass.
- `tools/check_release_gate_dry_run.mjs` exits pass.
- `release/release_gate_thresholds.yaml` exists.
- `evidence/beta-release-gate-dry-run/release_gate_dry_run_report.json` exists.
- `evidence/beta-release-gate-dry-run/release_blocker_audit.json` exists.
- `evidence/beta-release-gate-dry-run/release_threshold_coverage.json` exists.
- `evidence/beta-release-gate-dry-run/owner_action_matrix.json` exists.
- `evidence/beta-release-gate-dry-run/rollback_plan_draft.json` exists.
- `evidence/beta-release-gate-dry-run/release_decision_record_draft.md` exists.
- New provider execution is false.
- Local model execution is false.
- Local endpoint probe is false.
- Dist modification is false.
- Release gate passed is false.
- Production ready is false.
- Provider diversity established is false.

Passing this gate still does not approve `release-gated`,
`production-ready`, `production-monitored`, provider diversity, replay
verification, local model execution, production telemetry, or stable release
claims.

## Redteam Suite Design Gate

The redteam suite design stage creates design artifacts only and does not
execute attacks against a live model or mock target:

- `tools/build_redteam_suite_design.mjs` creates taxonomy, fixtures, mappings,
  severity rubric, pass/fail policy, and design reports.
- `tools/validate_redteam_fixtures.mjs` validates all JSONL fixture cases
  against `security/redteam/redteam_case.schema.json`.
- `tools/summarize_redteam_mappings.mjs` checks OWASP/NIST/MITRE mapping
  coverage against the internal taxonomy.
- `tools/check_redteam_suite_design.mjs` exits pass only when design artifacts
  exist, fixtures validate, the execution gate remains closed, and no provider,
  local, or redteam execution is recorded.
- `release/redteam_execution_gate.yaml` keeps `can_execute_redteam: false`.
- Actual redteam execution is false.
- Provider execution is false.
- Local model execution is false.
- External side effects are false.

Passing this gate still does not approve `redteam-executed`,
`redteam-passed`, `containment-verified`, `release-gated`,
`production-ready`, `production-monitored`, provider diversity, replay
verification, local model execution, or production telemetry claims.

## Redteam Mock Runtime Dry-run Gate

The redteam mock runtime dry-run stage executes only mock-compatible redteam
fixtures against a deterministic mock runtime:

- `tools/run_redteam_mock_runtime_dry_run.mjs` loads all redteam fixture files,
  validates case schema, routes mock-compatible cases, records skipped
  provider/local/future-only cases, validates result schema, aggregates
  severity, and writes redacted trace samples.
- `tools/summarize_redteam_mock_runtime_results.mjs` creates an eval summary.
- `tools/check_redteam_mock_runtime_dry_run.mjs` exits pass only when result
  schema validation, severity aggregation, critical/high failure counts,
  execution boundaries, redaction, dist boundary, and v36 baseline checks pass.
- Provider execution is false.
- Local model execution is false.
- Actual provider redteam execution is false.
- Actual local redteam execution is false.
- External side effects are false.

Passing this gate still does not approve `redteam-executed`,
`redteam-passed`, `containment-verified`, `release-gated`,
`production-ready`, `production-monitored`, provider diversity, replay
verification, local model execution, provider redteam execution, or production
telemetry claims.

## OpenAI Redteam Limited Execution Plan Gate

The OpenAI redteam limited execution plan stage selects a bounded future
provider redteam subset and designs execution controls without running provider
calls:

- `tools/select_openai_limited_redteam_cases.mjs` selects at most 12 cases and
  records excluded cases.
- `tools/validate_openai_redteam_execution_plan.mjs` validates subset limits,
  source fixtures, no secret-looking payloads, no side-effect-looking payloads,
  no built-in tool cases, and a closed provider execution guard.
- `tools/check_openai_redteam_limited_execution_plan.mjs` exits pass only when
  the selected subset, excluded cases report, guard, cost bound, stop criteria,
  redaction policy, trace policy, claim scan, dist boundary, and v36 baseline
  checks pass.
- Provider execution is false.
- Local model execution is false.
- Actual redteam execution is false.
- Can execute provider redteam is false.

Passing this gate still does not approve `redteam-executed`,
`redteam-passed`, `containment-verified`, `release-gated`,
`production-ready`, `production-monitored`, provider verification, provider
diversity, local model execution, or production telemetry claims.

## OpenAI Redteam Limited Execution Preflight Gate

The OpenAI redteam limited execution preflight stage validates readiness for a
future provider execution without sending any cases to OpenAI:

- `tools/run_openai_redteam_limited_execution_preflight.mjs` validates the
  selected 12-case subset, approval gate, credential presence, guard policy,
  cost bound, stop criteria, redaction policy, and trace policy.
- `tools/check_openai_redteam_limited_execution_preflight.mjs` exits with pass
  or blocked when artifacts are valid and execution remains closed.
- `release/openai_redteam_limited_execution_approval_gate.yaml` keeps
  `explicit_user_approval_present: false`.
- `release/openai_redteam_limited_execution_command_plan.yaml` records the
  future execution commands but marks them not executable in this stage.
- Provider execution is false.
- Actual redteam execution is false.
- Local model execution is false.
- Can execute provider redteam is false.

Passing or blocking honestly at this gate still does not approve
`redteam-executed`, `redteam-passed`, `containment-verified`,
`release-gated`, `production-ready`, `production-monitored`, provider
verification, provider diversity, local model execution, or production
telemetry claims.

## Production Telemetry Design Gate

The production telemetry design stage creates schema, mapping, dashboard,
threshold, and claim gate artifacts without connecting any live telemetry sink:

- `tools/build_production_telemetry_design.mjs` creates production telemetry
  policy, event taxonomy, metric catalog, OTel GenAI mapping, Langfuse
  integration plan, dashboard spec, anomaly thresholds, and blocker update.
- `tools/validate_telemetry_design.mjs` compiles trace/telemetry JSON schemas
  and validates policy, mapping, redaction, threshold, and gate closure.
- `tools/check_production_telemetry_design.mjs` exits pass only when design
  artifacts exist, live telemetry remains disconnected, sink writes remain
  disabled, production claims remain blocked, dist boundary holds, and v36
  baseline comparison passes.
- Live telemetry connected is false.
- Telemetry sink write enabled is false.
- Production monitored is false.
- Production ready is false.

Passing this gate still does not approve `telemetry-connected`,
`production-monitored`, `production-ready`, `release-gated`, provider
verification, provider diversity, local model execution, redteam pass, or
production deployment claims.

## Still Not In Mock Execution

- Provider API execution.
- Local model execution.
- Actual tool calling.
- Real runtime orchestration outside deterministic mock fixtures.
- Replay verification.
- Live telemetry.
- Redteam execution.

Beta entry preflight pass does not grant beta execution. The operator must
approve the next stage explicitly.

## Beta Admission Note

Adapter fixtures are design inputs only. They do not allow `adapter-checked`
until a conformance runner executes and records evidence.
