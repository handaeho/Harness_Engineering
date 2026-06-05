const STAGE = "v2.0.0-beta-provider-canary-openai-credentialed-rerun";

function isOpenAIBaseUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "api.openai.com";
  } catch {
    return false;
  }
}

export function checkProviderExecutionGuard({ stage, request, env = process.env }) {
  if (stage !== STAGE) {
    return { allowed: false, status: "blocked_by_stage_mismatch", reason: "stage mismatch" };
  }
  if (!env.OPENAI_API_KEY) {
    return { allowed: false, status: "blocked_by_missing_credential", reason: "OPENAI_API_KEY missing" };
  }
  if (!env.OPENAI_MODEL) {
    return { allowed: false, status: "blocked_by_missing_model", reason: "OPENAI_MODEL missing" };
  }
  if (!isOpenAIBaseUrl(env.OPENAI_BASE_URL)) {
    return { allowed: false, status: "blocked_by_network_target", reason: "OPENAI_BASE_URL must target api.openai.com" };
  }
  if (request.store !== false) {
    return { allowed: false, status: "blocked_by_store_policy", reason: "store:false is required" };
  }
  if (request.tools || request.tool_choice) {
    return { allowed: false, status: "blocked_by_tool_surface", reason: "tools are forbidden in this stage" };
  }
  if (request.mcp || request.web_search || request.file_search || request.computer_use || request.file_ids || request.attachments) {
    return { allowed: false, status: "blocked_by_builtin_tool_surface", reason: "built-in, MCP, file, web, or computer tool fields are forbidden in this stage" };
  }
  if (request.response_format || request.text?.format) {
    return { allowed: false, status: "blocked_by_structured_output_surface", reason: "structured output is forbidden in this stage" };
  }
  if (request.text?.format?.type === "json_schema") {
    return { allowed: false, status: "blocked_by_structured_output_surface", reason: "text.format json_schema is forbidden in this stage" };
  }
  if (request.previous_response_id || request.metadata || request.include) {
    return { allowed: false, status: "blocked_by_disallowed_field", reason: "stateful or metadata fields are forbidden in this stage" };
  }
  if (!Number.isInteger(request.max_output_tokens) || request.max_output_tokens < 1 || request.max_output_tokens > 256) {
    return { allowed: false, status: "blocked_by_token_bound", reason: "max_output_tokens must be an integer between 1 and 256" };
  }

  return {
    allowed: true,
    status: "allowed",
    reason: "OpenAI no-tool text-only provider canary guard passed",
    local_model_execution: false,
    external_side_effects: false
  };
}
