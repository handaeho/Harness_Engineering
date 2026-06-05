export function guardContainmentAction(route) {
  const blocked = route.should_block;
  const simulatedOnly = true;
  return {
    action: route.action,
    blocked,
    simulated: simulatedOnly,
    executed: false,
    provider_calls_performed: 0,
    local_model_calls_performed: 0,
    telemetry_sink_writes: 0,
    external_network_calls_performed: 0,
    shell_commands_executed: 0,
    real_file_writes_outside_allowed_paths: 0,
    real_tool_side_effects: 0,
    blocked_actions_executed: 0,
    raw_request_stored: false,
    raw_response_stored: false,
    secret_logged: false
  };
}
