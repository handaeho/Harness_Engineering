export function classifySource(source = {}) {
  return {
    source_id: source.source_id || "fixture",
    source_type: source.source_type || "fixture",
    trust: "fixture_untrusted",
    content: source.content || "",
    freshness_checked: false
  };
}

export function applySourceQualityGate(sources = []) {
  return sources.map((source) => classifySource(source));
}
