export function containmentBoundary() {
  return {
    provider_execution: false,
    local_model_execution: false,
    network_calls: false,
    external_side_effects: false,
    allowed_mode: "mock_only"
  };
}
