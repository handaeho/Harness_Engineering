import { readJson } from "../../../tools/lib/file_walk.mjs";

const BUILTIN_TOOL_TYPES = new Set([
  "web_search",
  "web_search_preview",
  "file_search",
  "computer_use",
  "code_interpreter",
  "mcp",
  "remote_mcp"
]);

const TOOL_DESCRIPTIONS = {
  canary_lookup: "Lookup a fixed canary key from an in-memory deterministic fixture.",
  canary_calculator: "Run bounded deterministic arithmetic for canary validation."
};

export const TOOL_SCHEMA_PATHS = {
  canary_lookup: "adapters/api/openai/tool_schemas/canary_lookup.schema.json",
  canary_calculator: "adapters/api/openai/tool_schemas/canary_calculator.schema.json",
  blocked_external_post: "adapters/api/openai/tool_schemas/blocked_external_post.schema.json"
};

export function loadToolArgumentSchema(root, toolName) {
  const schemaPath = TOOL_SCHEMA_PATHS[toolName];
  if (!schemaPath) throw new Error(`Unknown tool schema: ${toolName}`);
  return readJson(`${root}/${schemaPath}`);
}

export function buildFunctionTool(root, toolName) {
  return {
    type: "function",
    name: toolName,
    description: TOOL_DESCRIPTIONS[toolName] || "Prompt stack v2 canary function.",
    parameters: loadToolArgumentSchema(root, toolName),
    strict: true
  };
}

export function mapToolCallingRequest(testCase, root, env = process.env) {
  const maxOutputTokens = Number.parseInt(env.OPENAI_MAX_OUTPUT_TOKENS || "192", 10);
  const boundedMaxOutputTokens = Number.isFinite(maxOutputTokens)
    ? Math.max(32, Math.min(maxOutputTokens, 512))
    : 192;

  return {
    model: env.OPENAI_MODEL,
    input: `${testCase.input}\nUse only the provided function tools. Do not use built-in tools. Do not produce a final answer before the tool call when a tool is requested.`,
    store: false,
    max_output_tokens: boundedMaxOutputTokens,
    tools: (testCase.tools_allowed || []).map((toolName) => buildFunctionTool(root, toolName))
  };
}

export function mapToolCallingFinalRequest({ initialResponse, toolOutputs, testCase, root, env = process.env }) {
  const maxOutputTokens = Number.parseInt(env.OPENAI_MAX_OUTPUT_TOKENS || "192", 10);
  const boundedMaxOutputTokens = Number.isFinite(maxOutputTokens)
    ? Math.max(32, Math.min(maxOutputTokens, 512))
    : 192;
  const priorOutput = Array.isArray(initialResponse?.output) ? initialResponse.output : [];
  const functionOutputs = toolOutputs.map((item) => ({
    type: "function_call_output",
    call_id: item.call_id,
    output: JSON.stringify(item.output)
  }));

  return {
    model: env.OPENAI_MODEL,
    input: [
      ...priorOutput,
      ...functionOutputs,
      {
        role: "user",
        content: `Return the final answer now. Include exactly this expected marker if available: ${testCase.expected_final_response_contains || "CANARY_TOOL_OK"}.`
      }
    ],
    store: false,
    max_output_tokens: boundedMaxOutputTokens,
    tools: (testCase.tools_allowed || []).map((toolName) => buildFunctionTool(root, toolName))
  };
}

export function assertToolCallingRequestSurface(request, allowedToolNames = []) {
  const disallowedFields = [
    "tool_choice",
    "response_format",
    "text",
    "previous_response_id",
    "metadata",
    "include",
    "mcp",
    "web_search",
    "file_search",
    "computer_use",
    "file_ids",
    "attachments"
  ].filter((field) => Object.prototype.hasOwnProperty.call(request, field));
  const tools = Array.isArray(request.tools) ? request.tools : [];
  const toolNames = tools.map((tool) => tool.name);
  const toolTypes = tools.map((tool) => tool.type);
  const builtInTools = tools.filter((tool) => BUILTIN_TOOL_TYPES.has(tool.type) || BUILTIN_TOOL_TYPES.has(tool.name));
  const nonFunctionTools = tools.filter((tool) => tool.type !== "function");
  const unallowlistedTools = toolNames.filter((name) => !allowedToolNames.includes(name));
  const schemasOk = tools.every((tool) => tool.parameters?.type === "object"
    && tool.parameters?.additionalProperties === false
    && Array.isArray(tool.parameters?.required)
    && tool.strict === true);

  return {
    ok: disallowedFields.length === 0
      && builtInTools.length === 0
      && nonFunctionTools.length === 0
      && unallowlistedTools.length === 0
      && schemasOk
      && request.store === false
      && Number.isInteger(request.max_output_tokens)
      && request.max_output_tokens >= 1
      && request.max_output_tokens <= 512,
    disallowed_fields: disallowedFields,
    tools_present: tools.length > 0,
    function_tools_used: tools.length > 0 && nonFunctionTools.length === 0,
    tool_names: toolNames,
    tool_types: toolTypes,
    built_in_tools_present: builtInTools.length > 0,
    unallowlisted_tools: unallowlistedTools,
    schemas_ok: schemasOk,
    store_false_enforced: request.store === false,
    max_output_tokens_bounded: Number.isInteger(request.max_output_tokens)
      && request.max_output_tokens >= 1
      && request.max_output_tokens <= 512,
    input_text_only: typeof request.input === "string" || Array.isArray(request.input)
  };
}
