export function decideRecovery(error, runRequest) {
  if (runRequest.input?.mock_response_id === "mock_failure_recoverable") {
    return {
      recovery_applied: true,
      recovery_id: "mock-recovery-static-response",
      reason: error?.message || "mock recoverable failure"
    };
  }

  return {
    recovery_applied: false,
    recovery_id: null,
    reason: error?.message || "unrecoverable mock failure"
  };
}
