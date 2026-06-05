import { previewText, redactionPassed, sanitizeMappedResponse, sanitizeRequest, sha256 } from "./redaction_policy.mjs";

export function sanitizeStructuredOutputRequest(request) {
  return {
    model_present: Boolean(request.model),
    input_preview: previewText(request.input, 160),
    input_hash: sha256(request.input || ""),
    store: request.store,
    max_output_tokens: request.max_output_tokens,
    tools_present: Array.isArray(request.tools) && request.tools.length > 0,
    structured_output_present: request.text?.format?.type === "json_schema",
    text_format_type: request.text?.format?.type || null,
    strict: request.text?.format?.strict === true,
    schema_name: request.text?.format?.name || null,
    schema_hash: sha256(JSON.stringify(request.text?.format?.schema || {})),
    disallowed_fields_present: [
      "tools",
      "tool_choice",
      "response_format",
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

export function sanitizeStructuredOutputResponse(mapped) {
  return {
    ...sanitizeMappedResponse(mapped),
    parsed_json: mapped.parsed_json,
    json_parse_error: mapped.json_parse_error || null
  };
}

export { redactionPassed };
