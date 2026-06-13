# Release-grade Ollama Evidence Package

Status: pass

- Ollama adapter evidence complete: true
- Adapter-checked allowed by this package: true
- Production-ready allowed by general gate: true
- Stable allowed by general gate: true
- Release-gated allowed by general gate: true
- local-vllm-adapter-checked: deferred_until_version2
- Missing or incomplete artifacts: 0
- Stale or unordered artifacts: 0

## Full Command

```bash
npm run ollama-release-grade-evidence-gate
```

## Manual Command Sequence

1. `npm run check:release-grade-adapter-ollama`
2. `npm run run:release-grade-adapter-coverage`
3. `npm run check:release-grade-adapter-coverage`
4. `npm run run:release-grade-adapter-checked-final`
5. `npm run check:release-grade-adapter-checked-final`
6. `npm run general-release-grade-gate`
7. `npm run check:release-grade-ollama-evidence-package`
8. `npm run apply:release-grade-claim-state-sync`
9. `npm run check:release-grade-claim-state-sync`
10. `npm run general-release-grade-gate`
11. `npm run check:release-grade-ollama-evidence-package`
12. `npm run apply:release-grade-claim-state-sync`
13. `npm run check:release-grade-claim-state-sync`

## Submit These Files

- evidence/release-grade-adapter-ollama-preflight/release_grade_adapter_ollama_preflight_report.json
- evidence/post-stable-local-model-verification-final-gate/local_model_verification_final_gate_report.json
- evidence/post-stable-local-structured-output-smoke-canary/local_structured_output_smoke_report.json
- evidence/post-stable-local-tool-calling-mock-smoke-canary/local_tool_calling_mock_smoke_report.json
- evidence/post-stable-local-replay-regression-smoke/local_replay_regression_smoke_report.json
- evidence/post-stable-local-redaction-storage-cross-suite-audit/local_redaction_storage_audit_report.json
- evidence/post-stable-local-ollama-adapter-conformance/local_ollama_adapter_conformance_report.json
- evidence/post-stable-adapter-conformance-local-ollama-execution/adapter_conformance_local_ollama_execution_report.json
- evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json
- evals/reports/release_grade_adapter_coverage_completion_check_report.json
- evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json
- evals/reports/release_grade_adapter_checked_final_gate_check_report.json
- evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json
- evals/reports/release_grade_general_release_gate_check_report.json
- evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json
- evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json
- evidence/release-grade-ollama-evidence-package/ollama_evidence_package_report.json
