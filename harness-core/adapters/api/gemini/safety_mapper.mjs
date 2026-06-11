import { buildSystemInstruction, buildTextContent } from "./request_mapper.mjs";
import { mapGeminiResponse } from "./response_mapper.mjs";

const ALLOWED_SAFETY_CATEGORIES = new Set([
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_CIVIC_INTEGRITY"
]);

const ALLOWED_THRESHOLDS = new Set([
  "BLOCK_NONE",
  "BLOCK_ONLY_HIGH",
  "BLOCK_MEDIUM_AND_ABOVE",
  "BLOCK_LOW_AND_ABOVE",
  "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
]);

function endpointForModel(model, env) {
  if (!model) return null;
  const baseUrl = env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const normalized = model.startsWith("models/") ? model : `models/${model}`;
  return `${baseUrl.replace(/\/$/, "")}/${normalized}:generateContent`;
}

export function mapSafetySettingsRequest(testCase, env = process.env) {
  const model = env.GEMINI_MODEL || null;
  return {
    model,
    endpoint: endpointForModel(model, env),
    body: {
      contents: [buildTextContent(testCase.input)],
      systemInstruction: buildSystemInstruction("Handle the request safely and return only allowed content."),
      safetySettings: testCase.safety_settings,
      generationConfig: {
        maxOutputTokens: 64
      },
      store: false
    }
  };
}

export function assertSafetySettingsSurface(request) {
  const body = request.body || {};
  const safetySettings = Array.isArray(body.safetySettings) ? body.safetySettings : [];
  const categories = safetySettings.map((item) => item.category);
  const uniqueCategories = new Set(categories);
  const invalidSettings = safetySettings.filter((item) => !ALLOWED_SAFETY_CATEGORIES.has(item.category)
    || !ALLOWED_THRESHOLDS.has(item.threshold));

  return {
    ok: safetySettings.length > 0
      && invalidSettings.length === 0
      && uniqueCategories.size === categories.length
      && body.store === false
      && !body.tools
      && !body.toolConfig,
    native_gemini_surface: true,
    safety_settings_present: safetySettings.length > 0,
    unique_categories: uniqueCategories.size === categories.length,
    invalid_settings: invalidSettings,
    tools_present: Boolean(body.tools || body.toolConfig),
    store_false_enforced: body.store === false
  };
}

export function mapSafetyBlockedResponse(rawResponse) {
  const mapped = mapGeminiResponse(rawResponse);
  return {
    ...mapped,
    blocked_response_handled: mapped.blocked === true
      && typeof mapped.block_reason === "string"
      && mapped.output_text === ""
      && Array.isArray(mapped.safety_ratings)
  };
}
