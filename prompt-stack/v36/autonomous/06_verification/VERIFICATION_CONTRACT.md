# Verification Contract

Metadata:
- asset_name: VERIFICATION_CONTRACT.md
- purpose: Autonomous-agent verification contract.
- owner_layer: autonomous_agent_assets
- harness_subsystems: Verification
- claim_strength: candidate-local

## 1. Purpose

This contract defines what an autonomous agent must verify before claiming completion, readiness, replay success, or release-grade behavior in the active package.

Verification must be tied to executable or inspectable evidence. Trace captured, runner exists, source cloned, and docs present are weaker than evaluation passed.

## 2. Verification Sources

Use the narrowest source that can support the claim:

- `harness/validate_current.mjs` for active package structure and JSON sanity
- `harness/validate_assembled_bundle.mjs` for autonomous `99_total` parity
- `harness/validate_codex_runtime.mjs` for Codex runtime boundary checks
- `harness/run_smoke_validation.mjs` for the available smoke validation sequence
- `verification/current_validation_result.json` and `validation/current_validation_result.json` for latest local validation output
- `verification/benchmark_suite.json` and `verification/behavioral_benchmark_suite.json` for benchmark scenario coverage
- `verification/claim_strength_checklist.json` for claim-strength downgrades
- `records/final_validation_record.json` only as historical release evidence, not as proof for new changes

## 3. Required Verification Packet

Before finalizing work, preserve:

- `verification_goal`
- `commands_or_checks_run`
- `result_status`
- `changed_artifacts`
- `evidence_paths`
- `failed_checks`
- `skipped_checks`
- `limitations`
- `claim_strength_allowed`
- `next_safest_validation`

## 4. Claim Strength Ladder

Use the weakest accurate claim:

- `plausible`
  - reasoning only; no executable evidence
- `locally-checked`
  - local artifact, schema, lint, test, or script check passed
- `runner-executed`
  - a runner executed the relevant path
- `replay-verified`
  - replay was rerun with scenario and verdict linkage
- `integration-verified`
  - integrated path was exercised
- `release-gated`
  - explicit threshold, owner, and gate passed
- `production-monitored`
  - live telemetry and response path are connected

## 5. Downgrade Rules

- If validation was not run, say so.
- If validation failed, do not claim completion unless the requested artifact was a failure report.
- If only static document review occurred, do not claim runner execution.
- If a runner exists but was not executed, do not claim harness-executed.
- If a trace exists but no verdict exists, do not claim evaluation passed.
- If a benchmark suite exists but was not run, do not claim benchmark-backed behavior.
- If current files changed after historical release records, do not reuse old release evidence as new proof.

## 6. Freshness Rules

- Treat validation outputs as current only when they were generated after the relevant edits.
- If the validation timestamp is older than the changed files, mark it stale.
- If current validation rewrites result files, include those result files in the changed-artifact list.
- Distinguish document parity from behavior verification.

## 7. Failure Handling

When verification fails:

1. Record the failing command or check.
2. Classify the failure as `artifact`, `schema`, `runner`, `state`, `scope`, `lifecycle`, `environment`, or `claim`.
3. Fix the smallest invalid unit.
4. Rerun the relevant check.
5. If the failure is out of scope, preserve a limitation and next action instead of widening silently.

## 8. Anti-Patterns

- treating source coverage as execution proof
- treating old release records as proof for new edits
- treating JSON parse success as semantic behavior validation
- treating `99_total` parity as runtime correctness
- ignoring failed checks because unrelated checks passed
- strengthening final language beyond the actual evidence surface
