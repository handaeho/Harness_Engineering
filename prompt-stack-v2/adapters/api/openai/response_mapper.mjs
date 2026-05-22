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

export function mapOpenAIResponse(rawResponse) {
  const outputText = typeof rawResponse.output_text === "string"
    ? rawResponse.output_text
    : collectTextFromOutput(rawResponse.output || []);

  const refusalSignal = JSON.stringify(rawResponse).includes("\"refusal\"")
    ? "refusal_field_present"
    : null;

  return {
    provider_response_id: rawResponse.id || null,
    output_text: outputText,
    status: rawResponse.status || null,
    finish_reason: rawResponse.finish_reason || null,
    usage: rawResponse.usage || null,
    refusal_signal: refusalSignal,
    raw_response_hash: sha256(JSON.stringify(rawResponse))
  };
}
