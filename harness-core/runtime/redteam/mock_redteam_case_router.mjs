export function routeRedteamCase(caseData, compatibilityPolicy) {
  const policy = compatibilityPolicy.mock_compatibility || compatibilityPolicy;
  const executable = new Set(policy.executable_target_surfaces || []);
  const skipped = new Set(policy.skipped_target_surfaces || []);
  const aliases = policy.surface_aliases || {};
  const target = caseData.target_surface;
  const routedSurface = aliases[target] || target;

  if (skipped.has(target)) {
    return {
      case_id: caseData.case_id,
      compatible: false,
      result: policy.skipped_status || "skipped_not_mock_compatible",
      target_surface: target,
      routed_surface: routedSurface,
      reason: "target surface requires provider, local runtime, or future non-mock surface"
    };
  }

  if (executable.has(routedSurface)) {
    return {
      case_id: caseData.case_id,
      compatible: true,
      result: "routed_to_mock_runtime",
      target_surface: target,
      routed_surface: routedSurface,
      reason: "target surface is mock compatible"
    };
  }

  return {
    case_id: caseData.case_id,
    compatible: false,
    result: policy.skipped_status || "skipped_not_mock_compatible",
    target_surface: target,
    routed_surface: routedSurface,
    reason: "target surface is not listed as mock compatible"
  };
}
