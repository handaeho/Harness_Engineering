import { buildSystemInstruction, buildTextContent, canaryThinkingConfig } from "./request_mapper.mjs";
import { mapGeminiResponse } from "./response_mapper.mjs";

function boundedMaxOutputTokens(env) {
  const raw = Number.parseInt(env.GEMINI_MAX_OUTPUT_TOKENS || "256", 10);
  if (!Number.isFinite(raw)) return 256;
  return Math.max(16, Math.min(raw, 512));
}

export function mapStructuredOutputRequest(testCase, env = process.env) {
  const model = env.GEMINI_MODEL || null;
  const shape = env.GEMINI_STRUCTURED_OUTPUT_SHAPE || "responseJsonSchema";
  const thinkingConfig = canaryThinkingConfig(model, env);
  const generationConfig = {
    maxOutputTokens: boundedMaxOutputTokens(env),
    ...(thinkingConfig ? { thinkingConfig } : {})
  };
  if (shape === "responseFormat") {
    generationConfig.responseFormat = {
      text: {
        mimeType: "application/json",
        schema: testCase.schema
      }
    };
  } else {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = testCase.schema;
  }
  return {
    model,
    endpoint: model
      ? `${(env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "")}/${model.startsWith("models/") ? model : `models/${model}`}:generateContent`
      : null,
    body: {
      contents: [
        buildTextContent(`${testCase.input}\nReturn only JSON that matches the configured responseJsonSchema.`)
      ],
      systemInstruction: buildSystemInstruction("Return machine-readable JSON only. Do not call tools for this structured output request."),
      generationConfig,
      store: false
    }
  };
}

export function assertStructuredOutputRequestSurface(request) {
  const body = request.body || {};
  const generationConfig = body.generationConfig || {};
  const disallowed = [
    "tools",
    "toolConfig",
    "cachedContent"
  ].filter((field) => Object.prototype.hasOwnProperty.call(body, field));

  const schema = generationConfig.responseJsonSchema;
  const responseFormatSchema = generationConfig.responseFormat?.text?.schema;
  const responseFormatMimeType = generationConfig.responseFormat?.text?.mimeType;
  const strictJsonSchema = generationConfig.responseMimeType === "application/json"
    && schema
    && typeof schema === "object"
    && schema.type === "object";
  const strictResponseFormat = responseFormatMimeType === "application/json"
    && responseFormatSchema
    && typeof responseFormatSchema === "object"
    && responseFormatSchema.type === "object";
  const thinkingConfig = generationConfig.thinkingConfig || null;
  const thinkingConfigBounded = !thinkingConfig
    || thinkingConfig.thinkingLevel === "minimal"
    || thinkingConfig.thinkingLevel === "low"
    || Number.isInteger(thinkingConfig.thinkingBudget);

  return {
    ok: disallowed.length === 0
      && (strictJsonSchema || strictResponseFormat)
      && body.store === false
      && Number.isInteger(generationConfig.maxOutputTokens)
      && generationConfig.maxOutputTokens >= 1
      && generationConfig.maxOutputTokens <= 512
      && thinkingConfigBounded,
    disallowed_fields: disallowed,
    native_gemini_surface: true,
    tools_used: false,
    structured_output_used: Boolean(strictJsonSchema || strictResponseFormat),
    response_mime_type_json: generationConfig.responseMimeType === "application/json",
    response_json_schema_used: Boolean(schema),
    response_format_used: Boolean(generationConfig.responseFormat),
    response_format_json: responseFormatMimeType === "application/json",
    store_false_enforced: body.store === false,
    max_output_tokens_bounded: Number.isInteger(generationConfig.maxOutputTokens)
      && generationConfig.maxOutputTokens >= 1
      && generationConfig.maxOutputTokens <= 512,
    thinking_config_present: Boolean(thinkingConfig),
    thinking_config_bounded: thinkingConfigBounded
  };
}

export function parseStructuredOutputText(outputText) {
  if (typeof outputText !== "string" || outputText.trim() === "") {
    throw new Error("structured output text is empty");
  }
  return JSON.parse(outputText.trim());
}

export function mapStructuredOutputResponse(rawResponse) {
  const mapped = mapGeminiResponse(rawResponse);
  return {
    ...mapped,
    parsed_json: mapped.output_text ? parseStructuredOutputText(mapped.output_text) : null
  };
}
