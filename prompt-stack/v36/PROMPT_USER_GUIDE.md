# Current Package 사용자 가이드

이 문서는 `v36/` current stable package를 실제로 사용하는 방법만 설명한다.

## 어떤 자산을 사용할지 선택
- 완전 자율형 agent prompt stack이 필요하면 `autonomous/`를 사용한다.
- Codex 코딩 agent runtime이 필요하면 `codex/`를 사용한다.
- 상태 이어받기, 검증, 세션 종료 규칙이 필요하면 `state/`, `verification/`, `lifecycle/`를 함께 사용한다.

## Autonomous asset 사용
`autonomous/00_governance`부터 `autonomous/99_total`까지는 완전 자율형 agent용 source-of-truth와 조립 bundle이다. `99_total`은 autonomous 실행용 조립 자산이며 Codex runtime package가 아니다.

## Codex runtime 사용
Codex는 `codex/AGENTS.md`와 `codex/CODEX_RUNTIME_GUIDE.md`를 entrypoint로 사용한다. `codex/skills/*`는 Codex 실행 최적화 자산이며 autonomous stack의 복사본이나 mirror가 아니다.

## 상태와 검증
- 현재 작업 상태: `state/`
- 완료 판단 기준: `verification/`
- 세션 시작/종료: `lifecycle/`
- 실행 검증: `harness/`와 `validation/`

## 업데이트 규칙
active package 문서는 `v36/` 현재 상태만 설명한다. raw evidence는 `_evidence/v36/`에 보존한다. 금지된 과장 claim은 만들지 않는다. 운영 telemetry, containment proof, provider 다양성 검증은 현재 제한으로 유지한다.
