# Local Model Verified Final Handoff Gate

Status: pass

- Stage: v2.0.0-post-stable-local-model-verified-final-handoff-and-archive
- Scope: ollama_qwen3_local_lane
- Archive label: v2.0.0-post-stable+local-model-verified-ollama-qwen3-lane
- Can claim local-model-verified: true
- Can claim provider-diverse: false
- Can claim provider-verified: false
- Can claim adapter-checked: false
- Can enter stable release: false

## Checks

- pass: build_local_model_verified_final_handoff.mjs pass
- pass: generate_local_model_verified_archive_manifest.mjs recorded
- pass: compare_v36_baseline.mjs pass
- pass: scan_prohibited_claims.mjs pass
- pass: release/post_stable_local_model_verified_final_handoff_scope.yaml exists
- pass: release/post_stable_local_model_verified_final_claim_state.yaml exists
- pass: release/post_stable_local_model_verified_archive_manifest.yaml exists
- pass: release/post_stable_local_model_verified_next_options.yaml exists
- pass: release/post_stable_local_provider_strict_paths.yaml exists
- pass: tools/build_local_model_verified_final_handoff.mjs exists
- pass: tools/generate_local_model_verified_archive_manifest.mjs exists
- pass: tools/check_local_model_verified_final_handoff.mjs exists
- pass: evals/suites/post_stable_local_model_verified_final_handoff.yaml exists
- pass: evals/reports/local_model_verified_final_handoff_report.json exists
- pass: evals/reports/local_model_verified_final_handoff_report.md exists
- pass: evals/reports/local_model_verified_archive_report.json exists
- pass: evals/reports/local_model_verified_archive_report.md exists
- pass: evals/reports/local_model_verified_final_handoff_gate_report.json exists
- pass: evals/reports/local_model_verified_final_handoff_gate_report.md exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_handoff_report.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_final_claim_state.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_evidence_pointer_index.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_archive_manifest.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_archive_checksums.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_strict_paths.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_v36_baseline_status.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/local_model_verified_next_options.json exists
- pass: evidence/post-stable-local-model-verified-final-handoff/unresolved_items.json exists
- pass: docs/local_model_verified_final_handoff.ko.md exists
- pass: docs/local_model_verified_final_claim_state.ko.md exists
- pass: docs/local_model_verified_archive_manifest.ko.md exists
- pass: docs/local_model_verified_strict_paths.ko.md exists
- pass: docs/next_provider_diverse_path_plan.ko.md exists
- pass: docs/next_provider_verified_path_plan.ko.md exists
- pass: docs/next_adapter_checked_path_plan.ko.md exists
- pass: handoff report records local model verified only
- pass: final claim state preserves allowed and blocked claims
- pass: evidence pointer index includes required groups
- pass: archive manifest and checksums recorded
- pass: strict paths keep provider and adapter lanes blocked
- pass: v36 baseline status records pass without refresh
- pass: next options registry recorded
- pass: no unresolved handoff items remain
- pass: provider-diverse/provider-verified/adapter-checked/production-ready/stable/release-gated positive claims absent
- pass: protected v36 and dist paths clean
- pass: baseline state is prior owner-approved refresh only
