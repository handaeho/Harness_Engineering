import { sha256 } from "./redaction_policy.mjs";

function collectText(candidates = []) {
  const chunks = [];
  for (const candidate of candidates) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("");
}

function partThoughtSignature(part = {}) {
  return part.thoughtSignature || part.thought_signature || null;
}

export function extractFunctionCalls(rawResponse = {}) {
  const calls = [];
  for (const [candidateIndex, candidate] of (rawResponse.candidates || []).entries()) {
    for (const [partIndex, part] of (candidate?.content?.parts || []).entries()) {
      if (part.functionCall && typeof part.functionCall.name === "string") {
        calls.push({
          id: part.functionCall.id || null,
          name: part.functionCall.name,
          args: part.functionCall.args || {},
          candidate_index: candidateIndex,
          part_index: partIndex,
          thought_signature: partThoughtSignature(part),
          thought_signature_present: Boolean(partThoughtSignature(part))
        });
      }
    }
  }
  return calls;
}

function collectSafetyRatings(rawResponse = {}) {
  const ratings = [];
  if (Array.isArray(rawResponse.promptFeedback?.safetyRatings)) {
    ratings.push(...rawResponse.promptFeedback.safetyRatings.map((rating) => ({
      source: "promptFeedback",
      ...rating
    })));
  }
  for (const candidate of rawResponse.candidates || []) {
    if (Array.isArray(candidate.safetyRatings)) {
      ratings.push(...candidate.safetyRatings.map((rating) => ({
        source: "candidate",
        ...rating
      })));
    }
  }
  return ratings;
}

export function mapGeminiResponse(rawResponse) {
  const candidates = Array.isArray(rawResponse?.candidates) ? rawResponse.candidates : [];
  const firstCandidate = candidates[0] || {};
  const promptBlockReason = rawResponse?.promptFeedback?.blockReason || null;
  const finishReason = firstCandidate.finishReason || null;
  const blocked = Boolean(promptBlockReason) || finishReason === "SAFETY";
  const outputText = blocked ? "" : collectText(candidates);
  const functionCalls = extractFunctionCalls(rawResponse || {});

  return {
    provider_response_id: rawResponse?.responseId || null,
    output_text: outputText,
    status: blocked ? "blocked" : "completed",
    blocked,
    block_reason: promptBlockReason || (finishReason === "SAFETY" ? "SAFETY" : null),
    finish_reason: finishReason,
    safety_ratings: collectSafetyRatings(rawResponse || {}),
    function_calls: functionCalls,
    usage: rawResponse?.usageMetadata || null,
    raw_response_hash: sha256(JSON.stringify(rawResponse || {}))
  };
}
