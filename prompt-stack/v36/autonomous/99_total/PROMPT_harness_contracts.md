# PROMPT_harness_contracts

## 0. Purpose

This document defines the `active package` harness component contracts.

## 1. Component Model

Each harness should separate these elements whenever possible:

- `Guide`
- `Sensor`
- `Runner`
- `Simulator`
- `Sandbox`
- `Telemetry`
- `Gate`

## 2. Required Contract Fields

### 2.1 Harness Coverage Matrix

- `quality_goal`
- `feedforward_guides`
- `computational_sensors`
- `inferential_sensors`
- `runtime_substrate`
- `evidence_artifacts`
- `coverage_gap`
- `improvement_action`

### 2.1A Runtime OS Charter

- `runtime_os_name`
- `operating_goal`
- `target_agent_types`
- `supported_task_families`
- `supported_runtime_environments`
- `risk_classes`
- `autonomy_levels`
- `human_review_modes`
- `release_claim_language`
- `non_goals`

### 2.1B Runtime Component Map

- `layer`
- `current_status`
- `owner`
- `required_artifacts`
- `activation_condition`
- `failure_modes`
- `done_when`

### 2.1C Context Pack Schema

- `intent`
- `constraints`
- `environment`
- `active_files`
- `touched_symbols`
- `relevant_logs`
- `relevant_tests`
- `version_assumptions`
- `external_knowledge_inputs`
- `human_brief_contract`
- `unresolved_blockers`
- `current_checkpoint`
- `approval_boundary`

### 2.1D Tool / MCP Capability Registry

- `tool_name_or_capability_id`
- `capability_class`
- `purpose`
- `non_purpose`
- `required_parameters`
- `parameter_types`
- `output_schema`
- `side_effects`
- `partial_state_model`
- `idempotency_policy`
- `approval_required`
- `audit_events`

### 2.1E Policy Rule Set

- `who`
- `action`
- `resource`
- `environment`
- `risk_class`
- `condition`
- `approval_state`
- `decision`

### 2.1F Runtime OS Scenario Set

- `scenario_id`
- `task_family`
- `runtime_layer_under_test`
- `input`
- `expected_route`
- `required_trace_properties`
- `required_policy_behavior`
- `required_tool_behavior`
- `required_sandbox_behavior`
- `required_observability`
- `success_criteria`
- `critical_failures`
- `claim_strength_allowed`
- `retest_after_fix`

### 2.1G Prompt Runtime Verification Protocol

- `baseline_version`
- `candidate_version`
- `required_bundles`
- `harness_axes`
- `critical_failure_rules`
- `required_outputs`

### 2.1H Prompt Behavior Release Gate

- `overall_average_min`
- `safety_average_min`
- `coding_average_min`
- `tool_mcp_average_min`
- `retrieval_average_min`
- `variant_consistency_average_min`
- `critical_failures_max`
- `hold_conditions`
- `reject_conditions`

### 2.2 Runner Contract

- `runner_id`
- `stack_version`
- `harness_mode`
- `clean_state_required`
- `shared_state_policy`
- `cache_policy`
- `trial_independence_check`
- `readiness_checks`
- `failure_classification`

### 2.2A Runtime Substrate Contract

- `harness_class`
- `config_harness_components`
- `code_defined_harness_components`
- `managed_runtime_components`
- `reasoning_runtime`
- `execution_runtime`
- `generated_code_execution_separation`
- `artifact_store`
- `persistent_storage`
- `session_suspend_resume`
- `identity_surface`
- `filesystem_surface`
- `network_surface`

### 2.3 Sandbox Policy

- `sandbox_type`
- `process_isolation`
- `sandbox_mode`
- `writable_roots`
- `read_only_paths`
- `network_policy`
- `allowed_domains`
- `denied_domains`
- `approval_required_actions`
- `shell_command_approval_policy`
- `code_execution_timeout`
- `resource_limits`
- `cleanup_policy`
- `artifact_export_policy`
- `credential_storage_policy`
- `secret_exposure_policy`
- `rollback_boundary`

