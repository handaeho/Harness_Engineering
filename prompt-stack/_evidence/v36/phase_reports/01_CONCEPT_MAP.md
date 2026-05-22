# 01 CONCEPT MAP

Generated: 2026-05-20T03:18:26.751Z

- Mapped Learn Harness Engineering patterns into Instructions, State, Verification, Scope, Lifecycle.
- v36_candidate treats harness as operating system assets, not a longer prompt.

## Instructions
Question: 에이전트가 무엇을 읽고 어떤 순서로 시작하는가?

Assets:
- AGENTS.md
- MASTER_PROMPT_ROUTER.md
- docs/OPERATING_GUIDE.md
- codex/CODEX_RUNTIME_GUIDE.md
- autonomous/00_governance

## State
Question: 대화 기록 없이 다음 세션이 현재 상태를 복구할 수 있는가?

Assets:
- state/feature_list.json
- state/progress.md
- state/decision_log.md
- state/session-handoff.md
- state/evidence_log.json

## Verification
Question: 완료 주장을 무엇으로 증명하는가?

Assets:
- verification/current_validation_suite.json
- verification/evaluator-rubric.md
- harness/validate_current_v36.mjs
- harness/run_benchmark.mjs

## Scope
Question: 한 번에 어디까지 작업하고 overreach를 어떻게 감지하는가?

Assets:
- autonomous/07_scope/SCOPE_POLICY.md
- state/feature_list.json
- verification/claim_strength_checklist.json

## Lifecycle
Question: 세션 시작과 종료, handoff가 표준화되어 있는가?

Assets:
- lifecycle/init.sh
- lifecycle/clean-state-checklist.md
- lifecycle/session-start.md
- lifecycle/session-closeout.md
- lifecycle/handoff-template.md
