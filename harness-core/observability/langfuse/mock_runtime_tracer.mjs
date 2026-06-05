import { propagateAttributes, startActiveObservation, startObservation } from "@langfuse/tracing";
import { executeMockRun } from "../../runtime/orchestrator/execution_loop.mjs";
import {
  flushLangfuseTracing,
  getLangfuseRuntimeConfig,
  initializeLangfuseTracing,
  shutdownLangfuseTracing
} from "./instrumentation.mjs";

const DEFAULT_EVENT_LIMIT = 75;

function objectKeys(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
}

function safeInputKeys(input = {}) {
  return objectKeys(input).filter((key) => !/(prompt|messages|raw|body|secret|token|key|authorization)/i.test(key));
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { kind: payload === null ? "null" : typeof payload };
  }

  return {
    kind: Array.isArray(payload) ? "array" : "object",
    keys: objectKeys(payload),
    blocked: Boolean(payload.blocked),
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
    tool_name: typeof payload.tool_name === "string" ? payload.tool_name : undefined,
    response_id: typeof payload.response_id === "string" ? payload.response_id : undefined,
    output_kind: typeof payload.output_kind === "string" ? payload.output_kind : undefined,
    missing_required_inputs_count: Array.isArray(payload.missing_required_inputs)
      ? payload.missing_required_inputs.length
      : undefined
  };
}

export function summarizeRunRequest(runRequest) {
  const input = runRequest?.input || {};
  return {
    run_id: runRequest?.run_id || null,
    case_id: runRequest?.case_id || null,
    input_keys: safeInputKeys(input),
    mock_response_id: typeof input.mock_response_id === "string" ? input.mock_response_id : null,
    context_source_count: Array.isArray(input.context_sources) ? input.context_sources.length : 0,
    raw_prompt_included: false,
    raw_messages_included: false
  };
}

export function summarizeRunResult(result) {
  return {
    run_id: result?.run_id || null,
    status: result?.status || "unknown",
    stage: result?.stage || null,
    trace_events_total: Array.isArray(result?.trace_events) ? result.trace_events.length : 0,
    blocked_tools: result?.blocked_tools || [],
    executed_mock_tools: result?.executed_mock_tools || [],
    tool_outputs_total: Array.isArray(result?.tool_outputs) ? result.tool_outputs.length : 0,
    provider_execution: result?.provider_execution === true,
    local_model_execution: result?.local_model_execution === true,
    external_side_effects: result?.external_side_effects === true,
    final_output_kind: result?.final_output?.kind || null,
    raw_response_included: false
  };
}

export function summarizeTraceEvent(event) {
  return {
    run_id: event.run_id,
    event_id: event.event_id,
    event_type: event.event_type,
    stage: event.stage,
    adapter_id: event.adapter_id || null,
    provider: event.provider || null,
    provider_execution: event.provider_execution === true,
    local_model_execution: event.local_model_execution === true,
    external_side_effect: event.external_side_effect === true,
    payload_redacted: event.payload_redacted !== false,
    payload_summary: summarizePayload(event.payload)
  };
}

function buildTraceMetadata(runRequest, result = null) {
  return {
    application: "harness-core",
    runtime_surface: "mock_runtime",
    run_id: runRequest?.run_id || result?.run_id || null,
    case_id: runRequest?.case_id || null,
    provider: "mock",
    provider_execution: false,
    local_model_execution: false,
    external_side_effects: false,
    raw_payload_stored: false,
    raw_request_stored: false,
    raw_response_stored: false
  };
}

function buildPropagatedMetadata(runRequest, result = null) {
  const metadata = buildTraceMetadata(runRequest, result);
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)]));
}

async function recordEventObservations(result, limit) {
  const traceEvents = Array.isArray(result.trace_events) ? result.trace_events : [];
  const selectedEvents = traceEvents.slice(0, limit);

  for (const event of selectedEvents) {
    startObservation(
      `prompt-stack.event.${event.event_type}`,
      {
        input: summarizeTraceEvent(event),
        metadata: {
          event_id: event.event_id,
          event_type: event.event_type,
          stage: event.stage,
          payload_redacted: event.payload_redacted !== false
        }
      },
      { asType: "event" }
    );
  }

  return {
    emitted: selectedEvents.length,
    omitted_due_to_limit: Math.max(0, traceEvents.length - selectedEvents.length)
  };
}

export async function executeMockRunWithLangfuse(runRequest, options = {}) {
  const env = options.env || process.env;
  const tracing = options.tracing || initializeLangfuseTracing(env);

  if (!tracing.enabled) {
    const result = executeMockRun(runRequest);
    return {
      result,
      langfuse: {
        status: tracing.status,
        config: getLangfuseRuntimeConfig(env),
        trace_export_attempted: false,
        sink_write_performed: false,
        event_observations_emitted: 0
      }
    };
  }

  const eventLimit = Number.isInteger(options.eventLimit) ? options.eventLimit : DEFAULT_EVENT_LIMIT;
  let eventObservationSummary = { emitted: 0, omitted_due_to_limit: 0 };
  let rootTraceId = null;
  let rootObservationId = null;

  const result = await startActiveObservation(
    "prompt-stack.mock-run",
    async (rootObservation) => {
      rootTraceId = rootObservation.traceId;
      rootObservationId = rootObservation.id;
      rootObservation.update({
        input: summarizeRunRequest(runRequest),
        metadata: buildTraceMetadata(runRequest)
      });

      return propagateAttributes(
        {
          sessionId: runRequest.run_id,
          tags: ["harness-core", "mock-runtime"],
          metadata: buildPropagatedMetadata(runRequest)
        },
        async () => {
          const runResult = executeMockRun(runRequest);
          eventObservationSummary = await recordEventObservations(runResult, eventLimit);
          rootObservation.update({
            output: summarizeRunResult(runResult),
            metadata: buildTraceMetadata(runRequest, runResult)
          });
          return runResult;
        }
      );
    },
    { asType: "agent" }
  );

  if (options.shutdown === true) {
    await shutdownLangfuseTracing(tracing);
  } else if (options.flush !== false) {
    await flushLangfuseTracing(tracing);
  }

  return {
    result,
    langfuse: {
      status: "started",
      config: tracing.config,
      trace_export_attempted: true,
      sink_write_performed: true,
      trace_id: rootTraceId,
      root_observation_id: rootObservationId,
      event_observations_emitted: eventObservationSummary.emitted,
      event_observations_omitted_due_to_limit: eventObservationSummary.omitted_due_to_limit
    }
  };
}