### 2.3A Policy / Evaluation / Observability Triangle

- `policy_engine`
- `policy_default`
- `policy_decision_point`
- `emergency_shutdown_rule`
- `observability_pipeline`
- `observability_event_families`
- `evaluation_pipeline`
- `evaluation_sampling_policy`
- `feedback_to_policy_route`

### 2.4 Telemetry Schema

- `trace_id`
- `session_id`
- `run_id`
- `cohort_id`
- `scenario_id`
- `artifact_version`
- `span_id`
- `parent_span_id`
- `approval_event`
- `network_policy_event`
- `tool_result_event`
- `retry_event`
- `failure_event`
- `cost_event`
- `latency_event`
- `memory_operation_event`
- `shell_command_event`

### 2.5 Trace Schema

- `trace_id`
- `session_id`
- `run_id`
- `cohort_id`
- `scenario_id`
- `artifact_version`
- `nested_tool_spans`
- `cost_attribution`
- `latency_attribution`
- `retry_attribution`
- `events`
- `final_state`
- `verification_state`

### 2.6 Mock Tool Contract

- `tool_name`
- `tool_class`
- `required_parameters`
- `parameter_constraints`
- `side_effect_model`
- `partial_state_model`
- `failure_modes`
- `retry_policy`
- `expected_observation_shape`
- `assertion_hooks`

### 2.7 Simulator Scenario

- `scenario_id`
- `starting_prompt`
- `conversation_plan`
- `user_goal`
- `user_constraints`
- `hidden_user_state`
- `allowed_user_variation`
- `target_final_state`
- `policy_rules`
- `tool_environment`
- `success_criteria`
- `failure_criteria`
- `max_turns`
- `stop_condition`

### 2.8 Repository Legibility Harness

- `repository_map_exists`
- `agents_entrypoint`
- `agents_map_like`
- `repo_local_docs_roots`
- `build_test_lint_entrypoints`
- `high_risk_action_boundary`
- `stale_doc_check_path`
- `current_gap`

### 2.9 Documentation Freshness Harness

- `cross_link_check`
- `agents_reference_check`
- `architecture_code_drift_check`
- `spec_code_drift_check`
- `generated_doc_drift_check`
- `completed_plan_drift_check`
- `deprecated_runtime_rule_check`
- `stale_doc_candidate_scan`
- `doc_gardening_policy`

### 2.10 Agent-Readable Observability Harness

- `per_worktree_app_runner`
- `local_isolated_environment`
- `browser_or_devtools_access`
- `dom_snapshot_capture`
- `screenshot_capture`
- `log_query_interface`
- `metric_query_interface`
- `trace_query_interface`
- `smoke_journey_runner`
- `failure_reproduction_script`
- `post_fix_verification_script`
- `run_isolation_rule`

### 2.11 Architecture Invariant Harness

- `dependency_direction_test`
- `layer_boundary_linter`
- `forbidden_import_rule`
- `file_size_limit_rule`
- `schema_convention_rule`
- `structured_logging_rule`
- `security_sensitive_api_rule`
- `public_api_compatibility_check`
- `generated_boundary_check`
- `error_message_quality`

### 2.11A Tool Surface Quality Harness

- `typed_schema`
- `stable_identifiers`
- `required_parameters`
- `status_semantics`
- `scope_controls`
- `filter_sort_pagination`
- `field_selection`
- `idempotency_key`
- `machine_readable_error`
- `side_effect_description`
- `partial_state_model`

### 2.12 Harness Failure Classification

- `failure_classes`
- `owner_fix_routing`
- `prompt_rewrite_block_rule`
- `rerun_required_rule`

### 2.13 Agentic Garbage Collection Harness

- `cadence`
- `quality_inputs`
- `cleanup_outputs`
- `small_pr_rule`
- `feature_pr_separation_rule`
- `invariant_promotion_rule`
- `rollback_boundary`

### 2.14 Throughput-Aware Review And Merge Harness

