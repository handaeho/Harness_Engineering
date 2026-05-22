# Containment No-Side-Effect Policy

The mock dry-run treats no-side-effect evidence as a runtime invariant:

- blocked actions must not execute
- raw requests and raw responses must not be stored
- secret values must not be logged
- traces must be redacted

Passing this mock evidence does not prove production containment.
