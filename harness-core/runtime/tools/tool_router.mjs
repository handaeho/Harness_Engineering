import { getMockTool } from "./mock_tool_registry.mjs";

export function routeToolRequests(mockModelResponse) {
  return (mockModelResponse.tool_requests || []).map((request) => ({
    tool_name: request.tool_name,
    arguments: request.arguments || {},
    tool_definition: getMockTool(request.tool_name)
  }));
}

export function reclassifyToolOutput(toolName, output) {
  return {
    tool_name: toolName,
    trust: "untrusted_tool_output",
    output
  };
}
