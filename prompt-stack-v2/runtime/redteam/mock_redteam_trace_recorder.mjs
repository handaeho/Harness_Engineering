export function createTraceRecorder() {
  const events = [];

  function record(event) {
    events.push({
      execution_mode: "mock_runtime_dry_run",
      payload_redacted: true,
      raw_input_stored: false,
      provider_execution: false,
      local_model_execution: false,
      external_side_effects: false,
      ...event
    });
  }

  return {
    record,
    events,
    toJsonl() {
      return events.map((event) => JSON.stringify(event)).join("\n");
    }
  };
}
