# Current Package Reliability

Current package reliability는 상태 연속성, 검증 runner, lifecycle handoff, evidence 보존으로 관리한다.

## Reliability surfaces
- 상태 연속성: `state/`
- 검증 결과: `validation/current_validation_result.json`
- 완료 기준: `verification/evaluator-rubric.md`
- 세션 종료: `lifecycle/session-closeout.md`
- evidence 보존: `_evidence/v36/`

## 운영 주의
runner 실행 성공은 task 성공과 다르다. 검증 결과와 claim strength를 항상 분리해서 기록한다.
