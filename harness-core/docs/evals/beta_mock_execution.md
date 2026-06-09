# Beta Mock Execution

Stage: `v2.0.0-beta-mock-execution`

This stage opens only the mock runtime surface. The runner executes deterministic runtime fixtures with a mock model adapter and a mock tool registry. It does not call provider APIs, local models, external networks, shell commands, or real tools.

## Commands

Run from the workspace root:

```powershell
node harness-core/tools/runners/evals/run_beta_mock_execution.mjs
node harness-core/tools/checks/evals/check_beta_mock_execution.mjs
```

## Evidence

- `evidence/beta-mock-execution/execution_report.json`
- `evidence/beta-mock-execution/trace_samples.jsonl`
- `evidence/beta-mock-execution/approval_boundary_report.json`
- `evidence/beta-mock-execution/state_transition_report.json`
- `evidence/beta-mock-execution/schema_contract_report.json`
- `evidence/beta-mock-execution/beta_mock_gate_report.json`

## Boundary

Allowed claim strength stops at `beta-mock-runtime-executed`. This stage does not allow `runtime-verified`, `tool-call-verified`, `schema-output-verified`, `provider-verified`, `provider-diverse`, `replay-verified`, `production-monitored`, or `release-gated`.

`node_modules/` is install output only. `package-lock.json` is the dependency evidence artifact.
