import { buildContext } from "../context/context_builder.mjs";
import { callMockModel, recoverMockModelResponse } from "../mocks/mock_model_adapter.mjs";
import { assertMockSandbox } from "../sandbox/mock_sandbox.mjs";
import { createSessionState, recordStateTransition } from "../state/session_state.mjs";
import { checkApproval } from "../tools/approval_gate.mjs";
import { executeMockTool } from "../tools/mock_tool_registry.mjs";
import { reclassifyToolOutput, routeToolRequests } from "../tools/tool_router.mjs";
import { decideRecovery } from "./retry_policy.mjs";
import { selectRoute } from "./route_policy.mjs";

const STAGE = "v2.0.0-beta-mock-execution";
const STACK_VERSION = "2.0.0-alpha";

function traceFactory(runId) {
  let sequence = 0;
  return function makeTrace(eventType, payload = {}) {
    sequence += 1;
    return {
      run_id: runId,
      event_id: `${runId}-${String(sequence).padStart(4, "0")}`,
      event_type: eventType,
      stage: STAGE,
      stack_version: STACK_VERSION,
      timestamp: `2026-05-21T00:00:${String(sequence).padStart(2, "0")}.000Z`,
      adapter_id: "mock",
      provider_execution: false,
      local_model_execution: false,
      external_side_effect: false,
      payload
    };
  };
}

function recordTransition(sessionState, trace, events, toState, reason, details = {}) {
  const transition = recordStateTransition(sessionState, toState, reason, details);
  events.push(trace("state_transition_recorded", transition));
  return transition;
}

export function executeMockRun(runRequest) {
  assertMockSandbox();

  const runId = runRequest.run_id;
  const trace = traceFactory(runId);
  const traceEvents = [];
  const executedMockTools = [];
  const blockedTools = [];
  const toolOutputs = [];
  const sessionState = createSessionState(runId);

  traceEvents.push(trace("run_started", { case_id: runRequest.case_id || null }));
  recordTransition(sessionState, trace, traceEvents, "started", "run request accepted");

  const contextPacket = buildContext(runRequest);
  traceEvents.push(trace("context_built", contextPacket));

  if (contextPacket.missing_required_inputs.length) {
    recordTransition(sessionState, trace, traceEvents, "failed", "missing required input", {
      missing_required_inputs: contextPacket.missing_required_inputs
    });
    traceEvents.push(trace("run_failed", {
      reason: "missing_required_input",
      missing_required_inputs: contextPacket.missing_required_inputs
    }));
    return {
      run_id: runId,
      status: "failed",
      stage: STAGE,
      provider_execution: false,
      local_model_execution: false,
      external_side_effects: false,
      final_output: null,
      trace_events: traceEvents,
      blocked_tools: blockedTools,
      executed_mock_tools: executedMockTools,
      tool_outputs: toolOutputs,
      state_transitions: sessionState.transitions
    };
  }

  const route = selectRoute(runRequest, contextPacket);
  traceEvents.push(trace("route_selected", route));

  let modelResponse;
  try {
    modelResponse = callMockModel(runRequest, contextPacket);
    traceEvents.push(trace("mock_model_called", {
      response_id: modelResponse.response_id,
      tool_request_count: modelResponse.tool_requests.length
    }));
  } catch (error) {
    traceEvents.push(trace("mock_model_called", {
      response_id: runRequest.input?.mock_response_id || "unknown",
      error: error.message
    }));
    recordTransition(sessionState, trace, traceEvents, "failed", "mock model failure", { error: error.message });
    traceEvents.push(trace("run_failed", { reason: "mock_model_failure", error: error.message }));

    const recovery = decideRecovery(error, runRequest);
    if (!recovery.recovery_applied) {
      return {
        run_id: runId,
        status: "failed",
        stage: STAGE,
        provider_execution: false,
        local_model_execution: false,
        external_side_effects: false,
        final_output: null,
        trace_events: traceEvents,
        blocked_tools: blockedTools,
        executed_mock_tools: executedMockTools,
        tool_outputs: toolOutputs,
        state_transitions: sessionState.transitions
      };
    }

    modelResponse = recoverMockModelResponse(error);
    traceEvents.push(trace("recovery_applied", recovery));
    recordTransition(sessionState, trace, traceEvents, "recovered", "mock recovery applied", recovery);
  }

  const routedTools = routeToolRequests(modelResponse);
  for (const routed of routedTools) {
    traceEvents.push(trace("tool_requested", {
      tool_name: routed.tool_name,
      arguments: routed.arguments
    }));

    const approval = checkApproval(routed, routed.tool_definition);
    traceEvents.push(trace("approval_checked", approval));

    if (approval.blocked) {
      blockedTools.push(routed.tool_name);
      traceEvents.push(trace("tool_blocked", approval));
      continue;
    }

    const output = executeMockTool(routed.tool_name, routed.arguments);
    executedMockTools.push(routed.tool_name);
    traceEvents.push(trace("tool_executed_mock", {
      tool_name: routed.tool_name,
      output_kind: output.kind || "object"
    }));

    const untrustedOutput = reclassifyToolOutput(routed.tool_name, output);
    toolOutputs.push(untrustedOutput);
    traceEvents.push(trace("tool_output_reclassified_untrusted", untrustedOutput));
  }

  recordTransition(sessionState, trace, traceEvents, "completed", "mock run completed", {
    blocked_tools: blockedTools,
    executed_mock_tools: executedMockTools
  });
  traceEvents.push(trace("run_completed", {
    final_output_kind: modelResponse.final_output?.kind || "unknown",
    blocked_tools: blockedTools,
    executed_mock_tools: executedMockTools
  }));

  return {
    run_id: runId,
    status: "completed",
    stage: STAGE,
    provider_execution: false,
    local_model_execution: false,
    external_side_effects: false,
    final_output: modelResponse.final_output,
    trace_events: traceEvents,
    blocked_tools: blockedTools,
    executed_mock_tools: executedMockTools,
    tool_outputs: toolOutputs,
    state_transitions: sessionState.transitions
  };
}
