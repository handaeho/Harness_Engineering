# Final New Conversation Prompt

Project: HARNESS Core.
Canonical directory/slug: `harness-core`.

Continue from `v2.0.0-post-active-scoped-terminal-hardening-and-final-dossier-autopilot-until-hard-stop`.

Start by reading:

- `FINAL_HANDOFF.ko.md`
- `NAME_MIGRATION.md`
- `docs/workspace/reference_baseline_policy.ko.md`
- `evidence/post-active-scoped-final-release-dossier/final_release_dossier.json`
- `evidence/final-export-refresh-after-final-dossier/final_export_refresh_after_final_dossier_report.json`

Reference baseline integrity는 `node tools/checks/workspace/check_reference_baseline_integrity.mjs`로 확인하세요.

Bare `provider-verified` is open only by release-grade provider gate evidence. Do not claim bare `adapter-checked`, `production-ready`, `stable`, `release-gated`, or bare release-gated unless the corresponding release-grade gate has executed and passed.

Before any vLLM execution attempt, run `npm run check:release-grade-vllm-operator-packet` and `npm run preflight:vllm-operator-env`. After the attempt, run `npm run check:release-grade-vllm-evidence-package` and review `claim_promotion_readiness` plus `ordering_checks` in `evidence/release-grade-vllm-evidence-package/vllm_evidence_package_report.json` before discussing bare `adapter-checked` or stronger general claims. For the complete path, use `npm run vllm-release-grade-evidence-gate`.

Use `npm run check:release-grade-completion-audit` to audit the full HARNESS Core plus current prompt-stack package reinforcement state. Treat `status: hold` as incomplete but correctly gated, not as completion.

다음 중 무엇을 진행할지 물어봐 주세요.

1. vLLM execution for adapter-checked final gate
2. adapter-checked future completion
3. general release approval after adapter-checked final gate
4. 현재 final dossier/export를 최종본으로 보관
