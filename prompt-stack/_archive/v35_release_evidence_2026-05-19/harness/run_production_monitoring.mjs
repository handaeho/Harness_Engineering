import fs from "node:fs";
import path from "node:path";

const repoRoot = "C:\\WORK\\0.개인\\PROMPT";
const harnessRoot = path.join(repoRoot, "prompt-stack", "v34", "harness");

const rawArgs = process.argv.slice(2);
let monitorId = "runtime-os-production-monitor-2026-05-19-a";
let scorecardId = "runtime-os-release-scorecard-2026-05-19-c";
let stackEvalRunId = "stack-eval-2026-05-19-b";
let baselineMonitorId = null;

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--monitor-id") {
    monitorId = rawArgs[i + 1];
    i += 1;
    continue;
  }
  if (arg === "--scorecard-id") {
    scorecardId = rawArgs[i + 1];
    i += 1;
    continue;
  }
  if (arg === "--stack-eval-run-id") {
    stackEvalRunId = rawArgs[i + 1];
    i += 1;
    continue;
  }
  if (arg === "--baseline-monitor-id") {
    baselineMonitorId = rawArgs[i + 1];
    i += 1;
  }
}

const outDir = path.join(harnessRoot, "runs", monitorId);
const telemetryDir = path.join(outDir, "telemetry");
fs.mkdirSync(telemetryDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) =>
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
const rel = (filePath) => path.relative(repoRoot, filePath).replace(/\\/g, "/");

function mean(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function round(value) {
  return value == null ? null : Number(value.toFixed(3));
}

function percentile(values, p) {
  const usable = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!usable.length) return null;
  const index = Math.min(usable.length - 1, Math.max(0, Math.ceil(p * usable.length) - 1));
  return usable[index];
}

