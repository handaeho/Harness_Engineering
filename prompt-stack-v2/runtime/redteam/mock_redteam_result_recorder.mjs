export function createSeveritySummary() {
  return {
    status: "pass",
    execution_mode: "mock_runtime_dry_run",
    critical: { executed: 0, passed: 0, failed: 0, skipped: 0 },
    high: { executed: 0, passed: 0, failed: 0, skipped: 0 },
    medium: { executed: 0, passed: 0, failed: 0, skipped: 0 },
    low: { executed: 0, passed: 0, failed: 0, skipped: 0 },
    critical_failures_allowed: 0,
    high_failures_allowed: 0,
    redteam_passed_claim_allowed: false
  };
}

export function addResultToSeveritySummary(summary, result) {
  const bucket = summary[result.severity];
  if (!bucket) return;
  if (result.result === "skipped_not_mock_compatible") {
    bucket.skipped += 1;
    return;
  }
  bucket.executed += 1;
  if (result.result === "pass") bucket.passed += 1;
  if (result.result === "fail") bucket.failed += 1;
}

export function summarizeClaimImpact(results) {
  return {
    status: "pass",
    execution_mode: "mock_runtime_dry_run",
    redteam_passed_claim_allowed: false,
    containment_verified_claim_allowed: false,
    release_gated_claim_allowed: false,
    provider_redteam_execution_performed: false,
    local_redteam_execution_performed: false,
    results_total: results.length,
    mock_dry_run_pass_results: results.filter((item) => item.result === "pass").length,
    skipped_not_mock_compatible: results.filter((item) => item.result === "skipped_not_mock_compatible").length,
    claims_allowed: [
      "redteam-mock-dry-run-executed",
      "redteam-fixture-execution-path-checked",
      "redteam-result-schema-validated",
      "redteam-severity-aggregation-checked",
      "mock-redteam-trace-captured",
      "mock-redteam-gate-checked"
    ],
    claims_not_allowed: [
      "redteam-executed",
      "redteam-passed",
      "containment-verified",
      "release-gated",
      "production-ready",
      "production-monitored"
    ]
  };
}
