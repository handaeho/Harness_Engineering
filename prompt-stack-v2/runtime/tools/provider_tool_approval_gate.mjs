const APPROVED_TOOLS = new Set(["canary_lookup", "canary_calculator"]);

export function checkProviderToolApproval(toolName) {
  if (APPROVED_TOOLS.has(toolName)) {
    return {
      status: "approved",
      approved: true,
      tool_name: toolName,
      reason: "deterministic provider mock tool is allowlisted"
    };
  }
  return {
    status: "blocked",
    approved: false,
    tool_name: toolName,
    reason: toolName === "blocked_external_post"
      ? "external side-effect tool is always blocked"
      : "unknown or non-allowlisted tool is blocked"
  };
}
