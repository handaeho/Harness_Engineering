# Beta Preflight Report

The beta-preflight stage makes beta entry conditions machine-readable.

Required reports:

- `evidence/beta-preflight/dependency_validation_report.json`
- `evidence/beta-preflight/adapter_dry_run_report.json`
- `evidence/beta-preflight/beta_entry_gate_report.json`
- `evidence/beta-preflight/unresolved_items.json`
- `evals/reports/adapter_conformance_dry_run.json`
- `evals/reports/beta_entry_report.json`

Beta execution remains blocked until explicitly approved by the operator, even
when the preflight gate passes.
