const STAGE = "v2.0.0-beta-containment-boundary-mock-dry-run";
const EXECUTION_MODE = "mock_containment_dry_run";

export class MockContainmentTraceRecorder {
  constructor(runId) {
    this.runId = runId;
    this.events = [];
    this.sequence = 0;
  }

  record(eventType, testCase, payload = {}) {
    this.sequence += 1;
    const eventId = `${this.runId}-evt-${String(this.sequence).padStart(4, "0")}`;
    const boundary = testCase?.boundary || "run";
    const caseId = testCase?.case_id || "run";
    const event = {
      run_id: this.runId,
      event_id: eventId,
      event_type: eventType,
      stage: STAGE,
      execution_mode: EXECUTION_MODE,
      provider_execution: false,
      local_model_execution: false,
      external_side_effect: false,
      timestamp: "2026-05-22T00:00:00.000Z",
      payload_redacted: true,
      payload,
      trace_id: eventId,
      case_id: caseId,
      boundary,
      event_name: eventType,
      raw_payload_stored: false,
      secret_values_logged: false,
      external_side_effects: false,
      redaction_notes: [
        "payload stores only fixture metadata, boundary action class, and aggregate booleans"
      ]
    };
    this.events.push(event);
    return event;
  }
}
