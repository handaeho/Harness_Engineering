import crypto from "node:crypto";

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]+/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /OPENAI_API_KEY/gi
];

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function redactString(value) {
  let redacted = String(value);
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function previewText(value, maxLength = 300) {
  const text = redactString(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function sanitizeRequest(request) {
  return {
    model_present: Boolean(request.model),
    input_preview: previewText(request.input, 120),
    input_hash: sha256(request.input || ""),
    store: request.store,
    max_output_tokens: request.max_output_tokens,
    tools_present: Array.isArray(request.tools) && request.tools.length > 0,
    structured_output_present: Boolean(request.response_format || request.text?.format),
    disallowed_fields_present: [
      "tools",
      "tool_choice",
      "response_format",
      "previous_response_id",
      "metadata",
      "include"
    ].filter((field) => Object.prototype.hasOwnProperty.call(request, field))
  };
}

export function sanitizeMappedResponse(mapped) {
  return {
    provider_response_id_present: Boolean(mapped.provider_response_id),
    provider_response_id_hash: mapped.provider_response_id ? sha256(mapped.provider_response_id) : null,
    output_text_preview: previewText(mapped.output_text || "", 300),
    output_text_hash: sha256(mapped.output_text || ""),
    status: mapped.status || null,
    finish_reason: mapped.finish_reason || null,
    usage: mapped.usage || null,
    refusal_signal: mapped.refusal_signal || null,
    raw_response_hash: mapped.raw_response_hash
  };
}

export function redactionPassed(value) {
  const text = JSON.stringify(value);
  return !SECRET_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
