# Canary Matrix Summary Gate Report

Status: pass

Stage: v2.0.0-beta-canary-matrix-summary-and-local-readiness

- Can enter local no-tool canary: false
- Can enter provider diversity claim: false
- Can enter replay verification: false
- Reason: Local endpoint is not available; local canary remains blocked until explicitly configured.

## Checks

- pass: validate_alpha.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: compare_v36_baseline.mjs pass
- pass: check_openai_credentialed_canary.mjs pass
- pass: check_openai_structured_output_canary.mjs pass
- pass: check_openai_tool_calling_canary.mjs pass
- pass: canary_matrix_summary.json exists
- pass: local_readiness_blockers.json exists
- pass: local_readiness_report.json exists
- pass: claim_status_report.json exists
- pass: provider_execution_performed_in_this_stage is false
- pass: local_model_execution_performed_in_this_stage is false
- pass: local endpoint probe not performed
- pass: OpenAI canary matrix is canary_only
- pass: vLLM local canary blocked by missing endpoint
- pass: Ollama local canary blocked by missing endpoint
- pass: local blockers recorded
- pass: local execution claims absent
- pass: provider-diverse claim absent
- pass: v36 modified false by checksum comparison