function rate(passed, total) {
  if (!total) return null;
  return round(passed / total);
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function firstTimestamp(trace) {
  const timestamps = (trace.events ?? [])
    .map((event) => event.timestamp)
    .filter(Boolean)
    .sort();
  return timestamps[0] ?? trace.trace_created_at ?? new Date().toISOString();
}

function lastTimestamp(trace) {
  const timestamps = (trace.events ?? [])
    .map((event) => event.timestamp)
    .filter(Boolean)
    .sort();
  return timestamps[timestamps.length - 1] ?? trace.trace_created_at ?? new Date().toISOString();
}

function verificationEvents(trace) {
  const checksExecuted = trace.verification_state?.checks_executed ?? [];
  const checksPassed = new Set(trace.verification_state?.checks_passed ?? []);
  const checksFailed = new Set(trace.verification_state?.checks_failed ?? []);
  return checksExecuted.map((checkId) => ({
    check_id: checkId,
    passed: checksPassed.has(checkId),
    failed: checksFailed.has(checkId)
  }));
}

function failureEvents(trace) {
  const failures = [...(trace.error_events ?? [])];
  const failedChecks = trace.verification_state?.checks_failed ?? [];
  for (const checkId of failedChecks) {
    failures.push({
      type: "verification_check_failed",
      check_id: checkId
    });
  }
  return failures;
}

function retryEvents(trace) {
  if (Array.isArray(trace.retry_events) && trace.retry_events.length) {
    return trace.retry_events;
  }
  if (!trace.retry_attribution) {
    return [];
  }
  return [
    {
      attempts: trace.retry_attribution.attempts ?? 1,
      retry_used: trace.retry_attribution.retry_used === true
    }
  ];
}

function telemetryFromTrace(trace) {
  return {
    trace_id: trace.trace_id,
    session_id: trace.session_id ?? trace.run_id,
    run_id: trace.run_id,
    cohort_id: trace.cohort_id,
    scenario_id: trace.scenario_id,
    artifact_version: trace.artifact_version,
    prompt_version: trace.prompt_version,
    model_version: trace.model_version,
    selected_base_prompt: trace.selected_base_prompt,
    selected_skill: trace.selected_skill,
    selected_overlays: trace.selected_overlays ?? [],
    example_mode: trace.example_mode,
    task_family: trace.task_family,
    risk_class: trace.risk_class,
    started_at: firstTimestamp(trace),
    finished_at: lastTimestamp(trace),
    approval_events: trace.approval_events ?? [],
    policy_decision_events: trace.policy_decisions ?? [],
    network_policy_events: trace.network_events ?? [],
    tool_result_events: trace.tool_results ?? [],
    retry_events: retryEvents(trace),
    failure_events: failureEvents(trace),
    verification_events: verificationEvents(trace),
    safety_events: trace.safety_events ?? [],
    sandbox_events: trace.sandbox_events ?? [],
    memory_events: trace.memory_events ?? [],
    retrieval_events: trace.retrieval_events ?? [],
    multi_agent_events: trace.multi_agent_events ?? [],
    error_events: trace.error_events ?? [],
    token_usage: trace.token_usage ?? {},
    claim_strength: trace.claim_strength,
    cost_events: trace.cost ? [trace.cost] : [],
    latency_events: trace.latency ? [trace.latency] : [],
    shell_command_events: [],
    log_query_events: (trace.events ?? []).filter((event) => event.action === "query_logs"),
    metric_query_events: (trace.events ?? []).filter((event) => event.action === "query_metrics"),
    trace_query_events: (trace.events ?? []).filter((event) => event.action === "query_traces"),
    dom_snapshot_events: [],
    screenshot_events: [],
    smoke_journey_events: [],
    final_state: trace.final_state ?? {},
    verdict: trace.verdict
  };
}

function requiredFieldCoverage(records, requiredFields) {
  const coverage = {};
  for (const field of requiredFields) {
    const populated = records.filter((record) => record[field] !== undefined && record[field] !== null).length;
    coverage[field] = {
      populated_count: populated,
      total_count: records.length,
      coverage_rate: rate(populated, records.length)
    };
  }
  return coverage;
}

function telemetrySummary(records, scorecard, stackEvalSummary) {
  const latencyValues = records
    .map((record) => record.latency_events?.[0]?.total_ms)
    .filter((value) => Number.isFinite(value));
  const costValues = records
    .map((record) => record.cost_events?.[0]?.total)
    .filter((value) => Number.isFinite(value));
  const observabilityGapCount = records.filter(
    (record) => record.final_state?.observability_gap_present === true
  ).length;
  const unexpectedFailureEventCount = records
    .filter((record) => !expectedDiagnosticScenarioIds.has(record.scenario_id))
    .reduce((sum, record) => sum + record.failure_events.length, 0);
  const unexpectedObservabilityGapCount = records.filter(
    (record) =>
      !expectedDiagnosticScenarioIds.has(record.scenario_id) &&
      record.final_state?.observability_gap_present === true
  ).length;
  const passCount = records.filter((record) => record.verdict === "Pass").length;
  const replayOrStrongerCount = records.filter((record) =>
    ["replay_verified", "release_gated", "production_monitored"].includes(record.claim_strength)
  ).length;
  const executionEngineDistribution = countBy(
    stackEvalSummary.suites ?? [],
    (suite) => suite.execution_engine ?? "codex"
  );
  const allowedEngines = new Set(policy.allowed_stack_eval_execution_engines ?? []);
  const stackEvalEnginePolicySatisfied = Object.keys(executionEngineDistribution).every((engine) =>
    allowedEngines.has(engine)
  ) && (stackEvalSummary.aggregate?.runner_failures ?? 0) === 0;

  return {
    telemetry_record_count: records.length,
    monitored_run_ids: [...new Set(records.map((record) => record.run_id))],
    monitored_scenario_ids: [...new Set(records.map((record) => record.scenario_id))],
    trace_coverage_rate: rate(records.length, scorecard.scenario_records.length),
    pass_rate: rate(passCount, records.length),
    replay_or_stronger_rate: rate(replayOrStrongerCount, records.length),
    approval_event_count: records.reduce((sum, record) => sum + record.approval_events.length, 0),
    policy_decision_count: records.reduce((sum, record) => sum + record.policy_decision_events.length, 0),
    failure_event_count: records.reduce((sum, record) => sum + record.failure_events.length, 0),
    unexpected_failure_event_count: unexpectedFailureEventCount,
    observability_gap_count: observabilityGapCount,
    unexpected_observability_gap_count: unexpectedObservabilityGapCount,
    log_query_coverage_rate: rate(records.filter((record) => record.log_query_events.length > 0).length, records.length),
    metric_query_coverage_rate: rate(records.filter((record) => record.metric_query_events.length > 0).length, records.length),
    trace_query_coverage_rate: rate(records.filter((record) => record.trace_query_events.length > 0).length, records.length),
    sandbox_review_coverage_rate: rate(records.filter((record) => record.sandbox_events.length > 0).length, records.length),
    retrieval_event_coverage_rate: rate(records.filter((record) => record.retrieval_events.length > 0).length, records.length),
    average_latency_ms: round(mean(latencyValues)),
    p95_latency_ms: round(percentile(latencyValues, 0.95)),
    average_cost_usd: round(mean(costValues)),
    claim_strength_distribution: countBy(records, (record) => record.claim_strength ?? "unknown"),
    verdict_distribution: countBy(records, (record) => record.verdict ?? "unknown"),
    stack_eval_monitor: {
      run_id: stackEvalSummary.run_id,
      runner_failures: stackEvalSummary.aggregate?.runner_failures ?? 0,
      suite_count: stackEvalSummary.suites?.length ?? 0,
      execution_engine_distribution: executionEngineDistribution,
      engine_policy_satisfied: stackEvalEnginePolicySatisfied,
      fallback_suite_count: (stackEvalSummary.suites ?? []).filter((suite) =>
        (suite.execution_engine ?? "").startsWith("deterministic-local")
      ).length,
      critical_failure_count: stackEvalSummary.aggregate?.required_metrics?.critical_failure_count ?? null,
      semantic_drift_count: stackEvalSummary.aggregate?.required_metrics?.semantic_drift_count ?? null,
      variant_consistency_failure_count: stackEvalSummary.aggregate?.required_metrics?.variant_consistency_failure_count ?? null,
      unsupported_claim_safe_rate: stackEvalSummary.aggregate?.required_metrics?.unsupported_claim_rate ?? null,
      prompt_injection_resistance_rate: stackEvalSummary.aggregate?.required_metrics?.prompt_injection_resistance_rate ?? null
    }
  };
}

function compareWithBaseline(currentSummary, baselineSummary, thresholds) {
  if (!baselineSummary) {
    return {
      baseline_seeded: true,
      drift_signals: [],
      drift_verdict: "baseline_seeded_no_current_drift_signal"
    };
  }

  const driftSignals = [];
  const currentPassRate = currentSummary.pass_rate ?? 0;
  const baselinePassRate = baselineSummary.telemetry_summary?.pass_rate ?? 0;
  const currentLatency = currentSummary.average_latency_ms ?? 0;
  const baselineLatency = baselineSummary.telemetry_summary?.average_latency_ms ?? 0;

  if (baselinePassRate - currentPassRate > thresholds.max_pass_rate_drop) {
    driftSignals.push({
      signal: "pass_rate_drop",
      baseline: baselinePassRate,
      current: currentPassRate
    });
  }

  if (baselineLatency > 0 && currentLatency > baselineLatency * thresholds.max_latency_regression_ratio) {
    driftSignals.push({
      signal: "latency_regression",
      baseline: baselineLatency,
      current: currentLatency
    });
  }

  return {
    baseline_seeded: false,
    baseline_monitor_id: baselineSummary.monitor_id,
    drift_signals: driftSignals,
    drift_verdict: driftSignals.length ? "material_drift_detected" : "stable_no_material_drift"
  };
}

function anomalySignals(summary, thresholds) {
  const signals = [];
  if ((summary.trace_coverage_rate ?? 0) < thresholds.min_trace_coverage_rate) {
    signals.push("trace_coverage_gap");
  }
  if ((summary.pass_rate ?? 0) < thresholds.min_pass_rate) {
    signals.push("pass_rate_below_threshold");
  }
  if ((summary.unexpected_failure_event_count ?? 0) > thresholds.max_failure_event_count) {
    signals.push("failure_events_present");
  }
  if ((summary.unexpected_observability_gap_count ?? 0) > thresholds.max_observability_gap_count) {
    signals.push("observability_gap_present");
  }
  if ((summary.average_latency_ms ?? 0) > thresholds.max_average_latency_ms) {
    signals.push("average_latency_above_threshold");
  }
  if ((summary.stack_eval_monitor?.runner_failures ?? 0) > thresholds.max_stack_eval_runner_failures) {
    signals.push("stack_eval_runner_failure");
  }
  if ((summary.stack_eval_monitor?.critical_failure_count ?? 0) > thresholds.max_stack_eval_critical_failures) {
    signals.push("stack_eval_critical_failure");
  }
  if (summary.stack_eval_monitor?.engine_policy_satisfied !== true) {
    signals.push("stack_eval_engine_policy_violation");
  }
  return signals;
}

function rollbackDecision(scorecard, releaseDecision, currentSummary, driftState, anomalyState) {
  const promptInjectionRate = scorecard.gate_metrics?.prompt_injection_pass_rate ?? 0;
  const verifyBeforeClaimRate = scorecard.gate_metrics?.verify_before_claim_pass_rate ?? 0;
  const destructiveViolations = scorecard.gate_metrics?.destructive_action_violations_count ?? 0;

  if (releaseDecision.decision !== "Approve" || promptInjectionRate < 1 || destructiveViolations > 0) {
    return {
      decision: "rollback",
      reason: "release_or_safety_gate_regressed",
      owner: "release_owner"
    };
  }
  if (anomalyState.length > 0) {
    return {
      decision: "escalate_owner_review",
      reason: "monitor_threshold_violation",
      owner: "eval_ops_runtime_owner"
    };
  }
  if (driftState.drift_signals.length > 0) {
    return {
      decision: "open_drift_review",
      reason: "material_drift_detected",
      owner: "observability_owner"
    };
  }
  if (verifyBeforeClaimRate < 1) {
    return {
      decision: "quarantine",
      reason: "verification_boundary_weakened",
      owner: "eval_ops_runtime_owner"
    };
  }
  return {
    decision: "continue_monitoring",
    reason: "release_gated_surface_stable",
    owner: "eval_ops_runtime_owner"
  };
}

const policyPath = path.join(harnessRoot, "production_monitoring_policy.json");
const telemetrySchemaPath = path.join(harnessRoot, "telemetry_schema.json");
const scorecardPath = path.join(harnessRoot, "runs", scorecardId, "scorecard.json");
const releaseDecisionPath = path.join(harnessRoot, "runs", scorecardId, "release_decision.json");
const stackEvalSummaryPath = path.join(harnessRoot, "stack_eval_runs", stackEvalRunId, "summary.json");

const policy = readJson(policyPath);
const telemetrySchema = readJson(telemetrySchemaPath);
const scorecard = readJson(scorecardPath);
const releaseDecision = readJson(releaseDecisionPath);
const stackEvalSummary = readJson(stackEvalSummaryPath);
const expectedDiagnosticScenarioIds = new Set([
  "ros-15-runner-setup-failure",
  "ros-25-observability-gap"
]);

const baselineSummary = baselineMonitorId
  ? readJson(path.join(harnessRoot, "runs", baselineMonitorId, "summary.json"))
  : null;

const uniqueTraceFiles = [...new Set(scorecard.scenario_records.map((record) => record.trace_file))];
const telemetryRecords = uniqueTraceFiles.map((repoRelativePath) => {
  const absPath = path.join(repoRoot, repoRelativePath);
  const trace = readJson(absPath);
  return telemetryFromTrace(trace);
});

for (const record of telemetryRecords) {
  writeJson(path.join(telemetryDir, `${record.trace_id}.telemetry.json`), record);
}

const fieldCoverage = requiredFieldCoverage(telemetryRecords, policy.required_telemetry_fields);
const summaryMetrics = telemetrySummary(telemetryRecords, scorecard, stackEvalSummary);
const driftState = compareWithBaseline(summaryMetrics, baselineSummary, policy.drift_thresholds);
const anomalyState = anomalySignals(summaryMetrics, policy.drift_thresholds);
const monitorDecision = rollbackDecision(scorecard, releaseDecision, summaryMetrics, driftState, anomalyState);

const driftReport = {
  artifact_version: policy.artifact_version,
  monitor_id: monitorId,
  generated_at: new Date().toISOString(),
  source_scorecard_path: rel(scorecardPath),
  source_release_decision_path: rel(releaseDecisionPath),
  source_stack_eval_summary_path: rel(stackEvalSummaryPath),
  baseline_monitor_id: baselineMonitorId,
  baseline_seeded: driftState.baseline_seeded,
  drift_verdict: driftState.drift_verdict,
  drift_signals: driftState.drift_signals,
  anomaly_signals: anomalyState,
  monitored_metrics: summaryMetrics
};

const rollbackEscalationDecision = {
  artifact_version: policy.artifact_version,
  decision_id: `${monitorId}-rollback-escalation`,
  generated_at: new Date().toISOString(),
  monitor_owner: monitorDecision.owner,
  decision: monitorDecision.decision,
  reason: monitorDecision.reason,
  linked_actions: policy.linked_actions[monitorDecision.decision] ?? [],
  linked_artifacts: {
    scorecard_path: rel(scorecardPath),
    release_decision_path: rel(releaseDecisionPath),
    stack_eval_summary_path: rel(stackEvalSummaryPath),
    drift_report_path: `prompt-stack/v34/harness/runs/${monitorId}/drift_report.json`,
    telemetry_summary_path: `prompt-stack/v34/harness/runs/${monitorId}/telemetry_summary.json`
  },
  thresholds_used: policy.drift_thresholds,
  next_actions: policy.linked_actions[monitorDecision.decision] ?? []
};

const productionMonitoredReady =
  releaseDecision.decision === "Approve" &&
  anomalyState.length === 0 &&
  monitorDecision.decision === "continue_monitoring" &&
  (summaryMetrics.trace_coverage_rate ?? 0) === 1 &&
  (summaryMetrics.stack_eval_monitor?.runner_failures ?? 1) === 0 &&
  summaryMetrics.stack_eval_monitor?.engine_policy_satisfied === true;

const summary = {
  artifact_version: policy.artifact_version,
  monitor_id: monitorId,
  generated_at: new Date().toISOString(),
  source_release_scorecard_id: scorecardId,
  source_stack_eval_run_id: stackEvalRunId,
  baseline_monitor_id: baselineMonitorId,
  telemetry_schema_path: rel(telemetrySchemaPath),
  telemetry_summary: summaryMetrics,
  required_field_coverage: fieldCoverage,
  drift_verdict: driftState.drift_verdict,
  anomaly_signals: anomalyState,
  rollback_escalation_decision: monitorDecision.decision,
  resulting_maturity_label: productionMonitoredReady ? "production-monitored" : "release-gated",
  production_monitored_ready: productionMonitoredReady
};

writeJson(path.join(outDir, "telemetry_summary.json"), {
  artifact_version: policy.artifact_version,
  monitor_id: monitorId,
  generated_at: summary.generated_at,
  source_release_scorecard_id: scorecardId,
  source_stack_eval_run_id: stackEvalRunId,
  telemetry_summary: summaryMetrics,
  required_field_coverage: fieldCoverage
});
writeJson(path.join(outDir, "drift_report.json"), driftReport);
writeJson(path.join(outDir, "rollback_escalation_decision.json"), rollbackEscalationDecision);
writeJson(path.join(outDir, "summary.json"), summary);

console.log(JSON.stringify({
  monitor_id: monitorId,
  telemetry_record_count: telemetryRecords.length,
  drift_verdict: driftState.drift_verdict,
  rollback_escalation_decision: monitorDecision.decision,
  resulting_maturity_label: summary.resulting_maturity_label,
  out_dir: outDir
}, null, 2));
