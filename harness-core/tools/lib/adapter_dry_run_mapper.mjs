export function providerKeyForAdapter(adapterId) {
  if (adapterId.startsWith("openai.")) return "openai";
  if (adapterId.startsWith("gemini.")) return "gemini";
  if (adapterId.startsWith("vllm.")) return "vllm";
  if (adapterId.startsWith("ollama.")) return "ollama";
  return null;
}

export function valueAtPath(object, pathParts) {
  let current = object;
  for (const part of pathParts) {
    if (!current || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

export function runAdapterDryCase(testCase, adaptersById, capabilityMatrix) {
  const failures = [];
  const adapter = adaptersById.get(testCase.adapter_id);
  if (!adapter) {
    failures.push("adapter_id has no loaded adapter skeleton");
  } else {
    if (!["skeleton", "dry_run_checked"].includes(adapter.status)) {
      failures.push(`adapter status is not allowed for dry-run: ${adapter.status}`);
    }
    for (const key of ["message_mapping", "tool_mapping", "structured_output_mapping"]) {
      if (!adapter[key] || typeof adapter[key] !== "object") {
        failures.push(`adapter missing mapping object: ${key}`);
      }
    }
  }

  const providerKey = providerKeyForAdapter(testCase.adapter_id);
  const provider = providerKey ? capabilityMatrix.providers?.[providerKey] : null;
  if (!provider) {
    failures.push("capability matrix has no provider entry for adapter");
  }

  for (const feature of testCase.unsupported_features_must_remain_false || []) {
    const providerValue = provider ? provider[feature] : undefined;
    if (providerValue === true || providerValue === "true" || providerValue === "verified" || providerValue === "production" || providerValue === "production_monitored" || providerValue === "integration_verified") {
      failures.push(`unsupported feature was upgraded: ${feature}=${providerValue}`);
    }
  }

  if (testCase.claim_allowed_after_pass !== "adapter-checked") {
    failures.push("fixture claim_allowed_after_pass must remain adapter-checked as future runner claim");
  }

  const blocked = new Set(testCase.claim_not_allowed || []);
  for (const claim of ["integration-verified", "provider-diverse", "replay-verified", "production-monitored"]) {
    if (!blocked.has(claim)) failures.push(`fixture missing blocked claim: ${claim}`);
  }

  return {
    case_id: testCase.case_id,
    adapter_id: testCase.adapter_id,
    status: failures.length === 0 ? "pass" : "fail",
    failures
  };
}
