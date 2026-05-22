const STAGE = "v2.0.0-beta-tool-calling-canary-openai";
const ALLOWED_FUNCTION_TOOLS = new Set(["canary_lookup", "canary_calculator"]);
const BUILTIN_TOOL_TYPES = new Set([
  "web_search",
  "web_search_preview",
  "file_search",
  "computer_use",
  "code_interpreter",
  "mcp",
  "remote_mcp"
]);

function isOpenAIBaseUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "api.openai.com";
  } catch {
    return false;
  }
}

export function checkToolCallingExecutionGuard({ stage, request, env = process.env }) {
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
  if (!Number.isInteger(request.max_output_tokens) || request.max_output_tokens < 1 || request.max_output_tokens > 512) {
    return { allowed: false, status: "blocked_by_token_bound", reason: "max_output_tokens must be an integer between 1 and 512" };
  }
  if (!Array.isArray(request.tools) || request.tools.length === 0) {
    return { allowed: false, status: "blocked_by_missing_function_tools", reason: "function tools are required" };
  }
  if (request.tool_choice || request.response_format || request.text || request.previous_response_id || request.metadata || request.include) {
    return { allowed: false, status: "blocked_by_disallowed_field", reason: "tool_choice, structured output, state, metadata, and include fields are forbidden" };
  }
  if (request.mcp || request.web_search || request.file_search || request.computer_use || request.file_ids || request.attachments) {
    return { allowed: false, status: "blocked_by_builtin_tool_surface", reason: "MCP, file, web, and computer tool fields are forbidden" };
  }

  for (const tool of request.tools) {
    if (tool.type !== "function") {
      return { allowed: false, status: "blocked_by_non_function_tool", reason: `non-function tool type: ${tool.type}` };
    }
    if (BUILTIN_TOOL_TYPES.has(tool.type) || BUILTIN_TOOL_TYPES.has(tool.name)) {
      return { allowed: false, status: "blocked_by_builtin_tool", reason: `built-in tool is forbidden: ${tool.name || tool.type}` };
    }
    if (!ALLOWED_FUNCTION_TOOLS.has(tool.name)) {
      return { allowed: false, status: "blocked_by_unallowlisted_tool", reason: `tool not allowlisted: ${tool.name}` };
    }
    if (tool.parameters?.type !== "object" || tool.parameters?.additionalProperties !== false || !Array.isArray(tool.parameters?.required)) {
      return { allowed: false, status: "blocked_by_schema_policy", reason: `tool schema is not strict object schema: ${tool.name}` };
    }
  }

  return {
    allowed: true,
    status: "allowed",
    reason: "OpenAI tool-calling canary guard passed",
    local_model_execution: false,
    external_side_effects: false
  };
}
