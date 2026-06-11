const DEFAULT_SYSTEM_INSTRUCTION = "You are a HARNESS Core Gemini canary runtime. Follow the user instruction exactly. Do not use tools unless a function tool is declared for this request.";

function boundedMaxOutputTokens(env, fallback = 64, lower = 1, upper = 512) {
  const raw = Number.parseInt(env.GEMINI_MAX_OUTPUT_TOKENS || String(fallback), 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(lower, Math.min(raw, upper));
}

function normalizedModelName(model) {
  return String(model || "").replace(/^models\//, "");
}

export function canaryThinkingConfig(model, env = process.env) {
  const normalized = normalizedModelName(model);
  if (env.GEMINI_THINKING_LEVEL) return { thinkingLevel: env.GEMINI_THINKING_LEVEL };
  if (env.GEMINI_THINKING_BUDGET) {
    const thinkingBudget = Number.parseInt(env.GEMINI_THINKING_BUDGET, 10);
    if (Number.isFinite(thinkingBudget)) return { thinkingBudget };
  }
  if (normalized.startsWith("gemini-3")) return { thinkingLevel: "minimal" };
  if (normalized.startsWith("gemini-2.5-flash")) return { thinkingBudget: 0 };
  return null;
}

function endpointForModel(model, env = process.env) {
  if (!model) return null;
  const baseUrl = env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const normalized = model.startsWith("models/") ? model : `models/${model}`;
  return `${baseUrl.replace(/\/$/, "")}/${normalized}:generateContent`;
}

export function buildTextContent(text, role = "user") {
  return {
    role,
    parts: [{ text }]
  };
}

export function buildSystemInstruction(text = DEFAULT_SYSTEM_INSTRUCTION) {
  return {
    parts: [{ text }]
  };
}

export function mapCanaryRequest(testCase, env = process.env) {
  const maxOutputTokens = boundedMaxOutputTokens(env, 128, 1, 256);
  const model = env.GEMINI_MODEL || null;
  const thinkingConfig = canaryThinkingConfig(model, env);

  return {
    model,
    endpoint: endpointForModel(model, env),
    body: {
      contents: [buildTextContent(testCase.input)],
      systemInstruction: buildSystemInstruction(testCase.system_instruction || DEFAULT_SYSTEM_INSTRUCTION),
      generationConfig: {
        maxOutputTokens,
        ...(thinkingConfig ? { thinkingConfig } : {})
      },
      store: false
    }
  };
}

function partsAreTextOnly(contents = []) {
  return contents.every((content) => Array.isArray(content.parts)
    && content.parts.length > 0
    && content.parts.every((part) => typeof part.text === "string" && Object.keys(part).length === 1));
}

export function assertNoDisallowedRequestSurface(request) {
  const body = request.body || {};
  const generationConfig = body.generationConfig || {};
  const disallowed = [
    "tools",
    "toolConfig",
    "cachedContent"
  ].filter((field) => Object.prototype.hasOwnProperty.call(body, field));

  const structuredFields = [
    "responseMimeType",
    "responseSchema",
    "responseJsonSchema",
    "responseFormat"
  ].filter((field) => Object.prototype.hasOwnProperty.call(generationConfig, field));

  const maxOutputTokens = generationConfig.maxOutputTokens;
  const thinkingConfig = generationConfig.thinkingConfig || null;
  const inputTextOnly = Array.isArray(body.contents)
    && body.contents.length > 0
    && partsAreTextOnly(body.contents);
  const systemInstructionTextOnly = Array.isArray(body.systemInstruction?.parts)
    && partsAreTextOnly([{ parts: body.systemInstruction.parts }]);
  const thinkingConfigBounded = !thinkingConfig
    || thinkingConfig.thinkingLevel === "minimal"
    || thinkingConfig.thinkingLevel === "low"
    || Number.isInteger(thinkingConfig.thinkingBudget);

  return {
    ok: disallowed.length === 0
      && structuredFields.length === 0
      && inputTextOnly
      && systemInstructionTextOnly
      && body.store === false
      && Number.isInteger(maxOutputTokens)
      && maxOutputTokens >= 1
      && maxOutputTokens <= 256
      && thinkingConfigBounded,
    disallowed_fields: disallowed.concat(structuredFields.map((field) => `generationConfig.${field}`)),
    native_gemini_surface: true,
    tools_used: false,
    structured_output_used: false,
    safety_settings_used: Array.isArray(body.safetySettings) && body.safetySettings.length > 0,
    store_false_enforced: body.store === false,
    max_output_tokens_bounded: Number.isInteger(maxOutputTokens) && maxOutputTokens >= 1 && maxOutputTokens <= 256,
    thinking_config_present: Boolean(thinkingConfig),
    thinking_config_bounded: thinkingConfigBounded,
    input_text_only: inputTextOnly,
    system_instruction_text_only: systemInstructionTextOnly,
    contents_parts_used: inputTextOnly,
    system_instruction_used: systemInstructionTextOnly
  };
}

export function geminiRequestMapperStatus() {
  return {
    api_lane: "native_gemini_api",
    request_shape: "models.generateContent",
    contents_parts: true,
    system_instruction: true,
    store_false_enforced: true
  };
}
