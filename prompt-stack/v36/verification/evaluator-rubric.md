# Evaluator Rubric

Metadata:
- asset_name: evaluator-rubric.md
- purpose: Release and harness-quality evaluation rubric.
- owner_layer: verification
- harness_subsystems: Verification
- claim_strength: current-local

## Scores
Each subsystem is scored 1 to 5.

| Score | Meaning |
|---:|---|
| 5 | operationally exercised with durable evidence |
| 4 | complete active asset, locally validated |
| 3 | partial asset or documentation-only support |
| 2 | weak or implicit support |
| 1 | missing or harmful |

## Claim Rules
- Trace captured is not evaluation passed.
- Runner exists is not replay verified.
- Sandbox exists is not containment verified.
- Local validation is not production monitoring.
- Draft or evidence packages are not the current stable active package.
