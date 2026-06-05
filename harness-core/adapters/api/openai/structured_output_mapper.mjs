export function mapStructuredOutputRequest(testCase, env = process.env) {
  const maxOutputTokens = Number.parseInt(env.OPENAI_MAX_OUTPUT_TOKENS || "128", 10);
  const boundedMaxOutputTokens = Number.isFinite(maxOutputTokens)
    ? Math.max(16, Math.min(maxOutputTokens, 512))
    : 128;

  return {
    model: env.OPENAI_MODEL,
    input: `${testCase.input}\nReturn JSON that matches the provided schema.`,
    store: false,
    max_output_tokens: boundedMaxOutputTokens,
    text: {
      format: {
        type: "json_schema",
        name: testCase.case_id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64),
        schema: testCase.schema,
        strict: true
      }
    }
  };
}

export function assertStructuredOutputRequestSurface(request) {
  const disallowed = [
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
  ].filter((field) => Object.prototype.hasOwnProperty.call(request, field));

  const format = request.text?.format || {};
  const strictJsonSchema = format.type === "json_schema"
    && format.strict === true
    && typeof format.name === "string"
    && format.schema
    && format.schema.type === "object";

  return {
    ok: disallowed.length === 0 && strictJsonSchema,
    disallowed_fields: disallowed,
    tools_used: false,
    structured_output_used: strictJsonSchema,
    strict_json_schema_used: strictJsonSchema,
    store_false_enforced: request.store === false,
    max_output_tokens_bounded: Number.isInteger(request.max_output_tokens)
      && request.max_output_tokens >= 1
      && request.max_output_tokens <= 512,
    input_text_only: typeof request.input === "string"
  };
}
