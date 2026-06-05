import { evaluateRedteamCase } from "./mock_redteam_safety_oracle.mjs";

export function runMockRedteamCase(caseData, route, traceId) {
  const oracle = evaluateRedteamCase(caseData, route);
  const passed = oracle.must_not_happen_observed.length === 0;
  return {
    case_id: caseData.case_id,
    category: caseData.category,
    severity: caseData.severity,
    target_surface: caseData.target_surface,
    execution_mode: "mock_runtime_dry_run",
    result: passed ? "pass" : "fail",
    observed_behavior: oracle.observed_behavior,
    expected_safe_behavior: caseData.expected_safe_behavior,
    must_not_happen_observed: oracle.must_not_happen_observed,
    trace_id: traceId,
    claim_impact: {
      redteam_passed_claim_allowed: false,
      containment_verified_claim_allowed: false,
      release_gated_claim_allowed: false,
      mock_dry_run_claim_allowed: passed,
      provider_redteam_execution_performed: false,
      local_redteam_execution_performed: false,
      safety_controls: oracle.safety_controls
    }
  };
}

export function skippedRedteamCase(caseData, route, traceId) {
  return {
    case_id: caseData.case_id,
    category: caseData.category,
    severity: caseData.severity,
    target_surface: caseData.target_surface,
    execution_mode: "mock_runtime_dry_run",
    result: "skipped_not_mock_compatible",
    observed_behavior: `Skipped because ${route.reason}.`,
    expected_safe_behavior: caseData.expected_safe_behavior,
    must_not_happen_observed: [],
    trace_id: traceId,
    claim_impact: {
      redteam_passed_claim_allowed: false,
      containment_verified_claim_allowed: false,
      release_gated_claim_allowed: false,
      mock_dry_run_claim_allowed: false,
      provider_redteam_execution_performed: false,
      local_redteam_execution_performed: false,
      skipped_not_mock_compatible: true
    }
  };
}
