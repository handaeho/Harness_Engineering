export function mapCanaryRequest(testCase, env = process.env) {
  const maxOutputTokens = Number.parseInt(env.OPENAI_MAX_OUTPUT_TOKENS || "32", 10);
  const boundedMaxOutputTokens = Number.isFinite(maxOutputTokens)
    ? Math.max(1, Math.min(maxOutputTokens, 256))
    : 32;

  return {
    model: env.OPENAI_MODEL,
    input: testCase.input,
    store: false,
    max_output_tokens: boundedMaxOutputTokens
  };
}

export function assertNoDisallowedRequestSurface(request) {
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

  if (request.text && Object.prototype.hasOwnProperty.call(request.text, "format")) {
    disallowed.push("text.format");
  }

  return {
    ok: disallowed.length === 0,
    disallowed_fields: disallowed,
    tools_used: false,
    structured_output_used: false,
    store_false_enforced: request.store === false,
    max_output_tokens_bounded: Number.isInteger(request.max_output_tokens)
      && request.max_output_tokens >= 1
      && request.max_output_tokens <= 256,
    input_text_only: typeof request.input === "string"
  };
}
