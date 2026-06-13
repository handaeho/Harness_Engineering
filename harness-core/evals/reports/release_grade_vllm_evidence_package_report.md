# Release-grade vLLM Evidence Package

Status: hold

- vLLM execution evidence complete: false
- Adapter-checked allowed by this package: false
- Missing or incomplete artifacts: 7
- Stale or unordered artifacts: 0
- General release allowed by general gate: false

## Required Environment

- VLLM_ENDPOINT_URL: required; Must be a localhost-only OpenAI-compatible base URL with no credentials, query, or hash.
- VLLM_MODEL: required; Must match the served model id exactly. Use ASCII quotes only.
- VLLM_AUTH_REQUIRED: required; Must be yes or no.
- VLLM_API_KEY: conditional; Set only when VLLM_AUTH_REQUIRED=yes. The value must never be stored in evidence.

## Full Command

```bash
npm run vllm-release-grade-evidence-gate
```

## Manual Command Sequence

1. `npm run preflight:vllm-operator-env`
2. `npm run preflight:vllm-live-canary`
3. `npm run canary:vllm-no-tool`
4. `npm run check:vllm-no-tool`
5. `npm run run:vllm-adapter-conformance`
6. `npm run check:vllm-adapter-conformance`
7. `npm run check:release-grade-adapter-vllm`
8. `npm run check:release-grade-vllm-evidence-package`
9. `npm run general-release-grade-gate`
10. `npm run check:release-grade-vllm-evidence-package`
11. `npm run apply:release-grade-claim-state-sync`
12. `npm run check:release-grade-claim-state-sync`
13. `npm run check:final-precommit-convergence`
14. `npm run general-release-grade-gate`
15. `npm run check:release-grade-vllm-evidence-package`
16. `npm run apply:release-grade-claim-state-sync`
17. `npm run check:release-grade-claim-state-sync`
18. `npm run check:final-precommit-convergence`

## Submit These Files

- evidence/release-grade-vllm-operator-env-guard/vllm_operator_env_guard_report.json
- evidence/post-stable-vllm-endpoint-readiness-preflight/local_endpoint_readiness_preflight_report.json
- evidence/post-stable-vllm-endpoint-readiness-preflight/endpoint_probe_summary.json
- evidence/post-stable-local-vllm-no-tool-canary/vllm_no_tool_canary_report.json
- evals/reports/vllm_no_tool_canary_check_report.json
- evidence/post-stable-vllm-adapter-conformance-local-execution/vllm_adapter_conformance_report.json
- evals/reports/vllm_adapter_conformance_check_report.json
- evidence/release-grade-adapter-coverage-completion/release_grade_adapter_coverage_completion_report.json
- evals/reports/release_grade_adapter_coverage_completion_check_report.json
- evidence/release-grade-adapter-vllm-preflight/release_grade_adapter_vllm_preflight_report.json
- evidence/release-grade-adapter-checked-final-gate/release_grade_adapter_checked_final_gate_report.json
- evals/reports/release_grade_adapter_checked_final_gate_check_report.json
- evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_report.json
- evidence/release-grade-claim-state-sync/release_grade_claim_state_sync_check_report.json
- evidence/release-grade-general-release-gate/release_grade_general_release_gate_report.json
- evals/reports/release_grade_general_release_gate_check_report.json
- evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json
