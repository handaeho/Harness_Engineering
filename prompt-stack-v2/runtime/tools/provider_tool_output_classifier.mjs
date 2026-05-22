export function classifyProviderToolOutput(toolName, output) {
  return {
    tool_name: toolName,
    classification: "untrusted_tool_output",
    trusted: false,
    output
  };
}
