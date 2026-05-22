import { containmentBoundary } from "./containment_boundary.mjs";

export function assertMockSandbox() {
  const boundary = containmentBoundary();
  if (boundary.provider_execution || boundary.local_model_execution || boundary.network_calls || boundary.external_side_effects) {
    throw new Error("mock sandbox boundary violated");
  }
  return boundary;
}
