# Failure Modes

## Classes

- `artifact`: required file missing, misplaced, stale, or malformed.
- `schema`: JSON Schema or YAML structure invalid.
- `adapter`: provider/runtime mapping unsupported or unverified.
- `runner`: validation runner missing, failed, or not executed.
- `state`: baseline, evidence, or migration status inconsistent.
- `scope`: work changes the legacy reference source, dist, or future provider surfaces out of alpha scope.
- `claim`: output language exceeds available evidence.
- `security`: prompt injection, data leakage, tool poisoning, or approval bypass risk.
- `observability`: missing run identifiers, trace fields, or evidence linkage.

## Recovery

Fix the smallest invalid unit, rerun the narrowest relevant static check, and
downgrade the claim if evidence remains partial.
