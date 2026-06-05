import { routeContainmentCase } from "./mock_containment_case_router.mjs";
import { guardContainmentAction } from "./mock_containment_action_guard.mjs";
import { evaluateContainmentCase } from "./mock_containment_safety_oracle.mjs";
import { MockContainmentTraceRecorder } from "./mock_containment_trace_recorder.mjs";
import { toContainmentResult } from "./mock_containment_result_recorder.mjs";

export function executeMockContainmentRun(cases, options = {}) {
  const runId = options.runId || "containment-mock-run-2026-05-22";
  const recorder = new MockContainmentTraceRecorder(runId);
  const results = [];
  const counters = {
    blocked_actions_requested: 0,
    blocked_actions_executed: 0,
    external_network_calls_performed: 0,
    shell_commands_executed: 0,
    real_file_writes_outside_allowed_paths: 0,
    real_tool_side_effects: 0,
    provider_calls_performed: 0,
    local_model_calls_performed: 0,
    telemetry_sink_writes: 0,
    raw_request_stored: false,
    raw_response_stored: false,
    secret_logged: false
  };

  recorder.record("containment_dry_run_started", null, {
    cases_total: cases.length
  });

  for (const testCase of cases) {
    recorder.record("containment_case_loaded", testCase, {
      case_id: testCase.case_id,
      boundary: testCase.boundary,
      severity: testCase.severity
    });
    const route = routeContainmentCase(testCase);
    recorder.record("containment_case_routed", testCase, {
      action: route.action,
      should_block: route.should_block
    });
    const guardResult = guardContainmentAction(route);
    recorder.record("containment_boundary_checked", testCase, {
      action: guardResult.action,
      simulated: guardResult.simulated
    });
    recorder.record(guardResult.blocked ? "containment_action_blocked" : "containment_action_simulated", testCase, {
      action: guardResult.action,
      executed: guardResult.executed
    });

    counters.blocked_actions_executed += guardResult.blocked_actions_executed;
    counters.external_network_calls_performed += guardResult.external_network_calls_performed;
    counters.shell_commands_executed += guardResult.shell_commands_executed;
    counters.real_file_writes_outside_allowed_paths += guardResult.real_file_writes_outside_allowed_paths;
    counters.real_tool_side_effects += guardResult.real_tool_side_effects;
    counters.provider_calls_performed += guardResult.provider_calls_performed;
    counters.local_model_calls_performed += guardResult.local_model_calls_performed;
    counters.telemetry_sink_writes += guardResult.telemetry_sink_writes;
    counters.raw_request_stored = counters.raw_request_stored || guardResult.raw_request_stored;
    counters.raw_response_stored = counters.raw_response_stored || guardResult.raw_response_stored;
    counters.secret_logged = counters.secret_logged || guardResult.secret_logged;

    const oracleResult = evaluateContainmentCase(testCase, guardResult);
    const traceEvent = recorder.record("containment_result_recorded", testCase, {
      result: oracleResult.result,
      must_not_happen_observed_count: oracleResult.must_not_happen_observed.length
    });
    const result = toContainmentResult(testCase, oracleResult, traceEvent.trace_id);
    results.push(result);
    recorder.record("containment_trace_recorded", testCase, {
      result_trace_id: traceEvent.trace_id,
      payload_redacted: true
    });
  }

  recorder.record("containment_dry_run_completed", null, {
    cases_executed_mock: results.length,
    cases_failed: results.filter((result) => result.result === "fail").length
  });

  return {
    run_id: runId,
    results,
    trace_events: recorder.events,
    counters
  };
}
