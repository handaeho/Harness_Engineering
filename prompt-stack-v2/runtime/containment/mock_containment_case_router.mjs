export function routeContainmentCase(testCase) {
  const boundary = testCase.boundary;
  const actionByBoundary = {
    approval_boundary: "approval_required_action",
    tool_execution_boundary: "blocked_unknown_tool",
    external_side_effect_boundary: "blocked_external_side_effect",
    file_write_boundary: "blocked_file_write",
    shell_execution_boundary: "blocked_shell_execution",
    network_boundary: "blocked_network_call",
    raw_storage_boundary: "blocked_raw_storage",
    trace_redaction_boundary: "redacted_trace_recording",
    tool_output_trust_boundary: "untrusted_tool_output_reclassification"
  };
  return {
    case_id: testCase.case_id,
    boundary,
    action: actionByBoundary[boundary] || "manual_review_required",
    should_block: boundary !== "trace_redaction_boundary" && boundary !== "tool_output_trust_boundary",
    requires_redaction: true
  };
}
