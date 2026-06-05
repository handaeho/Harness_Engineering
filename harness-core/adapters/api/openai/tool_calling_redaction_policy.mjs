import { previewText, redactionPassed, sanitizeMappedResponse, sha256 } from "./redaction_policy.mjs";

export function sanitizeToolCallingRequest(request) {
  const tools = Array.isArray(request.tools) ? request.tools : [];
  return {
    model_present: Boolean(request.model),
    input_preview: typeof request.input === "string" ? previewText(request.input, 180) : "[response_items_plus_tool_outputs]",
    input_hash: sha256(JSON.stringify(request.input || "")),
    input_is_array: Array.isArray(request.input),
    store: request.store,
    max_output_tokens: request.max_output_tokens,
    tools_present: tools.length > 0,
    function_tools_used: tools.every((tool) => tool.type === "function"),
    built_in_tools_present: tools.some((tool) => tool.type !== "function"),
    tool_names: tools.map((tool) => tool.name),
    tool_schema_hashes: Object.fromEntries(tools.map((tool) => [tool.name, sha256(JSON.stringify(tool.parameters || {}))])),
    structured_output_present: Boolean(request.response_format || request.text?.format),
    disallowed_fields_present: [
      "tool_choice",
      "response_format",
      "text",
      "previous_response_id",
      "metadata",
      "include",
      "mcp",
      "web_search",
      "file_search",
      "computer_use",
      "file_ids",
      "attachments"
    ].filter((field) => Object.prototype.hasOwnProperty.call(request, field))
  };
}

export function sanitizeToolCallingResponse(mapped) {
  return {
    ...sanitizeMappedResponse(mapped),
    tool_calls: (mapped.tool_calls || []).map((call) => ({
      item_id_present: Boolean(call.item_id),
      call_id_present: Boolean(call.call_id),
      call_id_hash: call.call_id ? sha256(call.call_id) : null,
      name: call.name,
      arguments: call.arguments,
      arguments_parse_error: call.arguments_parse_error || null,
      status: call.status || null
    })),
    built_in_tool_items: mapped.built_in_tool_items || []
  };
}

export function sanitizeToolOutput(toolOutput) {
  return {
    call_id_hash: toolOutput.call_id ? sha256(toolOutput.call_id) : null,
    tool_name: toolOutput.tool_name,
    classification: toolOutput.output?.classification,
    output_preview: previewText(JSON.stringify(toolOutput.output || {}), 300)
  };
}

export { redactionPassed };
