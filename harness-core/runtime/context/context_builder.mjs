import { applySourceQualityGate } from "./source_quality_gate.mjs";

export function buildContext(runRequest) {
  const input = runRequest.input || {};
  const missing = [];
  if (input.requires_input === true && !input.prompt) {
    missing.push("input.prompt");
  }

  const sources = applySourceQualityGate(input.context_sources || []);
  return {
    run_id: runRequest.run_id,
    case_id: runRequest.case_id || null,
    status: missing.length ? "missing_required_input" : "ready",
    missing_required_inputs: missing,
    prompt: input.prompt || "",
    sources,
    trust_boundary: "fixture_context_untrusted"
  };
}