- `risk_classes`
- `required_checks_by_class`
- `agent_review_role`
- `human_review_rule`
- `auto_merge_rule`
- `rollback_plan_rule`
- `flaky_test_isolation_rule`

### 2.15 End-To-End Agent Task Harness

- `task_loop_steps`
- `required_lineage_fields`
- `required_evidence_fields`
- `partial_state_truthfulness_rule`
- `merge_authority_rule`

### 2.15A Long-Running Initializer Harness

- `initializer_artifact`
- `feature_list`
- `task_status`
- `environment_bootstrap`
- `dependency_install_state`
- `known_risks`
- `acceptance_criteria`
- `per_session_handoff_fields`
- `one_feature_at_a_time_rule`
- `baseline_recovery_priority_rule`

### 2.16 Human Taste Encoding Loop

- `promotion_ladder`
- `session_local_note_rule`
- `guide_promotion_rule`
- `repo_instruction_promotion_rule`
- `tooling_promotion_rule`
- `release_gate_promotion_rule`
- `rule_retirement_rule`

### 2.17 Agent-First Technology Choice Review

- `evaluation_axes`
- `review_questions`
- `reimplementation_caution`
- `internalization_boundary_rule`

### 2.18 Harness Readiness Checklist

- `repository_map_exists`
- `docs_linked_and_fresh`
- `agents_map_like`
- `execution_plans_versioned`
- `logs_metrics_traces_agent_readable`
- `ui_or_runtime_observable_when_relevant`
- `local_isolated_runner_exists`
- `deterministic_invariants_exist`
- `repeated_failure_linters_exist`
- `test_commands_known_and_runnable`
- `pr_risk_class_defined`
- `human_escalation_boundary_clear`
- `rollback_path_exists`
- `garbage_collection_loop_exists`
- `stable_lineage_fields_preserved`
- `benchmark_replay_claims_backed_by_execution`

### 2.19 Sandbox Escape / Containment Harness

- `privileged_container_ban`
- `docker_socket_exposure_rule`
- `host_filesystem_mount_policy`
- `broad_egress_ban`
- `long_lived_secret_ban`
- `misconfiguration_test_required`
- `sandbox_within_sandbox_rule`
- `vm_isolation_for_high_risk_eval`
- `immutable_audit_log_rule`

### 2.20 Claim Strength Gate

- `plausible_rule`
- `local_check_rule`
- `runner_execution_rule`
- `integration_verification_rule`
- `release_gate_rule`
- `production_monitoring_rule`

## 3. Ownership Split

- `04_harness`
  - doctrine owner
  - contract owner
- `harness/`
  - executable asset owner
  - schema and runner owner
- top-level reports
  - verdict and evidence owner

## 4. Anti-Patterns

- guide exists but runner contract is missing
- runner existence is treated as a release-grade claim
- trajectory claim is made without a trace
- autonomy claim is made without a sandbox
- production-monitored claim is made without telemetry
- agent-first repository claim is made without a repository map
- docs existence is treated as docs freshness
- PR opened is treated as task complete
- repeated review taste is still handled manually while claiming harness maturity
- config harness is treated as code-defined or managed-runtime strength
- trace captured is treated as evaluation passed
- sandbox existence is treated as containment verified

<!-- V35_RELEASE_STABLE_PATCH_START -->
## active package Release Native Replay Contract

This active package release addendum defines the replay evaluation replay contract.

- A replay case must name source files under test, selected base prompt, selected overlays, selected Codex skill if any, expected behavior, forbidden behavior, deterministic assertions, and judge rubric.
- A trace must include trace_id, run_id, scenario_id, cohort_id, artifact_version, prompt_version, model_version, selected_base_prompt, selected_skill, route, events, final_state, claim_strength, and verdict.
- Deterministic checks own forbidden behavior, trace completeness, approval boundaries, tool-state truthfulness, and claim-strength downgrade.
- Judge review may assess semantic fit only after deterministic checks pass or explicitly mark deterministic blockers.
- A replay runner must read active package assets, not previous-baseline paths, when claiming active package evidence.
<!-- V35_RELEASE_STABLE_PATCH_END -->
