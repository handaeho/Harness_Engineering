# Lecture-to-Asset Application Matrix

Generated: 2026-05-20T04:44:21.720Z

| Lecture | Subsystems | Applied Artifacts | Eval / Benchmark Cases | Priority |
|---|---|---|---|---|
| 유능한 에이전트가 여전히 실패하는 이유 | Verification, Scope | records/failure_to_artifact_map.json<br>records/harness_scorecard.json<br>verification/evaluator-rubric.md<br>verification/behavioral_benchmark_suite.json | BE-SHARED-006, BE-SHARED-007, BE-SHARED-010, BE-SHARED-028 | P3 |
| 하네스란 무엇인가 | Instructions, State, Verification, Scope, Lifecycle | docs/ARCHITECTURE.md<br>docs/OPERATING_GUIDE.md<br>records/concept_map.json<br>records/harness_subsystem_coverage.json | BE-AUTO-001, BE-AUTO-006, BE-SHARED-028 | P3 |
| 저장소가 시스템 오브 레코드(SoR)가 되어야 하는 이유 | State, Instructions | docs/ARTIFACT_MAP.md<br>state/decision_log.md<br>state/evidence_log.json<br>state/index.json | BE-SHARED-001, BE-SHARED-005, BE-SHARED-023 | P3 |
| 거대한 단일 지시 파일이 실패하는 이유 | Instructions | AGENTS.md<br>MASTER_PROMPT_ROUTER.md<br>docs/ARTIFACT_MAP.md<br>codex/CODEX_RUNTIME_GUIDE.md | BE-AUTO-011, BE-CODEX-008 | P3 |
| 장기 작업이 연속성을 잃는 이유 | State, Lifecycle | state/progress.md<br>state/session-handoff.md<br>state/feature_list.json<br>next_session_start.md | BE-AUTO-016, BE-SHARED-001, BE-SHARED-023 | P3 |
| 초기화가 별도 단계여야 하는 이유 | Lifecycle, Verification | lifecycle/init.sh<br>lifecycle/session-start.md<br>lifecycle/clean-state-checklist.md | BE-AUTO-010, BE-SHARED-016 | P3 |
| 에이전트가 과도하게 손대고 끝맺지 못하는 이유 | Scope | autonomous/07_scope/SCOPE_POLICY.md<br>state/feature_list.json<br>verification/behavioral_benchmark_suite.json | BE-AUTO-009, BE-SHARED-011, BE-SHARED-012 | P3 |
| 기능 목록이 하네스의 기본 단위인 이유 | State, Scope | state/feature_list.json<br>records/v36_asset_metadata_index.json<br>verification/behavioral_benchmark_suite.json | BE-SHARED-002, BE-SHARED-012 | P3 |
| 에이전트가 너무 일찍 완료를 선언하는 이유 | Verification | verification/evaluator-rubric.md<br>verification/claim_strength_checklist.json<br>records/behavioral_judge_results.json | BE-SHARED-006, BE-SHARED-007, BE-SHARED-020 | P3 |
| 엔드투엔드 테스트가 결과를 바꾸는 이유 | Verification | verification/benchmark_suite.json<br>verification/behavioral_benchmark_suite.json<br>harness/validate_current_v36.mjs | BE-SHARED-009, BE-SHARED-024 | P3 |
| 관측 가능성이 하네스 안에 있어야 하는 이유 | Verification, State | state/evidence_log.json<br>records/actor_output_validation_result.json<br>records/behavioral_judge_results.json<br>validation/current_validation_result.json | BE-SHARED-005, BE-SHARED-027 | P3 |
| 모든 세션이 클린 상태로 끝나야 하는 이유 | Lifecycle, State | lifecycle/clean-state-checklist.md<br>lifecycle/session-closeout.md<br>lifecycle/handoff-template.md<br>state/session-handoff.md | BE-SHARED-017, BE-SHARED-018, BE-SHARED-025 | P3 |
