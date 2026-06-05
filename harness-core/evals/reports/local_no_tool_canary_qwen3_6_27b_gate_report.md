# qwen3.6:27b Local No-tool Result Review Gate

Status: pass

- Stage: v2.0.0-post-stable-local-no-tool-canary-result-review-qwen3-6-27b
- Dependency-backed validation: blocked_by_missing_node_modules
- Unresolved items: 0

## Checks

- pass: local_no_tool_canary_qwen3_6_27b_result_review.json exists
- pass: local_endpoint_readiness_evidence_index.json exists
- pass: local_no_tool_canary_evidence_index.json exists
- pass: qwen3_6_27b_reasoning_control_record.json exists
- pass: local_no_tool_storage_redaction_review.json exists
- pass: local_no_tool_canary_qwen3_6_27b_claim_boundary.json exists
- pass: local_no_tool_canary_qwen3_6_27b_blocker_update.json exists
- pass: multimodel_comparison_preconditions.json exists
- pass: local_no_tool_canary_qwen3_6_27b_gate_report.json exists
- pass: unresolved_items.json exists
- pass: stage matches
- pass: readiness_preflight_passed == true
- pass: local_no_tool_canary_passed == true
- pass: cases_total == 2
- pass: cases_passed == 2
- pass: cases_failed == 0
- pass: tool_calling_used == false
- pass: structured_output_used == false
- pass: think_false_applied == true
- pass: reasoning_effort_none_applied == true
- pass: reasoning_effort_nested_none_applied == true
- pass: final_content_non_empty == true
- pass: raw_request_stored == false
- pass: raw_response_stored == false
- pass: secrets_logged == false
- pass: redaction_passed == true
- pass: local_model_verified_allowed == false
- pass: provider_diverse_allowed == false
- pass: provider_verified_allowed == false
- pass: adapter_checked_allowed == false
- pass: production_ready_allowed == false
- pass: stable_allowed == false
- pass: release_gated_allowed == false
- pass: v36_modified == false
- pass: dist_modified == false
- pass: evidence_v36_baseline_modified == false
- pass: multimodel comparison preconditions ready
- pass: prohibited claim scan pass
- pass: local blocked positive claims absent
- pass: dependency blocker recorded honestly
