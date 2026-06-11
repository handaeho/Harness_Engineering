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
    error.response = json;
    throw error;
  }
  return json;
}
