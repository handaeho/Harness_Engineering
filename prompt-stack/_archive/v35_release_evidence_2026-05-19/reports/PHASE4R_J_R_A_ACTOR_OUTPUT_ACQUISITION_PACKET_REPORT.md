# Phase 4R-J-R-A Actor Output Acquisition Packet Report

## 1. Scope
- stable_baseline: v34
- working_candidate: v35-candidate
- release_target: v35
- previous_status: Need more substrate before judgment
- release_decision_started: false
- claim_strength: actor_output_capture_packet_ready

## 2. Current Blocker
- native_actor_outputs_missing: 73
- codex_actor_outputs_missing: 25
- semantic_judge_blocked: true
- replay_status: blocker
- phase5_allowed: false

## 3. Actor Output Requirements
- native_cases_required: 73
- codex_tests_required: 25
- total_outputs_required: 98
- requirement_manifest_path: records/phase4r_j_r_a_actor_output_requirements.json

## 4. Actor Prompt Packets
- native_packets_created: 73
- codex_packets_created: 25
- native_packet_dir: records/actor_packets/native
- codex_packet_dir: records/actor_packets/codex

## 5. Actor Output Schema
- schema_path: records/phase4r_j_r_a_actor_output_schema.json
- required_fields: packet_id, case_id_or_test_id, actor_type, actor_runtime, actor_model_or_tool, run_id, trace_id, scenario_id, cohort_id, artifact_version, started_at, completed_at, input_hash, actor_output, actor_output_hash, selected_route, selected_base_prompt, selected_skill, selected_overlays, example_mode, tool_calls, retrieval_events, memory_events, multi_agent_events, safety_events, approval_events, claim_strength, actor_notes, execution_errors
- invalid_output_conditions: actor_output is empty; actor_output_hash does not equal sha256(actor_output); actor_output contains placeholder or synthetic-output markers; packet_id does not match requirement; case_id_or_test_id does not match requirement; trace_id or run_id is missing; Codex output omits codex_asset; prior deterministic record is reused as actor_output; claim_strength exceeds captured actor-output evidence

## 6. Validation Script
- script_path: harness/validate_actor_outputs.mjs
- validation_result_path: records/phase4r_j_r_a_actor_output_validation_result.json
- ready_for_semantic_judge_condition: all 98 required outputs present, valid, hash-verified, non-placeholder, and matched to packet_id/source id

## 7. External Execution Instructions
- instructions_path: reports/ACTOR_OUTPUT_CAPTURE_INSTRUCTIONS.md
- native_output_dir: records/actor_outputs/native
- codex_output_dir: records/actor_outputs/codex
- required_user_or_actor_action: provide actual actor output JSON files or connect an approved live actor provider

## 8. Phase 4R-J-R-B Plan
- plan_path: records/phase4r_j_r_b_semantic_judge_plan.json
- next_step_after_outputs: validate actor outputs, then run semantic judge for native and Codex records
- phase5_still_blocked_until_judge: true
- allowed_next_statuses: Ready for Phase 5 Release Decision, Hold for targeted retest, Reject candidate behavior, Need more substrate before judgment

## 9. Recommendation
Recommendation:
Actor output packet ready

Rationale:
The required execution inputs, output schema, validator, and external instructions now exist. No actor output was fabricated, no semantic verdict was created, and Phase 5 remains blocked.

Required next action:
Generate or provide actual actor output files for all 73 native replay cases and 25 Codex runtime tests, then run the validator.

Files user must provide or generate:
`records/actor_outputs/native/*.json` and `records/actor_outputs/codex/*.json` matching the requirement manifest.

Retest plan:
After validation returns `ready_for_semantic_judge: true`, run Phase 4R-J-R-B to execute semantic judge and release-readiness precheck.
