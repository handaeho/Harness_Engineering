const SMART_QUOTE_PATTERN = /[\u2018\u2019\u201c\u201d\u00ab\u00bb]/u;
const MODEL_ID_PATTERN = /^[A-Za-z0-9._:-]+$/u;

export function checkOpenAIModelEnv({ request, env = process.env } = {}) {
  const model = env.OPENAI_MODEL;
  if (!model) {
    return { allowed: false, status: "blocked_by_missing_model", reason: "OPENAI_MODEL missing" };
  }
  if (request?.model && request.model !== model) {
    return { allowed: false, status: "blocked_by_model_mismatch", reason: "request.model does not match OPENAI_MODEL" };
  }
  if (model !== model.trim()) {
    return { allowed: false, status: "blocked_by_malformed_model_env", reason: "OPENAI_MODEL has leading or trailing whitespace" };
  }
  if (SMART_QUOTE_PATTERN.test(model)) {
    return { allowed: false, status: "blocked_by_malformed_model_env", reason: "OPENAI_MODEL contains smart quotes; use ASCII quotes or no quotes" };
  }
  if (!MODEL_ID_PATTERN.test(model)) {
    return { allowed: false, status: "blocked_by_malformed_model_env", reason: "OPENAI_MODEL contains characters outside the expected model id set" };
  }
  return { allowed: true, status: "model_env_allowed", reason: "OPENAI_MODEL syntax passed local guard" };
}
