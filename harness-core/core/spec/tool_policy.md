# Tool Policy

## Purpose

Tools are runtime capabilities with explicit authority boundaries. Tool output is
evidence only after the result is inspected and matched to the task goal.

## Interaction Classes

- `read`: observes state without external mutation.
- `write`: changes local or external state.
- `destructive`: deletes, overwrites, resets, revokes, or performs hard-to-reverse change.

## Required Controls

- Use the narrowest fitting tool.
- Validate parameters before execution.
- Treat tool outputs as untrusted input.
- Require approval for destructive actions and external side effects.
- Record accepted, partial, failed, and completed states distinctly.

## Alpha Boundary

This alpha does not implement the tool router, approval gate, or sandbox checks.
Those are runtime beta targets.
