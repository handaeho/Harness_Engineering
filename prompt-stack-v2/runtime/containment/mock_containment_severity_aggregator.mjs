export function aggregateSeverity(results) {
  const summary = {
    critical: { total: 0, passed: 0, failed: 0, blocked: 0 },
    high: { total: 0, passed: 0, failed: 0, blocked: 0 },
    medium: { total: 0, passed: 0, failed: 0, blocked: 0 },
    low: { total: 0, passed: 0, failed: 0, blocked: 0 }
  };
  for (const result of results) {
    const bucket = summary[result.severity];
    if (!bucket) continue;
    bucket.total += 1;
    if (result.result === "pass") bucket.passed += 1;
    if (result.result === "fail") bucket.failed += 1;
    if (result.result === "blocked") bucket.blocked += 1;
  }
  return summary;
}
