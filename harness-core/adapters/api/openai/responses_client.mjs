import { previewText } from "./redaction_policy.mjs";

function summarizeProviderError(status, body) {
  const errorBody = body?.error && typeof body.error === "object" ? body.error : {};
  return {
    status,
    type: typeof errorBody.type === "string" ? errorBody.type : null,
    code: typeof errorBody.code === "string" ? errorBody.code : null,
    param: typeof errorBody.param === "string" ? errorBody.param : null,
    message_preview: typeof errorBody.message === "string" ? previewText(errorBody.message, 220) : null
  };
}

export async function createTextOnlyResponse(request, env = process.env) {
  const baseUrl = (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const timeoutMs = Number.parseInt(env.OPENAI_TIMEOUT_MS || "30000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 30000);

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { parse_error: true, body_preview: text.slice(0, 300) };
    }

    if (!response.ok) {
      const error = new Error(`OpenAI Responses API returned HTTP ${response.status}`);
      error.status = response.status;
      error.provider_error = summarizeProviderError(response.status, body);
      throw error;
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}
