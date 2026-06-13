import { previewText } from "./redaction_policy.mjs";

function summarizeProviderError(status, body) {
  const errorBody = body?.error && typeof body.error === "object" ? body.error : {};
  return {
    status,
    code: typeof errorBody.code === "number" ? errorBody.code : null,
    status_text: typeof errorBody.status === "string" ? errorBody.status : null,
    message_preview: typeof errorBody.message === "string" ? previewText(errorBody.message, 220) : null
  };
}

export async function createGenerateContent(request, env = process.env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for Gemini provider execution");
  }
  if (!request.endpoint) {
    throw new Error("GEMINI_MODEL is required for Gemini provider execution");
  }

  const response = await fetch(request.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify(request.body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw_text_preview: text.slice(0, 500) };
  }
  if (!response.ok) {
    const message = json?.error?.message || text.slice(0, 240) || `HTTP ${response.status}`;
    const error = new Error(`Gemini generateContent failed: ${response.status} ${message}`);
    error.status = response.status;
    error.provider_error = summarizeProviderError(response.status, json);
    throw error;
  }
  return json;
}
