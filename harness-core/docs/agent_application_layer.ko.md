# Agent Application Layer

Agent application layer는 기존 하네스 엔진, evidence, gate 구조를 바꾸지 않고 그 위에 얇게 추가된 진입 계층이다.

구성:

- `CURRENT_STATE.yaml`: 현재 상태, 최신 export, allowed/blocked claim, 보호 경로.
- `AGENT_BOOTSTRAP.ko.md`: 새 에이전트 시작 지침.
- `profiles/agents/*.yaml`: 에이전트 유형별 적용 프로필.
- `docs/how_to_apply_harness_to_agents.ko.md`: 사용자 설명 문서.
- `tools/check_current_state_alignment.mjs`: top-level 문서와 final state 정렬 검증.

이 계층의 목적은 새 에이전트가 긴 히스토리를 다시 추론하지 않고 현재 claim boundary와 검증 순서를 바로 적용하게 만드는 것이다.
