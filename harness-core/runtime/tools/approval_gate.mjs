export function checkApproval(toolRequest, toolDefinition) {
  const toolName = toolRequest.tool_name;
  const blocked = !toolDefinition
    || toolDefinition.blocked === true
    || toolDefinition.external_side_effect === true
    || toolDefinition.destructive === true
    || toolDefinition.requires_approval === true;

  return {
    tool_name: toolName,
    approved: !blocked,
    blocked,
    reason: blocked
      ? "mock approval gate blocks external, destructive, unknown, or approval-required tools"
      : "mock tool allowed",
    external_side_effect: Boolean(toolDefinition?.external_side_effect),
    destructive: Boolean(toolDefinition?.destructive)
  };
}
