import { getMockResponse } from "./mock_responses.mjs";

export function callMockModel(runRequest, contextPacket) {
  const responseId = runRequest.input?.mock_response_id || "no_tool_success";
  const response = getMockResponse(responseId);

  if (response.error) {
    const error = new Error(response.error);
    error.mock_response = response;
    throw error;
  }

  return {
    adapter_id: "mock",
    provider_execution: false,
    local_model_execution: false,
    response_id: responseId,
    context_status: contextPacket.status,
    final_output: response.final_output,
    tool_requests: response.tool_requests || []
  };
}

export function recoverMockModelResponse(error) {
  const recovered = error?.mock_response?.recovered_output || {
    kind: "text",
    value: "mock recovery fallback"
  };
  return {
    adapter_id: "mock",
    provider_execution: false,
    local_model_execution: false,
    response_id: "mock_recovery",
    final_output: recovered,
    tool_requests: []
  };
}
