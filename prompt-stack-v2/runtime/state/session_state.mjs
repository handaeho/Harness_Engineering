import { createTransition } from "./state_transition_recorder.mjs";

export function createSessionState(runId) {
  return {
    run_id: runId,
    current_state: "initialized",
    transitions: []
  };
}

export function recordStateTransition(sessionState, toState, reason, details = {}) {
  const transition = createTransition(sessionState.current_state, toState, reason, details);
  sessionState.transitions.push(transition);
  sessionState.current_state = toState;
  return transition;
}
