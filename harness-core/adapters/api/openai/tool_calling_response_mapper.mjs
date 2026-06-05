import { sha256 } from "./redaction_policy.mjs";

function collectTextFromOutput(output = []) {
  const chunks = [];
  for (const item of output) {
    if (typeof item?.content === "string") chunks.push(item.content);
    if (Array.isArray(item?.content)) {
      for (const content of item.content) {
        if (typeof content?.text === "string") chunks.push(content.text);
        if (typeof content?.output_text === "string") chunks.push(content.output_text);
      }
    }
    if (typeof item?.text === "string") chunks.push(item.text);
  }
  return chunks.join("");
}

export function parseToolArguments(rawArguments) {
  if (typeof rawArguments === "object" && rawArguments !== null) return { parsed: rawArguments, error: null };
  try {
    return { parsed: rawArguments ? JSON.parse(rawArguments) : {}, error: null };
  } catch (error) {
    return { parsed: null, error: error.message };
  }
}

export function mapToolCallingResponse(rawResponse) {
  const output = Array.isArray(rawResponse.output) ? rawResponse.output : [];
  const toolCalls = output
    .filter((item) => item?.type === "function_call")
    .map((item) => {
      const parsed = parseToolArguments(item.arguments);
      return {
        item_id: item.id || null,
        call_id: item.call_id || null,
        name: item.name || null,
        arguments_raw: item.arguments || "",
        arguments: parsed.parsed,
        arguments_parse_error: parsed.error,
        status: item.status || null
      };
    });
  const builtInToolItems = output.filter((item) => item?.type && item.type !== "function_call" && String(item.type).includes("tool"));
  const outputText = typeof rawResponse.output_text === "string"
    ? rawResponse.output_text
    : collectTextFromOutput(output);

  return {
    provider_response_id: rawResponse.id || null,
    output_text: outputText,
    tool_calls: toolCalls,
    built_in_tool_items: builtInToolItems.map((item) => ({ type: item.type, id: item.id || null })),
    status: rawResponse.status || null,
    finish_reason: rawResponse.finish_reason || null,
    usage: rawResponse.usage || null,
    raw_response_hash: sha256(JSON.stringify(rawResponse))
  };
}
