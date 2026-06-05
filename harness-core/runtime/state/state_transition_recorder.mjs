export function createTransition(from_state, to_state, reason, details = {}) {
  return {
    from_state,
    to_state,
    reason,
    details
  };
}
