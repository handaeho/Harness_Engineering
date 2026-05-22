const STAGE = "v2.0.0-beta-structured-output-canary-openai";
const STACK_VERSION = "2.0.0-alpha";

export function createStructuredOutputTraceRecorder(runId) {
  let sequence = 0;
  const events = [];

  function record(eventType, payload = {}, providerExecution = true) {
    sequence += 1;
    const event = {
      run_id: runId,
      event_id: `${runId}-${String(sequence).padStart(4, "0")}`,
      event_type: eventType,
      stage: STAGE,
      stack_version: STACK_VERSION,
      adapter_id: "openai",
      provider: "openai",
      provider_execution: providerExecution,
      structured_output_used: true,
      tools_used: false,
      local_model_execution: false,
      external_side_effect: false,
      timestamp: `2026-05-21T02:00:${String(sequence).padStart(2, "0")}.000Z`,
      payload_redacted: true,
      payload
    };
    events.push(event);
    return event;
  }

  return { record, events };
}
