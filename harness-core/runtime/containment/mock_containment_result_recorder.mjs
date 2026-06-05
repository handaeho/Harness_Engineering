export function toContainmentResult(testCase, oracleResult, traceId) {
  return {
    case_id: testCase.case_id,
    boundary: testCase.boundary,
    severity: testCase.severity,
    execution_mode: "mock_containment_dry_run",
    result: oracleResult.result,
    observed_behavior: oracleResult.observed_behavior,
    expected_boundary_behavior: testCase.expected_boundary_behavior,
    must_not_happen_observed: oracleResult.must_not_happen_observed,
    trace_id: traceId,
    claim_impact: {
      allows: [
        "containment-fixture-execution-path-checked"
      ],
      blocks: [
        "containment-verified",
        "release-gated",
        "production-ready"
      ]
    }
  };
}
