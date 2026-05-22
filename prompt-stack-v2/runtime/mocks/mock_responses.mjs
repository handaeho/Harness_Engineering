export const mockResponses = {
  no_tool_success: {
    final_output: {
      kind: "text",
      value: "mock answer"
    },
    tool_requests: []
  },
  safe_echo_tool: {
    final_output: {
      kind: "text",
      value: "mock echo requested"
    },
    tool_requests: [
      {
        tool_name: "safe_echo",
        arguments: { text: "hello from fixture" }
      }
    ]
  },
  mock_retrieval: {
    final_output: {
      kind: "text",
      value: "mock retrieval requested"
    },
    tool_requests: [
      {
        tool_name: "mock_retrieval",
        arguments: { query: "alpha" }
      }
    ]
  },
  structured_output_success: {
    final_output: {
      kind: "object",
      value: { status: "mock_structured" }
    },
    tool_requests: [
      {
        tool_name: "mock_schema_formatter",
        arguments: { summary: "structured fixture passed" }
      }
    ]
  },
  blocked_external_post: {
    final_output: {
      kind: "text",
      value: "blocked external post requested"
    },
    tool_requests: [
      {
        tool_name: "blocked_external_post",
        arguments: { endpoint: "https://example.invalid/mock", body: { ok: true } }
      }
    ]
  },
  blocked_file_write: {
    final_output: {
      kind: "text",
      value: "blocked file write requested"
    },
    tool_requests: [
      {
        tool_name: "blocked_file_write",
        arguments: { path: "outside.txt", content: "blocked" }
      }
    ]
  },
  mock_failure_recoverable: {
    error: "recoverable mock model failure",
    recoverable: true,
    recovered_output: {
      kind: "text",
      value: "mock recovery output"
    }
  }
};

export function getMockResponse(responseId) {
  return mockResponses[responseId] || mockResponses.no_tool_success;
}
