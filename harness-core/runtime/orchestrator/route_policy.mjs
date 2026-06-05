export function selectRoute(runRequest, contextPacket) {
  return {
    route_id: "mock-only",
    adapter_id: "mock",
    mode: "mock_only_runtime_execution",
    needs_tool_routing: Boolean(runRequest.input?.tool_request),
    context_status: contextPacket.status
  };
}
