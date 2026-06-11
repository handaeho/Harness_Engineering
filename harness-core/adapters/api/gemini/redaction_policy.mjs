import crypto from "node:crypto";

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /x-goog-api-key\s*[:=]\s*[A-Za-z0-9._-]+/gi,
  /GEMINI_API_KEY/gi
];

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function redactString(value) {
  let redacted = String(value);
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function previewText(value, maxLength = 300) {
  const text = redactString(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function collectTextParts(body = {}) {
  const texts = [];
  for (const content of body.contents || []) {
    for (const part of content.parts || []) {
      if (typeof part.text === "string") texts.push(part.text);
    }
  }
  for (const part of body.systemInstruction?.parts || []) {
    if (typeof part.text === "string") texts.push(part.text);
  }
  return texts.join("\n");
}

export function sanitizeGenerateContentRequest(request) {
  const body = request.body || {};
  const text = collectTextParts(body);
  const parts = (body.contents || []).flatMap((content) => content.parts || []);
  return {
    model_present: Boolean(request.model),
    endpoint_present: Boolean(request.endpoint),
    text_preview: previewText(text, 180),
    text_hash: sha256(text),
    store: body.store,
    max_output_tokens: body.generationConfig?.maxOutputTokens || null,
    thinking_config_present: Boolean(body.generationConfig?.thinkingConfig),
    thinking_level: body.generationConfig?.thinkingConfig?.thinkingLevel || null,
    thinking_budget_present: Number.isInteger(body.generationConfig?.thinkingConfig?.thinkingBudget),
    tools_present: Array.isArray(body.tools) && body.tools.length > 0,
    function_declarations_present: (body.tools || []).some((tool) => Array.isArray(tool.functionDeclarations)),
    tool_config_present: Boolean(body.toolConfig),
    function_call_thought_signature_parts: parts.filter((part) => part.functionCall?.name && part.thoughtSignature).length,
    structured_output_present: Boolean(body.generationConfig?.responseJsonSchema || body.generationConfig?.responseSchema),
    safety_settings_present: Array.isArray(body.safetySettings) && body.safetySettings.length > 0,
    raw_request_body_recorded: false
  };
}

export function sanitizeMappedResponse(mapped) {
  return {
    provider_response_id_present: Boolean(mapped.provider_response_id),
    provider_response_id_hash: mapped.provider_response_id ? sha256(mapped.provider_response_id) : null,
    output_text_preview: previewText(mapped.output_text || "", 300),
    output_text_hash: sha256(mapped.output_text || ""),
    status: mapped.status || null,
    blocked: mapped.blocked === true,
    block_reason: mapped.block_reason || null,
    finish_reason: mapped.finish_reason || null,
    function_calls_total: Array.isArray(mapped.function_calls) ? mapped.function_calls.length : 0,
    function_call_thought_signatures_present: Array.isArray(mapped.function_calls)
      ? mapped.function_calls.filter((call) => call.thought_signature_present === true).length
      : 0,
    usage: mapped.usage || null,
    raw_response_hash: mapped.raw_response_hash,
    raw_response_stored: false
  };
}

export function redactionPassed(value) {
  const text = JSON.stringify(value);
  return !SECRET_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
