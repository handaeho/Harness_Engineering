# Context Policy

## Purpose

Context must be the smallest package that lets the agent act correctly without
dragging unrelated history or stale records into the active decision.

## Required Separation

- Active source files are separate from evidence files.
- Current explicit instructions outrank older state.
- Repo-local records outrank memory when the task depends on package status.
- External facts that may have changed require fresh verification.
- Generated artifacts must not become source-of-truth.

## Required Context Fields

- Goal.
- Solved condition.
- Scope boundary.
- Risk boundary.
- Current checkpoint.
- Missing critical input.
- Verification state.
- Next safest action.

## Alpha Boundary

This policy is design-level. Runtime context builder implementation is deferred.
